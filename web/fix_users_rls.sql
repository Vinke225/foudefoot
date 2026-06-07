-- Ce script permet de rendre les profils des utilisateurs visibles publiquement afin de ne plus avoir d'erreur 404 sur les pages de profil.

create policy "Public profiles are viewable by everyone."
on public.users for select
using (true);
