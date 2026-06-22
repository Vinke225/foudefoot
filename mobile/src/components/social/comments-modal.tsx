import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, SafeAreaView, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../ui/avatar';
import { supabase } from '../../lib/supabase';

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  currentUserId: string;
  onCommentAdded?: () => void;
}

export function CommentsModal({ visible, onClose, postId, currentUserId, onCommentAdded }: CommentsModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible || !postId) return;

    fetchComments(true);

    // Subscribe to realtime comments
    const channelName = `comments_modal_${postId}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          // When a new comment arrives, refresh the list quietly
          fetchComments(false);
          // If it's someone else's comment, increment the counter on the PostCard
          if (onCommentAdded && payload.new.user_id !== currentUserId) {
            onCommentAdded();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, postId]);

  const fetchComments = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at,
          users (id, username, avatar)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUserId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
        });

      if (error) throw error;
      
      setNewComment('');
      if (onCommentAdded) onCommentAdded();
      await fetchComments(); // Re-fetch to guarantee joined data (avatar, username) is present
      
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Erreur lors de l\'envoi du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <View className="w-8" />
            <Text className="font-bold text-lg">Commentaires</Text>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-1.5 rounded-full">
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#1E40AF" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View className="flex-row mb-5">
                  <Avatar url={item.users?.avatar} fallback={item.users?.username || '?'} size={36} />
                  <View className="flex-1 ml-3 bg-gray-50 p-3 rounded-2xl rounded-tl-none">
                    <Text className="font-bold text-sm text-gray-900 mb-1">{item.users?.username}</Text>
                    <Text className="text-[14px] text-gray-800 leading-5">{item.content}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center mt-10">
                  <Text className="text-gray-500">Aucun commentaire pour le moment.</Text>
                  <Text className="text-gray-400 text-sm mt-1">Soyez le premier à réagir !</Text>
                </View>
              }
            />
          )}

          {/* Input Area */}
          <View 
            className="border-t border-gray-100 p-3 flex-row items-center bg-white"
            style={{ paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 12) }}
          >
            <TextInput
              className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-[15px]"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={handlePostComment}
              disabled={!newComment.trim() || isSubmitting}
              className={`ml-3 p-2.5 rounded-full ${newComment.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color={newComment.trim() ? '#fff' : '#9CA3AF'} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
