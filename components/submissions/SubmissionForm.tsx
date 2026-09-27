"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useState, type FormEvent } from "react";

import type { SubmissionFormProps } from "@/components/contracts";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/browser";

export default function SubmissionForm({ parkSlug }: SubmissionFormProps) {
  const [verified, setVerified] = useState<boolean | null>(() => (createClient() ? null : false));
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [challengeKey, setChallengeKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setVerified(Boolean(data.user?.email_confirmed_at));
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        parkSlug,
        payload: {
          kind: parkSlug ? "correction" : "new-park",
          parkName: String(form.get("parkName") ?? ""),
          details: String(form.get("details") ?? ""),
        },
        turnstileToken,
      }),
    });
    const result = (await response.json()) as { error?: string };
    setSuccess(response.ok);
    setMessage(
      response.ok ? "Submission received for moderation." : result.error || "Unable to submit.",
    );
    if (response.ok) event.currentTarget.reset();
    setTurnstileToken(undefined);
    setChallengeKey((key) => key + 1);
  }

  if (verified === null) {
    return (
      <div data-testid="submission-auth-loading" data-park-slug={parkSlug} role="status">
        Loading…
      </div>
    );
  }

  if (!verified) {
    return (
      <div data-testid="submission-sign-in-prompt" data-park-slug={parkSlug}>
        <a href="/auth" className="underline">
          Sign in with a verified email to submit changes.
        </a>
      </div>
    );
  }

  return (
    <form
      data-testid="submission-form"
      data-park-slug={parkSlug}
      onSubmit={submit}
      className="space-y-3"
    >
      <h2 className="font-semibold">{parkSlug ? "Suggest a correction" : "Suggest a new park"}</h2>
      {!parkSlug && (
        <label className="block">
          Park name
          <input
            name="parkName"
            required
            maxLength={100}
            className="mt-1 block w-full rounded border p-2"
          />
        </label>
      )}
      <label className="block">
        Details
        <textarea
          name="details"
          required
          minLength={10}
          maxLength={5000}
          className="mt-1 block w-full rounded border p-2"
        />
      </label>
      {publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Turnstile
          key={challengeKey}
          siteKey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
        />
      )}
      <button data-testid="submission-submit" className="rounded border px-4 py-2">
        Send for review
      </button>
      {message && <p data-testid={success ? "form-success" : "form-error"}>{message}</p>}
    </form>
  );
}
