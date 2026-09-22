-- CONNECT — Emmanuel Youth: core schema
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_url text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  category text not null check (category in ('training','fellowship','announcement','calendar')),
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  track text not null check (track in ('Leadership','Bible Study','Media Team','Worship')),
  total_modules int not null check (total_modules > 0),
  description text,
  created_at timestamptz not null default now()
);

create table public.course_progress (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  modules_done int not null default 0 check (modules_done >= 0),
  unique (course_id, user_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time time,
  video_link text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date_label text not null default 'TBA',
  image_url text,
  color_theme text not null check (color_theme in ('amber','coral','plum','moss')),
  is_past boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  category text not null check (category in ('amber','coral','plum','moss')),
  related_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  album text,
  created_at timestamptz not null default now()
);

create table public.photo_likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

create table public.photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index course_progress_user_idx on public.course_progress (user_id);
create index sessions_date_idx on public.sessions (date);
create index events_date_idx on public.events (date);
create index tasks_status_idx on public.tasks (status);
create index photos_created_at_idx on public.photos (created_at desc);
create index photo_likes_photo_idx on public.photo_likes (photo_id);
create index photo_comments_photo_idx on public.photo_comments (photo_id, created_at);
