import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PlayerStat = {
  id: number;
  name: string;
  photo: string;
  team: string;
  teamLogo: string;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  rating: string;
  position: string;
};

export default function StatsScreen() {
  const [activeTab, setActiveTab] = useState<"topscorers" | "topassists" | "topyellowcards" | "topredcards">("topscorers");
  const [data, setData] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Direct call to API-SPORTS for mobile to avoid local IP routing issues
      const league = 1;
      const season = 2022;
      const apiUrl = `https://v3.football.api-sports.io/players/${activeTab}?league=${league}&season=${season}`;
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-apisports-key': 'bd7b1d0554f3b75d1ca387069f99abc0',
        }
      });
      
      const json = await res.json();
      
      if (json.response) {
        const players = json.response.map((item: any) => {
          const p = item.player;
          const s = item.statistics[0];
          return {
            id: p.id,
            name: p.name,
            photo: p.photo,
            team: s.team.name,
            teamLogo: s.team.logo,
            goals: s.goals.total || 0,
            assists: s.goals.assists || 0,
            yellowCards: s.cards.yellow || 0,
            redCards: s.cards.red || 0,
            rating: s.games.rating ? parseFloat(s.games.rating).toFixed(1) : '-',
            position: s.games.position
          };
        });
        setData(players);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    switch(activeTab) {
      case "topscorers": return "Buts";
      case "topassists": return "Passes";
      case "topyellowcards": return "Jaunes";
      case "topredcards": return "Rouges";
      default: return "";
    }
  };

  const getMetricValue = (player: PlayerStat) => {
    switch(activeTab) {
      case "topscorers": return player.goals;
      case "topassists": return player.assists;
      case "topyellowcards": return player.yellowCards;
      case "topredcards": return player.redCards;
      default: return "";
    }
  };

  const tabs = [
    { id: "topscorers", label: "Buteurs" },
    { id: "topassists", label: "Passeurs" },
    { id: "topyellowcards", label: "Cartons Jaunes" },
    { id: "topredcards", label: "Cartons Rouges" }
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={24} color="#1E8F45" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Top Joueurs</Text>
            <Text style={styles.headerSubtitle}>Les meilleurs de la compétition</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E8F45" />
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aucune donnée disponible.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, index }) => (
            <View style={styles.playerCard}>
              <View style={styles.rankContainer}>
                <Text style={[
                  styles.rankText,
                  index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : null
                ]}>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.playerInfo}>
                <Image source={{ uri: item.photo }} style={styles.playerPhoto} />
                <View style={styles.playerDetails}>
                  <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.teamInfo}>
                    <Image source={{ uri: item.teamLogo }} style={styles.teamLogo} />
                    <Text style={styles.teamName} numberOfLines={1}>{item.team}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricContainer}>
                <Text style={styles.metricValue}>{getMetricValue(item)}</Text>
                <Text style={styles.metricLabel}>{getMetricLabel()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(30, 143, 69, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabsWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContainer: {
    padding: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1E8F45',
    borderColor: '#1E8F45',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#d1d5db',
  },
  rankGold: {
    color: '#eab308',
  },
  rankSilver: {
    color: '#9ca3af',
  },
  rankBronze: {
    color: '#b45309',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  playerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#f9fafb',
  },
  playerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  teamName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  metricContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E8F45',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
