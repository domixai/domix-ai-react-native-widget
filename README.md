<h1>
domix-ai-react-native-widget
</h1>

![](https://img.shields.io/npm/v/domix-ai-react-native-widget?style=flat)
![](https://img.shields.io/npm/dt/domix-ai-react-native-widget.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
![](https://img.shields.io/npm/l/domix-ai-react-native-widget)

- **Supported Domix AI version:** 1.0.0+

<img src="screenshot.png" alt="screenshot" width="350">

### Installation

Install the library using either yarn or npm like so:

```sh
yarn add domix-ai-react-native-widget
```

OR

```sh
npm install --save domix-ai-react-native-widget
```

This library depends on [react-native-webview](https://www.npmjs.com/package/react-native-webview) and [async-storage](https://github.com/react-native-async-storage/async-storage). Please follow the instructions provided in the docs.

For local package development, the `/Example` app is linked to the package source with `file:..` and uses `Example/metro.config.js`. Start Expo with a clean cache after package changes:

```sh
cd Example
npm install
npm start -c
```

### iOS Installation

If you're using React Native versions > 60.0, it's relatively straightforward.

```sh
cd ios && pod install
```

### How to use

1. Create a website channel in Domix AI server.
2. Replace `websiteToken`.

```javascript
import React, { useState } from 'react';

import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';

import DomixAIWidget from 'domix-ai-react-native-widget';

const App = () => {
  const [showWidget, toggleWidget] = useState(false);
  const user = {
    identifier: 'john@gmail.com',
    name: 'John Samuel',
    avatar_url: '',
    email: 'john@gmail.com',
    identifier_hash: '',
  };
  const customAttributes = { accountId: 1, pricingPlan: 'paid', status: 'active' };
  const conversationCustomAttributes = { orderId: 1234, status: 'pending' };
  const websiteToken = 'WEBSITE_TOKEN';
  const baseUrl = 'https://chat.domix.ai';
  const locale = 'en';
  const colorScheme = 'dark';

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <TouchableOpacity style={styles.button} onPress={() => toggleWidget(true)}>
          <Text style={styles.buttonText}>Open widget</Text>
        </TouchableOpacity>
      </View>
      {showWidget && (
        <DomixAIWidget
          websiteToken={websiteToken}
          locale={locale}
          baseUrl={baseUrl}
          closeModal={() => toggleWidget(false)}
          isModalVisible={showWidget}
          user={user}
          customAttributes={customAttributes}
          conversationCustomAttributes={conversationCustomAttributes}
          colorScheme={colorScheme}
          appName="My App Name"
          appVersion="1.0.0"
          onEvent={(eventName, data) => {
            console.log(eventName, data);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    height: 48,
    marginTop: 32,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#1F93FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    paddingLeft: 10,
    fontWeight: '600',
    fontSize: 16,
    paddingRight: 10,
  },
});

export default App;
```

You're done!

The whole example is in the `/Example` folder.

### Props

<table class="table">
<thead><tr>
  <th>Name</th><th>Default</th><th>Type</th><th>Description</th>
</tr></thead>
<tbody>
  <tr>
    <td>baseUrl</td>
    <td> - </td>
    <td> String </td>
    <td>Domix AI installation URL</td>
  </tr>
 <tr>
    <td>websiteToken</td>
    <td> - </td>
    <td> String </td>
    <td>Website channel token</td>
  </tr>
  <tr>
    <td>colorScheme</td>
    <td> light </td>
    <td> String </td>
    <td>Widget color scheme (light/dark/auto)</td>
  </tr>
   <tr>
    <td>locale</td>
    <td> en </td>
    <td> String </td>
    <td>Locale</td>
  </tr>
  <tr>
    <td>isModalVisible</td>
    <td> false </td>
    <td> Boolean </td>
    <td>Widget is visible or not</td>
  </tr>
    <tr>
    <td>closeModal</td>
    <td> - </td>
    <td> Function </td>
    <td>Close event</td>
  </tr>
  <tr>
	  <td>user</td>
    <td> null </td>
    <td> Object </td>
    <td>User information about the contact. If you keep passing the same user after reset, the widget will identify that same contact again on the next open.</td>
  </tr>
  <tr>
   <td>customAttributes</td>
    <td> {} </td>
    <td> Object </td>
    <td>Additional information about the customer (Contact)</td>
  </tr>
  <tr>
   <td>conversationCustomAttributes</td>
    <td> {} </td>
    <td> Object </td>
    <td>Additional information about the conversation</td>
  </tr>
  <tr>
    <td>onEvent</td>
    <td> - </td>
    <td> Function </td>
    <td>Callback that receives events from the widget (e.g., <code>domix:ready</code>)</td>
  </tr>
  <tr>
    <td>skipWelcome</td>
    <td> false </td>
    <td> Boolean </td>
    <td>If true, bypasses the welcome screen and opens the chat or pre-chat form directly.</td>
  </tr>
  <tr>
    <td>appName</td>
    <td> 'React Native App' </td>
    <td> String </td>
    <td>Optional name of the application to send in browser_name analytics.</td>
  </tr>
  <tr>
    <td>appVersion</td>
    <td> Device OS Version </td>
    <td> String </td>
    <td>Optional version of the application to send in browser_version analytics.</td>
  </tr>
 </tbody>
</table>

### Key Features

- **Rich Media Support**: Inline playback for Audio and Video files directly within the chat bubble.
- **Attachments & File Sharing**: Users can upload images, videos, and documents directly from their device (Gallery, Camera, or File System).
- **Emoji Picker**: Integrated emoji selector for more expressive conversations.
- **Message Replies**: Tap a message to reveal the reply button and keep the conversation context.
- **End Conversation**: Allows users to resolve conversations programmatically from the widget header (gated by server configuration).
- **Presence Management**: Real-time "Online" status updates and presence heartbeats to keep the dashboard synced with the user's activity.
- **Dynamic Configuration**: Automatically enables or disables features (attachments, emojis, etc.) based on your Domix AI inbox settings.
- **White Labeling**: Dynamically uses branding from your Domix AI configuration (Inbox Avatar, Logo, Website Name, and Brand Color).
- **Navigation Control**: Programmatically control whether users see the welcome screen or jump straight to messages.

### Methods

You can use a reference to the `DomixAIWidget` component to call methods like `sendMessage`, `setUser`, and `reset`.

```javascript
const widgetRef = useRef(null);

// To send a message
widgetRef.current.sendMessage('Hello from React Native!');

// To set user information
widgetRef.current.setUser('user-identifier-key', {
  email: 'john@gmail.com',
  name: 'John Samuel',
  avatar_url: '',
  phone_number: '+1234567890',
});

// Or pass a full user object that already includes identifier
widgetRef.current.setUser({
  identifier: 'user-identifier-key',
  email: 'john@gmail.com',
  name: 'John Samuel',
});

// To set custom attributes
widgetRef.current.setCustomAttributes({ accountId: 1, status: 'active' });

// To set conversation custom attributes
widgetRef.current.setConversationCustomAttributes({ orderId: 1234 });

// To close the widget modal
widgetRef.current.closeModal();

// To reset the session
widgetRef.current.reset();

// Usage in component
<DomixAIWidget
  ref={widgetRef}
  {...props}
/>
```

<table class="table">
<thead><tr>
  <th>Method Name</th><th>Parameters</th><th>Description</th>
</tr></thead>
<tbody>
  <tr>
    <td>sendMessage</td>
    <td>message (String)</td>
    <td>Sends a message on behalf of the user.</td>
  </tr>
  <tr>
    <td>setUser</td>
    <td>identifier (String), user (Object) or user (Object)</td>
    <td>Updates user information for the widget and keeps the latest user for future opens.</td>
  </tr>
  <tr>
    <td>setCustomAttributes</td>
    <td>attributes (Object)</td>
    <td>Updates custom attributes for the user.</td>
  </tr>
  <tr>
    <td>setConversationCustomAttributes</td>
    <td>attributes (Object)</td>
    <td>Updates custom attributes for the current conversation.</td>
  </tr>
  <tr>
    <td>closeModal</td>
    <td>-</td>
    <td>Closes the widget modal.</td>
  </tr>
  <tr>
    <td>reset</td>
    <td>-</td>
    <td>Resets the current widget session and clears the stored conversation token. If you still render the widget with the same <code>user</code> prop, the next open will identify that same user again.</td>
  </tr>
</tbody>
</table>

### Reset behavior

- `reset()` clears the current conversation session and forces the embedded widget to reload.
- If you want the next open to be anonymous, render the widget with `user={null}` after reset.
- If you want the next open to use another contact, update the `user` prop or call `setUser(...)` before reopening.

## Feedback & Contributing

Feel free to send us feedback.

_Domix AI_ &copy; 2026, Domix AI - Released under the MIT License.
