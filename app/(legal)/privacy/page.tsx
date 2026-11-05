import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy policy",
  description:
    "How ATL Dog Parks handles browsing, browser location, accounts, submissions, cookies, and advertising choices.",
  pathname: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <header className="space-y-3">
        <h1>Privacy policy</h1>
        <p className="text-sm text-zinc-600">Effective September 27, 2026</p>
        <p>
          This policy explains the information ATL Dog Parks processes when you browse the
          directory, use location sorting, create an account, contribute content, or choose whether
          to allow advertising cookies.
        </p>
      </header>

      <section className="space-y-3">
        <h2>Browsing and location</h2>
        <p>
          You can browse the directory without an account. Like most hosted websites, our hosting
          provider may process basic request information such as your IP address, browser type,
          requested URL, timestamps, and security events to deliver and protect the service.
        </p>
        <p>
          “Near me” uses your browser&apos;s Geolocation API only after you grant browser
          permission. Your coordinates stay in your browser for distance sorting and are not sent to
          ATL Dog Parks, stored in an account, or included in advertising requests by this feature.
          You can revoke location access in your browser settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Accounts and contributions</h2>
        <p>
          If you create an account, Supabase processes your email address, authentication records,
          account identifiers, and optional public display name. Your email is used for sign-in and
          account security and is not displayed publicly.
        </p>
        <p>
          Reviews, park proposals, and corrections include the content you submit, your account
          identifier, moderation status, and relevant timestamps. Approved reviews and public
          display names may be visible to everyone. Pending or rejected material is available only
          as needed for account access, moderation, abuse prevention, and legal compliance.
        </p>
        <p>
          Do not put private information in public-facing submissions. Contributions may be
          reviewed, edited for formatting, rejected, or removed under our moderation rules.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Advertising, cookies, and consent</h2>
        <p>
          Advertising is feature-flagged. When it is disabled, ATL Dog Parks does not render ad
          slots or request the Google AdSense script. When advertising is enabled, Google ad code
          loads only after you choose “Allow advertising cookies.” Google may then use cookies or
          similar identifiers to deliver, limit, personalize, and measure ads according to your
          settings and Google&apos;s policies.
        </p>
        <p>
          Consent Mode defaults advertising storage, ad user data, ad personalization, and analytics
          storage to denied. Rejecting nonessential cookies does not restrict access to the
          directory. You can change your selection using the “Privacy choices” control. You can also
          clear site data in your browser.
        </p>
        <p>
          The built-in preference banner is not represented as a Google-certified consent management
          platform. Before serving ads in production, the site operator must configure a
          Google-certified CMP for regions where Google requires one, connect it to Consent Mode v2,
          verify regional behavior, and keep the vendor disclosures and policy links current. Ads
          must remain disabled until that production configuration is complete.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Service providers</h2>
        <ul>
          <li>Vercel hosts and delivers the application.</li>
          <li>Supabase provides authentication and stores account and contribution records.</li>
          <li>OpenFreeMap or MapTiler may receive network information when map tiles load.</li>
          <li>
            Cloudflare Turnstile may process device and request signals to prevent form abuse.
          </li>
          <li>Google processes advertising data only after advertising consent and activation.</li>
        </ul>
        <p>
          These providers process information under their own terms and privacy notices and may
          process it in other countries.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Retention, deletion, and your choices</h2>
        <p>
          We retain account and contribution records while they are needed to operate the service,
          resolve disputes, prevent abuse, and meet legal obligations. Moderation and security
          records may outlast public content when reasonably necessary.
        </p>
        <p>
          Signed-in users can edit or delete their own review and request account deletion from the
          account page. You may also request access, correction, or deletion by following the
          instructions on the <Link href="/contact">contact page</Link>. We may need to verify your
          identity and may retain limited records where law or security requires it. Depending on
          where you live, you may also have rights to know, correct, delete, or limit certain
          processing without discriminatory treatment.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Children and policy changes</h2>
        <p>
          ATL Dog Parks is a general-audience directory and is not directed to children under 13.
          Please do not submit a child&apos;s personal information.
        </p>
        <p>
          Material changes will be posted here with a new effective date. Contact us with privacy
          questions or requests using the <Link href="/contact">contact information</Link>.
        </p>
      </section>
    </>
  );
}
