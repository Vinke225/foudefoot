import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [session]);

  const fetchNotifications = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      // Assuming a generic notifications table exists
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (username, avatar)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        // Ignore table not found error just in case it's structured differently
        throw error;
      }
      
      setNotifications(data || []);
    } catch (error) {
      console.log('Error fetching notifications (or table does not exist):', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    let iconName = "notifications";
    let iconColor = "#3B82F6";
    
    if (item.type === 'like') {
      iconName = "heart";
      iconColor = "#EF4444";
    } else if (item.type === 'comment') {
      iconName = "chatbubble";
      iconColor = "#10B981";
    }

    return (
      <TouchableOpacity className="flex-row items-start p-4 bg-white border-b border-gray-50">
        <View className="relative">
          <Avatar url={item.actor?.avatar} fallback={item.actor?.username || '?'} size={48} />
          <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            <Ionicons name={iconName as any} size={16} color={iconColor} />
          </View>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-[15px] text-gray-900 leading-5">
            <Text className="font-bold">{item.actor?.username || 'Quelqu\'un'}</Text> {item.message || 'a interagi avec votre profil.'}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold">Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-20">
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text className="font-bold text-lg text-gray-900 mt-4">Aucune notification</Text>
            <Text className="text-gray-500 text-center mt-2">Vous serez prévenu ici dès qu'il y aura du nouveau !</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
