import type { Metadata } from "next";
import Link from "next/link";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  title: "Park not found",
  description: "This dog park is not in the ATL Dog Parks directory.",
});

export default function ParkNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-950">
        🐾
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight">Park not found</h1>
      <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">
        This listing may have moved or is not published yet. Browse the current parks to find
        another place to play.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        Browse all parks
      </Link>
    </div>
  );
}
