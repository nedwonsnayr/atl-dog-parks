import type { Park } from "@/lib/schema";

import { fetchJson } from "../http";
import type { ScrapedPark, SourceAdapter } from "../types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const ITP_BBOX = "33.62,-84.56,33.99,-84.25";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export const overpassAdapter: SourceAdapter = {
  name: "overpass",
  async fetch(asOf) {
    const query = `[out:json][timeout:45];
(
  node["leisure"="dog_park"](${ITP_BBOX});
  way["leisure"="dog_park"](${ITP_BBOX});
  relation["leisure"="dog_park"](${ITP_BBOX});
);
out center tags;`;
    const url = `${OVERPASS_URL}?${new URLSearchParams({ data: query })}`;
    const payload = await fetchJson<OverpassResponse>(url, 60_000);

    return payload.elements
      .map((element) => toScrapedPark(element, asOf))
      .filter((park): park is ScrapedPark => park !== null)
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  },
};

function toScrapedPark(element: OverpassElement, asOf: string): ScrapedPark | null {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!tags.name || lat === undefined || lng === undefined) {
    return null;
  }

  const osmId = `${element.type}/${element.id}`;
  const sourceRecordUrl = `https://www.openstreetmap.org/${osmId}`;
  return {
    source: "overpass",
    sourceId: osmId,
    sourceRecordUrl,
    name: tags.name,
    lat,
    lng,
    osmId,
    address: formatAddress(tags),
    neighborhood: tags["addr:suburb"] ?? tags["addr:neighbourhood"],
    city: tags["addr:city"],
    county: parseCounty(tags["addr:county"]),
    website: tags.website ?? tags["contact:website"],
    hours: tags.opening_hours,
    amenities: {
      fenced: parseBoolean(tags.fenced),
      offLeash: true,
      smallDogArea: parseBoolean(tags.segregated),
      water: parseBoolean(tags.drinking_water),
      lighting: parseBoolean(tags.lit),
      parking: parseBoolean(tags.parking),
      restrooms: parseBoolean(tags.toilets),
      surface: parseSurfaces(tags.surface),
    },
    sources: [{ label: "OpenStreetMap", url: sourceRecordUrl, retrievedAt: asOf }],
  };
}

function formatAddress(tags: Record<string, string>): string | undefined {
  if (tags["addr:full"]) return tags["addr:full"];
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const locality = [tags["addr:city"], tags["addr:state"], tags["addr:postcode"]]
    .filter(Boolean)
    .join(", ");
  return [street, locality].filter(Boolean).join(", ") || undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

function parseCounty(value: string | undefined): ScrapedPark["county"] {
  const county = value?.replace(/\s+County$/i, "");
  return county === "Fulton" || county === "DeKalb" || county === "Cobb" || county === "Clayton"
    ? county
    : undefined;
}

function parseSurfaces(value: string | undefined): Park["amenities"]["surface"] | undefined {
  if (!value) return undefined;
  const mapped = value
    .split(";")
    .map((surface) => {
      if (surface === "artificial_turf") return "turf";
      if (surface === "fine_gravel") return "gravel";
      if (
        surface === "grass" ||
        surface === "gravel" ||
        surface === "turf" ||
        surface === "mulch" ||
        surface === "dirt"
      ) {
        return surface;
      }
      return null;
    })
    .filter(
      (surface): surface is "grass" | "gravel" | "turf" | "mulch" | "dirt" => surface !== null,
    );
  return [...new Set(mapped)].sort();
}
