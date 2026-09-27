import { redirect } from "next/navigation";

import AuthForm from "@/app/auth/AuthForm";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

export default async function AuthPage() {
  if (await getAuthenticatedUser()) redirect("/account");

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p>Use a magic link or your Google account.</p>
      <AuthForm />
    </main>
  );
}
