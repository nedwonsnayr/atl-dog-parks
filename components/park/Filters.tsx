"use client";

import { BOOLEAN_AMENITIES, PARK_TYPES, type BooleanAmenity, type ParkType } from "@/lib/schema";
import type { Neighborhood } from "@/lib/parks";
import type { ParkFilters } from "@/lib/filters";

const typeLabels: Record<ParkType, string> = {
  public: "Public",
  business: "Businesses",
  "hoa/private": "Private",
};

const amenityLabels: Record<BooleanAmenity, string> = {
  fenced: "Fenced",
  offLeash: "Off leash",
  smallDogArea: "Small-dog area",
  water: "Water",
  shade: "Shade",
  lighting: "Lighting",
  parking: "Parking",
  restrooms: "Restrooms",
};

const checkboxClass =
  "size-4 rounded border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-600";

export default function Filters({
  filters,
  neighborhoods,
  onChange,
  onClear,
  hideNeighborhood = false,
}: {
  filters: ParkFilters;
  neighborhoods: Neighborhood[];
  onChange: (filters: ParkFilters) => void;
  onClear: () => void;
  hideNeighborhood?: boolean;
}) {
  const toggleType = (type: ParkType) =>
    onChange({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter((value) => value !== type)
        : [...filters.types, type],
    });

  const toggleAmenity = (amenity: BooleanAmenity) =>
    onChange({
      ...filters,
      amenities: filters.amenities.includes(amenity)
        ? filters.amenities.filter((value) => value !== amenity)
        : [...filters.amenities, amenity],
    });

  return (
    <div
      data-testid="filters"
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_1fr]">
        <div>
          <label
            htmlFor="park-search"
            className="mb-2 block text-sm font-semibold text-zinc-800 dark:text-zinc-100"
          >
            Search parks and neighborhoods
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="park-search"
              data-testid="search-input"
              type="search"
              value={filters.q ?? ""}
              onChange={(event) => onChange({ ...filters, q: event.target.value || undefined })}
              placeholder="Try “shade” or “Midtown”"
              className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-base outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-emerald-950"
            />
          </div>
        </div>

        {!hideNeighborhood && (
          <div>
            <label
              htmlFor="neighborhood-filter"
              className="mb-2 block text-sm font-semibold text-zinc-800 dark:text-zinc-100"
            >
              Neighborhood
            </label>
            <select
              id="neighborhood-filter"
              data-testid="filter-neighborhood"
              value={filters.neighborhood ?? ""}
              onChange={(event) =>
                onChange({ ...filters, neighborhood: event.target.value || undefined })
              }
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-emerald-950"
            >
              <option value="">All neighborhoods</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood.slug} value={neighborhood.slug}>
                  {neighborhood.name} ({neighborhood.count})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-5 border-t border-zinc-100 pt-5 dark:border-zinc-800 md:grid-cols-[0.8fr_1.5fr_auto]">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Park type
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {PARK_TYPES.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  data-testid={`filter-type-${type.replace("/", "-")}`}
                  checked={filters.types.includes(type)}
                  onChange={() => toggleType(type)}
                  className={checkboxClass}
                />
                {typeLabels[type]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Amenities
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {BOOLEAN_AMENITIES.map((amenity) => (
              <label key={amenity} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  data-testid={`filter-amenity-${amenity}`}
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className={checkboxClass}
                />
                {amenityLabels[amenity]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-end justify-between gap-4 md:flex-col md:items-stretch">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              data-testid="filter-free"
              checked={filters.freeOnly}
              onChange={(event) => onChange({ ...filters, freeOnly: event.target.checked })}
              className={checkboxClass}
            />
            Free only
          </label>
          <button
            type="button"
            data-testid="filters-clear"
            onClick={onClear}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-zinc-300 dark:hover:text-white"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}
