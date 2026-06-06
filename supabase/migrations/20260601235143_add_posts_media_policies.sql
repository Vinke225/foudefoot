-- Autoriser la lecture publique pour tout le monde (Public)
CREATE POLICY "Post media are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'posts_media' );

-- Autoriser l'upload (INSERT) d'images pour les utilisateurs connectés
CREATE POLICY "Anyone can upload a post media."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'posts_media' );

-- Autoriser les utilisateurs à modifier (UPDATE) leurs propres images
CREATE POLICY "Anyone can update a post media."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'posts_media' );

-- Autoriser les utilisateurs à supprimer (DELETE) leurs propres images
CREATE POLICY "Anyone can delete a post media."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'posts_media' );
