"use client";

import { Eye, Shield, Globe, LockKeyhole } from "lucide-react";
import { useState } from "react";

export default function PrivacyPage() {
  const [visibility, setVisibility] = useState('public');

  return (
    <div className="flex flex-col h-full bg-white p-6 pb-20">
      <h1 className="text-2xl font-black text-black tracking-tight mb-8">Confidentialité et données</h1>
      
      <div className="max-w-xl space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Eye className="w-5 h-5" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-800">Visibilité du profil</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-6 space-y-4">
            <div 
              onClick={() => setVisibility('public')}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${visibility === 'public' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Globe className={`w-6 h-6 mt-0.5 ${visibility === 'public' ? 'text-primary' : 'text-gray-400'}`} />
              <div className="flex-1">
                <h3 className={`font-bold text-[15px] ${visibility === 'public' ? 'text-primary' : 'text-gray-800'}`}>Public</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Tout le monde peut voir votre profil, vos abonnements et vos publications. Vos posts peuvent apparaître dans l&apos;onglet Tendances.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${visibility === 'public' ? 'border-primary' : 'border-gray-300'}`}>
                {visibility === 'public' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
            </div>

            <div 
              onClick={() => setVisibility('private')}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${visibility === 'private' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <LockKeyhole className={`w-6 h-6 mt-0.5 ${visibility === 'private' ? 'text-primary' : 'text-gray-400'}`} />
              <div className="flex-1">
                <h3 className={`font-bold text-[15px] ${visibility === 'private' ? 'text-primary' : 'text-gray-800'}`}>Privé</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Seuls vos abonnés approuvés peuvent voir ce que vous publiez. Vos nouvelles publications n&apos;apparaîtront pas dans les résultats de recherche publics.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${visibility === 'private' ? 'border-primary' : 'border-gray-300'}`}>
                {visibility === 'private' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-800">Utilisation des données</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden divide-y divide-gray-50">
            <div className="flex flex-col gap-1 p-5 hover:bg-gray-50/50 transition-colors cursor-pointer">
              <p className="font-semibold text-[15px] text-red-500">Télécharger mes données</p>
              <p className="text-[13px] text-gray-500">Obtenir une copie de tout ce que vous avez partagé sur Fou de Foot.</p>
            </div>
            <div className="flex flex-col gap-1 p-5 hover:bg-red-50/50 transition-colors cursor-pointer">
              <p className="font-semibold text-[15px] text-red-600">Supprimer mon compte</p>
              <p className="text-[13px] text-gray-500">Cette action est irréversible et effacera toutes vos données.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
