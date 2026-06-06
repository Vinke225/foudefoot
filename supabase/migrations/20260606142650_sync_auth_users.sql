-- 1. Fonction pour copier le nouvel utilisateur dans public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, avatar)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User_' || substr(new.id::text, 1, 5)), 
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 2. Création du Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Synchroniser Rétroactivement les utilisateurs existants
insert into public.users (id, username, avatar)
select 
  id, 
  coalesce(raw_user_meta_data->>'user_name', raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User_' || substr(id::text, 1, 5)),
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
