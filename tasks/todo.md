# ATL Dog Parks: build checklist

Source plan: `~/.cursor/plans/atl_dog_parks_site_c00f609e.plan.md`.

## Phase 0: Foundation

- [x] Scaffold Next.js (App Router, TS strict, Tailwind, ESLint, Prettier)
- [x] Install every planned dependency; add all `package.json` scripts
- [x] Contracts: `lib/schema.ts`, `lib/parks.ts`, `lib/filters.ts`, `lib/slug.ts`, `lib/env.ts` + `.env.example`, `components/contracts.ts`
- [x] Signatures for `lib/geo.ts`, `lib/mapLinks.ts`; `lib/csp.ts` stub wired into `next.config.ts`
- [x] Stub components: ParkMap, AdSlot, ConsentBanner, ReviewSection, SubmissionForm, AuthButton
- [x] 3 fixture parks in `data/parks/`; `docs/testids.md`
- [x] Layout shell and home placeholder
- [x] `typecheck`, `lint`, `test`, `build` pass

### Notes for Phase 1 streams

- Next.js 16: the `middleware.ts` convention is deprecated in favor of `proxy.ts`
  (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
  S5 should create `proxy.ts` instead of `middleware.ts`.
- Next.js 16 page `params` and `searchParams` are Promises; `parseFilters` accepts the
  awaited object or a `URLSearchParams`.
- `lib/parks.ts` uses `node:fs` (server only). Client code must import slug helpers from
  `lib/slug.ts` and filtering from `lib/filters.ts`, never from `lib/parks.ts`.
- Amenity flags are `boolean | null`; `null` means unknown and does not satisfy a filter.
- `getAllParks()` excludes `status: "draft"`; `flagged` parks are still shown.
- Only `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MAP_STYLE_URL` have defaults; everything
  else is optional. Use `adsEnabled` from `lib/env.ts` rather than reading the flag directly.

## Phase 1: Parallel streams

- [x] S1 Data: ITP boundary, `lib/geo.ts`, `lib/mapLinks.ts`, validate script, 15+ real parks
- [x] S2 Pages: home + filters + near me, park detail, neighborhoods, JSON-LD, sitemap/robots/OG
- [x] S3 Map: MapLibre, clustering, popups, selection sync, lazy loading
- [x] S4 Ads/compliance: AdSlot, ConsentBanner + Consent Mode v2, CSP, ads.txt, legal pages
- [x] S5 Backend: Supabase migrations + RLS, auth, account, reviews/submissions, Turnstile, rate limits, admin
- [x] S6 Scraper: Overpass + municipal adapters, merge with manualOverrides, link checker, workflow
- [x] S7 QA infra: CI, Playwright, Lighthouse CI, RLS test script

## Phase 2: Integration

- [x] Cherry-pick S1, S4, S3, S2, S5, S6, S7 in the planned order
- [x] Audit and replace every Phase 0 stub or placeholder
- [x] Wire synchronized list/map discovery, ads, consent, auth, reviews, and submissions
- [x] Verify free public reads and verified-account-only writes at UI and API layers
- [x] Audit park data, scraper ITP filtering, CSP, legal navigation, metadata routes, map accessibility, and ad gating
- [x] Activate relevant Playwright coverage and add focused integration tests
- [x] Document coherent local Supabase setup; RLS run only when the CLI is available
- [x] Run formatting, typecheck, lint, unit, data, build, E2E, Lighthouse, scraper, and audit checks
- [x] Check Vercel and Supabase deployment readiness; do not deploy without credentials
- [x] Commit integration fixes and verification documentation

## Review

Phase 2 is integrated on `feature/atl-dog-parks-integrated`. `main` and `origin/main` stay at `2592675`. Nothing was pushed.

### Commits

- `1832d34` S1, `d1fb9b5` S4, `7dc4031` S3, `12c9fe8` S2, `78956fc` S5, `ebfea54` S6, `faf95e0` S7, cherry-picked with no conflicts.
- `c30e58d` cherry-picks security audit `c8dc616` with no conflicts. It closes the auth open redirect, scraper SSRF, non-http park URLs, Turnstile/Redis fail-open outside development and test, and the CI job that passed `SUPABASE_SERVICE_ROLE_KEY` to `pull_request` workflows. `feature/security-audit` was not edited.

### Wiring

- `ParkExplorer` is the client parent for list/map selection. `ParkMap` stays lazy (`next/dynamic`, `ssr: false`). Near-me distance stays in the browser.
- `AdSlot`, `ConsentBanner`, `AuthButton`, `ReviewSection`, and `SubmissionForm` are mounted. `/submit` is a real page. Footer links privacy, terms, and contact; About is in the header. Sitemap includes those routes plus parks and neighborhoods. `robots.ts` and `sitemap.ts` build.
- Session refresh is `proxy.ts`. There is no `middleware.ts`.
- The scraper filters with S1 `isInsideITP` from `lib/geo.ts`.
- Ads render only when `NEXT_PUBLIC_ADS_ENABLED` is on and `NEXT_PUBLIC_ADSENSE_CLIENT` is set, and the ad script loads only after advertising consent.
- CSP allows OpenFreeMap, MapLibre demo tiles, MapTiler, Supabase `https`/`wss`, Turnstile, and the AdSense hosts the components use. Loopback Supabase or map origins are added only when `NODE_ENV` is `development`. `upgrade-insecure-requests` is added only for an https site origin.

### Verification

- `npm ci`, `format:check`, `typecheck`, `lint`, `npm test` (34 passed), `validate:parks` (15+ ITP parks), and `npm run build` passed after the security cherry-pick.
- Playwright: 11 passed, 1 skipped. The skip is `PLAYWRIGHT_SEEDED_REVIEWS` unset: it needs a Supabase project with an approved `freedom-barkway` review. Signed-out review and submission writes return 401 locally, and the signed-out UI hides both forms.
- Lighthouse, ads off (`NEXT_PUBLIC_ADS_ENABLED=false`, no publisher id), mobile, 3 runs: performance 91–94, accessibility 100, best-practices 96, SEO 100. LCP 3029–3461 ms (budget 3500). CLS 0. TBT 0 ms. Two render-blocking CSS warnings from Next stylesheets; they did not fail the run.
- These recommended-preset audits are off because they fail on this Next.js app without an app defect: `bf-cache` (dynamic `/` sends `Cache-Control: no-store`; Chrome marks it not actionable), `unused-javascript` and `legacy-javascript` (framework chunks and polyfills), `network-dependency-tree-insight` (score 0 on a same-origin CSS chain under 60 ms), and `inspector-issues` (Chrome logged a CSP issue with no URL while best-practices stayed at 96).
- `npm run scrape -- --dry-run` exited 0. Overpass returned 28 records, Atlanta GIS 0, Sandy Springs 1. Totals: fetched 29, inside ITP 21, added 8, updated 7, flagged 2, unchanged 6. No park files were written.
- `npm audit`: 10 issues (2 low, 1 moderate, 7 high), all through devDependency `@lhci/cli` (`lighthouse`, `puppeteer-core`, `extract-zip`, `tmp`, `uuid`). `npm audit --omit=dev` reports 0. No force-upgrade.
- Local RLS was not run. Docker Desktop's daemon responds, but the `supabase` CLI is not on `PATH`, and `.env.local` is absent. No containers were started.

### Deployment

Not deployed. There is no Vercel CLI, no `.vercel/project.json`, and no `.env.local`. Production still needs a Vercel project, a hosted Supabase project with migrations applied, and these variables: `NEXT_PUBLIC_SITE_URL` (https, so the CSP upgrade directive turns on), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Turnstile keys, and Upstash Redis. Leave ads disabled until an AdSense client id exists. Set `PLAYWRIGHT_SEEDED_REVIEWS` only for the optional review-fixture test. The RLS script runs in CI only on pushes to `main`, and it needs `RLS_TEST_UNVERIFIED_ACCESS_TOKEN` plus the Supabase secrets.
