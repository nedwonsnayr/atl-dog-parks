import type { Metadata } from "next";
import Link from "next/link";
import ParkExplorer from "@/components/park/ParkExplorer";
import { parseFilters, type SearchParamsInput } from "@/lib/filters";
import { getAllParks, getNeighborhoods } from "@/lib/parks";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const [parks, neighborhoods, filters] = [
    getAllParks(),
    getNeighborhoods(),
    parseFilters(await searchParams),
  ];

  return (
    <div className="space-y-10 pb-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-zinc-950 px-6 py-12 text-white shadow-xl sm:px-10 sm:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.35),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.22),transparent_42%)]"
        />
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
          Atlanta, inside I-285
        </p>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          Find a better place for your dog to run.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
          Compare fenced areas, shade, water, fees, and more across dog parks inside the Perimeter.
          Every listing shows when its details were last checked.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-inset ring-white/15">
            {parks.length} verified listings
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-inset ring-white/15">
            Public parks + dog-friendly businesses
          </span>
        </div>
      </section>

      <section aria-labelledby="explore-heading" className="space-y-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Explore
          </p>
          <h2 id="explore-heading" className="mt-1 text-3xl font-bold tracking-tight">
            Dog parks around Atlanta
          </h2>
        </div>
        <ParkExplorer parks={parks} neighborhoods={neighborhoods} initialFilters={filters} />
      </section>

      <section
        aria-labelledby="neighborhood-heading"
        className="rounded-3xl bg-emerald-950 px-6 py-8 text-white sm:px-8"
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">
              Browse locally
            </p>
            <h2 id="neighborhood-heading" className="mt-1 text-2xl font-bold">
              Parks by neighborhood
            </h2>
          </div>
          <Link
            href="/neighborhoods"
            className="text-sm font-semibold text-emerald-200 underline-offset-4 hover:underline"
          >
            View all neighborhoods →
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((neighborhood) => (
            <Link
              key={neighborhood.slug}
              href={`/neighborhoods/${neighborhood.slug}`}
              data-testid="neighborhood-link"
              data-neighborhood-slug={neighborhood.slug}
              className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <span className="font-semibold">{neighborhood.name}</span>
              <span className="text-sm text-emerald-200">{neighborhood.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
