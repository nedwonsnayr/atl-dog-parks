import { escapeJsonLd } from "@/lib/seo";

export default function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }} />
  );
}
