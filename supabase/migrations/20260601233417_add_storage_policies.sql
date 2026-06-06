-- Autoriser la lecture publique pour tout le monde (Public)
CREATE POLICY "Avatar Images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Autoriser l'upload (INSERT) d'images pour les utilisateurs connectés
CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

-- Autoriser les utilisateurs à modifier (UPDATE) leurs propres images
CREATE POLICY "Anyone can update an avatar."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' );

-- Autoriser les utilisateurs à supprimer (DELETE) leurs propres images
CREATE POLICY "Anyone can delete an avatar."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' );
