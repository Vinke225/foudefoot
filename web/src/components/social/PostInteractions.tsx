"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { toggleLikePost } from "@/actions/social";

const REACTIONS = [
  { type: 'like', icon: '❤️', label: 'J\'aime' },
  { type: 'football', icon: '⚽️', label: 'Top' },
  { type: 'fire', icon: '🔥', label: 'Feu' },
  { type: 'shock', icon: '🤯', label: 'Wow' },
  { type: 'card', icon: '🟥', label: 'Faute' },
];

import { PostComments } from "./PostComments";

export function PostInteractions({ 
  postId, 
  initialLikes, 
  hasLiked, 
  initialReactionType,
  commentsCount,
  commentsData
}: { 
  postId: string, 
  initialLikes: number, 
  hasLiked: boolean, 
  initialReactionType?: string,
  commentsCount: number,
  commentsData?: { id: string; content: string; created_at: string; users: { username: string; avatar: string } }[]
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(hasLiked);
  const [reactionType, setReactionType] = useState(initialReactionType || 'like');
  const [isPending, setIsPending] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalCommentsCount(commentsCount);
  }, [commentsCount]);

  const handleReaction = async (type: string) => {
    if (isPending) return;
    setIsPending(true);
    
    const isSameReaction = liked && reactionType === type;
    
    if (isSameReaction) {
      setLiked(false);
      setLikes(prev => prev - 1);
    } else {
      if (!liked) setLikes(prev => prev + 1);
      setLiked(true);
      setReactionType(type);
    }
    
    const res = await toggleLikePost(postId, type);
    if (res?.error) {
      setLiked(hasLiked);
      setLikes(initialLikes);
      setReactionType(initialReactionType || 'like');
      alert(res.error);
    }
    
    setIsPending(false);
  };

  const currentReaction = REACTIONS.find(r => r.type === reactionType) || REACTIONS[0];

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-10 text-gray-500 pt-1 relative">
        <div className="group relative">
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[30px] px-3 py-2 gap-2 border border-gray-100 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className="text-2xl hover:scale-150 hover:-translate-y-2 transition-all duration-300 origin-bottom flex flex-col items-center group/emoji"
              >
                <span className="relative">
                  {reaction.icon}
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover/emoji:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {reaction.label}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleReaction('like')} 
            className={`flex items-center gap-2.5 transition-colors p-1 -ml-1 rounded-lg ${liked ? 'text-primary' : 'hover:bg-gray-50 hover:text-primary'}`}
          >
            {liked ? (
              <span className="text-xl animate-in zoom-in duration-300">{currentReaction.icon}</span>
            ) : (
              <span className="text-xl grayscale opacity-60">🤍</span>
            )}
            <span className={`text-[13px] font-medium ${liked ? 'text-primary font-bold' : 'text-gray-700'}`}>
              {likes}
            </span>
          </button>
        </div>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2.5 hover:text-black group transition-colors p-1 rounded-lg hover:bg-gray-50"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[13px] font-medium text-gray-700 group-hover:text-black">{localCommentsCount}</span>
        </button>
        
        <button 
          onClick={async () => {
            try {
              const url = `${window.location.origin}/profil/${postId}`; // Actually we don't have a post page yet, just share the app or a dummy post link
              if (navigator.share) {
                await navigator.share({
                  title: 'Fou de Foot',
                  text: 'Regarde ce post sur Fou de Foot !',
                  url: window.location.href, // sharing the current page since we don't have individual post pages yet
                });
              } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Lien copié dans le presse-papier !");
              }
            } catch (err) {
              console.error("Share failed", err);
            }
          }}
          className="flex items-center gap-2.5 hover:text-blue-500 group transition-colors p-1 rounded-lg hover:bg-gray-50"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[13px] font-medium text-gray-700 group-hover:text-blue-500">Partager</span>
        </button>
      </div>

      {showComments && (
        <PostComments 
          postId={postId} 
          initialComments={commentsData} 
          onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
        />
      )}
    </div>
  );
}
