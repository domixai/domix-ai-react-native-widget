/* eslint-disable */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useDomix } from '../DomixProvider';

const EmailCollector = ({ messageId }) => {
  const { config, updateMessage } = useDomix();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const primaryColor = config?.widget_color || '#1F93FF';

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    try {
      await updateMessage(messageId, { contact: { email: email.trim() } });
      setSubmitted(true);
    } catch (err) {
      console.error('Email submission failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>Thanks! We'll notify you at {email}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Please enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: (!email.trim() || !email.includes('@')) ? primaryColor + '40' : primaryColor }]}
          onPress={handleSubmit}
          disabled={!email.trim() || !email.includes('@') || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitArrow}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    width: '100%',
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  submitButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  successText: {
    padding: 12,
    fontSize: 13,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '500',
  }
});

export default EmailCollector;
