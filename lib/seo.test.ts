import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { publicEnv } from "@/lib/env";
import { getAllParks, getNeighborhoods, getParkBySlug } from "@/lib/parks";
import {
  HOME_TITLE,
  PRIVATE_PATH_PREFIXES,
  PUBLIC_STATIC_PATHS,
  canonicalUrl,
  escapeJsonLd,
  homeStructuredData,
  metaDescription,
  neighborhoodStructuredData,
  parkStructuredData,
  publicPageMetadata,
  visibleAddress,
} from "@/lib/seo";

const siteOrigin = new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin;

describe("canonicalUrl", () => {
  it("builds absolute URLs from NEXT_PUBLIC_SITE_URL and drops filter queries", () => {
    expect(canonicalUrl("/")).toBe(new URL("/", siteOrigin).toString());
    expect(canonicalUrl("/?amenity=fenced&sort=distance")).toBe(canonicalUrl("/"));
    expect(canonicalUrl("/neighborhoods/midtown?type=business")).toBe(
      canonicalUrl("/neighborhoods/midtown"),
    );
    expect(canonicalUrl("/parks/piedmont-park-dog-park?view=map")).toBe(
      canonicalUrl("/parks/piedmont-park-dog-park"),
    );
  });
});

describe("publicPageMetadata", () => {
  it("canonicalizes shareable filter URLs to the unfiltered page", () => {
    const metadata = publicPageMetadata({
      title: "Dog parks in Midtown",
      description: "Compare dog parks in Midtown, Atlanta.",
      pathname: "/neighborhoods/midtown?amenity=water",
    });

    expect(metadata.alternates).toEqual({
      canonical: canonicalUrl("/neighborhoods/midtown"),
    });
    expect(metadata.openGraph).toMatchObject({
      title: { absolute: "Dog parks in Midtown | ATL Dog Parks" },
      url: canonicalUrl("/neighborhoods/midtown"),
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: { absolute: "Dog parks in Midtown | ATL Dog Parks" },
    });
  });
});

describe("metaDescription", () => {
  it("truncates long copy on a word boundary", () => {
    const summary = metaDescription(`${"amenities ".repeat(30)}and directions`);
    expect(summary.length).toBeLessThanOrEqual(160);
    expect(summary.endsWith("…")).toBe(true);
  });
});

describe("escapeJsonLd", () => {
  it("escapes characters that can break out of a script tag", () => {
    const html = escapeJsonLd({ description: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("</");
    expect(html).toContain("\\u003c");
  });
});

describe("structured data", () => {
  it("describes the site without a search-action URL", () => {
    const data = homeStructuredData([
      { name: "Piedmont Park Dog Park", slug: "piedmont-park-dog-park" },
    ]);
    const types = data["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(["Organization", "WebSite", "ItemList"]);
    expect(JSON.stringify(data)).not.toContain("SearchAction");
    expect(data["@graph"][1]).toMatchObject({ name: "ATL Dog Parks", url: canonicalUrl("/") });
  });

  it("emits Park, and LocalBusiness only for businesses, plus breadcrumbs", () => {
    const publicPark = getParkBySlug("piedmont-park-dog-park");
    const business = getParkBySlug("fetch-park-buckhead");
    expect(publicPark).toBeDefined();
    expect(business).toBeDefined();

    const publicGraph = parkStructuredData(publicPark!)["@graph"];
    expect(publicGraph.map((node) => node["@type"])).toEqual(["Park", "BreadcrumbList"]);
    expect(publicGraph[0]).not.toHaveProperty("openingHours");

    const businessGraph = parkStructuredData(business!)["@graph"];
    expect(businessGraph.map((node) => node["@type"])).toEqual([
      "Park",
      "LocalBusiness",
      "BreadcrumbList",
    ]);
    expect(businessGraph[1]).toMatchObject({
      "@type": "LocalBusiness",
      sameAs: ["https://fetchpark.com/"],
    });
  });

  it("lists neighborhood parks and a breadcrumb trail", () => {
    const data = neighborhoodStructuredData({ name: "Midtown", slug: "midtown" }, [
      { name: "Piedmont Park Dog Park", slug: "piedmont-park-dog-park" },
    ]);
    expect(data["@graph"].map((node) => node["@type"])).toEqual(["BreadcrumbList", "ItemList"]);
    expect(data["@graph"][1]).toMatchObject({ numberOfItems: 1 });
  });
});

describe("visibleAddress", () => {
  it("keeps a complete stored address and fills a street-only line", () => {
    expect(
      visibleAddress({
        address: "400 Park Drive Northeast, Atlanta, GA 30306",
        city: "Atlanta",
      }),
    ).toBe("400 Park Drive Northeast, Atlanta, GA 30306");
    expect(visibleAddress({ address: "100 Park Lane", city: "Atlanta" })).toBe(
      "100 Park Lane, Atlanta, GA",
    );
  });
});

describe("sitemap and robots", () => {
  it("lists public pages and omits private routes and filter queries", () => {
    const urls = sitemap().map((entry) => entry.url);
    const paths = urls.map((url) => new URL(url).pathname);

    for (const path of PUBLIC_STATIC_PATHS) {
      expect(paths).toContain(path);
    }
    for (const park of getAllParks()) {
      expect(paths).toContain(`/parks/${park.slug}`);
    }
    for (const neighborhood of getNeighborhoods()) {
      expect(paths).toContain(`/neighborhoods/${neighborhood.slug}`);
    }
    for (const prefix of PRIVATE_PATH_PREFIXES) {
      expect(paths.some((path) => path === prefix || path.startsWith(`${prefix}/`))).toBe(false);
    }
    expect(urls.some((url) => url.includes("?"))).toBe(false);
    expect(urls.every((url) => url.startsWith(siteOrigin))).toBe(true);
  });

  it("allows public pages and disallows admin, account, auth, and api", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule?.allow).toBe("/");
    expect(rule?.disallow).toEqual([...PRIVATE_PATH_PREFIXES]);
    expect(robots().sitemap).toBe(canonicalUrl("/sitemap.xml"));
  });

  it("uses the home title constant on the default document title", () => {
    expect(HOME_TITLE).toContain("ATL Dog Parks");
    expect(HOME_TITLE).toContain("I-285");
  });
});
