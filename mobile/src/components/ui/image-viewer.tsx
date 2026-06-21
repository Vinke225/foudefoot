import React from 'react';
import { Modal, View, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageViewerProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
}

export function ImageViewer({ visible, onClose, imageUrl }: ImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="absolute bottom-16 w-full items-center z-50">
            <TouchableOpacity onPress={onClose} className="bg-gray-800/80 p-4 rounded-full flex-row items-center justify-center shadow-lg border border-white/20">
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: Dimensions.get('window').width, height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
