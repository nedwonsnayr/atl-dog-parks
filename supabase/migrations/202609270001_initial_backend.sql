create extension if not exists pgcrypto;

create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 50),
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  park_slug text not null check (park_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (park_slug, user_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  park_slug text check (park_slug is null or park_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_public_park_idx on public.reviews (park_slug, created_at desc)
  where status = 'approved';
create index submissions_owner_idx on public.submissions (user_id, created_at desc);

create or replace function public.is_verified_user(candidate uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = candidate
      and email_confirmed_at is not null
  );
$$;

create or replace function public.is_admin(candidate uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = candidate
      and role = 'admin'
  );
$$;

revoke all on function public.is_verified_user(uuid) from public;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_verified_user(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 50), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger reviews_updated_at before update on public.reviews
  for each row execute procedure public.set_updated_at();
create trigger submissions_updated_at before update on public.submissions
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.submissions enable row level security;

revoke select on public.profiles from anon, authenticated;
grant select (id, display_name) on public.profiles to anon;
grant select (id, display_name, role) on public.profiles to authenticated;

create policy "profiles are publicly readable"
  on public.profiles for select using (true);
create policy "users update their own display name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "approved reviews and own reviews are readable"
  on public.reviews for select
  using (status = 'approved' or auth.uid() = user_id or public.is_admin());
create policy "verified users insert their reviews"
  on public.reviews for insert
  with check (
    auth.uid() = user_id
    and public.is_verified_user(auth.uid())
    and status = 'pending'
  );
create policy "users update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id and public.is_verified_user(auth.uid()))
  with check (auth.uid() = user_id and status = 'pending');
create policy "users delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id and public.is_verified_user(auth.uid()));
create policy "admins moderate reviews"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "approved submissions and own submissions are readable"
  on public.submissions for select
  using (status = 'approved' or auth.uid() = user_id or public.is_admin());
create policy "verified users insert submissions"
  on public.submissions for insert
  with check (
    auth.uid() = user_id
    and public.is_verified_user(auth.uid())
    and status = 'pending'
  );
create policy "users update their own submissions"
  on public.submissions for update
  using (auth.uid() = user_id and public.is_verified_user(auth.uid()))
  with check (auth.uid() = user_id and status = 'pending');
create policy "users delete their own submissions"
  on public.submissions for delete
  using (auth.uid() = user_id and public.is_verified_user(auth.uid()));
create policy "admins moderate submissions"
  on public.submissions for update
  using (public.is_admin())
  with check (public.is_admin());
