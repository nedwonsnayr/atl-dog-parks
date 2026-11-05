import type { MetadataRoute } from "next";
import { getAllParks, getNeighborhoods } from "@/lib/parks";
import { PUBLIC_STATIC_PATHS, canonicalUrl } from "@/lib/seo";

const staticMeta: Record<
  (typeof PUBLIC_STATIC_PATHS)[number],
  Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">
> = {
  "/": { changeFrequency: "weekly", priority: 1 },
  "/neighborhoods": { changeFrequency: "weekly", priority: 0.8 },
  "/submit": { changeFrequency: "monthly", priority: 0.5 },
  "/about": { changeFrequency: "monthly", priority: 0.4 },
  "/privacy": { changeFrequency: "yearly", priority: 0.2 },
  "/terms": { changeFrequency: "yearly", priority: 0.2 },
  "/contact": { changeFrequency: "yearly", priority: 0.2 },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const parks = getAllParks();
  const latestVerification = parks.reduce(
    (latest, park) => (park.lastVerified > latest ? park.lastVerified : latest),
    "2026-01-01",
  );

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_STATIC_PATHS.map((pathname) => ({
    url: canonicalUrl(pathname),
    lastModified: latestVerification,
    ...staticMeta[pathname],
  }));
  const parkRoutes: MetadataRoute.Sitemap = parks.map((park) => ({
    url: canonicalUrl(`/parks/${park.slug}`),
    lastModified: park.lastVerified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));
  const neighborhoodRoutes: MetadataRoute.Sitemap = getNeighborhoods().map((neighborhood) => ({
    url: canonicalUrl(`/neighborhoods/${neighborhood.slug}`),
    lastModified: latestVerification,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...parkRoutes, ...neighborhoodRoutes];
}
