"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toggleFollow } from "@/actions/social";

export function FollowButton({ targetUserId, initialIsFollowing }: { targetUserId: string, initialIsFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    const res = await toggleFollow(targetUserId);
    if (res?.success) {
      setIsFollowing(res.isFollowing!);
    } else if (res?.error) {
      alert(res.error);
    }
    setIsLoading(false);
  };

  if (isFollowing) {
    return (
      <Button 
        onClick={handleFollow}
        disabled={isLoading}
        variant="outline"
        className="rounded-xl px-6 h-11 font-bold flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
        Se désabonner
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleFollow}
      disabled={isLoading}
      className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold shadow-[0_4px_14px_rgba(30,143,69,0.3)] flex items-center gap-2"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      Suivre
    </Button>
  );
}
