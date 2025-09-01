'use client';

import type { ChatMessage, AIResponse, AIListItem, AITableRow } from '../types/ai-response';
import { isAIListItemArray, isAITableRowArray } from '../types/ai-response';

export interface FormattingOptions {
  maxListItems?: number;
  truncateLength?: number;
  showTimestamp?: boolean;
  highlightKeywords?: string[];
}

export interface MessageStats {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  averageResponseTime?: number;
}

/**
 * MessageFormatter - 消息格式化服務
 *
 * 職責：
 * - 統一消息格式化邏輯
 * - AI回應數據轉換
 * - 消息顯示優化
 * - 內容安全處理
 */
export class MessageFormatter {
  private options: Required<FormattingOptions>;

  constructor(options: FormattingOptions = {}) {
    this.options = {
      maxListItems: 10,
      truncateLength: 1000,
      showTimestamp: true,
      highlightKeywords: [],
      ...options,
    };
  }

  /**
   * 格式化聊天消息顯示
   */
  formatChatMessage(message: ChatMessage): ChatMessage {
    const formatted: ChatMessage = {
      ...message,
      timestamp: message.timestamp || new Date(),
    };

    // 處理內容格式化
    if (typeof message.content === 'string') {
      formatted.content = this.formatTextContent(message.content);
    } else if (this.isAIResponse(message.content)) {
      formatted.content = this.formatAIResponse(message.content);
    }

    return formatted;
  }

  /**
   * 格式化AI回應
   */
  formatAIResponse(response: AIResponse): AIResponse {
    const formatted: AIResponse = {
      ...response,
    };

    // 格式化摘要和結論
    if (response.summary) {
      formatted.summary = this.sanitizeContent(response.summary);
    }

    if (response.conclusion) {
      formatted.conclusion = this.sanitizeContent(response.conclusion);
    }

    // 格式化數據部分
    if (response.data) {
      if (Array.isArray(response.data) && isAIListItemArray(response.data)) {
        formatted.data = this.formatListData(response.data);
      } else if (Array.isArray(response.data) && isAITableRowArray(response.data)) {
        formatted.data = this.formatTableData(response.data);
      } else if (typeof response.data === 'string') {
        formatted.data = this.sanitizeContent(response.data);
      }
    }

    return formatted;
  }

  /**
   * 格式化列表數據
   */
  private formatListData(data: AIListItem[]): AIListItem[] {
    return data.slice(0, this.options.maxListItems).map(item => ({
      ...item,
      // 清理和截斷字符串字段
      ...Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          typeof value === 'string' ? this.truncateText(this.sanitizeContent(value)) : value,
        ])
      ),
    }));
  }

  /**
   * 格式化表格數據
   */
  private formatTableData(data: AITableRow[]): AITableRow[] {
    return data.slice(0, this.options.maxListItems).map(row => {
      const formattedRow: AITableRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
          formattedRow[key] = this.truncateText(this.sanitizeContent(value));
        } else {
          formattedRow[key] = value;
        }
      }
      return formattedRow;
    });
  }

  /**
   * 格式化文本內容
   */
  private formatTextContent(content: string): string {
    let formatted = this.sanitizeContent(content);

    // 高亮關鍵詞
    if (this.options.highlightKeywords.length > 0) {
      formatted = this.highlightKeywords(formatted);
    }

    // 截斷長文本
    formatted = this.truncateText(formatted);

    return formatted;
  }

  /**
   * 高亮關鍵詞
   */
  private highlightKeywords(content: string): string {
    let result = content;

    for (const keyword of this.options.highlightKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, `**${keyword}**`);
    }

    return result;
  }

  /**
   * 截斷文本
   */
  private truncateText(text: string): string {
    if (text.length <= this.options.truncateLength) {
      return text;
    }

    return text.substring(0, this.options.truncateLength) + '...';
  }

  /**
   * 內容安全處理
   */
  private sanitizeContent(content: string): string {
    // 移除潛在的危險HTML標籤
    const sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    return sanitized.trim();
  }

  /**
   * 生成消息統計
   */
  generateMessageStats(messages: ChatMessage[]): MessageStats {
    const stats: MessageStats = {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.type === 'user').length,
      aiMessages: messages.filter(m => m.type === 'ai').length,
    };

    // 計算平均響應時間（如果有時間戳）
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];

      if (prev.type === 'user' && curr.type === 'ai' && prev.timestamp && curr.timestamp) {
        const prevTime = prev.timestamp instanceof Date ? prev.timestamp : new Date(prev.timestamp);
        const currTime = curr.timestamp instanceof Date ? curr.timestamp : new Date(curr.timestamp);
        const responseTime = currTime.getTime() - prevTime.getTime();
        responseTimes.push(responseTime);
      }
    }

    if (responseTimes.length > 0) {
      stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    return stats;
  }

  /**
   * 格式化時間戳顯示
   */
  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();

    // 小於1分鐘
    if (diff < 60000) {
      return 'Just now';
    }

    // 小於1小時
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // 小於24小時
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // 顯示完整日期
    return timestamp.toLocaleDateString();
  }

  /**
   * 導出消息為文本
   */
  exportMessagesToText(messages: ChatMessage[]): string {
    return messages
      .map(message => {
        const timestamp =
          this.options.showTimestamp && message.timestamp
            ? `[${message.timestamp.toLocaleString()}] `
            : '';

        const sender = message.type === 'user' ? 'User' : 'AI';
        const content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content, null, 2);

        return `${timestamp}${sender}: ${content}`;
      })
      .join('\n\n');
  }

  /**
   * 導出消息為JSON
   */
  exportMessagesToJSON(messages: ChatMessage[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      stats: this.generateMessageStats(messages),
      messages: messages.map(msg => this.formatChatMessage(msg)),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 類型檢查輔助方法
   */
  private isAIResponse(content: any): content is AIResponse {
    return typeof content === 'object' && content !== null && 'type' in content;
  }

  /**
   * 更新格式化選項
   */
  updateOptions(newOptions: Partial<FormattingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 重置為默認選項
   */
  resetOptions(): void {
    this.options = {
      maxListItems: 10,
      truncateLength: 1000,
      showTimestamp: true,
      highlightKeywords: [],
    };
  }
}
