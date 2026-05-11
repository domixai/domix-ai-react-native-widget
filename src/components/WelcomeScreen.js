/* eslint-disable */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useDomix } from '../DomixProvider';
import { getReplyTimeText } from '../helpers/AvailabilityHelper';

const WelcomeScreen = ({ onStartChat }) => {
  const { config, agents, t, messages, baseUrl, isOnline, nextAvailableSlot } = useDomix();
  const primaryColor = config?.widget_color || '#00CE7C';
  
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const welcomeHeading = config?.welcome_title;
  const welcomeTagline = config?.welcome_tagline ;
  
  const replyTimeText = getReplyTimeText(config, isOnline, nextAvailableSlot, t);

  return (
    <View style={styles.container}>
      {/* Top Section: Welcome Text */}
      <View style={styles.topSection}>
        <Text style={styles.heading}>{welcomeHeading}</Text>
        <Text style={styles.tagline}>{welcomeTagline}</Text>
      </View>

      {/* Spacer to push content down */}
      <View style={styles.spacer} />

      {/* Bottom Section: Status Card & Footer */}
      <View style={styles.bottomSection}>
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {isOnline ? t.welcome_online : t.welcome_offline}
            </Text>
            <Text style={styles.statusSubtitle}>
              {replyTimeText}
            </Text>
            
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={onStartChat}
              activeOpacity={0.7}
            >
              <Text style={[styles.startButtonText, { color: primaryColor }]}>
                {messages.length > 0 ? t.continue_chat : t.start_chat}
              </Text>
              <Text style={[styles.arrow, { color: primaryColor }]}>→</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.agentsContainer}>
            {agents.slice(0, 3).map((agent, index) => (
              <View 
                key={agent.id} 
                style={[styles.agentAvatar, { marginLeft: index === 0 ? 0 : -10, zIndex: 10 - index }]}
              >
                {agent.avatar_url ? (
                  <Image source={{ uri: agent.avatar_url }} style={styles.agentImage} />
                ) : (
                  <View style={styles.agentPlaceholder}>
                    <Text style={styles.agentInitial}>{agent.name?.charAt(0)}</Text>
                  </View>
                )}
              </View>
            ))}
            {agents.length === 0 && (
              <View style={[styles.agentPlaceholder, { backgroundColor: '#F3F4F6' }]}>
                <Text style={{ color: '#9CA3AF' }}>?</Text>
              </View>
            )}
          </View>
        </View>

        {!config?.disable_branding && (
          <TouchableOpacity 
            style={styles.brandingContainer} 
            onPress={() => {
              let url = config?.global_config?.WIDGET_BRAND_URL;
              if (url) {
                if (!url.startsWith('http')) url = 'https://' + url;
                Linking.openURL(url);
              }
            }}
          >
            <Text style={styles.poweredByText}>Powered by</Text>
            <View style={styles.brandInfo}>
              {config?.global_config?.LOGO_THUMBNAIL && (
                <Image 
                  source={{ uri: getImageUrl(config.global_config.LOGO_THUMBNAIL) }} 
                  style={styles.brandLogoSmall} 
                />
              )}
              <Text style={styles.brandNameText}>
                {config?.global_config?.BRAND_NAME || 'Domix.ai'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  topSection: {
    marginTop: 20,
  },
  mainLogo: {
    width: 60,
    height: 60,
    marginBottom: 20,
    borderRadius: 12,
  },
  spacer: {
    flex: 1, // This fills the space between top and bottom
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 42,
  },
  tagline: {
    fontSize: 17,
    color: '#4B5563',
    lineHeight: 26,
    fontWeight: '400',
  },
  bottomSection: {
    paddingBottom: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 40,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c2024',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#60646c',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  arrow: {
    fontSize: 20,
  },
  agentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  agentImage: {
    width: '100%',
    height: '100%',
  },
  agentPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  poweredBy: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandLogoSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  poweredByText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  brandNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default WelcomeScreen;
