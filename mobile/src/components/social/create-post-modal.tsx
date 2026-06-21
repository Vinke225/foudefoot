import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Avatar } from '../ui/avatar';
import { supabase } from '../../lib/supabase';

import EmojiPicker from 'rn-emoji-keyboard';
import { GifPicker } from './gif-picker';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  onPostCreated: (newPost: any) => void;
}

export function CreatePostModal({ visible, onClose, userProfile, onPostCreated }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setGifUrl(null);
    }
  };

  const handleGifSelect = (url: string) => {
    setGifUrl(url);
    setImageUri(null);
  };

  const handlePublish = async () => {
    if (!caption.trim() && !imageUri && !gifUrl) return;
    if (!userProfile) return;

    setLoading(true);
    try {
      let finalMediaUrl = gifUrl;

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
          
        finalMediaUrl = publicUrl;
      }

      // 2. Create the post in the database
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: userProfile.id,
          caption: caption.trim(),
          media_url: finalMediaUrl,
          type: finalMediaUrl ? 'image' : 'text', // Added type column to satisfy not-null constraint
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
      setGifUrl(null);
      onPostCreated(newPost);
      onClose();

    } catch (error) {
      console.error('Error publishing post:', error);
      alert("Une erreur est survenue lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  const mediaPreviewUrl = imageUri || gifUrl;

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
              disabled={loading || (!caption.trim() && !mediaPreviewUrl)}
              className={`px-4 py-1.5 rounded-full ${(!caption.trim() && !mediaPreviewUrl) ? 'bg-gray-200' : 'bg-blue-600'}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className={`font-bold ${(!caption.trim() && !mediaPreviewUrl) ? 'text-gray-400' : 'text-white'}`}>Publier</Text>
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

            {mediaPreviewUrl && (
              <View className="mt-4 relative">
                <Image source={{ uri: mediaPreviewUrl }} className="w-full h-64 rounded-xl" resizeMode="cover" />
                <TouchableOpacity 
                  className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"
                  onPress={() => {
                    setImageUri(null);
                    setGifUrl(null);
                  }}
                  disabled={loading}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Toolbar (Bottom) */}
          <View className="border-t border-gray-100 p-4 flex-row items-center gap-4">
            <TouchableOpacity onPress={pickImage} disabled={loading} className="p-2 bg-gray-50 rounded-full">
              <Ionicons name="image-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEmojiPicker(true)} disabled={loading} className="p-2 bg-gray-50 rounded-full">
              <Ionicons name="happy-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGifPicker(true)} disabled={loading} className="px-3 py-2 bg-gray-50 rounded-full">
              <Text className="text-blue-500 font-bold text-xs">GIF</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <EmojiPicker 
        open={showEmojiPicker} 
        onClose={() => setShowEmojiPicker(false)} 
        onEmojiSelected={(emoji) => setCaption(prev => prev + emoji.emoji)}
        translation={{
          search: "Rechercher",
          recently_used: "Récemment utilisés",
          smileys_emotion: "Smileys & Émotions",
          people_body: "Personnes & Corps",
          animals_nature: "Animaux & Nature",
          food_drink: "Nourriture & Boissons",
          travel_places: "Voyages & Lieux",
          activities: "Activités",
          objects: "Objets",
          symbols: "Symboles",
          flags: "Drapeaux"
        }}
      />

      <GifPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onGifSelect={handleGifSelect}
      />
    </Modal>
  );
}
