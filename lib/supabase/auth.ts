import "server-only";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function getVerifiedUser(): Promise<User | null> {
  const user = await getAuthenticatedUser();
  return user?.email_confirmed_at ? user : null;
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase!.from("profiles").select("role").eq("id", user.id).maybeSingle();

  return data?.role === "admin" ? { user, supabase: supabase! } : null;
}
