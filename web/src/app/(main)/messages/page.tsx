import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, Image as ImageIcon } from "lucide-react";

export const revalidate = 0;

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      updated_at,
      user1:users!conversations_user1_id_fkey(id, username, avatar),
      user2:users!conversations_user2_id_fkey(id, username, avatar),
      private_messages(message, media_url, is_read, sender_id, created_at)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <div className="px-6 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="font-black text-[22px] tracking-tight">Messagerie</h1>
        <div className="p-2 bg-gray-100 rounded-full text-gray-500">
          <MessageSquarePlus className="w-5 h-5" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        {(!conversations || conversations.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <MessageSquarePlus className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-[15px]">Aucune conversation</p>
            <p className="text-[13px] mt-1 text-center max-w-xs">Démarrez une discussion depuis le profil d'un membre ou la barre de suggestions.</p>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {conversations.map((convo: { id: string; user1: any; user2: any; private_messages: any[] }) => {
              const otherUser = convo.user1.id === user.id ? convo.user2 : convo.user1;
              const sortedMessages = (convo.private_messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              const lastMessage = sortedMessages[0];
              const isUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== user.id;

              return (
                <Link 
                  key={convo.id} 
                  href={`/messages/${convo.id}`}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-colors group cursor-pointer border border-transparent hover:border-gray-100 hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <Avatar className="w-14 h-14 border border-gray-100 shrink-0">
                    <AvatarImage src={otherUser.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="text-lg bg-gray-100 text-gray-600 font-bold">{otherUser.username?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`font-bold text-[16px] truncate ${isUnread ? 'text-black' : 'text-gray-800'}`}>
                        {otherUser.username || "Utilisateur"}
                      </span>
                      {lastMessage && (
                        <span className={`text-[11px] shrink-0 ml-2 ${isUnread ? 'text-primary font-bold' : 'text-gray-400'}`}>
                          {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {lastMessage ? (
                        <>
                          {lastMessage.media_url && <ImageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                          <span className={`text-[14px] truncate ${isUnread ? 'text-black font-semibold' : 'text-gray-500'}`}>
                            {lastMessage.sender_id === user.id ? 'Vous: ' : ''}
                            {lastMessage.message || 'Image envoyée'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[14px] text-gray-400 italic">Nouvelle conversation</span>
                      )}
                    </div>
                  </div>
                  
                  {isUnread && (
                    <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mr-1 shadow-[0_0_8px_rgba(30,143,69,0.5)]"></div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
