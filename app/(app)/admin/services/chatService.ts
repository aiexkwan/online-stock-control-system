/**
 * Chat Service - 處理與聊天機器人相關的API調用
 *
 * 職責分離：
 * - API調用邏輯
 * - 請求/響應處理
 * - 錯誤處理
 */

export interface ChatRequest {
  question: string;
  sessionId: string;
  stream: boolean;
  features: {
    enableCache: boolean;
    enableOptimization: boolean;
    enableAnalysis: boolean;
  };
}

export interface ChatResponse {
  answer: string;
  type?: string;
  [key: string]: any;
}

export interface StreamChunk {
  type: 'answer_chunk' | 'complete' | 'cache_hit' | 'error';
  content?: string;
  answer?: string;
  level?: string;
  message?: string;
}

/**
 * 發送聊天消息到 ask-database API
 */
export const sendChatMessage = async (request: ChatRequest): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 串流模式需要特殊的 Accept header
  if (request.stream) {
    headers['Accept'] = 'text/event-stream';
  }

  const response = await fetch('/api/ask-database', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      question: request.question,
      _sessionId: request.sessionId,
      stream: request.stream,
      features: request.features,
    }),
  });

  // 非串流模式的錯誤檢查
  if (!response.ok && !request.stream) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
};

/**
 * 處理標準JSON響應
 */
export const handleStandardResponse = async (response: Response): Promise<ChatResponse> => {
  const result = await response.json();
  return {
    answer: result.answer || 'Query executed successfully',
    ...result,
  };
};

/**
 * 解析串流數據塊
 */
export const parseStreamChunk = (line: string): StreamChunk | null => {
  if (!line.startsWith('data: ')) {
    return null;
  }

  const data = line.slice(6);
  if (data === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(data) as StreamChunk;
  } catch (error) {
    console.error('Stream parse error:', error);
    return null;
  }
};

/**
 * ChatService 類別 - 提供統一的聊天服務接口
 *
 * 職責：
 * - 會話管理和快取
 * - 重試邏輯
 * - 資源清理
 */
export class ChatService {
  private sessionId: string;
  private cache: Map<string, { response: string; timestamp: number }> = new Map();
  private abortController?: AbortController;
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 分鐘

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * 發送消息 - 統一入口
   */
  async sendMessage(
    question: string,
    stream: boolean = false,
    features = {
      enableCache: true,
      enableOptimization: true,
      enableAnalysis: false,
    }
  ): Promise<Response> {
    // 檢查快取
    if (features.enableCache && !stream) {
      const cached = this.getFromCache(question);
      if (cached) {
        return new Response(JSON.stringify({ answer: cached, cached: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 取消之前的請求
    this.cancelPendingRequest();
    this.abortController = new AbortController();

    const request: ChatRequest = {
      question,
      sessionId: this.sessionId,
      stream,
      features,
    };

    try {
      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(stream && { Accept: 'text/event-stream' }),
        },
        body: JSON.stringify({
          question: request.question,
          _sessionId: request.sessionId,
          stream: request.stream,
          features: request.features,
        }),
        signal: this.abortController.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    }
  }

  /**
   * 帶重試的消息發送
   */
  async sendMessageWithRetry(
    question: string,
    stream: boolean = false,
    features = {
      enableCache: true,
      enableOptimization: true,
      enableAnalysis: false,
    },
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.sendMessage(question, stream, features);

        // 非串流模式檢查錯誤
        if (!response.ok && !stream) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) break;

        // 指數退避
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 取消待處理的請求
   */
  cancelPendingRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * 快取管理
   */
  private getFromCache(question: string): string | null {
    const key = question.toLowerCase().trim();
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 檢查是否過期
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  addToCache(question: string, response: string): void {
    const key = question.toLowerCase().trim();
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // 清理過期條目
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清理資源
   */
  dispose(): void {
    this.cancelPendingRequest();
    this.cache.clear();
  }
}
