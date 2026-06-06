"use client";

import { useEffect, useState } from "react";
import { getMatchPrediction, PredictionResult } from "@/lib/api-prediction";
import { Brain, Trophy, AlertCircle, Percent } from "lucide-react";
import { motion } from "framer-motion";

interface MatchPredictionProps {
  homeTeam: string;
  awayTeam: string;
  dateStr: string;
}

export function MatchPrediction({ homeTeam, awayTeam, dateStr }: MatchPredictionProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      setIsLoading(true);
      const data = await getMatchPrediction(homeTeam, awayTeam, dateStr);
      setPrediction(data);
      setIsLoading(false);
    };
    fetchPrediction();
  }, [homeTeam, awayTeam, dateStr]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">L&apos;IA analyse le match...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
        <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
        <p className="text-gray-500 font-medium">Aucune prédiction disponible pour le moment.</p>
      </div>
    );
  }

  const { winProbabilities, expectedScore, advice } = prediction;

  return (
    <div className="space-y-6">
      {/* Conseil IA */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-violet-50 to-fuchsia-50 rounded-3xl p-6 border border-violet-100 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-24 h-24 text-violet-500" />
        </div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-violet-500 rounded-xl p-3 shadow-md">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-violet-900 font-bold text-lg mb-1">Pronostic de l&apos;IA</h3>
            <p className="text-violet-700 font-medium text-[15px]">{advice}</p>
          </div>
        </div>
      </motion.div>

      {/* Probabilités de Victoire */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-2.5">
            <Percent className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Probabilités de Résultat</h3>
        </div>

        <div className="space-y-5">
          {/* Domicile */}
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-gray-700">{homeTeam}</span>
              <span className="text-primary">{winProbabilities.home}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${winProbabilities.home}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          {/* Match Nul */}
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-gray-500">Match Nul</span>
              <span className="text-gray-600">{winProbabilities.draw}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${winProbabilities.draw}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gray-400 rounded-full"
              />
            </div>
          </div>

          {/* Extérieur */}
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-gray-700">{awayTeam}</span>
              <span className="text-blue-500">{winProbabilities.away}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${winProbabilities.away}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Attendu */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center py-8"
      >
        <div className="bg-amber-100 text-amber-600 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Score Le Plus Probable
        </div>
        <div className="text-5xl font-black text-gray-900 tracking-tighter">
          {expectedScore}
        </div>
      </motion.div>
    </div>
  );
}
