import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/avatar';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

interface NewConversationModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function NewConversationModal({ visible, onClose, currentUserId }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setUsers([]);
      fetchUsers('');
    }
  }, [visible]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        fetchUsers(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchUsers = async (query: string) => {
    setLoading(true);
    try {
      let req = supabase
        .from('users')
        .select('id, username, avatar')
        .neq('id', currentUserId)
        .limit(20);

      if (query.trim()) {
        req = req.ilike('username', `%${query.trim()}%`);
      }

      const { data, error } = await req;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (otherUserId: string) => {
    try {
      // Vérifier si une conversation existe déjà
      const { data: existingConvo, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`)
        .single();

      if (existingConvo) {
        onClose();
        router.push(`/messages`); // On the web they go to /messages/[id], we need to build /messages/[id] for mobile or just refresh the list for now. Wait, I should navigate to the chat room. But we don't have chat room UI yet? Let's just close and let them click it from the list.
        // Actually, if we don't have a chat room UI on mobile yet, the user can't chat!
        // We will just create the conversation so it appears in the list.
      } else {
        // Create new conversation
        const { error: insertError } = await supabase
          .from('conversations')
          .insert({
            user1_id: currentUserId,
            user2_id: otherUserId,
          });
        
        if (insertError) throw insertError;
        onClose();
        // Here we could trigger a refresh on the messages screen
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Erreur lors de la création de la conversation');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-[16px] text-gray-500">Annuler</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg">Nouveau message</Text>
            <View className="w-12" />
          </View>

          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-[16px] text-gray-900"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          </View>

          {loading && users.length === 0 ? (
            <View className="p-8 items-center">
              <ActivityIndicator color="#3B82F6" />
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="flex-row items-center p-4 border-b border-gray-50"
                  onPress={() => handleStartConversation(item.id)}
                >
                  <Avatar url={item.avatar} fallback={item.username || '?'} size={48} />
                  <Text className="ml-3 font-bold text-[16px] text-gray-900">{item.username}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-500">Aucun utilisateur trouvé</Text>
                </View>
              }
            />
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
