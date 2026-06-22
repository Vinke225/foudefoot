"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserProfile {
  id: string;
  username: string;
  eula_accepted: boolean;
  eula_accepted_at: string;
}

export default function EulaCertificatePage() {
  const { id } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, [id, supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Chargement du certificat...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Utilisateur introuvable.</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      
      {/* Hide this section when printing */}
      <div className="print:hidden mb-8 flex items-center justify-between border-b pb-4 border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Visualisation du Certificat</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Retour
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition shadow-lg"
          >
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* The Printable Certificate */}
      <div className="max-w-3xl mx-auto border-4 border-double border-gray-800 p-12 bg-white shadow-2xl print:shadow-none print:border-none relative">
        
        {/* Certificate Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <span className="text-5xl mr-3">⚽</span>
            <div className="flex flex-col">
              <span className="font-black text-3xl tracking-tighter italic text-gray-900">FOU DE</span>
              <span className="font-black text-3xl tracking-tighter italic text-primary">FOOT</span>
            </div>
          </div>
          <h2 className="text-4xl font-serif font-bold text-gray-900 uppercase tracking-widest border-b-2 border-gray-300 pb-4 inline-block">
            Certificat de Consentement
          </h2>
          <p className="text-gray-500 mt-2 font-medium tracking-wide uppercase">Contrat de Licence Utilisateur Final (EULA)</p>
        </div>

        {/* Certificate Body */}
        <div className="space-y-6 text-lg text-gray-800 leading-relaxed text-justify">
          <p>
            Ce document atteste légalement que l'utilisateur identifié ci-dessous a lu, compris et accepté sans réserve les Conditions d'Utilisation (EULA) de l'application <strong>Fou de Foot</strong>.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 my-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Informations de l'utilisateur</h3>
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th className="py-3 font-semibold w-1/3">Pseudonyme :</th>
                  <td className="py-3 font-mono font-bold text-xl">{user.username}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-3 font-semibold">Identifiant Unique (UUID) :</th>
                  <td className="py-3 font-mono text-sm text-gray-600 break-all">{user.id}</td>
                </tr>
                <tr>
                  <th className="py-3 font-semibold">Statut EULA :</th>
                  <td className="py-3 font-bold text-green-600">{user.eula_accepted ? "Accepé ✅" : "Non accepté ❌"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-xl mb-4">Règles strictement acceptées :</h3>
          <ul className="list-disc list-outside ml-6 space-y-3 font-medium text-gray-700">
            <li>Je certifie avoir 18 ans et plus.</li>
            <li>Je m'engage à ne publier aucun contenu à caractère sexuel ou pornographique.</li>
            <li>Je m'engage à ne publier aucun contenu raciste, haineux ou insultant.</li>
            <li>Je comprends que les administrateurs se réservent le droit de bannir tout utilisateur ne respectant pas ces règles.</li>
          </ul>

          <div className="mt-12 p-6 border-l-4 border-primary bg-green-50 text-green-900 rounded-r-lg">
            <p className="font-bold text-xl mb-2">Horodatage de validation électronique</p>
            <p>Le consentement a été enregistré de manière immuable sur les serveurs sécurisés le :</p>
            <p className="font-mono text-xl mt-2 font-bold">
              {user.eula_accepted_at 
                ? format(new Date(user.eula_accepted_at), "EEEE d MMMM yyyy à HH:mm:ss", { locale: fr })
                : "Date inconnue"}
            </p>
          </div>
        </div>

        {/* Certificate Footer */}
        <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between items-end">
          <div className="text-sm text-gray-500">
            <p>Document généré automatiquement.</p>
            <p>Valable juridiquement en cas de litige.</p>
          </div>
          <div className="text-right">
            <div className="w-48 h-16 border-b border-gray-400 mb-2"></div>
            <p className="font-bold text-gray-800 uppercase">La Direction Fou de Foot</p>
          </div>
        </div>

      </div>

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          @page { margin: 1cm; }
        }
      `}} />
    </div>
  );
}
