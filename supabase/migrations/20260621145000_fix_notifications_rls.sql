-- Drop the overly permissive insert policy
drop policy if exists "System can create notifications" on public.notifications;

-- Create a more secure policy where users can only trigger notifications if they are authenticated
-- Wait, users trigger notifications indirectly. If notifications are inserted directly from the frontend, it should only be allowed if they are the "actor" but the current table doesn't have an actor_id. 
-- In a typical secure setup, notifications should be created via Database Triggers or Edge Functions, NOT directly from the frontend.
-- If the frontend inserts it, we should at least restrict it to authenticated users.
create policy "Authenticated users can create notifications" on public.notifications for insert with check (auth.role() = 'authenticated');
