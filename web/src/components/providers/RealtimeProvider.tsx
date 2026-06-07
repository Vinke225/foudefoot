"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type RealtimeContextType = {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Reset unreadCount to initialUnreadCount whenever it changes (e.g. Server Component refresh)
    setUnreadCount(initialUnreadCount);

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
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, initialUnreadCount, supabase]);

  return (
    <RealtimeContext.Provider value={{ unreadCount, setUnreadCount }}>
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
