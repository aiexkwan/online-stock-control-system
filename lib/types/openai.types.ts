/**
 * OpenAI Assistant Service Types
 * AI 服務專用類型定義
 */

// Assistant 消息類型
export interface AssistantMessageData {
  role: 'user' | 'assistant';
  content: string;
  attachments?: AssistantMessageAttachment[];
}

export interface AssistantMessageAttachment {
  file_id: string;
  tools: Array<{
    type: 'file_search' | 'code_interpreter';
  }>;
}

// AI 解析訂單回應類型
export interface ParsedOrderResponse {
  order_ref: string;
  products: OrderProduct[];
  supplier?: string;
  order_date?: string;
  total_amount?: number;
}

export interface OrderProduct {
  product_code: string;
  description?: string;
  quantity: number;
  unit_price?: number;
}

// AI 分析結果類型
export interface AIAnalysisResult<T = ParsedOrderResponse> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}
