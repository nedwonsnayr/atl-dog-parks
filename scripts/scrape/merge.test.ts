import { describe, expect, it } from "vitest";

import type { Park } from "@/lib/schema";

import { findMatch, mergeParks } from "./merge";
import type { ScrapedPark } from "./types";

const basePark: Park = {
  slug: "sample-dog-park",
  name: "Sample Dog Park",
  type: "public",
  status: "published",
  description: "A substantive manually reviewed description for the sample dog park used in tests.",
  address: "1 Old Street, Atlanta, GA",
  lat: 33.77,
  lng: -84.38,
  osmId: "node/1",
  neighborhood: "Old Fourth Ward",
  city: "Atlanta",
  county: "Fulton",
  amenities: {
    fenced: true,
    offLeash: true,
    smallDogArea: null,
    water: false,
    shade: null,
    lighting: null,
    parking: null,
    restrooms: null,
    surface: ["grass"],
  },
  fees: { free: true },
  rules: [],
  permitRequired: false,
  lastVerified: "2026-01-01",
  sources: [{ label: "OpenStreetMap", url: "https://www.openstreetmap.org/node/1" }],
  manualOverrides: [],
};

describe("findMatch", () => {
  it("prefers stable identifiers", () => {
    const candidate = scraped({ name: "Renamed Park", lat: 34, lng: -85 });
    expect(findMatch([basePark], candidate)?.match).toBe("id");
  });

  it("falls back to normalized name and coordinates within 50 meters", () => {
    const park = { ...basePark, osmId: undefined, sources: [] };
    const candidate = scraped({
      sourceId: "different",
      osmId: undefined,
      sourceRecordUrl: "https://example.gov/different",
      name: "Sample Park",
      lat: 33.7702,
      lng: -84.38,
    });
    const match = findMatch([park], candidate);
    expect(match?.match).toBe("name-coordinates");
    expect(match?.distanceMeters).toBeLessThan(50);
  });
});

describe("mergeParks", () => {
  it("never overwrites root or dotted manual overrides", () => {
    const park: Park = {
      ...basePark,
      manualOverrides: ["address", "amenities.water"],
    };
    const result = mergeParks(
      [park],
      [
        scraped({
          address: "2 New Street, Atlanta, GA",
          amenities: { water: true, shade: true },
        }),
      ],
      new Set(["overpass"]),
      "2026-09-27",
    );

    expect(result.parks[0].address).toBe("1 Old Street, Atlanta, GA");
    expect(result.parks[0].amenities.water).toBe(false);
    expect(result.parks[0].amenities.shade).toBe(true);
    expect(result.diffs[0].changes.some((change) => change.field === "address")).toBe(false);
    expect(result.diffs[0].changes.some((change) => change.field === "amenities.water")).toBe(
      false,
    );
  });

  it("creates schema-compatible draft additions", () => {
    const result = mergeParks([], [scraped({ osmId: "way/22" })], new Set(), "2026-09-27");
    expect(result.added).toBe(1);
    expect(result.parks[0]).toMatchObject({
      slug: "sample-dog-park",
      status: "draft",
      osmId: "way/22",
    });
    expect(result.parks[0].description.length).toBeGreaterThanOrEqual(40);
  });

  it("flags disappeared records only after their source succeeds", () => {
    const failed = mergeParks([basePark], [], new Set(), "2026-09-27");
    const succeeded = mergeParks([basePark], [], new Set(["overpass"]), "2026-09-27");
    expect(failed.parks[0].status).toBe("published");
    expect(succeeded.parks[0].status).toBe("flagged");
    expect(succeeded.flagged).toBe(1);
  });
});

function scraped(overrides: Partial<ScrapedPark> = {}): ScrapedPark {
  return {
    source: "overpass",
    sourceId: "node/1",
    sourceRecordUrl: "https://www.openstreetmap.org/node/1",
    name: "Sample Dog Park",
    lat: 33.77,
    lng: -84.38,
    osmId: "node/1",
    address: "2 New Street, Atlanta, GA",
    city: "Atlanta",
    county: "Fulton",
    sources: [
      {
        label: "OpenStreetMap",
        url: "https://www.openstreetmap.org/node/1",
        retrievedAt: "2026-09-27",
      },
    ],
    ...overrides,
  };
}
