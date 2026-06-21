import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { PostInteractions } from "@/components/social/PostInteractions";
import { CreatePost } from "@/components/social/CreatePost";
import { PostOptions } from "@/components/social/PostOptions";
import { PostImage } from "@/components/social/PostImage";

export const revalidate = 0; // Disable caching for realtime feel

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch complete user profile for the CreatePost component
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('id, username, avatar').eq('id', user.id).single();
    userProfile = data;
  }
  
  // Fetch Posts
  const { data: posts } = await supabase.from('posts')
    .select(`
      *,
      users (username, avatar, country),
      likes (user_id, reaction_type, users (id, username, avatar)),
      comments (
        id,
        content,
        created_at,
        users (username, avatar)
      )
    `)
    .order('created_at', { ascending: false });
  
  return (
    <div className="flex flex-col h-full pb-10">


      {/* Feed Posts */}
      <div className="space-y-6">
        <CreatePost user={userProfile} />
        
        {(!posts || posts.length === 0) ? (
           <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
             <h3 className="font-bold text-lg mb-2">Aucune publication pour le moment</h3>
             <p className="text-gray-500 mb-4">Soyez le premier à partager vos émotions sur la compétition !</p>
           </div>
        ) : (
          posts.map((post) => {
            const userLike = user ? post.likes?.find((l: { user_id: string, reaction_type?: string }) => l.user_id === user.id) : null;
            return (
              <article key={post.id} className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center">
                    <Avatar className="w-11 h-11 border border-gray-100" userId={post.user_id}>
                      <AvatarImage src={post.users?.avatar || ""} className="object-cover" />
                      <AvatarFallback>{post.users?.username?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/profil/${post.user_id}`}>
                          <span className="font-bold text-[15px] text-black hover:underline cursor-pointer">{post.users?.username}</span>
                        </Link>
                        {post.users?.country && (
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-sm">{post.users.country}</span>
                        )}
                      </div>
                      <div className="flex items-center text-[12px] text-gray-400 mt-0.5">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <PostOptions post={{ id: post.id, caption: post.caption, user_id: post.user_id }} currentUserId={user?.id} />
                </div>
                
                <div className="mt-4">
                  <p className="text-[15px] mb-3 leading-relaxed text-gray-800">{post.caption}</p>
                  
                  {post.media_url && (
                    <PostImage mediaUrl={post.media_url} />
                  )}

                  <PostInteractions 
                    postId={post.id} 
                    initialLikes={post.likes?.length || 0} 
                    likesData={post.likes || []}
                    hasLiked={!!userLike}
                    initialReactionType={userLike?.reaction_type}
                    commentsCount={post.comments?.length || 0}
                    commentsData={post.comments || []}
                  />
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  );
}
