/* eslint-disable */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDomix } from '../DomixProvider';
import { getReplyTimeText } from '../helpers/AvailabilityHelper';
import { SvgXml } from 'react-native-svg';

const END_ICON = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.502 11.5a1.002 1.002 0 1 1 0 2.004 1.002 1.002 0 0 1 0-2.004Z" fill="currentColor"></path><path d="M12 4.354v6.651l7.442-.001L17.72 9.28a.75.75 0 0 1-.073-.976l.073-.084a.75.75 0 0 1 .976-.073l.084.073 2.997 2.997a.75.75 0 0 1 .073.976l-.073.084-2.996 3.004a.75.75 0 0 1-1.134-.975l.072-.085 1.713-1.717-7.431.001L12 19.25a.75.75 0 0 1-.88.739l-8.5-1.502A.75.75 0 0 1 2 17.75V5.75a.75.75 0 0 1 .628-.74l8.5-1.396a.75.75 0 0 1 .872.74Zm-1.5.883-7 1.15V17.12l7 1.236V5.237Z" fill="currentColor"></path><path d="M13 18.501h.765l.102-.006a.75.75 0 0 0 .648-.745l-.007-4.25H13v5.001ZM13.002 10 13 8.725V5h.745a.75.74 0 0 1 .743.647l.007.102.007 4.251h-1.5Z" fill="currentColor"></path></svg>`;

const ChatHeader = ({ onClose, view, onBack, showBack }) => {
  const { config, t, baseUrl, isOnline, nextAvailableSlot, conversation, resolveConversation } = useDomix();
  const globalConfig = config?.global_config || {};
  const primaryColor = config?.widget_color || '#00CE7C';
  const title = config?.website_name || globalConfig?.BRAND_NAME || '';
  
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const avatarUrl = getImageUrl(config?.logo_url || config?.avatar_url);

  const replyTimeText = getReplyTimeText(config, isOnline, nextAvailableSlot, t);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoCircle, { backgroundColor: primaryColor }]}>
                <Text style={styles.logoText}>{title.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.onlineStatus} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>{title}</Text>
              <View style={[styles.statusDot, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={styles.subtitleText}>{replyTimeText}</Text>
          </View>
        </View>
        
        <View style={styles.rightContainer}>
          {view === 'chat' && 
           config?.enabled_features?.includes('end_conversation') && 
           conversation && 
           conversation.status !== 'resolved' && (
            <TouchableOpacity 
              onPress={resolveConversation} 
              style={styles.endIconButton}
            >
              <SvgXml xml={END_ICON} width="22" height="22" color="#6B7280" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#374151',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  onlineStatus: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  subtitleText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '300',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endIconButton: {
    padding: 8,
    marginRight: 4,
  },
});

export default ChatHeader;
