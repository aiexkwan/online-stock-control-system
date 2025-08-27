/**
 * 錯誤消毒器
 * 防止敏感信息通過錯誤信息洩露
 */

interface SanitizedError {
  message: string;
  code?: string;
  timestamp: string;
  requestId?: string;
  // 生產環境不包含 stack 和 details
  stack?: string;
  details?: any;
}

export class ErrorSanitizer {
  // 敏感信息模式列表
  private static sensitivePatterns = [
    /supabase\.(co|io)/gi,  // Supabase URLs
    /[a-f0-9]{32,}/gi,       // API Keys/Tokens
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,  // Bearer tokens
    /password['":\s]+[^,}\s]+/gi,  // Passwords
    /secret['":\s]+[^,}\s]+/gi,    // Secrets
    /key['":\s]+[^,}\s]+/gi,       // Keys
    /email['":\s]+[^,}\s]+@[^,}\s]+/gi,  // Email addresses
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,  // Credit card numbers
  ];

  /**
   * 清理字符串中的敏感信息
   */
  private static cleanSensitiveData(text: string): string {
    let cleaned = text;
    
    for (const pattern of this.sensitivePatterns) {
      cleaned = cleaned.replace(pattern, '[REDACTED]');
    }
    
    return cleaned;
  }

  /**
   * 消毒錯誤對象
   */
  static sanitize(error: any): SanitizedError {
    const timestamp = new Date().toISOString();
    const requestId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (process.env.NODE_ENV === 'production') {
      // 生產環境：只返回安全的錯誤信息
      const safeErrorMessages: Record<string, string> = {
        // 認證錯誤
        'Invalid login credentials': 'Authentication failed. Please check your credentials.',
        'User not found': 'Authentication failed. Please check your credentials.',
        'Invalid password': 'Authentication failed. Please check your credentials.',
        'JWT expired': 'Your session has expired. Please login again.',
        
        // 權限錯誤
        'Permission denied': 'You do not have permission to perform this action.',
        'Unauthorized': 'You do not have permission to access this resource.',
        'Forbidden': 'Access denied.',
        
        // 數據錯誤
        'Not found': 'The requested resource was not found.',
        'Duplicate entry': 'This record already exists.',
        'Validation failed': 'Please check your input and try again.',
        
        // 系統錯誤
        'Database error': 'A system error occurred. Please try again later.',
        'Network error': 'Connection error. Please check your internet connection.',
        'Internal server error': 'An unexpected error occurred. Please try again later.',
      };
      
      // 檢查是否有匹配的安全錯誤信息
      const errorMessage = error?.message || 'Unknown error';
      let safeMessage = 'An error occurred. Please try again.';
      
      for (const [pattern, replacement] of Object.entries(safeErrorMessages)) {
        if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
          safeMessage = replacement;
          break;
        }
      }
      
      return {
        message: safeMessage,
        code: error?.code || 'UNKNOWN_ERROR',
        timestamp,
        requestId,
      };
    }
    
    // 開發環境：清理敏感信息但保留調試信息
    return {
      message: this.cleanSensitiveData(error?.message || 'Unknown error'),
      code: error?.code,
      timestamp,
      requestId,
      stack: error?.stack ? this.cleanSensitiveData(error.stack) : undefined,
      details: error ? this.sanitizeObject(error) : undefined,
    };
  }

  /**
   * 遞歸清理對象中的敏感信息
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.cleanSensitiveData(obj);
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // 跳過可能包含敏感信息的字段
      const sensitiveKeys = ['password', 'secret', 'token', 'key', 'apikey', 'authorization'];
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }
    
    return sanitized;
  }

  /**
   * 安全記錄錯誤
   */
  static logSecurely(error: any, context?: any): void {
    const sanitized = this.sanitize(error);
    
    if (process.env.NODE_ENV === 'production') {
      // 生產環境：記錄到監控服務，不輸出到控制台
      // 可以整合 Sentry、Datadog 等監控服務
      this.sendToMonitoringService(sanitized, context);
      
      // 只在控制台輸出最小信息
      console.error(`[${sanitized.timestamp}] Error ${sanitized.requestId}: ${sanitized.code}`);
    } else {
      // 開發環境：完整輸出到控制台
      console.error('[Error Details]', {
        ...sanitized,
        context: context ? this.sanitizeObject(context) : undefined,
      });
    }
  }

  /**
   * 發送錯誤到監控服務（需要實現）
   */
  private static sendToMonitoringService(error: SanitizedError, context?: any): void {
    // TODO: 整合監控服務（Sentry、Datadog、New Relic 等）
    // 範例：
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(new Error(error.message), {
    //     tags: {
    //       errorCode: error.code,
    //       requestId: error.requestId,
    //     },
    //     extra: context,
    //   });
    // }
  }

  /**
   * 創建用戶友好的錯誤響應
   */
  static createErrorResponse(error: any, statusCode: number = 500): Response {
    const sanitized = this.sanitize(error);
    
    return new Response(
      JSON.stringify({
        error: sanitized.message,
        code: sanitized.code,
        timestamp: sanitized.timestamp,
        requestId: sanitized.requestId,
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': sanitized.requestId || '',
        },
      }
    );
  }

  /**
   * Express/Next.js 中間件
   */
  static middleware() {
    return (err: any, req: any, res: any, next: any) => {
      const sanitized = this.sanitize(err);
      
      // 記錄錯誤
      this.logSecurely(err, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      // 返回消毒後的錯誤
      res.status(err.statusCode || 500).json(sanitized);
    };
  }
}

export default ErrorSanitizer;