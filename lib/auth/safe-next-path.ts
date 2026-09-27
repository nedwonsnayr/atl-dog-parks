const REDIRECT_BASE = "https://atl-dog-parks.invalid";

/**
 * Auth callback `next` values must stay on this site.
 * A leading slash is not enough: URL parsers treat `/\host` as a protocol-relative URL.
 */
export function safeNextPath(candidate: string | null, fallback = "/account"): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\") || /[\u0000-\u001f\u007f]/.test(candidate)) return fallback;

  try {
    const url = new URL(candidate, REDIRECT_BASE);
    if (url.origin !== REDIRECT_BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
