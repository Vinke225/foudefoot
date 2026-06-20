'use client';

import React, { useState, useEffect } from 'react';
import { Tv, Play, X, Loader2 } from 'lucide-react';

interface Match {
  id: string;
  team1: string;
  team1Logo: string;
  team2: string;
  team2Logo: string;
  time: string;
  status: string;
  league: string;
  commentator: string;
  url: string;
}

interface Server {
  name: string;
  url: string;
}

export default function LiveTVPage() {
  const [activeDay, setActiveDay] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [loadingServers, setLoadingServers] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches?day=${activeDay}`)
      .then(res => res.json())
      .then(data => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeDay]);

  const openMatch = async (match: Match) => {
    setSelectedMatch(match);
    setLoadingServers(true);
    setServers([]);
    setActiveServer(null);

    try {
      const res = await fetch(`/api/servers?url=${encodeURIComponent(match.url)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setServers(data);
        setActiveServer(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServers(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-10 mt-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Tv size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live TV</h1>
            <p className="text-gray-500">Regardez les matchs en direct avec une interface native</p>
          </div>
        </div>

        <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveDay('yesterday')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeDay === 'yesterday' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Hier
          </button>
          <button 
            onClick={() => setActiveDay('today')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeDay === 'today' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Aujourd'hui
          </button>
          <button 
            onClick={() => setActiveDay('tomorrow')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeDay === 'tomorrow' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Demain
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
          <Tv size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun match disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <div 
              key={match.id} 
              onClick={() => openMatch(match)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="truncate max-w-[60%]">{match.league || 'Compétition'}</span>
                <span className={`px-2 py-1 rounded-full whitespace-nowrap ${match.status.toLowerCase().includes('live') || match.time.includes('Live') ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-700'}`}>
                  {match.status || match.time}
                </span>
              </div>
              <div className="p-6 flex items-center justify-between flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  {match.team1Logo ? (
                    <img src={match.team1Logo} alt={match.team1} className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">?</div>
                  )}
                  <span className="text-sm font-bold text-center text-gray-900">{match.team1}</span>
                </div>
                <div className="px-2 text-gray-300 font-bold text-xl">VS</div>
                <div className="flex flex-col items-center gap-2 flex-1">
                  {match.team2Logo ? (
                    <img src={match.team2Logo} alt={match.team2} className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">?</div>
                  )}
                  <span className="text-sm font-bold text-center text-gray-900">{match.team2}</span>
                </div>
              </div>
              <div className="p-4 bg-blue-600 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={18} fill="currentColor" />
                <span className="font-semibold">Regarder</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 md:p-6 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-5xl shadow-2xl flex flex-col h-[60vh] md:h-[80vh]">
            <div className="p-4 bg-gray-800 flex justify-between items-center border-b border-gray-700">
              <div>
                <h3 className="text-white font-bold text-lg">{selectedMatch.team1} vs {selectedMatch.team2}</h3>
                <p className="text-gray-400 text-sm">{selectedMatch.league}</p>
              </div>
              <button 
                onClick={() => setSelectedMatch(null)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 bg-black relative">
              {loadingServers ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p>Recherche des serveurs sécurisés...</p>
                </div>
              ) : activeServer ? (
                <iframe 
                  src={activeServer.url} 
                  className="w-full h-full border-0"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Aucun serveur vidéo trouvé pour ce match.
                </div>
              )}
            </div>

            {servers.length > 0 && (
              <div className="p-4 bg-gray-800 flex gap-2 overflow-x-auto border-t border-gray-700">
                {servers.map((srv, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveServer(srv)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeServer?.url === srv.url ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {srv.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
