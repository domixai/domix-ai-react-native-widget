declare module 'domix-ai-react-native-widget' {
  import React from 'react';

  export interface DomixAIWidgetProps {
    websiteToken: string;
    baseUrl: string;
    locale?: string;
    colorScheme?: 'light' | 'auto' | 'dark';
    closeModal: () => void;
    isModalVisible: boolean;
    user?: {
      identifier?: string;
      name?: string;
      avatar_url?: string;
      email?: string;
      identifier_hash?: string;
    };
    customAttributes?: Record<string, unknown>;
    onEvent?: (eventName: string, data: any) => void;
    insets?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  }

  export class DomixAIWidget extends React.Component<DomixAIWidgetProps, any> {
    sendMessage(content: string): void;
    setUser(identifier: string | object, userData?: object): void;
    fetchHistory(): void;
    reset(): void;
    closeModal(): void;
  }

  export default DomixAIWidget;

  export const DomixProvider: React.FC<{
    websiteToken: string;
    baseUrl: string;
    children: React.ReactNode;
  }>;

  export function useDomix(): {
    config: any;
    messages: any[];
    user: any;
    loading: boolean;
    error: string | null;
    identifyUser: (userData: any) => Promise<void>;
    fetchHistory: () => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
  };

  export const DomixClient: {
    init(params: { websiteToken: string; baseUrl: string }): Promise<any>;
    setUser(user: any): Promise<any>;
    fetchMessages(): Promise<any>;
    sendMessage(content: string): Promise<any>;
  };
}
