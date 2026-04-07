import React, {useState, useRef} from 'react';
import DomixAIWidget from 'domix-ai-react-native-widget';

import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

const App = () => {
  const widgetRef = useRef(null);
  const [showWidget, toggleWidget] = useState(false);
  const [user, setUser] = useState({
    identifier: 8596,
    name: "Shymaa Mohmed",
    email: "shymaa.mohmed91@gmail.com",
    phone_number: "+201069541592",
    identifier_hash: "a00e308dc2110027877a325008978c9dc79ff4d0d46e64148e249623e2defe04",
    description: "customer"
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
  const websiteToken = 'zwreKiAbwntXTtKx1367HwzW';
  const baseUrl = 'https://chat.domix.ai';
  const [locale, setLocale] = useState('en');

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={text =>
            setUser(prevUser => ({
              ...prevUser,
              name: text,
            }))
          }
          value={user.name}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={text =>
            setUser(prevUser => ({
              ...prevUser,
              email: text,
              identifier: text,
            }))
          }
          value={user.email}
        />
        <Text style={styles.label}>Language</Text>
        <TextInput
          style={styles.input}
          value={locale}
          onChangeText={() => setLocale(locale)}
        />
        <Text style={styles.label}>Avatar</Text>
        <TextInput
          style={styles.input}
          onChangeText={text =>
            setUser(prevUser => ({
              ...prevUser,
              avatar_url: text,
            }))
          }
          value={user.avatar_url}
        />
        <Text style={styles.label}>Identifier Hash (HMAC)</Text>
        <TextInput
          style={styles.input}
          onChangeText={text =>
            setUser(prevUser => ({
              ...prevUser,
              identifier_hash: text,
            }))
          }
          value={user.identifier_hash}
          placeholder="Paste HMAC sha256 hash here"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => toggleWidget(true)}>
          <Text style={styles.buttonText}>Open Domix AI Widget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#4CAF50' }]}
          onPress={() => {
            if (widgetRef.current) {
              widgetRef.current.sendMessage('Hello! This is a test message.');
            }
          }}>
          <Text style={styles.buttonText}>Send Test Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#f44336' }]}
          onPress={() => {
            if (widgetRef.current) {
              widgetRef.current.reset();
            }
          }}>
          <Text style={styles.buttonText}>Reset Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#9C27B0' }]}
          onPress={() => {
            if (widgetRef.current) {
              widgetRef.current.setUser('test-user-123', {
                name: 'Test User',
                email: 'test@example.com',
                phone_number: '+1234567890',
              });
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