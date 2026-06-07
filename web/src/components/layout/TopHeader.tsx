"use client";

import { Search, Bell, SlidersHorizontal, Settings } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRealtime } from "@/components/providers/RealtimeProvider";

export function TopHeader({ profile }: { profile: { avatar?: string | null, username?: string } | null }) {
  const { unreadCount } = useRealtime();
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border/40 px-8 py-3 flex items-center justify-between">
      {/* Tabs - Aligned with Center Column */}
      <div className="flex items-center justify-between lg:w-175 pr-8">
        {/* Onglets du feed social masqués temporairement */}
        <div className="hidden items-center gap-4 lg:gap-8 overflow-x-auto hide-scrollbar">
          <button className="pb-3 border-b-[3px] border-primary font-bold text-[15px] text-black pt-3 shrink-0">Pour toi</button>
          <button className="pb-3 border-b-[3px] border-transparent text-muted-foreground font-semibold text-[15px] hover:text-black pt-3 transition-colors shrink-0">Abonnements</button>
          <button className="pb-3 border-b-[3px] border-transparent text-muted-foreground font-semibold text-[15px] hover:text-black pt-3 transition-colors shrink-0">Tendances</button>
        </div>
        <Button variant="ghost" size="icon" className="hidden">
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Right Tools - Aligned with Right Sidebar */}
      <div className="flex items-center justify-end gap-3 lg:gap-6 w-full lg:w-87.5">
        <div className="relative flex-1 max-w-60 hidden sm:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-10 bg-muted/50 border-none rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
        <Link href="/notifications" className="relative cursor-pointer">
          <Bell className="w-6 h-6 text-black hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link href="/parametres" className="lg:hidden cursor-pointer">
          <Settings className="w-6 h-6 text-black hover:text-primary transition-colors" />
        </Link>
        <Link href="/profil">
          <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
            <AvatarImage src={profile?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"} className="object-cover" />
            <AvatarFallback>{profile?.username?.[0] || "?"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  );
}
