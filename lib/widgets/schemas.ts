/**
 * Widget 系統 Zod Schema 定義
 * 提供運行時類型驗證和 TypeScript 類型推導
 */

import { z } from 'zod';

// Widget 數據源枚舉
export const WidgetDataSourceSchema = z.enum([
  'batch',
  'graphql',
  'server-action',
  'mixed',
  'none'
]);

// Widget 優先級枚舉
export const WidgetPrioritySchema = z.enum([
  'critical',
  'high',
  'normal',
  'low'
]);

// Widget 分類枚舉
export const WidgetCategorySchema = z.enum([
  'core',
  'stats',
  'charts',
  'lists',
  'operations',
  'uploads',
  'reports',
  'analysis',
  'special'
]);

// Widget 緩存策略枚舉
export const CachingStrategySchema = z.enum([
  'cache-first',
  'network-only',
  'cache-and-network',
  'no-cache'
]);

// 圖表類型枚舉
export const ChartTypeSchema = z.enum([
  'bar',
  'line',
  'pie',
  'area',
  'scatter',
  'doughnut'
]);

// Widget Metadata Schema
export const WidgetMetadataSchema = z.object({
  // Performance & Caching
  preloadPriority: z.number().min(1).max(10).optional(),
  graphqlOptimized: z.boolean().optional(),
  cachingStrategy: CachingStrategySchema.optional(),
  
  // Chart-specific
  chartType: ChartTypeSchema.optional(),
  requiresComplexQuery: z.boolean().optional(),
  
  // List-specific
  supportPagination: z.boolean().optional(),
  supportFilters: z.boolean().optional(),
  supportExpansion: z.boolean().optional(),
  
  // Operations-specific
  requiresAuth: z.boolean().optional(),
  auditLog: z.boolean().optional(),
  
  // Data & Integration
  supportedDataSources: z.string().optional(), // JSON 字符串格式
  supportRealtime: z.boolean().optional(),
  exportable: z.boolean().optional(),
  configurable: z.boolean().optional(),
  
  // Layout & Display
  gridArea: z.string().optional(),
  visualProgress: z.boolean().optional(),
  complexAnalytics: z.boolean().optional(),
  chartIntegration: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  preferredVersion: z.string().optional(),
}).passthrough(); // 允許額外的屬性

// Widget 配置 Schema
export const UnifiedWidgetConfigSchema = z.object({
  id: z.string().min(1, 'Widget ID 不能為空'),
  name: z.string().min(1, 'Widget 名稱不能為空'),
  category: WidgetCategorySchema,
  description: z.string().optional(),
  loader: z.function().returns(z.promise(z.any())), // 暫時使用 any
  dataSource: WidgetDataSourceSchema,
  priority: WidgetPrioritySchema,
  refreshInterval: z.number().positive().optional(),
  supportTimeFrame: z.boolean().optional(),
  useGraphQL: z.boolean().optional(),
  metadata: WidgetMetadataSchema.optional(),
});

// Widget 配置映射 Schema
export const WidgetConfigMapSchema = z.record(z.string(), UnifiedWidgetConfigSchema);

// 路由預加載映射 Schema
export const RoutePreloadMapSchema = z.record(z.string(), z.array(z.string()));

// 類型推導
export type WidgetDataSource = z.infer<typeof WidgetDataSourceSchema>;
export type WidgetPriority = z.infer<typeof WidgetPrioritySchema>;
export type WidgetCategory = z.infer<typeof WidgetCategorySchema>;
export type CachingStrategy = z.infer<typeof CachingStrategySchema>;
export type ChartType = z.infer<typeof ChartTypeSchema>;
export type WidgetMetadata = z.infer<typeof WidgetMetadataSchema>;
export type UnifiedWidgetConfig = z.infer<typeof UnifiedWidgetConfigSchema>;
export type WidgetConfigMap = z.infer<typeof WidgetConfigMapSchema>;
export type RoutePreloadMap = z.infer<typeof RoutePreloadMapSchema>;

// 輔助函數：驗證 Widget 配置
export function validateWidgetConfig(config: unknown): UnifiedWidgetConfig {
  return UnifiedWidgetConfigSchema.parse(config);
}

// 輔助函數：驗證 Widget 配置映射
export function validateWidgetConfigMap(configMap: unknown): WidgetConfigMap {
  return WidgetConfigMapSchema.parse(configMap);
}

// 輔助函數：安全解析 supportedDataSources
export function parseSupportedDataSources(supportedDataSources?: string): string[] {
  if (!supportedDataSources) return [];
  
  try {
    const parsed = JSON.parse(supportedDataSources);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 輔助函數：序列化 supportedDataSources
export function serializeSupportedDataSources(dataSources: string[]): string {
  return JSON.stringify(dataSources);
}

// 驗證函數：檢查 Widget ID 是否有效
export const validateWidgetId = (id: string): boolean => {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(id);
};

// 驗證函數：檢查優先級數值轉換
export const convertNumericPriority = (numericPriority: number): WidgetPriority => {
  if (numericPriority >= 9) return 'critical';
  if (numericPriority >= 7) return 'high';
  if (numericPriority >= 4) return 'normal';
  return 'low';
};

// 驗證函數：獲取數字優先級
export const getNumericPriority = (priority: WidgetPriority): number => {
  switch (priority) {
    case 'critical': return 10;
    case 'high': return 7;
    case 'normal': return 4;
    case 'low': return 1;
    default: return 1;
  }
};