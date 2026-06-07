-- Active la publication "supabase_realtime" sur les tables nécessaires pour l'application
begin;

  -- Créer la publication si elle n'existe pas déjà
  do $$
  begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end
  $$;

  -- Ajouter les tables à la publication pour envoyer les événements (INSERT, UPDATE, DELETE)
  alter publication supabase_realtime add table notifications;
  alter publication supabase_realtime add table posts;
  alter publication supabase_realtime add table comments;
  alter publication supabase_realtime add table messages;

commit;
