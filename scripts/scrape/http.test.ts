import { describe, expect, it, vi } from "vitest";

import { parseFetchableUrl, request, UnsafeUrlError } from "@/scripts/scrape/http";

const publicHost = vi.fn(async () => ["1.1.1.1"]);

describe("parseFetchableUrl", () => {
  it("allows public http and https URLs", () => {
    expect(parseFetchableUrl("https://overpass-api.de/api/interpreter").protocol).toBe("https:");
  });

  it("rejects non-http schemes, credentials, and non-public hosts", () => {
    const blocked = [
      "file:///etc/passwd",
      "javascript:alert(1)",
      "http://user:pass@example.com/",
      "http://127.0.0.1/",
      "http://2130706433/",
      "http://169.254.169.254/latest/meta-data",
      "http://10.1.2.3/",
      "http://[::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://localhost/",
      "http://metadata.google.internal/",
    ];
    for (const url of blocked) {
      expect(() => parseFetchableUrl(url)).toThrow(UnsafeUrlError);
    }
  });
});

describe("request", () => {
  it("does not follow a redirect to a private address", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/latest/meta-data" },
      });
    });

    await expect(
      request("https://example.com/start", { retries: 0 }, { fetchImpl, resolveHost: publicHost }),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("follows a public redirect and returns the final response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: "https://example.com/final" } }),
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const response = await request(
      "https://example.com/start",
      { retries: 0 },
      { fetchImpl, resolveHost: publicHost },
    );
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe("https://example.com/final");
  });

  it("rejects a hostname that resolves to a private address", async () => {
    const fetchImpl = vi.fn();
    await expect(
      request(
        "https://example.com/",
        { retries: 0 },
        { fetchImpl, resolveHost: async () => ["10.0.0.8"] },
      ),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
