import { afterEach, describe, expect, it, vi } from "vitest";
import { securityHeaders } from "./csp";

afterEach(() => {
  vi.unstubAllEnvs();
});

function contentSecurityPolicy(): string {
  const csp = securityHeaders().find((header) => header.key === "Content-Security-Policy")?.value;
  expect(csp).toBeTruthy();
  return csp!;
}

describe("securityHeaders", () => {
  it("permits the map, ad, Supabase, and Turnstile hosts the app uses", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogs.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_MAP_STYLE_URL", "https://maps.example.test/styles/main.json");

    const csp = contentSecurityPolicy();

    expect(csp).toContain("https://maps.example.test");
    expect(csp).toContain("https://tiles.openfreemap.org");
    expect(csp).toContain("https://demotiles.maplibre.org");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("https://pagead2.googlesyndication.com");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("wss://*.supabase.co");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("127.0.0.1");
    expect(csp).not.toContain("localhost");
    expect(csp).not.toContain("ws://");
  });

  it("allowlists a loopback Supabase origin only in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

    const development = contentSecurityPolicy();
    expect(development).toContain("http://127.0.0.1:54321");
    expect(development).toContain("ws://127.0.0.1:54321");

    vi.stubEnv("NODE_ENV", "test");
    const outsideDevelopment = contentSecurityPolicy();
    expect(outsideDevelopment).not.toContain("127.0.0.1");
    expect(outsideDevelopment).not.toContain("ws://");
  });

  it("skips upgrade-insecure-requests for an http site origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3000");

    expect(contentSecurityPolicy()).not.toContain("upgrade-insecure-requests");
  });
});
