import React from 'react';
import { View, Image, Text } from 'react-native';

interface AvatarProps {
  url?: string | null;
  fallback?: string;
  size?: number;
  className?: string;
}

export function Avatar({ url, fallback = '?', size = 44, className = '' }: AvatarProps) {
  return (
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
  );
}
