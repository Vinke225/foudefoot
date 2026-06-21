import React from 'react';
import { View, Image, Text } from 'react-native';
import { usePresence } from '../../providers/PresenceProvider';

interface AvatarProps {
  url?: string | null;
  fallback?: string;
  size?: number;
  className?: string;
  userId?: string;
}

export function Avatar({ url, fallback = '?', size = 44, className = '', userId }: AvatarProps) {
  const { onlineUsers } = usePresence();
  const isOnline = userId ? onlineUsers.has(userId) : false;
  return (
    <View className="relative">
      <View 
        style={{ width: size, height: size, borderRadius: size / 2 }} 
        className={`bg-gray-200 overflow-hidden items-center justify-center border border-gray-100 ${className}`}
      >
        {url ? (
          <Image 
            source={{ uri: url }} 
            style={{ width: size, height: size }} 
            resizeMode="cover"
          />
        ) : (
          <Text className="text-gray-500 font-bold" style={{ fontSize: size * 0.4 }}>
            {fallback.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      {isOnline && (
        <View 
          className="absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white"
          style={{ width: size * 0.3, height: size * 0.3, maxWidth: 14, maxHeight: 14 }}
        />
      )}
    </View>
  );
}
