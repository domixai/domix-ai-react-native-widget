/* eslint-disable */
import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DomixProvider, useDomix } from './DomixProvider';
import ChatWidget from './components/ChatWidget';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

const SafeView = ({ children, style, isVisible, manualInsets }) => {
  const detectedInsets = useSafeAreaInsets();
  const insets = manualInsets || detectedInsets;
  
  return (
    <View style={[
      style, 
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}>
      {children}
    </View>
  );
};

const DomixAIWidgetContent = forwardRef(({ isModalVisible, closeModal, skipWelcome, insets }, ref) => {
  const { sendMessage, identifyUser, fetchHistory, config, reset } = useDomix();

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
      <SafeView style={styles.container} isVisible={isModalVisible} manualInsets={insets}>
        <ChatWidget isVisible={isModalVisible} onClose={closeModal} skipWelcome={skipWelcome} />
      </SafeView>
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
    conversationCustomAttributes,
    insets
  } = props;

  return (
    <SafeAreaProvider>
      <DomixProvider 
        websiteToken={websiteToken} 
        baseUrl={baseUrl}
        initialUser={user}
        locale={locale}
        colorScheme={colorScheme}
        customAttributes={customAttributes}
        conversationCustomAttributes={conversationCustomAttributes}
        isVisible={props.isModalVisible}
      >
        <DomixAIWidgetContent {...props} ref={ref} insets={insets} />
      </DomixProvider>
    </SafeAreaProvider>
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
