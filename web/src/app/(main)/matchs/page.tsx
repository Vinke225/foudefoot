import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 0;

const getInitials = (name: string) => {
  if (!name) return "??";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default async function MatchsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || 'tous';

  const supabase = await createClient();
  const { data: allMatches } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: true });

  const matches = allMatches?.filter(match => {
    if (tab === 'live') return match.status === 'LIVE';
    if (tab === 'avenir') return match.status === 'NS';
    if (tab === 'termines') return ['FT', 'Finished', 'Terminé'].includes(match.status);
    return true; // 'tous'
  });

  return (
    <div className="flex flex-col h-full pb-10">
      {/* Header Tabs */}
      <div className="flex items-center gap-8 border-b border-border/40 px-6 pt-2 mb-6 overflow-x-auto">
        <Link href="/matchs?tab=tous" className={`pb-3 border-b-[3px] font-bold text-[15px] whitespace-nowrap transition-colors ${tab === 'tous' ? 'border-primary text-black' : 'border-transparent text-muted-foreground hover:text-black'}`}>Tous</Link>
        <Link href="/matchs?tab=live" className={`pb-3 border-b-[3px] font-bold text-[15px] whitespace-nowrap transition-colors ${tab === 'live' ? 'border-primary text-black' : 'border-transparent text-muted-foreground hover:text-black'}`}>En direct</Link>
        <Link href="/matchs?tab=avenir" className={`pb-3 border-b-[3px] font-bold text-[15px] whitespace-nowrap transition-colors ${tab === 'avenir' ? 'border-primary text-black' : 'border-transparent text-muted-foreground hover:text-black'}`}>À venir</Link>
        <Link href="/matchs?tab=termines" className={`pb-3 border-b-[3px] font-bold text-[15px] whitespace-nowrap transition-colors ${tab === 'termines' ? 'border-primary text-black' : 'border-transparent text-muted-foreground hover:text-black'}`}>Terminés</Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-black tracking-tight">Matchs de la compétition</h1>
          </div>

          <div className="space-y-5">
            {matches?.map((match) => {
              const isLive = match.status === 'LIVE';
              const isFinished = ['FT', 'Finished', 'Terminé'].includes(match.status);
              const isUpcoming = match.status === 'NS';

              return (
                <Link key={match.id} href={`/matchs/${match.id}`} className="block">
                  <div className={`bg-white rounded-[24px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer overflow-hidden ${isFinished ? 'opacity-75 hover:opacity-100' : ''}`}>
                    <div className="p-6">
                      
                      {/* Match Status Header */}
                      <div className={`flex items-center text-[11px] font-bold mb-6 ${isUpcoming || isFinished ? 'justify-center text-gray-500 tracking-widest' : 'justify-between'}`}>
                        {isLive && (
                          <>
                            <span className="text-primary tracking-widest flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-md">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              EN COURS
                            </span>
                            <span className="text-primary font-mono text-base font-bold bg-primary/10 px-3 py-1.5 rounded-md">Live</span>
                          </>
                        )}
                        {isUpcoming && (
                          <span className="bg-gray-100 px-4 py-1.5 rounded-md">À VENIR</span>
                        )}
                        {isFinished && (
                          <span className="bg-gray-100 px-4 py-1.5 rounded-md">TERMINÉ</span>
                        )}
                      </div>

                      {/* Teams and Score */}
                      <div className="flex justify-between items-center px-4">
                        <div className="flex flex-col items-center gap-3 w-1/3">
                          {match.home_logo ? (
                            <img src={match.home_logo} alt={match.home_team} className={`w-16 h-16 rounded-full object-contain bg-white border-2 border-gray-50 shadow-sm p-1.5 ${isFinished ? 'opacity-60' : ''}`} />
                          ) : (
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white bg-linear-to-br from-primary to-green-600 shadow-sm border-2 border-white ${isFinished ? 'opacity-60' : ''}`}>
                              {getInitials(match.home_team)}
                            </div>
                          )}
                          <span className={`font-bold text-[17px] text-center ${isFinished ? 'text-gray-500' : 'text-gray-800'}`}>{match.home_team}</span>
                        </div>
                        <div className={`text-[44px] font-black w-1/3 text-center tracking-tighter leading-none ${isUpcoming ? 'text-gray-300 text-[32px]' : isFinished ? 'text-gray-400' : 'text-black'}`}>
                          {match.score || '-'}
                        </div>
                        <div className="flex flex-col items-center gap-3 w-1/3">
                          {match.away_logo ? (
                            <img src={match.away_logo} alt={match.away_team} className={`w-16 h-16 rounded-full object-contain bg-white border-2 border-gray-50 shadow-sm p-1.5 ${isFinished ? 'opacity-60' : ''}`} />
                          ) : (
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white bg-linear-to-br from-blue-500 to-blue-700 shadow-sm border-2 border-white ${isFinished ? 'opacity-60' : ''}`}>
                              {getInitials(match.away_team)}
                            </div>
                          )}
                          <span className={`font-bold text-[17px] text-center ${isFinished ? 'text-gray-500' : 'text-gray-800'}`}>{match.away_team}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer for LIVE matches */}
                    {isLive && (
                      <div className="bg-gray-50 py-4 text-center border-t border-gray-100">
                        <span className="text-primary font-bold text-[15px]">Rejoindre le Live Chat</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}

            {(!matches || matches.length === 0) && (
              <div className="text-center py-10 text-gray-500">Aucun match trouvé pour cette catégorie.</div>
            )}
          </div>
          <div className="h-32"></div>
        </div>
      </ScrollArea>
    </div>
  );
}
