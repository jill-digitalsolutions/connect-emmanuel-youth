create table if not exists public.chat_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('heart','like','laugh','sad')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);
create index if not exists chat_reactions_message_idx on public.chat_reactions (message_id);

alter table public.chat_reactions enable row level security;

drop policy if exists "reactions: read" on public.chat_reactions;
create policy "reactions: read" on public.chat_reactions
  for select to authenticated using (true);

drop policy if exists "reactions: add as self" on public.chat_reactions;
create policy "reactions: add as self" on public.chat_reactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "reactions: remove own" on public.chat_reactions;
create policy "reactions: remove own" on public.chat_reactions
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.chat_reactions to authenticated;

alter publication supabase_realtime add table public.chat_reactions;
