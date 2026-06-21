"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Plus, Bell, User, MessageSquare, Tv } from "lucide-react";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { CreatePostModal } from "@/components/social/CreatePostModal";
import { cn } from "@/lib/utils";

export function MobileNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { unreadCount } = useRealtime();

  const isInApp = searchParams?.get('in_app') === 'true';

  if (isInApp) return null;

  const navItems = [
    { icon: Home, label: "Accueil", href: "/" },
    { icon: Tv, label: "Live TV", href: "/livetv" },
    { icon: Plus, label: "Créer", href: "#", isAction: true },
    { icon: MessageSquare, label: "Chat", href: "/messages" },
    { icon: Bell, label: "Notifs", href: "/notifications" },
    { icon: User, label: "Profil", href: "/profil" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-2 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.02)] transition-all duration-300">
      {navItems.map((item) => {
        const isActive = pathname === item.href && !item.isAction;
        const Icon = item.icon;

        const content = (
          <div className="relative flex flex-col items-center justify-center p-2 group">
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-300 ease-spring cursor-pointer",
                item.isAction 
                  ? "w-14 h-14 bg-green-600 text-white rounded-full shadow-lg shadow-green-600/40 transform active:scale-95 -mt-8 flex items-center justify-center border-4 border-white" 
                  : "w-10 h-10 rounded-full active:scale-90",
                isActive && !item.isAction ? "text-primary" : "text-gray-500",
                !item.isAction && "hover:bg-gray-100"
              )}
            >
              <Icon 
                strokeWidth={isActive || item.isAction ? 2.5 : 2} 
                className={cn(
                  item.isAction ? "w-7 h-7" : "w-5 h-5 transition-transform duration-300",
                  isActive && !item.isAction ? "scale-110" : ""
                )} 
              />
              {item.label === "Notifs" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            
            {!item.isAction && (
              <span 
                className={cn(
                  "text-[10px] mt-1 transition-all duration-300 font-medium",
                  isActive ? "text-primary opacity-100 transform translate-y-0" : "text-gray-500 opacity-70 transform translate-y-0"
                )}
              >
                {item.label}
              </span>
            )}

            {!item.isAction && isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
            )}
          </div>
        );

        if (item.isAction) {
          return (
            <CreatePostModal key={item.label} trigger={content} />
          );
        }

        return (
          <Link key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
