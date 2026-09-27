import { afterEach, describe, expect, it, vi } from "vitest";

describe("abuse controls", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("fails closed in production when Redis is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { checkWriteRateLimit } = await import("@/lib/supabase/rate-limit");
    const result = await checkWriteRateLimit(
      new Request("https://example.com/api/reviews"),
      "user",
    );
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(503);
  });

  it("fails closed in production when the Turnstile secret is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET", "");
    const { verifyTurnstile } = await import("@/lib/supabase/turnstile");
    await expect(verifyTurnstile("token", new Request("https://example.com"))).resolves.toBe(false);
  });

  it("fails closed when NODE_ENV is unset", async () => {
    vi.stubEnv("NODE_ENV", "");
    vi.stubEnv("TURNSTILE_SECRET", "");
    const { verifyTurnstile } = await import("@/lib/supabase/turnstile");
    await expect(verifyTurnstile("token", new Request("https://example.com"))).resolves.toBe(false);
  });
});
