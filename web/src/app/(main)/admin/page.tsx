"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldAlert, FileText, Ban, CheckCircle } from "lucide-react";
// @ts-ignore

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  eula_accepted: boolean;
  eula_accepted_at: string;
  is_banned: boolean;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUser(user);

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      setIsAdmin(true);
      fetchUsers();
    } else {
      router.push("/"); // Not authorized
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    // Note: To fetch emails securely, we might need a Supabase edge function or secure admin role
    // For now, we fetch public profile info and EULA data
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    const confirmMsg = currentStatus 
      ? "Voulez-vous vraiment débannir cet utilisateur ?" 
      : "Voulez-vous vraiment bannir cet utilisateur ?";
      
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("users")
      .update({ is_banned: !currentStatus })
      .eq("id", userId);

    if (!error) {
      fetchUsers(); // refresh list
    } else {
      alert("Erreur lors de la mise à jour : " + error.message);
    }
  };



  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">Chargement du panneau...</div>;
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
            <ShieldAlert className="text-red-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-gray-400">Gestion des utilisateurs et modération de la plateforme</p>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Acceptation EULA</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.eula_accepted ? (
                        <div>
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <CheckCircle className="w-4 h-4" /> Accepté
                          </span>
                          {user.eula_accepted_at && (
                            <span className="text-xs text-gray-500 mt-1 block">
                              Le {new Date(user.eula_accepted_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">Non accepté</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                          Banni
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/eula/${user.id}`)}
                          title="Voir le Certificat Légal"
                          disabled={!user.eula_accepted}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-30"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        {user.id !== currentUser?.id && (
                          <button 
                            onClick={() => toggleBan(user.id, user.is_banned)}
                            title={user.is_banned ? "Débannir" : "Bannir"}
                            className={`p-2 rounded-lg transition-colors ${user.is_banned ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && !loading && (
            <div className="p-10 text-center text-gray-500">
              Aucun utilisateur trouvé.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
