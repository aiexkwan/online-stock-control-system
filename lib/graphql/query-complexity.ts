/**
 * GraphQL Query Complexity Analysis
 * Week 1.2b: High Priority Pagination and Performance Optimization
 * Date: 2025-07-03
 *
 * This module implements query complexity analysis to prevent expensive queries.
 */

import { createComplexityLimitRule } from 'graphql-query-complexity';
import depthLimit from 'graphql-depth-limit';

// ================================
// 1. 複雜度計算規則 (Complexity Calculation Rules)
// ================================

export const ComplexityAnalysis = {
  // 最大複雜度限制
  maxComplexity: 1000,

  // 最大查詢深度
  maxDepth: 10,

  // 預設欄位成本
  defaultCost: 1,

  // 高成本欄位定義
  expensiveFields: {
    // Connection 類型的成本計算
    connections: {
      // 基於 first/last 參數計算成本
      costMultiplier: (args: any) => {
        const first = args.first || 20;
        const last = args.last || 20;
        return Math.min(first || last, 100); // 最大100
      },
    },

    // 關聯欄位成本
    relationships: {
      movements: 5, // 移動記錄查詢成本較高
      inventoryRecords: 3, // 庫存記錄
      grnRecords: 2, // GRN 記錄
      pallets: 2, // 托盤列表
      orders: 3, // 訂單列表
    },

    // 業務邏輯查詢成本
    businessLogic: {
      getLowStockProducts: 10, // 需要複雜計算
      getPendingOrders: 8, // 涉及多表查詢
      getActiveTransfers: 6, // 實時數據查詢
      processStocktake: 15, // 複雜業務邏輯
    },
  },
};

// ================================
// 2. 複雜度規則配置 (Complexity Rules Configuration)
// ================================

export const complexityLimitRule = createComplexityLimitRule(ComplexityAnalysis.maxComplexity, {
  // 自定義欄位成本計算
  fieldExtensions: true,

  // 成本計算函數
  createError: (max: number, actual: number) => {
    return new Error(
      `Query complexity ${actual} exceeds maximum allowed complexity ${max}. ` +
        `Consider using pagination, reducing query depth, or splitting into multiple queries.`
    );
  },

  // 複雜度計算器
  estimators: [
    // Connection 類型的成本估算
    {
      // 根據分頁參數計算成本
      estimateComplexity: ({ field, args }) => {
        if (field.name.endsWith('Connection') || field.name.includes('Connection')) {
          const first = args.first || 20;
          const last = args.last || 20;
          return Math.min(first || last, 100);
        }

        // 檢查是否為高成本欄位
        const fieldCost = ComplexityAnalysis.expensiveFields.relationships[field.name];
        if (fieldCost) {
          return fieldCost;
        }

        // 業務邏輯查詢成本
        const businessCost = ComplexityAnalysis.expensiveFields.businessLogic[field.name];
        if (businessCost) {
          return businessCost;
        }

        return ComplexityAnalysis.defaultCost;
      },
    },
  ],
});

// ================================
// 3. 深度限制規則 (Depth Limit Rules)
// ================================

export const depthLimitRule = depthLimit(ComplexityAnalysis.maxDepth, {
  createError: (max: number, actual: number) => {
    return new Error(
      `Query depth ${actual} exceeds maximum allowed depth ${max}. ` +
        `Consider flattening your query structure or using fragments.`
    );
  },
});

// ================================
// 4. 查詢分析器 (Query Analyzer)
// ================================

export class QueryAnalyzer {
  static analyzeQuery(query: string, variables?: any) {
    // 分析查詢模式
    const analysis = {
      hasConnections: query.includes('Connection'),
      hasPagination: query.includes('first') || query.includes('last'),
      hasExpensiveFields: this.detectExpensiveFields(query),
      estimatedComplexity: this.estimateComplexity(query, variables),
      recommendations: this.generateRecommendations(query),
    };

    return analysis;
  }

  private static detectExpensiveFields(query: string): string[] {
    const expensiveFields = Object.keys(ComplexityAnalysis.expensiveFields.relationships);
    const businessFields = Object.keys(ComplexityAnalysis.expensiveFields.businessLogic);

    return [...expensiveFields, ...businessFields].filter(field => query.includes(field));
  }

  static estimateComplexity(query: string, variables?: any): number {
    // 簡單的複雜度估算
    let complexity = 10; // 基礎成本

    // 計算欄位數量
    const fieldCount = (query.match(/\w+/g) || []).length;
    complexity += fieldCount;

    // Connection 查詢額外成本
    if (query.includes('Connection')) {
      const firstMatch = query.match(/first:\s*(\d+)/);
      const first = firstMatch ? parseInt(firstMatch[1]) : 20;
      complexity += Math.min(first, 100);
    }

    // 巢狀層級成本
    const nestingLevel = (query.match(/{/g) || []).length;
    complexity += nestingLevel * 2;

    return complexity;
  }

  private static generateRecommendations(query: string): string[] {
    const recommendations: string[] = [];

    if (!query.includes('first') && query.includes('Connection')) {
      recommendations.push('Consider adding pagination with "first" parameter');
    }

    if (query.includes('movements') && !query.includes('first')) {
      recommendations.push('Use pagination for expensive "movements" field');
    }

    const nestingLevel = (query.match(/{/g) || []).length;
    if (nestingLevel > 5) {
      recommendations.push('Consider reducing query nesting depth');
    }

    return recommendations;
  }
}

// ================================
// 5. 性能監控 (Performance Monitoring)
// ================================

export class QueryPerformanceMonitor {
  private static queryStats = new Map<
    string,
    {
      count: number;
      totalTime: number;
      maxTime: number;
      avgComplexity: number;
    }
  >();

  static trackQuery(operationName: string, complexity: number, executionTime: number) {
    const stats = this.queryStats.get(operationName) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      avgComplexity: 0,
    };

    stats.count++;
    stats.totalTime += executionTime;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.avgComplexity = (stats.avgComplexity + complexity) / 2;

    this.queryStats.set(operationName, stats);

    // 警告慢查詢
    if (executionTime > 2000) {
      // 2秒
      console.warn(`Slow query detected: ${operationName} (${executionTime}ms)`);
    }

    // 警告高複雜度查詢
    if (complexity > 500) {
      console.warn(`High complexity query: ${operationName} (complexity: ${complexity})`);
    }
  }

  static getPerformanceReport() {
    const report = Array.from(this.queryStats.entries()).map(([operation, stats]) => ({
      operation,
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
      maxTime: stats.maxTime,
      avgComplexity: stats.avgComplexity,
    }));

    return {
      totalQueries: Array.from(this.queryStats.values()).reduce((sum, s) => sum + s.count, 0),
      slowQueries: report.filter(r => r.avgTime > 1000),
      complexQueries: report.filter(r => r.avgComplexity > 300),
      topQueries: report.sort((a, b) => b.count - a.count).slice(0, 10),
    };
  }

  static resetStats() {
    this.queryStats.clear();
  }
}

// ================================
// 6. Apollo Server 整合配置 (Apollo Server Integration)
// ================================

export const validationRules = [complexityLimitRule, depthLimitRule];

export const performancePlugins = [
  // 查詢複雜度追蹤插件
  {
    requestDidStart() {
      return {
        willSendResponse(requestContext: any) {
          const { request, response, queryHash } = requestContext;

          if (request.operationName && response.http?.body) {
            const executionTime = Date.now() - requestContext.requestStartTime;

            // 估算複雜度（實際使用時可從 context 獲取精確值）
            const complexity = QueryAnalyzer.estimateComplexity(request.query);

            QueryPerformanceMonitor.trackQuery(request.operationName, complexity, executionTime);
          }
        },
      };
    },
  },
];

// 導出配置用於 Apollo Server
export const apolloServerConfig = {
  validationRules,
  plugins: performancePlugins,
  introspection: (process.env.NODE_ENV as string) !== 'production',
  playground: (process.env.NODE_ENV as string) !== 'production',
};

const queryComplexity = {
  ComplexityAnalysis,
  complexityLimitRule,
  depthLimitRule,
  QueryAnalyzer,
  QueryPerformanceMonitor,
  apolloServerConfig,
};

export default queryComplexity;
