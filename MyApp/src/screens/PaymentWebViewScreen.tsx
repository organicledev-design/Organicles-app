  import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type RouteParams = {
  PaymentWebView: {
    checkoutUrl: string;
    orderId: string;
  };
};

const PaymentWebViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'PaymentWebView'>>();
  const { checkoutUrl, orderId } = route.params;

  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNavigationChange = (navState: any) => {
    const { url } = navState;
    setCanGoBack(navState.canGoBack);

    // ── Detect success ───────────────────────────────────────
    if (url.includes('/callback/success') || url.includes('status=success')) {
      navigation.replace('OrderSuccess', { orderId });
      return;
    }

    // ── Detect error ─────────────────────────────────────────
    if (url.includes('/callback/error') || url.includes('status=error')) {
      Alert.alert(
        'Payment Failed',
        'Your payment could not be processed. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // ── Detect pending ───────────────────────────────────────
    if (url.includes('/callback/pending') || url.includes('status=pending')) {
      Alert.alert(
        'Payment Pending',
        'Your payment is being processed. We will notify you shortly.',
        [{ text: 'OK', onPress: () => navigation.replace('OrderSuccess', { orderId }) }]
      );
      return;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Cancel Payment',
              'Are you sure you want to cancel the payment?',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => navigation.goBack() },
              ]
            );
          }}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Secure Payment</Text>

        <View style={styles.secureIcon}>
          <Text style={styles.secureText}>🔒</Text>
        </View>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          Alert.alert(
            'Connection Error',
            'Unable to load payment page. Please check your internet connection.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={styles.webView}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  secureIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secureText: {
    fontSize: 20,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default PaymentWebViewScreen;