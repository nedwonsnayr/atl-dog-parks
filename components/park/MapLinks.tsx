import { appleMapsUrl, googleMapsUrl } from "@/lib/mapLinks";
import type { Park } from "@/lib/schema";

const linkClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-emerald-500 dark:hover:text-emerald-300";

export default function MapLinks({ park }: { park: Park }) {
  return (
    <div className="flex flex-wrap gap-3" aria-label="Open directions">
      <a
        href={googleMapsUrl(park)}
        data-testid="map-link-google"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        Google Maps
        <span className="ml-1.5" aria-hidden="true">
          ↗
        </span>
      </a>
      <a
        href={appleMapsUrl(park)}
        data-testid="map-link-apple"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        Apple Maps
        <span className="ml-1.5" aria-hidden="true">
          ↗
        </span>
      </a>
    </div>
  );
}
