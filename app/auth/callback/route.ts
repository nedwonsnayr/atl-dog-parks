import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/account";

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=missing-code", request.url));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/auth?error=not-configured", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/auth?error=callback" : next, request.url));
}
