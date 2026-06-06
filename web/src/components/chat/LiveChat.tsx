"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Smile, Image as ImageIcon, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface User {
  username: string;
  avatar: string | null;
  country: string | null;
}

interface Message {
  id: string;
  message: string;
  media_url?: string | null;
  created_at: string;
  user_id: string;
  users?: User;
}

export function LiveChat({ matchId }: { matchId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, users(username, avatar, country)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`room:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        if (payload.new.match_id !== matchId) return;

        const { data: userData } = await supabase
          .from('users')
          .select('username, avatar, country')
          .eq('id', payload.new.user_id)
          .single();
          
        const newMsg = {
          ...payload.new,
          users: userData
        } as Message;

        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mediaPreview]);

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setShowEmojiPicker(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !currentUser || isUploading) return;

    setIsUploading(true);
    let mediaUrl = null;

    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, mediaFile);

      if (uploadError) {
        console.error('Error uploading media:', uploadError);
        alert('Erreur lors de l\'envoi de l\'image');
        setIsUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat_media')
        .getPublicUrl(filePath);
        
      mediaUrl = publicUrl;
    }

    const msg = newMessage;
    setNewMessage(""); 
    clearMedia();
    setShowEmojiPicker(false);

    const { data: insertedMsg, error: insertError } = await supabase.from('chat_messages').insert({
      match_id: matchId,
      user_id: currentUser.id,
      message: msg.trim() || null,
      media_url: mediaUrl
    }).select('*, users(username, avatar, country)').single();

    if (insertError) {
      console.error("Error inserting chat message:", insertError);
      alert("Erreur lors de l'envoi du message : " + insertError.message);
      setIsUploading(false);
      return;
    }

    if (insertedMsg) {
      setMessages((prev) => {
        if (prev.some(m => m.id === insertedMsg.id)) return prev;
        return [...prev, insertedMsg];
      });
    }

    setIsUploading(false);
  };

  return (
    <>
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img 
            src={selectedImage} 
            alt="Enlarged media" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <div className="space-y-5 px-6 pb-40">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 italic mt-10">
            Aucun message. Soyez le premier à commenter !
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = currentUser && msg.user_id === currentUser.id;
          
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <Avatar className="w-9 h-9 border border-gray-100 mt-1 shrink-0">
                <AvatarImage src={msg.users?.avatar || undefined} className="object-cover" />
                <AvatarFallback>{msg.users?.username?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className={`shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 max-w-[80%] ${
                isMe 
                  ? 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-[0_4px_12px_rgba(30,143,69,0.2)]' 
                  : 'bg-white border border-gray-100 rounded-2xl rounded-tl-sm text-gray-800'
              }`}>
                <span className={`text-[13px] font-bold mb-1 flex items-center gap-1.5 ${isMe ? 'text-white/80 block' : 'text-primary'}`}>
                  {isMe ? 'Moi' : msg.users?.username || 'Anonyme'}
                  {!isMe && msg.users?.country && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded-sm shrink-0">{msg.users.country}</span>
                  )}
                </span>
                
                {msg.media_url && (
                  <div 
                    className="mb-2 mt-2 rounded-xl overflow-hidden inline-block cursor-pointer border border-black/10 hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(msg.media_url as string)}
                  >
                    <img src={msg.media_url} alt="Media chat" className="max-w-48 max-h-40 object-cover bg-black/5" />
                  </div>
                )}
                
                {msg.message && (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Chat Input Pinned to Bottom within the Center Column */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 rounded-b-3xl">
        
        {/* Aperçu de l'image/GIF avant envoi */}
        {mediaPreview && (
          <div className="mb-3 relative inline-block">
            <div className="relative rounded-xl overflow-hidden h-24 border border-gray-200 bg-gray-50">
              <img src={mediaPreview} alt="Preview" className="h-full w-auto object-contain" />
            </div>
            <button 
              onClick={clearMedia}
              className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex flex-col gap-2 relative">
          
          {/* Emoji Picker popup */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-xl">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}

          <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-full border border-gray-200">
            {/* Input File Caché */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,image/gif"
              className="hidden"
            />
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-gray-500 hover:text-primary shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className={`rounded-full shrink-0 ${showEmojiPicker ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isUploading}
            >
              <Smile className="w-5 h-5" />
            </Button>

            <Input 
              className="flex-1 rounded-full bg-transparent border-none h-10 px-2 focus-visible:ring-0 shadow-none text-[15px]" 
              placeholder="Envoyer un message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!currentUser || isUploading}
            />
            
            <Button 
              type="submit" 
              disabled={!currentUser || (!newMessage.trim() && !mediaFile) || isUploading} 
              size="icon" 
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
