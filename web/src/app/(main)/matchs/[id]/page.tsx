import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { LiveChat } from "@/components/chat/LiveChat";
import { MatchStats } from "@/components/match/MatchStats";
import { MatchLineups } from "@/components/match/MatchLineups";
import { LiveSimulation } from "@/components/match/LiveSimulation";
import { MatchEventsTimeline } from "@/components/match/MatchEventsTimeline";
import { MatchScoreLive } from "@/components/match/MatchScoreLive";
import { MatchPrediction } from "@/components/match/MatchPrediction";
import { notFound } from "next/navigation";

export const revalidate = 0;

const getInitials = (name: string) => {
  if (!name) return "??";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default async function MatchDetailPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const tab = searchParams?.tab || 'direct';

  const supabase = await createClient();
  
  let match = null;
  const idParam = params.id;
  
  // Si l'URL utilise un slug (ex: france-vs-espagne-12345) ou un API ID
  const parts = idParam.split('-');
  const possibleApiId = parts[parts.length - 1];
  
  if (/^\d+$/.test(possibleApiId)) {
    const { data } = await supabase.from('matches').select('*').eq('api_id', possibleApiId).single();
    match = data;
  }
  
  // Fallback si c'est un UUID classique ou si la recherche par API ID a échoué
  if (!match && idParam.length === 36 && idParam.includes('-')) {
    const { data } = await supabase.from('matches').select('*').eq('id', idParam).single();
    match = data;
  }

  if (!match) {
    notFound();
  }

  const { getMatchSlug } = await import("@/utils/match");
  const matchSlug = getMatchSlug(match);

  const isFinished = ['FT', 'Finished', 'Terminé'].includes(match.status);

  return (
    <div className="flex flex-col h-full pb-2 relative">
      {/* Header with back button */}
      <div className="flex items-center gap-4 px-6 pt-4 mb-4">
        <Link href="/matchs">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-black" />
          </Button>
        </Link>
        <h1 className="font-bold text-[19px] text-black">Détails du Match</h1>
      </div>

      <ScrollArea className="flex-1">
        <div>
          {/* Match Score Banner */}
          <div className="px-6 mb-6">
            <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
              <div className="bg-linear-to-r from-green-50 to-emerald-50 p-6 sm:p-8">
                <div className="flex justify-between items-center text-[11px] font-bold mb-6">
                  {match.status === 'LIVE' ? (
                    <>
                      <span className="text-primary tracking-widest flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-md backdrop-blur-sm shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        EN COURS
                      </span>
                      <span className="text-primary font-mono text-base font-bold bg-white/60 px-3 py-1.5 rounded-md backdrop-blur-sm shadow-sm">Live</span>
                    </>
                  ) : (
                    <span className="text-gray-400 tracking-widest bg-white/60 px-3 py-1.5 rounded-md backdrop-blur-sm shadow-sm">
                      {isFinished ? 'TERMINÉ' : 'À VENIR'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center px-4">
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    {match.home_logo ? (
                       <img src={match.home_logo} alt={match.home_team} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-contain bg-white border-4 border-white shadow-md p-2" />
                    ) : (
                       <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-bold text-3xl sm:text-4xl text-white bg-linear-to-br from-primary to-green-600 shadow-md border-4 border-white">
                         {getInitials(match.home_team)}
                       </div>
                    )}
                    <span className="font-bold text-[19px] text-gray-900 text-center">{match.home_team}</span>
                  </div>
                  <div className="text-[54px] font-black text-black tracking-tighter w-1/3 text-center leading-none">
                    <MatchScoreLive initialScore={match.score} apiId={match.api_id} isLive={match.status === 'LIVE'} />
                  </div>
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    {match.away_logo ? (
                       <img src={match.away_logo} alt={match.away_team} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-contain bg-white border-4 border-white shadow-md p-2" />
                    ) : (
                       <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-bold text-3xl sm:text-4xl text-white bg-linear-to-br from-blue-500 to-blue-700 shadow-md border-4 border-white">
                         {getInitials(match.away_team)}
                       </div>
                    )}
                    <span className="font-bold text-[19px] text-gray-900 text-center">{match.away_team}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex border-t border-gray-100 bg-white overflow-x-auto">
                <Link href={`/matchs/${matchSlug}?tab=direct`} className={`flex-1 py-4 text-center font-bold border-b-[3px] text-[14px] transition-colors whitespace-nowrap px-2 ${tab === 'direct' ? 'border-primary text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Direct</Link>
                <Link href={`/matchs/${matchSlug}?tab=evenements`} className={`flex-1 py-4 text-center font-bold border-b-[3px] text-[14px] transition-colors whitespace-nowrap px-2 ${tab === 'evenements' ? 'border-primary text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Événements</Link>
                <Link href={`/matchs/${matchSlug}?tab=predictions`} className={`flex-1 py-4 text-center font-bold border-b-[3px] text-[14px] transition-colors whitespace-nowrap px-2 ${tab === 'predictions' ? 'border-primary text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Prédictions</Link>
                <Link href={`/matchs/${matchSlug}?tab=chat`} className={`flex-1 py-4 text-center font-bold border-b-[3px] text-[14px] transition-colors whitespace-nowrap px-2 ${tab === 'chat' ? 'border-primary text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Chat</Link>
                <Link href={`/matchs/${matchSlug}?tab=stats`} className={`flex-1 py-4 text-center font-bold border-b-[3px] text-[14px] transition-colors whitespace-nowrap px-2 ${tab === 'stats' ? 'border-primary text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Stats</Link>
                <Link href={`/matchs/${matchSlug}?tab=lineups`} className={`flex-1 py-4 text-center font-bold border-b-[3px] text-[14px] transition-colors whitespace-nowrap px-2 ${tab === 'lineups' ? 'border-primary text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Compos</Link>
              </div>
            </div>
          </div>

          {tab === 'direct' && (
             <div className="px-6 mb-10 space-y-4">
               <LiveSimulation 
                  homeTeam={match.home_team} 
                  awayTeam={match.away_team}
                  homeLogo={match.home_logo}
                  awayLogo={match.away_logo}
                  homeLineup={match.lineups?.home?.starting_lineups || []}
                  awayLineup={match.lineups?.away?.starting_lineups || []}
                  score={match.score}
                  statistics={match.statistics || []}
                  isLive={match.status === 'LIVE'}
                  isFinished={isFinished}
                  matchDate={match.match_date || match.created_at || null}
                  apiId={match.api_id || null}
               />
               {/* Widget Événements sous le simulateur */}
               <MatchEventsTimeline
                  apiId={match.api_id || null}
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  homeLogo={match.home_logo}
                  awayLogo={match.away_logo}
                  isLive={match.status === 'LIVE'}
                  isFinished={isFinished}
               />
             </div>
          )}
          {tab === 'evenements' && (
             <div className="px-6 mb-10">
               <MatchEventsTimeline
                  apiId={match.api_id || null}
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  homeLogo={match.home_logo}
                  awayLogo={match.away_logo}
                  isLive={match.status === 'LIVE'}
                  isFinished={isFinished}
               />
             </div>
          )}
          {tab === 'predictions' && (
             <div className="px-6 mb-10">
               <MatchPrediction 
                  homeTeam={match.home_team} 
                  awayTeam={match.away_team} 
                  dateStr={match.match_date || new Date().toISOString()} 
               />
             </div>
          )}
          {tab === 'chat' && <LiveChat matchId={match.id} />}
          {tab === 'stats' && <MatchStats apiId={match.api_id} />}
          {tab === 'lineups' && <MatchLineups apiId={match.api_id} />}
        </div>
      </ScrollArea>

    </div>
  );
}
