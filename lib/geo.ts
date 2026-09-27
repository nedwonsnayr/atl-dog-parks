import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint, polygon } from "@turf/helpers";

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;
// Keep this ring synchronized with the public GeoJSON; app bundlers do not load .geojson modules.
const ITP_RING: Array<[number, number]> = [
  [-84.5028084, 33.7218613],
  [-84.4974448, 33.646581],
  [-84.4879164, 33.6212734],
  [-84.484262, 33.6189664],
  [-84.441069, 33.6162484],
  [-84.3893685, 33.6312513],
  [-84.25347, 33.700545],
  [-84.2399679, 33.7157404],
  [-84.2324656, 33.7272915],
  [-84.2312103, 33.7308317],
  [-84.2303198, 33.7420568],
  [-84.232329, 33.768226],
  [-84.25091, 33.884631],
  [-84.2912012, 33.9177505],
  [-84.2982459, 33.9203647],
  [-84.3287174, 33.920347],
  [-84.4172072, 33.9159022],
  [-84.4229415, 33.9140028],
  [-84.4467954, 33.9000051],
  [-84.468369, 33.885692],
  [-84.4723806, 33.8818667],
  [-84.487203, 33.845692],
  [-84.4973457, 33.8152228],
  [-84.5028084, 33.7218613],
];
const boundary = polygon([ITP_RING]);

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** Whether the point lies inside the I-285 boundary in `data/itp-boundary.geojson`. */
export function isInsideITP(point: LatLng): boolean {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false;
  return booleanPointInPolygon(turfPoint([point.lng, point.lat]), boundary);
}

/** Returns a new array, nearest first; the input is not mutated. */
export function sortByDistance<T extends LatLng>(
  items: readonly T[],
  origin: LatLng,
): Array<T & { distanceMiles: number }> {
  return items
    .map((item) => ({ ...item, distanceMiles: haversineMiles(origin, item) }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}
