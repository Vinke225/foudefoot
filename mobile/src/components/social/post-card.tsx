import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Avatar } from '../ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { CommentsModal } from './comments-modal';
import { PostOptionsModal } from './post-options-modal';
import { LikesModal } from './likes-modal';
import { ImageViewer } from '../ui/image-viewer';
import { EditPostModal } from './edit-post-modal';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onLikeChange?: (postId: string, delta: number, hasLiked: boolean) => void;
  onPostDeleted?: (postId: string) => void;
}

const EMOJIS = [
  { type: 'like', icon: '👍' },
  { type: 'love', icon: '❤️' },
  { type: 'haha', icon: '😂' },
  { type: 'sad', icon: '😢' },
  { type: 'angry', icon: '😡' }
];

export function PostCard({ post, currentUserId, onLikeChange, onPostDeleted }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [hasLiked, setHasLiked] = useState(
    post.likes?.some((l: any) => l.user_id === currentUserId) || false
  );
  const [isLiking, setIsLiking] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  
  // Modals state
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);

  // Latest comment preview
  const initialLatest = post.comments && post.comments.length > 0 
    ? post.comments[0] // Assuming the API returns the most recent first, or just the first one
    : null;
  const [latestCommentState, setLatestCommentState] = useState<any>(initialLatest);

  // Realtime subscription for Comments on Feed
  React.useEffect(() => {
    const channelName = `comments_feed_${post.id}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` },
        async (payload) => {
          // Increment count
          if (payload.new.user_id !== currentUserId) {
            setCommentsCount((prev: number) => prev + 1);
          }
          // Fetch user info for the new comment to display it
          const { data } = await supabase.from('users').select('username').eq('id', payload.new.user_id).single();
          if (data) {
            setLatestCommentState({ ...payload.new, users: data });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, currentUserId]);

  // Realtime subscription for Likes
  React.useEffect(() => {
    const channelName = `likes_${post.id}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'likes', filter: `post_id=eq.${post.id}` },
        (payload) => {
          if (payload.new.user_id !== currentUserId) {
            setLikesCount((prev: number) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'likes', filter: `post_id=eq.${post.id}` },
        (payload) => {
          if (payload.old.user_id !== currentUserId) {
            setLikesCount((prev: number) => prev - 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, currentUserId]);

  const handleLike = async (reactionType = 'like') => {
    if (!currentUserId || isLiking) return;
    
    setIsLiking(true);
    setShowEmojiPicker(false);
    
    const newHasLiked = !hasLiked;
    const delta = newHasLiked ? 1 : -1;
    
    // Optimistic UI update
    setHasLiked(newHasLiked);
    setLikesCount((prev: number) => prev + delta);
    if (onLikeChange) onLikeChange(post.id, delta, newHasLiked);

    try {
      if (newHasLiked) {
        await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId, reaction_type: reactionType });
      } else {
        await supabase.from('likes').delete().match({ post_id: post.id, user_id: currentUserId });
      }
    } catch (error) {
      // Revert on error
      setHasLiked(!newHasLiked);
      setLikesCount((prev: number) => prev - delta);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <View className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-4 relative">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => {
            if (post.user_id === currentUserId) {
              router.push('/(tabs)/profil');
            } else {
              router.push(`/user/${post.user_id}`);
            }
          }}>
            <Avatar url={post.users?.avatar} fallback={post.users?.username || '?'} size={40} />
          </TouchableOpacity>
          <View className="ml-3">
            <View className="flex-row items-center">
              <Text className="font-bold text-[15px] text-black">{post.users?.username}</Text>
              {post.users?.country && (
                <View className="bg-gray-100 px-1.5 py-0.5 rounded-sm ml-2">
                  <Text className="text-[10px] text-gray-600">{post.users.country}</Text>
                </View>
              )}
            </View>
            <Text className="text-[12px] text-gray-400 mt-0.5">
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <Text className="text-[15px] mb-3 text-gray-800 leading-6">
        {caption}
      </Text>
      
      {post.media_url && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowImageViewer(true)}>
          <Image 
            source={{ uri: post.media_url }} 
            style={{ width: '100%', aspectRatio: 4/5, maxHeight: 450 }}
            className="rounded-xl mb-3 bg-gray-100"
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Aperçu des likes */}
      {likesCount > 0 && post.likes && post.likes[0] && (
        <TouchableOpacity onPress={() => setShowLikes(true)} className="mb-2 px-1">
          <Text className="text-[13px] text-gray-700">
            Aimé par <Text className="font-bold">{post.likes[0].users?.username}</Text>
            {likesCount > 1 ? <Text> et <Text className="font-bold">{likesCount - 1} autres</Text></Text> : ''}
          </Text>
        </TouchableOpacity>
      )}

      <View className="flex-row items-center justify-between border-t border-gray-50 pt-3 relative">
        <View className={`flex-row items-center bg-gray-50 rounded-full ${hasLiked ? 'bg-red-50' : ''}`}>
          <TouchableOpacity 
            className="px-3 py-2"
            onPress={() => handleLike('like')}
            onLongPress={() => setShowEmojiPicker(true)}
            delayLongPress={300}
          >
            <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={20} color={hasLiked ? "#EF4444" : "#4B5563"} />
          </TouchableOpacity>
          <TouchableOpacity 
            className="pr-4 py-2"
            onPress={() => setShowLikes(true)}
          >
            <Text className={`font-medium ${hasLiked ? 'text-red-500' : 'text-gray-600'}`}>
              {likesCount}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full"
          onPress={() => setShowComments(true)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#4B5563" />
          <Text className="ml-2 font-medium text-gray-600">
            {commentsCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full">
          <Ionicons name="share-outline" size={20} color="#4B5563" />
        </TouchableOpacity>
        
        {/* Emoji Picker Overlay */}
        {showEmojiPicker && (
          <View className="absolute bottom-12 left-0 bg-white rounded-full flex-row px-2 py-1 shadow-lg border border-gray-100 z-50">
            {EMOJIS.map(emoji => (
              <TouchableOpacity key={emoji.type} onPress={() => handleLike(emoji.type)} className="p-2">
                <Text style={{ fontSize: 24 }}>{emoji.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Aperçu du dernier commentaire */}
      {commentsCount > 0 && (
        <View className="mt-3 px-1">
          {commentsCount > 1 && (
            <TouchableOpacity onPress={() => setShowComments(true)}>
              <Text className="text-gray-400 text-[13px] mb-1">
                Voir les {commentsCount} commentaires
              </Text>
            </TouchableOpacity>
          )}
          {latestCommentState && latestCommentState.users && (
            <View className="flex-row items-center">
              <Text className="text-[13px] text-gray-800" numberOfLines={2}>
                <Text className="font-bold">{latestCommentState.users.username} </Text>
                {latestCommentState.content}
              </Text>
            </View>
          )}
        </View>
      )}

      <CommentsModal 
        visible={showComments} 
        onClose={() => setShowComments(false)} 
        postId={post.id} 
        currentUserId={currentUserId!} 
        onCommentAdded={() => setCommentsCount((c: number) => c + 1)}
      />

      <LikesModal
        visible={showLikes}
        onClose={() => setShowLikes(false)}
        postId={post.id}
      />

      <ImageViewer
        visible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageUrl={post.media_url}
      />

      <EditPostModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        postId={post.id}
        initialCaption={caption}
        onPostEdited={(newCaption) => setCaption(newCaption)}
      />

      <PostOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        postId={post.id}
        isOwner={post.user_id === currentUserId}
        onEditPress={() => setShowEditModal(true)}
        onPostDeleted={(id) => {
          if (onPostDeleted) onPostDeleted(id);
        }}
      />
    </View>
  );
}
