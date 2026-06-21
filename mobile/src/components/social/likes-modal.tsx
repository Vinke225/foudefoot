import React, { useState, useEffect } from 'react';
import { View, Text, Modal, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/avatar';
import { supabase } from '../../lib/supabase';

interface LikesModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

export function LikesModal({ visible, onClose, postId }: LikesModalProps) {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && postId) {
      fetchLikes();
    }
  }, [visible, postId]);

  const fetchLikes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id, reaction_type,
          users (id, username, avatar)
        `)
        .eq('post_id', postId);

      if (error) throw error;
      setLikes(data || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmojiForReaction = (reaction: string) => {
    switch (reaction) {
      case 'love': return '❤️';
      case 'haha': return '😂';
      case 'sad': return '😢';
      case 'angry': return '😡';
      default: return '👍';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <View className="w-8" />
          <Text className="font-bold text-lg">Réactions</Text>
          <TouchableOpacity onPress={onClose} className="bg-gray-100 p-1.5 rounded-full">
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Likes List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#1E40AF" />
          </View>
        ) : (
          <FlatList
            data={likes}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View className="flex-row items-center mb-4">
                <View className="relative">
                  <Avatar url={item.users?.avatar} fallback={item.users?.username || '?'} size={44} />
                  <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <Text style={{ fontSize: 12 }}>{getEmojiForReaction(item.reaction_type)}</Text>
                  </View>
                </View>
                <Text className="ml-3 font-bold text-base text-gray-900">{item.users?.username}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center mt-10">
                <Text className="text-gray-500">Aucune réaction pour le moment.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
