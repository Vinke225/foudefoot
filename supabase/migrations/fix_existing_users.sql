-- Script pour corriger les profils existants qui n'ont pas eu eula_accepted = true
-- ou qui ont un problème de synchronisation de nom d'utilisateur.

-- 1. On s'assure que tous les utilisateurs existants dans auth.users sont bien dans public.users
INSERT INTO public.users (id, username, avatar, eula_accepted, eula_accepted_at)
SELECT 
  id, 
  coalesce(
    raw_user_meta_data->>'username', 
    raw_user_meta_data->>'user_name', 
    raw_user_meta_data->>'full_name', 
    split_part(email, '@', 1), 
    'User_' || substr(id::text, 1, 5)
  ),
  raw_user_meta_data->>'avatar_url',
  true, -- On force true pour les anciens utilisateurs afin qu'ils ne soient pas bloqués
  coalesce((raw_user_meta_data->>'eula_accepted_at')::timestamp with time zone, now())
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  eula_accepted = true,
  eula_accepted_at = coalesce(public.users.eula_accepted_at, now());
