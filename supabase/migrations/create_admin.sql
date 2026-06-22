-- Script à copier/coller dans le "SQL Editor" de Supabase
-- Il va créer l'utilisateur avec l'email et le mot de passe, puis lui donner le rôle "admin"

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Insertion sécurisée dans le système d'authentification (auth.users)
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'authenticated',
    'authenticated',
    'ubuyashikimuzan225@gmail.com',
    crypt('password123', gen_salt('bf')), -- Cryptage natif de Supabase
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "Admin Général"}',
    now(),
    now()
  );

  -- 2. Création de l'identité (Obligatoire pour que Supabase autorise la connexion)
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) VALUES (
    new_user_id::text,
    new_user_id,
    format('{"sub": "%s", "email": "%s"}', new_user_id::text, 'ubuyashikimuzan225@gmail.com')::jsonb,
    'email',
    now(),
    now()
  );

  -- 3. Mise à jour du profil public (On le passe admin et on valide les règles EULA)
  -- Note: Si un trigger crée le profil automatiquement, on fait un UPDATE. 
  -- Sinon, on fait un INSERT. On utilise un UPSERT pour être sûr à 100%.
  INSERT INTO public.users (id, username, role, eula_accepted, eula_accepted_at)
  VALUES (new_user_id, 'Admin Général', 'admin', true, now())
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin', eula_accepted = true, eula_accepted_at = now();

END $$;
