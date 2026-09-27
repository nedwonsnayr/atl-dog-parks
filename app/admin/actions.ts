"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/supabase/auth";

const ModerationInput = z.object({
  table: z.enum(["reviews", "submissions"]),
  id: z.uuid(),
  status: z.enum(["approved", "rejected"]),
});

export async function moderate(formData: FormData) {
  const input = ModerationInput.safeParse(Object.fromEntries(formData));
  if (!input.success) return;
  const admin = await requireAdmin();
  if (!admin) return;

  await admin.supabase
    .from(input.data.table)
    .update({ status: input.data.status })
    .eq("id", input.data.id);
  revalidatePath("/admin");
}
