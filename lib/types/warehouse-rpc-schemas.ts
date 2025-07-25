/**
 * 倉庫緩存服務 RPC 函數 Zod 驗證架構
 * 提供運行時類型驗證和數據清理
 */

import { z } from 'zod';

// ======= Zod 驗證架構 =======

/**
 * 倉庫摘要項目架構
 */
const WarehouseSummaryItemSchema = z.object({
  location: z.string().default(''),
  total_qty: z.number().or(z.string().transform(Number)).default(0),
  item_count: z.number().or(z.string().transform(Number)).default(0),
  unique_products: z.number().or(z.string().transform(Number)).default(0),
});

/**
 * 倉庫摘要 RPC 響應架構
 */
export const WarehouseSummaryRPCSchema = z.object({
  summary: z.array(WarehouseSummaryItemSchema).optional().default([]),
});

/**
 * 儀表板統計 RPC 響應架構
 */
export const DashboardStatsRPCSchema = z.object({
  total_pallets: z.number().or(z.string().transform(Number)).optional().default(0),
  active_pallets: z.number().or(z.string().transform(Number)).optional().default(0),
  unique_products: z.number().or(z.string().transform(Number)).optional().default(0),
  today_transfers: z.number().or(z.string().transform(Number)).optional().default(0),
  pending_orders: z.number().or(z.string().transform(Number)).optional().default(0),
  execution_time_ms: z.number().or(z.string().transform(Number)).optional().default(0),
});

/**
 * 庫存項目架構
 */
const InventoryItemSchema = z
  .object({
    product_code: z.string().default(''),
    location: z.string().default(''),
    quantity: z.number().or(z.string().transform(Number)).default(0),
    pallet_number: z.string().optional(),
    last_updated: z.string().optional(),
  })
  .catchall(z.unknown()); // 允許其他動態字段

/**
 * 庫存統計架構
 */
const InventoryStatsSchema = z.object({
  total_count: z.number().or(z.string().transform(Number)).default(0),
  total_value: z.number().or(z.string().transform(Number)).default(0),
  unique_locations: z.number().or(z.string().transform(Number)).default(0),
  last_updated: z.string().default(new Date().toISOString()),
});

/**
 * 分頁信息架構
 */
const PaginationSchema = z.object({
  total: z.number().or(z.string().transform(Number)).default(0),
  page: z.number().or(z.string().transform(Number)).default(1),
  limit: z.number().or(z.string().transform(Number)).default(50),
  has_next: z.boolean().default(false),
});

/**
 * 優化庫存 RPC 響應架構
 */
export const OptimizedInventoryRPCSchema = z.object({
  inventory: z.array(InventoryItemSchema).optional().default([]),
  stats: InventoryStatsSchema.nullable().optional(),
  pagination: PaginationSchema.optional(),
});

// ======= 類型匯出 =======

export type WarehouseSummaryRPCResponse = z.infer<typeof WarehouseSummaryRPCSchema>;
export type DashboardStatsRPCResponse = z.infer<typeof DashboardStatsRPCSchema>;
export type OptimizedInventoryRPCResponse = z.infer<typeof OptimizedInventoryRPCSchema>;

// ======= 驗證工具函數 =======

/**
 * 安全地解析倉庫摘要響應
 */
export function parseWarehouseSummaryResponse(data: unknown): WarehouseSummaryRPCResponse {
  try {
    return WarehouseSummaryRPCSchema.parse(data);
  } catch (error) {
    console.error('Failed to parse warehouse summary response:', error);
    return { summary: [] };
  }
}

/**
 * 安全地解析儀表板統計響應
 */
export function parseDashboardStatsResponse(data: unknown): DashboardStatsRPCResponse {
  try {
    return DashboardStatsRPCSchema.parse(data);
  } catch (error) {
    console.error('Failed to parse dashboard stats response:', error);
    return {
      total_pallets: 0,
      active_pallets: 0,
      unique_products: 0,
      today_transfers: 0,
      pending_orders: 0,
      execution_time_ms: 0,
    };
  }
}

/**
 * 安全地解析優化庫存響應
 */
export function parseOptimizedInventoryResponse(data: unknown): OptimizedInventoryRPCResponse {
  try {
    return OptimizedInventoryRPCSchema.parse(data);
  } catch (error) {
    console.error('Failed to parse optimized inventory response:', error);
    return {
      inventory: [],
      stats: null,
      pagination: undefined,
    };
  }
}
