-- Enable RLS for follows
alter table public.follows enable row level security;

-- Drop existing policies if they exist (to avoid "already exists" error)
drop policy if exists "Users can insert their own follows" on public.follows;
drop policy if exists "Users can delete their own follows" on public.follows;
drop policy if exists "Anyone can read follows" on public.follows;

create policy "Users can insert their own follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can delete their own follows" on public.follows for delete using (auth.uid() = follower_id);
create policy "Anyone can read follows" on public.follows for select using (true);

-- Enable RLS for conversations
alter table public.conversations enable row level security;

drop policy if exists "Users can insert conversations" on public.conversations;
drop policy if exists "Users can select conversations" on public.conversations;

create policy "Users can insert conversations" on public.conversations for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can select conversations" on public.conversations for select using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Add link column to notifications if it doesn't exist
alter table public.notifications add column if not exists link text;
