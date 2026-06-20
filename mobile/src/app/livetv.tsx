import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Modal, SafeAreaView, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';

interface Match {
  id: string;
  team1: string;
  team1Logo: string;
  team2: string;
  team2Logo: string;
  time: string;
  status: string;
  league: string;
  url: string;
}

export default function LiveTVScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [servers, setServers] = useState<{name: string, url: string}[]>([]);
  const [activeServer, setActiveServer] = useState<{name: string, url: string} | null>(null);
  const [loadingServers, setLoadingServers] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://www.aminnasritv.xyz');
      const html = await res.text();
      
      const parsedMatches: Match[] = [];
      const blocks = html.split('<div class="EventBox">');
      
      for (let i = 1; i < blocks.length; i++) {
        const boxHtml = blocks[i];
        
        const urlMatch = boxHtml.match(/<a href="([^"]+)" id="EventLink"/);
        const team1Match = boxHtml.match(/<div class="EventTeam Right">[\s\S]*?<img alt="([^"]+)"[\s\S]*?(?:data-src|src)="([^"]+)"/);
        const team2Match = boxHtml.match(/<div class="EventTeam Left">[\s\S]*?<img alt="([^"]+)"[\s\S]*?(?:data-src|src)="([^"]+)"/);
        const timeMatch = boxHtml.match(/<div id="EventHour">([^<]+)<\/div>/);
        const statusMatch = boxHtml.match(/<div class="EventDate[^"]*">([^<]+)<\/div>/);
        const leagueMatch = boxHtml.match(/<div class="EventLeague">([^<]+)<\/div>/);
        
        if (team1Match && team2Match) {
           parsedMatches.push({
             id: i.toString(),
             url: urlMatch ? urlMatch[1] : '',
             team1: team1Match[1],
             team1Logo: team1Match[2].startsWith('//') ? 'https:' + team1Match[2] : team1Match[2],
             team2: team2Match[1],
             team2Logo: team2Match[2].startsWith('//') ? 'https:' + team2Match[2] : team2Match[2],
             time: timeMatch ? timeMatch[1].trim() : '',
             status: statusMatch ? statusMatch[1].trim() : '',
             league: leagueMatch ? leagueMatch[1].trim() : ''
           });
        }
      }
      setMatches(parsedMatches);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openMatch = async (match: Match) => {
    setSelectedMatch(match);
    setLoadingServers(true);
    try {
      const res = await fetch(match.url);
      const html = await res.text();
      
      const serversFound: {name: string, url: string}[] = [];
      const seen = new Set();
      
      const tabContentRegex = /<div class="tab-content[^"]*" data-src="([^"]+)"(?: id="([^"]+)")?/g;
      let tabMatch;
      while ((tabMatch = tabContentRegex.exec(html)) !== null) {
        let src = tabMatch[1];
        let id = tabMatch[2] || `Serveur ${serversFound.length + 1}`;
        if (src.startsWith('//')) src = 'https:' + src;
        
        if (!src.includes('google') && !src.includes('doubleclick') && !src.includes('facebook') && !seen.has(src)) {
          seen.add(src);
          serversFound.push({
            name: id,
            url: src
          });
        }
      }

      const iframeRegex = /<iframe[^>]+src="([^"]+)"/g;
      let iframeMatch;
      
      while ((iframeMatch = iframeRegex.exec(html)) !== null) {
        let src = iframeMatch[1];
        if (src.startsWith('//')) src = 'https:' + src;
        
        if (!src.includes('google') && !src.includes('doubleclick') && !src.includes('facebook') && !seen.has(src)) {
          seen.add(src);
          serversFound.push({
            name: `Serveur ${serversFound.length + 1}`,
            url: src
          });
        }
      }
      
      if (serversFound.length > 0) {
        setServers(serversFound);
        setActiveServer(serversFound[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServers(false);
    }
  };

  const injectedJavaScript = `
    setInterval(() => {
      document.querySelectorAll('.MW-Ads, .mw-adblock, ins.adsbygoogle, iframe[src*="google"], iframe[src*="doubleclick"], a[href*="bet"], div[style*="z-index: 2147483647"]').forEach(el => el.remove());
    }, 500);
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live TV</Text>
        <Text style={styles.headerSubtitle}>Regardez les matchs en direct</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.emptyText}>Aucun match disponible pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => openMatch(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.leagueText} numberOfLines={1}>{item.league}</Text>
                <View style={[styles.statusBadge, (item.status.toLowerCase().includes('live') || item.time.includes('Live')) && styles.statusBadgeLive]}>
                  <Text style={[styles.statusText, (item.status.toLowerCase().includes('live') || item.time.includes('Live')) && styles.statusTextLive]}>
                    {item.status || item.time}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.teamContainer}>
                  {item.team1Logo ? (
                    <Image source={{ uri: item.team1Logo }} style={styles.logo} resizeMode="contain" />
                  ) : <View style={styles.logoPlaceholder} />}
                  <Text style={styles.teamName} numberOfLines={2}>{item.team1}</Text>
                </View>
                
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                
                <View style={styles.teamContainer}>
                  {item.team2Logo ? (
                    <Image source={{ uri: item.team2Logo }} style={styles.logo} resizeMode="contain" />
                  ) : <View style={styles.logoPlaceholder} />}
                  <Text style={styles.teamName} numberOfLines={2}>{item.team2}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Video Modal */}
      <Modal visible={!!selectedMatch} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedMatch?.team1} vs {selectedMatch?.team2}</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{selectedMatch?.league}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.videoContainer}>
              {loadingServers ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>Recherche des serveurs sécurisés...</Text>
                </View>
              ) : activeServer ? (
                <WebView
                  source={{ uri: activeServer.url }}
                  style={styles.webview}
                  injectedJavaScript={injectedJavaScript}
                  javaScriptEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                />
              ) : (
                <View style={styles.loaderContainer}>
                  <Text style={styles.emptyText}>Aucun serveur vidéo trouvé pour ce match.</Text>
                </View>
              )}
            </View>

            {servers.length > 0 && (
              <View style={styles.serversContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {servers.map((srv, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setActiveServer(srv)}
                      style={[styles.serverButton, activeServer?.url === srv.url && styles.serverButtonActive]}
                    >
                      <Text style={[styles.serverButtonText, activeServer?.url === srv.url && styles.serverButtonTextActive]}>
                        {srv.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#9ca3af',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeLive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statusTextLive: {
    color: '#dc2626',
  },
  cardBody: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 30,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#d1d5db',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  serversContainer: {
    padding: 16,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  serverButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginRight: 8,
  },
  serverButtonActive: {
    backgroundColor: '#2563eb',
  },
  serverButtonText: {
    color: '#d1d5db',
    fontWeight: '600',
  },
  serverButtonTextActive: {
    color: '#fff',
  }
});
