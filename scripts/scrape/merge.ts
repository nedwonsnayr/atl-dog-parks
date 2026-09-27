import type { Park } from "@/lib/schema";

import type { FieldChange, ParkDiff, ScrapedPark, SourceName } from "./types";
import { distanceMeters, MATCH_DISTANCE_METERS, normalizeName, slugify } from "./utils";

interface MergeResult {
  parks: Park[];
  diffs: ParkDiff[];
  added: number;
  updated: number;
  flagged: number;
  unchanged: number;
}

interface MatchedPark {
  park: Park;
  match: "id" | "name-coordinates";
  distanceMeters?: number;
}

export function mergeParks(
  existing: readonly Park[],
  candidates: readonly ScrapedPark[],
  successfulSources: ReadonlySet<SourceName>,
  asOf: string,
): MergeResult {
  const parks = existing.map((park) => structuredClone(park));
  const occupiedSlugs = new Set(parks.map((park) => park.slug));
  const diffsBySlug = new Map<string, ParkDiff>();
  let added = 0;
  let unchanged = 0;

  for (const candidate of [...candidates].sort(compareCandidates)) {
    const matched = findMatch(parks, candidate);
    if (!matched) {
      const park = createDraft(candidate, asOf, occupiedSlugs);
      parks.push(park);
      occupiedSlugs.add(park.slug);
      added += 1;
      diffsBySlug.set(park.slug, {
        slug: park.slug,
        match: "new",
        changes: [{ field: "$park", before: null, after: park }],
      });
      continue;
    }

    const changes = applyCandidate(matched.park, candidate, asOf);
    if (changes.length === 0) {
      unchanged += 1;
      continue;
    }
    const previous = diffsBySlug.get(matched.park.slug);
    diffsBySlug.set(matched.park.slug, {
      slug: matched.park.slug,
      match: previous?.match ?? matched.match,
      distanceMeters: previous?.distanceMeters ?? matched.distanceMeters,
      changes: mergeChanges(previous?.changes ?? [], changes),
    });
  }

  let flagged = 0;
  for (const park of parks) {
    if (
      park.status !== "flagged" &&
      !isOverridden(park, "status") &&
      hasDisappeared(park, candidates, successfulSources)
    ) {
      const before = park.status;
      park.status = "flagged";
      flagged += 1;
      diffsBySlug.set(park.slug, {
        slug: park.slug,
        match: "disappeared",
        changes: [{ field: "status", before, after: "flagged" }],
      });
    }
  }

  const diffs = [...diffsBySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    parks: parks.sort((a, b) => a.slug.localeCompare(b.slug)),
    diffs,
    added,
    updated: diffs.filter((diff) => diff.match !== "new" && diff.match !== "disappeared").length,
    flagged,
    unchanged,
  };
}

export function findMatch(parks: readonly Park[], candidate: ScrapedPark): MatchedPark | null {
  const idMatch = parks.find(
    (park) =>
      (candidate.osmId !== undefined && park.osmId === candidate.osmId) ||
      (candidate.googlePlaceId !== undefined && park.googlePlaceId === candidate.googlePlaceId) ||
      park.sources.some((source) => source.url === candidate.sourceRecordUrl),
  );
  if (idMatch) return { park: idMatch, match: "id" };

  const normalized = normalizeName(candidate.name);
  const coordinateMatches = parks
    .filter((park) => normalizeName(park.name) === normalized)
    .map((park) => ({ park, distanceMeters: distanceMeters(park, candidate) }))
    .filter((match) => match.distanceMeters <= MATCH_DISTANCE_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters || a.park.slug.localeCompare(b.park.slug));
  const closest = coordinateMatches[0];
  return closest ? { ...closest, match: "name-coordinates" } : null;
}

function applyCandidate(park: Park, candidate: ScrapedPark, asOf: string): FieldChange[] {
  const changes: FieldChange[] = [];
  setField(park, "name", candidate.name, changes);
  setField(park, "lat", candidate.lat, changes);
  setField(park, "lng", candidate.lng, changes);
  setField(park, "osmId", candidate.osmId, changes);
  setField(park, "googlePlaceId", candidate.googlePlaceId, changes);
  setField(park, "address", candidate.address, changes);
  setField(park, "neighborhood", candidate.neighborhood, changes);
  setField(park, "city", candidate.city, changes);
  setField(park, "county", candidate.county, changes);
  setField(park, "website", candidate.website, changes);
  setField(park, "hours", candidate.hours, changes);

  if (candidate.amenities) {
    for (const [name, value] of Object.entries(candidate.amenities)) {
      if (value === undefined) continue;
      const path = `amenities.${name}`;
      if (isOverridden(park, path)) continue;
      const amenities = park.amenities as unknown as Record<string, unknown>;
      if (!deepEqual(amenities[name], value)) {
        changes.push({ field: path, before: amenities[name], after: value });
        amenities[name] = value;
      }
    }
  }

  if (!isOverridden(park, "sources")) {
    const mergedSources = [...park.sources];
    for (const source of candidate.sources) {
      const index = mergedSources.findIndex((existing) => existing.url === source.url);
      if (index >= 0) mergedSources[index] = source;
      else mergedSources.push(source);
    }
    mergedSources.sort((a, b) => a.url.localeCompare(b.url));
    recordChange(park, "sources", mergedSources, changes);
  }

  if (changes.length > 0) {
    setField(park, "lastVerified", asOf, changes);
  }
  return changes;
}

function createDraft(
  candidate: ScrapedPark,
  asOf: string,
  occupiedSlugs: ReadonlySet<string>,
): Park {
  const baseSlug = slugify(candidate.name) || "unnamed-dog-park";
  let slug = baseSlug;
  let suffix = 2;
  while (occupiedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return {
    slug,
    name: candidate.name,
    type: "public",
    status: "draft",
    description: `Draft record imported from ${candidate.sources[0]?.label ?? candidate.source}; details require human verification before publication.`,
    address: candidate.address ?? "Address pending verification",
    lat: candidate.lat,
    lng: candidate.lng,
    neighborhood: candidate.neighborhood ?? "Needs review",
    city: candidate.city ?? "Atlanta",
    county: candidate.county ?? inferCounty(candidate.lng),
    ...(candidate.osmId ? { osmId: candidate.osmId } : {}),
    ...(candidate.googlePlaceId ? { googlePlaceId: candidate.googlePlaceId } : {}),
    ...(candidate.website ? { website: candidate.website } : {}),
    amenities: {
      fenced: candidate.amenities?.fenced ?? null,
      offLeash: candidate.amenities?.offLeash ?? true,
      smallDogArea: candidate.amenities?.smallDogArea ?? null,
      water: candidate.amenities?.water ?? null,
      shade: candidate.amenities?.shade ?? null,
      lighting: candidate.amenities?.lighting ?? null,
      parking: candidate.amenities?.parking ?? null,
      restrooms: candidate.amenities?.restrooms ?? null,
      surface: candidate.amenities?.surface ?? [],
    },
    fees: { free: true },
    ...(candidate.hours ? { hours: candidate.hours } : {}),
    rules: [],
    permitRequired: false,
    lastVerified: asOf,
    sources: [...candidate.sources].sort((a, b) => a.url.localeCompare(b.url)),
    manualOverrides: [],
  };
}

function hasDisappeared(
  park: Park,
  candidates: readonly ScrapedPark[],
  successfulSources: ReadonlySet<SourceName>,
): boolean {
  if (park.osmId && successfulSources.has("overpass")) {
    return !candidates.some((candidate) => candidate.osmId === park.osmId);
  }

  for (const source of ["atlanta-gis", "sandy-springs-gis"] as const) {
    if (!successfulSources.has(source)) continue;
    const ownedUrls = park.sources.filter((item) => sourceOwnsUrl(source, item.url));
    if (
      ownedUrls.length > 0 &&
      !candidates.some(
        (candidate) =>
          candidate.source === source &&
          ownedUrls.some((existing) => existing.url === candidate.sourceRecordUrl),
      )
    ) {
      return true;
    }
  }
  return false;
}

function sourceOwnsUrl(source: SourceName, url: string): boolean {
  if (source === "atlanta-gis") return url.includes("City_of_Atlanta_Parks/FeatureServer/9");
  if (source === "sandy-springs-gis") return url.includes("City_Map_cs/MapServer/15");
  return url.includes("openstreetmap.org/");
}

function setField<K extends keyof Park>(
  park: Park,
  field: K,
  value: Park[K] | undefined,
  changes: FieldChange[],
): void {
  if (value === undefined || isOverridden(park, String(field))) return;
  recordChange(park, field, value, changes);
}

function recordChange<K extends keyof Park>(
  park: Park,
  field: K,
  value: Park[K],
  changes: FieldChange[],
): void {
  if (deepEqual(park[field], value)) return;
  changes.push({ field: String(field), before: park[field], after: value });
  park[field] = value;
}

function isOverridden(park: Park, path: string): boolean {
  return park.manualOverrides.some(
    (override) => override === path || path.startsWith(`${override}.`),
  );
}

function mergeChanges(existing: FieldChange[], additions: FieldChange[]): FieldChange[] {
  const changes = new Map(existing.map((change) => [change.field, change]));
  for (const change of additions) {
    const first = changes.get(change.field);
    changes.set(change.field, first ? { ...change, before: first.before } : change);
  }
  return [...changes.values()].sort((a, b) => a.field.localeCompare(b.field));
}

function inferCounty(lng: number): Park["county"] {
  return lng > -84.33 ? "DeKalb" : "Fulton";
}

function compareCandidates(a: ScrapedPark, b: ScrapedPark): number {
  return a.source.localeCompare(b.source) || a.sourceId.localeCompare(b.sourceId);
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
