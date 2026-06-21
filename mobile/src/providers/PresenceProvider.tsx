import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type PresenceContextType = {
  onlineUsers: Set<string>;
};

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // If no user, we can still see who is online, but we track under an anonymous or don't track.
    // Usually, we only track authenticated users.
    
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers = new Set<string>();
        
        const onlineIds = Object.values(state)
          .flatMap((presenceArray: any[]) => presenceArray.map((p) => p.user_id))
          .filter(Boolean);
          
        onlineIds.forEach(id => activeUsers.add(id));
        setOnlineUsers(activeUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};
