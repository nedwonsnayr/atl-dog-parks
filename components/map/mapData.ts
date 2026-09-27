import type { FeatureCollection, Point } from "geojson";

import type { Park } from "@/lib/schema";

export interface ParkPointProperties {
  slug: string;
}

export type ParkFeatureCollection = FeatureCollection<Point, ParkPointProperties>;

export const ATLANTA_CENTER: [number, number] = [-84.388, 33.749];

export function parksToFeatureCollection(parks: readonly Park[]): ParkFeatureCollection {
  return {
    type: "FeatureCollection",
    features: parks.map((park) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [park.lng, park.lat],
      },
      properties: {
        slug: park.slug,
      },
    })),
  };
}

export function findPark(parks: readonly Park[], slug: string | undefined): Park | undefined {
  return slug ? parks.find((park) => park.slug === slug) : undefined;
}
