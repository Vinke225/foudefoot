import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase will automatically handle the URL and establish the session.
    // We just need to wait for it and then redirect to the main tabs.
    const checkSession = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('#')) {
          const hashParams = initialUrl.split('#')[1];
          const params = hashParams.split('&').reduce((acc, current) => {
            const [key, value] = current.split('=');
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>);

          const access_token = params['access_token'];
          const refresh_token = params['refresh_token'];

          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      } catch (e) {
        console.error("Error parsing deep link URL", e);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    };
    
    // Give Supabase a tiny bit of time to parse the URL and save the session
    const timeout = setTimeout(checkSession, 500);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E8F45" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
  },
});
