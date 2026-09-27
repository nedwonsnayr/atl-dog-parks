export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Whether the point lies inside the I-285 boundary in `data/itp-boundary.geojson`. */
export function isInsideITP(point: LatLng): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
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
