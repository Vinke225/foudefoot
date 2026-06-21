"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PlayerStat = {
  id: number;
  name: string;
  photo: string;
  team: string;
  teamLogo: string;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  rating: string;
  position: string;
};

export default function StatistiquesPage() {
  const [activeTab, setActiveTab] = useState<"topscorers" | "topassists" | "topyellowcards" | "topredcards">("topscorers");
  const [data, setData] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/statistics/${activeTab}`);
      const json = await res.json();
      if (json.players) {
        setData(json.players);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    switch(activeTab) {
      case "topscorers": return "Buts";
      case "topassists": return "Passes";
      case "topyellowcards": return "Jaunes";
      case "topredcards": return "Rouges";
      default: return "";
    }
  };

  const getMetricValue = (player: PlayerStat) => {
    switch(activeTab) {
      case "topscorers": return player.goals;
      case "topassists": return player.assists;
      case "topyellowcards": return player.yellowCards;
      case "topredcards": return player.redCards;
      default: return "";
    }
  };

  const tabs = [
    { id: "topscorers", label: "Buteurs" },
    { id: "topassists", label: "Passeurs" },
    { id: "topyellowcards", label: "Cartons Jaunes" },
    { id: "topredcards", label: "Cartons Rouges" }
  ] as const;

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 md:p-8 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Top Joueurs</h1>
            <p className="text-sm text-gray-500 font-medium">Les meilleurs joueurs de la compétition</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex overflow-x-auto hide-scrollbar gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeTab === tab.id 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Chargement des statistiques...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Aucune donnée disponible pour cette catégorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((player, index) => (
              <div key={`${player.id}-${index}`} className="flex items-center p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                <div className="w-8 text-center shrink-0">
                  <span className={cn(
                    "text-lg font-black",
                    index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-gray-300"
                  )}>
                    {index + 1}
                  </span>
                </div>

                <div className="flex items-center flex-1 gap-4 ml-2">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50">
                    <Image 
                      src={player.photo} 
                      alt={player.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{player.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Image src={player.teamLogo} alt={player.team} width={14} height={14} className="rounded-full" />
                      <span className="text-xs text-gray-500 font-medium">{player.team}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{player.position}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end pr-4">
                  <span className="text-2xl font-black text-primary">
                    {getMetricValue(player)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {getMetricLabel()}
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
