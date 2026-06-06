"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Smile, X, Loader2 } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { createPost } from "@/actions/post";

export function CreatePost({ user }: { user: { id: string, username?: string, avatar?: string } | null }) {
  const [caption, setCaption] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setCaption(prev => prev + emojiObject.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaFile) {
      alert("Veuillez écrire un message ou ajouter une image avant de publier !");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    if (caption.trim()) formData.append("caption", caption);
    if (mediaFile) formData.append("mediaFile", mediaFile);

    try {
      const res = await createPost(formData);
      if (res.success) {
        setCaption("");
        removeMedia();
        setShowEmojiPicker(false);
      } else {
        alert(res.error || "Erreur lors de la création du post");
      }
    } catch {
      alert("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100 mb-6 relative">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <Avatar className="w-11 h-11 border border-gray-100 shrink-0">
            <AvatarImage src={user.avatar || undefined} className="object-cover" />
            <AvatarFallback>{user.username?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea 
              placeholder="Que se passe-t-il sur le terrain ?"
              className="min-h-20 border-none resize-none focus-visible:ring-0 px-0 text-[15px] bg-transparent"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            
            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden w-40 h-40 border border-gray-100 bg-gray-50 mt-2">
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={removeMedia}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary hover:bg-primary/10 rounded-full w-10 h-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <div className="relative">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-primary hover:bg-primary/10 rounded-full w-10 h-10"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute top-12 left-0 z-50 shadow-xl rounded-xl">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
              </div>
              <Button 
                type="submit" 
                className="rounded-full px-6 font-bold"
                disabled={isLoading || (!caption.trim() && !mediaFile)}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publier"}
              </Button>
            </div>
          </div>
        </div>
      </form>
      {/* Close emoji picker when clicking outside could be added here, simplified for now */}
    </div>
  );
}
