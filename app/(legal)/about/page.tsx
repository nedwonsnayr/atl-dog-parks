import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "About",
  description:
    "How ATL Dog Parks sources, reviews, and publishes its free directory of dog parks inside I-285.",
  pathname: "/about",
});

export default function AboutPage() {
  return (
    <>
      <header className="space-y-3">
        <h1>About ATL Dog Parks</h1>
        <p className="text-lg text-zinc-700">
          ATL Dog Parks is an independent, free directory for finding dog parks inside I-285.
        </p>
      </header>

      <section className="space-y-3">
        <h2>What the directory covers</h2>
        <p>
          We include public parks, dog-friendly businesses, and clearly identified private or HOA
          facilities whose coordinates fall inside the Perimeter. Listings describe practical
          details such as fencing, separate small-dog areas, water, shade, surfaces, fees, hours,
          parking, and permit requirements.
        </p>
        <p>
          Browsing, searching, maps, directions, and approved reviews are available without an
          account or paywall. A verified account is required only to submit a review, propose a
          park, or suggest a correction.
        </p>
      </section>

      <section className="space-y-3">
        <h2>How information is maintained</h2>
        <p>
          Park facts come from official park and business websites, OpenStreetMap, local agency
          data, and community corrections. Automated checks can identify changes, but a person
          reviews proposed updates before publication. Each listing identifies its sources and shows
          when it was last verified.
        </p>
        <p>
          Conditions, rules, fees, and hours can change without notice. Always confirm important
          details with the operator before visiting. ATL Dog Parks is not affiliated with the City
          of Atlanta, any other government, or any listed park or business.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Funding and editorial independence</h2>
        <p>
          The directory is intended to stay free. Advertising may help cover hosting and
          maintenance, but advertising does not determine whether a park is listed or how its
          factual details are presented. Ads load only when they are enabled and the visitor has
          allowed advertising cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Licensing and corrections</h2>
        <p>
          OpenStreetMap-derived information is used under the Open Database License and attributed
          to OpenStreetMap contributors. Other source material remains subject to its original
          license. Original site text and design are not automatically licensed for reuse.
        </p>
        <p>
          See the <Link href="/contact">contact page</Link> to report inaccurate information,
          request attribution, or raise a licensing or takedown concern.
        </p>
      </section>
    </>
  );
}
