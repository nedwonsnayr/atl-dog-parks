import JsonLdScript from "@/components/seo/JsonLdScript";
import type { Park } from "@/lib/schema";
import { parkStructuredData } from "@/lib/seo";

export default function JsonLd({ park }: { park: Park }) {
  return <JsonLdScript data={parkStructuredData(park)} />;
}
