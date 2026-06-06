"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { addComment } from "@/actions/social";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  users: {
    username: string;
    avatar: string;
  };
};

export function PostComments({ 
  postId, 
  initialComments = [],
  onCommentAdded
}: { 
  postId: string;
  initialComments?: Comment[];
  onCommentAdded?: () => void;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments);

  useEffect(() => {
    setLocalComments(initialComments);
  }, [initialComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Optimistic update
    const tempComment: Comment = {
      id: Math.random().toString(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      users: { username: "Vous", avatar: "" }
    };
    
    setLocalComments(prev => [...prev, tempComment]);
    if (onCommentAdded) onCommentAdded();
    
    const res = await addComment(postId, content);
    
    if (res?.error) {
      setLocalComments(initialComments); // revert
      alert(res.error);
    } else {
      setContent("");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-4">
      
      {/* Liste des commentaires */}
      {localComments.length > 0 ? (
        <div className="flex flex-col gap-3">
          {localComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 items-start">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.users?.avatar || undefined} />
                <AvatarFallback>{comment.users?.username?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2.5">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[13px] font-bold text-gray-900">{comment.users?.username}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic px-2">Soyez le premier à commenter !</p>
      )}

      {/* Formulaire d'ajout */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-2">
        <Input 
          placeholder="Écrire un commentaire..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-full bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-primary h-10 text-[13px]"
          disabled={isSubmitting}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!content.trim() || isSubmitting}
          className="rounded-full h-10 w-10 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
