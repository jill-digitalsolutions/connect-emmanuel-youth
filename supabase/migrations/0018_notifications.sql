-- Notifications: an in-app feed (bell), per-person preferences, push
-- subscriptions for phone/desktop alerts, and bookkeeping for reminders.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('announcement','banner','fellowship','reminder')),
  title text not null,
  body text,
  link text,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists notifications_created_idx on public.notifications (created_at desc);

create table if not exists public.notification_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  seen_at timestamptz not null default now()
);

create table if not exists public.notification_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  announcements boolean not null default true,
  banners boolean not null default true,
  fellowship boolean not null default true,
  reminders boolean not null default true
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.session_reminders (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.notification_state enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.session_reminders enable row level security;

drop policy if exists "notifications: read" on public.notifications;
create policy "notifications: read" on public.notifications for select to authenticated using (true);
drop policy if exists "notifications: admin delete" on public.notifications;
create policy "notifications: admin delete" on public.notifications for delete to authenticated using (public.is_admin());

drop policy if exists "state: own" on public.notification_state;
create policy "state: own" on public.notification_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "prefs: own" on public.notification_prefs;
create policy "prefs: own" on public.notification_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "push: own" on public.push_subscriptions;
create policy "push: own" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- session_reminders has no client policies: only the server (service role) touches it.

do $$
declare t text;
begin
  foreach t in array array['notifications','notification_state','notification_prefs','push_subscriptions','session_reminders'] loop
    execute format('drop policy if exists "approved only" on public.%I', t);
    execute format('create policy "approved only" on public.%I as restrictive for all to authenticated using (public.is_approved())', t);
  end loop;
end $$;

grant select, insert, update, delete on
  public.notifications, public.notification_state, public.notification_prefs, public.push_subscriptions to authenticated;

-- Notifications are created by the database itself when things happen.
create or replace function public.notify_on_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.category = 'announcement' then
    insert into public.notifications (kind, title, body, link, actor_id)
    values ('announcement', new.title, left(coalesce(new.body, ''), 200), '/feed', new.author_id);
  end if;
  return new;
end $$;

create or replace function public.notify_on_banner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (kind, title, body, link)
  values ('banner', 'New poster: ' || new.title, new.event_date_label, '/banners');
  return new;
end $$;

create or replace function public.notify_on_session()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (kind, title, body, link)
  values ('fellowship', 'Online fellowship: ' || new.title,
          to_char(new.date, 'FMDay, Mon FMDD') || coalesce(' at ' || to_char(new.time, 'FMHH12:MI AM'), ''),
          '/fellowship');
  return new;
end $$;

drop trigger if exists trg_notify_post on public.posts;
create trigger trg_notify_post after insert on public.posts for each row execute function public.notify_on_post();
drop trigger if exists trg_notify_banner on public.banners;
create trigger trg_notify_banner after insert on public.banners for each row execute function public.notify_on_banner();
drop trigger if exists trg_notify_session on public.sessions;
create trigger trg_notify_session after insert on public.sessions for each row execute function public.notify_on_session();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
