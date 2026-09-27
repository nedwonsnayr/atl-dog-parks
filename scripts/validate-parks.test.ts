import path from "node:path";

import { describe, expect, it } from "vitest";

import { MINIMUM_PARK_COUNT, validateParkDirectory } from "@/scripts/validate-parks";

describe("park data", () => {
  it(`contains at least ${MINIMUM_PARK_COUNT} valid, unique ITP records`, async () => {
    const errors = await validateParkDirectory(path.resolve(process.cwd(), "data/parks"));

    expect(errors).toEqual([]);
  });
});
