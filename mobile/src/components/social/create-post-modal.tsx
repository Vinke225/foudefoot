import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Avatar } from '../ui/avatar';
import { supabase } from '../../lib/supabase';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  onPostCreated: (newPost: any) => void;
}

export function CreatePostModal({ visible, onClose, userProfile, onPostCreated }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!caption.trim() && !imageUri) return;
    if (!userProfile) return;

    setLoading(true);
    try {
      let uploadedMediaUrl = null;

      // 1. Upload image to Supabase Storage if an image is selected
      if (imageUri) {
        const fileExt = imageUri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userProfile.id}/${fileName}`;

        // Read the file as Base64 using expo-file-system
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

        // Upload the decoded array buffer to Supabase
        const { error: uploadError, data } = await supabase.storage
          .from('posts_media')
          .upload(filePath, decode(base64), { 
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` 
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts_media')
          .getPublicUrl(filePath);
          
        uploadedMediaUrl = publicUrl;
      }

      // 2. Create the post in the database
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: userProfile.id,
          caption: caption.trim(),
          media_url: uploadedMediaUrl,
          type: uploadedMediaUrl ? 'image' : 'text', // Added type column to satisfy not-null constraint
        })
        .select(`
          *,
          users (username, avatar, country),
          likes (user_id, reaction_type),
          comments (id)
        `)
        .single();

      if (error) throw error;

      // 3. Reset state and close modal
      setCaption('');
      setImageUri(null);
      onPostCreated(newPost);
      onClose();

    } catch (error) {
      console.error('Error publishing post:', error);
      alert("Une erreur est survenue lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Text className="text-gray-500 font-medium text-base">Annuler</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg">Créer une publication</Text>
            <TouchableOpacity 
              onPress={handlePublish}
              disabled={loading || (!caption.trim() && !imageUri)}
              className={`px-4 py-1.5 rounded-full ${(!caption.trim() && !imageUri) ? 'bg-gray-200' : 'bg-blue-600'}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className={`font-bold ${(!caption.trim() && !imageUri) ? 'text-gray-400' : 'text-white'}`}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Content area */}
          <View className="flex-1 px-4 py-4">
            <View className="flex-row">
              <Avatar url={userProfile?.avatar} fallback={userProfile?.username || '?'} size={44} />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="Partagez votre émotion sur le match..."
                placeholderTextColor="#9CA3AF"
                multiline
                autoFocus
                value={caption}
                onChangeText={setCaption}
                editable={!loading}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>

            {imageUri && (
              <View className="mt-4 relative">
                <Image source={{ uri: imageUri }} className="w-full h-64 rounded-xl" resizeMode="cover" />
                <TouchableOpacity 
                  className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"
                  onPress={() => setImageUri(null)}
                  disabled={loading}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Toolbar (Bottom) */}
          <View className="border-t border-gray-100 p-4 flex-row items-center">
            <TouchableOpacity onPress={pickImage} disabled={loading} className="flex-row items-center mr-4">
              <Ionicons name="image-outline" size={24} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-2">Ajouter une image</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
