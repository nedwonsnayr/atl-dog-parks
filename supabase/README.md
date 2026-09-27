# Local Supabase development

The Supabase CLI runs Postgres, Auth, Studio, Inbucket, and the API in Docker.
Install Docker Desktop and the Supabase CLI, then run from the repository root:

```sh
supabase start
supabase status -o env
```

Copy `.env.example` to `.env.local`, then copy the `API_URL`, `ANON_KEY`, and
`SERVICE_ROLE_KEY` values printed by `supabase status -o env` into the matching
application variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=
```

Do not commit `.env.local`. Retrieve the values again at any time with
`supabase status -o env`. Local service URLs are:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Inbucket email UI: `http://127.0.0.1:54324`
- Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Apply all migrations and seed from a clean database:

```sh
supabase db reset
npm run dev
```

The local startup sequence is therefore `supabase start`, copy status values to
`.env.local`, `supabase db reset`, then `npm run dev`.

After creating a migration with `supabase migration new <name>`, apply pending
migrations without resetting data:

```sh
supabase migration up
```

Magic-link messages appear in Inbucket. Google OAuth is disabled locally by
default; set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
`SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, enable the provider in `config.toml`,
and use the callback URL reported by Supabase when configuring Google.

Turnstile may be omitted only during non-production development. The server
bypasses verification when no secret is configured outside production; deployed
production requests fail closed if Turnstile or Upstash is not configured.

To grant an existing local user moderator access, run this in Studio's SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<auth user uuid>';
```

Stop containers with `supabase stop`. Use `supabase stop --no-backup` when local
database state should also be discarded.
