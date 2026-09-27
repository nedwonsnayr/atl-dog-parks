import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeWrite, safeApiError } from "@/lib/supabase/api";
import { createClient } from "@/lib/supabase/server";

const ReviewId = z.uuid();
const ReviewUpdate = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
  turnstileToken: z.string().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const id = ReviewId.safeParse((await context.params).id);
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = null;
  }
  const input = ReviewUpdate.safeParse(json);
  if (!id.success || !input.success) {
    return NextResponse.json({ error: "Check the review fields." }, { status: 400 });
  }

  const authorization = await authorizeWrite(request, input.data.turnstileToken);
  if ("response" in authorization) return authorization.response;
  const supabase = await createClient();
  if (!supabase) return safeApiError(503);

  const { data, error } = await supabase
    .from("reviews")
    .update({
      rating: input.data.rating,
      body: input.data.body,
      status: "pending",
    })
    .eq("id", id.data)
    .eq("user_id", authorization.user.id)
    .select("id, status")
    .maybeSingle();
  if (error) return safeApiError();
  if (!data) return safeApiError(404);
  return NextResponse.json({ review: data });
}

export async function DELETE(request: Request, context: Context) {
  const id = ReviewId.safeParse((await context.params).id);
  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    // DELETE requests may omit a body in local development.
  }
  const token = z.object({ turnstileToken: z.string().optional() }).safeParse(json);
  if (!id.success || !token.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const authorization = await authorizeWrite(request, token.data.turnstileToken);
  if ("response" in authorization) return authorization.response;
  const supabase = await createClient();
  if (!supabase) return safeApiError(503);

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id.data)
    .eq("user_id", authorization.user.id);
  if (error) return safeApiError();
  return new NextResponse(null, { status: 204 });
}
