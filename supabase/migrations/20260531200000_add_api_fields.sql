-- Ajout des champs nécessaires pour la synchronisation avec l'API Football

ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS api_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS home_logo TEXT,
ADD COLUMN IF NOT EXISTS away_logo TEXT;
