// cspell:disable
import React from "react";
import { ChevronLeft, User, Shield, Target, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SafeImage from "@/components/ui/SafeImage";

interface Player {
  player_id: string;
  player_name: string;
  player_image: string;
  player_type: string;
  player_number: string;
  player_age: string;
  player_rating: string;
  player_match_played: string;
  player_goals: string;
  player_saves: string;
}

interface Coach {
  coach_name: string;
}

interface Team {
  team_name: string;
  team_badge: string;
  coaches: Coach[];
  players: Player[];
}

export const revalidate = 86400; // Cache de 24h

export default async function TeamProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const teamId = params.id;

  let team: Team | null = null;
  let errorMsg = null;

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/teams/${teamId}`, {
      next: { revalidate: 86400 }
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Erreur lors de la récupération de l'équipe.");
    }

    const data = await res.json();
    team = data.team;
    
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  if (errorMsg) {
    return (
      <div className="p-10 text-center">
        <h3 className="font-bold text-lg mb-2 text-red-500">Erreur</h3>
        <p className="text-gray-500">{errorMsg}</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-10 text-center">
        <h3 className="font-bold text-lg mb-2">Équipe introuvable</h3>
      </div>
    );
  }

  const coach = team.coaches?.[0];
  const players = team.players || [];

  // Grouper les joueurs par poste
  const groupedPlayers = players.reduce((acc: Record<string, Player[]>, player: Player) => {
    const type = player.player_type || 'Unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(player);
    return acc;
  }, {});

  // Ordre d'affichage des postes
  const order = ["Goalkeepers", "Defenders", "Midfielders", "Forwards"];
  const typeIcons: Record<string, React.ElementType> = {
    "Goalkeepers": Shield,
    "Defenders": Target,
    "Midfielders": Activity,
    "Forwards": User
  };
  
  const typeTitles: Record<string, string> = {
    "Goalkeepers": "Gardiens",
    "Defenders": "Défenseurs",
    "Midfielders": "Milieux",
    "Forwards": "Attaquants"
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-10">
      {/* Header Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/competitions" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center hover:bg-white transition-colors">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Link>
      </div>

      {/* Team Banner */}
      <div className="bg-linear-to-b from-gray-200/50 to-gray-50/50 pt-20 pb-10 px-6 flex flex-col items-center justify-center border-b border-gray-100">
        <div className="w-28 h-28 relative mb-4">
          <Image 
            src={team.team_badge || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=300&auto=format&fit=crop"} 
            alt={team.team_name} 
            fill 
            className="object-contain drop-shadow-lg" 
            unoptimized 
          />
        </div>
        <h1 className="text-3xl font-black text-black tracking-tight text-center">{team.team_name}</h1>
        {coach && (
          <p className="text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wider">
            Entraîneur : <span className="text-gray-800">{coach.coach_name}</span>
          </p>
        )}
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto w-full">
        {order.map((type) => {
          const group = groupedPlayers[type];
          if (!group || group.length === 0) return null;
          const Icon = typeIcons[type] || User;

          return (
            <div key={type} className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-black">{typeTitles[type] || type}</h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{group.length}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.map((player: Player) => (
                  <div key={player.player_id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden flex flex-col hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all group">
                    <div className="aspect-4/5 w-full relative bg-gray-100/50">
                      <SafeImage 
                        src={player.player_image} 
                        fallbackSrc="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=300&auto=format&fit=crop"
                        alt={player.player_name} 
                        fill 
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500" 
                        unoptimized 
                      />
                      {player.player_number && (
                        <div className="absolute top-3 left-3 w-7 h-7 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                          {player.player_number}
                        </div>
                      )}
                      {player.player_rating && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-primary/90 backdrop-blur-md rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                          ⭐ {player.player_rating}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-[15px] text-gray-900 leading-tight mb-1">{player.player_name}</h3>
                      <p className="text-xs text-gray-500 font-medium mb-4">{player.player_age ? `${player.player_age} ans` : 'Âge inconnu'}</p>
                      
                      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-50 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Matchs</span>
                          <span className="text-sm font-black text-gray-800">{player.player_match_played || "0"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            {type === "Goalkeepers" ? "Arrêts" : "Buts"}
                          </span>
                          <span className="text-sm font-black text-gray-800">
                            {type === "Goalkeepers" ? (player.player_saves || "0") : (player.player_goals || "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
