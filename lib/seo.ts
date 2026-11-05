import type { Metadata } from "next";

import { publicEnv } from "@/lib/env";
import type { Park } from "@/lib/schema";
import { toSlug } from "@/lib/slug";

export const SITE_NAME = "ATL Dog Parks";

export const HOME_TITLE = `${SITE_NAME} | Dog parks inside I-285`;

export const HOME_DESCRIPTION =
  "Compare fenced dog parks, off-leash areas, and dog-friendly businesses inside Atlanta's Perimeter, with amenities, hours, fees, and directions.";

/** Paths that belong in the sitemap. Auth, account, and admin stay out. */
export const PUBLIC_STATIC_PATHS = [
  "/",
  "/neighborhoods",
  "/submit",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
] as const;

/** Prefixes blocked in robots.txt. Matched from the start of the path. */
export const PRIVATE_PATH_PREFIXES = ["/admin", "/account", "/auth", "/api"] as const;

const META_DESCRIPTION_MAX = 160;

/**
 * schema.org `openingHours` expects day abbreviations and times
 * (for example "Mo-Su 06:00-20:00"). Free-text hours stay in the HTML.
 */
const SCHEMA_OPENING_HOURS = /^(?:Mo|Tu|We|Th|Fr|Sa|Su)\b/;

/**
 * Absolute URL for a public path. Query strings and hashes are dropped so
 * shareable filter URLs canonicalize to the unfiltered page.
 */
export function canonicalUrl(pathname: string): string {
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const clean = withSlash.split(/[?#]/)[0] || "/";
  return new URL(clean, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
}

/** Collapse whitespace and keep meta descriptions within a typical snippet length. */
export function metaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;

  const sliced = normalized.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const trimmed = (lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).replace(/[.,;:]+$/, "");
  return `${trimmed}…`;
}

export function publicPageMetadata({
  title,
  description,
  pathname,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  pathname: string;
  absoluteTitle?: boolean;
}): Metadata {
  const summary = metaDescription(description);
  const url = canonicalUrl(pathname);
  // Social titles are absolute so the root title template cannot append the site name twice.
  const socialTitle = { absolute: absoluteTitle ? title : `${title} | ${SITE_NAME}` };

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: summary,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description: summary,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: summary,
    },
  };
}

/** Private and not-found routes: unique titles, and noindex so they stay out of search. */
export function privatePageMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description: metaDescription(description),
    robots: { index: false, follow: true },
  };
}

/**
 * JSON-LD for a script tag. `<` is escaped so a description cannot close the tag.
 */
export function escapeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Full address text for HTML. Appends city and state when the stored line omits them. */
export function visibleAddress(park: Pick<Park, "address" | "city">): string {
  const address = park.address.trim();
  const hasCity = address.toLowerCase().includes(park.city.trim().toLowerCase());
  const hasRegion = /\b(?:GA|Georgia)\b/i.test(address);
  const extras = [hasCity ? null : park.city.trim(), hasRegion ? null : "GA"].filter(
    (part): part is string => Boolean(part),
  );
  return extras.length ? `${address}, ${extras.join(", ")}` : address;
}

function breadcrumbList(items: { name: string; pathname: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.pathname),
    })),
  };
}

function parkListItem(park: { name: string; slug: string }, position: number) {
  return {
    "@type": "ListItem",
    position,
    name: park.name,
    url: canonicalUrl(`/parks/${park.slug}`),
  };
}

export function homeStructuredData(parks: readonly { name: string; slug: string }[]) {
  const url = canonicalUrl("/");
  const description = HOME_DESCRIPTION;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: SITE_NAME,
        url,
        description,
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: SITE_NAME,
        url,
        description,
        publisher: { "@id": `${url}#organization` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#parks`,
        name: "Dog parks inside I-285",
        numberOfItems: parks.length,
        itemListElement: parks.map((park, index) => parkListItem(park, index + 1)),
      },
    ],
  };
}

export function neighborhoodStructuredData(
  neighborhood: { name: string; slug: string },
  parks: readonly { name: string; slug: string }[],
) {
  const url = canonicalUrl(`/neighborhoods/${neighborhood.slug}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList([
        { name: "Neighborhoods", pathname: "/neighborhoods" },
        { name: neighborhood.name, pathname: `/neighborhoods/${neighborhood.slug}` },
      ]),
      {
        "@type": "ItemList",
        "@id": `${url}#parks`,
        name: `Dog parks in ${neighborhood.name}`,
        numberOfItems: parks.length,
        itemListElement: parks.map((park, index) => parkListItem(park, index + 1)),
      },
    ],
  };
}

export function parkStructuredData(park: Park) {
  const parkUrl = canonicalUrl(`/parks/${park.slug}`);
  const neighborhoodPath = `/neighborhoods/${toSlug(park.neighborhood)}`;
  const shared: Record<string, unknown> = {
    name: park.name,
    description: park.description,
    url: parkUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: park.address,
      addressLocality: park.city,
      addressRegion: "GA",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: park.lat,
      longitude: park.lng,
    },
  };

  if (park.hours && SCHEMA_OPENING_HOURS.test(park.hours)) {
    shared.openingHours = park.hours;
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Park",
      "@id": `${parkUrl}#park`,
      ...shared,
      isAccessibleForFree: park.fees.free,
    },
  ];

  if (park.type === "business") {
    graph.push({
      "@type": "LocalBusiness",
      "@id": `${parkUrl}#business`,
      ...shared,
      isAccessibleForFree: park.fees.free,
      ...(park.fees.free ? { priceRange: "Free" } : { priceRange: "$" }),
      ...(park.website ? { sameAs: [park.website] } : {}),
    });
  }

  graph.push(
    breadcrumbList([
      { name: "Parks", pathname: "/" },
      { name: park.neighborhood, pathname: neighborhoodPath },
      { name: park.name, pathname: `/parks/${park.slug}` },
    ]),
  );

  return { "@context": "https://schema.org", "@graph": graph };
}
