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
  closeModal: PropTypes.func,
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
      closeModal,
    },
    ref
  ) => {
    const webViewRef = useRef(null);
    const [cwCookie, setCookie] = useState('');

    useImperativeHandle(ref, () => ({
      sendMessage: message => {
        if (webViewRef.current) {
          webViewRef.current.sendMessage(message);
        }
      },
      setUser: (identifier, userData) => {
        if (webViewRef.current) {
          webViewRef.current.setUser(identifier, userData);
        }
      },
      setCustomAttributes: attributes => {
        if (webViewRef.current) {
          webViewRef.current.setCustomAttributes(attributes);
        }
      },
      setConversationCustomAttributes: attributes => {
        if (webViewRef.current) {
          webViewRef.current.setConversationCustomAttributes(attributes);
        }
      },
      reset: async () => {
        await storeHelper.removeCookie();
        setCookie('');
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
        <View style={[styles.mainView, { backgroundColor: mainBackgroundColor }]}>
          <WebView
            ref={webViewRef}
            websiteToken={websiteToken}
            cwCookie={cwCookie}
            user={user}
            baseUrl={baseUrl}
            locale={locale}
            colorScheme={colorScheme}
            customAttributes={customAttributes}
            conversationCustomAttributes={conversationCustomAttributes}
            closeModal={closeModal}
          />
        </View>
      </View>
    </Modal>
  );
});

DomixAIWidget.propTypes = propTypes;

export default DomixAIWidget;
