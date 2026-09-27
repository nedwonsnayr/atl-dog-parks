/** Missing Turnstile or Redis configuration is only tolerated for local dev and unit tests. */
export function allowMissingAbuseControls(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}
