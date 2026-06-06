"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bell, Lock, Shield, HelpCircle, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sections = [
    {
      title: "Mon compte",
      items: [
        { icon: User, label: "Informations personnelles", href: "/parametres/profil" },
        { icon: Lock, label: "Mot de passe et sécurité", href: "/parametres/securite" },
      ]
    },
    {
      title: "Préférences",
      items: [
        { icon: Bell, label: "Notifications push et emails", href: "/parametres/notifications" },
        { icon: Shield, label: "Confidentialité et données", href: "/parametres/confidentialite" },
      ]
    },
    {
      title: "Assistance",
      items: [
        { icon: HelpCircle, label: "Centre d'aide", href: "/parametres/assistance" },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full pb-10">
      <div className="px-6 pt-4 mb-6">
        <h1 className="text-2xl font-black text-black tracking-tight">Paramètres</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl px-6">
          
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">{section.title}</h2>
                <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {section.items.map((item) => (
                    <div key={item.label} onClick={() => item.href && router.push(item.href)} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <item.icon className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[15px] font-semibold text-gray-800">{item.label}</span>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <div 
                onClick={handleLogout}
                className={`bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-red-100 overflow-hidden mt-8 cursor-pointer ${isLoggingOut ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between p-5 hover:bg-red-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <LogOut className={`w-5 h-5 text-red-500 ${isLoggingOut ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className="text-[15px] font-bold text-red-500">
                      {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="h-32"></div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
