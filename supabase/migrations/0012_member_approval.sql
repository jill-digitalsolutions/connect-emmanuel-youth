-- New sign-ups wait for an admin to approve them. Existing accounts stay approved.
alter table public.profiles add column if not exists approved boolean not null default false;
update public.profiles set approved = true;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select approved from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.is_approved() from public;
grant execute on function public.is_approved() to authenticated;

-- Pending people can see only their own profile row; everything else needs approval.
drop policy if exists "approved only" on public.profiles;
create policy "approved only" on public.profiles
  as restrictive for all to authenticated
  using (id = auth.uid() or public.is_approved());

do $$
declare t text;
begin
  foreach t in array array[
    'posts','courses','course_progress','sessions','banners','events','tasks',
    'photos','photo_likes','photo_comments','chat_messages','chat_reactions'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "approved only" on public.%I', t);
      execute format(
        'create policy "approved only" on public.%I as restrictive for all to authenticated using (public.is_approved())', t);
    end if;
  end loop;
end $$;
