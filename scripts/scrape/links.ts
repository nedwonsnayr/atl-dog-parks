import type { Park } from "@/lib/schema";

import { request } from "./http";
import type { LinkCheck } from "./types";
import { errorMessage } from "./utils";

export async function checkBusinessLinks(parks: readonly Park[]): Promise<LinkCheck[]> {
  const businesses = parks
    .filter(
      (park): park is Park & { website: string } => park.type === "business" && !!park.website,
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const results: LinkCheck[] = [];

  for (const park of businesses) {
    results.push(await checkLink(park.slug, park.website));
  }
  return results;
}

async function checkLink(slug: string, url: string): Promise<LinkCheck> {
  try {
    let response = await request(url, { method: "HEAD", timeoutMs: 10_000, retries: 0 });
    if (response.status === 403 || response.status === 405) {
      response = await request(url, {
        method: "GET",
        timeoutMs: 10_000,
        retries: 0,
        headers: { Range: "bytes=0-0" },
      });
    }
    return {
      slug,
      url,
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
    };
  } catch (error) {
    return { slug, url, ok: false, error: errorMessage(error) };
  }
}
