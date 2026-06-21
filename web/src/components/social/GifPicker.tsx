"use client";

import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GifPicker({ onGifClick }: { onGifClick: (gifUrl: string) => void }) {
  const [gifs, setGifs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetchGifs() {
      setLoading(true);
      try {
        // Use Tenor public test key or Giphy public key. Here using a predefined set if API fails.
        let query = "african reaction meme";
        if (debouncedSearch) {
          if (debouncedSearch.startsWith("flag ") || debouncedSearch.startsWith("football club ") || debouncedSearch.startsWith("animal ")) {
            query = debouncedSearch;
          } else {
             query = debouncedSearch + " african";
          }
        }
        const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULELA&limit=20`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          setGifs(data.results.map((r: { media: { tinygif: { url: string } }[] }) => r.media[0].tinygif.url));
        } else {
          setGifs([
            "https://media.tenor.com/6X24VntvRiwAAAAC/african-kid-crying.gif",
            "https://media.tenor.com/a9c1BvGk80cAAAAC/black-guy-laughing.gif",
            "https://media.tenor.com/z1mGzN4w_QkAAAAC/african-funny.gif",
            "https://media.tenor.com/1C021VvSgM0AAAAC/confused-black-girl.gif",
            "https://media.tenor.com/YhHnJtI6S20AAAAC/black-guy-thinking.gif"
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch GIFs", err);
        // Fallback to some hardcoded GIFs if the API fails
        setGifs([
          "https://media.tenor.com/6X24VntvRiwAAAAC/african-kid-crying.gif",
          "https://media.tenor.com/a9c1BvGk80cAAAAC/black-guy-laughing.gif",
          "https://media.tenor.com/z1mGzN4w_QkAAAAC/african-funny.gif",
          "https://media.tenor.com/1C021VvSgM0AAAAC/confused-black-girl.gif",
          "https://media.tenor.com/YhHnJtI6S20AAAAC/black-guy-thinking.gif"
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGifs();
  }, [debouncedSearch]);

  return (
    <div className="w-75 sm:w-80 max-w-[calc(100vw-2rem)] h-87.5 sm:h-100 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un GIF..." 
            className="h-9 pl-9 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-lg text-[13px]" 
          />
        </div>
        
        <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar pb-1">
          <button onClick={() => setSearch('flag world')} className="shrink-0 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors">
            🏳️ Drapeaux
          </button>
          <button onClick={() => setSearch('football club logo')} className="shrink-0 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors">
            ⚽ Clubs
          </button>
          <button onClick={() => setSearch('animal funny')} className="shrink-0 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors">
            🦁 Animaux
          </button>
          <button onClick={() => setSearch('football player reaction')} className="shrink-0 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium transition-colors">
            🏃 Joueurs
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 hide-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((url, i) => (
              <div 
                key={i} 
                onClick={() => onGifClick(url)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all bg-gray-100"
              >
                <img src={url} alt="gif" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
