"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdSlot from "@/components/ads/AdSlot";
import ParkMap from "@/components/map/ParkMap";
import { DEFAULT_FILTERS, filterParks, serializeFilters, type ParkFilters } from "@/lib/filters";
import { sortByDistance, type LatLng } from "@/lib/geo";
import type { Neighborhood } from "@/lib/parks";
import type { Park } from "@/lib/schema";
import Filters from "./Filters";
import NearMeButton from "./NearMeButton";
import ParkList, { type ParkListItem } from "./ParkList";

const toggleClass =
  "min-h-10 rounded-lg px-3.5 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-600";

export default function ParkExplorer({
  parks,
  neighborhoods,
  initialFilters,
  hideNeighborhoodFilter = false,
}: {
  parks: Park[];
  neighborhoods: Neighborhood[];
  initialFilters: ParkFilters;
  hideNeighborhoodFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState(initialFilters);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const [isNavigating, startTransition] = useTransition();

  const updateFilters = (nextFilters: ParkFilters) => {
    setFilters(nextFilters);
    const query = serializeFilters(nextFilters);
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  };

  const visibleParks = useMemo<ParkListItem[]>(() => {
    const filtered = filterParks(parks, filters);
    if (filters.sort === "distance" && userLocation) {
      return sortByDistance(filtered, userLocation);
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [filters, parks, userLocation]);

  const clearFilters = () => {
    setUserLocation(null);
    updateFilters({
      ...DEFAULT_FILTERS,
      view: filters.view,
      neighborhood: hideNeighborhoodFilter ? undefined : DEFAULT_FILTERS.neighborhood,
    });
  };

  const handleLocate = (location: LatLng) => {
    setUserLocation(location);
    updateFilters({ ...filters, sort: "distance" });
  };

  const setView = (view: ParkFilters["view"]) => updateFilters({ ...filters, view });

  return (
    <div className="space-y-6">
      <Filters
        filters={filters}
        neighborhoods={neighborhoods}
        onChange={updateFilters}
        onClear={clearFilters}
        hideNeighborhood={hideNeighborhoodFilter}
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p
            data-testid="result-count"
            aria-live="polite"
            className="font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {visibleParks.length} {visibleParks.length === 1 ? "park" : "parks"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {userLocation
              ? "Distance is calculated only in your browser."
              : "Use your location to see the closest parks first."}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <NearMeButton
            onLocate={handleLocate}
            active={Boolean(userLocation && filters.sort === "distance")}
          />
          <div
            className="flex rounded-xl border border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="Park view"
          >
            <button
              type="button"
              data-testid="view-toggle-list"
              aria-pressed={filters.view === "list"}
              onClick={() => setView("list")}
              className={`${toggleClass} ${
                filters.view === "list"
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
              }`}
            >
              List
            </button>
            <button
              type="button"
              data-testid="view-toggle-map"
              aria-pressed={filters.view === "map"}
              onClick={() => setView("map")}
              className={`${toggleClass} ${
                filters.view === "map"
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
              }`}
            >
              Map
            </button>
          </div>
        </div>
      </div>

      <div className={isNavigating ? "opacity-80 transition-opacity" : "transition-opacity"}>
        {visibleParks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-950">
              🐾
            </div>
            <h2 className="text-lg font-bold">No parks match those filters</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Try removing an amenity, searching a broader area, or showing both free and paid
              parks.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Reset filters
            </button>
          </div>
        ) : filters.view === "map" ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <ParkMap
              parks={visibleParks}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
              userLocation={userLocation}
              className="min-h-[32rem] w-full border-0"
            />
            <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
              Prefer not to use the map? The list view contains the same parks and details.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <ParkList parks={visibleParks} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
            <AdSlot slot="list-inline" />
          </div>
        )}
      </div>
    </div>
  );
}
