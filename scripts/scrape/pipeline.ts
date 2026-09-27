import { writeFile } from "node:fs/promises";

import { isInsideITP } from "@/lib/geo";

import { readParks, writeChangedParks } from "./io";
import { checkBusinessLinks } from "./links";
import { mergeParks } from "./merge";
import { sourceAdapters } from "./sources";
import type {
  PipelineOptions,
  ScrapedPark,
  ScrapeReport,
  SourceResult,
  SourceSuccess,
} from "./types";
import { errorMessage, stableJson } from "./utils";

export async function runPipeline(options: PipelineOptions): Promise<ScrapeReport> {
  const existing = await readParks(options.dataDirectory);
  const results: SourceResult[] = [];

  for (const adapter of options.adapters ?? sourceAdapters) {
    try {
      const records = await adapter.fetch(options.asOf);
      records.forEach(assertValidCandidate);
      results.push({ name: adapter.name, status: "ok", records });
    } catch (error) {
      results.push({ name: adapter.name, status: "failed", error: errorMessage(error) });
    }
  }

  const successful = results.filter((result): result is SourceSuccess => result.status === "ok");
  const fetched = successful
    .flatMap((result) => result.records)
    .sort((a, b) => a.source.localeCompare(b.source) || a.sourceId.localeCompare(b.sourceId));
  const insideItp = deduplicate(
    fetched.filter((candidate) => isInsideITP({ lat: candidate.lat, lng: candidate.lng })),
  );
  const merged = mergeParks(
    existing,
    insideItp,
    new Set(successful.map((result) => result.name)),
    options.asOf,
  );
  const linkChecks = await checkBusinessLinks(merged.parks);

  const report: ScrapeReport = {
    version: 1,
    asOf: options.asOf,
    dryRun: options.dryRun,
    sources: results.map((result) => ({
      name: result.name,
      status: result.status,
      records: result.status === "ok" ? result.records.length : 0,
      ...(result.status === "failed" ? { error: result.error } : {}),
    })),
    totals: {
      existing: existing.length,
      fetched: fetched.length,
      insideItp: insideItp.length,
      added: merged.added,
      updated: merged.updated,
      flagged: merged.flagged,
      unchanged: merged.unchanged,
    },
    diffs: merged.diffs,
    linkChecks,
  };

  if (!options.dryRun) {
    await writeChangedParks(options.dataDirectory, existing, merged.parks);
    if (options.writeReportPath) {
      await writeFile(options.writeReportPath, stableJson(report), "utf8");
    }
  }

  return report;
}

function assertValidCandidate(candidate: ScrapedPark): void {
  if (!candidate.name.trim()) throw new Error(`${candidate.sourceId} has no name`);
  if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) {
    throw new Error(`${candidate.sourceId} has invalid coordinates`);
  }
  if (candidate.lat < -90 || candidate.lat > 90 || candidate.lng < -180 || candidate.lng > 180) {
    throw new Error(`${candidate.sourceId} has out-of-range coordinates`);
  }
}

function deduplicate(candidates: readonly ScrapedPark[]): ScrapedPark[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.source}:${candidate.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
