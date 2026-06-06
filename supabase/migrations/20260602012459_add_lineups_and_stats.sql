-- Add lineups and statistics columns to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS lineups JSONB,
ADD COLUMN IF NOT EXISTS statistics JSONB;
