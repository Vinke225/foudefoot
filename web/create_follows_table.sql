-- Créer la table follows si elle n'existe pas
create table if not exists public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references public.users(id) on delete cascade not null,
    following_id uuid references public.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(follower_id, following_id)
);

-- Activer la sécurité RLS sur la table
alter table public.follows enable row level security;

-- Supprimer les anciennes règles si elles existent
drop policy if exists "Users can insert their own follows" on public.follows;
drop policy if exists "Users can delete their own follows" on public.follows;
drop policy if exists "Anyone can read follows" on public.follows;

-- Ajouter les règles de sécurité
create policy "Users can insert their own follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can delete their own follows" on public.follows for delete using (auth.uid() = follower_id);
create policy "Anyone can read follows" on public.follows for select using (true);

-- Rattraper la sécurité pour les conversations (au cas où le script précédent a échoué à cause de la table manquante)
alter table public.conversations enable row level security;
drop policy if exists "Users can insert conversations" on public.conversations;
drop policy if exists "Users can select conversations" on public.conversations;
create policy "Users can insert conversations" on public.conversations for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can select conversations" on public.conversations for select using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Rattraper la colonne link pour les notifications
alter table public.notifications add column if not exists link text;
