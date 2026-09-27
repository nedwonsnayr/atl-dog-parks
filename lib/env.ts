import { z } from "zod";

// Hosts often define unset variables as "", which should mean "not configured".
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(blankToUndefined, z.string().optional());
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());
const flag = z.preprocess(
  blankToUndefined,
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
);

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(blankToUndefined, z.url().default("http://localhost:3000")),
  NEXT_PUBLIC_ADS_ENABLED: flag,
  NEXT_PUBLIC_ADSENSE_CLIENT: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^ca-pub-\d+$/)
      .optional(),
  ),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
  NEXT_PUBLIC_MAP_STYLE_URL: z.preprocess(
    blankToUndefined,
    z.url().default("https://tiles.openfreemap.org/styles/liberty"),
  ),
});

const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  TURNSTILE_SECRET: optionalString,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  GITHUB_TOKEN: optionalString,
  GITHUB_REPOSITORY: optionalString,
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Safe to import from client components. Every variable is optional so the app
 * builds with no env set; values that are set but malformed throw at startup.
 * Each NEXT_PUBLIC_* var must be referenced literally for Next.js to inline it.
 */
export const publicEnv: PublicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ADS_ENABLED: process.env.NEXT_PUBLIC_ADS_ENABLED,
  NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
});

/** Ads render only when the flag is on and a publisher ID is configured. */
export const adsEnabled: boolean =
  publicEnv.NEXT_PUBLIC_ADS_ENABLED && Boolean(publicEnv.NEXT_PUBLIC_ADSENSE_CLIENT);

let serverCache: ServerEnv | undefined;

/** Server-only secrets. Throws if called in the browser. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called from client code");
  }
  serverCache ??= ServerEnvSchema.parse(process.env);
  return serverCache;
}
