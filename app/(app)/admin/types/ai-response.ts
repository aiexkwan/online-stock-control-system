// AI and chatbot related types

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | any;
  timestamp: Date | string;
  error?: boolean;
  type: 'user' | 'ai' | 'error';
}

export interface AIListItem {
  rank?: number;
  label: string;
  value?: string | number;
  unit?: string;
  description?: string;
}

export interface AITableRow {
  [key: string]: string | number | null | undefined;
}

export interface AIColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  type?: 'string' | 'number';
}

export interface AIResponse {
  type: 'list' | 'table' | 'single' | 'empty' | 'summary';
  data?: AIListItem[] | AITableRow[] | string | number;
  summary?: string;
  conclusion?: string;
  columns?: AIColumn[];
}

export interface ChatbotCardProps {
  onSendMessage?: (message: string) => Promise<string>;
  placeholder?: string;
  className?: string;
  height?: string | number;
  title?: string;
  description?: string;
  isEditMode?: boolean;
}
