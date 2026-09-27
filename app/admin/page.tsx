import { notFound, redirect } from "next/navigation";

import { moderate } from "@/app/admin/actions";
import { getAuthenticatedUser, requireAdmin } from "@/lib/supabase/auth";

function ModerationButtons({ table, id }: { table: "reviews" | "submissions"; id: string }) {
  return (
    <div className="flex gap-2">
      {(["approved", "rejected"] as const).map((status) => (
        <form action={moderate} key={status}>
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <button className="rounded border px-3 py-1 capitalize">{status}</button>
        </form>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  if (!(await getAuthenticatedUser())) redirect("/auth");
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [{ data: reviews }, { data: submissions }] = await Promise.all([
    admin.supabase
      .from("reviews")
      .select("id, park_slug, rating, body, created_at")
      .eq("status", "pending")
      .order("created_at"),
    admin.supabase
      .from("submissions")
      .select("id, park_slug, payload, created_at")
      .eq("status", "pending")
      .order("created_at"),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-bold">Moderation queue</h1>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Reviews</h2>
        {reviews?.map((review) => (
          <article key={review.id} className="space-y-2 rounded border p-4">
            <p className="font-medium">
              {review.park_slug} · {review.rating}/5
            </p>
            <p>{review.body}</p>
            <ModerationButtons table="reviews" id={review.id} />
          </article>
        ))}
        {!reviews?.length && <p>No pending reviews.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Submissions</h2>
        {submissions?.map((submission) => (
          <article key={submission.id} className="space-y-2 rounded border p-4">
            <p className="font-medium">{submission.park_slug ?? "New park"}</p>
            <pre className="overflow-auto whitespace-pre-wrap text-sm">
              {JSON.stringify(submission.payload, null, 2)}
            </pre>
            <ModerationButtons table="submissions" id={submission.id} />
          </article>
        ))}
        {!submissions?.length && <p>No pending submissions.</p>}
      </section>
    </main>
  );
}
