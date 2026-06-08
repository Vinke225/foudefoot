// cspell:disable
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CompetitionsPage() {
  const competitions = [
    {
      id: 28,
      name: "Coupe du Monde",
      country: "Monde",
      status: "Groupes",
      image: "https://apiv3.apifootball.com/badges/logo_leagues/28_world-cup.png",
      color: "bg-amber-500",
    },
    {
      id: 152,
      name: "Premier League",
      country: "Angleterre",
      status: "Championnat",
      image: "https://apiv3.apifootball.com/badges/logo_leagues/152_premier-league.png",
      color: "bg-purple-600",
    },
    {
      id: 302,
      name: "La Liga",
      country: "Espagne",
      status: "Championnat",
      image: "https://apiv3.apifootball.com/badges/logo_leagues/302_la-liga.png",
      color: "bg-orange-500",
    },
    {
      id: 207,
      name: "Serie A",
      country: "Italie",
      status: "Championnat",
      image: "https://apiv3.apifootball.com/badges/logo_leagues/207_serie-a.png",
      color: "bg-blue-600",
    },
    {
      id: 175,
      name: "Bundesliga",
      country: "Allemagne",
      status: "Championnat",
      image: "https://apiv3.apifootball.com/badges/logo_leagues/175_bundesliga.png",
      color: "bg-red-600",
    },
    {
      id: 168,
      name: "Ligue 1",
      country: "France",
      status: "Championnat",
      image: "https://apiv3.apifootball.com/badges/logo_leagues/168_ligue-1.png",
      color: "bg-indigo-900",
    }
  ];

  return (
    <div className="flex flex-col h-full pb-10">
      <div className="flex items-center gap-8 border-b border-border/40 px-6 pt-2 mb-6">
        <button className="pb-3 border-b-[3px] border-primary font-bold text-[15px] text-black cursor-default">Clubs/Pays</button>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-black tracking-tight">Compétitions</h1>
          </div>

          <div className="grid gap-5">
            {competitions.map((comp) => (
              <Link key={comp.id} href={`/competitions/${comp.id}`} className="block">
                <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-4 flex items-center gap-5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all cursor-pointer group">
                  <div className="relative w-20 h-20 rounded-2xl shrink-0 bg-gray-50 flex items-center justify-center p-2 border border-gray-100 group-hover:border-primary/20 transition-colors">
                    <img src={comp.image} alt={comp.name} className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-sm uppercase tracking-wider ${comp.color}`}>
                        {comp.status}
                      </span>
                    </div>
                    <h2 className="text-[17px] font-bold text-black group-hover:text-primary transition-colors">{comp.name}</h2>
                    <p className="text-[13px] text-gray-500 font-medium">{comp.country}</p>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="h-32"></div>
        </div>
      </ScrollArea>
    </div>
  );
}
