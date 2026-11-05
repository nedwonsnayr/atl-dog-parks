import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { PRIVATE_PATH_PREFIXES, canonicalUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_PATH_PREFIXES],
    },
    sitemap: canonicalUrl("/sitemap.xml"),
    host: new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin,
  };
}
