"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const DisplayName = z.string().trim().min(2).max(50);

export async function updateDisplayName(formData: FormData) {
  const user = await getAuthenticatedUser();
  const displayName = DisplayName.safeParse(formData.get("displayName"));
  if (!user || !displayName.success) return;

  const supabase = await createClient();
  await supabase!.from("profiles").update({ display_name: displayName.data }).eq("id", user.id);
  revalidatePath("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function deleteAccount() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/auth");

  const admin = createAdminClient();
  if (!admin) return;
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return;

  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
