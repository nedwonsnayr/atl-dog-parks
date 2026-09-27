import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeWrite, safeApiError } from "@/lib/supabase/api";
import { createClient } from "@/lib/supabase/server";

const ParkSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const NewReview = z.object({
  parkSlug: ParkSlug,
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
  turnstileToken: z.string().optional(),
});

export async function GET(request: Request) {
  const parkSlug = ParkSlug.safeParse(new URL(request.url).searchParams.get("parkSlug"));
  if (!parkSlug.success) {
    return NextResponse.json({ error: "A valid park is required." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ reviews: [], configured: false });

  const { data, error } = await supabase
    .from("reviews")
    .select("id, park_slug, user_id, rating, body, status, created_at, updated_at")
    .eq("park_slug", parkSlug.data)
    .order("created_at", { ascending: false });
  if (error) return safeApiError();

  const userIds = [...new Set((data ?? []).map((review) => review.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));

  return NextResponse.json({
    reviews: (data ?? []).map((review) => ({
      ...review,
      displayName: names.get(review.user_id) || "Dog park visitor",
    })),
    configured: true,
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = NewReview.safeParse(json);
  if (!input.success) {
    return NextResponse.json({ error: "Check the review fields." }, { status: 400 });
  }

  const authorization = await authorizeWrite(request, input.data.turnstileToken);
  if ("response" in authorization) return authorization.response;
  const supabase = await createClient();
  if (!supabase) return safeApiError(503);

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      park_slug: input.data.parkSlug,
      user_id: authorization.user.id,
      rating: input.data.rating,
      body: input.data.body,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error?.code === "23505") {
    return NextResponse.json({ error: "You already reviewed this park." }, { status: 409 });
  }
  if (error) return safeApiError();
  return NextResponse.json({ review: data }, { status: 201 });
}
