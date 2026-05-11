/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import * as RN from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDomix } from '../DomixProvider';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PreChatForm from './PreChatForm';
import WelcomeScreen from './WelcomeScreen';
import ActionCableConnector from '../ActionCableConnector';
import DomixClient from '../DomixClient';

// Destructure from RN
const { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Text, 
  KeyboardAvoidingView, 
  Platform 
} = RN;

const ChatWidget = ({ isVisible, onClose, skipWelcome: propSkipWelcome }) => {
  const insets = useSafeAreaInsets();
  const { config, loading, messages, user, isClientReady, error, baseUrl } = useDomix();
  const [screen, setScreen] = useState('welcome'); // welcome, pre_chat, chat
  const hasAutoNavigated = useRef(false);

  useEffect(() => {
    if (isVisible && isClientReady) {
      DomixClient.updateLastSeen();
      ActionCableConnector.updatePresence();
    }
  }, [isVisible, isClientReady]);

  // Sync initial screen state with messages and config
  useEffect(() => {
    if (loading || !isClientReady || hasAutoNavigated.current) return;

    const skipWelcome = propSkipWelcome ?? config?.skip_welcome_screen;
    const preChatEnabled = config?.pre_chat_form_enabled;
    const isUserIdentified = user?.email || user?.name;

    if (skipWelcome) {
      hasAutoNavigated.current = true;
      if (preChatEnabled && !isUserIdentified) {
        setScreen('pre_chat');
      } else {
        setScreen('chat');
      }
    }
  }, [isClientReady, loading, config?.skip_welcome_screen, propSkipWelcome, user]);

  const handleStartChat = () => {
    const preChatEnabled = config?.pre_chat_form_enabled;
    const isUserIdentified = user?.email || user?.name;

    if (preChatEnabled && !isUserIdentified) {
      setScreen('pre_chat');
    } else {
      setScreen('chat');
    }
  };

  const handleBack = () => {
    // eslint-disable-next-line no-console
    console.log('Domix SDK: Back to welcome');
    setScreen('welcome');
  };

  const renderChat = () => {
    const getImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const chatContent = (
      <View style={styles.flex}>
        <MessageList />
        <MessageInput />
        {!config?.disable_branding && (
          <RN.TouchableOpacity 
            style={styles.brandingContainerSmall} 
            onPress={() => {
              let url = config?.global_config?.WIDGET_BRAND_URL;
              if (url) {
                if (!url.startsWith('http')) url = 'https://' + url;
                RN.Linking.openURL(url);
              }
            }}
          >
            <RN.Text style={styles.poweredByTextSmall}>Powered by</RN.Text>
            <RN.View style={styles.brandInfoSmall}>
              {config?.global_config?.LOGO_THUMBNAIL && (
                <RN.Image 
                  source={{ uri: getImageUrl(config.global_config.LOGO_THUMBNAIL) }} 
                  style={styles.brandLogoExtraSmall} 
                />
              )}
              <RN.Text style={styles.brandNameTextSmall}>
                {config?.global_config?.BRAND_NAME || 'Domix.ai'}
              </RN.Text>
            </RN.View>
          </RN.TouchableOpacity>
        )}
      </View>
    );

    // Only use KeyboardAvoidingView on iOS to avoid Android ReferenceErrors
    // and rely on Android's native windowSoftInputMode.
    if (Platform.OS === 'ios' && KeyboardAvoidingView) {
      return (
        <KeyboardAvoidingView 
          behavior="padding"
          style={styles.flex}
          keyboardVerticalOffset={90}
        >
          {chatContent}
        </KeyboardAvoidingView>
      );
    }

    return chatContent;
  };

  const renderContent = () => {
    if (loading && !isClientReady) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={config?.widget_color || '#1F93FF'} />
        </View>
      );
    }

    if (error && !isClientReady) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => RN.DevSettings?.reload()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (screen) {
      case 'welcome':
        return <WelcomeScreen onStartChat={handleStartChat} onClose={onClose} />;
      
      case 'pre_chat':
        return <PreChatForm onComplete={() => setScreen('chat')} />;
      
      case 'chat':
        return renderChat();
      
      default:
        return null;
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingBottom: insets.bottom 
      }
    ]}>
      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={config?.widget_color || '#00CE7C'} />
        </View>
      ) : (
        <>
          <ChatHeader 
            onClose={onClose} 
            view={screen === 'welcome' ? 'home' : 'chat'} 
            onBack={handleBack}
            showBack={screen !== 'welcome' && !(propSkipWelcome ?? config?.skip_welcome_screen)}
          />
          <View style={styles.flex}>
            {renderContent()}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  brandingContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  brandInfoSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  brandLogoExtraSmall: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  poweredByTextSmall: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  brandNameTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default ChatWidget;
