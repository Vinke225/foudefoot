"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Image as ImageIcon, Smile, X, AtSign, Palette } from "lucide-react";
import { createPost } from "@/actions/post";
import dynamic from "next/dynamic";
import { GifPicker } from "@/components/social/GifPicker";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const BACKGROUNDS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#1f2937', '#000000'];

export function CreatePostModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [postBackground, setPostBackground] = useState<string | null>(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
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
    setContent(text);
    
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
    const words = content.split(/[\s\n]+/);
    words.pop();
    const newContent = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${username} `;
    setContent(newContent);
    setMentionSearch(null);
    setMentionResults([]);
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setContent(prev => prev + emojiObject.emoji);
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

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile && !gifUrl) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    if (content.trim()) formData.append("caption", content);
    if (mediaFile) formData.append("mediaFile", mediaFile);
    if (postBackground && content.trim()) {
      formData.append("gifUrl", `bg:${postBackground}`);
    } else if (gifUrl) {
      formData.append("gifUrl", gifUrl);
    }

    try {
      const res = await createPost(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setContent("");
        removeMedia();
        setShowEmojiPicker(false);
        setShowGifPicker(false);
        setOpen(false);
      }
    } catch {
      setError("Erreur serveur");
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          trigger ? (trigger as React.ReactElement) : (
            <Button className="w-full rounded-2xl h-13 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] shadow-[0_4px_14px_rgba(30,143,69,0.3)] flex gap-2">
              <Plus className="w-5 h-5" />
              Créer un post
            </Button>
          )
        }
      />
      
      <DialogContent className="sm:max-w-125 p-0 overflow-visible bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-black text-black">Créer un post</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div 
            className={`transition-all duration-200 ${postBackground ? 'p-8 rounded-2xl mb-4 flex items-center justify-center min-h-62.5' : ''}`}
            style={postBackground ? { backgroundColor: postBackground } : undefined}
          >
            <Textarea 
              placeholder="Que voulez-vous partager à propos du foot aujourd'hui ?"
              className={`resize-none border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent ${postBackground ? 'text-center font-bold text-2xl text-white placeholder:text-white/70 min-h-37.5 w-full flex items-center justify-center' : 'min-h-30 text-base text-gray-800 placeholder:text-gray-400 font-medium'}`}
              value={content}
              onChange={handleContentChange}
              disabled={isLoading}
            />
          </div>
          
          {mentionSearch !== null && mentionResults.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg mt-2 overflow-hidden">
              {mentionResults.map(u => (
                <button
                  key={u.id}
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
            <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2 mt-2">
              <button
                onClick={() => setPostBackground(null)}
                className="w-10 h-10 shrink-0 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              {BACKGROUNDS.map(bg => (
                <button
                  key={bg}
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
            <div className="relative rounded-xl overflow-hidden w-40 h-40 border border-gray-100 bg-gray-50 mt-4">
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
          
          {error && <p className="text-red-500 text-sm mt-2 font-semibold">{error}</p>}
        </div>
        
        <DialogFooter className="relative px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center sm:justify-between">
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
                className={`rounded-full w-10 h-10 transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
              >
                <Smile className="w-5 h-5" />
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-6 sm:left-16 mb-2 z-50 shadow-xl rounded-xl overflow-hidden w-75 sm:w-80 max-w-[calc(100vw-3rem)]">
                  <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={400} />
                </div>
              )}
            </div>
            <div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className={`h-10 px-3 font-bold rounded-xl transition-colors ${showGifPicker ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
              >
                GIF
              </Button>
              {showGifPicker && (
                <div className="absolute bottom-full left-6 sm:left-24 mb-2 z-50 shadow-xl rounded-xl bg-white">
                  <GifPicker onGifClick={onGifClick} />
                </div>
              )}
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-10 h-10 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => handleContentChange({ target: { value: content + (content.endsWith(' ') || content === '' ? '@' : ' @') } } as any)}
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
            onClick={handleSubmit} 
            disabled={(!content.trim() && !mediaFile && !gifUrl) || isLoading}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold shadow-[0_4px_14px_rgba(30,143,69,0.3)]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
