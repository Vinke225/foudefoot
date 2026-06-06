-- Créer les buckets de stockage (s'ils n'existent pas)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts_media', 'posts_media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
