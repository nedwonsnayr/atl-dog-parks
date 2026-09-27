const DEFAULT_USER_AGENT =
  "AtlantaDogParksDataBot/1.0 (+https://github.com/nedwonsnayr/atl-dog-parks)";

interface RequestOptions {
  timeoutMs?: number;
  retries?: number;
  method?: "GET" | "HEAD";
  headers?: HeadersInit;
}

export async function request(url: string, options: RequestOptions = {}): Promise<Response> {
  const retries = options.retries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/plain;q=0.9, */*;q=0.1",
          "User-Agent": process.env.SCRAPER_USER_AGENT ?? DEFAULT_USER_AGENT,
          ...options.headers,
        },
      });
      if (response.ok || response.status < 500 || attempt === retries) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw new Error(`Request failed for ${url}: ${formatRequestError(error)}`);
      }
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  throw lastError;
}

export async function fetchJson<T>(url: string, timeoutMs?: number): Promise<T> {
  const response = await request(url, { timeoutMs });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${formatRequestError(error)}`);
  }
}

function formatRequestError(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "request timed out";
  }
  return error instanceof Error ? error.message : String(error);
}
