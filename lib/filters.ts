import {
  BOOLEAN_AMENITIES,
  PARK_TYPES,
  type BooleanAmenity,
  type Park,
  type ParkType,
} from "@/lib/schema";
import { toSlug } from "@/lib/slug";

export const SORT_OPTIONS = ["name", "distance"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const VIEW_OPTIONS = ["list", "map"] as const;
export type ViewOption = (typeof VIEW_OPTIONS)[number];

/**
 * Filter state, persisted in URL search params so filtered views are shareable.
 * Empty arrays / undefined mean "no constraint". The user's location is never
 * part of this state; distance sorting happens client-side.
 */
export type ParkFilters = {
  q?: string;
  types: ParkType[];
  amenities: BooleanAmenity[];
  neighborhood?: string;
  freeOnly: boolean;
  sort: SortOption;
  view: ViewOption;
};

export const DEFAULT_FILTERS: ParkFilters = {
  types: [],
  amenities: [],
  freeOnly: false,
  sort: "name",
  view: "list",
};

/** Search param keys, in serialization order. */
export const FILTER_PARAMS = {
  q: "q",
  types: "type",
  amenities: "amenity",
  neighborhood: "hood",
  freeOnly: "free",
  sort: "sort",
  view: "view",
} as const;

export type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function readAll(params: SearchParamsInput, key: string): string[] {
  const values =
    params instanceof URLSearchParams ? params.getAll(key) : [params[key] ?? []].flat();
  return values
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

function pickAllowed<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return [...new Set(values)].filter((v): v is T => (allowed as readonly string[]).includes(v));
}

/** Tolerant of repeated keys and comma-separated values; drops unknown values. */
export function parseFilters(params: SearchParamsInput): ParkFilters {
  const q = readAll(params, FILTER_PARAMS.q).join(" ").trim();
  const [neighborhood] = readAll(params, FILTER_PARAMS.neighborhood);
  const [sort] = pickAllowed(readAll(params, FILTER_PARAMS.sort), SORT_OPTIONS);
  const [view] = pickAllowed(readAll(params, FILTER_PARAMS.view), VIEW_OPTIONS);
  const free = readAll(params, FILTER_PARAMS.freeOnly)[0];

  return {
    q: q || undefined,
    types: pickAllowed(readAll(params, FILTER_PARAMS.types), PARK_TYPES),
    amenities: pickAllowed(readAll(params, FILTER_PARAMS.amenities), BOOLEAN_AMENITIES),
    neighborhood: neighborhood ? toSlug(neighborhood) : undefined,
    freeOnly: free === "1" || free === "true",
    sort: sort ?? DEFAULT_FILTERS.sort,
    view: view ?? DEFAULT_FILTERS.view,
  };
}

/** Returns a query string without the leading "?"; default values are omitted. */
export function serializeFilters(filters: Partial<ParkFilters>): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set(FILTER_PARAMS.q, filters.q.trim());
  if (filters.types?.length) params.set(FILTER_PARAMS.types, filters.types.join(","));
  if (filters.amenities?.length) {
    params.set(FILTER_PARAMS.amenities, filters.amenities.join(","));
  }
  if (filters.neighborhood) params.set(FILTER_PARAMS.neighborhood, filters.neighborhood);
  if (filters.freeOnly) params.set(FILTER_PARAMS.freeOnly, "1");
  if (filters.sort && filters.sort !== DEFAULT_FILTERS.sort) {
    params.set(FILTER_PARAMS.sort, filters.sort);
  }
  if (filters.view && filters.view !== DEFAULT_FILTERS.view) {
    params.set(FILTER_PARAMS.view, filters.view);
  }
  return params.toString();
}

/**
 * Applies every constraint except `sort` and `view`. Amenity filters match only
 * parks where the amenity is confirmed true (unknown does not match).
 */
export function filterParks(parks: readonly Park[], filters: ParkFilters): Park[] {
  const terms = filters.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return parks.filter((park) => {
    if (filters.types.length && !filters.types.includes(park.type)) return false;
    if (filters.neighborhood && toSlug(park.neighborhood) !== filters.neighborhood) {
      return false;
    }
    if (filters.freeOnly && !park.fees.free) return false;
    if (filters.amenities.some((a) => park.amenities[a] !== true)) return false;
    if (terms.length) {
      const haystack = [park.name, park.neighborhood, park.city, park.address, park.description]
        .join(" ")
        .toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}
