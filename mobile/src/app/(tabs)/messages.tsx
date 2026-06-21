import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import { NewConversationModal } from '../../components/social/new-conversation-modal';

export default function MessagesScreen() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewConversation, setShowNewConversation] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [session]);

  const fetchConversations = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          user1:users!conversations_user1_id_fkey(id, username, avatar),
          user2:users!conversations_user2_id_fkey(id, username, avatar),
          private_messages(message, media_url, is_read, sender_id, created_at)
        `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }
      
      setConversations(data || []);
    } catch (error) {
      console.log('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }: { item: any }) => {
    // Find the other participant
    const user1 = Array.isArray(item.user1) ? item.user1[0] : item.user1;
    const user2 = Array.isArray(item.user2) ? item.user2[0] : item.user2;
    
    const otherParticipant = user1?.id === session?.user?.id ? user2 : user1;
    
    // Get last message
    const sortedMessages = (item.private_messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lastMessage = sortedMessages[0];
    const isUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== session?.user?.id;

    return (
      <TouchableOpacity className={`flex-row items-center p-4 border-b border-gray-50 ${isUnread ? 'bg-blue-50/30' : 'bg-white'}`}>
        <Avatar url={otherParticipant?.avatar} fallback={otherParticipant?.username || '?'} size={52} />
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className={`text-[16px] ${isUnread ? 'font-black text-black' : 'font-bold text-gray-900'}`}>
              {otherParticipant?.username || 'Utilisateur'}
            </Text>
            <Text className={`text-xs ${isUnread ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
              {lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : (item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '')}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className={`text-[14px] flex-1 ${isUnread ? 'font-bold text-black' : 'text-gray-500'}`} numberOfLines={1}>
              {lastMessage ? (
                <>
                  {lastMessage.sender_id === session?.user?.id ? 'Vous: ' : ''}
                  {lastMessage.message || 'Image envoyée'}
                </>
              ) : 'Nouvelle conversation'}
            </Text>
            {isUnread && (
              <View className="w-2 h-2 rounded-full bg-blue-600 ml-2" />
            )}
          </View>
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
        <TouchableOpacity 
          className="bg-blue-50 p-2 rounded-full"
          onPress={() => setShowNewConversation(true)}
        >
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
            <TouchableOpacity 
              className="mt-6 bg-blue-600 px-6 py-3 rounded-full"
              onPress={() => setShowNewConversation(true)}
            >
              <Text className="text-white font-bold">Nouvelle conversation</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {session?.user && (
        <NewConversationModal 
          visible={showNewConversation}
          onClose={() => {
            setShowNewConversation(false);
            fetchConversations(); // Refresh list after closing modal
          }}
          currentUserId={session.user.id}
        />
      )}
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
