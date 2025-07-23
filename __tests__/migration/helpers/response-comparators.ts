/**
 * GraphQL vs REST API 回應比較工具
 * QA專家 - 資料結構標準化和深度比較輔助函數
 */

import { DeepPartial } from '@/types/utils';

export interface NormalizedInventoryResponse {
  products: NormalizedProduct[];
  summary: NormalizedSummary;
  metadata?: NormalizedMetadata;
}

export interface NormalizedProduct {
  productCode: string;
  description: string;
  currentStock: number;
  orderDemand: number;
  remainingStock: number;
  isSufficient: boolean;
  fulfillmentRate: number;
}

export interface NormalizedSummary {
  totalStock: number;
  totalDemand: number;
  totalRemaining: number;
  overallSufficient: boolean;
  sufficientCount: number;
  insufficientCount: number;
}

export interface NormalizedMetadata {
  calculationTime?: string;
  queryTime?: string;
  cacheHit?: boolean;
  executionTime?: number;
}

export interface NormalizedHistoryTree {
  nodes: NormalizedHistoryNode[];
  relationships: NormalizedRelationship[];
  pagination: NormalizedPagination;
}

export interface NormalizedHistoryNode {
  id: string;
  type: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface NormalizedRelationship {
  parent: string;
  child: string;
  type: string;
}

export interface NormalizedPagination {
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

/**
 * 標準化 GraphQL 庫存分析回應
 */
export function normalizeGraphQLResponse(graphqlData: any): NormalizedInventoryResponse {
  if (!graphqlData) {
    throw new Error('GraphQL response data is undefined');
  }

  return {
    products: (graphqlData.products || []).map((product: any) => ({
      productCode: product.productCode || '',
      description: product.description || '',
      currentStock: Number(product.currentStock) || 0,
      orderDemand: Number(product.orderDemand) || 0,
      remainingStock: Number(product.remainingStock) || 0,
      isSufficient: Boolean(product.isSufficient),
      fulfillmentRate: Number(product.fulfillmentRate) || 0
    })),
    summary: {
      totalStock: Number(graphqlData.summary?.totalStock) || 0,
      totalDemand: Number(graphqlData.summary?.totalDemand) || 0,
      totalRemaining: Number(graphqlData.summary?.totalRemaining) || 0,
      overallSufficient: Boolean(graphqlData.summary?.overallSufficient),
      sufficientCount: Number(graphqlData.summary?.sufficientCount) || 0,
      insufficientCount: Number(graphqlData.summary?.insufficientCount) || 0
    },
    metadata: graphqlData.metadata ? {
      calculationTime: graphqlData.metadata.calculationTime,
      queryTime: graphqlData.metadata.queryTime,
      cacheHit: Boolean(graphqlData.metadata.cacheHit),
      executionTime: Number(graphqlData.metadata.executionTime) || 0
    } : undefined
  };
}

/**
 * 標準化 REST API 庫存分析回應
 */
export function normalizeRESTResponse(restData: any): NormalizedInventoryResponse {
  if (!restData) {
    throw new Error('REST response data is undefined');
  }

  // 處理 Widget API wrapper 格式
  let actualData = restData;
  if (restData.widgets && Array.isArray(restData.widgets)) {
    const inventoryWidget = restData.widgets.find((w: any) => 
      w.widgetId === 'inventory_ordered_analysis'
    );
    if (inventoryWidget?.data?.inventoryAnalysis) {
      actualData = inventoryWidget.data.inventoryAnalysis;
    } else if (inventoryWidget?.data) {
      actualData = inventoryWidget.data;
    }
  }

  return {
    products: (actualData.products || []).map((product: any) => ({
      productCode: product.productCode || product.product_code || '',
      description: product.description || product.product_description || '',
      currentStock: Number(product.currentStock || product.current_stock) || 0,
      orderDemand: Number(product.orderDemand || product.order_demand) || 0,
      remainingStock: Number(product.remainingStock || product.remaining_stock) || 0,
      isSufficient: Boolean(product.isSufficient || product.is_sufficient),
      fulfillmentRate: Number(product.fulfillmentRate || product.fulfillment_rate) || 0
    })),
    summary: {
      totalStock: Number(actualData.summary?.totalStock || actualData.summary?.total_stock) || 0,
      totalDemand: Number(actualData.summary?.totalDemand || actualData.summary?.total_demand) || 0,
      totalRemaining: Number(actualData.summary?.totalRemaining || actualData.summary?.total_remaining) || 0,
      overallSufficient: Boolean(actualData.summary?.overallSufficient || actualData.summary?.overall_sufficient),
      sufficientCount: Number(actualData.summary?.sufficientCount || actualData.summary?.sufficient_count) || 0,
      insufficientCount: Number(actualData.summary?.insufficientCount || actualData.summary?.insufficient_count) || 0
    },
    metadata: actualData.metadata ? {
      calculationTime: actualData.metadata.calculationTime || actualData.metadata.calculation_time,
      queryTime: actualData.metadata.queryTime || actualData.metadata.query_time,
      cacheHit: Boolean(actualData.metadata.cacheHit || actualData.metadata.cache_hit),
      executionTime: Number(actualData.metadata.executionTime || actualData.metadata.execution_time) || 0
    } : undefined
  };
}

/**
 * 標準化 GraphQL 歷史樹回應
 */
export function normalizeGraphQLHistoryTree(graphqlData: any): NormalizedHistoryTree {
  if (!graphqlData) {
    throw new Error('GraphQL history tree data is undefined');
  }

  return {
    nodes: (graphqlData.nodes || []).map((node: any) => ({
      id: node.id || '',
      type: node.type || '',
      timestamp: node.timestamp || '',
      description: node.description || '',
      metadata: node.metadata || {}
    })),
    relationships: (graphqlData.relationships || []).map((rel: any) => ({
      parent: rel.parent || '',
      child: rel.child || '',
      type: rel.type || ''
    })),
    pagination: {
      total: Number(graphqlData.pagination?.total) || 0,
      hasMore: Boolean(graphqlData.pagination?.hasMore),
      nextOffset: graphqlData.pagination?.nextOffset
    }
  };
}

/**
 * 標準化 REST API 歷史樹回應
 */
export function normalizeRESTHistoryTree(restData: any): NormalizedHistoryTree {
  if (!restData) {
    throw new Error('REST history tree data is undefined');
  }

  let actualData = restData;
  if (restData.widgets && Array.isArray(restData.widgets)) {
    const historyWidget = restData.widgets.find((w: any) => 
      w.widgetId === 'history_tree'
    );
    if (historyWidget?.data) {
      actualData = historyWidget.data;
    }
  }

  return {
    nodes: (actualData.nodes || []).map((node: any) => ({
      id: node.id || '',
      type: node.type || '',
      timestamp: node.timestamp || node.created_at || '',
      description: node.description || '',
      metadata: node.metadata || {}
    })),
    relationships: (actualData.relationships || []).map((rel: any) => ({
      parent: rel.parent || rel.parent_id || '',
      child: rel.child || rel.child_id || '',
      type: rel.type || rel.relationship_type || ''
    })),
    pagination: {
      total: Number(actualData.pagination?.total || actualData.total_count) || 0,
      hasMore: Boolean(actualData.pagination?.hasMore || actualData.has_more),
      nextOffset: actualData.pagination?.nextOffset || actualData.next_offset
    }
  };
}

/**
 * 深度比較兩個物件，忽略指定欄位
 */
export function deepCompareObjects<T>(
  obj1: T,
  obj2: T,
  ignoreFields: string[] = ['timestamp', 'executionTime', 'queryTime'],
  tolerance: number = 0.01
): { isEqual: boolean; differences: string[] } {
  const differences: string[] = [];

  function compareRecursive(a: any, b: any, path: string = ''): void {
    if (a === b) return;

    if (typeof a !== typeof b) {
      differences.push(`${path}: type mismatch (${typeof a} vs ${typeof b})`);
      return;
    }

    if (typeof a === 'number' && typeof b === 'number') {
      if (Math.abs(a - b) > tolerance) {
        differences.push(`${path}: numeric difference (${a} vs ${b}, tolerance: ${tolerance})`);
      }
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        differences.push(`${path}: array length mismatch (${a.length} vs ${b.length})`);
        return;
      }
      
      for (let i = 0; i < a.length; i++) {
        compareRecursive(a[i], b[i], `${path}[${i}]`);
      }
      return;
    }

    if (typeof a === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a).filter(key => !ignoreFields.includes(key));
      const keysB = Object.keys(b).filter(key => !ignoreFields.includes(key));
      
      const allKeys = new Set([...keysA, ...keysB]);
      
      for (const key of allKeys) {
        if (!ignoreFields.includes(key)) {
          const newPath = path ? `${path}.${key}` : key;
          
          if (!(key in a)) {
            differences.push(`${newPath}: missing in first object`);
          } else if (!(key in b)) {
            differences.push(`${newPath}: missing in second object`);
          } else {
            compareRecursive(a[key], b[key], newPath);
          }
        }
      }
      return;
    }

    if (a !== b) {
      differences.push(`${path}: value mismatch ("${a}" vs "${b}")`);
    }
  }

  compareRecursive(obj1, obj2);
  
  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * 驗證資料結構完整性
 */
export function validateDataStructure(
  data: any,
  requiredFields: string[],
  optionalFields: string[] = []
): { isValid: boolean; missingFields: string[]; extraFields: string[] } {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      missingFields: requiredFields,
      extraFields: []
    };
  }

  const dataKeys = Object.keys(data);
  const allValidFields = [...requiredFields, ...optionalFields];
  
  const missingFields = requiredFields.filter(field => !(field in data));
  const extraFields = dataKeys.filter(field => !allValidFields.includes(field));

  return {
    isValid: missingFields.length === 0,
    missingFields,
    extraFields
  };
}

/**
 * 性能比較輔助函數
 */
export async function comparePerformance<T>(
  graphqlOperation: () => Promise<T>,
  restOperation: () => Promise<T>,
  iterations: number = 5
): Promise<{
  graphqlAvg: number;
  restAvg: number;
  difference: number;
  percentageDifference: number;
}> {
  const graphqlTimes: number[] = [];
  const restTimes: number[] = [];

  // 執行 GraphQL 性能測試
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await graphqlOperation();
    graphqlTimes.push(performance.now() - start);
  }

  // 執行 REST API 性能測試
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await restOperation();
    restTimes.push(performance.now() - start);
  }

  const graphqlAvg = graphqlTimes.reduce((sum, time) => sum + time, 0) / iterations;
  const restAvg = restTimes.reduce((sum, time) => sum + time, 0) / iterations;
  const difference = restAvg - graphqlAvg;
  const percentageDifference = (difference / graphqlAvg) * 100;

  return {
    graphqlAvg,
    restAvg,
    difference,
    percentageDifference
  };
}

/**
 * 產生測試資料快照，用於回歸測試
 */
export function generateDataSnapshot(data: any): string {
  // 移除不穩定的欄位
  const stableData = JSON.parse(JSON.stringify(data, (key, value) => {
    if (['timestamp', 'executionTime', 'queryTime', 'calculationTime'].includes(key)) {
      return undefined;
    }
    return value;
  }));

  // 排序確保一致性
  if (Array.isArray(stableData.products)) {
    stableData.products.sort((a: any, b: any) => 
      (a.productCode || '').localeCompare(b.productCode || '')
    );
  }

  return JSON.stringify(stableData, null, 2);
}

/**
 * 錯誤回應標準化
 */
export function normalizeErrorResponse(error: any): {
  code: string;
  message: string;
  details?: any;
} {
  if (error.extensions) {
    // GraphQL 錯誤格式
    return {
      code: error.extensions.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error',
      details: error.extensions.details
    };
  } else if (error.error) {
    // REST API 錯誤格式
    return {
      code: error.error.code || 'UNKNOWN_ERROR',
      message: error.error.message || 'Unknown error',
      details: error.error.details
    };
  } else {
    // 通用錯誤格式
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || String(error),
      details: error
    };
  }
}

/**
 * 匯出所有比較工具
 */
export const ResponseComparators = {
  normalizeGraphQLResponse,
  normalizeRESTResponse,
  normalizeGraphQLHistoryTree,
  normalizeRESTHistoryTree,
  deepCompareObjects,
  validateDataStructure,
  comparePerformance,
  generateDataSnapshot,
  normalizeErrorResponse
};