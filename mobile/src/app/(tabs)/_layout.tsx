import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session } = useAuth();
  
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    // Fonction pour charger les comptes initiaux
    const fetchCounts = async () => {
      // Notifs non lues
      const { count: notifsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false);
      
      if (notifsCount !== null) setUnreadNotifs(notifsCount);

      // Messages privés non lus
      const { count: msgsCount } = await supabase
        .from('private_messages')
        .select('id, conversation_id, sender_id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', session.user.id);
        
      if (msgsCount !== null) setUnreadMessages(msgsCount);
    };

    fetchCounts();

    // S'abonner aux nouvelles notifications
    const notifSub = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${session.user.id}` 
      }, fetchCounts)
      .subscribe();

    // S'abonner aux nouveaux messages privés
    // Comme RLS bloque les events pour lesquels on n'a pas accès, on écoute tout ce qui nous est accessible
    const msgSub = supabase
      .channel('public:private_messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'private_messages'
      }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(notifSub);
      supabase.removeChannel(msgSub);
    };
  }, [session]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="livetv"
        options={{
          title: 'Live TV',
          tabBarIcon: ({ color }) => <Ionicons name="tv" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifs',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
          tabBarBadge: unreadNotifs > 0 ? unreadNotifs : undefined,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
