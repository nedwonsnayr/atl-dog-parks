import type { SourceAdapter } from "../types";
import { atlantaGisAdapter } from "./atlanta";
import { overpassAdapter } from "./overpass";
import { sandySpringsGisAdapter } from "./sandy-springs";

export const sourceAdapters: SourceAdapter[] = [
  overpassAdapter,
  atlantaGisAdapter,
  sandySpringsGisAdapter,
];
