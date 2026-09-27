# atl-dog-parks

A directory of dog parks inside the Perimeter (I-285) of Atlanta, GA. Built with Next.js
(App Router), TypeScript, and Tailwind, deployed on Vercel. Park data lives in
`data/parks/*.json`; reviews and submissions run on Supabase.

## Development

```bash
npm install
cp .env.example .env.local   # optional; everything works with no env set
npm run dev
```

## Scripts

| Script                   | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | Local dev server                        |
| `npm run build`          | Production build                        |
| `npm run lint`           | ESLint                                  |
| `npm run typecheck`      | `tsc --noEmit`                          |
| `npm test`               | Unit tests (Vitest)                     |
| `npm run test:e2e`       | E2E tests (Playwright)                  |
| `npm run validate:parks` | Validate park JSON and the ITP boundary |
| `npm run scrape`         | Refresh park data from sources          |
| `npm run format`         | Prettier                                |

See `docs/testids.md` for the E2E selector contract and `tasks/todo.md` for build status.
