import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BG_COLOR_WHITE,
  BG_COLOR_DARK,
  COLOR_WHITE,
  DOMIX_PREFIX,
  WIDGET_MESSAGE_PREFIXES,
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
  const messageString = `${DOMIX_PREFIX}${JSON.stringify(object)}`;
  const jsonString = JSON.stringify(messageString);
  const scriptContent = `
    (function() {
      try {
        var msg = ${jsonString};
        console.log('DOMIX_RN_BRIDGE_SENDING:', msg);
        window.postMessage(msg, '*');
        if (window.parent && window.parent !== window) {
           window.parent.postMessage(msg, '*');
        }
      } catch (err) {
        console.error('DOMIX_RN_BRIDGE_ERROR:', err);
      }
    })();
  `;
  return scriptContent;
};

export const isWidgetMessage = (data) =>
  typeof data === 'string' && WIDGET_MESSAGE_PREFIXES.some((prefix) => data.startsWith(prefix));

export const getMessage = (data) => {
  if (typeof data !== 'string') return '';
  const matchedPrefix = WIDGET_MESSAGE_PREFIXES.find((prefix) => data.startsWith(prefix));
  if (matchedPrefix) {
    return data.slice(matchedPrefix.length);
  }
  // Keep backward compatibility for any payload that still uses a single known prefix.
  return data.replace(DOMIX_PREFIX, '');
};

export const generateScripts = ({
  colorScheme,
  user,
  locale,
  customAttributes,
  conversationCustomAttributes,
}) => {
  let script = '';
  if (user) {
    const { identifier, identifier_hash, ...userAttributes } = user;
    const userObject = {
      event: POST_MESSAGE_EVENTS.SET_USER,
      identifier: identifier || '',
      user: {
        ...userAttributes,
        identifier_hash: identifier_hash || '',
      },
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
  const {
    identifier: id,
    identifier_hash: hash,
    ...userAttributes
  } = userData || {};

  const userObject = {
    event: POST_MESSAGE_EVENTS.SET_USER,
    eventName: POST_MESSAGE_EVENTS.SET_USER,
    identifier: identifier || id || '',
    identifier_hash: hash || (userData && userData.identifier_hash) || '', // Top level for some widget versions
    user: {
      ...userAttributes,
      identifier_hash: hash || (userData && userData.identifier_hash) || '', // Nested level
      user_hash: hash || (userData && userData.identifier_hash) || '', // Legacy alias
    },
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
  console.log('DOMIX_UTILS: generating send-message script for:', content);
  const sendMessageObject = {
    event: POST_MESSAGE_EVENTS.SEND_MESSAGE,
    eventName: POST_MESSAGE_EVENTS.SEND_MESSAGE,
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

export const generateToggleOpenScript = (isOpen) => {
  const toggleObject = {
    event: POST_MESSAGE_EVENTS.TOGGLE_OPEN,
    isOpen,
  };
  return createDomixPostMessage(toggleObject);
};

export const generateAutoStartConversationScript = () => `
  (function() {
    try {
      var labels = ['start conversation', 'continue conversation', 'start chat', 'ابدأ المحادثة', 'بدء المحادثة'];

      var isMessagesRoute = function() {
        return (window.location.hash || '').indexOf('/messages') !== -1;
      };

      var goToMessagesRoute = function() {
        if (!isMessagesRoute()) {
          window.location.hash = '#/messages';
        }
        return isMessagesRoute();
      };

      var clickStartConversation = function() {
        if (window.__domixAutoStartConversationDone) {
          return true;
        }

        var elements = document.querySelectorAll('button, a, [role="button"], span, div');
        for (var i = 0; i < elements.length; i += 1) {
          var el = elements[i];
          var text = (el.textContent || '').trim().toLowerCase();
          if (!text) continue;

          var matched = false;
          for (var j = 0; j < labels.length; j += 1) {
            if (text.indexOf(labels[j]) !== -1) {
              matched = true;
              break;
            }
          }
          if (!matched) continue;

          var clickable = el.closest('button, a, [role="button"]') || el;
          if (!clickable) continue;

          clickable.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
          );
          if (typeof clickable.click === 'function') {
            clickable.click();
          }
          window.__domixAutoStartConversationDone = true;
          return true;
        }
        return false;
      };

      var hideStartConversationButtons = function() {
        var elements = document.querySelectorAll('button, a, [role="button"], span, div');
        for (var i = 0; i < elements.length; i += 1) {
          var el = elements[i];
          var text = (el.textContent || '').trim().toLowerCase();
          if (!text) continue;

          var matched = false;
          for (var j = 0; j < labels.length; j += 1) {
            if (text.indexOf(labels[j]) !== -1) {
              matched = true;
              break;
            }
          }
          if (!matched) continue;

          var clickable = el.closest('button, a, [role="button"]') || el;
          if (clickable && clickable.style) {
            clickable.style.display = 'none';
          }
        }
      };

      var run = function() {
        hideStartConversationButtons();

        if (isMessagesRoute()) {
          window.__domixAutoStartConversationDone = true;
          return;
        }

        if (goToMessagesRoute()) {
          window.__domixAutoStartConversationDone = true;
          return;
        }

        if (clickStartConversation()) {
          return;
        }

        var attempts = 0;
        var interval = setInterval(function() {
          attempts += 1;
          hideStartConversationButtons();
          if (isMessagesRoute() || clickStartConversation()) {
            window.__domixAutoStartConversationDone = true;
            clearInterval(interval);
            return;
          }
          goToMessagesRoute();
          if (attempts >= 25) {
            clearInterval(interval);
          }
        }, 300);

        var observer = new MutationObserver(function() {
          hideStartConversationButtons();
          if (isMessagesRoute() || clickStartConversation()) {
            window.__domixAutoStartConversationDone = true;
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        setTimeout(function() {
          observer.disconnect();
        }, 12000);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
      } else {
        run();
      }
    } catch (err) {
      console.log('DOMIX_AUTO_START_CONVERSATION_ERROR', err);
    }
  })();
  true;
`;

export const generateHistorySyncProbeScript = () => `
  (function() {
    try {
      if (
        window.__domixHistoryProbeInstalled &&
        typeof window.__domixHistoryProbeRestart === 'function'
      ) {
        window.__domixHistoryProbeRestart();
        return;
      }

      if (window.__domixHistoryProbeInstalled) {
        return;
      }
      window.__domixHistoryProbeInstalled = true;

      var PREFIX = '${DOMIX_PREFIX}';
      var done = false;
      var intervals = [];
      var observers = [];
      var sawHistoryRequest = false;
      var timeoutId = null;

      var emit = function(payload) {
        try {
          var message = PREFIX + JSON.stringify(payload);
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(message);
          }
          if (typeof window.postMessage === 'function') {
            window.postMessage(message, '*');
          }
        } catch (e) {}
      };

      var cleanup = function() {
        for (var i = 0; i < intervals.length; i += 1) {
          clearInterval(intervals[i]);
        }
        intervals = [];
        for (var j = 0; j < observers.length; j += 1) {
          observers[j].disconnect();
        }
        observers = [];
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      var markDone = function(reason, url) {
        if (done) {
          return;
        }
        done = true;
        cleanup();
        emit({
          event: 'history-sync-complete',
          data: { reason: reason || 'unknown', url: url || '' },
        });
      };

      var parseJSONSafe = function(text) {
        try {
          return JSON.parse(text);
        } catch (e) {
          return null;
        }
      };

      var hasHistoryData = function(value, depth) {
        if (depth > 6 || value == null) {
          return false;
        }

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return false;
          }
          for (var i = 0; i < value.length; i += 1) {
            if (hasHistoryData(value[i], depth + 1)) {
              return true;
            }
          }
          return false;
        }

        if (typeof value === 'object') {
          if (
            (typeof value.content === 'string' && value.content.trim().length > 0) ||
            value.message_type ||
            value.created_at ||
            typeof value.private === 'boolean'
          ) {
            return true;
          }

          var keysToInspect = [
            'messages',
            'conversation',
            'conversations',
            'payload',
            'data',
            'result',
          ];

          for (var j = 0; j < keysToInspect.length; j += 1) {
            if (hasHistoryData(value[keysToInspect[j]], depth + 1)) {
              return true;
            }
          }
        }

        return false;
      };

      var hashHasMessagesRoute = function() {
        return (window.location.hash || '').indexOf('/messages') !== -1;
      };

      var isHistoryEndpoint = function(url) {
        if (!url || typeof url !== 'string') {
          return false;
        }
        var normalized = url.toLowerCase();
        var isWidgetApi =
          normalized.indexOf('/api/v1/widget/') !== -1 ||
          normalized.indexOf('/public/api/v1/inboxes/') !== -1;
        var hasConversationData =
          normalized.indexOf('/messages') !== -1 ||
          normalized.indexOf('/conversations') !== -1;
        return isWidgetApi && hasConversationData;
      };

      var processHistoryResponse = function(source, url, status, bodyText) {
        if (!isHistoryEndpoint(url)) {
          return;
        }
        sawHistoryRequest = true;

        if (status === 401 || status === 403 || status === 422) {
          emit({
            event: 'history-sync-error',
            data: {
              reason: 'auth-or-validation-error',
              source: source,
              url: url,
              status: status,
            },
          });
          return;
        }

        if (!(status >= 200 && status < 400)) {
          return;
        }

        var body = parseJSONSafe(bodyText || '');
        if (body && hasHistoryData(body, 0)) {
          markDone('history-data-' + source, url);
        } else {
          emit({
            event: 'history-sync-no-data',
            data: {
              reason: 'empty-history-payload',
              source: source,
              url: url,
              status: status,
            },
          });
        }
      };

      var checkConversationUIReady = function() {
        if (!hashHasMessagesRoute()) {
          return false;
        }
        var hasMessageBubble =
          !!document.querySelector('.chat-bubble.user, .chat-bubble.agent, .chat-bubble');

        if (hasMessageBubble) {
          markDone('messages-ui-has-bubble', window.location.href);
          return true;
        }
        return false;
      };

      var startProbe = function() {
        cleanup();
        done = false;
        sawHistoryRequest = false;

        var routeInterval = setInterval(function() {
          if (hashHasMessagesRoute()) {
            checkConversationUIReady();
          }
        }, 300);
        intervals.push(routeInterval);

        var uiObserver = new MutationObserver(function() {
          checkConversationUIReady();
        });
        uiObserver.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        observers.push(uiObserver);

        timeoutId = setTimeout(function() {
          if (!done) {
            cleanup();
            emit({
              event: 'history-sync-timeout',
              data: {
                reason: 'timeout-waiting-history-data',
                sawHistoryRequest: sawHistoryRequest,
              },
            });
          }
        }, 20000);
      };

      if (typeof window.fetch === 'function') {
        var originalFetch = window.fetch.bind(window);
        window.fetch = function(input, init) {
          var requestUrl = '';
          if (typeof input === 'string') {
            requestUrl = input;
          } else if (input && input.url) {
            requestUrl = input.url;
          }
          return originalFetch(input, init).then(function(response) {
            var responseUrl = (response && response.url) || requestUrl;
            if (isHistoryEndpoint(responseUrl) && response) {
              response
                .clone()
                .text()
                .then(function(text) {
                  processHistoryResponse('fetch', responseUrl, response.status, text);
                })
                .catch(function() {
                  processHistoryResponse('fetch', responseUrl, response.status, '');
                });
            }
            return response;
          });
        };
      }

      if (window.XMLHttpRequest && window.XMLHttpRequest.prototype) {
        var originalOpen = window.XMLHttpRequest.prototype.open;
        var originalSend = window.XMLHttpRequest.prototype.send;

        window.XMLHttpRequest.prototype.open = function(method, url) {
          this.__domixRequestUrl = url || '';
          return originalOpen.apply(this, arguments);
        };

        window.XMLHttpRequest.prototype.send = function() {
          this.addEventListener('load', function() {
            processHistoryResponse(
              'xhr',
              this.__domixRequestUrl || '',
              this.status,
              this.responseText || ''
            );
          });
          return originalSend.apply(this, arguments);
        };
      }

      window.__domixHistoryProbeRestart = startProbe;
      startProbe();
    } catch (err) {
      try {
        var message = '${DOMIX_PREFIX}' + JSON.stringify({
          event: 'history-sync-error',
          data: { message: String(err) },
        });
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(message);
        } else if (typeof window.postMessage === 'function') {
          window.postMessage(message, '*');
        }
      } catch (e) {}
    }
  })();
  true;
`;

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
