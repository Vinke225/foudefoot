import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  initialCaption: string;
  onPostEdited?: (newCaption: string) => void;
}

export function EditPostModal({ visible, onClose, postId, initialCaption, onPostEdited }: EditPostModalProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCaption(initialCaption);
    }
  }, [visible, initialCaption]);

  const handleEdit = async () => {
    if (!caption.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ caption: caption.trim() })
        .eq('id', postId);

      if (error) throw error;
      
      if (onPostEdited) onPostEdited(caption.trim());
      onClose();
    } catch (error) {
      console.error('Error editing post:', error);
      alert('Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-[16px] text-gray-500">Annuler</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg">Modifier la publication</Text>
            <TouchableOpacity 
              onPress={handleEdit}
              disabled={!caption.trim() || isSubmitting || caption.trim() === initialCaption}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text className={`text-[16px] font-bold ${(!caption.trim() || caption.trim() === initialCaption) ? 'text-blue-300' : 'text-blue-600'}`}>
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <TextInput
              className="text-[16px] text-gray-800"
              placeholder="Que voulez-vous dire ?"
              value={caption}
              onChangeText={setCaption}
              multiline
              autoFocus
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
