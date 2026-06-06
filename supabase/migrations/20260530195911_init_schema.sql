-- Create users table (Extending auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  username text unique not null,
  avatar text,
  country text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Create matches table
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  home_team text not null,
  away_team text not null,
  score text,
  status text not null default 'NS', -- NS (Not Started), LIVE, FT (Full Time)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.matches enable row level security;

-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  media_url text,
  type text not null, -- 'image', 'gif', 'text'
  caption text,
  match_id uuid references public.matches(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;

-- Create comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.comments enable row level security;

-- Create likes table
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Enable RLS
alter table public.likes enable row level security;

-- Create chat_messages table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  type text not null, -- 'like', 'comment', 'follow', 'match_start'
  content text not null,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Public read access for all tables
create policy "Public can view users" on public.users for select using (true);
create policy "Public can view matches" on public.matches for select using (true);
create policy "Public can view posts" on public.posts for select using (true);
create policy "Public can view comments" on public.comments for select using (true);
create policy "Public can view likes" on public.likes for select using (true);
create policy "Public can view chat_messages" on public.chat_messages for select using (true);

-- Authenticated write access
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);

create policy "Users can create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update their own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Users can delete their own posts" on public.posts for delete using (auth.uid() = user_id);

create policy "Users can create comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on public.comments for delete using (auth.uid() = user_id);

create policy "Users can create likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can delete their own likes" on public.likes for delete using (auth.uid() = user_id);

create policy "Users can send chat messages" on public.chat_messages for insert with check (auth.uid() = user_id);

create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System can create notifications" on public.notifications for insert with check (true);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);
