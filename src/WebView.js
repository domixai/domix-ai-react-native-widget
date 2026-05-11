import React, { useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Linking, View, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import PropTypes from 'prop-types';
import {
  isJsonString,
  storeHelper,
  getMessage,
  generateSendMessageScript,
  generateSetUserScript,
  generateSetCustomAttributesScript,
  generateSetConversationCustomAttributesScript,
  generateSetLocaleScript,
  generateSetColorSchemeScript,
  generateScripts,
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
  onCookieChange: PropTypes.func,
  closeModal: PropTypes.func,
  onEvent: PropTypes.func,
};

const WebViewComponent = forwardRef(
  (
    {
      baseUrl,
      websiteToken,
      cwCookie = '',
      locale = 'en',
      colorScheme = 'light',
      user = null,
      customAttributes = {},
      conversationCustomAttributes = {},
      onCookieChange,
      closeModal,
      onEvent,
    },
    ref,
  ) => {
    const webViewRef = useRef(null);
    const pendingScriptsRef = useRef([]);
    const [currentUrl, setCurrentUrl] = React.useState(null);
    const [loading, setLoading] = useState(true);
    const [widgetReady, setWidgetReady] = useState(false);
    const activeCookieRef = useRef(cwCookie);

    React.useEffect(() => {
      if (cwCookie && !widgetReady) {
        activeCookieRef.current = cwCookie;
      }
    }, [cwCookie, widgetReady]);

    const injectScript = (script) => {
      if (!script) {
        return;
      }

      if (webViewRef.current && widgetReady) {
        webViewRef.current.injectJavaScript(script);
        return;
      }

      pendingScriptsRef.current.push(script);
    };

    useImperativeHandle(ref, () => ({
      sendMessage: (message) => {
        injectScript(generateSendMessageScript(message));
      },
      setUser: (identifier, userData) => {
        injectScript(generateSetUserScript(identifier, userData));
      },
      setCustomAttributes: (attributes) => {
        injectScript(generateSetCustomAttributesScript(attributes));
      },
      setConversationCustomAttributes: (attributes) => {
        injectScript(generateSetConversationCustomAttributesScript(attributes));
      },
    }));


    React.useEffect(() => {
      if (!webViewRef.current || !widgetReady) {
        return;
      }

      const script = generateScripts({
        colorScheme,
        user,
        locale,
        customAttributes,
        conversationCustomAttributes,
      });
      webViewRef.current.injectJavaScript(script);

      if (pendingScriptsRef.current.length > 0) {
        pendingScriptsRef.current.forEach((s) => {
          webViewRef.current.injectJavaScript(s);
        });
        pendingScriptsRef.current = [];
      }
    }, [
      widgetReady,
      colorScheme,
      user,
      locale,
      customAttributes,
      conversationCustomAttributes,
    ]);

    const hasUser = !!(user && Object.keys(user).length);
    let widgetUrl = `${baseUrl}/widget?website_token=${websiteToken}&locale=${locale}`;

    if (hasUser && user?.identifier) {
      widgetUrl = `${widgetUrl}&identifier=${user.identifier}`;
    }
    if (hasUser && user?.identifier_hash) {
      widgetUrl = `${widgetUrl}&identifier_hash=${user.identifier_hash}`;
    }
    if (activeCookieRef.current) {
      widgetUrl = `${widgetUrl}&cw_conversation=${activeCookieRef.current}`;
    }

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
      if (loading) {
        return {
          opacity: 0,
        };
      }
      return {
        opacity: 1,
      };
    }, [loading]);

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
          ref={Platform.OS === 'web' ? null : webViewRef}
          source={{
            uri: widgetUrl,
          }}
          automaticallyAdjustContentInsets={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
          onMessage={(event) => {
            const { data } = event.nativeEvent;
            const message = getMessage(data);
            if (isJsonString(message)) {
              const parsedMessage = JSON.parse(message);
              const { event: eventType, type, data: payloadData } = parsedMessage;
              const eventName = eventType || type;
              if (eventName === 'loaded') {
                const {
                  config: { authToken },
                } = parsedMessage;
                storeHelper.storeCookie(authToken);
                if (onCookieChange) {
                  onCookieChange(authToken);
                }
                setWidgetReady(true);
              }
              if (eventName === 'setAuthCookie') {
                const { widgetAuthToken } = payloadData;
                storeHelper.storeCookie(widgetAuthToken);
                if (onCookieChange) {
                  onCookieChange(widgetAuthToken);
                }
              }
              if (
                eventName === 'close-widget' ||
                eventName === 'closeWindow' ||
                eventName === 'domix:closed'
              ) {
                closeModal();
              }
              if (onEvent) {
                onEvent(eventName, parsedMessage);
              }
            }
          }}
          scalesPageToFit
          useWebKit
          cacheEnabled={false}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={[styles.WebViewStyle, opacity]}
          originWhitelist={['*']}
          mixedContentMode="always"
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          onLoadStart={() => {
            // console.log('[WebView] Load Started');
            setLoading(true);
            setWidgetReady(false);
          }}
          onLoadProgress={(event) => {
            const { progress } = event.nativeEvent;
            // console.log(`[WebView] Loading progress: ${progress * 100}%`);
            if (progress === 1) {
              setLoading(false);
            }
          }}
          onLoadEnd={() => {
            // console.log('[WebView] Load Ended');
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            // console.warn('[WebView] WebView Error: ', nativeEvent);
            setLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            // console.warn('[WebView] HTTP Error: ', nativeEvent);
            setLoading(false);
          }}
          scrollEnabled
        />
        {loading && renderLoadingComponent()}
      </View>
    );
  },
);

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
