// cspell:disable
import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Fonction pour récupérer le nom de la ligue basé sur l'ID
function getLeagueName(id: string) {
  const leagues: Record<string, string> = {
    "28": "Coupe du Monde",
    "152": "Premier League",
    "302": "La Liga",
    "207": "Serie A",
    "175": "Bundesliga",
    "168": "Ligue 1",
  };
  return leagues[id] || "Classement";
}

export const revalidate = 3600; // Cache d'une heure

export default async function LeagueStandingsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const leagueId = params.id;
  const leagueName = getLeagueName(leagueId);

  let standings: Array<Record<string, string>> = [];
  let errorMsg = null;

  try {
    // Appel interne à notre route API
    // On utilise une URL absolue car on est côté serveur
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/standings/${leagueId}`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Erreur lors de la récupération du classement.");
    }

    const data = await res.json();
    standings = data.standings || [];
    
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-10">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/competitions" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-black tracking-tight">{leagueName}</h1>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saison en cours</span>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto w-full">
        {errorMsg ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
            <h3 className="font-bold text-lg mb-2 text-red-500">Erreur</h3>
            <p className="text-gray-500">{errorMsg}</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
            <h3 className="font-bold text-lg mb-2">Classement indisponible</h3>
            <p className="text-gray-500">Le classement n&apos;est pas encore disponible pour cette compétition.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12">#</th>
                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{leagueId === "28" ? "Pays" : "Club"}</th>
                    <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-10">J</th>
                    <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-10 hidden sm:table-cell">G</th>
                    <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-10 hidden sm:table-cell">N</th>
                    <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-10 hidden sm:table-cell">P</th>
                    <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12 hidden md:table-cell">DB</th>
                    <th className="py-4 px-4 text-xs font-black text-black uppercase tracking-wider text-center w-14">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {standings.map((team, index) => {
                    const pos = parseInt(team.overall_league_position || "0");
                    const isTop4 = pos <= 4;
                    
                    // On ne colore la relégation que si ce n'est pas un classement de groupe de coupe du monde
                    const isWorldCup = leagueId === "28";
                    const isRelegation = !isWorldCup && pos >= standings.length - 2;
                    
                    const isNewGroup = team.league_round && (index === 0 || team.league_round !== standings[index - 1].league_round);
                    
                    return (
                      <React.Fragment key={index}>
                        {isNewGroup && (
                          <tr className="bg-gray-100/80">
                            <td colSpan={8} className="py-2 px-4 text-xs font-black text-gray-700 uppercase tracking-wider">
                              {team.league_round}
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold
                              ${pos === 1 ? 'bg-yellow-100 text-yellow-700' : 
                                isTop4 ? 'bg-blue-50 text-blue-600' : 
                                isRelegation ? 'bg-red-50 text-red-600' : 'text-gray-500'}`}>
                              {team.overall_league_position}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/teams/${team.team_id}`} className="flex items-center gap-3 group/team cursor-pointer">
                              <div className="w-8 h-8 relative shrink-0 group-hover/team:scale-110 transition-transform">
                                <Image 
                                  src={team.team_badge || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=300&auto=format&fit=crop"} 
                                  alt={team.team_name} 
                                  fill 
                                  className="object-contain" 
                                  unoptimized 
                                />
                              </div>
                              <span className="font-bold text-[14px] text-gray-900 group-hover/team:text-primary transition-colors truncate max-w-30 sm:max-w-xs">
                                {team.team_name}
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 px-2 text-center text-[13px] font-semibold text-gray-600">{team.overall_league_payed}</td>
                          <td className="py-3 px-2 text-center text-[13px] font-medium text-gray-500 hidden sm:table-cell">{team.overall_league_W}</td>
                          <td className="py-3 px-2 text-center text-[13px] font-medium text-gray-500 hidden sm:table-cell">{team.overall_league_D}</td>
                          <td className="py-3 px-2 text-center text-[13px] font-medium text-gray-500 hidden sm:table-cell">{team.overall_league_L}</td>
                          <td className="py-3 px-2 text-center text-[13px] font-medium text-gray-500 hidden md:table-cell">
                            {parseInt(team.overall_league_GF) - parseInt(team.overall_league_GA) > 0 ? '+' : ''}
                            {parseInt(team.overall_league_GF) - parseInt(team.overall_league_GA)}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-[15px] text-black bg-gray-50/30">
                            {team.overall_league_PTS}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
