alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.courses enable row level security;
alter table public.course_progress enable row level security;
alter table public.sessions enable row level security;
alter table public.banners enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.photos enable row level security;
alter table public.photo_likes enable row level security;
alter table public.photo_comments enable row level security;

-- profiles: read-only from the client; writes happen only via the
-- security-definer trigger (insert) or the Supabase dashboard (role changes).
create policy "profiles: read all" on public.profiles
  for select to authenticated using (true);

-- posts
create policy "posts: read all" on public.posts
  for select to authenticated using (true);
create policy "posts: insert own" on public.posts
  for insert to authenticated with check (auth.uid() = author_id);
create policy "posts: update own or admin" on public.posts
  for update to authenticated using (auth.uid() = author_id or public.is_admin());
create policy "posts: delete own or admin" on public.posts
  for delete to authenticated using (auth.uid() = author_id or public.is_admin());

-- courses: admin-only writes
create policy "courses: read all" on public.courses
  for select to authenticated using (true);
create policy "courses: admin insert" on public.courses
  for insert to authenticated with check (public.is_admin());
create policy "courses: admin update" on public.courses
  for update to authenticated using (public.is_admin());
create policy "courses: admin delete" on public.courses
  for delete to authenticated using (public.is_admin());

-- course_progress: a member can only touch their own row
create policy "progress: read all" on public.course_progress
  for select to authenticated using (true);
create policy "progress: insert own" on public.course_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "progress: update own" on public.course_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sessions (fellowship): admin-only writes
create policy "sessions: read all" on public.sessions
  for select to authenticated using (true);
create policy "sessions: admin insert" on public.sessions
  for insert to authenticated with check (public.is_admin());
create policy "sessions: admin update" on public.sessions
  for update to authenticated using (public.is_admin());
create policy "sessions: admin delete" on public.sessions
  for delete to authenticated using (public.is_admin());

-- banners: admin-only writes
create policy "banners: read all" on public.banners
  for select to authenticated using (true);
create policy "banners: admin insert" on public.banners
  for insert to authenticated with check (public.is_admin());
create policy "banners: admin update" on public.banners
  for update to authenticated using (public.is_admin());
create policy "banners: admin delete" on public.banners
  for delete to authenticated using (public.is_admin());

-- events: no owner column in the schema, so any authenticated user may add
-- one; edits/deletes are admin-only.
create policy "events: read all" on public.events
  for select to authenticated using (true);
create policy "events: insert any authenticated" on public.events
  for insert to authenticated with check (true);
create policy "events: admin update" on public.events
  for update to authenticated using (public.is_admin());
create policy "events: admin delete" on public.events
  for delete to authenticated using (public.is_admin());

-- tasks: the board is collaboratively managed — anyone may create or change
-- status/assignee; deletes are restricted to the creator or an admin.
create policy "tasks: read all" on public.tasks
  for select to authenticated using (true);
create policy "tasks: insert own" on public.tasks
  for insert to authenticated with check (auth.uid() = created_by);
create policy "tasks: update any authenticated" on public.tasks
  for update to authenticated using (true);
create policy "tasks: delete own or admin" on public.tasks
  for delete to authenticated using (auth.uid() = created_by or public.is_admin());

-- photos
create policy "photos: read all" on public.photos
  for select to authenticated using (true);
create policy "photos: insert own" on public.photos
  for insert to authenticated with check (auth.uid() = uploaded_by);
create policy "photos: delete own or admin" on public.photos
  for delete to authenticated using (auth.uid() = uploaded_by or public.is_admin());

-- photo_likes
create policy "likes: read all" on public.photo_likes
  for select to authenticated using (true);
create policy "likes: insert own" on public.photo_likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "likes: delete own" on public.photo_likes
  for delete to authenticated using (auth.uid() = user_id);

-- photo_comments: owner-only delete
create policy "comments: read all" on public.photo_comments
  for select to authenticated using (true);
create policy "comments: insert own" on public.photo_comments
  for insert to authenticated with check (auth.uid() = user_id);
create policy "comments: delete own" on public.photo_comments
  for delete to authenticated using (auth.uid() = user_id);
