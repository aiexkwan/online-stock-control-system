'use client';

import type { ChatMessage } from '../types/ai-response';

export interface SuggestionCategory {
  category: string;
  icon: string;
  queries: string[];
  weight?: number;
}

export interface SuggestionContext {
  lastMessage?: ChatMessage;
  messageHistory: ChatMessage[];
  userPreferences?: Record<string, any>;
}

export interface SuggestionServiceOptions {
  maxSuggestions?: number;
  contextWindow?: number;
  enablePersonalization?: boolean;
}

/**
 * SuggestionService - 建議系統服務層
 *
 * 職責：
 * - 管理建議分類和查詢
 * - 生成上下文感知建議
 * - 個性化建議推薦
 * - 建議使用統計分析
 */
export class SuggestionService {
  private options: Required<SuggestionServiceOptions>;
  private usageStats: Map<string, number> = new Map();

  // 預定義建議分類
  private readonly categories: SuggestionCategory[] = [
    {
      category: 'Real-time Inventory',
      icon: 'Package',
      queries: [
        'Show all pallets in Await location',
        'What is the total stock for product code MH001?',
        'How many pallets arrived today?',
        'Which warehouse has the most available space?',
        'Show products with stock below 100 units',
        'List all pallets that have been in Await for more than 7 days',
      ],
      weight: 1.0,
    },
    {
      category: 'Order Status',
      icon: 'ClipboardList',
      queries: [
        'Show all pending orders',
        'How many items need to be shipped today?',
        'What is the status of order REF001?',
        'Show all unprocessed ACO orders',
        'List orders that are overdue',
        'Which orders are partially loaded?',
      ],
      weight: 1.0,
    },
    {
      category: 'Efficiency Analysis',
      icon: 'TrendingUp',
      queries: [
        'How many pallets were produced today?',
        'Show monthly shipping statistics',
        'What is the average transfer time?',
        'Show work level by department today',
        'Compare this week vs last week production',
        'Show most active products today',
      ],
      weight: 1.0,
    },
  ];

  // 快速操作
  private readonly quickActions = [
    {
      id: 'today-summary',
      label: "Today's Summary",
      icon: 'Calendar',
      query: "Show today's summary",
    },
    {
      id: 'await-status',
      label: 'Await Status',
      icon: 'Package',
      query: 'Show current Await pallets',
    },
    {
      id: 'pending-shipments',
      label: 'Pending Shipments',
      icon: 'Truck',
      query: 'Show pending shipments',
    },
  ];

  constructor(options: SuggestionServiceOptions = {}) {
    this.options = {
      maxSuggestions: 6,
      contextWindow: 3,
      enablePersonalization: true,
      ...options,
    };
  }

  /**
   * 獲取所有建議分類
   */
  getCategories(): SuggestionCategory[] {
    return this.categories.map(cat => ({
      ...cat,
      queries: this.options.enablePersonalization
        ? this.personalizeQueries(cat.queries)
        : cat.queries,
    }));
  }

  /**
   * 獲取快速操作
   */
  getQuickActions() {
    return this.quickActions;
  }

  /**
   * 生成上下文感知建議
   */
  generateContextualSuggestions(context: SuggestionContext): string[] {
    const suggestions: string[] = [];

    if (!context.lastMessage || context.lastMessage.type !== 'user') {
      return suggestions;
    }

    const content = this.extractMessageContent(context.lastMessage);
    const lowercaseContent = content.toLowerCase();

    // 基於關鍵詞的建議生成
    if (lowercaseContent.includes('stock') || lowercaseContent.includes('inventory')) {
      suggestions.push(
        'Show stock movement history for this product',
        'Compare current stock with last month',
        'Show location distribution for this product'
      );
    }

    if (lowercaseContent.includes('order')) {
      suggestions.push(
        'Show all items in this order',
        'Check loading progress for this order',
        'Show similar orders from the same customer'
      );
    }

    if (lowercaseContent.includes('pallet')) {
      suggestions.push(
        'Show movement history for this pallet',
        'Find pallets with the same product',
        'Check QC status for this pallet'
      );
    }

    // 基於歷史對話的建議
    const historySuggestions = this.generateHistoryBasedSuggestions(context.messageHistory);
    suggestions.push(...historySuggestions);

    // 限制建議數量
    return suggestions.slice(0, this.options.maxSuggestions);
  }

  /**
   * 獲取個性化建議（基於使用統計）
   */
  getPersonalizedSuggestions(limit: number = 5): string[] {
    // 根據使用頻率排序
    const sortedStats = Array.from(this.usageStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    return sortedStats.map(([query]) => query);
  }

  /**
   * 記錄建議使用
   */
  recordSuggestionUsage(query: string): void {
    if (!this.options.enablePersonalization) return;

    const normalizedQuery = query.toLowerCase().trim();
    const currentCount = this.usageStats.get(normalizedQuery) || 0;
    this.usageStats.set(normalizedQuery, currentCount + 1);
  }

  /**
   * 搜尋相關建議
   */
  searchSuggestions(searchTerm: string): string[] {
    const term = searchTerm.toLowerCase();
    const allQueries = this.categories.flatMap(cat => cat.queries);

    return allQueries
      .filter(query => query.toLowerCase().includes(term))
      .slice(0, this.options.maxSuggestions);
  }

  /**
   * 根據分類獲取建議
   */
  getSuggestionsByCategory(categoryName: string): string[] {
    const category = this.categories.find(cat => cat.category === categoryName);
    return category ? category.queries : [];
  }

  /**
   * 私有方法：提取消息內容
   */
  private extractMessageContent(message: ChatMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }

    if (typeof message.content === 'object' && message.content !== null) {
      return JSON.stringify(message.content);
    }

    return '';
  }

  /**
   * 私有方法：個性化查詢排序
   */
  private personalizeQueries(queries: string[]): string[] {
    if (!this.options.enablePersonalization) return queries;

    return [...queries].sort((a, b) => {
      const aCount = this.usageStats.get(a.toLowerCase()) || 0;
      const bCount = this.usageStats.get(b.toLowerCase()) || 0;
      return bCount - aCount;
    });
  }

  /**
   * 私有方法：基於歷史的建議生成
   */
  private generateHistoryBasedSuggestions(history: ChatMessage[]): string[] {
    const suggestions: string[] = [];
    const recentMessages = history
      .filter(msg => msg.type === 'user')
      .slice(-this.options.contextWindow);

    // 檢測對話模式
    const hasStockQueries = recentMessages.some(msg =>
      this.extractMessageContent(msg).toLowerCase().includes('stock')
    );

    const hasOrderQueries = recentMessages.some(msg =>
      this.extractMessageContent(msg).toLowerCase().includes('order')
    );

    if (hasStockQueries && !hasOrderQueries) {
      suggestions.push('Show related order information');
    }

    if (hasOrderQueries && !hasStockQueries) {
      suggestions.push('Check stock availability for these orders');
    }

    return suggestions;
  }

  /**
   * 清理資源
   */
  dispose(): void {
    this.usageStats.clear();
  }
}
