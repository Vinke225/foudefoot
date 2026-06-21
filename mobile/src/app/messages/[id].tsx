import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image, Keyboard, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Avatar } from '../../components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import EmojiPicker from 'rn-emoji-keyboard';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function PrivateChatScreen() {
  const { id } = useLocalSearchParams();
  const conversationId = id as string;
  const router = useRouter();
  const { session } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageExt, setImageExt] = useState<string | null>(null);
  
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!session?.user || !conversationId) return;

    fetchConversationDetails();
    fetchMessages();

    // Mark all as read initially
    markMessagesAsRead();

    // Set up Realtime subscriptions
    const channel = supabase.channel(`private_chat_${conversationId}`, {
      config: {
        broadcast: { ack: false },
      },
    });

    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            // Add at the beginning because inverted FlatList
            return [newMsg, ...prev];
          });
          
          if (newMsg.sender_id !== session.user.id) {
            markMessagesAsRead();
          }
        }
      )
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.payload.userId !== session.user.id) {
            setOtherUserTyping(payload.payload.isTyping);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, session?.user]);

  const fetchConversationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          user1:users!conversations_user1_id_fkey(id, username, avatar),
          user2:users!conversations_user2_id_fkey(id, username, avatar)
        `)
        .eq('id', conversationId)
        .single();
        
      if (error) throw error;
      
      const u1 = Array.isArray(data.user1) ? data.user1[0] : data.user1;
      const u2 = Array.isArray(data.user2) ? data.user2[0] : data.user2;
      
      const other = u1.id === session?.user?.id ? u2 : u1;
      setOtherUser(other);
    } catch (err) {
      console.log('Error fetching conversation', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }); // descending for inverted FlatList
        
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.log('Error fetching messages', err);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', session?.user?.id)
      .eq('is_read', false);
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (!isTyping) {
      setIsTyping(true);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping: true, userId: session?.user?.id },
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping: false, userId: session?.user?.id },
      });
    }, 2000);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Supports GIFs too
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 || null);
      
      const uriParts = asset.uri.split('.');
      const ext = uriParts[uriParts.length - 1].toLowerCase();
      setImageExt(ext === 'gif' ? 'gif' : 'jpg');
      setShowEmojiPicker(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !imageUri) || isSending || !session?.user) return;
    
    setIsSending(true);
    let mediaUrl = null;

    if (imageUri && imageBase64 && imageExt) {
      const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${imageExt}`;
      const contentType = imageExt === 'gif' ? 'image/gif' : 'image/jpeg';
      
      const { error: uploadError } = await supabase.storage
        .from('private_media')
        .upload(fileName, decode(imageBase64), { contentType });

      if (uploadError) {
        Alert.alert('Erreur', "Impossible d'envoyer l'image.");
        setIsSending(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('private_media')
        .getPublicUrl(fileName);
        
      mediaUrl = publicUrl;
    }

    const msgText = newMessage.trim() || null;
    setNewMessage('');
    setImageUri(null);
    setImageBase64(null);
    setShowEmojiPicker(false);

    // Stop typing indicator instantly
    if (isTyping) {
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { isTyping: false, userId: session?.user?.id },
      });
    }

    const { data: insertedMsg, error } = await supabase.from('private_messages').insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      message: msgText,
      media_url: mediaUrl,
      is_read: false
    }).select().single();

    if (error) {
      Alert.alert('Erreur', "Le message n'a pas pu être envoyé.");
      setIsSending(false);
      return;
    }

    if (insertedMsg && otherUser) {
      // Send notification to the other user
      const currentUserProfile = (await supabase.from('users').select('username').eq('id', session.user.id).single()).data;
      
      await supabase.from('notifications').insert({
        user_id: otherUser.id,
        type: 'message',
        content: `Nouveau message de ${currentUserProfile?.username || "Quelqu'un"}`,
        link: `/messages/${conversationId}`
      });
      
      // Update the updated_at timestamp of the conversation
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    }

    setIsSending(false);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === session?.user?.id;
    
    return (
      <View className={`flex w-full mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[75%] p-3 ${isMe ? 'bg-primary text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-sm'}`}>
          {item.media_url && (
            <Image 
              source={{ uri: item.media_url }} 
              style={{ width: 200, height: 200, borderRadius: 12, marginBottom: item.message ? 8 : 0, backgroundColor: '#f3f4f6' }}
              resizeMode="cover"
            />
          )}
          {item.message && (
            <Text className={`text-[15px] ${isMe ? 'text-white' : 'text-gray-900'}`}>{item.message}</Text>
          )}
        </View>
        <Text className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isMe && item.is_read ? ' • Lu' : ''}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        {otherUser ? (
          <>
            <Avatar url={otherUser.avatar} fallback={otherUser.username || '?'} size={40} />
            <Text className="text-[16px] font-bold text-gray-900 ml-3 flex-1" numberOfLines={1}>{otherUser.username}</Text>
          </>
        ) : (
          <View className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        )}
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1E8F45" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              otherUserTyping ? (
                <View className="items-start mb-3">
                  <View className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-sm flex-row items-center">
                    <ActivityIndicator size="small" color="#9CA3AF" />
                    <Text className="text-gray-500 text-xs ml-2 italic">écrit...</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input Area */}
        <View className="bg-white border-t border-gray-100 p-2">
          {imageUri && (
            <View className="relative w-24 h-24 ml-2 mb-2 rounded-xl overflow-hidden border border-gray-200">
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
              <TouchableOpacity 
                className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
                onPress={() => { setImageUri(null); setImageBase64(null); }}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-end px-2 py-1">
            <View className="flex-row items-center bg-gray-100 rounded-3xl flex-1 px-1 min-h-[44px]">
              <TouchableOpacity 
                className="p-2"
                onPress={pickImage}
                disabled={isSending}
              >
                <Ionicons name="image-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="p-2"
                onPress={() => {
                  Keyboard.dismiss();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                disabled={isSending}
              >
                <Ionicons name={showEmojiPicker ? "happy" : "happy-outline"} size={24} color={showEmojiPicker ? "#1E8F45" : "#6B7280"} />
              </TouchableOpacity>

              <TextInput
                className="flex-1 text-[15px] max-h-24 px-1 py-2 text-gray-900"
                placeholder="Message..."
                value={newMessage}
                onChangeText={handleTyping}
                multiline
                onFocus={() => setShowEmojiPicker(false)}
                editable={!isSending}
              />
            </View>

            <TouchableOpacity 
              className={`ml-2 w-11 h-11 rounded-full items-center justify-center ${(!newMessage.trim() && !imageUri) || isSending ? 'bg-gray-200' : 'bg-primary'}`}
              onPress={handleSendMessage}
              disabled={(!newMessage.trim() && !imageUri) || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={18} color={(!newMessage.trim() && !imageUri) ? '#9CA3AF' : 'white'} style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <EmojiPicker 
          onEmojiSelected={(emojiObject) => {
            setNewMessage(prev => prev + emojiObject.emoji);
          }} 
          open={showEmojiPicker} 
          onClose={() => setShowEmojiPicker(false)} 
        />
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    justifyContent: 'flex-end',
  }
});
