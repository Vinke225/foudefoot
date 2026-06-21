import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { PostContent } from "@/components/social/PostContent";

export const revalidate = 0;

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // If no profile found but logged in, maybe show an error or a setup page
    return <div className="p-10 text-center">Profil non trouvé. Veuillez compléter votre inscription.</div>;
  }

  // Fetch User Posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      users (username, avatar, country)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col h-full pb-10">
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Banner */}
          <div className="h-56 bg-linear-to-r from-primary to-green-400 w-full relative">
            {profile.cover_url && (
              <Image 
                src={profile.cover_url} 
                alt="Cover" 
                fill 
                className="object-cover" 
                unoptimized 
              />
            )}
            <div className="absolute -bottom-16 left-6 z-10">
              <Avatar className="w-32 h-32 border-4 border-[#FAFAFA] shadow-lg bg-white">
                <AvatarImage src={profile.avatar || ""} className="object-cover" />
                <AvatarFallback className="text-4xl">{profile.username?.[0] || "?"}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 px-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-[26px] font-black text-black flex items-center gap-2">
                  {profile.username}
                  {profile.country && (
                    <span className="text-[12px] bg-gray-100 px-2 py-0.5 rounded-sm font-bold">{profile.country}</span>
                  )}
                </h2>
                <p className="text-gray-500 font-medium text-[15px]">@{profile.username?.toLowerCase().replace(/\s+/g, '')}</p>
              </div>
              <EditProfileModal profile={profile} />
            </div>

            <p className="text-[15px] mb-4 text-gray-800 leading-relaxed max-w-xl">
              {profile.bio || "Aucune biographie."}
            </p>

            <div className="flex gap-5 text-[14px] text-gray-500 mb-5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Monde</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Inscrit le {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-5 text-[15px] mb-8">
              <span className="hover:underline cursor-pointer"><strong className="text-black font-bold">0</strong> <span className="text-gray-500">Abonnements</span></span>
              <span className="hover:underline cursor-pointer"><strong className="text-black font-bold">0</strong> <span className="text-gray-500">Abonnés</span></span>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button className="px-6 pb-3 border-b-[3px] border-primary font-bold text-[15px] text-black">Posts</button>
              <button className="px-6 pb-3 border-b-[3px] border-transparent text-gray-500 font-semibold text-[15px] hover:text-black transition-colors">Réponses</button>
              <button className="px-6 pb-3 border-b-[3px] border-transparent text-gray-500 font-semibold text-[15px] hover:text-black transition-colors">Médias</button>
              <button className="px-6 pb-3 border-b-[3px] border-transparent text-gray-500 font-semibold text-[15px] hover:text-black transition-colors">J&apos;aime</button>
            </div>
          </div>

          {/* User Posts */}
          <div className="px-6 space-y-6">
            {(!posts || posts.length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
                <h3 className="font-bold text-lg mb-2">Aucune publication</h3>
                <p className="text-gray-500">Vous n&apos;avez encore rien publié.</p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center">
                      <Avatar className="w-11 h-11 border border-gray-100">
                        <AvatarImage src={post.users?.avatar || ""} className="object-cover" />
                        <AvatarFallback>{post.users?.username?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[15px] text-black hover:underline cursor-pointer">{post.users?.username}</span>
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
                    <PostContent caption={post.caption} mediaUrl={post.media_url} />

                    <div className="flex items-center gap-10 text-gray-500 pt-1">
                      <button className="flex items-center gap-2.5 hover:text-red-500 group transition-colors">
                        <Heart className="w-5 h-5" />
                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-red-500">0</span>
                      </button>
                      <button className="flex items-center gap-2.5 hover:text-black group transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-black">0</span>
                      </button>
                      <button className="flex items-center gap-2.5 hover:text-blue-500 group transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-blue-500">0</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
          <div className="h-32"></div>
        </div>
      </ScrollArea>
    </div>
  );
}
