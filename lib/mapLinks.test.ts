import { describe, expect, it } from "vitest";

import { appleMapsUrl, googleMapsUrl, type MapLinkTarget } from "@/lib/mapLinks";

const park: MapLinkTarget = {
  name: "Piedmont Park Dog Park",
  address: "400 Park Drive Northeast, Atlanta, GA 30306",
  lat: 33.7878787,
  lng: -84.3713409,
};

describe("googleMapsUrl", () => {
  it("builds a coordinate search without a place ID", () => {
    const url = new URL(googleMapsUrl(park));

    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("33.7878787,-84.3713409");
    expect(url.searchParams.has("query_place_id")).toBe(false);
  });

  it("includes a Google place ID when one is available", () => {
    const url = new URL(googleMapsUrl({ ...park, googlePlaceId: "test-place-id" }));

    expect(url.searchParams.get("query_place_id")).toBe("test-place-id");
  });
});

describe("appleMapsUrl", () => {
  it("builds a link with the park name, coordinates, and address", () => {
    const url = new URL(appleMapsUrl(park));

    expect(url.origin + url.pathname).toBe("https://maps.apple.com/");
    expect(url.searchParams.get("q")).toBe(park.name);
    expect(url.searchParams.get("ll")).toBe(`${park.lat},${park.lng}`);
    expect(url.searchParams.get("address")).toBe(park.address);
  });
});
