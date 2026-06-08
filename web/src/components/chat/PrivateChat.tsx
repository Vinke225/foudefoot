// cspell:disable
"use client";

import { useEffect, useState, useRef } from "react";
import { UserOnlineAvatar } from "@/components/user/UserOnlineAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Smile, Image as ImageIcon, X, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface Message {
  id: string;
  message: string | null;
  media_url: string | null;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

export function PrivateChat({ conversationId, otherUser, currentUser }: { conversationId: string, otherUser: { id: string; username: string | null; avatar: string | null }, currentUser: { id: string, username?: string | null } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [showEditMessageModal, setShowEditMessageModal] = useState(false);
  
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
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`private_chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new.conversation_id !== conversationId) return;

        const newMsg = payload.new as Message;

        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // If the message is from the other user, mark it as read
        if (newMsg.sender_id !== currentUser.id) {
          supabase
            .from('private_messages')
            .update({ is_read: true })
            .eq('id', newMsg.id)
            .then();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new.conversation_id !== conversationId) return;
        setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser.id, supabase]);

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
    if ((!newMessage.trim() && !mediaFile) || isUploading) return;

    setIsUploading(true);
    let mediaUrl = null;

    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('private_media')
        .upload(fileName, mediaFile);

      if (uploadError) {
        console.error('Error uploading media:', uploadError);
        alert('Erreur lors de l\'envoi de l\'image');
        setIsUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('private_media')
        .getPublicUrl(fileName);
        
      mediaUrl = publicUrl;
    }

    const msg = newMessage;
    setNewMessage(""); 
    clearMedia();
    setShowEmojiPicker(false);

    const { data: insertedMsg, error: insertError } = await supabase.from('private_messages').insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      message: msg.trim() || null,
      media_url: mediaUrl,
      is_read: false
    }).select('*').single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      alert("Erreur lors de l'envoi du message");
      setIsUploading(false);
      return;
    }

    if (insertedMsg) {
      supabase.from('notifications').insert({
        user_id: otherUser.id,
        type: 'message',
        content: `Nouveau message de ${currentUser.username || "Quelqu'un"}`,
        link: `/messages/${conversationId}`
      }).then();

      setMessages((prev) => {
        if (prev.some(m => m.id === insertedMsg.id)) return prev;
        return [...prev, insertedMsg];
      });
    }

    setIsUploading(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce message ?")) {
      await supabase.from('private_messages').delete().eq('id', msgId).eq('sender_id', currentUser.id);
      // Local state is updated via postgres_changes
    }
  };

  const handleEditMessageSubmit = async () => {
    if (!editingMessageId || !editMessageContent.trim()) return;
    await supabase.from('private_messages').update({ message: editMessageContent.trim() }).eq('id', editingMessageId).eq('sender_id', currentUser.id);
    setShowEditMessageModal(false);
    setEditingMessageId(null);
    setEditMessageContent("");
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

      <ScrollArea className="flex-1 px-4 py-4 w-full h-[calc(100vh-140px)] hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center mt-20">
            <UserOnlineAvatar
              userId={otherUser.id}
              avatarUrl={otherUser.avatar}
              username={otherUser.username}
              avatarClassName="w-20 h-20 mb-4 border-4 border-gray-50 shadow-sm"
            />
            <h3 className="font-bold text-lg text-gray-900 mb-1">{otherUser.username}</h3>
            <p className="text-gray-500 text-sm mb-6">Commencez une discussion avec {otherUser.username}</p>
          </div>
        )}
        
        <div className="space-y-4 pb-20">
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser.id;
            const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.sender_id === currentUser.id);
            
            return (
              <div key={msg.id} className={`flex gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-8 shrink-0 flex items-end">
                    {showAvatar ? (
                      <UserOnlineAvatar
                        userId={otherUser.id}
                        avatarUrl={otherUser.avatar}
                        username={otherUser.username}
                        avatarClassName="w-8 h-8 border border-gray-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] group/msg`}>
                  <div className="flex items-center gap-2 w-full justify-end">
                    {isMe && (
                      <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <MessageOptions 
                          onEdit={() => {
                            setEditingMessageId(msg.id);
                            setEditMessageContent(msg.message || "");
                            setShowEditMessageModal(true);
                          }} 
                          onDelete={() => handleDeleteMessage(msg.id)} 
                        />
                      </div>
                    )}
                    <div className={`p-3 relative ${
                      isMe 
                        ? 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-[0_4px_12px_rgba(30,143,69,0.2)]' 
                        : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm border border-gray-200/50'
                    }`}>
                    {msg.media_url && (
                      <div 
                        className="mb-2 rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setSelectedImage(msg.media_url as string)}
                      >
                        <img src={msg.media_url} alt="Media" className="max-w-full max-h-60 object-cover bg-black/5" />
                      </div>
                    )}
                    
                    {msg.message && (
                      <p className="text-[15px] leading-snug whitespace-pre-wrap">{msg.message}</p>
                    )}
                  </div>
                </div>
                  
                <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400 font-medium px-1">
                    <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: fr })}</span>
                    {isMe && (
                      <span className={msg.is_read ? 'text-blue-500' : 'text-gray-300'}>
                        {msg.is_read ? ' • Lu' : ' • Envoyé'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        
        {mediaPreview && (
          <div className="mb-3 relative inline-block ml-4">
            <div className="relative rounded-xl overflow-hidden h-24 border border-gray-200 bg-gray-50 shadow-sm">
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

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end relative px-1">
          
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}

          <div className="flex-1 flex items-center gap-1 bg-gray-100/80 rounded-3xl border border-gray-200/50 p-1.5 transition-all focus-within:bg-white focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5">
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
              className="rounded-full w-9 h-9 text-gray-500 hover:text-primary hover:bg-primary/10 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className={`rounded-full w-9 h-9 shrink-0 transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-primary hover:bg-primary/10'}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isUploading}
            >
              <Smile className="w-5 h-5" />
            </Button>

            <Input 
              className="flex-1 bg-transparent border-none h-10 px-2 focus-visible:ring-0 shadow-none text-[15px] resize-none" 
              placeholder="Écrivez un message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isUploading}
              autoComplete="off"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={(!newMessage.trim() && !mediaFile) || isUploading} 
            size="icon" 
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white shrink-0 disabled:opacity-50 shadow-md shadow-primary/20 transition-transform active:scale-95"
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
      </div>

      <Dialog open={showEditMessageModal} onOpenChange={setShowEditMessageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              value={editMessageContent}
              onChange={(e) => setEditMessageContent(e.target.value)}
              className="min-h-25 resize-none"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditMessageModal(false)}>Annuler</Button>
              <Button onClick={handleEditMessageSubmit} disabled={!editMessageContent.trim()} className="bg-primary text-white">Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MessageOptions({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-xl shadow-lg border p-1 z-50 animate-in fade-in zoom-in duration-200">
             <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
               <Pencil className="w-4 h-4" /> Modifier
             </button>
             <button onClick={() => { setOpen(false); onDelete(); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
               <Trash2 className="w-4 h-4" /> Supprimer
             </button>
          </div>
        </>
      )}
    </div>
  );
}
