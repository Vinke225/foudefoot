-- Insert some dummy matches
INSERT INTO public.matches (id, home_team, away_team, score, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Côte d''Ivoire', 'Brésil', '2 - 1', 'LIVE'),
  ('22222222-2222-2222-2222-222222222222', 'France', 'Argentine', null, 'NS'),
  ('33333333-3333-3333-3333-333333333333', 'Maroc', 'Portugal', null, 'NS')
ON CONFLICT DO NOTHING;
