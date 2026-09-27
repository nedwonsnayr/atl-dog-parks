import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteAccount, signOut, updateDisplayName } from "@/app/account/actions";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/auth");

  const supabase = await createClient();
  const { data: profile } = await supabase!
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-zinc-600">{user.email}</p>
      </div>

      <form action={updateDisplayName} className="space-y-2">
        <label className="block">
          <span className="text-sm font-medium">Public display name</span>
          <input
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            minLength={2}
            maxLength={50}
            required
            className="mt-1 block w-full rounded border p-2"
          />
        </label>
        <button className="rounded border px-4 py-2">Save display name</button>
      </form>

      {profile?.role === "admin" && (
        <Link href="/admin" className="underline">
          Open moderation queue
        </Link>
      )}

      <form action={signOut}>
        <button className="rounded border px-4 py-2">Sign out</button>
      </form>

      <section className="space-y-2 border-t pt-6">
        <h2 className="font-semibold">Delete account</h2>
        <p className="text-sm text-zinc-600">
          Permanently deletes your profile, reviews, and submissions.
        </p>
        <form action={deleteAccount}>
          <button data-testid="account-delete" className="rounded bg-red-700 px-4 py-2 text-white">
            Delete my account
          </button>
        </form>
      </section>
    </main>
  );
}
