import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PrivateChat } from "@/components/chat/PrivateChat";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function ConversationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch conversation and verify user is a participant
  const { data } = await supabase
    .from('conversations')
    .select(`
      id,
      user1:users!conversations_user1_id_fkey(id, username, avatar, country),
      user2:users!conversations_user2_id_fkey(id, username, avatar, country)
    `)
    .eq('id', params.id)
    .single();
    
  const convo = data as any;

  if (!convo) {
    notFound();
  }

  const isParticipant = convo.user1.id === user.id || convo.user2.id === user.id;
  if (!isParticipant) {
    redirect("/messages");
  }

  const otherUser = convo.user1.id === user.id ? convo.user2 : convo.user1;

  // Mark all unread messages from the other user as read
  await supabase
    .from('private_messages')
    .update({ is_read: true })
    .eq('conversation_id', params.id)
    .eq('sender_id', otherUser.id)
    .eq('is_read', false);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Button>
        </Link>
        <Link href={`/profil/${otherUser.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-4 rounded-full transition-colors">
          <Avatar className="w-10 h-10 border border-gray-100 shrink-0">
            <AvatarImage src={otherUser.avatar || undefined} className="object-cover" />
            <AvatarFallback>{otherUser.username?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] text-gray-900 leading-tight">
              {otherUser.username || "Utilisateur"}
            </span>
            {otherUser.country && (
              <span className="text-[11px] text-gray-500 leading-tight">{otherUser.country}</span>
            )}
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <PrivateChat conversationId={params.id} otherUser={otherUser} currentUser={{ id: user.id }} />
      </div>
    </div>
  );
}
