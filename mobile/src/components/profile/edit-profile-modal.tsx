import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Avatar } from '../ui/avatar';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialData: {
    username?: string;
    bio?: string;
    country?: string;
    avatar?: string;
    cover_url?: string;
  };
  onProfileUpdated?: () => void;
}

export function EditProfileModal({ visible, onClose, userId, initialData, onProfileUpdated }: EditProfileModalProps) {
  const [username, setUsername] = useState(initialData.username || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [country, setCountry] = useState(initialData.country || '');
  
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar || '');
  const [coverUrl, setCoverUrl] = useState(initialData.cover_url || '');
  
  const [avatarFileUri, setAvatarFileUri] = useState<string | null>(null);
  const [coverFileUri, setCoverFileUri] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive", 
          onPress: async () => {
            setIsLoggingOut(true);
            await supabase.auth.signOut();
            onClose();
          } 
        }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      setUsername(initialData.username || '');
      setBio(initialData.bio || '');
      setCountry(initialData.country || '');
      setAvatarUrl(initialData.avatar || '');
      setCoverUrl(initialData.cover_url || '');
      setAvatarFileUri(null);
      setCoverFileUri(null);
    }
  }, [visible, initialData]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarFileUri(result.assets[0].uri);
    }
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverFileUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!username.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let newAvatarUrl = avatarUrl;
      let newCoverUrl = coverUrl;

      // Upload new avatar if selected
      if (avatarFileUri) {
        const fileExt = avatarFileUri.split('.').pop() || 'jpg';
        const fileName = `${userId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const base64 = await FileSystem.readAsStringAsync(avatarFileUri, { encoding: 'base64' });
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64), { contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` });
          
        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
          newAvatarUrl = data.publicUrl;
        }
      }

      // Upload new cover if selected
      if (coverFileUri) {
        const fileExt = coverFileUri.split('.').pop() || 'jpg';
        const fileName = `${userId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const base64 = await FileSystem.readAsStringAsync(coverFileUri, { encoding: 'base64' });
        
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, decode(base64), { contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` });
          
        if (!uploadError) {
          const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
          newCoverUrl = data.publicUrl;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          bio: bio.trim(),
          country: country.trim(),
          avatar: newAvatarUrl,
          cover_url: newCoverUrl
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 z-10 bg-white">
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
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

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Cover & Avatar Edit Section */}
            <View className="relative w-full h-40 bg-gray-200">
              {(coverFileUri || coverUrl) ? (
                <Image 
                  source={{ uri: coverFileUri || coverUrl }} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode="cover" 
                />
              ) : null}
              <View className="absolute inset-0 bg-black/30 items-center justify-center">
                <TouchableOpacity onPress={pickCover} className="bg-black/50 p-2 rounded-full flex-row items-center">
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text className="text-white ml-2 font-medium">Changer la couverture</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-center -mt-16 mb-4">
              <View className="relative">
                <Avatar url={avatarFileUri || avatarUrl} fallback={username || '?'} size={110} className="border-4 border-white" />
                <TouchableOpacity 
                  onPress={pickAvatar}
                  className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full border-4 border-white shadow-sm"
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
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
              <View className="bg-gray-50 rounded-xl px-4 py-3 mb-8">
                <TextInput
                  className="text-[16px] text-gray-900"
                  placeholder="Dites-en plus sur vous..."
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>

              <TouchableOpacity 
                onPress={handleLogout}
                disabled={isLoggingOut}
                className="mt-2 mb-8 bg-red-50 py-3.5 rounded-xl border border-red-100 flex-row items-center justify-center"
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text className="text-red-500 font-bold ml-2">Déconnexion</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
