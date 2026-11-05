import type { Metadata } from "next";
import SubmissionForm from "@/components/submissions/SubmissionForm";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Suggest a dog park",
  description:
    "Suggest a missing dog park or dog-friendly business inside I-285. Suggestions are reviewed before they are published.",
  pathname: "/submit",
});

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          Community submissions
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Suggest a dog park</h1>
        <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
          Know a dog park or dog-friendly park business inside I-285 that is missing? Sign in with a
          verified email and send the details for moderation.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <SubmissionForm />
      </section>
    </div>
  );
}
