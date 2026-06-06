"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createClient } from '@/utils/supabase/client';

export function MatchStats({ apiId }: { apiId: string | null }) {
  const [stats, setStats] = useState<Array<{ type: string, home: string, away: string }> | null>(null);
  const [loading, setLoading] = useState(!!apiId);
  const [error, setError] = useState<string | null>(!apiId ? "Les statistiques ne sont pas encore disponibles pour ce match." : null);

  useEffect(() => {
    if (!apiId) return;
    const supabase = createClient();

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('statistics')
          .eq('api_id', apiId)
          .single();
          
        if (error) {
           throw new Error(error.message || "Erreur de récupération des statistiques");
        }
        
        setStats(data?.statistics || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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

  if (!stats || stats.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Aucune statistique n&apos;a encore été communiquée pour ce match.
      </div>
    );
  }

  return (
    <div className="px-6 pb-24 space-y-4">
      <h3 className="font-bold text-lg mb-4 text-black">Statistiques du match</h3>

      {stats.map((stat, index: number) => {
        // Nettoyage des valeurs pour le calcul du pourcentage (ex: "43%" -> 43)
        const homeRaw = stat.home.replace('%', '');
        const awayRaw = stat.away.replace('%', '');
        
        const homeVal = parseFloat(homeRaw) || 0;
        const awayVal = parseFloat(awayRaw) || 0;
        const total = homeVal + awayVal;
        
        const homePercent = total > 0 ? (homeVal / total) * 100 : 50;
        const awayPercent = total > 0 ? (awayVal / total) * 100 : 50;
        
        const TRANSLATIONS: Record<string, string> = {
          "Corners": "Corners",
          "Throw In": "Touches",
          "Free Kick": "Coups Francs",
          "Goal Kick": "Dégagements",
          "Penalty": "Penaltys",
          "Substitution": "Remplacements",
          "Attacks": "Attaques",
          "Dangerous Attacks": "Attaques Dangereuses",
          "On Target": "Tirs Cadrés",
          "Off Target": "Tirs Non Cadrés",
          "Ball Possession": "Possession",
          "Yellow Cards": "Cartons Jaunes",
          "Red Cards": "Cartons Rouges",
          "Saves": "Arrêts",
          "Passes Total": "Passes Totales",
          "Passes Accurate": "Passes Réussies",
          "Fouls": "Fautes",
          "Shots Total": "Tirs Totaux",
          "Shots On Goal": "Tirs Cadrés",
          "Shots Off Goal": "Tirs Non Cadrés",
          "Shots Blocked": "Tirs Contrés",
          "Shots Inside Box": "Tirs dans la Surface",
          "Shots Outside Box": "Tirs hors Surface"
        };
        const translatedType = TRANSLATIONS[stat.type] || stat.type;

        return (
          <div key={index} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-black">{stat.home || '0'}</span>
              <span className="text-sm font-medium text-gray-500">{translatedType}</span>
              <span className="font-bold text-black">{stat.away || '0'}</span>
            </div>
            <div className="flex h-2 w-full gap-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-r-full transition-all duration-500" style={{ width: `${homePercent}%` }}></div>
              <div className="bg-gray-200 h-full rounded-l-full transition-all duration-500" style={{ width: `${awayPercent}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
