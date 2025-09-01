'use client';

import { ChatService } from './chatService';
import { SuggestionService } from './suggestionService';
import { MessageFormatter } from './messageFormatter';
import type {
  IServiceContainer,
  IChatService,
  ISuggestionService,
  IMessageFormatter,
  IServiceConfiguration,
  IServiceEvents,
} from './interfaces';

/**
 * 默認服務配置
 */
export const DEFAULT_SERVICE_CONFIG: IServiceConfiguration = {
  chat: {
    apiEndpoint: '/api/ask-database',
    maxRetries: 3,
    cacheTimeout: 10 * 60 * 1000, // 10 分鐘
    enableStreaming: true,
  },
  suggestion: {
    maxSuggestions: 6,
    contextWindow: 3,
    enablePersonalization: true,
  },
  formatting: {
    maxListItems: 10,
    truncateLength: 1000,
    showTimestamp: true,
    highlightKeywords: [],
  },
  environment: 'production',
  enableMocking: false,
  logLevel: 'info',
};

/**
 * ServiceContainer - 統一的服務容器
 *
 * 職責：
 * - 管理所有服務的生命周期
 * - 實現依賴注入和控制反轉
 * - 提供服務的統一訪問接口
 * - 支持服務的動態替換（測試用）
 */
export class ServiceContainer implements IServiceContainer {
  private _chatService: IChatService;
  private _suggestionService: ISuggestionService;
  private _messageFormatter: IMessageFormatter;
  private _config: IServiceConfiguration;
  private _events?: IServiceEvents;
  private _initialized = false;
  private _disposed = false;

  constructor(config: Partial<IServiceConfiguration> = {}, events?: IServiceEvents) {
    this._config = { ...DEFAULT_SERVICE_CONFIG, ...config };
    this._events = events;

    // 根據環境配置決定是否使用 Mock 服務
    if (this._config.enableMocking && this._config.environment === 'test') {
      this.initializeMockServices();
    } else {
      this.initializeProductionServices();
    }
  }

  /**
   * 生產環境服務初始化
   */
  private initializeProductionServices(): void {
    // 創建聊天服務
    this._chatService = new ChatService(this.generateSessionId());

    // 創建建議服務
    this._suggestionService = new SuggestionService({
      maxSuggestions: this._config.suggestion.maxSuggestions,
      contextWindow: this._config.suggestion.contextWindow,
      enablePersonalization: this._config.suggestion.enablePersonalization,
    });

    // 創建消息格式化服務
    this._messageFormatter = new MessageFormatter({
      maxListItems: this._config.formatting.maxListItems,
      truncateLength: this._config.formatting.truncateLength,
      showTimestamp: this._config.formatting.showTimestamp,
      highlightKeywords: this._config.formatting.highlightKeywords,
    });
  }

  /**
   * 測試環境 Mock 服務初始化
   */
  private initializeMockServices(): void {
    // 這裡可以創建 Mock 服務實現
    // 目前使用生產服務作為占位符
    this.initializeProductionServices();
  }

  /**
   * 生成唯一會話 ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 服務容器初始化
   */
  async initialize(): Promise<void> {
    if (this._initialized || this._disposed) {
      return;
    }

    try {
      // 這裡可以添加異步初始化邏輯
      // 例如：健康檢查、配置驗證等

      this._initialized = true;

      if (this._config.logLevel === 'debug') {
        console.log('ServiceContainer initialized successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._events?.onServiceError(
        'ServiceContainer',
        new Error(`Initialization failed: ${errorMessage}`)
      );
      throw error;
    }
  }

  /**
   * 服務訪問器 - 懶加載模式
   */
  get chatService(): IChatService {
    this.ensureNotDisposed();
    return this._chatService;
  }

  get suggestionService(): ISuggestionService {
    this.ensureNotDisposed();
    return this._suggestionService;
  }

  get messageFormatter(): IMessageFormatter {
    this.ensureNotDisposed();
    return this._messageFormatter;
  }

  /**
   * 服務替換方法（主要用於測試）
   */
  replaceChatService(service: IChatService): void {
    this.ensureNotDisposed();

    if (this._chatService && this._chatService.dispose) {
      this._chatService.dispose();
    }

    this._chatService = service;

    if (this._config.logLevel === 'debug') {
      console.log('ChatService replaced');
    }
  }

  replaceSuggestionService(service: ISuggestionService): void {
    this.ensureNotDisposed();

    if (this._suggestionService && this._suggestionService.dispose) {
      this._suggestionService.dispose();
    }

    this._suggestionService = service;

    if (this._config.logLevel === 'debug') {
      console.log('SuggestionService replaced');
    }
  }

  replaceMessageFormatter(service: IMessageFormatter): void {
    this.ensureNotDisposed();
    this._messageFormatter = service;

    if (this._config.logLevel === 'debug') {
      console.log('MessageFormatter replaced');
    }
  }

  /**
   * 配置更新
   */
  updateConfiguration(newConfig: Partial<IServiceConfiguration>): void {
    this.ensureNotDisposed();

    const oldConfig = { ...this._config };
    this._config = { ...this._config, ...newConfig };

    // 觸發配置變更事件
    this._events?.onConfigurationChange(newConfig);

    // 如果關鍵配置變更，重新初始化相關服務
    if (this.needsReinitialization(oldConfig, this._config)) {
      this.reinitializeServices();
    }
  }

  /**
   * 判斷是否需要重新初始化服務
   */
  private needsReinitialization(
    oldConfig: IServiceConfiguration,
    newConfig: IServiceConfiguration
  ): boolean {
    return (
      oldConfig.chat.apiEndpoint !== newConfig.chat.apiEndpoint ||
      oldConfig.enableMocking !== newConfig.enableMocking ||
      oldConfig.environment !== newConfig.environment
    );
  }

  /**
   * 重新初始化服務
   */
  private reinitializeServices(): void {
    if (this._config.logLevel === 'debug') {
      console.log('Reinitializing services due to configuration change');
    }

    // 清理現有服務
    this.disposeServices();

    // 重新創建服務
    if (this._config.enableMocking && this._config.environment === 'test') {
      this.initializeMockServices();
    } else {
      this.initializeProductionServices();
    }
  }

  /**
   * 服務健康檢查
   */
  async performHealthCheck(): Promise<{
    overall: boolean;
    services: {
      chat: boolean;
      suggestion: boolean;
      formatting: boolean;
    };
    issues?: string[];
  }> {
    const issues: string[] = [];
    const services = {
      chat: true,
      suggestion: true,
      formatting: true,
    };

    // 檢查各服務的健康狀態
    try {
      // 這裡可以添加實際的健康檢查邏輯
      // 例如：測試 API 連接、檢查緩存狀態等

      if (!this._chatService) {
        services.chat = false;
        issues.push('ChatService not initialized');
      }

      if (!this._suggestionService) {
        services.suggestion = false;
        issues.push('SuggestionService not initialized');
      }

      if (!this._messageFormatter) {
        services.formatting = false;
        issues.push('MessageFormatter not initialized');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      issues.push(`Health check failed: ${errorMessage}`);
    }

    const overall = Object.values(services).every(healthy => healthy);

    return {
      overall,
      services,
      ...(issues.length > 0 && { issues }),
    };
  }

  /**
   * 資源清理
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this.disposeServices();
    this._disposed = true;
    this._initialized = false;

    // 觸發容器銷毀事件
    this._events?.onServiceDisposed('ServiceContainer');

    if (this._config.logLevel === 'debug') {
      console.log('ServiceContainer disposed');
    }
  }

  /**
   * 清理所有服務
   */
  private disposeServices(): void {
    if (this._chatService && this._chatService.dispose) {
      this._chatService.dispose();
      this._events?.onServiceDisposed('ChatService');
    }

    if (this._suggestionService && this._suggestionService.dispose) {
      this._suggestionService.dispose();
      this._events?.onServiceDisposed('SuggestionService');
    }

    // MessageFormatter 沒有 dispose 方法，不需要清理
  }

  /**
   * 確保容器未被銷毀
   */
  private ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('ServiceContainer has been disposed and cannot be used');
    }
  }

  /**
   * 獲取當前配置（只讀）
   */
  getConfiguration(): Readonly<IServiceConfiguration> {
    return Object.freeze({ ...this._config });
  }

  /**
   * 檢查是否已初始化
   */
  get isInitialized(): boolean {
    return this._initialized && !this._disposed;
  }

  /**
   * 檢查是否已銷毀
   */
  get isDisposed(): boolean {
    return this._disposed;
  }
}
