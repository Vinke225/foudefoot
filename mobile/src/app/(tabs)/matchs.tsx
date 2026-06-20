import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Match {
  api_id: string;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  score: string | null;
  status: string;
  match_time: string;
  league_name: string;
}

export default function MatchsScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'NS' | 'FT'>('ALL');

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_time', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const renderFilterButton = (title: string, value: 'ALL' | 'LIVE' | 'NS' | 'FT') => {
    const isActive = filter === value;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(value)}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderMatch = (match: Match) => {
    const isLive = match.status === 'LIVE';
    const isFinished = match.status === 'FT';
    
    // Format time if available
    let timeStr = 'Auj.';
    if (match.match_time) {
      const date = new Date(match.match_time);
      if (!isNaN(date.getTime())) {
        timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
    }

    return (
      <TouchableOpacity key={match.api_id} style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.leagueName} numberOfLines={1}>{match.league_name}</Text>
          {isLive && (
            <View style={styles.liveTag}>
              <Text style={styles.liveText}>En direct</Text>
            </View>
          )}
          {isFinished && (
            <Text style={styles.finishedText}>Terminé</Text>
          )}
          {!isLive && !isFinished && (
            <Text style={styles.timeText}>{timeStr}</Text>
          )}
        </View>

        <View style={styles.matchBody}>
          <View style={styles.teamContainer}>
            <Image 
              source={{ uri: match.home_logo || 'https://via.placeholder.com/50' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>{match.home_team}</Text>
          </View>

          <View style={styles.scoreContainer}>
            {match.score ? (
              <Text style={[styles.scoreText, isLive && styles.scoreTextLive]}>
                {match.score.replace('-', ' - ')}
              </Text>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>

          <View style={styles.teamContainer}>
            <Image 
              source={{ uri: match.away_logo || 'https://via.placeholder.com/50' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>{match.away_team}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matchs du jour</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
          {renderFilterButton('Tous', 'ALL')}
          {renderFilterButton('En direct', 'LIVE')}
          {renderFilterButton('À venir', 'NS')}
          {renderFilterButton('Terminés', 'FT')}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
        >
          {filteredMatches.length > 0 ? (
            filteredMatches.map(renderMatch)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="football-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Aucun match trouvé pour ce filtre aujourd'hui.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leagueName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 8,
  },
  liveTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  finishedText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
  },
  matchBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 2,
  },
  scoreTextLive: {
    color: '#EF4444',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
