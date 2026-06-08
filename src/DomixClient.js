/* eslint-disable */
import { storeHelper } from './utils';

class DomixClient {
  constructor() {
    this.websiteToken = null;
    this.baseUrl = null;
    this.authToken = null;
    this.config = null;
  }

  async init({ websiteToken, baseUrl, contact }) {
    this.websiteToken = websiteToken;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Try to load existing auth token to resume session
    const savedToken = await storeHelper.getCookie();
    
    console.log('Domix SDK: Initializing with', { 
      websiteToken, 
      baseUrl, 
      contact,
      hasSavedToken: !!savedToken 
    });
    
    const response = await fetch(`${this.baseUrl}/api/v1/widget/config?website_token=${this.websiteToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website_token: websiteToken,
        identifier: contact?.identifier ? String(contact.identifier) : undefined,
        identifier_hash: contact?.identifier_hash,
        contact: contact ? {
          name: contact.name,
          email: contact.email,
          identifier: contact.identifier ? String(contact.identifier) : undefined,
          identifier_hash: contact.identifier_hash,
          phone_number: contact.phone_number,
          custom_attributes: contact.custom_attributes,
          additional_attributes: contact.additional_attributes,
        } : undefined
      }),
    });

    const data = await response.json();
    console.log('Domix SDK: Config fetched', data);
    this.config = {
      ...data.website_channel_config,
      global_config: data.global_config,
      contact: data.contact,
    };
    
    // The auth_token from server is our source_id
    this.authToken = this.config.auth_token;
    
    if (this.authToken) {
      await storeHelper.storeCookie(this.authToken);
    }
    
    return this.config;
  }

  async ensureAuthToken() {
    if (!this.authToken) {
      const savedToken = await storeHelper.getCookie();
      if (savedToken) {
        this.authToken = savedToken;
      }
    }
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }
  }

  async setUser(user) {
    await this.ensureAuthToken();

    console.log('Domix SDK: Setting user', user);
    const response = await fetch(`${this.baseUrl}/api/v1/widget/contact/set_user?website_token=${this.websiteToken}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({
        ...user,
        identifier: user.identifier ? String(user.identifier) : undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Domix SDK: setUser failed', data);
      throw new Error(data.error || 'Failed to set user');
    }

    console.log('Domix SDK: setUser success', data);
    return data;
  }

  async updateContact(payload) {
    await this.ensureAuthToken();

    const response = await fetch(`${this.baseUrl}/api/v1/widget/contact?website_token=${this.websiteToken}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  }

  async fetchMessages(before = null) {
    await this.ensureAuthToken();

    const url = before 
      ? `${this.baseUrl}/api/v1/widget/messages?website_token=${this.websiteToken}&before=${before}`
      : `${this.baseUrl}/api/v1/widget/messages?website_token=${this.websiteToken}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': this.authToken,
      },
    });

    const data = await response.json();
    return data;
  }

  async sendMessage(content, contentAttributes = {}, files = []) {
    await this.ensureAuthToken();
    const attrs = contentAttributes || {};
    const replyToId = attrs.external_reply_id || attrs.in_reply_to;

    // Safety check: only send reply_to if it is a valid database ID (numeric)
    const isNumericId = replyToId && /^\d+$/.test(String(replyToId));
    const cleanReplyToId = isNumericId ? parseInt(replyToId, 10) : null;

    if (files.length > 0) {
      const formData = new FormData();
      formData.append('message[content]', content || '');
      formData.append('message[timestamp]', new Date().toISOString());
      
      if (cleanReplyToId) {
        formData.append('message[reply_to]', String(cleanReplyToId));
      }
      
      if (Object.keys(attrs).length > 0) {
        formData.append('message[content_attributes]', JSON.stringify(attrs));
      }
      
      files.forEach((file) => {
        formData.append('message[attachments][]', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      });

      const response = await fetch(`${this.baseUrl}/api/v1/widget/messages?website_token=${this.websiteToken}`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': this.authToken,
        },
        body: formData,
      });
      return await response.json();
    }

    const response = await fetch(`${this.baseUrl}/api/v1/widget/messages?website_token=${this.websiteToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({
        message: {
          content,
          timestamp: new Date().toISOString(),
          content_attributes: attrs,
          reply_to: cleanReplyToId,
        },
      }),
    });

    return await response.json();
  }

  async updateMessage(messageId, payload) {
    await this.ensureAuthToken();

    const response = await fetch(`${this.baseUrl}/api/v1/widget/messages/${messageId}?website_token=${this.websiteToken}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  }

  async sendInteractiveResponse(messageId, value, email = null) {
    await this.ensureAuthToken();

    // In Domix backend, interactive responses are handled by PATCHing the message with submitted_values
    const url = `${this.baseUrl}/api/v1/widget/messages/${messageId}?website_token=${this.websiteToken}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({
        contact: email ? { email } : undefined,
        message: {
          submitted_values: [
            {
              value: value,
              title: value,
            }
          ]
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Domix SDK: sendInteractiveResponse error', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  async fetchAgents() {
    await this.ensureAuthToken();

    const response = await fetch(`${this.baseUrl}/api/v1/widget/inbox_members?website_token=${this.websiteToken}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': this.authToken,
      },
    });

    return await response.json();
  }

  async submitCSAT(messageId, rating, feedback) {
    await this.ensureAuthToken();

    const response = await fetch(`${this.baseUrl}/api/v1/widget/messages/${messageId}?website_token=${this.websiteToken}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
      body: JSON.stringify({
        website_token: this.websiteToken,
        contact: { email: null },
        message: {
          submitted_values: {
            csat_survey_response: {
              rating,
              feedback_message: feedback,
            },
          },
        },
      }),
    });

    return await response.json();
  }

  async resolveConversation() {
    await this.ensureAuthToken();

    const response = await fetch(`${this.baseUrl}/api/v1/widget/conversations/toggle_status?website_token=${this.websiteToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.authToken,
      },
    });

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : { success: true };
    } catch (e) {
      return { success: true };
    }
  }

  async updateLastSeen() {
    if (!this.authToken) {
      const savedToken = await storeHelper.getCookie();
      if (savedToken) {
        this.authToken = savedToken;
      }
    }
    if (!this.authToken) return;

    try {
      await fetch(`${this.baseUrl}/api/v1/widget/conversations/update_last_seen?website_token=${this.websiteToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.authToken,
        },
      });
    } catch (err) {
      // Presence updates are non-critical, ignore errors
    }
  }
}

export default new DomixClient();
