import { View, Text, StyleSheet } from 'react-native';

export default function CompetitionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coupes & Compétitions</Text>
      <Text>Découvrez toutes les compétitions ici.</Text>
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
    marginBottom: 10,
  },
});
