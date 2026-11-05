import type { Metadata } from "next";
import Link from "next/link";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  title: "Neighborhood not found",
  description: "This neighborhood is not in the ATL Dog Parks directory.",
});

export default function NeighborhoodNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-sky-100 text-3xl dark:bg-sky-950">
        📍
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight">Neighborhood not found</h1>
      <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">
        That neighborhood does not have a published park guide yet.
      </p>
      <Link
        href="/neighborhoods"
        className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        Browse neighborhoods
      </Link>
    </div>
  );
}
