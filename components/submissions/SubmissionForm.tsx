import type { SubmissionFormProps } from "@/components/contracts";

export default function SubmissionForm({ parkSlug }: SubmissionFormProps) {
  return (
    <div data-testid="submission-form" data-park-slug={parkSlug} className="text-sm text-zinc-500">
      {parkSlug ? "Suggest a correction" : "Suggest a new park"}
    </div>
  );
}
