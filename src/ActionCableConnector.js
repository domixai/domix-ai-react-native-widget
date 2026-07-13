/* eslint-disable */

// CRITICAL: Polyfill MUST be defined before importing ActionCable
if (typeof global.addEventListener === 'undefined') {
  global.addEventListener = () => {};
}
if (typeof global.removeEventListener === 'undefined') {
  global.removeEventListener = () => {};
}

import { createConsumer } from '@rails/actioncable';

class ActionCableConnector {
  constructor() {
    this.consumer = null;
    this.subscription = null;
    this.onMessageCreated = null;
    this.onMessageUpdated = null;
    this.onPresenceUpdate = null;
    this.onConversationUpdated = null;
    this.onTypingOn = null;
    this.onTypingOff = null;
    this.onContactMerged = null;
    this.onConversationCreated = null;
    this.disconnectTimeout = null;
    this.currentPubsubToken = null;
  }

  connect(baseUrl, pubsubToken, callbacks) {
    this.onMessageCreated = callbacks.onMessageCreated;
    this.onMessageUpdated = callbacks.onMessageUpdated;
    this.onPresenceUpdate = callbacks.onPresenceUpdate;
    this.onConversationUpdated = callbacks.onConversationUpdated;
    this.onTypingOn = callbacks.onTypingOn;
    this.onTypingOff = callbacks.onTypingOff;
    this.onContactMerged = callbacks.onContactMerged;
    this.onConversationCreated = callbacks.onConversationCreated;

    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    // Prevent reconnect loop if already connected to the same token
    if (this.consumer && this.currentPubsubToken === pubsubToken) {
      return;
    }

    this.currentPubsubToken = pubsubToken;

    const cableUrl = `${baseUrl.replace('https', 'wss').replace('http', 'ws')}/cable?pubsub_token=${pubsubToken}`;
    
    if (this.consumer) {
      this.forceDisconnect();
    }

    this.consumer = createConsumer(cableUrl);
    
    this.subscription = this.consumer.subscriptions.create(
      {
        channel: 'RoomChannel',
        pubsub_token: pubsubToken,
      },
      {
        connected: () => {
          console.log('Domix SDK: ActionCable connected');
        },
        disconnected: () => {
          console.log('Domix SDK: ActionCable disconnected');
        },
        received: (data) => {
          this.handleReceived(data);
        },
      }
    );
  }

  handleReceived(data) {
    // Sometimes the data is wrapped in a 'message' key, sometimes it's direct
    const event = data.event;
    const eventData = data.message || data.data || data;
    
    console.log(`Domix SDK: Received real-time event: ${event}`, eventData);

    if (!event) return;

    switch (event) {
      case 'message.created':
        if (this.onMessageCreated) this.onMessageCreated(eventData);
        break;
      case 'message.updated':
        if (this.onMessageUpdated) this.onMessageUpdated(eventData);
        break;
      case 'presence.update':
        if (this.onPresenceUpdate) this.onPresenceUpdate(eventData);
        break;
      case 'conversation.status_changed':
      case 'conversation.updated':
        if (this.onConversationUpdated) this.onConversationUpdated(eventData);
        break;
      case 'conversation.typing_on':
        if (this.onTypingOn) this.onTypingOn(eventData);
        break;
      case 'conversation.typing_off':
        if (this.onTypingOff) this.onTypingOff(eventData);
        break;
      case 'conversation.created':
        if (this.onConversationCreated) this.onConversationCreated(eventData);
        break;
      case 'contact.merged':
        if (this.onContactMerged) this.onContactMerged(eventData);
        break;
      default:
        break;
    }
  }

  sendTyping(status) {
    if (this.subscription) {
      this.subscription.perform('typing_on' === status ? 'typing_on' : 'typing_off');
    }
  }

  updatePresence() {
    if (this.subscription) {
      this.subscription.perform('update_presence');
    }
  }

  disconnect() {
    // Debounce disconnect to prevent rapid reconnect loops
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
    }
    this.disconnectTimeout = setTimeout(() => {
      this.forceDisconnect();
      this.disconnectTimeout = null;
    }, 5000); // 5 seconds delay
  }

  forceDisconnect() {
    try {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
      if (this.consumer) {
        this.consumer.disconnect();
        this.consumer = null;
      }
      this.currentPubsubToken = null;
    } catch (e) {
      console.warn('Domix SDK: ActionCable disconnect error', e);
    }
  }
}

export default new ActionCableConnector();
