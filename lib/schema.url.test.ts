import { describe, expect, it } from "vitest";

import { ParkSchema, SourceSchema } from "@/lib/schema";

const park = {
  slug: "piedmont-park-dog-park",
  name: "Piedmont Park Dog Park",
  type: "public",
  status: "published",
  description: "A fenced off-leash area inside Piedmont Park with water and shade.",
  address: "400 Park Dr NE, Atlanta, GA 30306",
  lat: 33.786,
  lng: -84.373,
  neighborhood: "Midtown",
  city: "Atlanta",
  county: "Fulton",
  amenities: {
    fenced: true,
    offLeash: true,
    smallDogArea: null,
    water: true,
    shade: true,
    lighting: null,
    parking: true,
    restrooms: true,
    surface: ["grass"],
  },
  fees: { free: true },
  rules: ["Keep dogs leashed outside the fence."],
  permitRequired: false,
  lastVerified: "2026-09-27",
  sources: [{ label: "City of Atlanta", url: "https://www.atlantaga.gov/" }],
  manualOverrides: [],
} as const;

describe("park URL fields", () => {
  it("accepts http and https links", () => {
    expect(ParkSchema.safeParse(park).success).toBe(true);
    expect(SourceSchema.safeParse({ label: "Site", url: "http://example.com" }).success).toBe(true);
  });

  it("rejects non-web URLs that could run as links or fetches", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd"]) {
      expect(ParkSchema.safeParse({ ...park, website: url }).success).toBe(false);
      expect(SourceSchema.safeParse({ label: "Site", url }).success).toBe(false);
    }
  });
});
