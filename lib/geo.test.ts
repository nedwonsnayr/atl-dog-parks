import { describe, expect, it } from "vitest";

import { haversineMiles, isInsideITP, sortByDistance } from "@/lib/geo";

describe("isInsideITP", () => {
  it("accepts central Atlanta and rejects points beyond I-285", () => {
    expect(isInsideITP({ lat: 33.749, lng: -84.388 })).toBe(true);
    expect(isInsideITP({ lat: 33.9526, lng: -84.5499 })).toBe(false);
    expect(isInsideITP({ lat: 33.8484, lng: -84.161 })).toBe(false);
  });

  it("rejects non-finite coordinates", () => {
    expect(isInsideITP({ lat: Number.NaN, lng: -84.388 })).toBe(false);
    expect(isInsideITP({ lat: 33.749, lng: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe("haversineMiles", () => {
  it("returns zero for the same point", () => {
    expect(haversineMiles({ lat: 33.749, lng: -84.388 }, { lat: 33.749, lng: -84.388 })).toBe(0);
  });

  it("calculates a known one-degree distance", () => {
    expect(haversineMiles({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(69.094, 2);
  });
});

describe("sortByDistance", () => {
  it("sorts nearest first without mutating its input", () => {
    const parks = [
      { name: "far", lat: 33.9, lng: -84.4 },
      { name: "near", lat: 33.75, lng: -84.39 },
    ] as const;

    const sorted = sortByDistance(parks, { lat: 33.749, lng: -84.388 });

    expect(sorted.map((park) => park.name)).toEqual(["near", "far"]);
    expect(sorted[0].distanceMiles).toBeLessThan(sorted[1].distanceMiles);
    expect(parks.map((park) => park.name)).toEqual(["far", "near"]);
  });
});
