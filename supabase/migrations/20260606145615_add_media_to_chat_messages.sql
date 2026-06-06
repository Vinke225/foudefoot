-- Ajouter la colonne media_url
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS media_url text;

-- Rendre la colonne message optionnelle (nullable)
ALTER TABLE public.chat_messages ALTER COLUMN message DROP NOT NULL;

-- Créer les politiques de sécurité pour le bucket chat_media
CREATE POLICY "Chat Media is publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'chat_media' );

CREATE POLICY "Anyone can upload chat media."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'chat_media' );

CREATE POLICY "Anyone can update chat media."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'chat_media' );

CREATE POLICY "Anyone can delete chat media."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'chat_media' );
