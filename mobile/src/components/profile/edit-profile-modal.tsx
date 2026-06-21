import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialData: {
    username?: string;
    bio?: string;
    country?: string;
  };
  onProfileUpdated?: () => void;
}

export function EditProfileModal({ visible, onClose, userId, initialData, onProfileUpdated }: EditProfileModalProps) {
  const [username, setUsername] = useState(initialData.username || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [country, setCountry] = useState(initialData.country || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(initialData.username || '');
      setBio(initialData.bio || '');
      setCountry(initialData.country || '');
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          bio: bio.trim(),
          country: country.trim()
        })
        .eq('id', userId);

      if (error) throw error;
      
      if (onProfileUpdated) onProfileUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
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
            <Text className="font-bold text-lg">Modifier le profil</Text>
            <TouchableOpacity 
              onPress={handleSave}
              disabled={!username.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text className={`text-[16px] font-bold ${!username.trim() ? 'text-blue-300' : 'text-blue-600'}`}>
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <Text className="text-gray-500 font-medium mb-1 ml-1">Nom d'utilisateur</Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <TextInput
                className="text-[16px] text-gray-900"
                placeholder="Votre pseudo"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <Text className="text-gray-500 font-medium mb-1 ml-1">Pays / Équipe favorite</Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <TextInput
                className="text-[16px] text-gray-900"
                placeholder="Ex: France, Côte d'Ivoire..."
                value={country}
                onChangeText={setCountry}
              />
            </View>

            <Text className="text-gray-500 font-medium mb-1 ml-1">Biographie</Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <TextInput
                className="text-[16px] text-gray-900"
                placeholder="Dites-en plus sur vous..."
                value={bio}
                onChangeText={setBio}
                multiline
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
