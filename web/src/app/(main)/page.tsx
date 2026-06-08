import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusSquare, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { PostInteractions } from "@/components/social/PostInteractions";
import { CreatePost } from "@/components/social/CreatePost";
import { PostOptions } from "@/components/social/PostOptions";
import { PostImage } from "@/components/social/PostImage";
import { getMatchSlug } from "@/utils/match";

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
  
  // Fetch Matches and Posts in parallel
  const [
    { data: rawMatches },
    { data: posts }
  ] = await Promise.all([
    supabase.from('matches').select('*'),
    supabase.from('posts')
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
      .order('created_at', { ascending: false })
  ]);

  // Trier: LIVE en premier, puis NS (à venir), puis FT (terminé)
  const matches = (rawMatches || []).sort((a, b) => {
    const priority = { 'LIVE': 0, 'NS': 1, 'FT': 2 };
    const pA = priority[a.status as keyof typeof priority] ?? 3;
    const pB = priority[b.status as keyof typeof priority] ?? 3;
    return pA - pB;
  }).slice(0, 15); // Limiter à 15 sur la page d'accueil

  // ... (keeping the rest the same up to PostInteractions)
  
  return (
    <div className="flex flex-col h-full pb-10">
      {/* Matchs du jour - Horizontal Scroll */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-black">Matchs du jour</h2>
          <Link href="/matchs" className="text-primary font-semibold text-[13px] hover:underline">
            Voir tout
          </Link>
        </div>
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex w-max space-x-5">
            
            {matches?.map((match) => (
              <Link key={match.id} href={`/matchs/${getMatchSlug(match)}`}>
                <div className="w-65 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 shrink-0 flex flex-col cursor-pointer hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-shadow">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-center text-[10px] font-bold mb-4">
                      {match.status === 'LIVE' ? (
                        <>
                          <span className="text-primary tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            EN COURS
                          </span>
                          <span className="text-primary font-bold">Live</span>
                        </>
                      ) : ['FT', 'Finished', 'Terminé'].includes(match.status) ? (
                        <span className="text-gray-500 tracking-wider">TERMINÉ</span>
                      ) : (
                        <span className="text-gray-400 tracking-wider">À VENIR</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col items-center gap-2 w-20">
                        {match.home_logo ? (
                          <div className="w-8 h-8 relative">
                            <Image src={match.home_logo} alt={match.home_team} fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500">
                            {match.home_team.substring(0,2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-[11px] text-gray-700 text-center truncate w-full">{match.home_team}</span>
                      </div>
                      <div className="text-xl font-black text-black px-2">
                        {match.score || '-'}
                      </div>
                      <div className="flex flex-col items-center gap-2 w-20">
                        {match.away_logo ? (
                          <div className="w-8 h-8 relative">
                            <Image src={match.away_logo} alt={match.away_team} fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500">
                            {match.away_team.substring(0,2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-[11px] text-gray-700 text-center truncate w-full">{match.away_team}</span>
                      </div>
                    </div>
                  </div>
                  <div className="py-3 border-t border-gray-50 text-center">
                    <span className="text-primary text-[13px] font-bold">Voir le match</span>
                  </div>
                </div>
              </Link>
            ))}

            {(!matches || matches.length === 0) && (
              <div className="text-sm text-gray-500 italic p-4">Aucun match programmé.</div>
            )}

          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

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
                    <Avatar className="w-11 h-11 border border-gray-100">
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
