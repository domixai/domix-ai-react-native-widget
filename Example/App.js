import React, { useEffect, useRef, useState } from 'react';
import DomixAIWidget from 'domix-ai-react-native-widget';

import { SafeAreaView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';

const App = () => {
  const widgetRef = useRef(null);
  const [showWidget, toggleWidget] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [user, setUser] = useState({
    identifier: 8596,
    name: 'test 1',
    email: 'test1@domix.ai',
    phone_number: '',
    identifier_hash: '',
    description: 'customer',
  });

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

  useEffect(() => {
    if (!showWidget || !pendingMessage || !widgetRef.current) {
      return;
    }

    widgetRef.current.sendMessage(pendingMessage);
    setPendingMessage('');
  }, [showWidget, pendingMessage]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <TouchableOpacity style={styles.button} onPress={() => toggleWidget(true)}>
          <Text style={styles.buttonText}>Open Domix AI Widget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#4CAF50' }]}
          onPress={() => {
            if (showWidget && widgetRef.current) {
              widgetRef.current.sendMessage('Hello! This is a test message.');
              return;
            }

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
            setPendingMessage('');
            toggleWidget(false);
          }}>
          <Text style={styles.buttonText}>Reset Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#9C27B0' }]}
          onPress={() => {
            const nextUser = {
              identifier: 81058,
              name: 'Test 2',
              email: 'test@domix.ai',
              phone_number: '',
              identifier_hash: '',
              description: 'customer',
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
        locale={locale}
        baseUrl={baseUrl}
        colorScheme="light"
        closeModal={() => toggleWidget(false)}
        isModalVisible={showWidget}
        user={user}
        customAttributes={customAttributes}
        conversationCustomAttributes={conversationCustomAttributes}
      />
    </SafeAreaView>
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
