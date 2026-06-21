import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { PostCard } from '../../components/social/post-card';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [session]);

  const fetchProfileData = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setProfile(userProfile);

      const { data: userPosts } = await supabase
        .from('posts')
        .select(`
          *,
          users (username, avatar, country),
          likes (user_id, reaction_type),
          comments (id)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setPosts(userPosts || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View className="mb-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-4">
      <View className="items-center">
        <Avatar url={profile?.avatar} fallback={profile?.username || '?'} size={80} className="mb-4" />
        <Text className="text-2xl font-bold text-gray-900">{profile?.username || 'Utilisateur'}</Text>
        <Text className="text-gray-500 mt-1">{profile?.country || 'Sélectionnez votre pays'}</Text>
      </View>
      
      <View className="flex-row justify-around mt-6 pt-6 border-t border-gray-100">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">{posts.length}</Text>
          <Text className="text-gray-500 text-sm">Publications</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">0</Text>
          <Text className="text-gray-500 text-sm">Abonnés</Text>
        </View>
      </View>
      
      <TouchableOpacity className="mt-6 bg-blue-50 py-3 rounded-full items-center">
        <Text className="text-blue-600 font-semibold">Modifier le profil</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold">Mon Profil</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard post={item} currentUserId={session?.user?.id} />
        )}
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-3xl border border-gray-100 items-center mt-4">
            <Text className="font-bold text-lg mb-2">Aucune publication</Text>
            <Text className="text-gray-500 text-center">Vous n'avez rien publié pour le moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
