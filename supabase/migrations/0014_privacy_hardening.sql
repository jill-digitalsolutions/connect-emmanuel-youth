-- Privacy hardening: stop leaking email addresses and tighten uploads.
-- Safe to run once. After this, people log in with their username only.

-- 1) Give every account with a username the same stand-in login address the
--    app now uses, so real email addresses are no longer needed or stored.
update auth.users u
set email = lower(p.username) || '@connect-emmanuel.app'
from public.profiles p
where p.id = u.id
  and p.username is not null
  and u.email is distinct from lower(p.username) || '@connect-emmanuel.app';

update auth.identities i
set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email))
from auth.users u
where i.user_id = u.id and i.provider = 'email';

-- 2) Nobody can look up an account's email any more.
revoke execute on function public.login_email_for_username(text) from anon, authenticated;

-- 3) Signup only needs a yes/no answer, never the email.
create or replace function public.username_taken(p_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where lower(username) = lower(trim(p_username)));
$$;
revoke all on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;

-- 4) A display photo must be a file inside the member's own gallery folder.
create or replace function public.set_my_avatar(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_url is null or trim(p_url) = '' then
    update public.profiles set avatar_url = null where id = auth.uid();
    return;
  end if;
  if p_url !~ ('/storage/v1/object/public/gallery/' || auth.uid()::text || '/') then
    raise exception 'Invalid photo location';
  end if;
  update public.profiles set avatar_url = p_url where id = auth.uid();
end;
$$;
revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to authenticated;

-- 5) People still waiting for approval can't upload files.
drop policy if exists "uploads need approval" on storage.objects;
create policy "uploads need approval" on storage.objects
  as restrictive for insert to authenticated
  with check (bucket_id not in ('gallery', 'banners') or public.is_approved());
