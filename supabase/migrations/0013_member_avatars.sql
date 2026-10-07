-- Let a signed-in member change only their own display photo.
create or replace function public.set_my_avatar(p_url text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set avatar_url = nullif(trim(p_url), '') where id = auth.uid();
$$;
revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to authenticated;
