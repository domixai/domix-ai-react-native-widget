import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BG_COLOR_WHITE,
  BG_COLOR_DARK,
  COLOR_WHITE,
  DOMIX_PREFIX,
  POST_MESSAGE_EVENTS,
} from './constants';

export const isJsonString = (string) => {
  try {
    JSON.parse(string);
  } catch (e) {
    return false;
  }
  return true;
};

export const createDomixPostMessage = (object) => {
  const stringfyObject = `'${DOMIX_PREFIX}${JSON.stringify(object)}'`;
  const script = `window.postMessage(${stringfyObject});`;
  return script;
};

export const getMessage = (data) => data.replace(DOMIX_PREFIX, '');

export const generateScripts = ({
  colorScheme,
  user,
  locale,
  customAttributes,
  conversationCustomAttributes,
}) => {
  let script = '';
  if (user) {
    const userObject = {
      event: POST_MESSAGE_EVENTS.SET_USER,
      identifier: user.identifier || '',
      identifier_hash: user.identifier_hash || '',
      user,
    };
    script += createDomixPostMessage(userObject);
  }
  if (locale) {
    const localeObject = { event: POST_MESSAGE_EVENTS.SET_LOCALE, locale };
    script += createDomixPostMessage(localeObject);
  }
  if (customAttributes) {
    const attributeObject = {
      event: POST_MESSAGE_EVENTS.SET_CUSTOM_ATTRIBUTES,
      customAttributes,
    };
    script += createDomixPostMessage(attributeObject);
  }
  if (conversationCustomAttributes) {
    const conversationAttributeObject = {
      event: POST_MESSAGE_EVENTS.SET_CONVERSATION_CUSTOM_ATTRIBUTES,
      customAttributes: conversationCustomAttributes,
    };
    script += createDomixPostMessage(conversationAttributeObject);
  }
  if (colorScheme) {
    const themeObject = { event: POST_MESSAGE_EVENTS.SET_COLOR_SCHEME, darkMode: colorScheme };
    script += createDomixPostMessage(themeObject);
  }
  return script;
};

export const generateSetUserScript = (identifierOrUser, user) => {
  let identifier = identifierOrUser;
  let userData = user;
  if (!userData && typeof identifierOrUser === 'object') {
    userData = identifierOrUser;
    identifier = identifierOrUser.identifier;
  }
  const userObject = {
    event: POST_MESSAGE_EVENTS.SET_USER,
    identifier: identifier || '',
    identifier_hash: (userData && userData.identifier_hash) || '',
    user: userData,
  };
  return createDomixPostMessage(userObject);
};

export const generateSetCustomAttributesScript = (customAttributes) => {
  const attributeObject = {
    event: POST_MESSAGE_EVENTS.SET_CUSTOM_ATTRIBUTES,
    customAttributes,
  };
  return createDomixPostMessage(attributeObject);
};

export const generateSetConversationCustomAttributesScript = (conversationCustomAttributes) => {
  const conversationAttributeObject = {
    event: POST_MESSAGE_EVENTS.SET_CONVERSATION_CUSTOM_ATTRIBUTES,
    customAttributes: conversationCustomAttributes,
  };
  return createDomixPostMessage(conversationAttributeObject);
};

export const generateSetLocaleScript = (locale) => {
  const localeObject = { event: POST_MESSAGE_EVENTS.SET_LOCALE, locale };
  return createDomixPostMessage(localeObject);
};

export const generateSetColorSchemeScript = (colorScheme) => {
  const themeObject = { event: POST_MESSAGE_EVENTS.SET_COLOR_SCHEME, darkMode: colorScheme };
  return createDomixPostMessage(themeObject);
};

export const generateSendMessageScript = (content) => {
  const sendMessageObject = {
    event: POST_MESSAGE_EVENTS.SEND_MESSAGE,
    content,
  };
  return createDomixPostMessage(sendMessageObject);
};

export const generateResetScript = () => {
  const resetObject = {
    event: POST_MESSAGE_EVENTS.RESET,
  };
  return createDomixPostMessage(resetObject);
};

export const storeHelper = {
  getCookie: async () => {
    const cookie = await AsyncStorage.getItem('cwCookie');
    return cookie;
  },
  storeCookie: async (value) => {
    await AsyncStorage.setItem('cwCookie', value);
  },
  removeCookie: async () => {
    await AsyncStorage.removeItem('cwCookie');
  },
};

export const findColors = ({ colorScheme, appColorScheme }) => {
  let headerBackgroundColor = COLOR_WHITE;
  let mainBackgroundColor = BG_COLOR_WHITE;

  if (colorScheme === 'dark' || (colorScheme === 'auto' && appColorScheme === 'dark')) {
    headerBackgroundColor = BG_COLOR_DARK;
    mainBackgroundColor = BG_COLOR_DARK;
  } else if (colorScheme === 'auto' && appColorScheme === 'light') {
    headerBackgroundColor = COLOR_WHITE;
    mainBackgroundColor = BG_COLOR_WHITE;
  }

  return {
    headerBackgroundColor,
    mainBackgroundColor,
  };
};
