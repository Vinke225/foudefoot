"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type RealtimeContextType = {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  onlineUsers: string[];
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({
  children,
  initialUnreadCount,
  userId,
}: {
  children: React.ReactNode;
  initialUnreadCount: number;
  userId?: string;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Reset unreadCount to initialUnreadCount whenever it changes (e.g. Server Component refresh)
    setUnreadCount(initialUnreadCount);

    // 1. Canal Notifications et Base de données
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Increment unread count when a new notification is inserted
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.read === true && payload.old.read === false) {
             setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        () => router.refresh()
      )
      .subscribe();

    // 2. Canal Presence (Statut en Ligne)
    const presenceChannel = supabase.channel('online-users');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        // newState a pour format: { "id_aleatoire": [{ user_id: "uuid" }] }
        const onlineIds = Object.values(newState)
          .flatMap((presenceArray) => presenceArray.map((p: any) => p.user_id))
          .filter(Boolean);
        
        // Supprimer les doublons éventuels
        setOnlineUsers(Array.from(new Set(onlineIds)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [userId, initialUnreadCount, supabase, router]);

  return (
    <RealtimeContext.Provider value={{ unreadCount, setUnreadCount, onlineUsers }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
