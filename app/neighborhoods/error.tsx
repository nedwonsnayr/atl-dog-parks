"use client";

export default function NeighborhoodsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100 text-3xl dark:bg-red-950">
        !
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight">Neighborhoods could not be loaded</h1>
      <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">
        Park data is temporarily unavailable. Try loading this page again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
