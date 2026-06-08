"use client";

import { useRealtime } from "@/components/providers/RealtimeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserOnlineAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  username?: string | null;
  className?: string;
  avatarClassName?: string;
}

export function UserOnlineAvatar({ 
  userId, 
  avatarUrl, 
  username, 
  className = "", 
  avatarClassName = "w-10 h-10 border border-gray-100" 
}: UserOnlineAvatarProps) {
  const { onlineUsers } = useRealtime();
  const isOnline = onlineUsers?.includes(userId);

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={avatarClassName}>
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback>{username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10" title="En ligne"></span>
      )}
    </div>
  );
}
