import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ParkExplorer from "@/components/park/ParkExplorer";
import { parseFilters, type SearchParamsInput } from "@/lib/filters";
import { getNeighborhoods, getParksByNeighborhood } from "@/lib/parks";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export function generateStaticParams() {
  return getNeighborhoods().map((neighborhood) => ({ slug: neighborhood.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = getNeighborhoods().find((item) => item.slug === slug);
  if (!neighborhood) return { title: "Neighborhood not found" };

  const description = `Compare dog parks in ${neighborhood.name}, Atlanta, including amenities, hours, fees, directions, and last-verified details.`;
  return {
    title: `Dog parks in ${neighborhood.name}`,
    description,
    alternates: { canonical: `/neighborhoods/${slug}` },
    openGraph: {
      title: `Dog parks in ${neighborhood.name}`,
      description,
      type: "website",
      url: `/neighborhoods/${slug}`,
    },
  };
}

export default async function NeighborhoodPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const neighborhoods = getNeighborhoods();
  const neighborhood = neighborhoods.find((item) => item.slug === slug);
  if (!neighborhood) notFound();

  const parks = getParksByNeighborhood(slug);
  const parsedFilters = parseFilters(await searchParams);
  const initialFilters = { ...parsedFilters, neighborhood: undefined };

  return (
    <div className="space-y-8 pb-8">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/neighborhoods" className="hover:text-emerald-700 hover:underline">
          Neighborhoods
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{neighborhood.name}</span>
      </nav>

      <header className="relative isolate overflow-hidden rounded-3xl bg-zinc-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.38),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.2),transparent_45%)]"
        />
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">
          Atlanta neighborhood guide
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Dog parks in {neighborhood.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          Compare {neighborhood.count === 1 ? "the local dog park" : "local dog parks"} by
          amenities, access, and cost. Listings are sourced from public records and official park
          websites.
        </p>
      </header>

      <ParkExplorer
        parks={parks}
        neighborhoods={neighborhoods}
        initialFilters={initialFilters}
        hideNeighborhoodFilter
      />

      <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">Explore another neighborhood</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {neighborhoods
            .filter((item) => item.slug !== slug)
            .map((item) => (
              <Link
                key={item.slug}
                href={`/neighborhoods/${item.slug}`}
                data-testid="neighborhood-link"
                data-neighborhood-slug={item.slug}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold hover:border-emerald-500 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:text-emerald-300"
              >
                {item.name}
              </Link>
            ))}
        </div>
      </aside>
    </div>
  );
}
