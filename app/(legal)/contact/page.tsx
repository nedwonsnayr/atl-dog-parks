import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact ATL Dog Parks about corrections, privacy, licensing, or takedowns.",
};

export default function ContactPage() {
  return (
    <>
      <header className="space-y-3">
        <h1>Contact</h1>
        <p>
          Contact ATL Dog Parks at <a href="mailto:hello@atldogparks.com">hello@atldogparks.com</a>.
          Include the relevant page URL and enough detail for us to understand and route your
          request.
        </p>
      </header>

      <section className="space-y-3">
        <h2>Park corrections and new listings</h2>
        <p>
          For an incorrect amenity, rule, location, fee, or operating detail, identify the listing,
          the field that should change, and a reliable source such as an official park page. Use the
          park&apos;s “Report an issue” link when available. Proposed changes are reviewed before
          publication.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Privacy and account deletion</h2>
        <p>
          Signed-in users can request deletion from the account page. If you cannot access your
          account, email <a href="mailto:privacy@atldogparks.com">privacy@atldogparks.com</a> from
          the address associated with it. State whether you are requesting access, correction,
          deletion, or another privacy choice. We may ask for information needed to verify the
          request; do not email passwords or sensitive identity documents unless specifically
          instructed through a secure channel.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Licensing, attribution, and takedowns</h2>
        <p>
          Identify the material and exact URL, explain the rights or license involved, provide your
          contact information, and state whether you own the rights or are authorized to act for the
          owner. For an infringement notice, include a good-faith statement and an accurate
          statement of authority. Incomplete requests may take longer to evaluate.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Safety and emergencies</h2>
        <p>
          ATL Dog Parks does not operate the listed parks and cannot dispatch help. For an
          emergency, contact 911 or the appropriate local authority. For a dangerous condition,
          loose animal, closure, or rule violation, contact the park operator or local animal
          control directly, then let us know if the directory should be updated.
        </p>
      </section>
    </>
  );
}
