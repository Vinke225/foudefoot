"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, PlusSquare, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavBar() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Accueil", href: "/" },
    { icon: Trophy, label: "Matchs", href: "/matchs" },
    { icon: PlusSquare, label: "Créer", href: "/", isAction: true }, // Will just act as a link to home or trigger a modal
    { icon: Bell, label: "Notifs", href: "/notifications" },
    { icon: User, label: "Profil", href: "/profil" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-6 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.02)] transition-all duration-300">
      {navItems.map((item) => {
        const isActive = pathname === item.href && !item.isAction;
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className="relative flex flex-col items-center justify-center p-2 group"
          >
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-300 ease-spring",
                item.isAction 
                  ? "w-12 h-12 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 transform active:scale-95 -mt-6" 
                  : "w-10 h-10 rounded-full active:scale-90",
                isActive && !item.isAction ? "text-primary" : "text-gray-500",
                !item.isAction && "hover:bg-gray-100"
              )}
            >
              <Icon 
                strokeWidth={isActive || item.isAction ? 2.5 : 2} 
                className={cn(
                  item.isAction ? "w-6 h-6" : "w-5 h-5 transition-transform duration-300",
                  isActive && !item.isAction ? "scale-110" : ""
                )} 
              />
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

            {/* Active Dot indicator */}
            {!item.isAction && isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
