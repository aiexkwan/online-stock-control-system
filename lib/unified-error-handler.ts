import { DatabaseRecord } from './types/database';

// Unified Error Handler - 整合所有錯誤處理功能
// 支持客戶端和服務端使用，簡化錯誤分類和恢復策略

export enum ErrorType {
  // SQL 相關錯誤
  COLUMN_NOT_EXISTS = 'column_not_exists',
  TABLE_NOT_EXISTS = 'table_not_exists',
  SYNTAX_ERROR = 'syntax_error',
  AMBIGUOUS_COLUMN = 'ambiguous_column',
  TYPE_MISMATCH = 'type_mismatch',

  // 查詢複雜度錯誤
  QUERY_TOO_COMPLEX = 'query_too_complex',
  QUERY_TIMEOUT = 'query_timeout',
  RESULT_SET_TOO_LARGE = 'result_set_too_large',

  // API 錯誤
  OPENAI_ERROR = 'openai_error',
  OPENAI_TIMEOUT = 'openai_timeout',
  OPENAI_RATE_LIMIT = 'openai_rate_limit',

  // 權限錯誤
  AUTH_ERROR = 'auth_error',
  PERMISSION_DENIED = 'permission_denied',

  // 網絡錯誤
  NETWORK_ERROR = 'network_error',

  // 表單驗證錯誤
  VALIDATION_ERROR = 'validation_error',

  // 其他錯誤
  UNKNOWN_ERROR = 'unknown_error',
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// 統一的錯誤分類結果
interface ClassificationResult {
  errorType: ErrorType;
  confidence: number;
  features: {
    column?: string;
    table?: string;
    syntaxIssue?: string;
  };
}

// 錯誤特徵類型
interface ErrorFeatures {
  column?: string;
  table?: string;
  syntaxIssue?: string;
  query?: string;
  duration?: number;
  resultSize?: number;
  [key: string]: unknown;
}

// 錯誤上下文類型
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// 錯誤恢復結果
export interface RecoveryResult {
  success: boolean;
  newSql?: string;
  fixedSQL?: string;
  suggestion?: string;
  alternativeApproach?: string;
}

// 錯誤模式定義（簡化版）
const ERROR_PATTERNS = {
  [ErrorType.COLUMN_NOT_EXISTS]: [
    /column\s+"([^"]+)"\s+does\s+not\s+exist/i,
    /no\s+column\s+named\s+"([^"]+)"/i,
    /unknown\s+column\s+'([^']+)'/i,
  ],
  [ErrorType.TABLE_NOT_EXISTS]: [
    /relation\s+"([^"]+)"\s+does\s+not\s+exist/i,
    /table\s+"([^"]+)"\s+doesn't\s+exist/i,
    /no\s+such\s+table:\s+([^\s]+)/i,
  ],
  [ErrorType.SYNTAX_ERROR]: [
    /syntax\s+error\s+at\s+or\s+near\s+"([^"]+)"/i,
    /SQL\s+syntax.*near\s+'([^']+)'/i,
    /unexpected\s+token/i,
  ],
  [ErrorType.AMBIGUOUS_COLUMN]: [
    /column\s+reference\s+"([^"]+)"\s+is\s+ambiguous/i,
    /ambiguous\s+column\s+name/i,
  ],
  [ErrorType.TYPE_MISMATCH]: [
    /operator does not exist:.*\s+([^\s]+)\s+/i,
    /invalid input syntax for type/i,
    /cannot cast/i,
  ],
  [ErrorType.QUERY_TIMEOUT]: [
    /query timeout/i,
    /canceling statement due to statement timeout/i,
    /execution time exceeded/i,
  ],
  [ErrorType.OPENAI_RATE_LIMIT]: [/rate limit/i, /too many requests/i, /quota exceeded/i],
};

// 統一的錯誤分類函數
export function classifyError(error: unknown, sql?: string): ClassificationResult {
  const errorMessage = (error as Error)?.message || String(error);

  // 嘗試匹配錯誤模式
  for (const [errorType, patterns] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        return {
          errorType: errorType as ErrorType,
          confidence: 0.9,
          features: extractErrorFeatures(match, errorType as ErrorType),
        };
      }
    }
  }

  // 基於關鍵詞的分類
  const lowerMessage = errorMessage.toLowerCase();
  if (lowerMessage.includes('column')) {
    return { errorType: ErrorType.COLUMN_NOT_EXISTS, confidence: 0.7, features: {} };
  }
  if (lowerMessage.includes('table') || lowerMessage.includes('relation')) {
    return { errorType: ErrorType.TABLE_NOT_EXISTS, confidence: 0.7, features: {} };
  }
  if (lowerMessage.includes('syntax')) {
    return { errorType: ErrorType.SYNTAX_ERROR, confidence: 0.7, features: {} };
  }
  if (lowerMessage.includes('timeout')) {
    return { errorType: ErrorType.QUERY_TIMEOUT, confidence: 0.8, features: {} };
  }
  if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
    return { errorType: ErrorType.PERMISSION_DENIED, confidence: 0.8, features: {} };
  }

  return { errorType: ErrorType.UNKNOWN_ERROR, confidence: 0.5, features: {} };
}

// 提取錯誤特徵
function extractErrorFeatures(match: RegExpMatchArray, errorType: ErrorType) {
  const features: DatabaseRecord = {};

  switch (errorType) {
    case ErrorType.COLUMN_NOT_EXISTS:
    case ErrorType.AMBIGUOUS_COLUMN:
      if (match[1]) features.column = match[1];
      break;
    case ErrorType.TABLE_NOT_EXISTS:
      if (match[1]) features.table = match[1];
      break;
    case ErrorType.SYNTAX_ERROR:
      if (match[1]) features.syntaxIssue = match[1];
      break;
  }

  return features;
}

// 獲取錯誤嚴重程度
export function getErrorSeverity(errorType: ErrorType): ErrorSeverity {
  const severityMap: Record<ErrorType, ErrorSeverity> = {
    [ErrorType.VALIDATION_ERROR]: 'low',
    [ErrorType.COLUMN_NOT_EXISTS]: 'medium',
    [ErrorType.TABLE_NOT_EXISTS]: 'medium',
    [ErrorType.SYNTAX_ERROR]: 'medium',
    [ErrorType.AMBIGUOUS_COLUMN]: 'medium',
    [ErrorType.TYPE_MISMATCH]: 'medium',
    [ErrorType.QUERY_TOO_COMPLEX]: 'high',
    [ErrorType.QUERY_TIMEOUT]: 'high',
    [ErrorType.RESULT_SET_TOO_LARGE]: 'high',
    [ErrorType.OPENAI_ERROR]: 'high',
    [ErrorType.OPENAI_TIMEOUT]: 'high',
    [ErrorType.OPENAI_RATE_LIMIT]: 'high',
    [ErrorType.AUTH_ERROR]: 'critical',
    [ErrorType.PERMISSION_DENIED]: 'critical',
    [ErrorType.NETWORK_ERROR]: 'high',
    [ErrorType.UNKNOWN_ERROR]: 'medium',
  };

  return severityMap[errorType] || 'medium';
}

// 生成用戶友好的錯誤消息
export function generateUserMessage(errorType: ErrorType, features?: ErrorFeatures): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.COLUMN_NOT_EXISTS]: `Column '${features?.column || 'unknown'}' not found. Please check the column name.`,
    [ErrorType.TABLE_NOT_EXISTS]: `Table '${features?.table || 'unknown'}' not found. Please verify the table name.`,
    [ErrorType.SYNTAX_ERROR]: 'SQL syntax error. Please check your query structure.',
    [ErrorType.AMBIGUOUS_COLUMN]: `Column '${features?.column || 'unknown'}' is ambiguous. Please specify the table name.`,
    [ErrorType.TYPE_MISMATCH]: 'Data type mismatch. Please check your query conditions.',
    [ErrorType.QUERY_TOO_COMPLEX]: 'Query is too complex. Try simplifying your request.',
    [ErrorType.QUERY_TIMEOUT]: 'Query took too long to execute. Try a simpler query.',
    [ErrorType.RESULT_SET_TOO_LARGE]: 'Too many results. Please add more specific conditions.',
    [ErrorType.OPENAI_ERROR]: 'AI service error. Please try again.',
    [ErrorType.OPENAI_TIMEOUT]: 'AI service timeout. Please try again.',
    [ErrorType.OPENAI_RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
    [ErrorType.AUTH_ERROR]: 'Authentication failed. Please log in again.',
    [ErrorType.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    [ErrorType.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
    [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  };

  return messages[errorType] || 'An error occurred. Please try again.';
}

// 簡化的錯誤恢復策略
export async function attemptErrorRecovery(
  errorType: ErrorType,
  sql: string,
  error: Error
): Promise<RecoveryResult> {
  switch (errorType) {
    case ErrorType.COLUMN_NOT_EXISTS:
      return attemptColumnRecovery(sql, error);

    case ErrorType.TABLE_NOT_EXISTS:
      return attemptTableRecovery(sql, error);

    case ErrorType.SYNTAX_ERROR:
      return attemptSyntaxRecovery(sql, error);

    case ErrorType.AMBIGUOUS_COLUMN:
      return attemptAmbiguousColumnRecovery(sql, error);

    default:
      return { success: false, suggestion: generateUserMessage(errorType) };
  }
}

// 列名恢復
async function attemptColumnRecovery(sql: string, error: Error): Promise<RecoveryResult> {
  const columnMatch = error.message.match(/column "([^"]+)"/);
  if (!columnMatch) return { success: false };

  const badColumn = columnMatch[1];
  const similarColumn = findSimilarColumn(badColumn);

  if (similarColumn) {
    const fixedSQL = sql.replace(new RegExp(`\\b${badColumn}\\b`, 'gi'), similarColumn);

    return {
      success: true,
      newSql: fixedSQL,
      fixedSQL,
      suggestion: `Column '${badColumn}' replaced with '${similarColumn}'`,
    };
  }

  return {
    success: false,
    suggestion: `Column '${badColumn}' not found. Available columns might include: product_code, product_name, created_at, etc.`,
  };
}

// 表名恢復
async function attemptTableRecovery(sql: string, error: Error): Promise<RecoveryResult> {
  const tableMatch = error.message.match(/relation "([^"]+)"|table "([^"]+)"/);
  if (!tableMatch) return { success: false };

  const badTable = tableMatch[1] || tableMatch[2];
  const similarTable = findSimilarTable(badTable);

  if (similarTable) {
    const fixedSQL = sql.replace(new RegExp(`\\b${badTable}\\b`, 'gi'), similarTable);

    return {
      success: true,
      newSql: fixedSQL,
      fixedSQL,
      suggestion: `Table '${badTable}' replaced with '${similarTable}'`,
    };
  }

  return {
    success: false,
    suggestion: `Table '${badTable}' not found. Common tables: record_palletinfo, record_history, data_code, etc.`,
  };
}

// 語法恢復
async function attemptSyntaxRecovery(sql: string, error: Error): Promise<RecoveryResult> {
  // 檢查常見語法錯誤
  let fixedSQL = sql;
  let fixed = false;

  // 缺少 FROM 子句
  if (sql.toLowerCase().includes('select') && !sql.toLowerCase().includes('from')) {
    return {
      success: false,
      suggestion: 'Missing FROM clause. Please specify which table to query.',
    };
  }

  // 缺少引號
  if (error.message.includes('syntax error') && sql.includes('=')) {
    const match = sql.match(/=\s*([a-zA-Z]+)(?:\s|$)/);
    if (match && !match[1].match(/^(true|false|null)$/i)) {
      fixedSQL = sql.replace(match[0], `= '${match[1]}'`);
      fixed = true;
    }
  }

  if (fixed) {
    return {
      success: true,
      newSql: fixedSQL,
      fixedSQL,
      suggestion: 'Added missing quotes around string value',
    };
  }

  return {
    success: false,
    suggestion: 'SQL syntax error. Please check for missing keywords, quotes, or commas.',
  };
}

// 歧義列名恢復
async function attemptAmbiguousColumnRecovery(sql: string, error: Error): Promise<RecoveryResult> {
  const columnMatch = error.message.match(/column.*"([^"]+)"/);
  if (!columnMatch) return { success: false };

  const ambiguousColumn = columnMatch[1];

  return {
    success: false,
    suggestion: `Column '${ambiguousColumn}' exists in multiple tables. Please specify the table name (e.g., table.${ambiguousColumn})`,
  };
}

// 查找相似列名（簡化版）
function findSimilarColumn(columnName: string): string | null {
  const commonColumns: Record<string, string> = {
    product: 'product_code',
    code: 'product_code',
    name: 'product_name',
    date: 'created_at',
    time: 'created_at',
    qty: 'product_qty',
    quantity: 'product_qty',
    pallet: 'plt_num',
    location: 'loc',
    user: 'operator_id',
    staff: 'operator_name',
    status: 'plt_status',
    order: 'order_ref',
    description: 'description',
  };

  const lower = columnName.toLowerCase();
  return commonColumns[lower] || null;
}

// 查找相似表名（簡化版）
function findSimilarTable(tableName: string): string | null {
  const commonTables: Record<string, string> = {
    pallet: 'record_palletinfo',
    pallets: 'record_palletinfo',
    history: 'record_history',
    product: 'data_code',
    products: 'data_code',
    inventory: 'record_inventory',
    transfer: 'record_transfer',
    transfers: 'record_transfer',
    user: 'data_id',
    users: 'data_id',
    supplier: 'data_supplier',
    suppliers: 'data_supplier',
    order: 'data_order',
    orders: 'data_order',
    grn: 'record_grn',
  };

  const lower = tableName.toLowerCase();
  return commonTables[lower] || null;
}

// 增強錯誤消息（用於開發環境）
export function enhanceErrorMessage(
  errorType: ErrorType, 
  originalMessage: string, 
  sql?: string
): {
  userMessage: string;
  technicalDetails: string;
  suggestions: string[];
} {
  const userMessage = generateUserMessage(errorType);
  
  if (process.env.NODE_ENV === 'production') {
    return {
      userMessage,
      technicalDetails: 'Error details hidden in production',
      suggestions: [userMessage]
    };
  }

  // 開發環境提供更詳細的錯誤信息
  const debugInfo = `[${errorType}] ${originalMessage}`;
  const suggestions = [];
  
  // 根據錯誤類型提供具體建議
  switch (errorType) {
    case ErrorType.COLUMN_NOT_EXISTS:
      suggestions.push('Check the column name spelling', 'Verify the table schema');
      break;
    case ErrorType.TABLE_NOT_EXISTS:
      suggestions.push('Verify the table name', 'Check if the table exists in the database');
      break;
    case ErrorType.SYNTAX_ERROR:
      suggestions.push('Review SQL syntax', 'Check for missing quotes or commas');
      break;
    default:
      suggestions.push('Try a simpler query', 'Contact support if the issue persists');
  }

  return {
    userMessage,
    technicalDetails: debugInfo + (sql ? `\nSQL: ${sql}` : ''),
    suggestions
  };
}

// 記錄錯誤模式（用於分析和改進）
export async function logErrorPattern(
  errorType: ErrorType,
  error: Error,
  context?: ErrorContext
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Error Pattern]', {
      type: errorType,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // 在生產環境中，可以發送到錯誤追蹤服務
  // 例如 Sentry, LogRocket 等
}

// 導出舊 API 的兼容函數
export { classifyError as classifyErrorEnhanced };
export function getRecoveryStrategy(errorType: ErrorType) {
  return {
    canAutoRecover: [
      ErrorType.COLUMN_NOT_EXISTS,
      ErrorType.TABLE_NOT_EXISTS,
      ErrorType.SYNTAX_ERROR,
      ErrorType.AMBIGUOUS_COLUMN,
    ].includes(errorType),
    strategy: 'automatic',
    execute: async () => attemptErrorRecovery(errorType, '', new Error()),
    suggestion: generateUserMessage(errorType),
  };
}
