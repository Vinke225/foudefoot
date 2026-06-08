import { Button } from "@/components/ui/button";
import { PlayCircle, TrendingUp, ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { startConversation } from "@/actions/messages";
import { redirect } from "next/navigation";
import { getMatchSlug } from "@/utils/match";
import { UserOnlineAvatar } from "@/components/user/UserOnlineAvatar";

export async function RightSidebar() {
  const supabase = await createClient();

  // Fetch Matches (LIVE or NS - Not Started)
  const { data: rawMatches } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['LIVE', 'NS', 'HT'])
    .order('match_date', { ascending: true })
    .limit(4);

  // Fetch Users for Suggestions
  const { data: suggestedUsers } = await supabase
    .from('users')
    .select('id, username, avatar, country')
    .order('created_at', { ascending: false })
    .limit(3);

  // Trier: LIVE en premier, puis NS
  const matches = (rawMatches || []).sort((a, b) => {
    const isLiveA = a.status === 'LIVE' || a.status === 'HT';
    const isLiveB = b.status === 'LIVE' || b.status === 'HT';
    if (isLiveA && !isLiveB) return -1;
    if (!isLiveA && isLiveB) return 1;
    return 0;
  });

  return (
    <div className="w-87.5 h-screen sticky top-0 pb-6 hidden xl:block space-y-6 overflow-y-auto hide-scrollbar shrink-0 pl-6">
      
      {/* En Direct / Matchs Section */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-bold text-[15px] text-black">Matchs</h2>
          </div>
          <Link href="/matchs" className="text-primary text-[13px] font-semibold hover:underline">
            Voir tout
          </Link>
        </div>
        
        <div className="space-y-4">
          {matches.length === 0 ? (
            <p className="text-[12px] text-gray-500 italic text-center py-2">Aucun match à venir.</p>
          ) : (
            matches.map((match, index) => {
              const isLive = match.status === 'LIVE' || match.status === 'HT';
              return (
                <Link key={match.id} href={`/matchs/${getMatchSlug(match)}`} className={`flex items-center justify-between group cursor-pointer ${index > 0 && !isLive ? 'pt-4 mt-2 border-t border-gray-100' : 'pt-1'}`}>
                  <div className="flex items-center gap-3 w-[35%]">
                    {match.home_logo ? (
                      <img src={match.home_logo} alt={match.home_team} className={`w-6 h-6 rounded-full object-contain border border-gray-100 bg-white p-0.5 ${!isLive && 'opacity-80'}`} />
                    ) : (
                      <div className={`w-6 h-6 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-gray-500 text-[8px] font-bold ${!isLive && 'opacity-80'}`}>
                        {match.home_team.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <span className={`font-bold text-[13px] ${isLive ? 'text-black' : 'text-gray-500'}`}>{match.home_team.substring(0,3).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col items-center w-[30%]">
                    {isLive ? (
                      <>
                        <span className="text-[10px] text-primary font-bold tracking-wider animate-pulse">LIVE</span>
                        <span className="font-black text-lg text-black">{match.score || '-'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                          {match.match_date ? new Date(match.match_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'À VENIR'}
                        </span>
                        <span className="font-black text-lg text-gray-300">-</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-3 w-[35%] relative">
                    <span className={`font-bold text-[13px] ${isLive ? 'text-black' : 'text-gray-500'}`}>{match.away_team.substring(0,3).toUpperCase()}</span>
                    {match.away_logo ? (
                      <img src={match.away_logo} alt={match.away_team} className={`w-6 h-6 rounded-full object-contain border border-gray-100 bg-white p-0.5 ${!isLive && 'opacity-80'}`} />
                    ) : (
                      <div className={`w-6 h-6 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-gray-500 text-[8px] font-bold ${!isLive && 'opacity-80'}`}>
                        {match.away_team.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -right-5">
                      {isLive ? (
                        <PlayCircle className="w-4.5 h-4.5 text-primary fill-primary/20 group-hover:scale-110 transition-transform" />
                      ) : (
                        <ChevronRight className="w-4.5 h-4.5 text-gray-300 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

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
