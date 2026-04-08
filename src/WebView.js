import React, { useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Linking, View, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import PropTypes from 'prop-types';
import {
  isJsonString,
  storeHelper,
  generateScripts,
  getMessage,
  generateSendMessageScript,
  generateSetUserScript,
  generateSetCustomAttributesScript,
  generateSetConversationCustomAttributesScript,
  generateToggleOpenScript,
  generateResetScript,
} from './utils';
const propTypes = {
  websiteToken: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
  cwCookie: PropTypes.string,
  colorScheme: PropTypes.oneOf(['light', 'dark', 'auto']),
  user: PropTypes.shape({
    name: PropTypes.string,
    avatar_url: PropTypes.string,
    email: PropTypes.string,
    identifier_hash: PropTypes.string,
  }),
  locale: PropTypes.string,
  customAttributes: PropTypes.shape({}),
  conversationCustomAttributes: PropTypes.shape({}),
  closeModal: PropTypes.func,
};

const WebViewComponent = forwardRef(
  (
    {
      baseUrl,
      websiteToken,
      cwCookie = '',
      locale = 'en',
      colorScheme = 'light',
      user = {},
      customAttributes = {},
    conversationCustomAttributes = {},
    closeModal,
    isModalVisible,
  },
  ref
) => {
  const nativeWebViewRef = useRef(null);
  const prevIdentifierRef = useRef(user?.identifier);
  const pendingMessagesRef = useRef([]);
  const isWidgetReadyRef = useRef(false);
  const isHistoryProcessedRef = useRef(false);
  const isPollingRef = useRef(false);
  const [currentUrl, setCurrentUrl] = React.useState(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const syncAttemptsRef = useRef(0);

  // Sync refs with state
  React.useEffect(() => {
    isWidgetReadyRef.current = isWidgetReady;
  }, [isWidgetReady]);

  const recursiveFlushMessages = (attempts = 0) => {
    // Stop if no messages or limit reached (15 seconds: 30 * 500ms)
    if (pendingMessagesRef.current.length === 0 || attempts > 30) {
      isPollingRef.current = false;
      return;
    }

    isPollingRef.current = true;

    if (nativeWebViewRef.current && isWidgetReadyRef.current && isHistoryProcessedRef.current) {
      console.log(`DOMIX_RECURSION: Ready after ${attempts} attempts. Flushing ${pendingMessagesRef.current.length} messages.`);
      pendingMessagesRef.current.forEach(message => {
        const script = generateSendMessageScript(message);
        nativeWebViewRef.current.injectJavaScript(script);
      });
      pendingMessagesRef.current = [];
      isPollingRef.current = false;
    } else {
      setTimeout(() => recursiveFlushMessages(attempts + 1), 500);
    }
  };

  useImperativeHandle(ref, () => ({
    sendMessage: (message) => {
      console.log('DOMIX_BRIDGE: sendMessage requested for:', message);
      pendingMessagesRef.current.push(message);
      if (!isPollingRef.current) {
        recursiveFlushMessages();
      }
    },
    setUser: (identifier, userData) => {
      if (nativeWebViewRef.current) {
        const script = generateSetUserScript(identifier, userData);
        nativeWebViewRef.current.injectJavaScript(script);
      }
    },
    setCustomAttributes: (attributes) => {
      if (nativeWebViewRef.current) {
        const script = generateSetCustomAttributesScript(attributes);
        nativeWebViewRef.current.injectJavaScript(script);
      }
    },
    setConversationCustomAttributes: (attributes) => {
      if (nativeWebViewRef.current) {
        const script = generateSetConversationCustomAttributesScript(attributes);
        nativeWebViewRef.current.injectJavaScript(script);
      }
    },
    reset: () => {
      if (nativeWebViewRef.current) {
        // Clear pending messages on manual reset
        pendingMessagesRef.current = [];
        const script = generateResetScript();
        nativeWebViewRef.current.injectJavaScript(script);
        setIsWidgetReady(false);
        syncAttemptsRef.current = 0;
      }
    },
  }));

  // Retry mechanism: Attempt to sync user data every 2s for 10 times max
  // until the widget signals it is ready (isWidgetReady)
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (nativeWebViewRef.current && !isWidgetReady && syncAttemptsRef.current < 10) {
        console.log('DOMIX_SYNC: Sync attempt', syncAttemptsRef.current);
        const userScript = generateSetUserScript(user);
        nativeWebViewRef.current.injectJavaScript(userScript);

        if (customAttributes && Object.keys(customAttributes).length > 0) {
          const customScript = generateSetCustomAttributesScript(customAttributes);
          nativeWebViewRef.current.injectJavaScript(customScript);
        }
        syncAttemptsRef.current += 1;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, isWidgetReady, customAttributes]);

  // Handle user switching by resetting session if identifier changes
  React.useEffect(() => {
    if (user?.identifier !== prevIdentifierRef.current && isWidgetReady && nativeWebViewRef.current) {
      console.log('DOMIX_RESET: Identity changed, resetting session to load correct history');
      
      // Clear pending messages on identity switch
      pendingMessagesRef.current = [];
      isHistoryProcessedRef.current = false;
      
      const resetScript = generateResetScript();
      nativeWebViewRef.current.injectJavaScript(resetScript);
      
      // Re-send user data after a short delay to allow reset to settle
      setTimeout(() => {
        const userScript = generateSetUserScript(user);
        nativeWebViewRef.current.injectJavaScript(userScript);
      }, 500);
      
      prevIdentifierRef.current = user?.identifier;
    }
  }, [user?.identifier, isWidgetReady]);

  React.useEffect(() => {
    if (nativeWebViewRef.current && isWidgetReady) {
      console.log('DOMIX_SYNC: Component ready, setting user');
      const script = generateSetUserScript(user);
      nativeWebViewRef.current.injectJavaScript(script);
      
      // Fallback: If no history event received in 6s, allow messaging to proceed
      setTimeout(() => {
        isHistoryProcessedRef.current = true;
      }, 6000);
    }
  }, [isWidgetReady]);

  // Re-sync on every open to ensure history/data is fresh
  React.useEffect(() => {
    if (isModalVisible && nativeWebViewRef.current && isWidgetReady) {
      console.log('DOMIX_MODAL: Re-syncing on open');
      const script = generateSetUserScript(user);
      nativeWebViewRef.current.injectJavaScript(script);
      
      const openScript = generateToggleOpenScript(true);
      setTimeout(() => {
        nativeWebViewRef.current.injectJavaScript(openScript);
      }, 300);
    }
  }, [isModalVisible, isWidgetReady]);

    React.useEffect(() => {
      if (nativeWebViewRef.current && isWidgetReady) {
        const script = generateSetCustomAttributesScript(customAttributes);
        nativeWebViewRef.current.injectJavaScript(script);
      }
    }, [customAttributes, isWidgetReady]);

    React.useEffect(() => {
      if (nativeWebViewRef.current && isWidgetReady) {
        const script = generateSetConversationCustomAttributesScript(conversationCustomAttributes);
        nativeWebViewRef.current.injectJavaScript(script);
      }
    }, [conversationCustomAttributes, isWidgetReady]);
  let widgetUrl = `${baseUrl}/widget?website_token=${encodeURIComponent(websiteToken)}&locale=${encodeURIComponent(locale)}`;

  if (cwCookie) {
    widgetUrl = `${widgetUrl}&cw_conversation=${encodeURIComponent(cwCookie)}`;
  }
  const injectedJavaScript = generateScripts({
    user,
    locale,
    customAttributes,
    conversationCustomAttributes,
    colorScheme,
  });

  const onShouldStartLoadWithRequest = (request) => {
    const isMessageView = currentUrl && currentUrl.includes('#/messages');
    const isAttachmentUrl = !widgetUrl.includes(request.url);
    // Open the attachments only in the external browser
    const shouldRedirectToBrowser = isMessageView && isAttachmentUrl;
    if (shouldRedirectToBrowser) {
      Linking.openURL(request.url);
      return false;
    }

    return true;
  };

  const handleWebViewNavigationStateChange = (newNavState) => {
    setCurrentUrl(newNavState.url);
  };

  const opacity = useMemo(() => {
    // Only show if widget is ready
    if (loading || !isWidgetReady) {
      return {
        opacity: 0,
      };
    }
    return {
      opacity: 1,
    };
  }, [loading, isWidgetReady]);

  const renderLoadingComponent = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f93ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={Platform.OS === 'web' ? null : nativeWebViewRef}
        source={{
          uri: widgetUrl,
        }}
        onMessage={(event) => {
          const { data } = event.nativeEvent;
          console.log('DOMIX_WIDGET_MESSAGE:', data);
          const message = getMessage(data);
          if (isJsonString(message)) {
            const parsedMessage = JSON.parse(message);
            const { event: eventType, type, data: eventData } = parsedMessage;
            const eventName = eventType || type;
            console.log('DOMIX_EVENT_PARSED:', eventName);
            if (eventName === 'loaded') {
              console.log('DOMIX_STATUS: Widget Loaded successfully');
              const {
                config: { authToken },
              } = parsedMessage;
              storeHelper.storeCookie(authToken);
              setIsWidgetReady(true);
              recursiveFlushMessages();
            }
            if (eventName === 'setAuthCookie') {
              const { widgetAuthToken } = eventData || {};
              if (widgetAuthToken) {
                console.log('DOMIX_STATUS: Received Auth Cookie');
                storeHelper.storeCookie(widgetAuthToken);
              }
            }
            if (eventName === 'setUnreadMode') {
              console.log('DOMIX_STATUS: History Processed (setUnreadMode received)');
              isHistoryProcessedRef.current = true;
            }
            if (eventName === 'close-widget') {
              closeModal();
            }
          }
        }}
        scalesPageToFit
        useWebKit
        sharedCookiesEnabled
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={[styles.WebViewStyle, opacity]}
        injectedJavaScript={injectedJavaScript}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        onLoadStart={() => {
          setLoading(true);
          setIsWidgetReady(false);
        }}
        onLoadProgress={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        scrollEnabled
      />
      {(loading || !isWidgetReady) && renderLoadingComponent()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modal: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  webViewContainer: {
    flex: 1,
  },
  WebViewStyle: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
WebViewComponent.propTypes = propTypes;
export default WebViewComponent;
