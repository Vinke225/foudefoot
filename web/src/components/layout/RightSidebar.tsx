import { Button } from "@/components/ui/button";
import { TrendingUp, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { startConversation } from "@/actions/messages";
import { redirect } from "next/navigation";
import { UserOnlineAvatar } from "@/components/user/UserOnlineAvatar";

export async function RightSidebar() {
  const supabase = await createClient();

  // Fetch Users for Suggestions
  const { data: suggestedUsers } = await supabase
    .from('users')
    .select('id, username, avatar, country')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="w-87.5 h-screen sticky top-0 pb-6 hidden xl:block space-y-6 overflow-y-auto hide-scrollbar shrink-0 pl-6">
      


      {/* Suggestions Section */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-[15px] text-black">Suggestions</h2>
        </div>
        <div className="space-y-5">
          {(!suggestedUsers || suggestedUsers.length === 0) ? (
            <p className="text-[12px] text-gray-500 italic">Aucune suggestion.</p>
          ) : (
            suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserOnlineAvatar 
                    userId={user.id} 
                    avatarUrl={user.avatar} 
                    username={user.username} 
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-black flex items-center gap-1.5 hover:underline cursor-pointer">
                      {user.username}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {user.country ? user.country : "Fan de foot"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <form action={async () => {
                    "use server";
                    const res = await startConversation(user.id);
                    if (res.success && res.conversationId) {
                      redirect(`/messages/${res.conversationId}`);
                    }
                  }}>
                    <Button type="submit" variant="ghost" size="icon" className="w-7 h-7 rounded-full text-gray-500 hover:text-primary hover:bg-primary/10" title="Envoyer un message">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </form>
                  <Button variant="outline" size="sm" className="rounded-full text-primary border-primary hover:bg-primary hover:text-white text-[11px] font-bold h-7 px-4">
                    Suivre
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tendances Section (Statique pour le moment) */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-[15px] text-black">Tendances</h2>
        </div>
        <div className="space-y-5">
          {[
            { tag: "#CAN2025", count: "18.7K publications" },
            { tag: "#SuperLeague", count: "15.3K publications" },
            { tag: "#Football", count: "12.1K publications" },
          ].map((trend) => (
            <div key={trend.tag} className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-black group-hover:text-primary transition-colors">{trend.tag}</span>
                <span className="text-[11px] text-gray-500 mt-0.5">{trend.count}</span>
              </div>
              <TrendingUp className="w-4 h-4 text-primary opacity-60" />
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
