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
    identifier: "guest_001",
    name: "test",
    email: "test@gmail.com",
    phone_number: "+201000000000",
    identifier_hash: "",
    description: ""
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
  const handleWidgetEvent = ({ eventName, data, payload }) => {
    console.log('WIDGET_EVENT:', eventName, data || payload);
  };

  const loginAndOpen = (nextUser) => {
    setUser(nextUser);
    toggleWidget(true);
    if (widgetRef.current) {
      widgetRef.current.setUser(nextUser.identifier, nextUser);
    }
  };

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
            toggleWidget(true);
            console.log('EXAMPLE: Send Test Message Pressed');
            if (widgetRef.current) {
              console.log('EXAMPLE: widgetRef is defined, calling sendMessage');
              widgetRef.current.sendMessage('Hello! This is a test message.');
            } else {
              console.error('EXAMPLE: widgetRef is null');
            }

          }}>
          <Text style={styles.buttonText}>Send Test Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#f44336' }]}
          onPress={async () => {
            if (widgetRef.current) {
              await widgetRef.current.reset();
              // Clear local state as well
              setUser({
                identifier: '',
                name: '',
                email: '',
                phone_number: '',
                identifier_hash: '',
                description: ''
              });
              alert('Session Reset Successfully');
            }
          }}>
          <Text style={styles.buttonText}>Reset Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#9C27B0' }]}
          onPress={() => {
            const testUser1 = {
              identifier: 'test_user_1',
              name: 'Test User One',
              email: 'user1@example.com',
              phone_number: '+1234567890',
              identifier_hash: '', // Replace with actual HMAC
              description: 'tester 1',
            };
            loginAndOpen(testUser1);
          }}>
          <Text style={styles.buttonText}>User 1 Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#673AB7' }]}
          onPress={() => {
            const testUser1Again = {
              identifier: 'test_user_1',
              name: 'Test User One',
              email: 'user1@example.com',
              phone_number: '+1234567890',
              identifier_hash: '', // Replace with actual HMAC
              description: 'tester 1',
            };
            loginAndOpen(testUser1Again);
          }}>
          <Text style={styles.buttonText}>User 1 (Same Data)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#9C27B0' }]}
          onPress={() => {
            const testUser2 = {
              identifier: 'test_user_2',
              name: 'Test User Two',
              email: 'user2@example.com',
              phone_number: '+0987654321',
              identifier_hash: '', // Replace with actual HMAC
              description: 'tester 2',
            };
            loginAndOpen(testUser2);
          }}>
          <Text style={styles.buttonText}>User 2 Login</Text>
        </TouchableOpacity>
      </View>
      <DomixAIWidget
        ref={widgetRef}
        websiteToken={websiteToken}
        locale={locale}
        baseUrl={baseUrl}
        colorScheme="light"
        autoStartConversation
        openModal={() => toggleWidget(true)}
        closeModal={() => toggleWidget(false)}
        isModalVisible={showWidget}
        user={user}
        customAttributes={customAttributes}
        conversationCustomAttributes={conversationCustomAttributes}
        onEvent={handleWidgetEvent}
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
