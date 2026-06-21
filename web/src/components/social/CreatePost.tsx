"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Smile, X, Loader2, Palette, AtSign } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { createPost } from "@/actions/post";
import { createClient } from "@/utils/supabase/client";

import { GifPicker } from "@/components/social/GifPicker";

const BACKGROUNDS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#1f2937', '#000000'];

export function CreatePost({ user }: { user: { id: string, username?: string, avatar?: string } | null }) {
  const [caption, setCaption] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [postBackground, setPostBackground] = useState<string | null>(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const supabase = createClient();

  const searchUsers = async (search: string) => {
    if (!search) {
      const { data } = await supabase.from('users').select('id, username, avatar').limit(5);
      if (data) setMentionResults(data);
      return;
    }
    const { data } = await supabase.from('users').select('id, username, avatar').ilike('username', `${search}%`).limit(5);
    if (data) setMentionResults(data);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCaption(text);
    
    const words = text.split(/[\s\n]+/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      const search = lastWord.substring(1);
      setMentionSearch(search);
      searchUsers(search);
    } else {
      setMentionSearch(null);
      setMentionResults([]);
    }
  };

  const handleMentionSelect = (username: string) => {
    const words = caption.split(/[\s\n]+/);
    words.pop();
    const newContent = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${username} `;
    setCaption(newContent);
    setMentionSearch(null);
    setMentionResults([]);
  };

  if (!user) return null;

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setCaption(prev => prev + emojiObject.emoji);
  };

  const onGifClick = (url: string) => {
    setGifUrl(url);
    setMediaPreview(url);
    setShowGifPicker(false);
    setPostBackground(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setGifUrl(null);
      setPostBackground(null);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setGifUrl(null);
    setMediaPreview(null);
    setPostBackground(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaFile && !gifUrl) {
      alert("Veuillez écrire un message ou ajouter une image avant de publier !");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    if (caption.trim()) formData.append("caption", caption);
    if (mediaFile) formData.append("mediaFile", mediaFile);
    if (postBackground && caption.trim()) {
      formData.append("gifUrl", `bg:${postBackground}`);
    } else if (gifUrl) {
      formData.append("gifUrl", gifUrl);
    }

    try {
      const res = await createPost(formData);
      if (res.success) {
        setCaption("");
        removeMedia();
        setShowEmojiPicker(false);
        setShowGifPicker(false);
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
            <div 
              className={`transition-all duration-200 ${postBackground ? 'p-8 rounded-2xl mb-2 flex items-center justify-center min-h-62.5' : ''}`}
              style={postBackground ? { backgroundColor: postBackground } : undefined}
            >
              <Textarea 
                placeholder="Que se passe-t-il sur le terrain ?"
                className={`border-none resize-none focus-visible:ring-0 px-0 bg-transparent ${postBackground ? 'text-center font-bold text-2xl text-white placeholder:text-white/70 min-h-37.5 w-full flex items-center justify-center' : 'min-h-20 text-[15px]'}`}
                value={caption}
                onChange={handleContentChange}
                disabled={isLoading}
              />
            </div>

            {mentionSearch !== null && mentionResults.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden absolute z-10 w-full max-w-sm left-12 top-28">
                {mentionResults.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleMentionSelect(u.username)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-900">{u.username}</span>
                  </button>
                ))}
              </div>
            )}

            {showBackgroundPicker && !mediaFile && !gifUrl && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
                <button
                  type="button"
                  onClick={() => setPostBackground(null)}
                  className="w-10 h-10 shrink-0 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
                {BACKGROUNDS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setGifUrl(null);
                      setMediaPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      setPostBackground(bg);
                    }}
                    style={{ backgroundColor: bg }}
                    className={`w-10 h-10 shrink-0 rounded-lg transition-transform hover:scale-105 ${postBackground === bg ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                  />
                ))}
              </div>
            )}
            
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

            <div className="flex items-center justify-between pt-2 border-t border-gray-50 relative">
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
                <div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-primary hover:bg-primary/10 rounded-full w-10 h-10"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowGifPicker(false);
                    }}
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                  {showEmojiPicker && (
                    <div 
                      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                      onClick={() => setShowEmojiPicker(false)}
                    >
                      <div 
                        onClick={e => e.stopPropagation()} 
                        className="shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200"
                      >
                        <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:bg-primary/10 rounded-xl px-3 h-10 font-bold text-xs"
                    onClick={() => {
                      setShowGifPicker(!showGifPicker);
                      setShowEmojiPicker(false);
                    }}
                  >
                    GIF
                  </Button>
                  {showGifPicker && (
                    <div 
                      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                      onClick={() => setShowGifPicker(false)}
                    >
                      <div 
                        onClick={e => e.stopPropagation()} 
                        className="shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200 bg-white"
                      >
                        <GifPicker onGifClick={onGifClick} />
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full w-10 h-10 text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => handleContentChange({ target: { value: caption + (caption.endsWith(' ') || caption === '' ? '@' : ' @') } } as any)}
                >
                  <AtSign className="w-5 h-5" />
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className={`rounded-full w-10 h-10 transition-colors ${showBackgroundPicker ? 'bg-purple-500/10 text-purple-600' : 'text-purple-500 hover:bg-purple-500/10'}`}
                  onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                >
                  <Palette className="w-5 h-5" />
                </Button>
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
