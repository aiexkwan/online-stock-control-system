/**
 * Stream Processor - 處理串流響應的邏輯
 *
 * 職責分離：
 * - 串流數據處理
 * - 消息累積邏輯
 * - 串流狀態管理
 */

import type { ChatMessage } from '../types/ai-response';
import { parseStreamChunk, type StreamChunk } from '../services/chatService';

export interface StreamProcessorOptions {
  onChunkReceived: (accumulatedContent: string) => void;
  onComplete: (finalContent: string) => void;
  onCacheHit: (level: string) => void;
  onError: (error: string) => void;
}

/**
 * 處理串流響應
 */
export const processStreamResponse = async (
  response: Response,
  options: StreamProcessorOptions
): Promise<void> => {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulatedAnswer = '';

  if (!reader) {
    throw new Error('Unable to create stream reader');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        const parsed = parseStreamChunk(line);
        if (!parsed) continue;

        switch (parsed.type) {
          case 'answer_chunk':
            if (parsed.content) {
              accumulatedAnswer += parsed.content;
              options.onChunkReceived(accumulatedAnswer);
            }
            break;

          case 'complete':
            if (parsed.answer) {
              options.onComplete(parsed.answer);
            }
            break;

          case 'cache_hit':
            if (parsed.level) {
              options.onCacheHit(parsed.level);
            }
            break;

          case 'error':
            if (parsed.message) {
              options.onError(parsed.message);
            }
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

/**
 * 創建串流消息的輔助函數
 */
export const createStreamingMessage = (messageId: string): ChatMessage => ({
  id: messageId,
  role: 'assistant',
  type: 'ai',
  content: '...',
  timestamp: new Date().toISOString(),
});

/**
 * 更新串流消息的輔助函數
 */
export const updateStreamingMessage = (
  messages: ChatMessage[],
  messageId: string,
  content: string
): ChatMessage[] => {
  return messages.map(msg => (msg.id === messageId ? { ...msg, content } : msg));
};
