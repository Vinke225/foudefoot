import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

// To support Google OAuth we need to complete the auth session
WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEula, setShowEula] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);

  const router = useRouter();

  async function signUpWithEmail() {
    if (!eulaAccepted) {
      setShowEula(true);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          eula_accepted: true,
          eula_accepted_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Succès', 'Votre compte a été créé. Vous pouvez vous connecter.');
      router.replace('/(auth)/login');
    }
    setLoading(false);
  }



  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={showEula} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Conditions d'Utilisation</Text>
            
            <ScrollView style={styles.rulesContainer}>
              <Text style={styles.ruleText}>Pour rejoindre Fou de Foot, vous devez accepter les règles suivantes :</Text>
              <Text style={styles.ruleItem}>• Je certifie avoir 18 ans et plus.</Text>
              <Text style={styles.ruleItem}>• Je m'engage à ne publier aucun contenu à caractère sexuel ou pornographique.</Text>
              <Text style={styles.ruleItem}>• Je m'engage à ne publier aucun contenu raciste, haineux ou insultant.</Text>
              <Text style={styles.ruleItem}>• Je comprends que les administrateurs se réservent le droit de bannir tout utilisateur ne respectant pas ces règles.</Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setEulaAccepted(!eulaAccepted)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, eulaAccepted && styles.checkboxChecked]}>
                {eulaAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                J'accepte ces conditions et je comprends qu'en cas de non-respect, mon compte sera suspendu.
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => { setShowEula(false); setEulaAccepted(false); }}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirmButton, !eulaAccepted && styles.modalConfirmButtonDisabled]} 
                onPress={() => {
                  setShowEula(false);
                  signUpWithEmail();
                }}
                disabled={!eulaAccepted}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <View style={styles.ballContainer}>
              <View style={styles.glow} />
              <View style={styles.ball}>
                <Text style={styles.ballEmoji}>⚽</Text>
              </View>
            </View>
            
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoFouDe}>FOU DE</Text>
              <Text style={styles.logoFoot}>FOOT</Text>
              <Text style={styles.subtitle}>Le réseau social des émotions football.</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Créer un compte</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pseudo</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => setUsername(text)}
                value={username}
                placeholder="Mamadou_225"
                placeholderTextColor="#6b7280"
                autoCapitalize={'none'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => setEmail(text)}
                value={email}
                placeholder="fan@football.com"
                placeholderTextColor="#6b7280"
                autoCapitalize={'none'}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  onChangeText={(text) => setPassword(text)}
                  value={password}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  autoCapitalize={'none'}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.backButton}>
                  <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
              </Link>
              
              <TouchableOpacity style={styles.submitButton} onPress={() => signUpWithEmail()} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Valider</Text>}
              </TouchableOpacity>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Dark background matching the web app
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ballContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(30,143,69,0.3)',
    borderRadius: 50,
    transform: [{ scale: 1.5 }],
  },
  ball: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E8F45',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  ballEmoji: {
    fontSize: 50,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoFouDe: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#fff',
    lineHeight: 52,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logoFoot: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#1E8F45',
    lineHeight: 52,
    textShadowColor: 'rgba(30,143,69,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  formTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#1E8F45',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E8F45',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111113',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  rulesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    maxHeight: 350,
    marginBottom: 20,
  },
  ruleText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ruleItem: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1E8F45',
    borderColor: '#1E8F45',
  },
  checkboxLabel: {
    color: '#d1d5db',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#1E8F45',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
