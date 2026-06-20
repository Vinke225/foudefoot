import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default function LiveTVScreen() {
  const openBrowser = async () => {
    await WebBrowser.openBrowserAsync('https://www.aminnasritv.xyz');
  };

  useEffect(() => {
    openBrowser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live TV</Text>
      <Text style={styles.subtitle}>Redirection en cours...</Text>
      <Pressable onPress={openBrowser} style={styles.button}>
        <Text style={styles.buttonText}>Ouvrir Live TV</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
