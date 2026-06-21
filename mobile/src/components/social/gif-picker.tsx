import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onGifSelect: (url: string) => void;
}

export function GifPicker({ visible, onClose, onGifSelect }: GifPickerProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetchGifs() {
      if (!visible) return;
      
      setLoading(true);
      try {
        let query = "african reaction meme";
        if (debouncedSearch) {
          // If the user clicked a category like "drapeaux", we use it directly, else we append "african" just in case they want normal gifs
          if (debouncedSearch.startsWith("flag ") || debouncedSearch.startsWith("football club ") || debouncedSearch.startsWith("animal ")) {
            query = debouncedSearch;
          } else {
             query = debouncedSearch + " african";
          }
        }
        const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULELA&limit=20`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          setGifs(data.results.map((r: any) => r.media[0].tinygif.url));
        } else {
          fallbackGifs();
        }
      } catch (err) {
        console.error("Failed to fetch GIFs", err);
        fallbackGifs();
      } finally {
        setLoading(false);
      }
    }
    
    fetchGifs();
  }, [debouncedSearch, visible]);

  const fallbackGifs = () => {
    setGifs([
      "https://media.tenor.com/6X24VntvRiwAAAAC/african-kid-crying.gif",
      "https://media.tenor.com/a9c1BvGk80cAAAAC/black-guy-laughing.gif",
      "https://media.tenor.com/z1mGzN4w_QkAAAAC/african-funny.gif",
      "https://media.tenor.com/1C021VvSgM0AAAAC/confused-black-girl.gif",
      "https://media.tenor.com/YhHnJtI6S20AAAAC/black-guy-thinking.gif"
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-[80%] overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Choisir un GIF</Text>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un GIF..."
                className="flex-1 ml-2 text-[15px] h-8"
                autoCapitalize="none"
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 flex-row">
              <TouchableOpacity onPress={() => setSearch('flag world')} className="px-3 py-1.5 bg-blue-50 rounded-full mr-2">
                <Text className="text-blue-600 font-medium">🏳️ Drapeaux</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSearch('football club logo')} className="px-3 py-1.5 bg-blue-50 rounded-full mr-2">
                <Text className="text-blue-600 font-medium">⚽ Clubs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSearch('animal funny')} className="px-3 py-1.5 bg-blue-50 rounded-full mr-2">
                <Text className="text-blue-600 font-medium">🦁 Animaux</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSearch('football player reaction')} className="px-3 py-1.5 bg-blue-50 rounded-full mr-2">
                <Text className="text-blue-600 font-medium">🏃 Joueurs</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Grid */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#1E40AF" />
            </View>
          ) : (
            <FlatList
              data={gifs}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="flex-1 m-1 aspect-square rounded-xl overflow-hidden bg-gray-100"
                  onPress={() => {
                    onGifSelect(item);
                    onClose();
                  }}
                >
                  <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
