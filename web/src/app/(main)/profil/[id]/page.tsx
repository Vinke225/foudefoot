import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/FollowButton";
import { PostInteractions } from "@/components/social/PostInteractions";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the target user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-red-100">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Profil introuvable</h1>
        <p className="text-gray-500 mb-2">ID: {params.id}</p>
        <p className="text-gray-500 mb-2">User: {user ? user.id : 'Non connecté'}</p>
        <pre className="text-left bg-gray-50 p-4 rounded-xl text-xs overflow-auto max-w-full">
          {JSON.stringify(profileError, null, 2)}
        </pre>
      </div>
    );
  }

  // Check if I am following this user
  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single();
    if (followData) {
      isFollowing = true;
    }
  }

  // Fetch user's posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      users (username, avatar, country),
      likes (user_id, reaction_type),
      comments (
        id,
        content,
        created_at,
        users (username, avatar)
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  // Get follower/following counts
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id)
  ]);

  const isMe = user?.id === profile.id;

  return (
    <div className="flex flex-col h-full pb-10">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 shadow-sm">
        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
          <AvatarImage src={profile.avatar || ""} className="object-cover" />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">{profile.username?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-black mb-1">{profile.username}</h1>
          <p className="text-gray-500 mb-4">{profile.country ? `🌍 ${profile.country}` : "Fan de foot"}</p>
          <div className="flex gap-6 justify-center sm:justify-start mb-6">
            <div className="text-center">
              <div className="font-bold text-xl">{followersCount || 0}</div>
              <div className="text-xs text-gray-500">Abonnés</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">{followingCount || 0}</div>
              <div className="text-xs text-gray-500">Abonnements</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl">{posts?.length || 0}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
          </div>
          {!isMe && user && (
            <div className="flex justify-center sm:justify-start gap-3">
              <FollowButton targetUserId={profile.id} initialIsFollowing={isFollowing} />
              <form action={async () => {
                "use server";
                const { startConversation } = await import("@/actions/messages");
                const res = await startConversation(profile.id);
                if (res?.conversationId) {
                  const { redirect } = await import("next/navigation");
                  redirect(`/messages/${res.conversationId}`);
                }
              }}>
                <Button variant="secondary" className="rounded-xl px-6 h-11 font-bold shadow-sm">
                  Message
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-[17px] font-bold text-black mb-4">Publications de {profile.username}</h2>
      
      <div className="space-y-6">
        {(!posts || posts.length === 0) ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
            <h3 className="font-bold text-lg mb-2">Aucune publication</h3>
            <p className="text-gray-500 mb-4">Cet utilisateur n'a pas encore publié.</p>
          </div>
        ) : (
          posts.map((post) => {
            const userLike = user ? post.likes?.find((l: any) => l.user_id === user.id) : null;
            return (
              <article key={post.id} className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center">
                    <Avatar className="w-11 h-11 border border-gray-100">
                      <AvatarImage src={post.users?.avatar || ""} className="object-cover" />
                      <AvatarFallback>{post.users?.username?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[15px] text-black">{post.users?.username}</span>
                        {post.users?.country && (
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-sm">{post.users.country}</span>
                        )}
                      </div>
                      <div className="flex items-center text-[12px] text-gray-400 mt-0.5">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-50 h-8 w-8">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="mt-4">
                  <p className="text-[15px] mb-3 leading-relaxed text-gray-800">{post.caption}</p>
                  
                  {post.media_url && (
                    <div className="relative rounded-[20px] overflow-hidden mb-4 aspect-video w-full border border-gray-100 bg-gray-50">
                      <Image 
                        src={post.media_url}
                        alt="Post media"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <PostInteractions 
                    postId={post.id} 
                    initialLikes={post.likes?.length || 0} 
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
