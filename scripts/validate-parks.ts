import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { isInsideITP } from "@/lib/geo";
import { ParkSchema, type Park } from "@/lib/schema";

export const MINIMUM_PARK_COUNT = 15;

export async function validateParkDirectory(directory: string): Promise<string[]> {
  const errors: string[] = [];
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  if (files.length < MINIMUM_PARK_COUNT) {
    errors.push(`expected at least ${MINIMUM_PARK_COUNT} park files, found ${files.length}`);
  }

  const parks: Array<{ file: string; park: Park }> = [];
  for (const file of files) {
    const filePath = path.join(directory, file);
    try {
      const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
      const result = ParkSchema.safeParse(parsed);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(`${file}: ${issue.path.join(".") || "record"}: ${issue.message}`);
        }
        continue;
      }
      parks.push({ file, park: result.data });
    } catch (error) {
      errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const slugs = new Map<string, string>();
  const osmIds = new Map<string, string>();
  for (const { file, park } of parks) {
    if (file !== `${park.slug}.json`) {
      errors.push(`${file}: filename must match slug "${park.slug}"`);
    }

    const priorSlug = slugs.get(park.slug);
    if (priorSlug) errors.push(`${file}: duplicate slug also used by ${priorSlug}`);
    else slugs.set(park.slug, file);

    if (park.osmId) {
      const priorOsmId = osmIds.get(park.osmId);
      if (priorOsmId) errors.push(`${file}: duplicate osmId also used by ${priorOsmId}`);
      else osmIds.set(park.osmId, file);
    }

    if (!isInsideITP(park)) {
      errors.push(`${file}: coordinates ${park.lat},${park.lng} are outside I-285`);
    }
  }

  return errors;
}

async function main() {
  const directory = path.resolve(process.cwd(), "data/parks");
  const errors = await validateParkDirectory(directory);
  if (errors.length > 0) {
    console.error(`Park validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${MINIMUM_PARK_COUNT}+ park records inside I-285.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  void main();
}
