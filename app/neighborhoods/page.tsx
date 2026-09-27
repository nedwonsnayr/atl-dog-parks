import type { Metadata } from "next";
import Link from "next/link";
import { getNeighborhoods } from "@/lib/parks";

export const metadata: Metadata = {
  title: "Neighborhoods",
  description: "Browse Atlanta dog parks by neighborhood, all inside the Perimeter.",
  alternates: { canonical: "/neighborhoods" },
};

export default function NeighborhoodsPage() {
  const neighborhoods = getNeighborhoods();

  return (
    <div className="space-y-8 pb-8">
      <header className="rounded-3xl bg-zinc-950 px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">
          Explore Atlanta
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Dog parks by neighborhood
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          Find off-leash areas close to home, or discover a new corner of Atlanta with your dog.
        </p>
      </header>

      {neighborhoods.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((neighborhood) => (
            <Link
              key={neighborhood.slug}
              href={`/neighborhoods/${neighborhood.slug}`}
              data-testid="neighborhood-link"
              data-neighborhood-slug={neighborhood.slug}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {neighborhood.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {neighborhood.count} {neighborhood.count === 1 ? "park" : "parks"}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="text-xl text-emerald-600 transition group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
          <h2 className="text-xl font-bold">No neighborhoods yet</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            Published park neighborhoods will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
