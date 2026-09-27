import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ParkSchema, type Park } from "@/lib/schema";

export async function readParks(dataDirectory: string): Promise<Park[]> {
  const files = (await readdir(dataDirectory))
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dataDirectory, file);
      const json: unknown = JSON.parse(await readFile(filePath, "utf8"));
      const parsed = ParkSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(`Invalid park data in ${filePath}: ${parsed.error.message}`);
      }
      return parsed.data;
    }),
  );
}

export async function writeChangedParks(
  dataDirectory: string,
  before: readonly Park[],
  after: readonly Park[],
): Promise<number> {
  const existing = new Map(before.map((park) => [park.slug, park]));
  let writes = 0;

  for (const park of after) {
    if (deepEqual(existing.get(park.slug), park)) continue;
    const parsed = ParkSchema.parse(park);
    await writeFile(
      path.join(dataDirectory, `${park.slug}.json`),
      `${JSON.stringify(parsed, null, 2)}\n`,
      "utf8",
    );
    writes += 1;
  }
  return writes;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
