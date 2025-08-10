// AI Response Types for Database Chat

export type AIResponseType = 'list' | 'single' | 'table' | 'summary' | 'error' | 'empty';

export interface AIListItem {
  rank?: number;
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AITableColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'currency';
  align?: 'left' | 'center' | 'right';
}

export interface AITableRow {
  [key: string]: string | number | Date | null;
}

export interface AIResponse {
  type: AIResponseType;
  summary?: string;
  data?: AIListItem[] | AITableRow[] | string | number | null;
  columns?: AITableColumn[]; // For table type
  conclusion?: string;
  metadata?: {
    totalCount?: number;
    queryTime?: string;
    hasMore?: boolean;
    [key: string]: string | number | boolean | undefined;
  };
}

// Response validation
export function isValidAIResponse(obj: unknown): obj is AIResponse {
  return obj !== null && 
    obj !== undefined &&
    typeof obj === 'object' && 
    'type' in obj &&
    ['list', 'single', 'table', 'summary', 'error', 'empty'].includes((obj as AIResponse).type);
}

// Default response for errors
export const createErrorResponse = (message: string): AIResponse => ({
  type: 'error',
  summary: 'An error occurred',
  data: message,
});

// Default response for empty results
export const createEmptyResponse = (): AIResponse => ({
  type: 'empty',
  summary: 'No data found',
  conclusion: 'No matching records found for your query.',
});