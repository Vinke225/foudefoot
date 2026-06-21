import React from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  isOwner: boolean;
  onPostDeleted: (postId: string) => void;
  onEditPress?: () => void;
}

export function PostOptionsModal({ visible, onClose, postId, isOwner, onPostDeleted, onEditPress }: PostOptionsModalProps) {
  
  const handleDelete = () => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              onPostDeleted(postId);
              onClose();
            } catch (err) {
              console.error("Error deleting post:", err);
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    Alert.alert("Signalement", "Cette publication a été signalée aux modérateurs.");
    onClose();
  };

  const handleEdit = () => {
    onClose();
    if (onEditPress) onEditPress();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View className="bg-white rounded-t-3xl pb-10 pt-4 px-4">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />
            
            <TouchableOpacity className="flex-row items-center p-4 rounded-xl mb-2 bg-gray-50">
              <Ionicons name="share-outline" size={24} color="#374151" />
              <Text className="ml-4 font-semibold text-[16px] text-gray-800">Partager via...</Text>
            </TouchableOpacity>

            {isOwner ? (
              <>
                <TouchableOpacity className="flex-row items-center p-4 rounded-xl bg-gray-50 mb-2" onPress={handleEdit}>
                  <Ionicons name="pencil-outline" size={24} color="#374151" />
                  <Text className="ml-4 font-semibold text-[16px] text-gray-800">Modifier la publication</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center p-4 rounded-xl bg-red-50" onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  <Text className="ml-4 font-semibold text-[16px] text-red-500">Supprimer la publication</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity className="flex-row items-center p-4 rounded-xl bg-red-50" onPress={handleReport}>
                <Ionicons name="flag-outline" size={24} color="#EF4444" />
                <Text className="ml-4 font-semibold text-[16px] text-red-500">Signaler la publication</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}
