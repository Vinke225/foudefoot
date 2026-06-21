-- DROP OLD INSECURE POLICIES
drop policy if exists "Avatar Images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Anyone can update an avatar." on storage.objects;
drop policy if exists "Anyone can delete an avatar." on storage.objects;

drop policy if exists "Cover Images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload a cover." on storage.objects;
drop policy if exists "Anyone can update a cover." on storage.objects;
drop policy if exists "Anyone can delete a cover." on storage.objects;

drop policy if exists "Post media are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload a post media." on storage.objects;
drop policy if exists "Anyone can update a post media." on storage.objects;
drop policy if exists "Anyone can delete a post media." on storage.objects;

drop policy if exists "Chat media are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload a chat media." on storage.objects;
drop policy if exists "Anyone can update a chat media." on storage.objects;
drop policy if exists "Anyone can delete a chat media." on storage.objects;

drop policy if exists "Users can view private media if they are in the conversation." on storage.objects;
drop policy if exists "Anyone can upload private media." on storage.objects;
drop policy if exists "Anyone can update private media." on storage.objects;
drop policy if exists "Anyone can delete private media." on storage.objects;


-- NEW SECURE POLICIES FOR PUBLIC BUCKETS
-- For avatars
create policy "Avatars are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Authenticated users can upload avatars." on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can update their own avatars." on storage.objects for update using (bucket_id = 'avatars' and auth.uid() = owner);
create policy "Users can delete their own avatars." on storage.objects for delete using (bucket_id = 'avatars' and auth.uid() = owner);

-- For covers
create policy "Covers are publicly accessible." on storage.objects for select using (bucket_id = 'covers');
create policy "Authenticated users can upload covers." on storage.objects for insert with check (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "Users can update their own covers." on storage.objects for update using (bucket_id = 'covers' and auth.uid() = owner);
create policy "Users can delete their own covers." on storage.objects for delete using (bucket_id = 'covers' and auth.uid() = owner);

-- For posts_media
create policy "Posts media are publicly accessible." on storage.objects for select using (bucket_id = 'posts_media');
create policy "Authenticated users can upload posts media." on storage.objects for insert with check (bucket_id = 'posts_media' and auth.role() = 'authenticated');
create policy "Users can update their own posts media." on storage.objects for update using (bucket_id = 'posts_media' and auth.uid() = owner);
create policy "Users can delete their own posts media." on storage.objects for delete using (bucket_id = 'posts_media' and auth.uid() = owner);

-- For chat_media (Public Match Chat)
create policy "Chat media are publicly accessible." on storage.objects for select using (bucket_id = 'chat_media');
create policy "Authenticated users can upload chat media." on storage.objects for insert with check (bucket_id = 'chat_media' and auth.role() = 'authenticated');
create policy "Users can update their own chat media." on storage.objects for update using (bucket_id = 'chat_media' and auth.uid() = owner);
create policy "Users can delete their own chat media." on storage.objects for delete using (bucket_id = 'chat_media' and auth.uid() = owner);


-- NEW SECURE POLICIES FOR PRIVATE BUCKETS
-- For private_media
create policy "Users can view private media in their conversations." on storage.objects for select using (
  bucket_id = 'private_media' and 
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

create policy "Users can upload private media in their conversations." on storage.objects for insert with check (
  bucket_id = 'private_media' and 
  auth.role() = 'authenticated' and
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

create policy "Users can update their own private media." on storage.objects for update using (
  bucket_id = 'private_media' and auth.uid() = owner
);

create policy "Users can delete their own private media." on storage.objects for delete using (
  bucket_id = 'private_media' and auth.uid() = owner
);
