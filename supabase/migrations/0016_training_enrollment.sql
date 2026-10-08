-- Training: modules and topics, enrollment with admin approval, step-by-step
-- unlocking (with admin override), and private PDF lessons.

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create table if not exists public.course_topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  position int not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  pdf_path text,
  pdf_name text,
  youtube_url text,
  created_at timestamptz not null default now(),
  unique (module_id, position)
);

-- (re-runnable) adds the video link if the table already existed
alter table public.course_topics add column if not exists youtube_url text;

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (course_id, user_id)
);

create table if not exists public.topic_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.course_topics(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.topic_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.course_topics(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

-- A topic is open to a member when they are approved for the course and either
-- it is the first topic, the one before it is done, or an admin unlocked it.
create or replace function public.topic_available(p_user uuid, p_topic uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  with t as (
    select ct.id, ct.course_id, cm.position as mp, ct.position as tp
    from public.course_topics ct join public.course_modules cm on cm.id = ct.module_id
    where ct.id = p_topic
  ),
  prev as (
    select ct.id
    from public.course_topics ct
    join public.course_modules cm on cm.id = ct.module_id
    cross join t
    where ct.course_id = t.course_id
      and (cm.position < t.mp or (cm.position = t.mp and ct.position < t.tp))
    order by cm.position desc, ct.position desc
    limit 1
  )
  select exists (select 1 from t)
    and exists (
      select 1 from public.course_enrollments e, t
      where e.course_id = t.course_id and e.user_id = p_user and e.status = 'approved'
    )
    and (
      not exists (select 1 from prev)
      or exists (select 1 from public.topic_unlocks u where u.user_id = p_user and u.topic_id = p_topic)
      or exists (select 1 from public.topic_completions c, prev where c.user_id = p_user and c.topic_id = prev.id)
    );
$$;
revoke all on function public.topic_available(uuid, uuid) from public;
grant execute on function public.topic_available(uuid, uuid) to authenticated;

alter table public.course_modules enable row level security;
alter table public.course_topics enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.topic_completions enable row level security;
alter table public.topic_unlocks enable row level security;

drop policy if exists "modules: read" on public.course_modules;
create policy "modules: read" on public.course_modules for select to authenticated using (true);
drop policy if exists "modules: admin write" on public.course_modules;
create policy "modules: admin write" on public.course_modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "topics: read" on public.course_topics;
create policy "topics: read" on public.course_topics for select to authenticated using (true);
drop policy if exists "topics: admin write" on public.course_topics;
create policy "topics: admin write" on public.course_topics for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enroll: read" on public.course_enrollments;
create policy "enroll: read" on public.course_enrollments for select to authenticated
  using (user_id = auth.uid() or status = 'approved' or public.is_admin());
drop policy if exists "enroll: request own" on public.course_enrollments;
create policy "enroll: request own" on public.course_enrollments for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "enroll: admin decide" on public.course_enrollments;
create policy "enroll: admin decide" on public.course_enrollments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "enroll: cancel own pending or admin" on public.course_enrollments;
create policy "enroll: cancel own pending or admin" on public.course_enrollments for delete to authenticated
  using (public.is_admin() or (user_id = auth.uid() and status in ('pending','declined')));

drop policy if exists "completions: read" on public.topic_completions;
create policy "completions: read" on public.topic_completions for select to authenticated using (true);
drop policy if exists "completions: tick own open topic" on public.topic_completions;
create policy "completions: tick own open topic" on public.topic_completions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.topic_available(auth.uid(), topic_id)
    and course_id = (select ct.course_id from public.course_topics ct where ct.id = topic_id)
  );
drop policy if exists "completions: untick own" on public.topic_completions;
create policy "completions: untick own" on public.topic_completions for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "unlocks: read own or admin" on public.topic_unlocks;
create policy "unlocks: read own or admin" on public.topic_unlocks for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "unlocks: admin write" on public.topic_unlocks;
create policy "unlocks: admin write" on public.topic_unlocks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['course_modules','course_topics','course_enrollments','topic_completions','topic_unlocks'] loop
    execute format('drop policy if exists "approved only" on public.%I', t);
    execute format('create policy "approved only" on public.%I as restrictive for all to authenticated using (public.is_approved())', t);
  end loop;
end $$;

grant select, insert, update, delete on
  public.course_modules, public.course_topics, public.course_enrollments,
  public.topic_completions, public.topic_unlocks to authenticated;

-- Private bucket for PDF lessons. Path: <course_id>/<topic_id>/<file>.pdf
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lessons', 'lessons', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = array['application/pdf'];

drop policy if exists "lessons: admin write" on storage.objects;
create policy "lessons: admin write" on storage.objects for all to authenticated
  using (bucket_id = 'lessons' and public.is_admin())
  with check (bucket_id = 'lessons' and public.is_admin());

-- Members can open a PDF only for a lesson that is open to them.
drop policy if exists "lessons: read if open" on storage.objects;
create policy "lessons: read if open" on storage.objects for select to authenticated
  using (
    bucket_id = 'lessons'
    and (public.is_admin() or public.topic_available(auth.uid(), ((storage.foldername(name))[2])::uuid))
  );
