"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toggleLikePost } from "@/actions/social";

const REACTIONS = [
  { type: 'like', icon: '❤️', label: 'J\'aime' },
  { type: 'football', icon: '⚽️', label: 'Top' },
  { type: 'fire', icon: '🔥', label: 'Feu' },
  { type: 'shock', icon: '🤯', label: 'Wow' },
  { type: 'laugh', icon: '😂', label: 'Haha' },
  { type: 'sad', icon: '😢', label: 'Triste' },
  { type: 'angry', icon: '😡', label: 'Grrr' },
  { type: 'goat', icon: '🐐', label: 'GOAT' },
  { type: 'card', icon: '🟥', label: 'Faute' },
];

import { PostComments } from "./PostComments";

export function PostInteractions({ 
  postId, 
  initialLikes, 
  hasLiked, 
  initialReactionType,
  likesData = [],
  commentsCount,
  commentsData
}: { 
  postId: string, 
  initialLikes: number, 
  hasLiked: boolean, 
  initialReactionType?: string,
  likesData?: { user_id: string; reaction_type: string; users?: { id: string; username: string; avatar: string } }[],
  commentsCount: number,
  commentsData?: { id: string; content: string; created_at: string; users: { username: string; avatar: string } }[]
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(hasLiked);
  const [reactionType, setReactionType] = useState(initialReactionType || 'like');
  const [isPending, setIsPending] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [showReactions, setShowReactions] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiked(hasLiked);
  }, [hasLiked]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReactionType(initialReactionType || 'like');
  }, [initialReactionType]);

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

  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactions(true);
    }, 400);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelPress();
    if (showReactions) {
      setShowReactions(false);
      return;
    }
    handleReaction(liked ? reactionType : 'like');
  };

  const currentReaction = REACTIONS.find(r => r.type === reactionType) || REACTIONS[0];

  const reactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (likesData || []).forEach(l => {
      const type = l.reaction_type || 'like';
      counts[type] = (counts[type] || 0) + 1;
    });
    // Adjust for current user's local change
    if (hasLiked) {
      const initType = initialReactionType || 'like';
      counts[initType] = Math.max(0, (counts[initType] || 0) - 1);
    }
    if (liked) {
      const currentType = reactionType || 'like';
      counts[currentType] = (counts[currentType] || 0) + 1;
    }
    return counts;
  }, [likesData, initialReactionType, hasLiked, liked, reactionType]);

  const topReactions = useMemo(() => {
    return Object.entries(reactionCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => REACTIONS.find(r => r.type === type))
      .filter(Boolean) as typeof REACTIONS;
  }, [reactionCounts]);

  return (
    <div className="flex flex-col w-full">
      {/* Résumé des réactions (Style Facebook) */}
      {(likes > 0 || localCommentsCount > 0) && (
        <div className="flex items-center justify-between py-2 mb-2 border-b border-gray-50">
          {likes > 0 ? (
            <Dialog>
              <DialogTrigger render={<button className="flex items-center gap-1.5 hover:bg-gray-50 p-1 rounded-lg transition-colors" />}>
                  <div className="flex -space-x-1.5">
                    {topReactions.map((r, i) => (
                      <div key={r.type} className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow-[0_0_0_1px_#fff] relative" style={{ zIndex: 10 - i }}>
                        <span className="text-[12px] leading-none">{r.icon}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[13px] text-gray-500 hover:underline">{likes}</span>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0 border-0 sm:border">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle>Réactions</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-2">
                  {(!likesData || likesData.length === 0) && (
                    <div className="text-center p-4 text-gray-500">Actualisez pour voir les réactions récentes</div>
                  )}
                  {(likesData || []).map((l, i) => {
                    const r = REACTIONS.find(x => x.type === l.reaction_type) || REACTIONS[0];
                    return (
                      <div key={`${l.user_id}-${i}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={l.users?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${l.users?.username}`} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow-sm w-4 h-4 flex items-center justify-center text-[10px]">
                              {r.icon}
                            </div>
                          </div>
                          <span className="font-bold text-[14px] text-black">{l.users?.username || 'Utilisateur'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          ) : <div />}
          
          {localCommentsCount > 0 && (
            <div className="text-[13px] text-gray-500">
              {localCommentsCount} commentaire{localCommentsCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {showReactions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowReactions(false)} 
          onTouchStart={() => setShowReactions(false)}
        />
      )}
      <div className="flex items-center gap-10 text-gray-500 pt-1 relative">
        <div className="group relative">
          <div className={`absolute bottom-full left-0 mb-2 ${showReactions ? 'flex' : 'hidden md:group-hover:flex'} bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[30px] px-2 sm:px-3 py-1.5 sm:py-2 gap-1 sm:gap-2 border border-gray-100 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(reaction.type);
                  setShowReactions(false);
                }}
                className="text-[1.35rem] sm:text-2xl hover:scale-150 hover:-translate-y-2 transition-all duration-300 origin-bottom flex flex-col items-center group/emoji"
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
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowReactions(true);
            }}
            onClick={handleLikeClick} 
            className={`flex items-center gap-2.5 transition-colors p-1 -ml-1 rounded-lg select-none touch-none ${liked ? 'text-primary' : 'hover:bg-gray-50 hover:text-primary'}`}
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
            const urlToShare = window.location.href;
            try {
              if (navigator.share) {
                await navigator.share({
                  title: 'Fou de Foot',
                  text: 'Rejoins Fou de Foot pour voir ça !',
                  url: urlToShare,
                });
              } else {
                throw new Error("Share not supported");
              }
            } catch {
              try {
                await navigator.clipboard.writeText(urlToShare);
                alert("Lien copié dans le presse-papier !");
              } catch {
                alert("Impossible de copier le lien.");
              }
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
