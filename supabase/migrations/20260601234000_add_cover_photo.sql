-- Ajouter la colonne cover_url à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Autoriser la lecture publique pour tout le monde (Public)
CREATE POLICY "Cover Images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'covers' );

-- Autoriser l'upload (INSERT) d'images pour les utilisateurs connectés
CREATE POLICY "Anyone can upload a cover."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'covers' );

-- Autoriser les utilisateurs à modifier (UPDATE) leurs propres images
CREATE POLICY "Anyone can update a cover."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'covers' );

-- Autoriser les utilisateurs à supprimer (DELETE) leurs propres images
CREATE POLICY "Anyone can delete a cover."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'covers' );
