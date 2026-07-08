/* eslint-disable */
import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DomixProvider, useDomix } from './DomixProvider';
import ChatWidget from './components/ChatWidget';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

const DomixAIWidgetContent = forwardRef(({ isModalVisible, closeModal, skipWelcome, insets: propInsets }, ref) => {
  const { sendMessage, identifyUser, fetchHistory, config, reset } = useDomix();
  const contextInsets = useSafeAreaInsets();
  const insets = propInsets || contextInsets;

  useImperativeHandle(ref, () => ({
    sendMessage: (content) => {
      sendMessage(content);
    },
    setUser: (identifier, userData) => {
      const user = userData ? { ...userData, identifier } : identifier;
      identifyUser(user);
    },
    fetchHistory: () => {
      fetchHistory();
    },
    closeModal: () => closeModal(),
    reset: () => {
      reset();
    },
  }));

  return (
    <Modal
      isVisible={isModalVisible}
      onBackButtonPress={closeModal}
      onBackdropPress={closeModal}
      style={styles.modal}
      deviceWidth={deviceWidth}
      deviceHeight={deviceHeight}
      statusBarTranslucent={true}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.4}
      hideModalContentWhileAnimating={true}
    >
      <View style={[
        styles.container, 
        { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }
      ]}>
        <ChatWidget isVisible={isModalVisible} onClose={closeModal} skipWelcome={skipWelcome} />
      </View>
    </Modal>
  );
});

const DomixAIWidget = forwardRef((props, ref) => {
  const { 
    websiteToken, 
    baseUrl, 
    user, 
    locale, 
    colorScheme, 
    customAttributes, 
    additionalAttributes,
    conversationCustomAttributes,
    appName,
    appVersion
  } = props;

  return (
    <DomixProvider 
      websiteToken={websiteToken} 
      baseUrl={baseUrl}
      initialUser={user}
      locale={locale}
      colorScheme={colorScheme}
      customAttributes={customAttributes}
      additionalAttributes={additionalAttributes}
      conversationCustomAttributes={conversationCustomAttributes}
      isVisible={props.isModalVisible}
      appName={appName}
      appVersion={appVersion}
    >
      <DomixAIWidgetContent {...props} ref={ref} />
    </DomixProvider>
  );
});

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});

export default DomixAIWidget;
