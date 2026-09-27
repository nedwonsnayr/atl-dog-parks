import type { ReviewSectionProps } from "@/components/contracts";

export default function ReviewSection({ parkSlug }: ReviewSectionProps) {
  return (
    <section data-testid="review-section" data-park-slug={parkSlug} className="space-y-2">
      <h2 className="text-lg font-semibold">Reviews</h2>
      <p className="text-sm text-zinc-500">No reviews yet.</p>
    </section>
  );
}
