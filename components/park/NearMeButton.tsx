"use client";

import { useState } from "react";
import type { LatLng } from "@/lib/geo";

export default function NearMeButton({
  onLocate,
  active,
}: {
  onLocate: (location: LatLng) => void;
  active: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const locate = () => {
    setError(undefined);
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }

    setPending(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPending(false);
        onLocate({ lat: coords.latitude, lng: coords.longitude });
      },
      (locationError) => {
        setPending(false);
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Location access was denied. Enable it in your browser to sort nearby parks."
            : "We could not determine your location. Try again in a moment.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        data-testid="near-me-button"
        onClick={locate}
        disabled={pending}
        aria-pressed={active}
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${
          active
            ? "bg-emerald-700 text-white hover:bg-emerald-800"
            : "border border-zinc-300 bg-white text-zinc-800 hover:border-emerald-500 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="size-4"
        >
          <circle cx="12" cy="12" r="3" strokeWidth="2" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {pending ? "Finding you…" : active ? "Sorted near you" : "Near me"}
      </button>
      {error && (
        <p
          data-testid="near-me-error"
          role="alert"
          className="mt-2 max-w-sm text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
