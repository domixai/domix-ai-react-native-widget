/* eslint-disable */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useDomix } from '../DomixProvider';

import DomixClient from '../DomixClient';

const CSATSurvey = ({ message, onComplete }) => {
  const { config } = useDomix();
  const messageId = message?.id;
  const contentAttributes = message?.content_attributes || {};
  const displayType = contentAttributes.display_type || config?.csat_config?.display_type || 'star';
  const question = config?.csat_config?.message || 'Rate your conversation';

  // Check if already submitted in message history
  const submittedValues = contentAttributes?.submitted_values || {};
  const csatResponse = submittedValues?.csat_survey_response || {};
  
  const initialRating = csatResponse?.rating || 0;
  const initialFeedback = csatResponse?.feedback_message || '';
  const initialSubmitted = !!initialRating; // Even if only rating is submitted, consider it as rated to show selected state

  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const primaryColor = config?.widget_color || '#1F93FF';

  const title = submitted 
    ? 'Thank you!' 
    : (rating > 0 ? 'Thank you for the feedback' : (config?.csat_config?.message || 'Rate your conversation'));

  const handleRatingPress = (val) => {
    if (submitted) return;
    setRating(val);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await DomixClient.submitCSAT(messageId, rating, feedback);
      setSubmitted(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('CSAT submission failed', err);
    } finally {
      setLoading(false);
    }
  };



  const renderRatingIcons = () => {
    if (displayType === 'emoji') {
      const emojis = ['😠', '🙁', '😐', '😊', '😍'];
      return (
        <View style={styles.starsContainer}>
          {emojis.map((emoji, index) => {
            const val = index + 1;
            return (
              <TouchableOpacity 
                key={val} 
                onPress={() => handleRatingPress(val)}
                style={styles.starButton}
                disabled={submitted}
              >
                <Text style={[styles.emojiIcon, { opacity: val === rating || rating === 0 ? 1 : 0.3 }]}>
                  {emoji}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => handleRatingPress(star)}
            style={styles.starButton}
            disabled={submitted}
          >
            <Text style={[styles.starIcon, { color: star <= rating ? '#FBBF24' : '#D1D5DB' }]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { backgroundColor: primaryColor }]} />
      <Text style={styles.title}>{title}</Text>
      
      {renderRatingIcons()}

      {submitted ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Thank you for submitting the rating</Text>
        </View>
      ) : (
        <View style={styles.footerRow}>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Tell us more..."
            placeholderTextColor="#9CA3AF"
            value={feedback}
            onChangeText={setFeedback}
          />
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: rating === 0 ? primaryColor + '40' : primaryColor }]}
            onPress={handleSubmit}
            disabled={rating === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitArrow}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    width: '100%',
    marginVertical: 10,
  },
  headerBar: {
    height: 4,
    backgroundColor: '#A855F7', // Default purple bar like screenshot
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    marginStart: 20,
    marginEnd: 20,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 36,
  },
  emojiIcon: {
    fontSize: 32,
  },
  footerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  feedbackInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  successContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  successText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  }
});

export default CSATSurvey;
