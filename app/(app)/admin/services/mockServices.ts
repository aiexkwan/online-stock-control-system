'use client';

import type { ChatMessage } from '../types/ai-response';
import type { IMockChatService, IMockSuggestionService, IMessageFormatter } from './interfaces';

/**
 * Mock 聊天服務 - 測試用
 */
export class MockChatService implements IMockChatService {
  private mockResponses: string[] = ['Default mock response'];
  private mockError: Error | null = null;
  private callHistory: Array<{
    question: string;
    timestamp: Date;
    options?: any;
  }> = [];

  async sendMessage(
    question: string,
    stream: boolean = false,
    features = {
      enableCache: true,
      enableOptimization: true,
      enableAnalysis: false,
    }
  ): Promise<Response> {
    // 記錄調用
    this.callHistory.push({
      question,
      timestamp: new Date(),
      options: { stream, features },
    });

    // 如果設置了錯誤，拋出錯誤
    if (this.mockError) {
      throw this.mockError;
    }

    // 模擬延遲
    await new Promise(resolve => setTimeout(resolve, 100));

    // 返回 mock 響應
    const response = this.mockResponses[0] || 'Mock response';

    if (stream) {
      // 模擬流式響應
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: response })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }

    return new Response(JSON.stringify({ answer: response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
    return this.sendMessage(question, stream, features);
  }

  cancelPendingRequest(): void {
    // Mock implementation - 什麼都不做
  }

  addToCache(question: string, response: string): void {
    // Mock implementation - 可以記錄到內部狀態
  }

  dispose(): void {
    this.clearCallHistory();
    this.mockError = null;
    this.mockResponses = [];
  }

  // Mock 專用方法
  setMockResponse(response: string): void {
    this.mockResponses = [response];
  }

  setMockError(error: Error): void {
    this.mockError = error;
  }

  getCallHistory(): Array<{
    question: string;
    timestamp: Date;
    options?: any;
  }> {
    return [...this.callHistory];
  }

  clearCallHistory(): void {
    this.callHistory = [];
  }
}

/**
 * Mock 建議服務 - 測試用
 */
export class MockSuggestionService implements IMockSuggestionService {
  private mockSuggestions: string[] = [
    'Mock suggestion 1',
    'Mock suggestion 2',
    'Mock suggestion 3',
  ];

  private mockCategories = [
    {
      category: 'Mock Category',
      icon: 'Package',
      queries: ['Mock query 1', 'Mock query 2'],
    },
  ];

  private usageHistory: Array<{
    query: string;
    timestamp: Date;
  }> = [];

  getCategories() {
    return this.mockCategories;
  }

  getQuickActions() {
    return [
      {
        id: 'mock-action',
        label: 'Mock Action',
        icon: 'Calendar',
        query: 'Mock quick action query',
      },
    ];
  }

  generateContextualSuggestions(context: {
    lastMessage?: ChatMessage;
    messageHistory: ChatMessage[];
    userPreferences?: Record<string, any>;
  }): string[] {
    return this.mockSuggestions.slice(0, 3);
  }

  getPersonalizedSuggestions(limit: number = 5): string[] {
    return this.mockSuggestions.slice(0, limit);
  }

  recordSuggestionUsage(query: string): void {
    this.usageHistory.push({
      query,
      timestamp: new Date(),
    });
  }

  searchSuggestions(searchTerm: string): string[] {
    return this.mockSuggestions.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  getSuggestionsByCategory(categoryName: string): string[] {
    const category = this.mockCategories.find(c => c.category === categoryName);
    return category ? category.queries : [];
  }

  dispose(): void {
    this.clearUsageHistory();
  }

  // Mock 專用方法
  setMockSuggestions(suggestions: string[]): void {
    this.mockSuggestions = suggestions;
  }

  setMockCategories(categories: any[]): void {
    this.mockCategories = categories;
  }

  getUsageHistory(): Array<{
    query: string;
    timestamp: Date;
  }> {
    return [...this.usageHistory];
  }

  clearUsageHistory(): void {
    this.usageHistory = [];
  }
}

/**
 * Mock 消息格式化服務 - 測試用
 */
export class MockMessageFormatter implements IMessageFormatter {
  private options = {
    maxListItems: 10,
    truncateLength: 1000,
    showTimestamp: true,
    highlightKeywords: [] as string[],
  };

  formatChatMessage(message: ChatMessage): ChatMessage {
    return {
      ...message,
      content:
        typeof message.content === 'string' ? `[FORMATTED] ${message.content}` : message.content,
      timestamp: message.timestamp || new Date(),
    };
  }

  formatAIResponse(response: any): any {
    return {
      ...response,
      summary: response.summary ? `[FORMATTED] ${response.summary}` : undefined,
    };
  }

  generateMessageStats(messages: ChatMessage[]) {
    return {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.type === 'user').length,
      aiMessages: messages.filter(m => m.type === 'ai').length,
      averageResponseTime: 1500, // Mock 值
    };
  }

  formatTimestamp(timestamp: Date): string {
    return `[MOCK] ${timestamp.toISOString()}`;
  }

  exportMessagesToText(messages: ChatMessage[]): string {
    return `[MOCK EXPORT] ${messages.length} messages`;
  }

  exportMessagesToJSON(messages: ChatMessage[]): string {
    return JSON.stringify({
      mockExport: true,
      messageCount: messages.length,
      messages,
    });
  }

  updateOptions(newOptions: {
    maxListItems?: number;
    truncateLength?: number;
    showTimestamp?: boolean;
    highlightKeywords?: string[];
  }): void {
    this.options = { ...this.options, ...newOptions };
  }

  resetOptions(): void {
    this.options = {
      maxListItems: 10,
      truncateLength: 1000,
      showTimestamp: true,
      highlightKeywords: [],
    };
  }
}

/**
 * Mock 服務工廠
 */
export class MockServiceFactory {
  static createChatService(): MockChatService {
    return new MockChatService();
  }

  static createSuggestionService(): MockSuggestionService {
    return new MockSuggestionService();
  }

  static createMessageFormatter(): MockMessageFormatter {
    return new MockMessageFormatter();
  }

  /**
   * 創建預配置的 Mock 服務
   */
  static createPreConfiguredServices() {
    const chatService = new MockChatService();
    chatService.setMockResponse('This is a pre-configured mock response');

    const suggestionService = new MockSuggestionService();
    suggestionService.setMockSuggestions([
      'Pre-configured suggestion 1',
      'Pre-configured suggestion 2',
      'Pre-configured suggestion 3',
    ]);

    const messageFormatter = new MockMessageFormatter();

    return {
      chatService,
      suggestionService,
      messageFormatter,
    };
  }

  /**
   * 創建錯誤模擬的 Mock 服務
   */
  static createErrorSimulationServices() {
    const chatService = new MockChatService();
    chatService.setMockError(new Error('Simulated chat service error'));

    return {
      chatService,
      suggestionService: new MockSuggestionService(),
      messageFormatter: new MockMessageFormatter(),
    };
  }
}
