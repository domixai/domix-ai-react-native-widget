/* eslint-disable */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { useDomix } from '../DomixProvider';
import CSATSurvey from './CSATSurvey';
import EmailCollector from './EmailCollector';

const REPLY_ICON_SVG = `<svg width="11" height="11" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.277 16.221a.75.75 0 0 1-1.061 1.06l-4.997-5.003a.75.75 0 0 1 0-1.06L8.217 6.22a.75.75 0 0 1 1.061 1.06L5.557 11h7.842c1.595 0 2.81.242 3.889.764l.246.126a6.203 6.203 0 0 1 2.576 2.576c.61 1.14.89 2.418.89 4.135a.75.75 0 0 1-1.5 0c0-1.484-.228-2.52-.713-3.428a4.702 4.702 0 0 0-1.96-1.96c-.838-.448-1.786-.676-3.094-.709L13.4 12.5H5.562l3.715 3.721Z" fill="currentColor"></path></svg>`;
const RESEND_ICON_SVG = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.75a7.25 7.25 0 1 0 7.201 6.406c-.068-.588.358-1.156.95-1.156.515 0 .968.358 1.03.87a9.25 9.25 0 1 1-3.432-6.116V4.25a1 1 0 1 1 2.001 0v2.698l.034.052h-.034v.25a1 1 0 0 1-1 1h-3a1 1 0 1 1 0-2h.666A7.219 7.219 0 0 0 12 4.75Z" fill="currentColor"></path></svg>`;

const MessageList = () => {
  const { messages, user, fetchMoreMessages, loadingMore, sendMessage, sendInteractiveResponse, config, setReplyTo, isTyping, typingUserName } = useDomix();
  const flatListRef = useRef(null);
  const [activeMessageId, setActiveMessageId] = React.useState(null);

  const formatMessageDate = (dateString) => {
    // eslint-disable-next-line no-console
    console.log('Domix SDK: Formatting date for', dateString);
    const timestamp = dateString;
    let dateValue = timestamp;
    if (typeof timestamp === 'number' && timestamp < 10000000000) {
      dateValue = timestamp * 1000;
    }
    const date = new Date(dateValue);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getGroupedMessages = () => {
    const grouped = [];
    let lastDate = null;

    messages.forEach((msg) => {
      let timestamp = msg.created_at || msg.timestamp || (Date.now() / 1000);
      
      // If it's a Unix timestamp in seconds (number), convert to ms
      let dateValue = timestamp;
      if (typeof timestamp === 'number' && timestamp < 10000000000) {
        dateValue = timestamp * 1000;
      }
      
      const msgDate = new Date(dateValue).toDateString();
      if (msgDate !== lastDate) {
        grouped.push({ id: `date-${msgDate}`, isDate: true, date: msg.created_at || msg.timestamp });
        lastDate = msgDate;
      }
      grouped.push(msg);

      // If the message is answered, inject a virtual message from the customer
      const contentAttributes = msg.content_attributes;
      if (contentAttributes && contentAttributes.submitted_values) {
        const submitted = contentAttributes.submitted_values;
        let choiceText = '';
        
        if (Array.isArray(submitted) && submitted.length > 0) {
          choiceText = submitted[0].title || submitted[0].label || submitted[0].value;
        } else if (typeof submitted === 'object') {
          choiceText = submitted.title || submitted.label || submitted.value;
        }
        
        if (choiceText) {
          grouped.push({
            id: `response-${msg.id}`,
            content: choiceText,
            message_type: 0, // Styled as customer message
            created_at: msg.created_at,
            timestamp: msg.timestamp,
            isVirtualResponse: true,
            sender: {
              id: 'user',
              name: 'You'
            }
          });
        }
      }
    });

    return grouped.reverse();
  };

  const invertedMessages = getGroupedMessages();

  const handleInteractiveClick = (messageId, option) => {
    const label = option.label || option.title || option.value;
    if (!label) return;
    
    if (option.action?.type === 'link') {
      Linking.openURL(option.action.uri);
    } else {
      // Use interactive response instead of plain message
      sendInteractiveResponse(messageId, label);
    }
  };

  const renderAttachments = (attachments, isMine) => {
    if (!attachments || attachments.length === 0) return null;

    return attachments.map((attachment, index) => {
      const isImage = attachment.file_type === 'image';
      const isVideo = attachment.file_type === 'video';
      const isAudio = attachment.file_type === 'audio';
      const fileUrl = attachment.data_url || attachment.url;

      if (isImage) {
        return (
          <TouchableOpacity 
            key={attachment.id || index} 
            style={styles.attachmentContainer}
            onPress={() => Linking.openURL(fileUrl)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: fileUrl }} style={styles.attachedImage} resizeMode="cover" />
            <View style={[styles.imageDownloadBar, isMine && styles.myImageDownloadBar]}>
              <Text style={styles.fileIcon}>📄</Text>
              <View>
                <Text style={[styles.fileName, isMine && styles.myFileName]}>{attachment.file_name || 'image.jpg'}</Text>
                <Text style={[styles.downloadText, isMine && styles.myDownloadText]}>Download</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }

      if (isVideo) {
        const videoHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                body { margin:0; padding:0; background:#000; display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; }
                video { width:100%; height:100%; object-fit:contain; }
              </style>
            </head>
            <body>
              <video controls playsinline preload="metadata">
                <source src="${fileUrl}" type="video/mp4">
              </video>
            </body>
          </html>
        `;
        return (
          <View key={attachment.id || index} style={styles.videoAttachment}>
            <WebView 
              source={{ html: videoHtml }} 
              style={{ backgroundColor: '#000' }}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              originWhitelist={['*']}
              scrollEnabled={false}
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
        );
      }

      if (isAudio) {
        const audioHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                body { margin:0; padding:0; display:flex; justify-content:center; align-items:center; background:transparent; height:100vh; overflow:hidden; }
                audio { width:95%; }
              </style>
            </head>
            <body>
              <audio controls preload="metadata">
                <source src="${fileUrl}">
              </audio>
            </body>
          </html>
        `;
        return (
          <View key={attachment.id || index} style={[styles.audioAttachment, isMine && styles.myAudioAttachment]}>
            <WebView 
              source={{ html: audioHtml }} 
              style={{ backgroundColor: 'transparent' }}
              originWhitelist={['*']}
              allowsInlineMediaPlayback={true}
              scrollEnabled={false}
              containerStyle={{ borderRadius: 12, overflow: 'hidden' }}
            />
          </View>
        );
      }

      return (
        <TouchableOpacity 
          key={attachment.id || index} 
          style={[styles.fileAttachment, isMine && styles.myFileAttachment]}
          onPress={() => Linking.openURL(fileUrl)}
        >
          <Text style={styles.fileIcon}>📄</Text>
          <View>
            <Text style={[styles.fileName, isMine && styles.myFileName]}>{attachment.file_name || 'File'}</Text>
            <Text style={[styles.downloadText, isMine && styles.myDownloadText]}>Download</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderReplyPreview = (externalReplyId, isMine) => {
    if (!externalReplyId) return null;
    
    // Find the message being replied to
    const repliedMessage = messages.find(m => m.id === externalReplyId);
    if (!repliedMessage) return null;

    return (
      <View style={[
        styles.bubbleReplyPreview, 
        { backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }
      ]}>
        <View style={styles.replyPreviewContent}>
          <Text style={[
            styles.replyPreviewName,
            { color: isMine ? '#FFFFFF' : 'rgba(0,0,0,0.6)' }
          ]} numberOfLines={1}>
            {repliedMessage.sender?.name || 'Agent'}
          </Text>
          <Text style={[
            styles.replyPreviewText,
            { color: isMine ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)' }
          ]} numberOfLines={1}>
            {repliedMessage.content || (repliedMessage.attachments?.length > 0 ? 'Attachment' : '')}
          </Text>
        </View>
      </View>
    );
  };

  const renderInteractive = (messageId, contentAttributes) => {
    if (!contentAttributes) return null;
    
    const options = contentAttributes.options || contentAttributes.items || [];
    
    // Check if the message has already been answered
    const isAnswered = contentAttributes.submitted_values && (
      Array.isArray(contentAttributes.submitted_values) 
        ? contentAttributes.submitted_values.length > 0 
        : Object.keys(contentAttributes.submitted_values).length > 0
    );

    if (options.length === 0 || isAnswered) return null;

    return (
      <View style={styles.interactiveWrapper}>
        <View style={styles.interactiveContainer}>
          {options.map((option, index) => (
            <TouchableOpacity key={index} style={[styles.interactiveButton, {borderColor: config?.widget_color}]} onPress={() => handleInteractiveClick(messageId, option)}>
              <Text style={[styles.interactiveButtonText, {color: config?.widget_color}]}>{option.label || option.title || option.value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.isDate) {
      return (
        <View style={styles.dateHeader}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{formatMessageDate(item.date)}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const isMine = item.message_type === 0 || item.sender?.id === user?.id;
    
    const sender = item.sender || {};
    const isBot = (item.sender_type === 'contact' && !isMine && !sender.id) || !sender.id;
    
    const senderName = isBot 
      ? (config?.enabled_features?.includes('use_inbox_avatar_for_bot') ? (config?.website_name || 'Bot') : 'Bot') 
      : (sender.name || sender.available_name || sender.display_name || 'Agent');
    
    const avatarUrl = isBot ? (config?.enabled_features?.includes('use_inbox_avatar_for_bot') ? (config?.avatar_url || config?.logo_url) : sender.avatar_url) : sender.avatar_url;

    return (
      <View style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}>
        {!isMine && (
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isBot ? '#E0F2FE' : '#E5E7EB' }]}>
                <Text style={styles.avatarPlaceholderText}>{senderName.charAt(0)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.messageContent, isMine ? styles.myContent : styles.theirContent]}>
          <View style={[styles.bubbleWrapper, isMine ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setActiveMessageId(activeMessageId === item.id ? null : item.id)}
              style={[
                styles.bubble,
                isMine ? styles.myBubble : styles.theirBubble,
                isMine && { backgroundColor: item.status === 'failed' ? '#EF4444' : (config?.widget_color || '#00CE7C') },
                item.status === 'sending' && { opacity: 0.7 },
                item.attachments?.length > 0 && styles.attachmentBubble
              ]}
            >
              {item.content_attributes?.external_reply_id && renderReplyPreview(item.content_attributes.external_reply_id, isMine)}
              {item.attachments?.length > 0 && renderAttachments(item.attachments, isMine)}
              {item.content && item.content_type !== 'input_csat' && item.content_type !== 'input_email' && (
                <Text style={[styles.text, isMine ? styles.myText : styles.theirText]}>
                  {item.content}
                </Text>
              )}
              {item.content_attributes && renderInteractive(item.id, item.content_attributes)}
              {item.content_type === 'input_email' && (
                <View style={styles.emailCollectorBubble}>
                  <Text style={[styles.text, styles.theirText, { marginBottom: 8 }]}>{item.content}</Text>
                  <EmailCollector messageId={item.id} />
                </View>
              )}
              {item.content_type === 'input_csat' && (
                <CSATSurvey message={item} />
              )}
            </TouchableOpacity>

            {!item.isVirtualResponse && item.status !== 'failed' && activeMessageId === item.id && (
              <TouchableOpacity 
                style={styles.replyButton} 
                onPress={() => setReplyTo(item)}
              >
                <SvgXml xml={REPLY_ICON_SVG} width="14" height="14" color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {isMine && item.status === 'failed' && (
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={() => sendMessage(item.content, item.id)}
              >
                <SvgXml xml={RESEND_ICON_SVG} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          
          {!isMine && (
            <Text style={styles.senderNameBelow}>{senderName}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={invertedMessages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        inverted={true}
        onEndReached={fetchMoreMessages}
        onEndReachedThreshold={0.2}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} /> : null}
      />
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <Image 
              source={{ uri: 'https://chat.domix.ai/vite/assets/typing-DYm07fFx.gif' }} 
              style={styles.typingGif} 
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: 16 },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 10 },
  dateText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  messageRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  myRow: { alignSelf: 'flex-end' },
  theirRow: { alignSelf: 'flex-start' },
  avatarContainer: { alignSelf: 'flex-end', marginRight: 8, marginBottom: 18 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF' },
  avatarPlaceholder: { 
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6'
  },
  avatarPlaceholderText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  messageContent: { flex: 1 },
  myContent: { alignItems: 'flex-end' },
  theirContent: { alignItems: 'flex-start' },
  bubble: {
    padding: 12, borderRadius: 18, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, overflow: 'hidden'
  },
  myBubble: { backgroundColor: '#00CE7C', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  attachmentBubble: { padding: 0 },
  text: { fontSize: 15, lineHeight: 21, padding: 2 },
  myText: { color: '#FFFFFF' },
  theirText: { color: '#1F2937' },
  senderNameBelow: { fontSize: 11, color: '#9CA3AF', marginTop: 4, marginLeft: 2, fontWeight: '400' },
  attachmentContainer: { width: 240, borderRadius: 8, overflow: 'hidden' },
  attachedImage: { width: '100%', height: 180, backgroundColor: '#F3F4F6' },
  imageDownloadBar: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F9FAFB' },
  myImageDownloadBar: { backgroundColor: 'rgba(0,0,0,0.1)' },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, width: 240 },
  myFileAttachment: { backgroundColor: 'rgba(0,0,0,0.1)' },
  fileIcon: { fontSize: 18, marginRight: 8 },
  fileName: { fontSize: 13, fontWeight: '500', color: '#374151' },
  myFileName: { color: '#FFFFFF' },
  downloadText: { fontSize: 11, color: '#6B7280' },
  myDownloadText: { color: 'rgba(255,255,255,0.7)' },
  interactiveWrapper: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, paddingHorizontal: 10 },
  interactiveContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  interactiveButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 70,
  },
  interactiveButtonText: { fontSize: 13, fontWeight: '500' },
  loader: { marginVertical: 10 },
  bubbleWrapper: { 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    gap: 8,
  },
  myBubbleWrapper: {
    flexDirection: 'row-reverse',
  },
  theirBubbleWrapper: {
    flexDirection: 'row',
  },
  replyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  replyIcon: {
    fontSize: 12,
    color: '#6B7280',
    transform: [{ scaleX: -1 }], // Flip for standard reply arrow look
  },
  bubbleReplyPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    marginHorizontal: 4,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.2)',
  },
  replyPreviewBar: {
    display: 'none', // Using borderLeft instead
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
  resendButton: {
    position: 'absolute',
    left: -30,
    bottom: 5,
    padding: 5,
  },
  videoAttachment: { width: 240, height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000000', marginTop: 5 },
  audioAttachment: { width: 240, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', marginTop: 5, padding: 2 },
  myAudioAttachment: { backgroundColor: 'rgba(255,255,255,0.2)' },
  emailCollectorBubble: {
    width: '100%',
    minWidth: 220,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    width: 55,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingGif: {
    width: 35,
    height: 20,
  },
  typingText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default MessageList;
