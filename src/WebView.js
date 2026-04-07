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
    },
    ref
  ) => {
    const webViewRef = useRef(null);
    const [currentUrl, setCurrentUrl] = React.useState(null);
    const [loading, setLoading] = useState(true);

    useImperativeHandle(ref, () => ({
      sendMessage: message => {
        if (webViewRef.current) {
          const script = generateSendMessageScript(message);
          webViewRef.current.injectJavaScript(script);
        }
      },
      setUser: (identifier, userData) => {
        if (webViewRef.current) {
          const script = generateSetUserScript(identifier, userData);
          webViewRef.current.injectJavaScript(script);
        }
      },
      setCustomAttributes: attributes => {
        if (webViewRef.current) {
          const script = generateSetCustomAttributesScript(attributes);
          webViewRef.current.injectJavaScript(script);
        }
      },
      setConversationCustomAttributes: attributes => {
        if (webViewRef.current) {
          const script = generateSetConversationCustomAttributesScript(attributes);
          webViewRef.current.injectJavaScript(script);
        }
      },
    }));

    React.useEffect(() => {
      if (webViewRef.current && !loading) {
        const script = generateSetUserScript(user);
        webViewRef.current.injectJavaScript(script);
      }
    }, [user, loading]);

    React.useEffect(() => {
      if (webViewRef.current && !loading) {
        const script = generateSetCustomAttributesScript(customAttributes);
        webViewRef.current.injectJavaScript(script);
      }
    }, [customAttributes, loading]);

    React.useEffect(() => {
      if (webViewRef.current && !loading) {
        const script = generateSetConversationCustomAttributesScript(conversationCustomAttributes);
        webViewRef.current.injectJavaScript(script);
      }
    }, [conversationCustomAttributes, loading]);
  let widgetUrl = `${baseUrl}/widget?website_token=${websiteToken}&locale=${locale}`;

  if (user && user.identifier) {
    widgetUrl = `${widgetUrl}&identifier=${user.identifier}`;
  }
  if (user && user.identifier_hash) {
    widgetUrl = `${widgetUrl}&identifier_hash=${user.identifier_hash}`;
  }
  if (cwCookie) {
    widgetUrl = `${widgetUrl}&cw_conversation=${cwCookie}`;
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
        onMessage={(event) => {
          const { data } = event.nativeEvent;
          const message = getMessage(data);
          if (isJsonString(message)) {
            const parsedMessage = JSON.parse(message);
            const { event: eventType, type, data } = parsedMessage;
            const eventName = eventType || type;
            if (eventName === 'loaded') {
              const {
                config: { authToken },
              } = parsedMessage;
              storeHelper.storeCookie(authToken);
            }
            if (eventName === 'setAuthCookie') {
              const { widgetAuthToken } = data;
              storeHelper.storeCookie(widgetAuthToken);
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
        onLoadStart={() => setLoading(true)}
        onLoadProgress={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        scrollEnabled
      />
      {loading && renderLoadingComponent()}
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
