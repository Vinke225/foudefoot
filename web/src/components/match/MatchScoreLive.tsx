"use client";

import { useEffect, useState } from "react";

export function MatchScoreLive({ 
  initialScore, 
  apiId, 
  isLive 
}: { 
  initialScore: string | null; 
  apiId: string | null; 
  isLive: boolean;
}) {
  const [score, setScore] = useState(initialScore);

  useEffect(() => {
    if (!isLive || !apiId) return;
    
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/matches/${apiId}/live`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.score && data.score !== score) {
          setScore(data.score);
        }
      } catch {
        // Silencieux
      }
    };

    // Premier fetch différé légèrement pour laisser LiveSimulation faire le sien
    const timeout = setTimeout(fetchScore, 2000);
    const interval = setInterval(fetchScore, 30000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [apiId, isLive, score]);

  return <>{score || '-'}</>;
}
