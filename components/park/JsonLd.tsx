import { publicEnv } from "@/lib/env";
import type { Park } from "@/lib/schema";

export default function JsonLd({ park }: { park: Park }) {
  const parkUrl = new URL(`/parks/${park.slug}`, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
  const shared = {
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
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Park",
      "@id": `${parkUrl}#park`,
      ...shared,
      isAccessibleForFree: park.fees.free,
      openingHours: park.hours,
    },
  ];

  if (park.type === "business") {
    graph.push({
      "@type": "LocalBusiness",
      "@id": `${parkUrl}#business`,
      ...shared,
      sameAs: park.website ? [park.website] : undefined,
      priceRange: park.fees.free ? "Free" : "$",
    });
  }

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
    /</g,
    "\\u003c",
  );

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
