import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

import { Agent } from "undici";

const DEFAULT_USER_AGENT =
  "AtlantaDogParksDataBot/1.0 (+https://github.com/nedwonsnayr/atl-dog-parks)";
const MAX_REDIRECTS = 5;

const blockedAddresses = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(address, prefix, "ipv4");
}
blockedAddresses.addAddress("::", "ipv6");
blockedAddresses.addAddress("::1", "ipv6");
blockedAddresses.addSubnet("fc00::", 7, "ipv6");
blockedAddresses.addSubnet("fe80::", 10, "ipv6");
blockedAddresses.addSubnet("ff00::", 8, "ipv6");
blockedAddresses.addSubnet("2001:db8::", 32, "ipv6");

export class UnsafeUrlError extends Error {
  constructor() {
    super("URL is not allowed");
    this.name = "UnsafeUrlError";
  }
}

interface RequestOptions {
  timeoutMs?: number;
  retries?: number;
  method?: "GET" | "HEAD";
  headers?: HeadersInit;
}

interface HttpDeps {
  fetchImpl?: typeof fetch;
  resolveHost?: (hostname: string) => Promise<string[]>;
}

function bareHostname(hostname: string) {
  return hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

function hexPairToIpv4(high: string, low: string) {
  const hi = Number.parseInt(high, 16);
  const lo = Number.parseInt(low, 16);
  if (!Number.isInteger(hi) || !Number.isInteger(lo) || hi > 0xffff || lo > 0xffff) return null;
  return [(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255].join(".");
}

function embeddedIpv4(ipv6: string) {
  const mapped = /^(?:0:){5}ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(ipv6);
  const compressed = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(ipv6);
  const dotted = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ipv6);
  const sixToFour = /^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})(?::|$)/i.exec(ipv6);
  if (dotted?.[1] && isIP(dotted[1]) === 4) return dotted[1];
  const pair = mapped ?? compressed ?? sixToFour;
  return pair ? hexPairToIpv4(pair[1], pair[2]) : null;
}

export function isBlockedAddress(address: string) {
  const bare = bareHostname(address);
  if (isIP(bare) === 4) return blockedAddresses.check(bare, "ipv4");
  if (isIP(bare) !== 6) return false;
  const embedded = embeddedIpv4(bare);
  if (embedded) return blockedAddresses.check(embedded, "ipv4");
  return blockedAddresses.check(bare, "ipv6");
}

function isBlockedHostname(hostname: string) {
  const host = bareHostname(hostname);
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    return true;
  }
  return isBlockedAddress(host);
}

export function parseFetchableUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError();
  }
  if (url.username || url.password) throw new UnsafeUrlError();
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UnsafeUrlError();
  if (isBlockedHostname(url.hostname)) throw new UnsafeUrlError();
  return url;
}

async function defaultResolve(hostname: string) {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

function publicLookup(
  hostname: string,
  options: { all?: boolean },
  callback: (
    error: Error | null,
    address: string | { address: string; family: number }[],
    family?: number,
  ) => void,
) {
  defaultResolve(hostname)
    .then((addresses) => {
      if (addresses.length === 0 || addresses.some((address) => isBlockedAddress(address))) {
        callback(new UnsafeUrlError(), "", 4);
        return;
      }
      if (options.all) {
        callback(
          null,
          addresses.map((address) => ({ address, family: isIP(address) === 6 ? 6 : 4 })),
        );
        return;
      }
      callback(null, addresses[0], isIP(addresses[0]) === 6 ? 6 : 4);
    })
    .catch((error: unknown) => {
      callback(error instanceof Error ? error : new UnsafeUrlError(), "", 4);
    });
}

const publicAgent = new Agent({ connect: { lookup: publicLookup } });

async function approvedUrl(raw: string, deps?: HttpDeps) {
  const url = parseFetchableUrl(raw);
  const host = bareHostname(url.hostname);
  if (isIP(host)) return url;

  let addresses: string[];
  try {
    addresses = await (deps?.resolveHost ?? defaultResolve)(host);
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw error;
    throw new Error(`Request failed for ${url.origin}: ${formatRequestError(error)}`);
  }
  if (addresses.length === 0 || addresses.some((address) => isBlockedAddress(address))) {
    throw new UnsafeUrlError();
  }
  return url;
}

function isRedirect(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

export async function request(
  url: string,
  options: RequestOptions = {},
  deps?: HttpDeps,
): Promise<Response> {
  const start = await approvedUrl(url, deps);
  const retries = options.retries ?? 1;
  const fetchImpl = deps?.fetchImpl ?? fetch;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
    try {
      let current = start;
      let method = options.method ?? "GET";
      let response: Response | null = null;

      for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
        response = await fetchImpl(current.href, {
          method,
          signal: controller.signal,
          redirect: "manual",
          headers: {
            Accept: "application/json, text/plain;q=0.9, */*;q=0.1",
            "User-Agent": process.env.SCRAPER_USER_AGENT ?? DEFAULT_USER_AGENT,
            ...options.headers,
          },
          dispatcher: publicAgent,
        } as RequestInit);

        if (!response || !isRedirect(response.status)) break;
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || redirects === MAX_REDIRECTS) throw new UnsafeUrlError();
        if (response.status === 303) method = "GET";
        current = await approvedUrl(new URL(location, current).href, deps);
      }

      if (!response) throw new UnsafeUrlError();
      if (response.ok || response.status < 500 || attempt === retries) return response;
      lastError = new Error(`HTTP ${response.status} from ${currentUrl(response, start)}`);
    } catch (error) {
      if (error instanceof UnsafeUrlError) throw error;
      lastError = error;
      if (attempt === retries) {
        throw new Error(`Request failed for ${start.origin}: ${formatRequestError(error)}`);
      }
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  throw lastError;
}

function currentUrl(response: Response, fallback: URL) {
  return response.url || fallback.origin;
}

export async function fetchJson<T>(url: string, timeoutMs?: number): Promise<T> {
  const response = await request(url, { timeoutMs });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${response.url || "the requested origin"}`);
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(
      `Invalid JSON from ${response.url || "the requested origin"}: ${formatRequestError(error)}`,
    );
  }
}

function formatRequestError(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "request timed out";
  }
  return error instanceof Error ? error.message : String(error);
}
