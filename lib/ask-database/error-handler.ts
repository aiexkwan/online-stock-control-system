import { z } from 'zod';
import { calculateStringSimilarity } from '@/lib/utils/string-similarity';
import {
  ErrorResponse,
  ErrorResponseSchema,
  QueryContext,
  QueryContextSchema,
  SafeDatabaseValue,
  safeParseDatabaseValue,
} from '@/lib/validation/zod-schemas';

// Error Pattern Schema
const ErrorPatternSchema = z.object({
  pattern: z.instanceof(RegExp),
  handler: z.function(z.tuple([z.string()]), ErrorResponseSchema),
});

type ErrorPattern = z.infer<typeof ErrorPatternSchema>;

export class QueryErrorHandler {
  // 常見錯誤模式
  private errorPatterns: ErrorPattern[] = [
    {
      pattern: /column ["']?(\w+)["']? does not exist/i,
      handler: (error: string) => {
        const match = error.match(/column ["']?(\w+)["']?/i);
        const columnName = match ? match[1] : 'unknown';

        return {
          message: `Cannot find column "${columnName}"`,
          suggestion:
            'Please check the column name or use query suggestions to see available columns.',
          alternatives: this.suggestColumns(columnName),
          showSchema: true,
        };
      },
    },
    {
      pattern: /relation ["']?(\w+)["']? does not exist/i,
      handler: (error: string) => {
        const match = error.match(/relation ["']?(\w+)["']?/i);
        const tableName = match ? match[1] : 'unknown';

        return {
          message: `Cannot find table "${tableName}"`,
          suggestion:
            'Available tables include: record_palletinfo, record_inventory, data_order, record_history, etc.',
          alternatives: this.suggestTables(tableName),
          showSchema: true,
        };
      },
    },
    {
      pattern: /syntax error at or near/i,
      handler: (error: string) => ({
        message: 'SQL syntax error',
        suggestion: 'Try describing your query in simpler, more natural language.',
        showExamples: true,
        suggestions: [
          'Show all pallets in Await location',
          'What is the total stock for product MH001?',
          'List orders that are pending',
        ],
      }),
    },
    {
      pattern: /permission denied/i,
      handler: () => ({
        message: 'Permission denied',
        suggestion:
          'You do not have permission to access this data. Please contact your administrator.',
        showHelp: true,
      }),
    },
    {
      pattern: /timeout|too long/i,
      handler: () => ({
        message: 'Query timeout',
        suggestion:
          'The query took too long to execute. Try adding more specific filters or limiting the results.',
        suggestions: [
          'Add a date range filter (e.g., "in the last 7 days")',
          'Limit results (e.g., "top 10" or "first 100")',
          'Query specific products or orders instead of all',
        ],
      }),
    },
    {
      pattern: /division by zero/i,
      handler: () => ({
        message: 'Division by zero error',
        suggestion:
          'The calculation resulted in division by zero. This usually happens when calculating averages or percentages with no data.',
        showHelp: true,
      }),
    },
    {
      pattern: /invalid input syntax for type (\w+)/i,
      handler: (error: string) => {
        const match = error.match(/invalid input syntax for type (\w+)/i);
        const dataType = match ? match[1] : 'unknown';

        return {
          message: `Invalid data type`,
          suggestion: `The value provided doesn't match the expected ${dataType} type.`,
          suggestions: this.getDataTypeSuggestions(dataType),
        };
      },
    },
  ];

  // 表格映射
  private tableAliases: Record<string, string[]> = {
    record_palletinfo: ['pallet', 'pallets', 'plt', 'pallet_info'],
    record_inventory: ['inventory', 'stock', 'storage'],
    data_order: ['order', 'orders', 'customer_order'],
    record_history: ['history', 'movement', 'actions'],
    record_grn: ['grn', 'receiving', 'goods_receipt'],
    record_aco: ['aco', 'aco_order'],
    data_code: ['product', 'products', 'item', 'items'],
    record_transfer: ['transfer', 'transfers', 'movement'],
  };

  // 列名映射
  private columnAliases: Record<string, string[]> = {
    plt_num: ['pallet_number', 'pallet_no', 'plt_number'],
    product_code: ['product', 'item_code', 'sku'],
    product_qty: ['quantity', 'qty', 'amount'],
    loc: ['location', 'position', 'place'],
    stock: ['stock_qty', 'available', 'on_hand'],
    storage: ['storage_location', 'warehouse'],
    order_ref: ['order_number', 'order_no', 'reference'],
  };

  handleError(error: unknown, context: QueryContext): ErrorResponse {
    // 使用 Zod 驗證 context
    const validatedContext = QueryContextSchema.safeParse(context);
    if (!validatedContext.success) {
      console.warn('Invalid query context provided to error handler');
    }

    // 安全取得錯誤信息 - 使用 Zod 驗證
    const errorMessage = this.extractErrorMessage(error);

    // 1. 匹配錯誤模式
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern.handler(errorMessage);
      }
    }

    // 2. 通用錯誤處理
    return {
      message: 'Query error',
      details: this.sanitizeError(errorMessage),
      suggestions: this.generateSuggestions(context),
      showHelp: true,
    };
  }

  // 清理錯誤信息，移除敏感資料
  private sanitizeError(error: string): string {
    // 移除可能的敏感信息
    return error
      .replace(/\/\*.*?\*\//g, '') // 移除 SQL 註釋
      .replace(/--.*$/gm, '') // 移除行註釋
      .replace(/\b\d{4,}\b/g, 'XXXX') // 隱藏長數字
      .substring(0, 200); // 限制長度
  }

  // 建議相似的列名
  private suggestColumns(columnName: string): string[] {
    const suggestions: string[] = [];
    const lowerColumn = columnName.toLowerCase();

    // 檢查別名
    for (const [actual, aliases] of Object.entries(this.columnAliases)) {
      if (aliases.some(alias => alias.includes(lowerColumn) || lowerColumn.includes(alias))) {
        suggestions.push(actual);
      }
    }

    // 常用列名
    const commonColumns = [
      'plt_num',
      'product_code',
      'product_qty',
      'loc',
      'stock',
      'storage',
      'order_ref',
      'generate_time',
      'action',
      'time',
      'user_id',
    ];

    // 模糊匹配
    for (const col of commonColumns) {
      if (calculateStringSimilarity(lowerColumn, col.toLowerCase()) > 0.6) {
        suggestions.push(col);
      }
    }

    return [...new Set(suggestions)].slice(0, 3);
  }

  // 建議相似的表格名
  private suggestTables(tableName: string): string[] {
    const suggestions: string[] = [];
    const lowerTable = tableName.toLowerCase();

    // 檢查別名
    for (const [actual, aliases] of Object.entries(this.tableAliases)) {
      if (aliases.some(alias => alias.includes(lowerTable) || lowerTable.includes(alias))) {
        suggestions.push(actual);
      }
    }

    // 所有可用表格
    const allTables = Object.keys(this.tableAliases);

    // 模糊匹配
    for (const table of allTables) {
      if (calculateStringSimilarity(lowerTable, table.toLowerCase()) > 0.5) {
        suggestions.push(table);
      }
    }

    return [...new Set(suggestions)].slice(0, 3);
  }

  // 基於數據類型的建議
  private getDataTypeSuggestions(dataType: string): string[] {
    switch (dataType.toLowerCase()) {
      case 'integer':
      case 'numeric':
        return [
          'Use numeric values only (e.g., 123, not "123")',
          'Remove any text or special characters',
          'Check for decimal points in integer fields',
        ];

      case 'date':
      case 'timestamp':
        return [
          'Use date format: YYYY-MM-DD',
          "For date ranges, use \"between '2024-01-01' and '2024-12-31'\"",
          'Try natural language like "last 7 days" or "this month"',
        ];

      case 'boolean':
        return ['Use true/false or yes/no', 'For filters, try "where is_active = true"'];

      default:
        return ['Check the data type and format of your input'];
    }
  }

  // 生成智能建議
  private generateSuggestions(context: QueryContext): string[] {
    const suggestions: string[] = [];
    const query = context.query.toLowerCase();

    // 基於查詢內容的建議
    if (query.includes('stock') || query.includes('inventory')) {
      suggestions.push(
        'Try: "Show current stock levels"',
        'Try: "What products have low stock?"',
        'Try: "Show stock for product code MH001"'
      );
    }

    if (query.includes('order')) {
      suggestions.push(
        'Try: "Show pending orders"',
        'Try: "List orders from today"',
        'Try: "What is the status of order REF001?"'
      );
    }

    if (query.includes('pallet')) {
      suggestions.push(
        'Try: "Show pallets in Await location"',
        'Try: "Find pallet number 0312240001"',
        'Try: "List pallets created today"'
      );
    }

    // 基於之前的查詢
    if (context.previousQueries && context.previousQueries.length > 0) {
      suggestions.push(`Retry previous query: "${context.previousQueries[0]}"`);
    }

    return suggestions.slice(0, 3);
  }

  // 新增方法：安全提取錯誤消息
  private extractErrorMessage(error: unknown): string {
    if (error === null || error === undefined) {
      return 'Unknown error occurred';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object' && 'message' in error) {
      const messageValue = safeParseDatabaseValue((error as Record<string, unknown>).message);
      if (typeof messageValue === 'string') {
        return messageValue;
      }
    }

    // Fallback to string conversion
    return String(error);
  }

  // 新增方法：驗證錯誤回應
  validateErrorResponse(response: unknown): response is ErrorResponse {
    return ErrorResponseSchema.safeParse(response).success;
  }

  // 新增方法：創建標準錯誤回應
  createStandardErrorResponse(message: string, details?: string): ErrorResponse {
    const response: ErrorResponse = {
      message,
      details,
      showHelp: true,
    };

    // 驗證回應格式
    if (!this.validateErrorResponse(response)) {
      console.warn('Created invalid error response format');
    }

    return response;
  }
}

// 導出單例
export const queryErrorHandler = new QueryErrorHandler();
