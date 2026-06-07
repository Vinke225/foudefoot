-- 1. Create Follows table
create table if not exists public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

-- 2. Enable RLS on Follows
alter table public.follows enable row level security;

create policy "Users can view all follows" 
on public.follows for select using (true);

create policy "Users can follow others" 
on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow" 
on public.follows for delete using (auth.uid() = follower_id);

-- 3. Fix Realtime Replication
-- To receive the OLD record in UPDATE events (necessary for notifications read state)
alter table public.notifications replica identity full;

-- 4. Fix Realtime RLS Policies (Realtime only sends events to users who can SELECT the row)
-- Make sure the SELECT policies exist and allow auth users to read notifications
-- (Normally this is already the case, but let's be sure for Realtime)
create policy "Users can read their own notifications for realtime" 
on public.notifications for select using (auth.uid() = user_id);

create policy "Users can read all posts for realtime" 
on public.posts for select using (true);

create policy "Users can read all comments for realtime" 
on public.comments for select using (true);

-- For messages, users can only read messages where they are sender or receiver
create policy "Users can read their messages for realtime" 
on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
