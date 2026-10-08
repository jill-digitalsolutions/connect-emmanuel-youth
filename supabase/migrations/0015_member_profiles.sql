-- Member profiles: ministries, roles per ministry, and a private home address.

create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
create unique index if not exists ministries_name_lower_idx on public.ministries (lower(name));

create table if not exists public.ministry_members (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Member' check (char_length(btrim(role)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (ministry_id, user_id)
);

-- The address lives in its own table so only the member and admins can read it
-- (everyone else in the app can see names and ministries, never addresses).
create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  address text check (address is null or char_length(address) <= 300),
  updated_at timestamptz not null default now()
);

alter table public.ministries enable row level security;
alter table public.ministry_members enable row level security;
alter table public.profile_private enable row level security;

-- Ministries / roles: approved members read; only admins change.
drop policy if exists "ministries: read" on public.ministries;
create policy "ministries: read" on public.ministries for select to authenticated using (true);
drop policy if exists "ministries: admin write" on public.ministries;
create policy "ministries: admin write" on public.ministries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "ministry_members: read" on public.ministry_members;
create policy "ministry_members: read" on public.ministry_members for select to authenticated using (true);
drop policy if exists "ministry_members: admin write" on public.ministry_members;
create policy "ministry_members: admin write" on public.ministry_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Address: the member themself or an admin.
drop policy if exists "private: read own or admin" on public.profile_private;
create policy "private: read own or admin" on public.profile_private
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "private: insert own or admin" on public.profile_private;
create policy "private: insert own or admin" on public.profile_private
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "private: update own or admin" on public.profile_private;
create policy "private: update own or admin" on public.profile_private
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "private: delete admin" on public.profile_private;
create policy "private: delete admin" on public.profile_private
  for delete to authenticated using (public.is_admin());

-- People still waiting for approval see none of it.
drop policy if exists "approved only" on public.ministries;
create policy "approved only" on public.ministries as restrictive for all to authenticated using (public.is_approved());
drop policy if exists "approved only" on public.ministry_members;
create policy "approved only" on public.ministry_members as restrictive for all to authenticated using (public.is_approved());
drop policy if exists "approved only" on public.profile_private;
create policy "approved only" on public.profile_private as restrictive for all to authenticated using (public.is_approved());

grant select, insert, update, delete on public.ministries, public.ministry_members, public.profile_private to authenticated;
