import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("maplibre-gl/package.json"));
const distribution = join(packageRoot, "dist");

await Promise.all(
  ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"].map((filename) =>
    copyFile(join(distribution, filename), join(process.cwd(), "public", filename)),
  ),
);
