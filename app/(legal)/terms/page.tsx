import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of use",
  description:
    "Terms for browsing ATL Dog Parks and for submitting reviews, park suggestions, and corrections.",
  pathname: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <header className="space-y-3">
        <h1>Terms of use</h1>
        <p className="text-sm text-zinc-600">Effective September 27, 2026</p>
        <p>
          These terms apply when you use ATL Dog Parks. By using the service, you agree to follow
          them. If you do not agree, do not use the service or submit content.
        </p>
      </header>

      <section className="space-y-3">
        <h2>Free directory; no professional advice</h2>
        <p>
          ATL Dog Parks provides free, general information about dog parks and related businesses.
          It is not a government service, veterinary service, safety inspection, reservation system,
          or guarantee of access. No account is required to browse.
        </p>
        <p>
          Park conditions, boundaries, fees, rules, hours, amenities, and dog eligibility can change
          or be reported incorrectly. Confirm important details with the park operator, follow
          posted rules and applicable law, supervise your dog, and make your own safety decisions.
          You visit parks and use third-party services at your own risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Accounts and acceptable use</h2>
        <p>
          A verified email account is required to write reviews or submit park information. You are
          responsible for activity under your account and for keeping access to your email secure.
        </p>
        <p>You may not:</p>
        <ul>
          <li>submit unlawful, threatening, deceptive, discriminatory, or harassing material;</li>
          <li>impersonate another person or misrepresent your relationship with a park;</li>
          <li>
            post personal information, spam, undisclosed paid endorsements, or malicious links;
          </li>
          <li>
            interfere with the service, evade rate limits, scrape accounts, or test security without
            permission;
          </li>
          <li>submit material you do not have the right to share.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>User contributions and moderation</h2>
        <p>
          You keep ownership of content you submit. You grant ATL Dog Parks a nonexclusive,
          worldwide, royalty-free license to host, reproduce, format, moderate, display, and
          distribute that content as needed to operate and promote the directory. You represent that
          your submission is accurate to the best of your knowledge and that you have the rights
          needed to grant this license.
        </p>
        <p>
          Submissions do not publish automatically. We may approve, reject, edit for formatting,
          investigate, or remove content at our discretion, including material that is off-topic,
          unverified, unsafe, infringing, or inconsistent with these terms. We do not promise to
          preserve or publish any contribution.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Site content, data sources, and takedowns</h2>
        <p>
          The site&apos;s original text, design, and software are protected by applicable
          intellectual-property laws. OpenStreetMap-derived data is available under the Open
          Database License and must retain its required attribution. Government, business, and other
          third-party source material remains subject to the source&apos;s terms and license.
        </p>
        <p>
          If you believe site content infringes your rights, identify the work, the disputed
          material and URL, your contact details, your good-faith basis, and your authority to act.
          Send the request through the <Link href="/contact">contact page</Link>. We may remove or
          restrict material while evaluating a complete request.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Advertising and external services</h2>
        <p>
          The service may display clearly identified advertising after the required activation and
          consent. Advertisers do not control directory inclusion or factual editorial decisions.
          Links, maps, ads, and services supplied by others are governed by their own terms. ATL Dog
          Parks is not responsible for third-party availability, content, transactions, or
          practices.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Availability, disclaimers, and liability</h2>
        <p>
          The service is provided “as is” and “as available,” without warranties of accuracy,
          completeness, merchantability, fitness for a particular purpose, noninfringement, or
          uninterrupted availability, to the fullest extent permitted by law.
        </p>
        <p>
          To the fullest extent permitted by law, ATL Dog Parks and its operators will not be liable
          for indirect, incidental, special, consequential, or punitive damages, or for loss arising
          from reliance on a listing, a park visit, another user&apos;s content, or a third-party
          service. Rights that cannot legally be waived remain unaffected.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Enforcement and changes</h2>
        <p>
          We may restrict contributions, suspend accounts, or discontinue features when reasonably
          needed for safety, security, legal compliance, or operation of the service. We may update
          these terms by posting a revised effective date. Continued use after an update means you
          accept the revised terms.
        </p>
        <p>
          Questions about these terms can be sent using the{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </>
  );
}
