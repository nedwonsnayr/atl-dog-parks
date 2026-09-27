import type { Park } from "@/lib/schema";

export type MapLinkTarget = Pick<Park, "name" | "address" | "lat" | "lng" | "googlePlaceId">;

export function googleMapsUrl(park: MapLinkTarget): string {
  const params = new URLSearchParams({ api: "1", query: `${park.lat},${park.lng}` });
  if (park.googlePlaceId) params.set("query_place_id", park.googlePlaceId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function appleMapsUrl(park: MapLinkTarget): string {
  const params = new URLSearchParams({
    q: park.name,
    ll: `${park.lat},${park.lng}`,
    address: park.address,
  });
  return `https://maps.apple.com/?${params.toString()}`;
}
