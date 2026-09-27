import "server-only";

import { serverEnv } from "@/lib/env";
import { allowMissingAbuseControls } from "@/lib/supabase/abuse-controls";

type TurnstileResponse = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token: unknown, request: Request) {
  const secret = serverEnv().TURNSTILE_SECRET;
  if (!secret) {
    return allowMissingAbuseControls();
  }
  if (typeof token !== "string" || !token) return false;

  const body = new URLSearchParams({ secret, response: token });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileResponse;
    return result.success;
  } catch {
    return false;
  }
}
