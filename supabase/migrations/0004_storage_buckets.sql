insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 8388608, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 8388608, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

-- banners: public read, admin-only write (any path)
create policy "banners: public read" on storage.objects
  for select using (bucket_id = 'banners');
create policy "banners: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'banners' and public.is_admin());
create policy "banners: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'banners' and public.is_admin());
create policy "banners: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'banners' and public.is_admin());

-- gallery: public read; write/delete scoped to a path prefixed with the
-- uploader's own user id (client uploads to `${user.id}/...`).
create policy "gallery: public read" on storage.objects
  for select using (bucket_id = 'gallery');
create policy "gallery: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "gallery: owner or admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
