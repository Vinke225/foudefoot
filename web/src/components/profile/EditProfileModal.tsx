"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function EditProfileModal({ profile }: { profile: { avatar?: string | null, cover_url?: string | null, username?: string, country?: string | null, bio?: string | null } | null }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      setOpen(false);
      router.push("/login");
      router.refresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setOpen(false);
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="rounded-full font-bold text-black border-gray-300 hover:bg-gray-100">
            Éditer le profil
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-black text-black">Éditer le profil</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Pseudo</label>
              <Input 
                name="username" 
                defaultValue={profile?.username || ""} 
                required 
                className="rounded-xl border-gray-200 focus-visible:ring-primary h-11"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Pays</label>
              <Input 
                name="country" 
                defaultValue={profile?.country || ""} 
                placeholder="Ex: France, Sénégal..."
                className="rounded-xl border-gray-200 focus-visible:ring-primary h-11"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Photo de profil</label>
              <Input 
                name="avatarFile" 
                type="file"
                accept="image/*"
                className="rounded-xl border-gray-200 focus-visible:ring-primary h-11 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 pt-2"
              />
              <p className="text-xs text-gray-400 font-medium">Laissez vide pour conserver votre photo actuelle.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Photo de couverture</label>
              <Input 
                name="coverFile" 
                type="file"
                accept="image/*"
                className="rounded-xl border-gray-200 focus-visible:ring-primary h-11 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 pt-2"
              />
              <p className="text-xs text-gray-400 font-medium">Laissez vide pour conserver votre bannière actuelle.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Biographie</label>
              <Textarea 
                name="bio" 
                defaultValue={profile?.bio || ""} 
                placeholder="Quelques mots sur vous..."
                className="rounded-xl border-gray-200 focus-visible:ring-primary min-h-25 resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex flex-row justify-between gap-3 sm:justify-between items-center w-full">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Déconnexion
            </Button>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold shadow-[0_4px_14px_rgba(30,143,69,0.3)]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
