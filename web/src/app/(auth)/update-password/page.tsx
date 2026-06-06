"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      // Password updated successfully
      router.push("/");
      router.refresh();
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto bg-zinc-950 py-10 px-6">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518605368461-1e12dce4de94?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,1)_100%)]" />

      <div className="relative z-10 w-full max-w-md">
        <form onSubmit={handleUpdatePassword} className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-gray-400 text-sm mb-6">Saisissez votre nouveau mot de passe pour sécuriser votre compte.</p>
          
          {error && (
            <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-sm font-medium mb-4 border border-red-500/50">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-300 block mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-300 block mb-1">Confirmer le mot de passe</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 mt-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(30,143,69,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
