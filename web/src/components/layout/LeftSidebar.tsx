"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Bell, MessageSquare, User, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostModal } from "@/components/social/CreatePostModal";
import { useRealtime } from "@/components/providers/RealtimeProvider";

export function LeftSidebar({ profile }: { profile: { avatar?: string | null, username?: string, country?: string | null } | null }) {
  const { unreadCount } = useRealtime();
  const pathname = usePathname();
  
  const navItems = [
    { icon: Home, label: "Accueil", href: "/" },
    { icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M8 8h8v8H8z"/></svg>, label: "Matchs", href: "/matchs" },
    { icon: Trophy, label: "Compétitions", href: "/competitions" },
    { icon: Bell, label: "Notifications", href: "/notifications", badge: unreadCount && unreadCount > 0 ? unreadCount : undefined },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: User, label: "Profil", href: "/profil" },
    { icon: Settings, label: "Paramètres", href: "/parametres" },
  ];
  return (
    <div className="w-65 h-screen sticky top-0 bg-white pt-8 px-6 pb-6 flex flex-col hide-scrollbar overflow-y-auto shrink-0 border-r border-gray-100">
      
      {/* Logo */}
      <div className="flex items-end gap-1 mb-12 pl-2">
        <div className="flex flex-col">
          <span className="font-black text-[28px] tracking-tighter italic leading-[0.9] text-black">
            FOU DE
          </span>
          <span className="font-black text-[28px] tracking-tighter italic leading-[0.9] text-primary flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-black"><circle cx="12" cy="12" r="10"/><path d="M12 12l3.5-2m-3.5 2l-3.5-2m3.5 2v4m-5.5-1l2 2m7 0l-2-2m-1-6l2-2m-7 0l-2 2"/></svg>
            FOOT
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
          <Link key={item.label} href={item.href}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-4 text-[15px] font-semibold h-12 rounded-xl transition-all ${
                isActive 
                  ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-primary text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {item.badge}
                </span>
              )}
            </Button>
          </Link>
          );
        })}

        <div className="pt-8">
          <CreatePostModal />
        </div>
      </nav>

      {/* Bottom Profile */}
      <div className="mt-auto pt-6">
        <Link href="/profil" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-gray-100">
              <AvatarImage src={profile?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop"} className="object-cover" />
              <AvatarFallback>{profile?.username?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-black flex items-center gap-1.5">
                {profile?.username || "Anonyme"} 
                {profile?.country && (
                   <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded-sm">{profile.country}</span>
                )}
              </span>
              <span className="text-[11px] text-gray-500 group-hover:text-primary transition-colors">Voir mon profil</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
