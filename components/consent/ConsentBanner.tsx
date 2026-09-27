"use client";

import Link from "next/link";
import Script from "next/script";
import { useState, useSyncExternalStore } from "react";
import {
  CONSENT_MODE_BOOTSTRAP,
  readAdvertisingConsent,
  setAdvertisingConsent,
  subscribeToAdvertisingConsent,
  type AdvertisingConsent,
} from "./consent-mode";

type ConsentSnapshot = AdvertisingConsent | null | "loading";

function getServerConsent(): ConsentSnapshot {
  return "loading";
}

export default function ConsentBanner() {
  const choice = useSyncExternalStore<ConsentSnapshot>(
    subscribeToAdvertisingConsent,
    readAdvertisingConsent,
    getServerConsent,
  );
  const [editing, setEditing] = useState(false);

  function saveChoice(nextChoice: AdvertisingConsent) {
    setAdvertisingConsent(nextChoice);
    setEditing(false);
  }

  const showBanner = choice !== "loading" && (choice === null || editing);

  return (
    <>
      {/* This component is mounted by the root layout, so Next injects the bootstrap in <head>. */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <Script
        id="consent-mode-defaults"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: CONSENT_MODE_BOOTSTRAP }}
      />
      {showBanner ? (
        <section
          data-testid="consent-banner"
          aria-label="Advertising privacy choices"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-zinc-300 bg-white p-5 text-zinc-950 shadow-2xl"
        >
          <h2 className="text-lg font-semibold">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6">
            ATL Dog Parks is free to use. With your permission, advertising partners may use cookies
            or similar technology to show and measure ads. Rejecting is always available, and the
            park directory still works either way. Read our{" "}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              data-testid="consent-reject"
              onClick={() => saveChoice("denied")}
              className="rounded-md border border-zinc-500 px-4 py-2 text-sm font-medium"
            >
              Reject nonessential cookies
            </button>
            <button
              type="button"
              data-testid="consent-accept"
              onClick={() => saveChoice("granted")}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
            >
              Allow advertising cookies
            </button>
          </div>
        </section>
      ) : null}
      {choice !== "loading" && choice !== null && !editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="fixed bottom-3 left-3 z-40 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 shadow"
        >
          Privacy choices
        </button>
      ) : null}
    </>
  );
}
