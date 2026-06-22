import React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { session } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onClose();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold">Paramètres</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-4 pt-6">
          <View className="bg-white rounded-2xl overflow-hidden border border-gray-200">
            
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
                <Text className="text-lg font-medium text-gray-900 ml-3">Confidentialité et sécurité</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={24} color="#374151" />
                <Text className="text-lg font-medium text-gray-900 ml-3">Conditions d'utilisation</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="information-circle-outline" size={24} color="#374151" />
                <Text className="text-lg font-medium text-gray-900 ml-3">À propos</Text>
              </View>
              <Text className="text-gray-400">v1.0.0</Text>
            </TouchableOpacity>

          </View>

          <View className="mt-8 bg-white rounded-2xl overflow-hidden border border-red-100">
            <TouchableOpacity 
              className="flex-row items-center justify-center p-4"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              <Text className="text-lg font-bold text-red-500 ml-3">Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>
    </Modal>
  );
}
