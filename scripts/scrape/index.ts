import path from "node:path";

import { runPipeline } from "./pipeline";
import { stableJson } from "./utils";

interface CliOptions {
  dryRun: boolean;
  asOf: string;
  reportPath?: string;
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const report = await runPipeline({
    dryRun: options.dryRun,
    asOf: options.asOf,
    dataDirectory: path.resolve(process.cwd(), "data/parks"),
    writeReportPath: options.reportPath
      ? path.resolve(process.cwd(), options.reportPath)
      : undefined,
  });
  process.stdout.write(stableJson(report));
}

export function parseArguments(args: readonly string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    asOf: new Date().toISOString().slice(0, 10),
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--as-of" || argument === "--report") {
      const value = args[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      index += 1;
      if (argument === "--as-of") options.asOf = value;
      else options.reportPath = value;
    } else if (argument.startsWith("--as-of=")) {
      options.asOf = argument.slice("--as-of=".length);
    } else if (argument.startsWith("--report=")) {
      options.reportPath = argument.slice("--report=".length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.asOf) || Number.isNaN(Date.parse(options.asOf))) {
    throw new Error(`Invalid --as-of date: ${options.asOf}`);
  }
  return options;
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
