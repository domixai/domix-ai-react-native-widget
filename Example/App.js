import React, { useEffect, useRef, useState } from 'react';
import DomixAIWidget from 'domix-ai-react-native-widget';

import { SafeAreaView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  const widgetRef = useRef(null);
  const [showWidget, setShowWidget] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [skipWelcomeScreen, setSkipWelcomeScreen] = useState(false);

  const toggleWidget = (visible) => {
    if (!visible) setSkipWelcomeScreen(false);
    setShowWidget(visible);
  };
  const [user, setUser] = useState({
      identifier: 123,
      name: 'Test',
      email: 'test@domix.ai',
      phone_number: '',
      identifier_hash: '',
      description: '',
  });

  //   const [user, setUser] = useState({
  //     identifier: 8596,
  //     name: "Shymaa Mohmed",
  //     email: "shymaa.mohmed91@gmail.com",
  //     phone_number: "+201069541592",
  //     identifier_hash: "a00e308dc2110027877a325008978c9dc79ff4d0d46e64148e249623e2defe04",
  //     description: 'customer',
  // });

  const customAttributes = {
    accountId: 1,
    pricingPlan: 'paid',
    status: 'active',
  };
  const conversationCustomAttributes = {
    orderId: 1,
    status: 'pending',
  };
  const websiteToken = '';
  const baseUrl = 'https://chat.domix.ai';
  const [locale, setLocale] = useState('en');

  const hasSentPending = useRef(false);

  useEffect(() => {
    if (!showWidget || !pendingMessage || !widgetRef.current || hasSentPending.current) {
      return;
    }

    hasSentPending.current = true;
    widgetRef.current.sendMessage(pendingMessage);
    setPendingMessage('');
    // Reset the ref after a delay or when pendingMessage is cleared
    setTimeout(() => {
      hasSentPending.current = false;
    }, 1000);
  }, [showWidget, pendingMessage]);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              setSkipWelcomeScreen(false);
              toggleWidget(true);
            }}
          >
            <Text style={styles.buttonText}>Open Domix AI Widget</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: '#4CAF50' }]}
            onPress={() => {
              if (showWidget && widgetRef.current) {
                widgetRef.current.sendMessage('Hello! This is a test message.');
                return;
              }

              setSkipWelcomeScreen(true);
              setPendingMessage('Hello! This is a test message.');
              toggleWidget(true);
            }}>
            <Text style={styles.buttonText}>Send Test Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: '#f44336' }]}
            onPress={() => {
              if (widgetRef.current) {
                widgetRef.current.reset();
              }
              setUser(null);
              setPendingMessage('');
              toggleWidget(false);
            }}>
            <Text style={styles.buttonText}>Reset Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: '#9C27B0' }]}
            onPress={() => {
              const nextUser = {
                identifier: 124,
                name: 'test 2',
                email: 'test2@domix.ai',
                phone_number: '',
                identifier_hash: '',
                description: '',
              };

              setUser(nextUser);
              if (widgetRef.current) {
                widgetRef.current.setUser(nextUser.identifier, nextUser);
              }
            }}>
            <Text style={styles.buttonText}>Support Set User</Text>
          </TouchableOpacity>
        </View>
        <DomixAIWidget
          ref={widgetRef}
          websiteToken={websiteToken}
          skipWelcome={skipWelcomeScreen}
          locale={locale}
          baseUrl={baseUrl}
          colorScheme="light"
          closeModal={() => toggleWidget(false)}
          isModalVisible={showWidget}
          user={user}
          customAttributes={customAttributes}
          conversationCustomAttributes={conversationCustomAttributes}
        />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    flex: 1,
    paddingVertical: 32,
  },

  button: {
    height: 48,
    marginTop: 32,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#1F93FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    paddingLeft: 10,
    fontWeight: '600',
    fontSize: 16,
    paddingRight: 10,
  },
  label: {
    marginTop: 16,
  },
  input: {
    height: 40,
    width: 300,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 8,
    fontWeight: '600',
    fontSize: 16,
    color: 'gray',
  },
});

export default App;
