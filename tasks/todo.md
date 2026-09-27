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

- [ ] S1 Data: ITP boundary, `lib/geo.ts`, `lib/mapLinks.ts`, validate script, 15+ real parks
- [ ] S2 Pages: home + filters + near me, park detail, neighborhoods, JSON-LD, sitemap/robots/OG
- [ ] S3 Map: MapLibre, clustering, popups, selection sync, lazy loading
- [ ] S4 Ads/compliance: AdSlot, ConsentBanner + Consent Mode v2, CSP, ads.txt, legal pages
- [ ] S5 Backend: Supabase migrations + RLS, auth, account, reviews/submissions, Turnstile, rate limits, admin
- [ ] S6 Scraper: Overpass + municipal adapters, merge with manualOverrides, link checker, workflow
- [ ] S7 QA infra: CI, Playwright, Lighthouse CI, RLS test script

## Phase 2: Integration

- [ ] Merge S1, S4, S3, S2, S5, S6, S7 in order
- [ ] Replace all stubs; remove fixtures covered by real data
- [ ] Enable `test.fixme` specs; full suite, Lighthouse (ads on/off), RLS script
- [ ] Vercel project + env, production Supabase migrations, deploy

## Review

- Phase 0: see notes above.
