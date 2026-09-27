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
  "https://demotiles.maplibre.org",
  "https://api.maptiler.com",
  "https://*.tile.openstreetmap.org",
];

function configuredOrigin(envName: string): string | null {
  try {
    const value = process.env[envName];
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/** Loopback origins are a development convenience. Production CSP stays on public https hosts. */
function originForThisEnvironment(origin: string | null): string | null {
  if (!origin) return null;
  try {
    if (isLoopbackHost(new URL(origin).hostname) && process.env.NODE_ENV !== "development") {
      return null;
    }
  } catch {
    return null;
  }
  return origin;
}

function websocketOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol === "http:") return `ws://${url.host}`;
    if (url.protocol === "https:") return `wss://${url.host}`;
    return null;
  } catch {
    return null;
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function contentSecurityPolicy(): string {
  const mapOrigins = unique([
    ...MAP_ORIGINS,
    originForThisEnvironment(configuredOrigin("NEXT_PUBLIC_MAP_STYLE_URL")),
  ]);
  const supabaseHttp = unique([
    originForThisEnvironment(configuredOrigin("NEXT_PUBLIC_SUPABASE_URL")),
  ]);
  const supabaseSockets = unique(supabaseHttp.map(websocketOrigin));
  // upgrade-insecure-requests rewrites same-origin dev assets and local Supabase to HTTPS.
  const upgrade = configuredOrigin("NEXT_PUBLIC_SITE_URL")?.startsWith("https://")
    ? [["upgrade-insecure-requests"]]
    : [];
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
      ...supabaseHttp,
      ...supabaseSockets,
      ...mapOrigins,
      "https://challenges.cloudflare.com",
      ...GOOGLE_AD_CONNECTIONS,
    ],
    [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      ...supabaseHttp,
      ...mapOrigins,
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
    ...upgrade,
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
