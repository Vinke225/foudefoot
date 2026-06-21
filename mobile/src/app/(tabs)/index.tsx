import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { PostCard } from '../../components/social/post-card';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import { CreatePostModal } from '../../components/social/create-post-modal';

export default function HomeScreen() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime posts
    const channelName = `public_posts_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // A new post was created, we should re-fetch to get all joined data (users, likes)
          // or at least fetch that specific post. 
          // For simplicity and data integrity, we re-fetch the feed quietly.
          fetchPosts(false);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchData = async () => {
    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('id, username, avatar')
        .eq('id', session.user.id)
        .single();
      setUserProfile(data);
    }
    await fetchPosts();
  };

  const fetchPosts = async (showLoading = true) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (username, avatar, country),
          likes (
            user_id, reaction_type,
            users (username)
          ),
          comments (
            id, content, created_at,
            users (username)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (showLoading) setLoading(false);
      if (showLoading) setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  const handlePostCreated = (newPost: any) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const renderHeader = () => (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-4 px-2">
        <Text className="text-2xl font-bold text-gray-900">Actualités</Text>
        <TouchableOpacity className="bg-gray-100 p-2 rounded-full">
          <Ionicons name="search" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
      
      {/* Create Post Native Component */}
      <View className="bg-white p-4 rounded-3xl border border-gray-100 flex-row items-center shadow-sm">
        <Avatar url={userProfile?.avatar} fallback={userProfile?.username || '?'} size={40} />
        <TouchableOpacity 
          className="flex-1 bg-gray-50 ml-3 rounded-full py-3 px-4"
          onPress={() => setShowCreatePost(true)}
        >
          <Text className="text-gray-400 font-medium">Partagez votre émotion...</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="ml-3 bg-blue-50 p-2.5 rounded-full"
          onPress={() => setShowCreatePost(true)}
        >
          <Ionicons name="image-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            currentUserId={session?.user?.id} 
            onPostDeleted={handlePostDeleted}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />
        }
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-3xl border border-gray-100 items-center mt-4">
            <Text className="font-bold text-lg mb-2">Aucune publication</Text>
            <Text className="text-gray-500 text-center">Soyez le premier à partager vos émotions sur la compétition !</Text>
          </View>
        }
      />
      
      <CreatePostModal 
        visible={showCreatePost} 
        onClose={() => setShowCreatePost(false)} 
        userProfile={userProfile} 
        onPostCreated={handlePostCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Tailwind gray-100
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
