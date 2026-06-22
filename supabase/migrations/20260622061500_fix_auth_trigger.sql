-- Fix the trigger to properly map username and eula fields from raw_user_meta_data

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, avatar, eula_accepted, eula_accepted_at)
  values (
    new.id, 
    coalesce(
      new.raw_user_meta_data->>'username', 
      new.raw_user_meta_data->>'user_name', 
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1), 
      'User_' || substr(new.id::text, 1, 5)
    ), 
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'eula_accepted')::boolean, false),
    (new.raw_user_meta_data->>'eula_accepted_at')::timestamp with time zone
  )
  on conflict (id) do update set
    username = EXCLUDED.username,
    eula_accepted = coalesce(EXCLUDED.eula_accepted, public.users.eula_accepted),
    eula_accepted_at = coalesce(EXCLUDED.eula_accepted_at, public.users.eula_accepted_at);
    
  return new;
end;
$$ language plpgsql security definer;
