"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import type { AdSlotProps } from "@/components/contracts";
import {
  readAdvertisingConsent,
  subscribeToAdvertisingConsent,
  type AdvertisingConsent,
} from "@/components/consent/consent-mode";

const reservedSpace: Record<AdSlotProps["slot"], string> = {
  "list-inline": "min-h-[100px] sm:min-h-[90px]",
  "detail-sidebar": "min-h-[250px] lg:min-h-[600px]",
  "detail-footer": "min-h-[100px] sm:min-h-[250px]",
};

type AdSlotClientProps = AdSlotProps & {
  client: string;
};

type ConsentSnapshot = AdvertisingConsent | null | "loading";

function getServerConsent(): ConsentSnapshot {
  return "loading";
}

export default function AdSlotClient({ slot, className = "", client }: AdSlotClientProps) {
  const consent = useSyncExternalStore<ConsentSnapshot>(
    subscribeToAdvertisingConsent,
    readAdvertisingConsent,
    getServerConsent,
  );

  return (
    <aside
      data-testid={`ad-slot-${slot}`}
      data-ad-state={consent === "granted" ? "eligible" : "consent-required"}
      aria-label="Advertisement"
      className={`flex w-full items-center justify-center overflow-hidden bg-zinc-50 text-xs text-zinc-500 ${reservedSpace[slot]} ${className}`}
    >
      <span>Advertisement</span>
      {consent === "granted" ? (
        <Script
          id="google-adsense"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      ) : null}
    </aside>
  );
}
