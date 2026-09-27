import fs from "node:fs";
import path from "node:path";
import { ParkSchema, type Park } from "@/lib/schema";
import { toSlug } from "@/lib/slug";

export const PARKS_DIR = path.join(process.cwd(), "data", "parks");

export type Neighborhood = { slug: string; name: string; count: number };

/**
 * Reads and validates every park file, including drafts. Throws on the first
 * invalid file, or when a file name does not match its `slug`, so a bad
 * record fails the build instead of shipping.
 */
export function loadParkFiles(dir: string = PARKS_DIR): Park[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const raw: unknown = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const result = ParkSchema.safeParse(raw);
      if (!result.success) {
        throw new Error(`Invalid park file ${file}:\n${result.error.message}`);
      }
      if (`${result.data.slug}.json` !== file) {
        throw new Error(`Park file ${file} must be named ${result.data.slug}.json`);
      }
      return result.data;
    });
}

let cache: Park[] | undefined;

/** Parks visible on the site (drafts excluded), sorted by name. */
export function getAllParks(): Park[] {
  cache ??= loadParkFiles()
    .filter((park) => park.status !== "draft")
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export function getParkBySlug(slug: string): Park | undefined {
  return getAllParks().find((park) => park.slug === slug);
}

/** Neighborhoods with at least one visible park, sorted by name. */
export function getNeighborhoods(): Neighborhood[] {
  const bySlug = new Map<string, Neighborhood>();
  for (const park of getAllParks()) {
    const slug = toSlug(park.neighborhood);
    const existing = bySlug.get(slug);
    if (existing) existing.count += 1;
    else bySlug.set(slug, { slug, name: park.neighborhood, count: 1 });
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getParksByNeighborhood(slug: string): Park[] {
  return getAllParks().filter((park) => toSlug(park.neighborhood) === slug);
}
