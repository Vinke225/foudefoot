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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }
      
      setNotifications(data || []);
    } catch (error) {
      console.log('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    let iconName = "notifications";
    let iconColor = "#3B82F6";
    let bgColor = item.read ? "bg-white" : "bg-blue-50";
    
    if (item.type === 'like') {
      iconName = "heart";
      iconColor = "#EF4444";
    } else if (item.type === 'comment') {
      iconName = "chatbubble";
      iconColor = "#10B981";
    } else if (item.type === 'follow') {
      iconName = "person-add";
      iconColor = "#3B82F6";
    } else if (item.type === 'message') {
      iconName = "chatbubble-ellipses";
      iconColor = "#3B82F6";
    }

    const handlePress = async () => {
      if (!item.read) {
        await supabase.from('notifications').update({ read: true }).eq('id', item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      }
      if (item.type === 'message' && item.link) {
        import('expo-router').then(({ router }) => router.push(item.link));
      }
    };

    return (
      <TouchableOpacity 
        className={`flex-row items-center p-4 border-b border-gray-100 ${bgColor}`}
        onPress={handlePress}
      >
        <View className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-[15px] text-gray-900 leading-5">
            {item.content || 'Nouvelle notification'}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        {!item.read && (
          <View className="w-2 h-2 rounded-full bg-blue-600 ml-2" />
        )}
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
