-- 1. Ajout de la colonne pour stocker le token Expo
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expo_push_token text;

-- 2. Activation de l'extension pg_net (nécessaire pour faire des requêtes HTTP depuis Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Fonction pour envoyer une notification lors d'un nouveau message privé
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  push_token text;
  sender_name text;
  request_body json;
BEGIN
  -- Trouver le destinataire du message
  SELECT 
    CASE 
      WHEN user1_id = NEW.sender_id THEN user2_id 
      ELSE user1_id 
    END INTO recipient_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- Récupérer le token du destinataire
  SELECT expo_push_token INTO push_token
  FROM public.users
  WHERE id = recipient_id;

  -- Récupérer le nom de l'expéditeur
  SELECT username INTO sender_name
  FROM public.users
  WHERE id = NEW.sender_id;

  -- Si le destinataire a un token, on appelle l'API d'Expo
  IF push_token IS NOT NULL THEN
    request_body := json_build_object(
      'to', push_token,
      'title', 'Nouveau message de ' || sender_name,
      'body', COALESCE(NEW.message, 'A envoyé un média'),
      'data', json_build_object('type', 'private_message', 'conversation_id', NEW.conversation_id)
    );

    PERFORM net.http_post(
      url:='https://exp.host/--/api/v2/push/send',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:=request_body::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger sur la table private_messages
DROP TRIGGER IF EXISTS on_new_private_message ON public.private_messages;
CREATE TRIGGER on_new_private_message
AFTER INSERT ON public.private_messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
