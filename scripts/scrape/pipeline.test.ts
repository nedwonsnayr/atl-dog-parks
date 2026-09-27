import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { Park } from "@/lib/schema";

import { runPipeline } from "./pipeline";
import type { SourceAdapter } from "./types";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe("runPipeline", () => {
  it("makes no writes in dry-run mode", async () => {
    const directory = await createDataDirectory();
    const parkPath = path.join(directory, "existing.json");
    const reportPath = path.join(directory, "report.json");
    const before = await readFile(parkPath, "utf8");
    const adapter: SourceAdapter = {
      name: "atlanta-gis",
      async fetch() {
        return [
          {
            source: "atlanta-gis",
            sourceId: "atlanta-gis:2",
            sourceRecordUrl: "https://example.gov/2",
            name: "New Municipal Dog Park",
            lat: 33.78,
            lng: -84.37,
            city: "Atlanta",
            county: "Fulton",
            sources: [{ label: "City GIS", url: "https://example.gov/2" }],
          },
        ];
      },
    };

    const report = await runPipeline({
      asOf: "2026-09-27",
      dryRun: true,
      dataDirectory: directory,
      adapters: [adapter],
      writeReportPath: reportPath,
    });

    expect(report.totals.added).toBe(1);
    expect(await readFile(parkPath, "utf8")).toBe(before);
    await expect(access(reportPath)).rejects.toThrow();
    await expect(access(path.join(directory, "new-municipal-dog-park.json"))).rejects.toThrow();
  });

  it("reports source failures without flagging their records", async () => {
    const directory = await createDataDirectory();
    const adapter: SourceAdapter = {
      name: "overpass",
      async fetch() {
        throw new Error("network unavailable");
      },
    };

    const report = await runPipeline({
      asOf: "2026-09-27",
      dryRun: true,
      dataDirectory: directory,
      adapters: [adapter],
    });

    expect(report.sources).toEqual([
      {
        name: "overpass",
        status: "failed",
        records: 0,
        error: "network unavailable",
      },
    ]);
    expect(report.totals.flagged).toBe(0);
  });
});

async function createDataDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "atl-dog-parks-scrape-"));
  temporaryDirectories.push(directory);
  await writeFile(
    path.join(directory, "existing.json"),
    `${JSON.stringify(existingPark, null, 2)}\n`,
    "utf8",
  );
  return directory;
}

const existingPark: Park = {
  slug: "existing",
  name: "Existing Dog Park",
  type: "public",
  status: "published",
  description:
    "An existing public dog park record with enough detail to satisfy the data contract.",
  address: "1 Existing Street, Atlanta, GA",
  lat: 33.77,
  lng: -84.38,
  osmId: "node/100",
  neighborhood: "Midtown",
  city: "Atlanta",
  county: "Fulton",
  amenities: {
    fenced: true,
    offLeash: true,
    smallDogArea: null,
    water: null,
    shade: null,
    lighting: null,
    parking: null,
    restrooms: null,
    surface: [],
  },
  fees: { free: true },
  rules: [],
  permitRequired: false,
  lastVerified: "2026-01-01",
  sources: [{ label: "OpenStreetMap", url: "https://www.openstreetmap.org/node/100" }],
  manualOverrides: [],
};
