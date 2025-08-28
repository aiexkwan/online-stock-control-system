/**
 * Enhanced Logger Sanitizer
 * 提供進階的日誌數據清理和安全過濾功能
 */

import { sanitizeLogData, logger } from '@/lib/logger';

// 敏感欄位列表 - 擴展版
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'accessToken',
  'refreshToken',
  'sessionId',
  'cookie',
  'creditCard',
  'bankAccount',
  'ssn',
  'socialSecurity',
  'email',
  'phone',
  'address',
  'personalInfo',
  'userId',
  'clientSecret',
  'privateKey',
  'signature',
  'hash',
];

// PII (個人識別資訊) 模式
const PII_PATTERNS = [
  /\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, // Email
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit Card
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone Numbers
];

/**
 * 增強型數據清理函數
 * 比基礎 sanitizeLogData 提供更全面的清理
 */
export const enhancedSanitizeLogData = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') {
    return sanitizeStringForPII(String(data));
  }

  // 使用基礎清理器作為第一道防線
  let sanitized = sanitizeLogData(data);

  // 進行更深層的清理
  if (Array.isArray(sanitized)) {
    return sanitized.map(item => enhancedSanitizeLogData(item));
  }

  if (typeof sanitized === 'object' && sanitized !== null) {
    const cleaned = { ...sanitized } as Record<string, unknown>;

    for (const [key, value] of Object.entries(cleaned)) {
      // 檢查欄位名稱
      if (isSensitiveField(key)) {
        cleaned[key] = '[REDACTED]';
      }
      // 檢查值內容
      else if (typeof value === 'string') {
        cleaned[key] = sanitizeStringForPII(value);
      }
      // 遞歸處理嵌套物件
      else if (typeof value === 'object' && value !== null) {
        cleaned[key] = enhancedSanitizeLogData(value);
      }
    }

    return cleaned;
  }

  return sanitized;
};

/**
 * 檢查欄位名稱是否敏感
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(sensitive => lowerFieldName.includes(sensitive.toLowerCase()));
}

/**
 * 清理字串中的 PII 資訊
 */
function sanitizeStringForPII(str: string): string {
  if (typeof str !== 'string') return str;

  let sanitized = str;

  // 應用 PII 模式替換
  PII_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[PII_REDACTED]');
  });

  return sanitized;
}

/**
 * 安全日誌記錄函數
 * 自動應用增強清理後記錄日誌
 */
export const secureLog = {
  info: (data: unknown, message?: string) => {
    logger.info(enhancedSanitizeLogData(data), message || 'Secure log');
  },
  warn: (data: unknown, message?: string) => {
    logger.warn(enhancedSanitizeLogData(data), message || 'Secure warning');
  },
  error: (data: unknown, message?: string) => {
    logger.error(enhancedSanitizeLogData(data), message || 'Secure error');
  },
  debug: (data: unknown, message?: string) => {
    logger.debug(enhancedSanitizeLogData(data), message || 'Secure debug');
  },
};

/**
 * 建立安全的子日誌器
 */
export const createSecureLogger = (module: string) => {
  const childLogger = logger.child({ module });

  return {
    info: (data: unknown, message?: string) => {
      childLogger.info(enhancedSanitizeLogData(data), message);
    },
    warn: (data: unknown, message?: string) => {
      childLogger.warn(enhancedSanitizeLogData(data), message);
    },
    error: (data: unknown, message?: string) => {
      childLogger.error(enhancedSanitizeLogData(data), message);
    },
    debug: (data: unknown, message?: string) => {
      childLogger.debug(enhancedSanitizeLogData(data), message);
    },
  };
};

/**
 * 檢查日誌內容是否安全
 * 返回清理結果和安全等級
 */
export const analyzeLogSecurity = (
  data: unknown
): {
  sanitized: unknown;
  securityLevel: 'safe' | 'warning' | 'danger';
  sensitiveFieldsFound: string[];
} => {
  const sanitized = enhancedSanitizeLogData(data);
  let sensitiveFieldsFound: string[] = [];
  let securityLevel: 'safe' | 'warning' | 'danger' = 'safe';

  // 檢查是否有敏感資料被清理
  const dataStr = JSON.stringify(data);
  const sanitizedStr = JSON.stringify(sanitized);

  if (dataStr !== sanitizedStr) {
    securityLevel = 'warning';

    // 檢查具體被清理的欄位
    if (dataStr.includes('[REDACTED]') || sanitizedStr.includes('[REDACTED]')) {
      securityLevel = 'danger';
      sensitiveFieldsFound.push('sensitive_fields');
    }

    if (dataStr.includes('[PII_REDACTED]') || sanitizedStr.includes('[PII_REDACTED]')) {
      securityLevel = 'danger';
      sensitiveFieldsFound.push('pii_data');
    }
  }

  return {
    sanitized,
    securityLevel,
    sensitiveFieldsFound,
  };
};

// 預設導出增強清理器
export default enhancedSanitizeLogData;
