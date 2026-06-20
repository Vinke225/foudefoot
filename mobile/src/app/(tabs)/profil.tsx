import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';

export default function ProfilScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>
      <Button title="Se déconnecter" onPress={signOut} color="#dc2626" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
