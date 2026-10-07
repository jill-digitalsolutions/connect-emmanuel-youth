-- In-app group chat for the whole youth group.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat: read" on public.chat_messages;
create policy "chat: read" on public.chat_messages
  for select to authenticated using (true);

drop policy if exists "chat: send as self" on public.chat_messages;
create policy "chat: send as self" on public.chat_messages
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists "chat: delete own or admin" on public.chat_messages;
create policy "chat: delete own or admin" on public.chat_messages
  for delete to authenticated using (sender_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.chat_messages to authenticated;

alter publication supabase_realtime add table public.chat_messages;
