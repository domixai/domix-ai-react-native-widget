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
    
    const { Platform } = require('react-native');
    let DeviceInfo;
    try {
      const module = require('react-native-device-info');
      DeviceInfo = module ? (module.default || module) : null;
    } catch (e) {
      console.warn('Domix SDK: react-native-device-info not found, falling back to basic platform info');
    }

    const sdkVersion = '0.0.37';
    let deviceModel = Platform.OS === 'ios' ? (Platform.isPad ? 'iPad' : 'iPhone') : 'Android Device';
    let manufacturer = Platform.OS === 'ios' ? 'Apple' : 'Android';
    let brand = Platform.OS === 'ios' ? 'Apple' : 'Android';
    let appVersion = '1.0.0';
    let appBuildNumber = '1';
    let uniqueId = 'unknown';

    if (DeviceInfo) {
      try {
        deviceModel = DeviceInfo.getModel() || deviceModel;
        manufacturer = DeviceInfo.getManufacturerSync() || manufacturer;
        brand = DeviceInfo.getBrand() || brand;
        appVersion = DeviceInfo.getVersion() || appVersion;
        appBuildNumber = DeviceInfo.getBuildNumber() || appBuildNumber;
        uniqueId = DeviceInfo.getUniqueIdSync() || uniqueId;
      } catch (err) {
        console.warn('Domix SDK: Error fetching device info', err);
      }
    }

    const browserAttributes = {
      device_name: deviceModel,
      browser_name: 'React Native SDK',
      browser_version: sdkVersion,
      platform_name: Platform.OS === 'ios' ? 'iOS' : 'Android',
      platform_version: String(Platform.Version),
    };
    const osAttributes = {
      name: Platform.OS === 'ios' ? 'iOS' : 'Android',
      version: String(Platform.Version),
    };
    
    const deviceCustomAttributes = {
      sdk_version: sdkVersion,
      app_version: appVersion,
      app_build: appBuildNumber,
      platform: Platform.OS,
      os_version: String(Platform.Version),
      manufacturer: manufacturer,
      brand: brand,
      model: deviceModel,
      device_id: uniqueId,
      is_tablet: Platform.isPad || false,
    };

    const response = await fetch(`${this.baseUrl}/api/v1/widget/config?website_token=${this.websiteToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_id: savedToken || undefined,
        contact: contact ? {
          name: contact.name,
          email: contact.email,
          identifier: contact.identifier ? String(contact.identifier) : undefined,
          identifier_hash: contact.identifier_hash,
          phone_number: contact.phone_number,
          custom_attributes: {
            ...contact.custom_attributes,
            ...deviceCustomAttributes,
          },
          additional_attributes: {
            browser: browserAttributes,
            os: osAttributes,
            ...deviceCustomAttributes,
          }
        } : undefined,
        additional_attributes: {
          browser: browserAttributes,
          os: osAttributes,
          ...deviceCustomAttributes,
        }
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

  async setUser(user) {
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

    if (files.length > 0) {
      const formData = new FormData();
      formData.append('message[content]', content || '');
      formData.append('message[timestamp]', new Date().toISOString());
      
      if (contentAttributes && Object.keys(contentAttributes).length > 0) {
        formData.append('message[content_attributes]', JSON.stringify(contentAttributes));
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
          content_attributes: contentAttributes,
        },
      }),
    });

    return await response.json();
  }

  async updateMessage(messageId, payload) {
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/widget/inbox_members?website_token=${this.websiteToken}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': this.authToken,
      },
    });

    return await response.json();
  }

  async submitCSAT(messageId, rating, feedback) {
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
    if (!this.authToken) {
      throw new Error('SDK not initialized. Call init() first.');
    }

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
