export type SecurityHeader = { key: string; value: string };

const GOOGLE_AD_SCRIPTS = [
  "https://pagead2.googlesyndication.com",
  "https://securepubads.g.doubleclick.net",
  "https://www.googletagservices.com",
  "https://fundingchoicesmessages.google.com",
];

const GOOGLE_AD_CONNECTIONS = [
  "https://adservice.google.com",
  "https://googleads.g.doubleclick.net",
  "https://pagead2.googlesyndication.com",
  "https://securepubads.g.doubleclick.net",
  "https://fundingchoicesmessages.google.com",
];

const GOOGLE_AD_MEDIA = [
  "https://googleads.g.doubleclick.net",
  "https://pagead2.googlesyndication.com",
  "https://securepubads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
];

const MAP_ORIGINS = [
  "https://tiles.openfreemap.org",
  "https://api.maptiler.com",
  "https://*.tile.openstreetmap.org",
];

function contentSecurityPolicy(): string {
  const directives = [
    ["default-src", "'self'"],
    [
      "script-src",
      "'self'",
      "'unsafe-inline'",
      ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
      ...GOOGLE_AD_SCRIPTS,
      "https://challenges.cloudflare.com",
    ],
    ["style-src", "'self'", "'unsafe-inline'"],
    [
      "connect-src",
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      ...MAP_ORIGINS,
      "https://challenges.cloudflare.com",
      ...GOOGLE_AD_CONNECTIONS,
    ],
    [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      ...MAP_ORIGINS,
      ...GOOGLE_AD_MEDIA,
    ],
    ["font-src", "'self'", "data:"],
    [
      "frame-src",
      "https://challenges.cloudflare.com",
      "https://fundingchoicesmessages.google.com",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
      "https://www.google.com",
    ],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    ["upgrade-insecure-requests"],
  ];

  return directives.map((directive) => directive.join(" ")).join("; ");
}

/** Headers applied to every route via `next.config.ts`. */
export function securityHeaders(): SecurityHeader[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    // "Near me" relies on the Geolocation API, so it must stay allowed for self.
    { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
  ];
}
