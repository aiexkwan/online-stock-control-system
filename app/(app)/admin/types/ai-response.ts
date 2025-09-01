// AI and chatbot related types

// Enhanced Error type for chat messages
export interface EnhancedError {
  message: string;
  details?: string;
  suggestions?: string[];
  alternatives?: string[];
  showSchema?: boolean;
  showExamples?: boolean;
  showHelp?: boolean;
}

// Union type for all possible chat message content
export type ChatMessageContent =
  | string // Plain text messages
  | AIResponse // AI response objects
  | EnhancedError; // Error objects

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'user' | 'ai' | 'error';
  content: ChatMessageContent;
  timestamp: Date | string;
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

// Type guard functions for runtime type checking
export function isEnhancedError(value: unknown): value is EnhancedError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as any).message === 'string'
  );
}

export function isAIResponse(value: unknown): value is AIResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as any).type === 'string' &&
    ['list', 'table', 'single', 'empty', 'summary'].includes((value as any).type)
  );
}

export function isAIListItem(value: unknown): value is AIListItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    typeof (value as any).label === 'string'
  );
}

export function isAITableRow(value: unknown): value is AITableRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isAIListItemArray(value: unknown): value is AIListItem[] {
  return Array.isArray(value) && value.every(item => isAIListItem(item));
}

export function isAITableRowArray(value: unknown): value is AITableRow[] {
  return Array.isArray(value) && value.every(item => isAITableRow(item));
}

// Safe JSON parsing with type checking
export function safeParseAIResponse(jsonString: string): AIResponse | null {
  try {
    const parsed = JSON.parse(jsonString);
    return isAIResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
