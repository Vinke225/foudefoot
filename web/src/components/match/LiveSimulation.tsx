"use client";
// cspell:disable

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Types d'états en français
type MatchState = 
  | 'POSSESSION_DOMICILE' 
  | 'POSSESSION_EXTERIEUR' 
  | 'ATTAQUE_DOMICILE' 
  | 'ATTAQUE_EXTERIEUR' 
  | 'TIR_DOMICILE' 
  | 'TIR_EXTERIEUR' 
  | 'BUT' 
  | 'CORNER' 
  | 'FAUTE' 
  | 'CARTON_ROUGE'
  | 'CARTON_JAUNE'
  | 'MI-TEMPS';

interface Player {
  lineup_player: string;
}

interface StatItem {
  type: string;
  home: string;
  away: string;
}

interface LiveSimulationProps {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeLineup?: Player[];
  awayLineup?: Player[];
  homeColor?: string;
  awayColor?: string;
  score?: string | null;
  statistics?: StatItem[];
  isLive: boolean;
  isFinished?: boolean;
  matchDate?: string | null;
  apiId?: string | null; // ID APIFootball pour les données réelles
}

interface EventLog {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'danger' | 'success' | 'warning';
}

// --- Types du hook horloge ---
type PeriodType = '1ère Mi-Temps' | '2ème Mi-Temps' | 'Mi-Temps' | 'Terminé' | 'À venir';

interface ClockState {
  clockMin: number;
  clockSec: number;
  period: PeriodType;
  stoppageTime: number;
}

// --- Calcul pur de l'état de l'horloge selon les secondes écoulées ---
function computeClockState(elapsed: number, maxSeconds: number): ClockState {
  const clamped = Math.min(elapsed, maxSeconds);
  const totalMin = Math.floor(clamped / 60);
  const sec = clamped % 60;
  const MIN_HALF_TIME = 45;
  const MIN_SECOND_HALF = 50; // 5 min de pause mi-temps

  if (totalMin < MIN_HALF_TIME) {
    return {
      clockMin: totalMin,
      clockSec: sec,
      period: '1ère Mi-Temps',
      stoppageTime: totalMin >= 43 ? 3 : 0,
    };
  }
  if (totalMin >= MIN_HALF_TIME && totalMin < MIN_SECOND_HALF) {
    return { clockMin: 45, clockSec: 0, period: 'Mi-Temps', stoppageTime: 0 };
  }
  if (totalMin >= MIN_SECOND_HALF && totalMin < 95) {
    const displayMin = totalMin - (MIN_SECOND_HALF - 45);
    return {
      clockMin: Math.min(displayMin, 90),
      clockSec: sec,
      period: '2ème Mi-Temps',
      stoppageTime: 0,
    };
  }
  // Temps additionnel 2ème mi-temps
  const addMin = totalMin - 90 + (MIN_SECOND_HALF - 45);
  return {
    clockMin: 90,
    clockSec: sec,
    period: '2ème Mi-Temps',
    stoppageTime: Math.max(3, Math.min(addMin + 3, 7)),
  };
}

// --- Hook horloge de match ---
function useMatchClock(isLive: boolean, isFinished: boolean, matchDate?: string | null) {
  const MAX_SECONDS = (90 + 10) * 60;

  // Calcul des secondes écoulées dès maintenant
  const getStartingSeconds = () => {
    if (!matchDate) return 0;
    const diff = Math.floor((Date.now() - new Date(matchDate).getTime()) / 1000);
    return Math.max(0, diff);
  };

  const [elapsed, setElapsed] = useState(getStartingSeconds);

  useEffect(() => {
    if (isFinished || !isLive) return;

    const tick = () => {
      setElapsed(prev => Math.min(prev + 1, MAX_SECONDS));
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, isFinished, matchDate]);

  // État dérivé pur : aucun setClockState synchrone dans useEffect !
  let clockState;
  if (isFinished) clockState = { clockMin: 90, clockSec: 0, period: 'Terminé', stoppageTime: 0 };
  else if (!isLive) clockState = { clockMin: 0, clockSec: 0, period: 'À venir', stoppageTime: 0 };
  else clockState = computeClockState(elapsed, MAX_SECONDS);
  
  const syncClock = (minutes: number) => {
    setElapsed(minutes * 60);
  };

  return { clockState, syncClock };
}

// Helper pour piocher un joueur au hasard
const getRandomPlayer = (lineup: Player[], fallback: string) => {
  if (!lineup || lineup.length === 0) return fallback;
  const index = Math.floor(Math.random() * (lineup.length - 1)) + 1;
  return lineup[index]?.lineup_player || fallback;
};

const getBallPosition = (state: MatchState) => {
  switch(state) {
    case 'POSSESSION_DOMICILE': return { x: 30, y: 50 };
    case 'POSSESSION_EXTERIEUR': return { x: 70, y: 50 };
    case 'ATTAQUE_DOMICILE': return { x: 75, y: 35 };
    case 'ATTAQUE_EXTERIEUR': return { x: 25, y: 65 };
    case 'TIR_DOMICILE': return { x: 95, y: 50 };
    case 'TIR_EXTERIEUR': return { x: 5, y: 50 };
    case 'BUT': return { x: 50, y: 50 };
    case 'CORNER': return { x: 98, y: 5 };
    case 'FAUTE': 
    case 'CARTON_ROUGE':
    case 'CARTON_JAUNE': return { x: 45, y: 60 };
    default: return { x: 50, y: 50 };
  }
};

export function LiveSimulation({ 
  homeTeam, 
  awayTeam, 
  homeLogo,
  awayLogo,
  homeLineup = [],
  awayLineup = [],
  homeColor = "#ffffff", 
  awayColor = "#ff0000",
  score: initialScore,
  statistics: initialStatistics = [],
  isLive,
  isFinished = false,
  matchDate,
  apiId,
}: LiveSimulationProps) {
  const [currentState, setCurrentState] = useState<MatchState>(isLive ? 'POSSESSION_DOMICILE' : 'MI-TEMPS');
  const [events, setEvents] = useState<EventLog[]>([]);
  const [activeHomePlayer, setActiveHomePlayer] = useState<string>("Joueur");
  const [activeAwayPlayer, setActiveAwayPlayer] = useState<string>("Joueur");
  const eventIdCounter = useRef(0);
  // Score et stats peuvent être mis à jour par l'API
  const [liveScore, setLiveScore] = useState<string | null | undefined>(initialScore);
  const [liveStats, setLiveStats] = useState<StatItem[]>(initialStatistics);
  const [apiSource, setApiSource] = useState(false); // true si les données viennent de l'API
  const prevScoreRef = useRef(initialScore);
  const isFirstFetchRef = useRef(true);
  // Garder la trace des événements déjà affichés (par time+player)
  const shownEventsRef = useRef<Set<string>>(new Set());

  const { clockState: { clockMin, clockSec, period, stoppageTime }, syncClock } = useMatchClock(isLive, isFinished, matchDate);

  // Utiliser le score et stats réels si disponibles
  const score = liveScore !== undefined ? liveScore : initialScore;
  const statistics = liveStats.length > 0 ? liveStats : initialStatistics;

  // Le temps affiché dans les events = minute réelle du match
  const currentTimeLabel = () => {
    if (clockMin >= 90 && stoppageTime > 0) return `90+${stoppageTime}'`;
    if (clockMin >= 45 && period === '1ère Mi-Temps') return `45+'`;
    return `${clockMin}'`;
  };

  const addEvent = (msg: string, type: 'info' | 'danger' | 'success' | 'warning' = 'info') => {
    const newId = eventIdCounter.current + 1;
    eventIdCounter.current = newId;
    setEvents(prev => [{
      id: newId,
      time: currentTimeLabel(),
      message: msg,
      type
    }, ...prev].slice(0, 5));
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  // ═══════════════════════════════════════════════
  // POLLING API FOOTBALL TOUTES LES 30 SECONDES
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!apiId || (!isLive && !isFinished)) return;

    const fetchLiveData = async () => {
      try {
        const res = await fetch(`/api/matches/${apiId}/live`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.error) return;

        setApiSource(true);

        // Mettre à jour le score
        if (data.score && data.score !== liveScore) {
          if (isFirstFetchRef.current) {
            // Mise à jour silencieuse si c'est le chargement initial (DB pas à jour)
            prevScoreRef.current = data.score;
          }
          setLiveScore(data.score);
        }

        if (isFirstFetchRef.current) {
          isFirstFetchRef.current = false;
        }

        // Mettre à jour les stats
        if (data.statistics?.length > 0) {
          setLiveStats(data.statistics);
        }

        // Synchroniser l'horloge avec la vraie minute du match
        if (data.matchElapsed) {
          const minStr = data.matchElapsed.replace("'", "");
          const min = parseInt(minStr, 10);
          if (!isNaN(min)) {
            syncClock(min);
          } else if (data.matchElapsed === 'HT') {
            syncClock(45);
          }
        }

        // Rejouer les événements réels pas encore affichés
        if (Array.isArray(data.events)) {
          for (const ev of data.events) {
            const key = `${ev.time}-${ev.player}-${ev.type}`;
            if (shownEventsRef.current.has(key)) continue;
            shownEventsRef.current.add(key);

            // Déclencher l'animation correspondante
            if (ev.type === 'BUT' || ev.type === 'PENALTY') {
              setCurrentState('BUT');
              const who = ev.team === 'home' ? homeTeam : awayTeam;
              const label = ev.type === 'PENALTY' ? '(pen.)' : '';
              addEvent(`⚽️ BUT ! ${ev.player} ${label} (${who}) - Score : ${ev.score}`, 'success');
              triggerConfetti();
              if (ev.score) setLiveScore(ev.score);
            } else if (ev.type === 'CARTON_ROUGE') {
              setCurrentState('CARTON_ROUGE');
              const side = ev.team === 'home' ? homeTeam : awayTeam;
              if (ev.team === 'away') setActiveAwayPlayer(ev.player);
              else setActiveHomePlayer(ev.player);
              addEvent(`🟥 Carton Rouge : ${ev.player} (${side})`, 'danger');
            } else if (ev.type === 'CARTON_JAUNE') {
              setCurrentState('CARTON_JAUNE');
              const side = ev.team === 'home' ? homeTeam : awayTeam;
              if (ev.team === 'away') setActiveAwayPlayer(ev.player);
              else setActiveHomePlayer(ev.player);
              addEvent(`🟨 Carton Jaune : ${ev.player} (${side})`, 'warning');
            }
          }
        }
      } catch {
        // Silencieux - on continue avec la simulation si l'API échoue
      }
    };

    fetchLiveData(); // Appel immédiat
    const interval = setInterval(fetchLiveData, 30000); // Toutes les 30 secondes
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiId, isLive, isFinished]);

  // Synchronisation du But si le score change
  useEffect(() => {
    if (prevScoreRef.current !== undefined && score && score !== prevScoreRef.current) {
      setCurrentState('BUT');
      addEvent(`⚽️ BUT ! Nouveau score : ${score}`, 'success');
      triggerConfetti();
    }
    prevScoreRef.current = score;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  useEffect(() => {
    if (!isLive) return;

    const getMessageForState = (state: MatchState, pHome: string, pAway: string): { msg: string, type: 'info' | 'danger' | 'success' | 'warning' } => {
      switch(state) {
        case 'POSSESSION_DOMICILE': return { msg: `${pHome} mène la danse pour ${homeTeam}.`, type: 'info' };
        case 'POSSESSION_EXTERIEUR': return { msg: `${pAway} organise le jeu pour ${awayTeam}.`, type: 'info' };
        case 'ATTAQUE_DOMICILE': return { msg: `Belle percée de ${pHome} !`, type: 'warning' };
        case 'ATTAQUE_EXTERIEUR': return { msg: `Accélération de ${pAway} sur le côté !`, type: 'warning' };
        case 'TIR_DOMICILE': return { msg: `Frappe puissante de ${pHome} !`, type: 'danger' };
        case 'TIR_EXTERIEUR': return { msg: `Tir dangereux de ${pAway} !`, type: 'danger' };
        case 'BUT': return { msg: `⚽️ GOAAAL ! Magnifique but de ${pHome} !`, type: 'success' };
        case 'CORNER': return { msg: `🚩 Corner obtenu par ${pHome}.`, type: 'info' };
        case 'FAUTE': return { msg: `🟡 Faute sur ${pAway}, coup franc à suivre.`, type: 'info' };
        case 'CARTON_JAUNE': return { msg: `🟨 Carton Jaune pour ${pAway}.`, type: 'warning' };
        case 'CARTON_ROUGE': return { msg: `🟥 Carton Rouge direct pour ${pAway} !`, type: 'danger' };
        default: return { msg: `Le jeu se poursuit.`, type: 'info' };
      }
    };

    const interval = setInterval(() => {
      // Détermination des probabilités selon les stats
      const possessionStat = statistics.find(s => s.type === 'Ball Possession' || s.type === 'Possession');
      const homePossession = possessionStat ? parseInt(possessionStat.home) : 50;
      
      const states: MatchState[] = ['FAUTE', 'CORNER'];
      
      if (Math.random() * 100 < homePossession) {
        states.push('POSSESSION_DOMICILE', 'POSSESSION_DOMICILE', 'ATTAQUE_DOMICILE', 'TIR_DOMICILE');
      } else {
        states.push('POSSESSION_EXTERIEUR', 'POSSESSION_EXTERIEUR', 'ATTAQUE_EXTERIEUR', 'TIR_EXTERIEUR');
      }

      // Eviter le flood de cartons
      if (Math.random() < 0.05) states.push('CARTON_JAUNE');

      const randomState = states[Math.floor(Math.random() * states.length)];
      setCurrentState(randomState);

      const pHome = getRandomPlayer(homeLineup, "Le N°9");
      const pAway = getRandomPlayer(awayLineup, "Le N°10");
      
      setActiveHomePlayer(pHome.split(' ').pop() || pHome);
      setActiveAwayPlayer(pAway.split(' ').pop() || pAway);
      
      const { msg, type } = getMessageForState(randomState, pHome, pAway);
      addEvent(msg, type);

    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeTeam, awayTeam, isLive, homeLineup, awayLineup, statistics]);

  const ballPos = getBallPosition(currentState);

  // Autres joueurs (décoratifs)
  const bgPlayersHome = Array.from({ length: 6 }).map((_, i) => ({
    id: `home-${i}`,
    baseX: 20 + (i * 10) % 30,
    baseY: 20 + i * 12,
  }));
  
  const bgPlayersAway = Array.from({ length: 6 }).map((_, i) => ({
    id: `away-${i}`,
    baseX: 60 + (i * 10) % 30,
    baseY: 20 + i * 12,
  }));

  // ─── Couleur de la période ───
  const getPeriodColor = () => {
    if (period === 'Terminé') return 'text-gray-400';
    if (period === 'Mi-Temps') return 'text-yellow-400';
    if (period === 'À venir') return 'text-gray-500';
    return 'text-[#00ff88]';
  };

  return (
    <div className="w-full bg-[#111111] rounded-3xl overflow-hidden shadow-2xl border border-[#222]">
      
      {/* ══════════════════════════════════════════
          HEADER COMPLET AVEC TOUTES LES INFOS LIVE
         ══════════════════════════════════════════ */}
      <div className="bg-[#1a1a1a] border-b border-[#333]">
        
        {/* Ligne 1 : Badge LIVE + Période + Source */}
        <div className="flex justify-between items-center px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            {isLive && (
              <motion.div 
                animate={{ opacity: [1, 0.4, 1] }} 
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
            )}
            <span className="text-white font-bold text-xs tracking-widest">
              {isLive ? 'EN DIRECT' : isFinished ? 'TERMINÉ' : 'À VENIR'}
            </span>
            {/* Badge source des données */}
            {apiSource ? (
              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/40 px-1.5 py-0.5 rounded tracking-wide">
                API RÉELLE
              </span>
            ) : apiId ? (
              <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20 px-1.5 py-0.5 rounded tracking-wide">
                CHARGEMENT...
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-[#ffffff10] text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded tracking-wide">
                SIMULÉ
              </span>
            )}
          </div>
          <div className={`font-mono text-xs font-bold ${getPeriodColor()}`}>
            {period}
          </div>
          <div className="text-[#555] font-mono text-xs">
            VISUALISEUR 2D
          </div>
        </div>


        {/* Ligne 2 : Score + Chrono central + Temps additionnel */}
        <div className="flex items-center justify-between px-4 pb-3 gap-2">
          
          {/* Équipe Domicile */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {homeLogo ? (
              <img src={homeLogo} alt={homeTeam} className="w-6 h-6 rounded-full object-contain bg-white" />
            ) : (
              <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: homeColor }} />
            )}
            <span className="text-white font-bold text-xs truncate">{homeTeam}</span>
          </div>

          {/* Score + Chrono */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {/* Score */}
            <div className="text-white font-black text-2xl tracking-tighter leading-none">
              {score || (isLive || isFinished ? '0 - 0' : '-')}
            </div>
            
            {/* Chrono */}
            {isLive && (
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1 h-1 rounded-full bg-red-500"
                />
                <span className="text-[#00ff88] font-mono text-sm font-bold">
                  {clockMin < 90
                    ? `${String(clockMin).padStart(2, '0')}:${String(clockSec).padStart(2, '0')}`
                    : `90:00`}
                </span>
                {/* Temps additionnel */}
                {stoppageTime > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-orange-400 font-mono text-xs font-bold bg-orange-500/20 px-1.5 py-0.5 rounded"
                  >
                    +{stoppageTime}&apos;
                  </motion.span>
                )}
              </div>
            )}
            {isFinished && (
              <span className="text-gray-500 font-mono text-xs">Temps réglementaire</span>
            )}
            {!isLive && !isFinished && (
              <span className="text-gray-600 font-mono text-xs">Non commencé</span>
            )}
          </div>

          {/* Équipe Extérieure */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <span className="text-white font-bold text-xs truncate text-right">{awayTeam}</span>
            {awayLogo ? (
              <img src={awayLogo} alt={awayTeam} className="w-6 h-6 rounded-full object-contain bg-white shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: awayColor }} />
            )}
          </div>
        </div>
      </div>

      {/* TERRAIN 2D (SVG) */}
      <div className="relative w-full aspect-video bg-[#1a2e1f] overflow-hidden flex items-center justify-center p-4">
        {/* Lignes du terrain */}
        <div className="absolute inset-4 border-2 border-white/20 rounded-sm"></div>
        <div className="absolute top-4 bottom-4 left-1/2 w-0.5 -ml-px bg-white/20"></div>
        <div className="absolute top-1/2 left-1/2 w-20 h-20 -mt-10 -ml-10 rounded-full border-2 border-white/20"></div>
        <div className="absolute top-1/2 -mt-20 left-4 w-16 h-40 border-2 border-y-white/20 border-r-white/20 border-l-0"></div>
        <div className="absolute top-1/2 -mt-20 right-4 w-16 h-40 border-2 border-y-white/20 border-l-white/20 border-r-0"></div>

        {/* Affichage période sur le terrain en overlay discret */}
        {period === 'Mi-Temps' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-40 bg-black/70 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-yellow-400 text-4xl font-black tracking-widest">MI-TEMPS</div>
              <div className="text-white/60 text-sm mt-2">Retour dans quelques instants</div>
            </div>
          </motion.div>
        )}

        {/* AUTRES JOUEURS DOMICILE */}
        {bgPlayersHome.map(p => (
           <motion.div
             key={p.id}
             animate={{
               left: currentState.includes('DOMICILE') ? `${p.baseX + 15}%` : `${p.baseX}%`,
               top: `${p.baseY}%`
             }}
             transition={{ type: "spring", stiffness: 20, damping: 20 }}
             className="absolute w-3 h-3 rounded-full opacity-60 z-0 border border-white/50"
             style={{ backgroundColor: homeColor }}
           />
        ))}

        {/* AUTRES JOUEURS EXTERIEUR */}
        {bgPlayersAway.map(p => (
           <motion.div
             key={p.id}
             animate={{
               left: currentState.includes('EXTERIEUR') ? `${p.baseX - 15}%` : `${p.baseX}%`,
               top: `${p.baseY}%`
             }}
             transition={{ type: "spring", stiffness: 20, damping: 20 }}
             className="absolute w-3 h-3 rounded-full opacity-60 z-0 border border-white/50"
             style={{ backgroundColor: awayColor }}
           />
        ))}

        {/* Effet BUT */}
        <AnimatePresence>
          {currentState === 'BUT' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center backdrop-blur-sm"
            >
              <span className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_5px_15px_rgba(255,200,0,0.5)] italic tracking-tighter">GOAAAL!</span>
              <span className="text-white text-2xl md:text-4xl font-bold mt-4 tracking-widest bg-black/50 px-6 py-2 rounded-full border border-white/20">{score || "BUT !"}</span>
            </motion.div>
          )}

          {/* Effet Carton Rouge */}
          {currentState === 'CARTON_ROUGE' && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
            >
              <motion.div 
                animate={{ rotate: [-5, 5, -5] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-16 h-24 bg-red-600 rounded-sm border-2 border-red-800 shadow-[0_0_30px_rgba(220,38,38,0.8)]"
              ></motion.div>
              <span className="text-white text-xl font-bold mt-4 bg-black/70 px-4 py-1 rounded-full backdrop-blur-sm">Carton Rouge : {activeAwayPlayer}</span>
            </motion.div>
          )}

          {/* Effet Carton Jaune */}
          {currentState === 'CARTON_JAUNE' && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
            >
              <motion.div 
                animate={{ rotate: [-5, 5, -5] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-16 h-24 bg-yellow-400 rounded-sm border-2 border-yellow-600 shadow-[0_0_30px_rgba(250,204,21,0.8)]"
              ></motion.div>
              <span className="text-white text-xl font-bold mt-4 bg-black/70 px-4 py-1 rounded-full backdrop-blur-sm">Carton Jaune : {activeAwayPlayer}</span>
            </motion.div>
          )}

          {/* Effet Coup Franc / Faute */}
          {currentState === 'FAUTE' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="text-6xl">⚽️💥</div>
              <span className="text-white text-xl font-bold mt-4 bg-black/70 px-4 py-1 rounded-full backdrop-blur-sm">Coup Franc</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BALLON ANIMÉ (EMOJI ⚽️) */}
        <motion.div
          animate={{ 
            left: `${ballPos.x}%`, 
            top: `${ballPos.y}%`,
            scale: ['TIR_DOMICILE', 'TIR_EXTERIEUR'].includes(currentState) ? 1.5 : 1,
            rotate: ['TIR_DOMICILE', 'TIR_EXTERIEUR', 'CORNER', 'ATTAQUE_DOMICILE'].includes(currentState) ? 720 : 0
          }}
          transition={{ type: "spring", stiffness: 50, damping: 10 }}
          className="absolute w-6 h-6 -ml-3 -mt-3 z-20 flex items-center justify-center text-xl drop-shadow-md"
        >
          ⚽️
        </motion.div>

        {/* JOUEUR DOMICILE AVEC LOGO & NOM */}
        <motion.div
          animate={{ 
            left: currentState.includes('DOMICILE') ? `${ballPos.x - 4}%` : `${ballPos.x - 12}%`, 
            top: `${ballPos.y + 4}%` 
          }}
          transition={{ type: "spring", stiffness: 45, damping: 12 }}
          className="absolute z-10 flex flex-col items-center justify-center w-20 -ml-10"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-lg border-2 border-white flex items-center justify-center overflow-hidden z-10">
            {homeLogo ? <img src={homeLogo} alt="Home" className="w-6 h-6 object-contain" /> : <div className="w-full h-full" style={{backgroundColor: homeColor}}></div>}
          </div>
          <span className="text-[9px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap shadow-sm backdrop-blur-sm">
            {activeHomePlayer}
          </span>
        </motion.div>

        {/* JOUEUR EXTERIEUR AVEC LOGO & NOM */}
        <motion.div
          animate={{ 
            left: currentState.includes('EXTERIEUR') ? `${ballPos.x + 4}%` : `${ballPos.x + 12}%`, 
            top: `${ballPos.y - 4}%` 
          }}
          transition={{ type: "spring", stiffness: 45, damping: 12 }}
          className="absolute z-10 flex flex-col items-center justify-center w-20 -ml-10"
        >
          <div className="w-8 h-8 rounded-full bg-[#111] shadow-lg border-2 border-[#333] flex items-center justify-center overflow-hidden z-10">
            {awayLogo ? <img src={awayLogo} alt="Away" className="w-6 h-6 object-contain" /> : <div className="w-full h-full" style={{backgroundColor: awayColor}}></div>}
          </div>
          <span className="text-[9px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap shadow-sm backdrop-blur-sm">
            {activeAwayPlayer}
          </span>
        </motion.div>
      </div>

      {/* TIMELINE / COMMENTAIRES */}
      <div className="bg-[#111] p-4 h-40 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-4 bg-linear-to-b from-[#111] to-transparent z-10"></div>
        <div className="space-y-3 pt-2">
          <AnimatePresence>
            {events.map((ev, index) => (
              <motion.div 
                key={ev.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1 - (index * 0.2), x: 0, scale: index === 0 ? 1 : 0.95 }}
                className={`flex gap-3 items-center ${index === 0 ? 'text-white' : 'text-gray-500'}`}
              >
                <span className="font-mono text-xs w-12 opacity-70 shrink-0 text-[#00ff88]">{ev.time}</span>
                <div className={`
                  flex-1 text-sm font-medium
                  ${ev.type === 'danger' && index === 0 ? 'text-red-400' : ''}
                  ${ev.type === 'warning' && index === 0 ? 'text-yellow-400' : ''}
                  ${ev.type === 'success' && index === 0 ? 'text-[#00ff88]' : ''}
                `}>
                  {ev.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {events.length === 0 && isLive && (
            <div className="text-gray-600 text-sm text-center pt-4 animate-pulse">
              Le match commence, en attente d&apos;événements...
            </div>
          )}
          {!isLive && !isFinished && (
            <div className="text-gray-600 text-sm text-center pt-4">
              Le simulateur démarrera au coup d&apos;envoi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
