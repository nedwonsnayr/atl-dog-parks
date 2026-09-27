import type { Park } from "@/lib/schema";

import { fetchJson } from "../http";
import type { ScrapedPark, SourceAdapter, SourceName } from "../types";

interface ArcGisFeature {
  attributes: Record<string, unknown>;
  centroid?: { x: number; y: number };
  geometry?: {
    x?: number;
    y?: number;
    rings?: number[][][];
  };
}

interface ArcGisResponse {
  error?: { code?: number; message?: string; details?: string[] };
  features?: ArcGisFeature[];
}

interface ArcGisAdapterConfig {
  name: SourceName;
  label: string;
  endpoint: string;
  where: string;
  outFields: string[];
  isDogPark(attributes: Record<string, unknown>): boolean;
  map(
    attributes: Record<string, unknown>,
    coordinates: { x: number; y: number },
  ): {
    id: string;
    objectId: string;
    name: string;
    address?: string;
    neighborhood?: string;
    city: string;
    county: Park["county"];
  };
}

export function createArcGisAdapter(config: ArcGisAdapterConfig): SourceAdapter {
  return {
    name: config.name,
    async fetch(asOf) {
      const parameters = new URLSearchParams({
        where: config.where,
        outFields: config.outFields.join(","),
        returnGeometry: "true",
        returnCentroid: "true",
        outSR: "4326",
        f: "json",
      });
      const queryUrl = `${config.endpoint}/query?${parameters}`;
      const payload = await fetchJson<ArcGisResponse>(queryUrl);
      if (payload.error) {
        const details = payload.error.details?.join("; ");
        throw new Error(
          `ArcGIS ${payload.error.code ?? "error"}: ${payload.error.message ?? "unknown error"}${
            details ? ` (${details})` : ""
          }`,
        );
      }

      return (payload.features ?? [])
        .filter((feature) => config.isDogPark(feature.attributes))
        .flatMap((feature): ScrapedPark[] => {
          const coordinates = featureCoordinates(feature);
          if (!coordinates) return [];
          const mapped = config.map(feature.attributes, {
            x: coordinates.x,
            y: coordinates.y,
          });
          const recordParameters = new URLSearchParams({
            objectIds: mapped.objectId,
            outFields: "*",
            returnGeometry: "true",
            outSR: "4326",
            f: "pjson",
          });
          const sourceRecordUrl = `${config.endpoint}/query?${recordParameters}`;
          return [
            {
              source: config.name,
              sourceId: `${config.name}:${mapped.id}`,
              sourceRecordUrl,
              name: mapped.name,
              lat: coordinates.y,
              lng: coordinates.x,
              address: mapped.address,
              neighborhood: mapped.neighborhood,
              city: mapped.city,
              county: mapped.county,
              amenities: { offLeash: true },
              sources: [{ label: config.label, url: sourceRecordUrl, retrievedAt: asOf }],
            },
          ];
        })
        .sort((a, b) => a.sourceId.localeCompare(b.sourceId));
    },
  };
}

export function stringAttribute(
  attributes: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = attributes[name];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function featureCoordinates(feature: ArcGisFeature): { x: number; y: number } | null {
  const direct = feature.centroid ?? feature.geometry;
  if (direct?.x !== undefined && direct.y !== undefined) {
    return { x: direct.x, y: direct.y };
  }
  return polygonCentroid(feature.geometry?.rings ?? []);
}

export function polygonCentroid(rings: readonly number[][][]): { x: number; y: number } | null {
  let areaSum = 0;
  let xSum = 0;
  let ySum = 0;

  for (const ring of rings) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const current = ring[index];
      const next = ring[index + 1];
      if (!current || !next) continue;
      const cross = current[0] * next[1] - next[0] * current[1];
      areaSum += cross;
      xSum += (current[0] + next[0]) * cross;
      ySum += (current[1] + next[1]) * cross;
    }
  }

  if (Math.abs(areaSum) < Number.EPSILON) return null;
  return {
    x: xSum / (3 * areaSum),
    y: ySum / (3 * areaSum),
  };
}
