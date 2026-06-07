"use client";

import { Bell, Mail, Smartphone, MessageSquare, Heart } from "lucide-react";
import { useState } from "react";

const ToggleSwitch = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-primary' : 'bg-gray-200'}`}
  >
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </div>
);

export default function NotificationsPage() {
  const [settings, setSettings] = useState({
    pushAll: true,
    emailDigest: false,
    messages: true,
    likes: true,
    mentions: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 pb-20">
      <h1 className="text-2xl font-black text-black tracking-tight mb-8">Notifications</h1>
      
      <div className="max-w-xl space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-800">Notifications Push</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden divide-y divide-gray-50">
            <div className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
              <div>
                <p className="font-semibold text-[15px] text-gray-800">Tout autoriser</p>
                <p className="text-[13px] text-gray-500 mt-0.5">Activer toutes les notifications push</p>
              </div>
              <ToggleSwitch checked={settings.pushAll} onClick={() => toggle('pushAll')} />
            </div>
            <div className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-semibold text-[15px] text-gray-800">Nouveaux messages</p>
                </div>
              </div>
              <ToggleSwitch checked={settings.messages} onClick={() => toggle('messages')} />
            </div>
            <div className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-semibold text-[15px] text-gray-800">Likes sur mes posts</p>
                </div>
              </div>
              <ToggleSwitch checked={settings.likes} onClick={() => toggle('likes')} />
            </div>
            <div className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-semibold text-[15px] text-gray-800">Mentions</p>
                </div>
              </div>
              <ToggleSwitch checked={settings.mentions} onClick={() => toggle('mentions')} />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-800">Notifications par Email</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
            <div>
              <p className="font-semibold text-[15px] text-gray-800">Résumé hebdomadaire</p>
              <p className="text-[13px] text-gray-500 mt-0.5">Recevoir un email avec l&apos;actualité de vos abonnements</p>
            </div>
            <ToggleSwitch checked={settings.emailDigest} onClick={() => toggle('emailDigest')} />
          </div>
        </section>
      </div>
    </div>
  );
}
