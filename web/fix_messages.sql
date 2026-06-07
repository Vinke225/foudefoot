-- Ce script corrige la réplication en temps réel pour la messagerie privée.
-- 1. On permet au Realtime de capter les changements (mise à jour/lu, non lu)
alter table public.private_messages replica identity full;

-- 2. On s'assure qu'il y a une politique de sélection qui autorise la lecture par les participants de la conversation
create policy "Users can read their private_messages for realtime"
on public.private_messages for select using (
  exists (
    select 1 from public.conversations c 
    where c.id = private_messages.conversation_id 
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);
