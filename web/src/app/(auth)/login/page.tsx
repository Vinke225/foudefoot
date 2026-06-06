"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccessMsg("Un email contenant un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        if (user) {
          await supabase.from('users').insert({
            id: user.id,
            username: username || email.split('@')[0],
          });
        }
        
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/");
      router.refresh();
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion Google");
      setLoading(false);
    }
  };

  const showButtons = !isLogin && !isSignUp && !isResetting;

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto bg-zinc-950 py-10">
      
      {/* Background Image: Dark Stadium */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518605368461-1e12dce4de94?q=80&w=2000&auto=format&fit=crop')" }}
      />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,1)_100%)]" />

      {/* Floating Elements Container */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000 w-full px-6">
        
        {/* Floating 3D Ball simulation (CSS + Emoji) */}
        <div className="relative mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
          {/* Glow effect behind the ball */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/40 rounded-full blur-2xl animate-pulse" />
          
          {/* The Ball */}
          <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5),0_0_30px_#1E8F45]">
            <span className="text-[60px] leading-none drop-shadow-xl" style={{ filter: 'grayscale(100%) contrast(150%) brightness(120%)' }}>⚽</span>
          </div>
        </div>

        {/* Logo Text */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-black text-5xl md:text-7xl tracking-tighter italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            FOU DE
          </h1>
          <h1 className="font-black text-5xl md:text-7xl tracking-tighter italic text-primary drop-shadow-[0_0_25px_rgba(30,143,69,0.8)]">
            FOOT
          </h1>
          <p className="text-gray-400 mt-4 text-base md:text-lg font-medium tracking-wide">
            Le réseau social des émotions football.
          </p>
        </div>

        {/* Auth Forms / Buttons */}
        <div className="w-full max-w-md">
          {showButtons ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-5">
                <button onClick={() => setIsLogin(true)} className="flex-1 w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-[0_0_20px_rgba(30,143,69,0.5)] hover:shadow-[0_0_30px_rgba(30,143,69,0.8)] transition-all hover:scale-105 active:scale-95">
                  Se connecter
                </button>
                <button onClick={() => setIsSignUp(true)} className="flex-1 w-full h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95">
                  Créer un compte
                </button>
              </div>
              
              <div className="relative flex items-center py-2">
                <div className="grow border-t border-white/10"></div>
                <span className="shrink-0 mx-4 text-white/50 text-sm font-medium">Ou</span>
                <div className="grow border-t border-white/10"></div>
              </div>

              <button 
                onClick={handleGoogleLogin} 
                className="flex items-center justify-center gap-3 w-full h-14 bg-white text-black hover:bg-gray-100 font-bold text-lg rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                Continuer avec Google
              </button>
              
              <div className="mt-4 flex justify-center">
                <button 
                  onClick={() => setIsResetting(true)} 
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>
          ) : isResetting ? (
            <form onSubmit={handleResetPassword} className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h2>
              <p className="text-gray-400 text-sm mb-6">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
              
              {error && (
                <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-sm font-medium mb-4 border border-red-500/50">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-500/20 text-green-200 p-3 rounded-xl text-sm font-medium mb-4 border border-green-500/50">
                  {successMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-300 block mb-1">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="fan@football.com"
                  />
                </div>
                
                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsResetting(false); setError(null); setSuccessMsg(null); }}
                    className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                  >
                    Retour
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(30,143,69,0.3)] transition-all disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Envoyer le lien"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-white mb-6">
                {isSignUp ? "Créer un compte" : "Se connecter"}
              </h2>
              
              {error && (
                <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-sm font-medium mb-4 border border-red-500/50">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="text-sm font-bold text-gray-300 block mb-1">Pseudo</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required={isSignUp}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Mamadou_225"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-bold text-gray-300 block mb-1">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="fan@football.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-gray-300 block mb-1">Mot de passe</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                  {!isSignUp && (
                    <div className="flex justify-end mt-2">
                      <button 
                        type="button"
                        onClick={() => { setIsLogin(false); setIsResetting(true); setError(null); }}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsLogin(false); setIsSignUp(false); setIsResetting(false); setError(null); }}
                    className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                  >
                    Retour
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(30,143,69,0.3)] transition-all disabled:opacity-50"
                  >
                    {loading ? "Chargement..." : "Valider"}
                  </button>
                </div>

                <div className="relative flex items-center py-2 mt-4">
                  <div className="grow border-t border-white/10"></div>
                  <span className="shrink-0 mx-4 text-white/50 text-sm font-medium">Ou</span>
                  <div className="grow border-t border-white/10"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin} 
                  className="flex items-center justify-center gap-3 w-full h-12 bg-white text-black hover:bg-gray-100 font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                  Continuer avec Google
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
