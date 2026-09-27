import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { getAllParks, getNeighborhoods } from "@/lib/parks";

const absoluteUrl = (pathname: string) =>
  new URL(pathname, publicEnv.NEXT_PUBLIC_SITE_URL).toString();

export default function sitemap(): MetadataRoute.Sitemap {
  const parks = getAllParks();
  const latestVerification = parks.reduce(
    (latest, park) => (park.lastVerified > latest ? park.lastVerified : latest),
    "2026-01-01",
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    {
      url: absoluteUrl("/neighborhoods"),
      lastModified: latestVerification,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: absoluteUrl("/submit"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];
  const parkRoutes: MetadataRoute.Sitemap = parks.map((park) => ({
    url: absoluteUrl(`/parks/${park.slug}`),
    lastModified: park.lastVerified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));
  const neighborhoodRoutes: MetadataRoute.Sitemap = getNeighborhoods().map((neighborhood) => ({
    url: absoluteUrl(`/neighborhoods/${neighborhood.slug}`),
    lastModified: latestVerification,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...parkRoutes, ...neighborhoodRoutes];
}
