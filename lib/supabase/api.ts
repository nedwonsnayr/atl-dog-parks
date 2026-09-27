import "server-only";

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { checkWriteRateLimit } from "@/lib/supabase/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { verifyTurnstile } from "@/lib/supabase/turnstile";

type WriteAuthorization = { user: User } | { response: NextResponse<{ error: string }> };

export async function authorizeWrite(
  request: Request,
  turnstileToken: unknown,
): Promise<WriteAuthorization> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (!user.email_confirmed_at) {
    return {
      response: NextResponse.json({ error: "A verified email is required." }, { status: 403 }),
    };
  }

  const rate = await checkWriteRateLimit(request, user.id);
  if (!rate.allowed) {
    return {
      response: NextResponse.json({ error: rate.error }, { status: rate.status }),
    };
  }
  if (!(await verifyTurnstile(turnstileToken, request))) {
    return {
      response: NextResponse.json({ error: "Human verification failed." }, { status: 400 }),
    };
  }
  return { user };
}

export function safeApiError(status = 500) {
  return NextResponse.json({ error: "Unable to complete the request." }, { status });
}
