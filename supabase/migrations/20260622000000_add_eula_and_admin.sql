-- Add new columns for EULA and Admin features
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS eula_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eula_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create policy to restrict banned users from creating content
-- Posts
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_banned = false AND eula_accepted = true)
);

-- Comments
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_banned = false AND eula_accepted = true)
);

-- Likes
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
CREATE POLICY "Users can create likes" ON public.likes 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_banned = false AND eula_accepted = true)
);

-- Chat messages
DROP POLICY IF EXISTS "Users can send chat messages" ON public.chat_messages;
CREATE POLICY "Users can send chat messages" ON public.chat_messages 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_banned = false AND eula_accepted = true)
);

-- Admins can view and update all users
CREATE POLICY "Admins can update any profile" ON public.users 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
