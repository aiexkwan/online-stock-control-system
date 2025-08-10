// UI and navigation related types

// TabSelectorCard types - only keep actually used types
export type TabType = 'admin' | 'operation';

export interface OperationMenuItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  path?: string;
  action?: () => void;
  badge?: {
    text: string;
    color?: string;
  };
  subItems?: OperationMenuItem[];
  permissions?: string[];
  disabled?: boolean;
}

// ChatbotCard types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
  }>;
}

export interface ChatbotCardProps {
  className?: string;
  onSendMessage?: (message: string) => void;
  messages?: ChatMessage[];
  isTyping?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

