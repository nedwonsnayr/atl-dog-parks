import { describe, expect, it } from "vitest";

import type { Park } from "@/lib/schema";

import { findPark, parksToFeatureCollection } from "./mapData";

const park = {
  slug: "test-park",
  name: "Test Park",
  lat: 33.75,
  lng: -84.39,
} as Park;

describe("map data", () => {
  it("converts parks to GeoJSON points without including private client state", () => {
    expect(parksToFeatureCollection([park])).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [-84.39, 33.75],
          },
          properties: {
            slug: "test-park",
          },
        },
      ],
    });
  });

  it("finds the selected park only when its slug exists", () => {
    expect(findPark([park], "test-park")).toBe(park);
    expect(findPark([park], "missing")).toBeUndefined();
    expect(findPark([park], undefined)).toBeUndefined();
  });
});
