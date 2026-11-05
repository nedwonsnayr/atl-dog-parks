import Link from "next/link";
import type { Park } from "@/lib/schema";
import { visibleAddress } from "@/lib/seo";
import { toSlug } from "@/lib/slug";
import AmenityBadges from "./AmenityBadges";

const typeLabels: Record<Park["type"], string> = {
  public: "Public park",
  business: "Dog park business",
  "hoa/private": "Private park",
};

export default function ParkCard({
  park,
  distanceMiles,
  selected = false,
  onSelect,
}: {
  park: Park;
  distanceMiles?: number;
  selected?: boolean;
  onSelect?: (slug: string) => void;
}) {
  return (
    <article
      data-testid="park-card"
      data-park-slug={park.slug}
      data-selected={selected || undefined}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950 ${
        selected
          ? "border-2 border-emerald-600 dark:border-emerald-400"
          : "border border-zinc-200 hover:border-emerald-300 dark:border-zinc-800 dark:hover:border-emerald-700"
      }`}
    >
      <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span>{typeLabels[park.type]}</span>
            <span aria-hidden="true">•</span>
            <span>{park.fees.free ? "Free" : "Paid entry"}</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
            <Link
              href={`/parks/${park.slug}`}
              onFocus={() => onSelect?.(park.slug)}
              onPointerEnter={() => onSelect?.(park.slug)}
              className="rounded-sm outline-none after:absolute focus-visible:ring-2 focus-visible:ring-emerald-600 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
            >
              {park.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <Link
              href={`/neighborhoods/${toSlug(park.neighborhood)}`}
              data-testid="park-neighborhood-link"
              className="rounded-sm hover:text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:text-emerald-300"
            >
              {park.neighborhood}
            </Link>
            <span aria-hidden="true"> · </span>
            {park.city}
          </p>
          <address className="mt-1 text-sm not-italic leading-6 text-zinc-600 dark:text-zinc-300">
            {visibleAddress(park)}
          </address>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {park.description}
        </p>

        <AmenityBadges amenities={park.amenities} compact />

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">{park.hours ?? "Hours vary"}</span>
          {distanceMiles !== undefined ? (
            <span
              data-testid="park-distance"
              className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-300"
            >
              {distanceMiles < 0.1 ? "< 0.1" : distanceMiles.toFixed(1)} mi
            </span>
          ) : (
            <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-300">
              View details →
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
