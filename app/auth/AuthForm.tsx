"use client";

import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/browser";

export default function AuthForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function magicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createClient();
    if (!supabase) {
      setMessage("Sign-in is not configured.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMessage(error ? "Unable to send a sign-in link." : "Check your email for the sign-in link.");
    setBusy(false);
  }

  async function googleSignIn() {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Sign-in is not configured.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage("Unable to start Google sign-in.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form data-testid="sign-in-form" onSubmit={magicLink} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 block w-full rounded border p-2"
          />
        </label>
        <button disabled={busy} className="rounded bg-zinc-900 px-4 py-2 text-white">
          Email me a magic link
        </button>
      </form>
      <button
        type="button"
        data-testid="sign-in-google"
        disabled={busy}
        onClick={googleSignIn}
        className="rounded border px-4 py-2"
      >
        Continue with Google
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
