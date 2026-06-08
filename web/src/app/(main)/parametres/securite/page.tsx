"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="flex flex-col h-full bg-transparent p-6 pb-20">
      <h1 className="text-2xl font-black text-black tracking-tight mb-8">Mot de passe et sécurité</h1>
      
      <div className="max-w-xl space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-800">Changer le mot de passe</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1">Ancien mot de passe</label>
              <Input type="password" placeholder="••••••••" className="rounded-xl h-12 bg-gray-50/50 border-gray-200" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1">Nouveau mot de passe</label>
              <Input type="password" placeholder="••••••••" className="rounded-xl h-12 bg-gray-50/50 border-gray-200" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1">Confirmer le mot de passe</label>
              <Input type="password" placeholder="••••••••" className="rounded-xl h-12 bg-gray-50/50 border-gray-200" />
            </div>
            <div className="pt-4">
              <Button className="w-full rounded-xl h-12 font-bold text-[15px] shadow-sm">
                Mettre à jour le mot de passe
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-800">Authentification à deux facteurs</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-[15px] mb-1">Renforcer la sécurité</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Protégez votre compte avec une étape supplémentaire lors de la connexion.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl h-11 px-6 font-bold shrink-0">
              Activer la 2FA
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
