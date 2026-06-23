-- Fix the trigger to set a default avatar and default eula_accepted
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_avatar text;
  final_username text;
begin
  final_username := coalesce(
      new.raw_user_meta_data->>'username', 
      new.raw_user_meta_data->>'user_name', 
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1), 
      'User_' || substr(new.id::text, 1, 5)
  );
  
  -- Create a default avatar using ui-avatars.com (Green background #1E8F45, white text)
  default_avatar := 'https://ui-avatars.com/api/?name=' || replace(final_username, ' ', '+') || '&background=1E8F45&color=fff';

  insert into public.users (id, username, avatar, eula_accepted, eula_accepted_at)
  values (
    new.id, 
    final_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', default_avatar),
    coalesce((new.raw_user_meta_data->>'eula_accepted')::boolean, true), -- Default to true to avoid blocking web users
    coalesce((new.raw_user_meta_data->>'eula_accepted_at')::timestamp with time zone, now())
  )
  on conflict (id) do update set
    username = EXCLUDED.username,
    eula_accepted = coalesce(EXCLUDED.eula_accepted, public.users.eula_accepted),
    eula_accepted_at = coalesce(EXCLUDED.eula_accepted_at, public.users.eula_accepted_at);
    
  return new;
end;
$$ language plpgsql security definer;

-- Update existing users who don't have an avatar
update public.users 
set avatar = 'https://ui-avatars.com/api/?name=' || replace(username, ' ', '+') || '&background=1E8F45&color=fff'
where avatar is null or avatar = '';

-- Fix existing users who couldn't post because eula_accepted was false/null
update public.users
set eula_accepted = true
where eula_accepted is false or eula_accepted is null;
