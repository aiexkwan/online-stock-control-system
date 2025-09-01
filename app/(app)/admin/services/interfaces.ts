'use client';

import type { ChatMessage, AIResponse } from '../types/ai-response';

// 服務接口定義 - 實現依賴倒置原則

/**
 * 聊天服務接口
 */
export interface IChatService {
  sendMessage(
    question: string,
    stream?: boolean,
    features?: {
      enableCache: boolean;
      enableOptimization: boolean;
      enableAnalysis: boolean;
    }
  ): Promise<Response>;

  sendMessageWithRetry(
    question: string,
    stream?: boolean,
    features?: {
      enableCache: boolean;
      enableOptimization: boolean;
      enableAnalysis: boolean;
    },
    maxRetries?: number
  ): Promise<Response>;

  cancelPendingRequest(): void;
  addToCache(question: string, response: string): void;
  dispose(): void;
}

/**
 * 建議服務接口
 */
export interface ISuggestionService {
  getCategories(): Array<{
    category: string;
    icon: string;
    queries: string[];
    weight?: number;
  }>;

  getQuickActions(): Array<{
    id: string;
    label: string;
    icon: string;
    query: string;
  }>;

  generateContextualSuggestions(context: {
    lastMessage?: ChatMessage;
    messageHistory: ChatMessage[];
    userPreferences?: Record<string, any>;
  }): string[];

  getPersonalizedSuggestions(limit?: number): string[];
  recordSuggestionUsage(query: string): void;
  searchSuggestions(searchTerm: string): string[];
  getSuggestionsByCategory(categoryName: string): string[];
  dispose(): void;
}

/**
 * 消息格式化服務接口
 */
export interface IMessageFormatter {
  formatChatMessage(message: ChatMessage): ChatMessage;
  formatAIResponse(response: AIResponse): AIResponse;

  generateMessageStats(messages: ChatMessage[]): {
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    averageResponseTime?: number;
  };

  formatTimestamp(timestamp: Date): string;
  exportMessagesToText(messages: ChatMessage[]): string;
  exportMessagesToJSON(messages: ChatMessage[]): string;

  updateOptions(options: {
    maxListItems?: number;
    truncateLength?: number;
    showTimestamp?: boolean;
    highlightKeywords?: string[];
  }): void;

  resetOptions(): void;
}

/**
 * 服務容器接口
 */
export interface IServiceContainer {
  readonly chatService: IChatService;
  readonly suggestionService: ISuggestionService;
  readonly messageFormatter: IMessageFormatter;

  // 服務狀態檢查
  readonly isInitialized: boolean;
  readonly isDisposed: boolean;

  // 服務生命周期管理
  initialize(): Promise<void>;
  dispose(): void;

  // 服務替換（測試用）
  replaceChatService(service: IChatService): void;
  replaceSuggestionService(service: ISuggestionService): void;
  replaceMessageFormatter(service: IMessageFormatter): void;
}

/**
 * 服務配置接口
 */
export interface IServiceConfiguration {
  chat: {
    apiEndpoint: string;
    maxRetries: number;
    cacheTimeout: number;
    enableStreaming: boolean;
  };

  suggestion: {
    maxSuggestions: number;
    contextWindow: number;
    enablePersonalization: boolean;
  };

  formatting: {
    maxListItems: number;
    truncateLength: number;
    showTimestamp: boolean;
    highlightKeywords: string[];
  };

  // 環境配置
  environment: 'development' | 'test' | 'production';
  enableMocking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 服務工廠接口
 */
export interface IServiceFactory {
  createChatService(config: IServiceConfiguration): IChatService;
  createSuggestionService(config: IServiceConfiguration): ISuggestionService;
  createMessageFormatter(config: IServiceConfiguration): IMessageFormatter;
  createServiceContainer(config: IServiceConfiguration): IServiceContainer;
}

/**
 * Mock服務接口（測試用）
 */
export interface IMockChatService extends IChatService {
  setMockResponse(response: string): void;
  setMockError(error: Error): void;
  getCallHistory(): Array<{
    question: string;
    timestamp: Date;
    options?: any;
  }>;
  clearCallHistory(): void;
}

export interface IMockSuggestionService extends ISuggestionService {
  setMockSuggestions(suggestions: string[]): void;
  setMockCategories(categories: any[]): void;
  getUsageHistory(): Array<{
    query: string;
    timestamp: Date;
  }>;
  clearUsageHistory(): void;
}

/**
 * 服務健康檢查接口
 */
export interface IServiceHealth {
  checkChatService(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }>;

  checkSuggestionService(): Promise<{
    healthy: boolean;
    cacheSize?: number;
    error?: string;
  }>;

  checkAllServices(): Promise<{
    overall: boolean;
    services: {
      chat: boolean;
      suggestion: boolean;
      formatting: boolean;
    };
    issues?: string[];
  }>;
}

/**
 * 服務事件接口
 */
export interface IServiceEvents {
  onServiceError: (serviceName: string, error: Error) => void;
  onServiceRecovery: (serviceName: string) => void;
  onConfigurationChange: (newConfig: Partial<IServiceConfiguration>) => void;
  onServiceDisposed: (serviceName: string) => void;
}

/**
 * 類型安全的服務標識符
 */
export const SERVICE_TOKENS = {
  CHAT_SERVICE: Symbol('ChatService'),
  SUGGESTION_SERVICE: Symbol('SuggestionService'),
  MESSAGE_FORMATTER: Symbol('MessageFormatter'),
  SERVICE_CONTAINER: Symbol('ServiceContainer'),
  SERVICE_CONFIGURATION: Symbol('ServiceConfiguration'),
  SERVICE_FACTORY: Symbol('ServiceFactory'),
  SERVICE_HEALTH: Symbol('ServiceHealth'),
  SERVICE_EVENTS: Symbol('ServiceEvents'),
} as const;

export type ServiceToken = (typeof SERVICE_TOKENS)[keyof typeof SERVICE_TOKENS];
