/* eslint-disable */
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Text, ScrollView } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useDomix } from '../DomixProvider';
import { Modal } from 'react-native';

// Defensive imports for bare React Native pickers
let launchImageLibrary, launchCamera, DocumentPicker;
try {
  const ImagePicker = require('react-native-image-picker');
  launchImageLibrary = ImagePicker.launchImageLibrary;
  launchCamera = ImagePicker.launchCamera;
} catch (e) {
  // Not installed
}

try {
  DocumentPicker = require('react-native-document-picker').default;
} catch (e) {
  // Not installed
}

const EMOJI_ICON = `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.999c5.524 0 10.002 4.478 10.002 10.002 0 5.523-4.478 10.001-10.002 10.001-5.524 0-10.002-4.478-10.002-10.001C1.998 6.477 6.476 1.999 12 1.999Zm0 1.5a8.502 8.502 0 1 0 0 17.003A8.502 8.502 0 0 0 12 3.5ZM8.462 14.784A4.491 4.491 0 0 0 12 16.502a4.492 4.492 0 0 0 3.535-1.714.75.75 0 1 1 1.177.93A5.991 5.991 0 0 1 12 18.002a5.991 5.991 0 0 1-4.716-2.29.75.75 0 0 1 1.178-.928ZM9 8.75a1.25 1.25 0 1 1 0 2.499A1.25 1.25 0 0 1 9 8.75Zm6 0a1.25 1.25 0 1 1 0 2.499 1.25 1.25 0 0 1 0-2.499Z" fill="currentColor"></path></svg>`;

const ATTACHMENT_ICON = `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.772 3.743a6 6 0 0 1 8.66 8.302l-.19.197-8.8 8.798-.036.03a3.723 3.723 0 0 1-5.489-4.973.764.764 0 0 1 .085-.13l.054-.06.086-.088.142-.148.002.003 7.436-7.454a.75.75 0 0 1 .977-.074l.084.073a.75.75 0 0 1 .074.977l-.073.084-7.435 7.454a2.223 2.223 0 0 0 3.143 3.143l.087-.087 8.8-8.798a4.5 4.5 0 0 0-6.19-6.52l-.173.156-8.8 8.798a.75.75 0 0 1-1.135-.98l.074-.085 8.8-8.798a6 6 0 0 1 4.793-1.764Z" fill="currentColor"></path></svg>`;

const SEND_ICON = `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.694 12 2.299 3.272c-.236-.607.356-1.188.942-.982l.093.04 18 9a.75.75 0 0 1 .097 1.283l-.097.058-18 9c-.583.291-1.217-.244-1.065-.847l.03-.096L5.694 12 2.299 3.272 5.694 12ZM4.402 4.54l2.61 6.71h6.627a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.649.743l-.101.007H7.01l-2.609 6.71L19.322 12 4.401 4.54Z" fill="currentColor"></path></svg>`;

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendMessage, config, t, replyTo, setReplyTo, isOnline, sendTyping } = useDomix();
  const primaryColor = config?.widget_color || '#009CE0';
  const typingTimer = React.useRef(null);

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
      sendTyping('off');
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleTextChange = (text) => {
    setMessage(text);
    
    // Typing indicator logic
    if (text.length > 0) {
      if (!typingTimer.current) {
        sendTyping('on');
      }
      
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        sendTyping('off');
        typingTimer.current = null;
      }, 2000);
    } else {
      sendTyping('off');
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  };

  const onFilePicked = (assets) => {
    if (!assets || assets.length === 0) return;
    const file = assets[0];
    sendMessage('', null, [{
      uri: file.uri,
      name: file.name || file.fileName || 'image.jpg',
      type: file.mimeType || file.type || 'image/jpeg'
    }]);
    setShowAttachmentMenu(false);
  };

  const handlePhotoLibrary = async () => {
    if (typeof launchImageLibrary !== 'function') {
      alert('Photo library is not available. Please install react-native-image-picker and rebuild your app.');
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      quality: 1,
      selectionLimit: 1,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      onFilePicked(result.assets);
    }
  };

  const handleCamera = async () => {
    if (typeof launchCamera !== 'function') {
      alert('Camera is not available. Please install react-native-image-picker and rebuild your app.');
      return;
    }
    const result = await launchCamera({
      mediaType: 'mixed',
      quality: 1,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      onFilePicked(result.assets);
    }
  };

  const handleDocument = async () => {
    if (!DocumentPicker || typeof DocumentPicker.pick !== 'function') {
      alert('Document picker is not available. Please install react-native-document-picker and rebuild your app.');
      return;
    }
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      if (result && result.length > 0) {
        // DocumentPicker returns an array of results
        const assets = result.map(file => ({
          uri: file.uri,
          name: file.name,
          type: file.type,
        }));
        onFilePicked(assets);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Domix SDK: Attachment error', err);
      }
    }
  };

  const handleAttachment = () => {
    setShowAttachmentMenu(true);
  };

  const isRTL = t.placeholder.includes('اكتب');

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.replyingContainer}>
          <View style={styles.replyingContent}>
            <Text style={styles.replyingToLabel}>Replying to {replyTo.sender?.name || 'Agent'}:</Text>
            <Text style={styles.replyingText} numberOfLines={1}>
              {replyTo.content || (replyTo.attachments?.length > 0 ? 'Attachment' : '')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.cancelReplyButton} 
            onPress={() => setReplyTo(null)}
          >
            <Text style={styles.cancelReplyText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, isRTL && styles.rtlText]}
          placeholder={t.placeholder}
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={handleTextChange}
          multiline
        />

        {config?.enabled_features?.includes('emoji_picker') && (
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowEmojiPicker(true)}>
            <SvgXml xml={EMOJI_ICON} width="22" height="22" color="#6B7280" />
          </TouchableOpacity>
        )}

        {message.length > 0 ? (
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: primaryColor }]} 
            onPress={handleSend}
          >
            <SvgXml xml={SEND_ICON} width="18" height="18" color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          config?.enabled_features?.includes('attachments') && (
            <TouchableOpacity style={styles.iconButton} onPress={handleAttachment}>
              <SvgXml xml={ATTACHMENT_ICON} width="22" height="22" color="#6B7280" />
            </TouchableOpacity>
          )
        )}
      </View>

      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handlePhotoLibrary}>
              <Text style={styles.menuIcon}>🖼️</Text>
              <Text style={styles.menuText}>Photo Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleCamera}>
              <Text style={styles.menuIcon}>📷</Text>
              <Text style={styles.menuText}>Take Photo or Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleDocument}>
              <Text style={styles.menuIcon}>📁</Text>
              <Text style={styles.menuText}>Choose File</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.cancelItem]} 
              onPress={() => setShowAttachmentMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiContainer}>
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Select Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Text style={styles.emojiClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.emojiGrid}>
              {emojis.map((emoji, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.emojiItem}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 100,
  },
  rtlText: {
    textAlign: 'right',
  },
  iconButton: {
    padding: 6,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  replyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    marginBottom: -15, // Negative margin to overlap with inputWrapper
    paddingBottom: 22, // Extra padding to account for overlap
    zIndex: -1,
  },
  replyingContent: {
    flex: 1,
  },
  replyingToLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyingText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
  },
  cancelReplyButton: {
    padding: 4,
  },
  cancelReplyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  cancelItem: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  emojiContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '40%',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emojiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emojiClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#009CE0',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emojiItem: {
    width: '12.5%', // 8 emojis per row
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
});

export default MessageInput;
