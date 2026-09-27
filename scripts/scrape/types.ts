import type { Park, Source } from "@/lib/schema";

export const SOURCE_NAMES = ["overpass", "atlanta-gis", "sandy-springs-gis"] as const;
export type SourceName = (typeof SOURCE_NAMES)[number];

export interface ScrapedPark {
  source: SourceName;
  sourceId: string;
  sourceRecordUrl: string;
  name: string;
  lat: number;
  lng: number;
  osmId?: string;
  googlePlaceId?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  county?: Park["county"];
  website?: string;
  hours?: string;
  amenities?: Partial<Park["amenities"]>;
  sources: Source[];
}

export interface SourceSuccess {
  name: SourceName;
  status: "ok";
  records: ScrapedPark[];
}

export interface SourceFailure {
  name: SourceName;
  status: "failed";
  error: string;
}

export type SourceResult = SourceSuccess | SourceFailure;

export interface SourceAdapter {
  name: SourceName;
  fetch(asOf: string): Promise<ScrapedPark[]>;
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface ParkDiff {
  slug: string;
  match: "id" | "name-coordinates" | "new" | "disappeared";
  distanceMeters?: number;
  changes: FieldChange[];
}

export interface LinkCheck {
  slug: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface ScrapeReport {
  version: 1;
  asOf: string;
  dryRun: boolean;
  sources: Array<{
    name: SourceName;
    status: "ok" | "failed";
    records: number;
    error?: string;
  }>;
  totals: {
    existing: number;
    fetched: number;
    insideItp: number;
    added: number;
    updated: number;
    flagged: number;
    unchanged: number;
  };
  diffs: ParkDiff[];
  linkChecks: LinkCheck[];
}

export interface PipelineOptions {
  asOf: string;
  dryRun: boolean;
  dataDirectory: string;
  adapters?: SourceAdapter[];
  writeReportPath?: string;
}
