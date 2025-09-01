/**
 * Error Handler - 統一的錯誤處理邏輯
 *
 * 職責分離：
 * - 錯誤分類和處理
 * - 錯誤消息格式化
 * - 錯誤日誌記錄
 */

import type { ChatMessage } from '../types/ai-response';

export interface ErrorContext {
  action: string;
  details?: Record<string, any>;
}

/**
 * 處理聊天錯誤並創建錯誤消息
 */
export const handleChatError = (error: unknown, context: ErrorContext): ChatMessage => {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  // 記錄錯誤（可以擴展到外部日誌服務）
  console.error(`Chat error in ${context.action}:`, {
    error: errorMessage,
    context,
    timestamp: new Date().toISOString(),
  });

  return {
    id: `error_${Date.now()}`,
    role: 'assistant' as const, // 修改為有效的role類型
    type: 'ai' as const, // 修改為有效的type類型，表示系統錯誤消息
    content: `錯誤: ${errorMessage}`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * 檢查是否為網絡錯誤
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return error.message.includes('fetch') || error.message.includes('network');
  }
  return false;
};

/**
 * 檢查是否為超時錯誤
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('timeout') || error.message.includes('AbortError');
  }
  return false;
};

/**
 * 獲取用戶友好的錯誤消息
 */
export const getFriendlyErrorMessage = (error: unknown): string => {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  if (error instanceof Error) {
    // 如果是已知的API錯誤，直接返回
    if (error.message.startsWith('HTTP')) {
      return error.message;
    }

    // 其他錯誤返回通用消息
    return 'Something went wrong. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
};
