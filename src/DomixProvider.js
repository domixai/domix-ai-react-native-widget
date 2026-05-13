/* eslint-disable */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import DomixClient from './DomixClient';
import ActionCableConnector from './ActionCableConnector';
import { storeHelper } from './utils';
import { isOnline, findNextAvailableSlot } from './helpers/AvailabilityHelper';

const DomixContext = createContext();

// UI Strings for Localization
const I18N = {
  en: {
    placeholder: 'Type your message',
    welcome_online: 'We are online',
    welcome_offline: 'We are away at the moment',
    continue_chat: 'Continue conversation',
    start_chat: 'Start Conversation',
    typically_replies_in_a_few_minutes: 'Typically replies in a few minutes',
    typically_replies_in_a_few_hours: 'Typically replies in few hours',
    typically_replies_in_a_day: 'Typically replies in a day',
    out_of_office_disclaimer: 'Our team is currently away. We will get back to you as soon as possible.',
    back_online_tomorrow: 'We will be back online tomorrow',
    back_online_on: 'We will be back online on',
    back_online_in: 'We will be back online in',
    end_conversation: 'End Conversation',
    day_0: 'Sunday', day_1: 'Monday', day_2: 'Tuesday', day_3: 'Wednesday', day_4: 'Thursday', day_5: 'Friday', day_6: 'Saturday',
  },
  ar: {
    placeholder: 'اكتب رسالتك هنا',
    welcome_online: 'نحن متصلون الآن',
    welcome_offline: 'نحن غير متاحين حالياً',
    continue_chat: 'متابعة المحادثة',
    start_chat: 'بدء محادثة جديدة',
    typically_replies_in_a_few_minutes: 'عادة ما نرد في غضون دقائق',
    typically_replies_in_a_few_hours: 'عادة ما نرد في غضون ساعات',
    typically_replies_in_a_day: 'عادة ما نرد في غضون يوم',
    out_of_office_disclaimer: 'فريقنا غير متاح حالياً. سنقوم بالرد عليك في أقرب وقت ممكن.',
    back_online_tomorrow: 'سنعود للخدمة غداً',
    back_online_on: 'سنعود للخدمة يوم',
    back_online_in: 'سنعود للخدمة خلال',
    end_conversation: 'إنهاء المحادثة',
    day_0: 'الأحد', day_1: 'الاثنين', day_2: 'الثلاثاء', day_3: 'الأربعاء', day_4: 'الخميس', day_5: 'الجمعة', day_6: 'السبت',
  }
};

export const DomixProvider = ({ 
  children, 
  websiteToken, 
  baseUrl, 
  initialUser, 
  locale = 'en', 
  colorScheme = 'light',
  customAttributes = {},
  conversationCustomAttributes = {},
  skipWelcome = false,
  isVisible
}) => {
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitializing = React.useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // Agent typing status
  const [typingUserName, setTypingUserName] = useState('');
  const typingTimer = React.useRef(null);

  const t = useMemo(() => I18N[locale] || I18N.en, [locale]);

  const handleNewMessage = useCallback((message) => {
    setMessages(prev => {
      // 1. Check if message already exists by ID
      if (prev.find(m => m.id === message.id)) return prev;

      // 2. Check if this is an echo of a message we just sent (optimistic update)
      // Look for a message with 'sending' status and same content
      const sendingIndex = prev.findIndex(m => m.status === 'sending' && m.content === message.content);
      
      if (sendingIndex !== -1) {
        // Replace the 'sending' message with the real one from server
        const newMessages = [...prev];
        newMessages[sendingIndex] = { ...message, status: 'sent' };
        return newMessages;
      }

      // 3. Otherwise, just append the new message
      return [...prev, message];
    });
  }, []);

  const handleUpdateMessage = useCallback((updatedMessage) => {
    setMessages(prev => 
      prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    );
  }, []);

  const handleConversationUpdate = useCallback((data) => {
    console.log('Domix SDK: Conversation updated', data);
    setConversation(data);
  }, []);

  const fetchHistory = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log('Domix SDK: Fetching history...', DomixClient.authToken);
    if (!DomixClient.authToken) return;
    
    // Security Check: Only fetch history if we have a hash OR an existing session
    const hasHash = !!initialUser?.identifier_hash;
    const hasExistingSession = !!DomixClient.authToken;
    
    if (!hasHash && !hasExistingSession) {
      console.log('Domix SDK: History fetch skipped (No identifier_hash and no active session)');
      setMessages([]);
      return;
    }

    try {
      const data = await DomixClient.fetchMessages();
      const newMessages = data.payload || [];
      setMessages(prev => {
        const pendingMessages = prev.filter(m => m.status === 'sending' || m.status === 'failed');
        const serverIds = new Set(newMessages.map(m => m.id));
        const filteredPending = pendingMessages.filter(m => !serverIds.has(m.id));
        return [...newMessages, ...filteredPending];
      });
      if (newMessages.length < 20) setAllMessagesLoaded(true);
    } catch (err) {
      console.error('Domix SDK: History fetch error', err);
    }
  }, [initialUser]);

  const fetchMoreMessages = useCallback(async () => {
    if (loadingMore || allMessagesLoaded || !DomixClient.authToken || messages.length === 0) return;
    
    try {
      setLoadingMore(true);
      const oldestMessageId = messages[0].id;
      const data = await DomixClient.fetchMessages(oldestMessageId);
      const olderMessages = data.payload || [];
      
      if (olderMessages.length === 0) {
        setAllMessagesLoaded(true);
      } else {
        setMessages(prev => [...olderMessages, ...prev]);
        if (olderMessages.length < 20) setAllMessagesLoaded(true);
      }
    } catch (err) {
      console.error('Domix SDK: Load more error', err);
    } finally {
      setLoadingMore(false);
    }
  }, [messages, loadingMore, allMessagesLoaded]);

  const identifyUser = useCallback(async (userData, retryCount = 0) => {
    if (!DomixClient.authToken) return;
    try {
      const payload = {
        ...userData,
        custom_attributes: {
          ...customAttributes,
          ...(userData.custom_attributes || {})
        }
      };

      const contact = await DomixClient.setUser(payload);
      setUser(contact);
    } catch (err) {
      // If it's a 404 and we have retries left, wait and try again
      if (err.message.includes('Resource could not be found') && retryCount < 2) {
        console.warn(`Domix SDK: Identify failed (404), retrying in 1s... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return identifyUser(userData, retryCount + 1);
      }
      console.warn('Domix SDK: Identify error (non-fatal)', err);
    } finally {
      if (retryCount === 0 || !userData) { // Only fetch history on first call or final failure
        await fetchHistory();
      }
    }
  }, [customAttributes, fetchHistory]); // REMOVED 'user' dependency to break the loop

  const initSDK = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    
    try {
      setLoading(true);
      const configData = await DomixClient.init({ 
        websiteToken, 
        baseUrl, 
        contact: initialUser 
      });
      setConfig(configData);
      if (configData.contact) {
        setUser(configData.contact);
      }
      setIsClientReady(true);
      
      const agentsData = await DomixClient.fetchAgents();
      const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData?.payload || []);
      setAgents(agentsList);

      if (initialUser) {
        await identifyUser(initialUser);
      } else {
        await fetchHistory();
      }

      if (configData.contact?.pubsub_token) {
        DomixClient.updateLastSeen(); // Immediate update on init
        ActionCableConnector.connect(baseUrl, configData.contact.pubsub_token, {
          onMessageCreated: handleNewMessage,
          onMessageUpdated: handleUpdateMessage,
          onPresenceUpdate: (presenceData) => {
            if (!presenceData || !presenceData.users) return;
            const onlineUsers = presenceData.users;
            setAgents(prevAgents => {
              const updatedAgents = prevAgents.map(agent => {
                const status = onlineUsers[agent.id.toString()];
                if (status) return { ...agent, availability_status: status };
                return agent;
              }).sort((a, b) => {
                const aStatus = a.availability_status || 'offline';
                const bStatus = b.availability_status || 'offline';
                if (aStatus === 'online' && bStatus !== 'online') return -1;
                if (aStatus !== 'online' && bStatus === 'online') return 1;
                return 0;
              });
              return updatedAgents;
            });
          },
          onConversationUpdated: handleConversationUpdate,
          onTypingOn: (data) => {
            const name = data?.user?.name || data?.user?.available_name || data?.user?.display_name || 'Agent';
            setTypingUserName(name);
            setIsTyping(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => {
              setIsTyping(false);
              setTypingUserName('');
            }, 30000);
          },
          onTypingOff: () => {
            setIsTyping(false);
            setTypingUserName('');
            if (typingTimer.current) clearTimeout(typingTimer.current);
          },
          onConversationCreated: (data) => {
            console.log('Domix SDK: Conversation created', data);
            handleConversationUpdate(data);
          },
          onContactMerged: async (data) => {
            console.log('Domix SDK: Contact merged', data);
            if (data.pubsub_token) {
              await storeHelper.storeCookie(data.pubsub_token);
              // Re-connect with new token
              ActionCableConnector.connect(baseUrl, data.pubsub_token, {
                onMessageCreated: handleNewMessage,
                onMessageUpdated: handleUpdateMessage,
                onPresenceUpdate: (presenceData) => {
                  if (!presenceData || !presenceData.users) return;
                  const onlineUsers = presenceData.users;
                  setAgents(prevAgents => {
                    const updatedAgents = prevAgents.map(agent => {
                      const status = onlineUsers[agent.id.toString()];
                      if (status) return { ...agent, availability_status: status };
                      return agent;
                    });
                    return updatedAgents;
                  });
                },
                onConversationUpdated: handleConversationUpdate,
              });
            }
          }
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isInitializing.current = false;
    }
  }, [websiteToken, baseUrl, initialUser]); // Only depend on props
  
  useEffect(() => {
    // Initialize SDK as soon as possible (background init)
    if (!isClientReady && !isInitializing.current && websiteToken) {
      initSDK();
    }
  }, [websiteToken, isClientReady]);

  useEffect(() => {
    if (isVisible) {
      if (isClientReady && config?.contact?.pubsub_token) {
        // Reconnect if hidden before but now visible
        ActionCableConnector.connect(baseUrl, config.contact.pubsub_token, {
          onMessageCreated: handleNewMessage,
          onMessageUpdated: handleUpdateMessage,
          onPresenceUpdate: (presenceData) => {
            if (!presenceData || !presenceData.users) return;
            const onlineUsers = presenceData.users;
            setAgents(prevAgents => {
              const updatedAgents = prevAgents.map(agent => {
                const status = onlineUsers[agent.id.toString()];
                if (status) return { ...agent, availability_status: status };
                return agent;
              });
              return updatedAgents;
            });
          },
          onConversationUpdated: handleConversationUpdate,
          onTypingOn: (data) => {
            const name = data?.user?.name || data?.user?.available_name || data?.user?.display_name || 'Agent';
            setTypingUserName(name);
            setIsTyping(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => {
              setIsTyping(false);
              setTypingUserName('');
            }, 30000);
          },
          onTypingOff: () => {
            setIsTyping(false);
            setTypingUserName('');
            if (typingTimer.current) clearTimeout(typingTimer.current);
          },
          onConversationCreated: handleConversationUpdate,
          onContactMerged: async (data) => {
            if (data.pubsub_token) {
              await storeHelper.storeCookie(data.pubsub_token);
              ActionCableConnector.connect(baseUrl, data.pubsub_token, {
                onMessageCreated: handleNewMessage,
                onMessageUpdated: handleUpdateMessage,
              });
            }
          }
        });
        
        DomixClient.updateLastSeen();
        if (typeof ActionCableConnector.updatePresence === 'function') {
          ActionCableConnector.updatePresence();
        }
      }
    } else {
      // Hide widget -> Disconnect to be offline
      ActionCableConnector.disconnect();
    }

    // Set up presence heartbeat only if visible
    let presenceInterval;
    if (isVisible && isClientReady) {
      presenceInterval = setInterval(() => {
        DomixClient.updateLastSeen();
        if (typeof ActionCableConnector.updatePresence === 'function') {
          ActionCableConnector.updatePresence();
        }
      }, 15000); // 15 seconds
    }

    return () => {
      if (presenceInterval) clearInterval(presenceInterval);
    };
  }, [websiteToken, baseUrl, initialUser, isClientReady, isVisible, config?.contact?.pubsub_token]);

  const sendMessage = async (content, isRetryId = null, files = []) => {
    const tempId = isRetryId || `temp-${Date.now()}`;
    const pendingMsg = {
      id: tempId,
      content,
      message_type: 0,
      created_at: Math.floor(Date.now() / 1000),
      status: 'sending',
      attachments: files.map((f, i) => ({ 
        id: `temp-att-${Date.now()}-${i}`,
        file_type: f.type.startsWith('image') ? 'image' : 'file', 
        data_url: f.uri,
        file_name: f.name 
      })),
    };

    // Optimistically add to list (or update if retry)
    if (!isRetryId) {
      setMessages(prev => [...prev, pendingMsg]);
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
    }

    try {
      const contentAttributes = {};
      if (replyTo) {
        contentAttributes.external_reply_id = replyTo.id;
      }

      const data = await DomixClient.sendMessage(content, contentAttributes, files);
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, status: 'sent' } : m));
      setReplyTo(null);
      return data;
    } catch (err) {
      console.error('Domix SDK: Send message failed', err);
      // Update status to failed
      setMessages(prev => prev.map(m => m.id === tempId ? { ...pendingMsg, status: 'failed' } : m));
      throw err;
    }
  };

  const reset = async () => {
    try {
      setLoading(true);
      ActionCableConnector.disconnect();
      await storeHelper.clearAll(); // Clear all cached data
      setMessages([]);
      setConversation(null);
      setUser(null);
      // Re-initialize
      await initSDK();
    } catch (err) {
      console.error('Domix SDK: Reset session failed', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    config,
    messages,
    agents,
    conversation,
    loading,
    loadingMore,
    allMessagesLoaded,
    error,
    user,
    isOnline: isOnline(config),
    nextAvailableSlot: findNextAvailableSlot(config?.working_hours, config?.utc_off_set),
    updateContact: async (payload) => {
      try {
        const data = await DomixClient.updateContact(payload);
        setUser(prev => ({ ...prev, ...data }));
        return data;
      } catch (err) {
        console.error('Domix SDK: updateContact failed', err);
        throw err;
      }
    },
    updateMessage: async (messageId, payload) => {
      try {
        const data = await DomixClient.updateMessage(messageId, payload);
        return data;
      } catch (err) {
        console.error('Domix SDK: updateMessage failed', err);
        throw err;
      }
    },
    locale,
    colorScheme,
    t,
    isClientReady,
    baseUrl,
    sendMessage,
    sendInteractiveResponse: async (messageId, val) => {
      const tempId = `temp-res-${messageId}`;
      const pendingMsg = {
        id: tempId,
        content: val,
        message_type: 0,
        created_at: Math.floor(Date.now() / 1000),
        status: 'sending',
        isVirtualResponse: true
      };

      setMessages(prev => [...prev, pendingMsg]);

      try {
        const data = await DomixClient.sendInteractiveResponse(messageId, val, user?.email);
        // Update original message to show it's answered
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content_attributes: { ...m.content_attributes, submitted_values: [{ value: val, title: val }] } } : m));
        // Remove temp message because handleUpdateMessage or virtual injection will handle it
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return data;
      } catch (err) {
        console.error('Domix SDK: Interactive response error', err);
        // Fallback: Send as a regular message if interactive response fails
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return await sendMessage(val);
      }
    },
    identifyUser,
    fetchHistory,
    fetchMoreMessages,
    replyTo,
    setReplyTo,
    isTyping,
    typingUserName,
    sendTyping: (status) => {
      ActionCableConnector.sendTyping(status);
    },
    resolveConversation: async () => {
      try {
        const data = await DomixClient.resolveConversation();
        setConversation(prev => ({ ...prev, status: 'resolved' }));
        setReplyTo(null);
        return data;
      } catch (err) {
        console.error('Domix SDK: resolveConversation failed', err);
        throw err;
      }
    },
    reset,
  };

  return <DomixContext.Provider value={value}>{children}</DomixContext.Provider>;
};

export const useDomix = () => useContext(DomixContext);
