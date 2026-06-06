"use client";

// cspell:disable
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchEvent {
  time: string;
  type: "BUT" | "CARTON_JAUNE" | "CARTON_ROUGE" | "PENALTY" | "PROLONGATION";
  team: "home" | "away";
  player: string;
  score?: string;
  info?: string;
}

interface MatchEventsTimelineProps {
  apiId?: string | null;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  isLive: boolean;
  isFinished: boolean;
}

// ─── Icônes par type d'événement ───
function EventIcon({ type }: { type: MatchEvent["type"] }) {
  switch (type) {
    case "BUT":
      return <span className="text-lg">⚽️</span>;
    case "PENALTY":
      return <span className="text-lg">⚽️</span>;
    case "CARTON_JAUNE":
      return (
        <div className="w-4 h-5 bg-yellow-400 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
      );
    case "CARTON_ROUGE":
      return (
        <div className="w-4 h-5 bg-red-600 rounded-sm shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
      );
    case "PROLONGATION":
      return <span className="text-lg">⏱️</span>;
    default:
      return <span className="text-lg">📋</span>;
  }
}

// ─── Couleur de fond par type ───
function eventBgColor(type: MatchEvent["type"]) {
  switch (type) {
    case "BUT":
    case "PENALTY":
      return "bg-green-500/10 border-green-500/30";
    case "CARTON_ROUGE":
      return "bg-red-500/10 border-red-500/30";
    case "CARTON_JAUNE":
      return "bg-yellow-500/10 border-yellow-500/30";
    default:
      return "bg-white/5 border-white/10";
  }
}

function eventLabel(type: MatchEvent["type"], info?: string) {
  if (type === "PENALTY") return "But sur penalty";
  if (type === "BUT") return "But";
  if (type === "CARTON_JAUNE") return "Carton Jaune";
  if (type === "CARTON_ROUGE") return "Carton Rouge";
  if (type === "PROLONGATION") return "Prolongation";
  return info || "";
}

export function MatchEventsTimeline({
  apiId,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  isLive,
  isFinished,
}: MatchEventsTimelineProps) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [score, setScore] = useState<string | null>(null);
  const [htScore, setHtScore] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(() => !!apiId);
  const prevEventsCount = useRef(0);

  useEffect(() => {
    if (!apiId) {
      return;
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/matches/${apiId}/live`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.error) return;

        setEvents(data.events || []);
        setScore(data.score || null);
        setHtScore(data.halfTimeScore || null);
        setLastUpdate(new Date());
        prevEventsCount.current = data.events?.length || 0;
      } catch {
        // silencieux
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    // Polling toutes les 30s si match en direct
    if (isLive) {
      const interval = setInterval(fetchEvents, 30000);
      return () => clearInterval(interval);
    }
  }, [apiId, isLive]);

  if (!apiId) {
    return (
      <div className="bg-[#111] rounded-2xl border border-[#222] p-6 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 text-sm">
          Aucun identifiant API disponible pour ce match.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-white font-bold text-sm tracking-widest">
            ÉVÉNEMENTS DU MATCH
          </span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 items-center">
              <div className="w-10 h-4 bg-white/10 rounded" />
              <div className="w-6 h-6 bg-white/10 rounded-full" />
              <div className="flex-1 h-4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#222]">
        <div className="flex items-center gap-2">
          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
          )}
          <span className="text-white font-bold text-sm tracking-widest">
            ÉVÉNEMENTS DU MATCH
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && lastUpdate && (
            <span className="text-[10px] text-gray-500">
              Mis à jour {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/40 px-1.5 py-0.5 rounded tracking-wide">
            API RÉELLE
          </span>
        </div>
      </div>

      {/* ─── SCORE HEADER ─── */}
      {score && (
        <div className="bg-[#161616] border-b border-[#222] px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Équipe domicile */}
            <div className="flex items-center gap-2 flex-1">
              {homeLogo ? (
                <img src={homeLogo} alt={homeTeam} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10" />
              )}
              <span className="text-white font-bold text-sm truncate">{homeTeam}</span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center px-4">
              <div className="text-white font-black text-3xl tracking-tighter leading-none">
                {score}
              </div>
              {htScore && htScore !== "0 - 0" && (
                <div className="text-gray-500 text-[11px] mt-1">
                  Mi-temps : {htScore}
                </div>
              )}
              <div className={`text-[10px] mt-1 font-bold px-2 py-0.5 rounded-full ${
                isLive
                  ? "text-red-400 bg-red-500/10"
                  : isFinished
                  ? "text-gray-400 bg-white/5"
                  : "text-gray-500"
              }`}>
                {isLive ? "EN DIRECT" : isFinished ? "TERMINÉ" : "À VENIR"}
              </div>
            </div>

            {/* Équipe extérieure */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-white font-bold text-sm truncate text-right">{awayTeam}</span>
              {awayLogo ? (
                <img src={awayLogo} alt={awayTeam} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── LISTE DES ÉVÉNEMENTS ─── */}
      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">
              {isLive ? "⏳" : isFinished ? "📋" : "🏟️"}
            </div>
            <p className="text-gray-500 text-sm">
              {isLive
                ? "En attente du premier événement..."
                : isFinished
                ? "Aucun événement enregistré pour ce match."
                : "Les événements apparaîtront au coup d'envoi."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Ligne centrale : terrain */}
            <div className="relative">
              {/* Ligne de temps centrale */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#333] -translate-x-px" />

              <AnimatePresence>
                {events.map((ev, idx) => {
                  const isHome = ev.team === "home";
                  return (
                    <motion.div
                      key={`${ev.time}-${ev.player}-${idx}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-2 mb-2 ${
                        isHome ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      {/* Côté équipe : infos événement */}
                      <div
                        className={`flex-1 flex ${isHome ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm max-w-[85%] ${eventBgColor(ev.type)} ${
                            isHome ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span
                              className={`font-bold text-white text-[13px] ${
                                isHome ? "text-right" : "text-left"
                              }`}
                            >
                              {ev.player}
                            </span>
                            <span
                              className={`text-[11px] text-gray-400 ${
                                isHome ? "text-right" : "text-left"
                              }`}
                            >
                              {eventLabel(ev.type, ev.info)}
                              {ev.score && (
                                <span className="ml-1 text-white font-bold">
                                  ({ev.score})
                                </span>
                              )}
                            </span>
                          </div>
                          <EventIcon type={ev.type} />
                        </div>
                      </div>

                      {/* Minute centrale */}
                      <div className="w-12 shrink-0 flex justify-center z-10">
                        <div className="bg-[#1a1a1a] border border-[#333] text-[#00ff88] font-mono text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                          {ev.time}&apos;
                        </div>
                      </div>

                      {/* Côté opposé : vide */}
                      <div className="flex-1" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Fin du match */}
            {isFinished && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mt-4 pt-4 border-t border-[#222]"
              >
                <div className="flex-1 h-px bg-[#333]" />
                <span className="text-gray-500 text-xs font-bold tracking-widest px-3 py-1 border border-[#333] rounded-full">
                  TEMPS RÉGLEMENTAIRE
                </span>
                <div className="flex-1 h-px bg-[#333]" />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
