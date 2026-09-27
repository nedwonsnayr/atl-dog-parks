import { describe, expect, it } from "vitest";

import { polygonCentroid } from "./arcgis";

describe("polygonCentroid", () => {
  it("derives coordinates when an ArcGIS polygon omits its centroid", () => {
    expect(
      polygonCentroid([
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ]),
    ).toEqual({ x: 1, y: 1 });
  });
});
