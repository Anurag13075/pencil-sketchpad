create policy "Board thumbnails readable" on storage.objects for select using (bucket_id = 'board-thumbnails');
create policy "Board thumbnails insertable" on storage.objects for insert with check (bucket_id = 'board-thumbnails');
create policy "Board thumbnails updatable" on storage.objects for update using (bucket_id = 'board-thumbnails');