import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/ads/AdSlot";
import ParkMap from "@/components/map/ParkMap";
import AmenityBadges from "@/components/park/AmenityBadges";
import JsonLd from "@/components/park/JsonLd";
import MapLinks from "@/components/park/MapLinks";
import ReviewSection from "@/components/reviews/ReviewSection";
import SubmissionForm from "@/components/submissions/SubmissionForm";
import { getAllParks, getParkBySlug, getParksByNeighborhood } from "@/lib/parks";
import { privatePageMetadata, publicPageMetadata, visibleAddress } from "@/lib/seo";
import { toSlug } from "@/lib/slug";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllParks().map((park) => ({ slug: park.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const park = getParkBySlug(slug);
  if (!park) {
    return privatePageMetadata({
      title: "Park not found",
      description: "This dog park is not in the ATL Dog Parks directory.",
    });
  }

  return publicPageMetadata({
    title: park.name,
    description: `${park.name} in ${park.neighborhood}, ${park.city}. ${park.description}`,
    pathname: `/parks/${park.slug}`,
  });
}

export default async function ParkDetailPage({ params }: Props) {
  const { slug } = await params;
  const park = getParkBySlug(slug);
  if (!park) notFound();

  const neighborhoodSlug = toSlug(park.neighborhood);
  const relatedParks = getParksByNeighborhood(neighborhoodSlug).filter(
    (item) => item.slug !== park.slug,
  );
  const verifiedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${park.lastVerified}T00:00:00Z`));

  return (
    <article data-testid="park-detail" data-park-slug={park.slug} className="space-y-8 pb-8">
      <JsonLd park={park} />

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-emerald-700 hover:underline">
          Parks
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <Link
          href={`/neighborhoods/${neighborhoodSlug}`}
          className="hover:text-emerald-700 hover:underline"
        >
          {park.neighborhood}
        </Link>
      </nav>

      <header className="relative isolate overflow-hidden rounded-3xl bg-zinc-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.38),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.2),transparent_40%)]"
        />
        <div className="flex flex-wrap gap-2 text-sm font-bold uppercase tracking-wide text-emerald-300">
          <span>{park.type === "business" ? "Dog park business" : "Dog park"}</span>
          <span aria-hidden="true">•</span>
          <span>{park.neighborhood}</span>
        </div>
        <h1
          data-testid="park-name"
          className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl"
        >
          {park.name}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">{park.description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <MapLinks park={park} />
          {park.website && (
            <a
              href={park.website}
              data-testid="park-website-link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Official website
              <span className="ml-1.5" aria-hidden="true">
                ↗
              </span>
            </a>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <section aria-labelledby="amenities-heading" className="space-y-4">
            <h2 id="amenities-heading" className="text-2xl font-bold tracking-tight">
              Amenities
            </h2>
            <AmenityBadges amenities={park.amenities} />
          </section>

          <section
            aria-labelledby="visit-heading"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 id="visit-heading" className="text-2xl font-bold tracking-tight">
              Plan your visit
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Address</dt>
                <dd className="mt-1">
                  <address className="not-italic leading-6">{visibleAddress(park)}</address>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Hours</dt>
                <dd className="mt-1 leading-6">{park.hours ?? "Check before visiting"}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Cost</dt>
                <dd className="mt-1 leading-6">
                  {park.fees.free ? "Free" : (park.fees.details ?? "Fee required")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Permit</dt>
                <dd className="mt-1 leading-6">
                  {park.permitRequired ? "Required" : "Not required"}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="rules-heading">
            <h2 id="rules-heading" className="text-2xl font-bold tracking-tight">
              Know before you go
            </h2>
            {park.rules.length ? (
              <ul className="mt-4 space-y-3">
                {park.rules.map((rule) => (
                  <li key={rule} className="flex gap-3 leading-6 text-zinc-700 dark:text-zinc-300">
                    <span aria-hidden="true" className="mt-1 text-emerald-600">
                      ✓
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-zinc-600 dark:text-zinc-300">
                No specific rules are listed. Follow posted signs and local park rules.
              </p>
            )}
          </section>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <ParkMap parks={[park]} className="w-full border-0" />
          </div>

          <section aria-labelledby="nearby-heading">
            <h2 id="nearby-heading" className="text-2xl font-bold tracking-tight">
              More dog parks in {park.neighborhood}
            </h2>
            {relatedParks.length ? (
              <ul className="mt-4 space-y-2">
                {relatedParks.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/parks/${related.slug}`}
                      className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                    >
                      {related.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-zinc-600 dark:text-zinc-300">
                This is the only listing in {park.neighborhood} right now.
              </p>
            )}
            <Link
              href={`/neighborhoods/${neighborhoodSlug}`}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            >
              All dog parks in {park.neighborhood}
            </Link>
          </section>

          <ReviewSection parkSlug={park.slug} />

          <section
            id="report-issue"
            aria-labelledby="report-heading"
            className="scroll-mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950"
          >
            <h2 id="report-heading" className="text-xl font-bold">
              Something changed?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Help keep this listing useful by sharing updated hours, amenities, or access rules.
            </p>
            <div className="mt-4">
              <SubmissionForm parkSlug={park.slug} />
            </div>
          </section>

          <AdSlot slot="detail-footer" />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Data confidence
            </p>
            <p data-testid="park-last-verified" className="mt-2 font-bold">
              Last verified {verifiedDate}
            </p>
            <a
              href="#report-issue"
              data-testid="report-issue-link"
              className="mt-3 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            >
              Report an issue
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-bold">Sources</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {park.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
                  >
                    {source.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <AdSlot slot="detail-sidebar" />
        </aside>
      </div>
    </article>
  );
}
