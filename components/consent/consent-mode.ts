export const CONSENT_STORAGE_KEY = "atl-dog-parks-ad-consent";
export const CONSENT_CHANGE_EVENT = "atl-dog-parks:consent-change";

export type AdvertisingConsent = "granted" | "denied";

type GtagArguments = [command: "consent", action: "default" | "update", parameters: ConsentState];

type ConsentState = {
  ad_storage: AdvertisingConsent;
  analytics_storage: AdvertisingConsent;
  ad_user_data: AdvertisingConsent;
  ad_personalization: AdvertisingConsent;
  wait_for_update?: number;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: GtagArguments) => void;
  }
}

let inMemoryConsent: AdvertisingConsent | null = null;

function consentState(choice: AdvertisingConsent): ConsentState {
  return {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  };
}

export function initializeConsentMode() {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: GtagArguments) {
      window.dataLayer.push(args);
    };

  if (!window.__atlDogParksConsentInitialized) {
    window.gtag("consent", "default", {
      ...consentState("denied"),
      wait_for_update: 500,
    });
    window.__atlDogParksConsentInitialized = true;
  }
}

export function readAdvertisingConsent(): AdvertisingConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "granted" || value === "denied") {
      inMemoryConsent = value;
    }
  } catch {
    // The in-memory choice keeps controls functional when storage is unavailable.
  }
  return inMemoryConsent;
}

export function setAdvertisingConsent(choice: AdvertisingConsent) {
  initializeConsentMode();
  inMemoryConsent = choice;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Consent signaling still applies when browser storage is unavailable.
  }
  window.gtag("consent", "update", consentState(choice));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
}

export function subscribeToAdvertisingConsent(onChange: () => void) {
  initializeConsentMode();

  function handleStorage(event: StorageEvent) {
    if (event.key === CONSENT_STORAGE_KEY) onChange();
  }

  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export const CONSENT_MODE_BOOTSTRAP = `
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });
  window.__atlDogParksConsentInitialized = true;
  try {
    var choice = window.localStorage.getItem("${CONSENT_STORAGE_KEY}");
    if (choice === "granted" || choice === "denied") {
      window.gtag("consent", "update", {
        ad_storage: choice,
        analytics_storage: choice,
        ad_user_data: choice,
        ad_personalization: choice
      });
    }
  } catch (_) {}
})();
`;

declare global {
  interface Window {
    __atlDogParksConsentInitialized?: boolean;
  }
}
