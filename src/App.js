import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { SafeAreaView, Appearance, View } from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';
import { storeHelper, findColors } from './utils';
import WebView from './WebView';
import styles from './style';
import { COLOR_WHITE } from './constants';

const propTypes = {
  isModalVisible: PropTypes.bool.isRequired,
  websiteToken: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
  cwCookie: PropTypes.string,
  user: PropTypes.shape({
    name: PropTypes.string,
    avatar_url: PropTypes.string,
    email: PropTypes.string,
    identifier_hash: PropTypes.string,
  }),
  locale: PropTypes.string,
  colorScheme: PropTypes.oneOf(['dark', 'light', 'auto']),
  customAttributes: PropTypes.shape({}),
  conversationCustomAttributes: PropTypes.shape({}),
  autoStartConversation: PropTypes.bool,
  closeModal: PropTypes.func,
  openModal: PropTypes.func,
  onEvent: PropTypes.func,
};

const DomixAIWidget = forwardRef(
  (
    {
      isModalVisible,
      baseUrl,
      websiteToken,
      user = {},
      locale = 'en',
      colorScheme = 'light',
      customAttributes = {},
      conversationCustomAttributes = {},
      autoStartConversation = false,
      closeModal,
      openModal,
      onEvent,
    },
    ref
  ) => {
    const innerWebViewRef = useRef(null);
    const appPendingMessagesRef = useRef([]);
    const prevIdentifierRef = useRef(user?.identifier);
    const didMountRef = useRef(false);
    const [cwCookie, setCookie] = useState('');

    // Only wait for the Ref (mounting). WebView handle the rest of the sync.
    useEffect(() => {
      if (innerWebViewRef.current && appPendingMessagesRef.current.length > 0) {
        appPendingMessagesRef.current.forEach(msg => {
          innerWebViewRef.current.sendMessage(msg);
        });
        appPendingMessagesRef.current = [];
      }
    }, [innerWebViewRef.current, isModalVisible]);

    useImperativeHandle(ref, () => ({
      sendMessage: message => {
        if (!isModalVisible && typeof openModal === 'function') {
          openModal();
        }
        if (innerWebViewRef.current) {
          innerWebViewRef.current.sendMessage(message);
        } else {
          console.log('DOMIX_APP: Ref is NULL (Modal hidden). Queuing message at App level.');
          appPendingMessagesRef.current.push(message);
        }
      },
      setUser: (identifier, userData) => {
        if (innerWebViewRef.current) {
          innerWebViewRef.current.setUser(identifier, userData);
        }
      },
      setCustomAttributes: attributes => {
        if (innerWebViewRef.current) {
          innerWebViewRef.current.setCustomAttributes(attributes);
        }
      },
      setConversationCustomAttributes: attributes => {
        if (innerWebViewRef.current) {
          innerWebViewRef.current.setConversationCustomAttributes(attributes);
        }
      },
      reset: async () => {
        await storeHelper.removeCookie();
        setCookie('');
        if (innerWebViewRef.current) {
          innerWebViewRef.current.reset();
        }
      },
      closeModal: () => closeModal(),
    }));

    useEffect(() => {
      async function fetchData() {
        const value = await storeHelper.getCookie();
        setCookie(value);
      }
      fetchData();
    }, []);

    // Clear cookie when identifier changes
    useEffect(() => {
      if (!didMountRef.current) {
        didMountRef.current = true;
        prevIdentifierRef.current = user?.identifier;
        return;
      }
      const identifierChanged = prevIdentifierRef.current !== user?.identifier;
      prevIdentifierRef.current = user?.identifier;
      if (!identifierChanged) {
        return;
      }
      async function clearCookies() {
        setCookie('');
        await storeHelper.removeCookie();
      }
      clearCookies();
    }, [user?.identifier]);

    const appColorScheme = Appearance.getColorScheme();

    const { headerBackgroundColor, mainBackgroundColor } = findColors({
      colorScheme,
      appColorScheme,
    });
    return (
      <Modal
        backdropColor={COLOR_WHITE}
        coverScreen
        isVisible={isModalVisible}
        onBackButtonPress={closeModal}
        onBackdropPress={closeModal}
        style={styles.modal}>
        <View style={styles.mainView}>
          <SafeAreaView style={[styles.headerView, { backgroundColor: headerBackgroundColor }]} />
          <SafeAreaView style={[styles.mainView, { backgroundColor: mainBackgroundColor }]}>
            <WebView
              ref={innerWebViewRef}
              websiteToken={websiteToken}
              cwCookie={cwCookie}
              isModalVisible={isModalVisible}
              user={user}
              baseUrl={baseUrl}
              locale={locale}
              colorScheme={colorScheme}
              customAttributes={customAttributes}
              conversationCustomAttributes={conversationCustomAttributes}
              autoStartConversation={autoStartConversation}
              closeModal={closeModal}
              onEvent={onEvent}
            />
          </SafeAreaView>
        </View>
      </Modal>
    );
  }
);

DomixAIWidget.propTypes = propTypes;

export default DomixAIWidget;
