# Production consent and ads

`ConsentBanner` is a first-party preference control. It initializes Google Consent Mode v2 with
`ad_storage`, `analytics_storage`, `ad_user_data`, and `ad_personalization` denied, then records the
visitor's explicit advertising choice in local storage. It is **not** a Google-certified consent
management platform (CMP).

Before enabling ads in production:

1. Obtain AdSense approval and configure `NEXT_PUBLIC_ADSENSE_CLIENT`.
2. Select and configure a Google-certified CMP for the EEA, UK, and any other applicable regions.
3. Connect the CMP to Consent Mode v2 and confirm denied signals are set before any Google ad
   request. Replace or integrate the first-party banner so visitors have one clear set of controls.
4. Verify accept, reject, withdrawal, regional behavior, vendor disclosures, and policy links.
5. Replace `public/ads.txt` with the exact authorized-seller line from AdSense.
6. Set `NEXT_PUBLIC_ADS_ENABLED=true` only after the preceding steps pass production validation.

`AdSlot` deliberately has no ad-unit ID contract. It reserves responsive space and consent-gates
the AdSense script; Phase 2 must provide approved ad-unit configuration if manual display units are
used. Do not invent or commit sample publisher or ad-unit IDs.
