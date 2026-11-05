import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthForm from "@/app/auth/AuthForm";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  title: "Sign in",
  description: "Sign in to review a dog park or suggest a listing on ATL Dog Parks.",
});

export default async function AuthPage() {
  if (await getAuthenticatedUser()) redirect("/account");

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p>Use a magic link or your Google account.</p>
      <AuthForm />
    </div>
  );
}
