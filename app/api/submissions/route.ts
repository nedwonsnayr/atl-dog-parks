import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeWrite, safeApiError } from "@/lib/supabase/api";
import { createClient } from "@/lib/supabase/server";

const ParkSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const NewSubmission = z
  .object({
    parkSlug: ParkSlug.optional(),
    payload: z.record(z.string(), z.unknown()),
    turnstileToken: z.string().optional(),
  })
  .refine((value) => JSON.stringify(value.payload).length <= 10_000);

export async function GET(request: Request) {
  const requestedPark = new URL(request.url).searchParams.get("parkSlug");
  const parkSlug = requestedPark ? ParkSlug.safeParse(requestedPark) : null;
  if (parkSlug && !parkSlug.success) {
    return NextResponse.json({ error: "Invalid park." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ submissions: [], configured: false });
  let query = supabase
    .from("submissions")
    .select("id, park_slug, payload, status, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (parkSlug?.success) query = query.eq("park_slug", parkSlug.data);

  const { data, error } = await query;
  if (error) return safeApiError();
  return NextResponse.json({ submissions: data ?? [], configured: true });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = NewSubmission.safeParse(json);
  if (!input.success) {
    return NextResponse.json({ error: "Check the submission fields." }, { status: 400 });
  }

  const authorization = await authorizeWrite(request, input.data.turnstileToken);
  if ("response" in authorization) return authorization.response;
  const supabase = await createClient();
  if (!supabase) return safeApiError(503);

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      user_id: authorization.user.id,
      park_slug: input.data.parkSlug ?? null,
      payload: input.data.payload,
      status: "pending",
    })
    .select("id, status")
    .single();
  if (error) return safeApiError();
  return NextResponse.json({ submission: data }, { status: 201 });
}
