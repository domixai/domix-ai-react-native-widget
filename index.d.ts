declare module 'domix-ai-react-native-widget' {
  import React from 'react';

  export interface DomixUser {
    identifier?: string;
    name?: string;
    avatar_url?: string;
    email?: string;
    identifier_hash?: string;
    [key: string]: unknown;
  }

  export interface DomixWidgetEventPayload {
    eventName: string;
    widgetEventName: string;
    data: unknown;
    payload: Record<string, unknown>;
    rawData: string;
  }

  export interface DomixAIWidgetRef {
    sendMessage: (message: string) => void;
    setUser: (identifier: string, userData: DomixUser) => void;
    setCustomAttributes: (attributes: Record<string, unknown>) => void;
    setConversationCustomAttributes: (attributes: Record<string, unknown>) => void;
    reset: () => Promise<void> | void;
    closeModal: () => void;
  }

  export interface DomixAIWidgetProps {
    websiteToken: string;
    locale?: string;
    baseUrl: string;
    colorScheme?: 'light' | 'auto' | 'dark';
    closeModal: () => void;
    openModal?: () => void;
    isModalVisible: boolean;
    autoStartConversation?: boolean;
    user?: DomixUser;
    customAttributes?: Record<string, unknown>;
    conversationCustomAttributes?: Record<string, unknown>;
    onEvent?: (event: DomixWidgetEventPayload) => void;
  }

  const DomixAIWidget: React.ForwardRefExoticComponent<
    DomixAIWidgetProps & React.RefAttributes<DomixAIWidgetRef>
  >;
  export default DomixAIWidget;
}
