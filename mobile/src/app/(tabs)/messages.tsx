import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [session]);

  const fetchConversations = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      // Assuming a generic conversations or messages table exists
      // If it doesn't, this will just return empty instead of crashing the app
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user:users (id, username, avatar)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }
      
      setConversations(data || []);
    } catch (error) {
      console.log('Error fetching conversations (or table does not exist):', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }: { item: any }) => {
    // Find the other participant
    const otherParticipant = item.participants?.find(
      (p: any) => p.user?.id !== session?.user?.id
    )?.user;

    return (
      <TouchableOpacity className="flex-row items-center p-4 bg-white border-b border-gray-50">
        <Avatar url={otherParticipant?.avatar} fallback={otherParticipant?.username || '?'} size={52} />
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-bold text-[16px] text-gray-900">{otherParticipant?.username || 'Utilisateur'}</Text>
            <Text className="text-xs text-gray-400">
              {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}
            </Text>
          </View>
          <Text className="text-[14px] text-gray-500" numberOfLines={1}>
            {item.last_message || 'Nouvelle conversation'}
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
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold">Messages</Text>
        <TouchableOpacity className="bg-blue-50 p-2 rounded-full">
          <Ionicons name="create-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text className="font-bold text-lg text-gray-900 mt-4">Aucun message</Text>
            <Text className="text-gray-500 text-center mt-2">Commencez à discuter avec d'autres passionnés de football !</Text>
            <TouchableOpacity className="mt-6 bg-blue-600 px-6 py-3 rounded-full">
              <Text className="text-white font-bold">Nouvelle conversation</Text>
            </TouchableOpacity>
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
