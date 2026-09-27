export type SecurityHeader = { key: string; value: string };

/** Headers applied to every route via `next.config.ts`. */
export function securityHeaders(): SecurityHeader[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    // "Near me" relies on the Geolocation API, so it must stay allowed for self.
    { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
  ];
}
