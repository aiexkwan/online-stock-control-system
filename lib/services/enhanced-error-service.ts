/**
 * Enhanced Error Service
 * 增強的錯誤處理服務
 * 
 * 提供分類、自動恢復、用戶友好的錯誤處理
 */

import { systemLogger } from '@/lib/logger';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  SCHEMA = 'schema',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  RESOURCE_UNAVAILABLE = 'resource_unavailable',
  SYSTEM = 'system'
}

export interface EnhancedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
  diagnosticInfo: Record<string, unknown>;
  context: {
    component: string;
    action: string;
    timestamp: string;
    userId?: string;
  };
  suggestedActions: string[];
  autoRetryAttempts?: number;
  maxRetryAttempts?: number;
}

export class EnhancedErrorService {
  private static instance: EnhancedErrorService;
  private readonly errorHistory = new Map<string, EnhancedError[]>();
  private readonly maxHistorySize = 100;

  static getInstance(): EnhancedErrorService {
    if (!EnhancedErrorService.instance) {
      EnhancedErrorService.instance = new EnhancedErrorService();
    }
    return EnhancedErrorService.instance;
  }

  /**
   * 創建增強的錯誤物件
   */
  createEnhancedError(
    originalError: Error | string,
    context: {
      component: string;
      action: string;
      userId?: string;
      additionalData?: Record<string, unknown>;
    }
  ): EnhancedError {
    const errorMessage = typeof originalError === 'string' ? originalError : originalError.message;
    const errorId = this.generateErrorId();
    
    const category = this.categorizeError(errorMessage, originalError);
    const severity = this.determineSeverity(category, errorMessage);
    
    const enhancedError: EnhancedError = {
      id: errorId,
      category,
      severity,
      recoverable: this.isRecoverable(category, severity),
      retryable: this.isRetryable(category, errorMessage),
      userMessage: this.generateUserFriendlyMessage(category, errorMessage),
      technicalMessage: errorMessage,
      diagnosticInfo: {
        originalError: originalError instanceof Error ? {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack
        } : originalError,
        ...context.additionalData
      },
      context: {
        component: context.component,
        action: context.action,
        timestamp: new Date().toISOString(),
        userId: context.userId
      },
      suggestedActions: this.generateSuggestedActions(category, errorMessage),
      maxRetryAttempts: this.isRetryable(category, errorMessage) ? 3 : 0
    };

    this.recordError(enhancedError);
    return enhancedError;
  }

  /**
   * 處理股票轉移特定錯誤
   */
  handleTransferError(
    error: Error | string,
    transferContext: {
      palletNumber?: string;
      fromLocation?: string;
      toLocation?: string;
      userId?: string;
    }
  ): EnhancedError {
    const enhancedError = this.createEnhancedError(error, {
      component: 'stock_transfer',
      action: 'pallet_transfer',
      userId: transferContext.userId,
      additionalData: {
        palletNumber: transferContext.palletNumber,
        fromLocation: transferContext.fromLocation,
        toLocation: transferContext.toLocation
      }
    });

    // 記錄轉移特定的診斷資訊
    systemLogger.error({
      errorId: enhancedError.id,
      category: enhancedError.category,
      severity: enhancedError.severity,
      palletNumber: transferContext.palletNumber,
      fromLocation: transferContext.fromLocation,
      toLocation: transferContext.toLocation
    }, 'Stock transfer error');

    return enhancedError;
  }

  /**
   * 自動重試機制
   */
  async executeWithAutoRetry<T>(
    operation: () => Promise<T>,
    context: {
      component: string;
      action: string;
      maxRetries?: number;
      retryDelay?: number;
      userId?: string;
    }
  ): Promise<T> {
    const maxRetries = context.maxRetries || 3;
    const baseDelay = context.retryDelay || 1000;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const enhancedError = this.createEnhancedError(error as Error, {
          component: context.component,
          action: context.action,
          userId: context.userId,
          additionalData: { attempt, maxRetries }
        });

        if (attempt > maxRetries || !enhancedError.retryable) {
          throw enhancedError;
        }

        // 指數退避延遲
        const delay = baseDelay * Math.pow(2, attempt - 1);
        systemLogger.warn({
          errorId: enhancedError.id,
          delay,
          component: context.component,
          action: context.action
        }, `Retrying operation (attempt ${attempt}/${maxRetries})`);

        await this.sleep(delay);
      }
    }

    throw new Error('Unreachable code'); // TypeScript 滿足
  }

  /**
   * 錯誤分類邏輯
   */
  private categorizeError(errorMessage: string, originalError?: Error | string): ErrorCategory {
    const message = errorMessage.toLowerCase();
    
    // 資料庫架構相關
    if (message.includes('schema') || 
        message.includes('column') && message.includes('does not exist') ||
        message.includes('function') && message.includes('does not exist') ||
        message.includes('table') && message.includes('does not exist')) {
      return ErrorCategory.SCHEMA;
    }
    
    // 網路相關
    if (message.includes('network') || 
        message.includes('connection') || 
        message.includes('timeout') ||
        message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    
    // 驗證相關
    if (message.includes('validation') || 
        message.includes('invalid') || 
        message.includes('required') ||
        message.includes('format')) {
      return ErrorCategory.VALIDATION;
    }
    
    // 權限相關
    if (message.includes('unauthorized') || 
        message.includes('forbidden') || 
        message.includes('permission')) {
      return ErrorCategory.PERMISSION;
    }
    
    // 認證相關
    if (message.includes('auth') || 
        message.includes('login') || 
        message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    // 資源不可用
    if (message.includes('not found') || 
        message.includes('unavailable') || 
        message.includes('not exist')) {
      return ErrorCategory.RESOURCE_UNAVAILABLE;
    }
    
    // 系統錯誤
    if (message.includes('system') || 
        message.includes('internal') || 
        message.includes('server')) {
      return ErrorCategory.SYSTEM;
    }
    
    return ErrorCategory.BUSINESS_LOGIC;
  }

  /**
   * 決定錯誤嚴重程度
   */
  private determineSeverity(category: ErrorCategory, message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();
    
    // 關鍵錯誤
    if (category === ErrorCategory.SCHEMA || 
        lowerMessage.includes('critical') || 
        lowerMessage.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // 高嚴重性錯誤
    if (category === ErrorCategory.AUTHENTICATION || 
        category === ErrorCategory.SYSTEM ||
        lowerMessage.includes('error')) {
      return ErrorSeverity.HIGH;
    }
    
    // 中等嚴重性錯誤
    if (category === ErrorCategory.NETWORK || 
        category === ErrorCategory.PERMISSION ||
        category === ErrorCategory.RESOURCE_UNAVAILABLE) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * 判斷錯誤是否可恢復
   */
  private isRecoverable(category: ErrorCategory, severity: ErrorSeverity): boolean {
    if (severity === ErrorSeverity.CRITICAL) {
      return false;
    }
    
    return category !== ErrorCategory.SCHEMA && 
           category !== ErrorCategory.AUTHENTICATION &&
           category !== ErrorCategory.PERMISSION;
  }

  /**
   * 判斷錯誤是否可重試
   */
  private isRetryable(category: ErrorCategory, message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // 網路和系統暫時性錯誤可重試
    if (category === ErrorCategory.NETWORK || 
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('temporary')) {
      return true;
    }
    
    // 架構、驗證、權限錯誤不可重試
    if (category === ErrorCategory.SCHEMA ||
        category === ErrorCategory.VALIDATION ||
        category === ErrorCategory.PERMISSION ||
        category === ErrorCategory.AUTHENTICATION) {
      return false;
    }
    
    return false;
  }

  /**
   * 生成用戶友好的錯誤訊息
   */
  private generateUserFriendlyMessage(category: ErrorCategory, originalMessage: string): string {
    switch (category) {
      case ErrorCategory.SCHEMA:
        return '系統配置出現問題，請聯繫系統管理員。我們正在處理這個問題。';
      
      case ErrorCategory.NETWORK:
        return '網路連線出現問題，請檢查您的網路連線並重試。';
      
      case ErrorCategory.VALIDATION:
        return '輸入的資料格式不正確，請檢查並重新輸入。';
      
      case ErrorCategory.AUTHENTICATION:
        return '身份驗證失敗，請重新登入。';
      
      case ErrorCategory.PERMISSION:
        return '您沒有執行此操作的權限，請聯繫管理員。';
      
      case ErrorCategory.RESOURCE_UNAVAILABLE:
        return '請求的資源暫時無法使用，請稍後重試。';
      
      case ErrorCategory.SYSTEM:
        return '系統暫時出現問題，我們正在處理中。請稍後重試。';
      
      case ErrorCategory.BUSINESS_LOGIC:
        return '操作無法完成。請檢查輸入資料並重試。';
      
      default:
        return '發生未知錯誤，請稍後重試或聯繫技術支援。';
    }
  }

  /**
   * 生成建議操作
   */
  private generateSuggestedActions(category: ErrorCategory, message: string): string[] {
    const actions: string[] = [];
    
    switch (category) {
      case ErrorCategory.SCHEMA:
        actions.push('聯繫系統管理員');
        actions.push('檢查系統公告');
        break;
      
      case ErrorCategory.NETWORK:
        actions.push('檢查網路連線');
        actions.push('重新整理頁面');
        actions.push('稍後重試');
        break;
      
      case ErrorCategory.VALIDATION:
        actions.push('檢查輸入格式');
        actions.push('確認必填欄位');
        break;
      
      case ErrorCategory.AUTHENTICATION:
        actions.push('重新登入');
        actions.push('清除瀏覽器快取');
        break;
      
      case ErrorCategory.PERMISSION:
        actions.push('聯繫管理員取得權限');
        break;
      
      case ErrorCategory.RESOURCE_UNAVAILABLE:
        actions.push('稍後重試');
        actions.push('確認資源是否存在');
        break;
      
      case ErrorCategory.SYSTEM:
        actions.push('稍後重試');
        actions.push('聯繫技術支援');
        break;
      
      default:
        actions.push('重試操作');
        actions.push('聯繫技術支援');
        break;
    }
    
    return actions;
  }

  /**
   * 記錄錯誤到歷史記錄
   */
  private recordError(error: EnhancedError): void {
    const component = error.context.component;
    
    if (!this.errorHistory.has(component)) {
      this.errorHistory.set(component, []);
    }
    
    const history = this.errorHistory.get(component)!;
    history.push(error);
    
    // 保持歷史記錄大小限制
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * 獲取錯誤統計
   */
  getErrorStatistics(component?: string): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: EnhancedError[];
  } {
    const allErrors = component 
      ? (this.errorHistory.get(component) || [])
      : Array.from(this.errorHistory.values()).flat();
    
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    
    Object.values(ErrorCategory).forEach(cat => errorsByCategory[cat] = 0);
    Object.values(ErrorSeverity).forEach(sev => errorsBySeverity[sev] = 0);
    
    allErrors.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });
    
    return {
      totalErrors: allErrors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: allErrors.slice(-10)
    };
  }

  /**
   * 輔助方法
   */
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 導出單例實例
export const enhancedErrorService = EnhancedErrorService.getInstance();