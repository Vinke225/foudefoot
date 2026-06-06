"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Image as ImageIcon } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileForm({ profile }: { profile: any }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile?.cover_url || null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);

    if (res?.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    }

    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* Cover Image */}
      <div className="relative h-40 bg-gray-100 rounded-3xl overflow-hidden border border-gray-200">
        {coverPreview ? (
          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Photo de couverture</span>
          </div>
        )}
        <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-black p-2 rounded-full cursor-pointer hover:bg-white shadow-lg transition-transform hover:scale-105">
          <Camera className="w-5 h-5" />
          <input type="file" name="coverFile" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </label>
      </div>

      {/* Avatar */}
      <div className="relative w-28 h-28 -mt-16 ml-6">
        <Avatar className="w-28 h-28 border-4 border-white shadow-xl bg-white">
          <AvatarImage src={avatarPreview || undefined} className="object-cover" />
          <AvatarFallback className="text-2xl font-black">{profile.username?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <label className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full cursor-pointer hover:bg-primary/90 shadow-lg border-2 border-white transition-transform hover:scale-105">
          <Camera className="w-4 h-4" />
          <input type="file" name="avatarFile" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-5">
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Pseudo</label>
          <Input 
            name="username" 
            defaultValue={profile?.username || ""} 
            className="h-12 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
            placeholder="Votre pseudo"
            required
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Pays</label>
          <Input 
            name="country" 
            defaultValue={profile?.country || ""} 
            className="h-12 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
            placeholder="Ex: France, Côte d'Ivoire, Sénégal..."
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Bio</label>
          <Textarea 
            name="bio" 
            defaultValue={profile?.bio || ""} 
            className="min-h-30 bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl resize-none"
            placeholder="Parlez-nous de votre passion pour le foot..."
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-[0_4px_14px_rgba(30,143,69,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
      >
        {isPending ? "Sauvegarde..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
