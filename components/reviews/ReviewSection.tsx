"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { ReviewSectionProps } from "@/components/contracts";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/browser";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  displayName: string;
};

export default function ReviewSection({ parkSlug }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Review | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [challengeKey, setChallengeKey] = useState(0);

  const loadReviews = useCallback(async () => {
    const response = await fetch(`/api/reviews?parkSlug=${encodeURIComponent(parkSlug)}`);
    if (!response.ok) return;
    const result = (await response.json()) as { reviews: Review[] };
    setReviews(result.reviews);
  }, [parkSlug]);

  useEffect(() => {
    void fetch(`/api/reviews?parkSlug=${encodeURIComponent(parkSlug)}`)
      .then((response) => (response.ok ? response.json() : { reviews: [] }))
      .then((result: { reviews: Review[] }) => setReviews(result.reviews));
    const supabase = createClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setVerified(Boolean(data.user?.email_confirmed_at));
    });
  }, [parkSlug]);

  function resetChallenge() {
    setTurnstileToken(undefined);
    setChallengeKey((key) => key + 1);
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      parkSlug,
      rating: Number(form.get("rating")),
      body: String(form.get("body") ?? ""),
      turnstileToken,
    };
    const response = await fetch(editing ? `/api/reviews/${editing.id}` : "/api/reviews", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(
      response.ok ? "Review submitted for moderation." : result.error || "Unable to submit.",
    );
    if (response.ok) {
      setEditing(null);
      event.currentTarget.reset();
      await loadReviews();
    }
    resetChallenge();
  }

  async function deleteReview(id: string) {
    const response = await fetch(`/api/reviews/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ turnstileToken }),
    });
    setMessage(response.ok ? "Review deleted." : "Unable to delete the review.");
    if (response.ok) await loadReviews();
    resetChallenge();
  }

  return (
    <section data-testid="review-section" data-park-slug={parkSlug} className="space-y-4">
      <h2 className="text-lg font-semibold">Reviews</h2>
      <div className="space-y-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            data-testid="review-item"
            data-review-id={review.id}
            className="rounded border p-3"
          >
            <p className="font-medium">
              {review.displayName} · {review.rating}/5
            </p>
            <p>{review.body}</p>
            {review.status !== "approved" && (
              <p className="text-xs text-zinc-500">Status: {review.status}</p>
            )}
            {review.user_id === userId && (
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setEditing(review)} className="underline">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteReview(review.id)}
                  className="text-red-700 underline"
                >
                  Delete
                </button>
              </div>
            )}
          </article>
        ))}
        {!reviews.length && <p className="text-sm text-zinc-500">No reviews yet.</p>}
      </div>

      {!userId && (
        <p data-testid="review-sign-in-prompt">
          <a href="/auth" className="underline">
            Sign in to write a review
          </a>
        </p>
      )}
      {userId && !verified && <p>Verify your email before writing a review.</p>}
      {verified && (
        <form data-testid="review-form" onSubmit={submitReview} className="space-y-3">
          <label className="block">
            Rating
            <select
              name="rating"
              data-testid="review-rating"
              defaultValue={editing?.rating ?? 5}
              key={editing?.id ?? "new"}
              className="ml-2 rounded border p-1"
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating}>{rating}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Review
            <textarea
              name="body"
              data-testid="review-body"
              defaultValue={editing?.body ?? ""}
              key={editing?.id ?? "new-body"}
              minLength={10}
              maxLength={2000}
              required
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
          <button data-testid="review-submit" className="rounded border px-4 py-2">
            {editing ? "Update review" : "Submit review"}
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="ml-2 underline">
              Cancel
            </button>
          )}
        </form>
      )}
      {message && (
        <p
          data-testid={
            message.includes("moderation") || message.includes("deleted")
              ? "form-success"
              : "form-error"
          }
        >
          {message}
        </p>
      )}
    </section>
  );
}
