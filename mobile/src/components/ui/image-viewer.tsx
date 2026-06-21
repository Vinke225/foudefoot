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
          <View className="flex-row justify-end p-4 mt-10">
            <TouchableOpacity onPress={onClose} className="bg-gray-800/80 p-2 rounded-full">
              <Ionicons name="close" size={24} color="white" />
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
