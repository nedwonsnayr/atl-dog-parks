"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env";

let client: SupabaseClient | null;

export function createClient(): SupabaseClient | null {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  client ??= createBrowserClient(url, key);
  return client;
}
