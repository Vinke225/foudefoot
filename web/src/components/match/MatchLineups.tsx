"use client";

import { useEffect, useState } from "react";
import { Loader2, Shirt } from "lucide-react";

interface Player {
  lineup_player: string;
  lineup_number: string;
}

interface TeamLineup {
  starting_lineups: Player[];
  substitutes: Player[];
  coach: { lineup_player: string }[];
}

interface LineupData {
  home: TeamLineup;
  away: TeamLineup;
}

import { createClient } from '@/utils/supabase/client';

export function MatchLineups({ apiId }: { apiId: string | null }) {
  const [lineups, setLineups] = useState<LineupData | null>(null);
  const [loading, setLoading] = useState(!!apiId);
  const [error, setError] = useState<string | null>(!apiId ? "Les compositions ne sont pas encore disponibles pour ce match." : null);
  const supabase = createClient();

  useEffect(() => {
    if (!apiId) return;

    const fetchLineups = async () => {
      try {
        // We first try to get it from our Next.js API route which will 
        // check Supabase and fallback to API-SPORTS if missing, then cache it
        const response = await fetch(`/api/matches/${apiId}/lineups`);
        if (!response.ok) {
          throw new Error("Erreur de récupération des compositions");
        }
        const data = await response.json();
        
        if (!data?.lineup || (!data.lineup.home && !data.lineup.away)) {
           setLineups(null);
        } else {
           setLineups(data.lineup as unknown as LineupData);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchLineups();
  }, [apiId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-gray-500">
        {error}
      </div>
    );
  }

  if (!lineups || (!lineups.home.starting_lineups.length && !lineups.away.starting_lineups.length)) {
    return (
      <div className="text-center py-10 text-gray-500">
        Aucune composition n&apos;a encore été communiquée pour ce match.
      </div>
    );
  }

  const renderTeam = (team: TeamLineup, title: string) => (
    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
      <h4 className="font-bold text-black mb-4 border-b pb-2">{title}</h4>
      
      <div className="mb-4">
        <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Titulaires</h5>
        <div className="space-y-2">
          {team.starting_lineups.map((player, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                {player.lineup_number || <Shirt size={12} />}
              </div>
              <span className="text-sm text-gray-800">{player.lineup_player}</span>
            </div>
          ))}
        </div>
      </div>

      {team.substitutes?.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Remplaçants</h5>
          <div className="space-y-2">
            {team.substitutes.map((player, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-500">
                  {player.lineup_number || <Shirt size={12} />}
                </div>
                <span className="text-sm text-gray-600">{player.lineup_player}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {team.coach?.length > 0 && (
        <div>
          {/* cspell:disable-next-line */}
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Entraîneur</h5>
          <span className="text-sm font-medium text-gray-800">{team.coach[0].lineup_player}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="px-6 pb-24 space-y-6">
      <h3 className="font-bold text-lg text-black">Compositions des équipes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderTeam(lineups.home, "Équipe Domicile")}
        {renderTeam(lineups.away, "Équipe Extérieure")}
      </div>
    </div>
  );
}
