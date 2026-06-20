import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export default function LiveTVScreen() {
  const webViewRef = useRef<WebView>(null);

  const injectedJavaScript = `
    const hideElements = () => {
      const selectorsToHide = [
        'header', 
        '.SiteHeader', 
        '#SiteHeader', 
        'footer', 
        '.Bottom-Footer', 
        '.Top-Footer', 
        '.SiteLogo', 
        '.SiteMenu',
        '.MW-Ads', 
        '.mw-adblock', 
        '.Post-ads', 
        '.ad-zone-1', 
        '.mw-cookie-wrapper',
        '[class*="adblock"]',
        '[id*="adblock"]'
      ];
      
      selectorsToHide.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if(el) {
             el.style.setProperty('display', 'none', 'important');
          }
        });
      });
      
      document.body.style.setProperty('padding', '0', 'important');
      document.body.style.setProperty('margin', '0', 'important');
      document.body.style.setProperty('background', 'transparent', 'important');
    };

    hideElements();
    setInterval(hideElements, 1000);
    true;
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://www.aminnasritv.xyz' }}
        style={styles.webview}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  }
});
