-- Let admins change other members' roles from the in-app Admin page.
create policy "profiles: admin update" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
