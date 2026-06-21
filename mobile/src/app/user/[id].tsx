import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { PostCard } from '../../components/social/post-card';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (id) {
      if (session?.user?.id === id) {
        // Rediriger vers son propre profil si c'est nous
        router.replace('/(tabs)/profil');
      } else {
        fetchUserProfile();
      }
    }
  }, [id, session]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Fetch user info
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileError) throw profileError;
      setProfile(userProfile);

      // Fetch user posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select(`
          *,
          users (username, avatar, country),
          likes (user_id, reaction_type),
          comments (id)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      setPosts(userPosts || []);

      // Fetch followers/following stats
      const { count: followers } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id);
        
      const { count: following } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', id);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      // Check if current user is following
      if (session?.user) {
        const { data: followData } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', session.user.id)
          .eq('following_id', id)
          .single();
          
        setIsFollowing(!!followData);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!session?.user || !id || isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', id);
          
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({
            follower_id: session.user.id,
            following_id: id
          });
          
        // Create notification
        await supabase.from('notifications').insert({
          user_id: id,
          type: 'follow',
          content: `${session.user.user_metadata?.username || "Quelqu'un"} a commencé à vous suivre.`,
          link: `/user/${session.user.id}`
        });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!session?.user || !id) return;
    
    try {
      // Create or find conversation
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${session.user.id})`)
        .single();

      if (!existingConvo) {
        await supabase
          .from('conversations')
          .insert({
            user1_id: session.user.id,
            user2_id: id,
          });
      }
      
      // Navigate to messages tab
      router.push('/(tabs)/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const renderHeader = () => (
    <View className="mb-6 bg-white p-6 border-b border-gray-100 shadow-sm">
      <TouchableOpacity 
        onPress={() => router.back()}
        className="mb-4"
      >
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>
      
      <View className="items-center">
        <Avatar url={profile?.avatar} fallback={profile?.username || '?'} size={80} className="mb-4" />
        <Text className="text-2xl font-bold text-gray-900">{profile?.username || 'Utilisateur'}</Text>
        <Text className="text-gray-500 mt-1">{profile?.country || 'Sélectionnez votre pays'}</Text>
        {profile?.bio && (
          <Text className="text-gray-700 mt-3 text-center px-4 leading-5">{profile.bio}</Text>
        )}
      </View>
      
      <View className="flex-row justify-around mt-6 pt-6 border-t border-gray-100">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">{posts.length}</Text>
          <Text className="text-gray-500 text-sm">Publications</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">{followersCount}</Text>
          <Text className="text-gray-500 text-sm">Abonnés</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">{followingCount}</Text>
          <Text className="text-gray-500 text-sm">Abonnements</Text>
        </View>
      </View>
      
      <View className="flex-row gap-3 mt-6">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-full items-center flex-row justify-center ${isFollowing ? 'bg-gray-100' : 'bg-blue-600'}`}
          onPress={handleToggleFollow}
          disabled={isFollowLoading}
        >
          {isFollowLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? "#374151" : "#fff"} />
          ) : (
            <>
              <Ionicons name={isFollowing ? "checkmark" : "person-add"} size={18} color={isFollowing ? "#374151" : "#fff"} />
              <Text className={`ml-2 font-semibold ${isFollowing ? 'text-gray-700' : 'text-white'}`}>
                {isFollowing ? 'Abonné' : 'S\'abonner'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-1 bg-gray-100 py-3 rounded-full items-center flex-row justify-center"
          onPress={handleMessage}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#374151" />
          <Text className="ml-2 font-semibold text-gray-700">Message</Text>
        </TouchableOpacity>
      </View>
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="person-circle-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-bold text-gray-900 mt-4">Utilisateur introuvable</Text>
          <TouchableOpacity 
            className="mt-6 bg-blue-600 px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold">Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            <Text className="text-gray-500 text-center">Cet utilisateur n'a rien publié.</Text>
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
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
