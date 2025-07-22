/**
 * Dashboard 相關 Zod Schemas
 * Admin Dashboard API 類型定義
 */

import { z } from 'zod';
import {
  TimestampSchema,
  UuidSchema,
  ProductCodeSchema,
  PalletNumberSchema,
  ApiResponseSchema,
  DatabaseRecordSchema,
} from './shared';

// 工作資料類型
export const WorkLevelDataSchema = z.object({
  id: z.string(),
  move: z.number().int(),
  latest_update: TimestampSchema,
});

// 操作員資料類型
export const OperatorDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.string(),
  position: z.string().optional(),
  email: z.string().email().optional(),
  icon_url: z.string().url().optional(),
});

// 轉移資料類型
export const TransferDataSchema = z.object({
  tran_date: TimestampSchema,
  plt_num: PalletNumberSchema.optional(),
  operator_id: z.string().optional(),
  move_from: z.string(),
  move_to: z.string(),
  remark: z.string().optional(),
});

// 庫存資料類型
export const InventoryDataSchema = z.object({
  product_code: ProductCodeSchema,
  await: z.number().int().min(0),
  injection: z.number().int().min(0).optional(),
  pipeline: z.number().int().min(0).optional(),
  bulk: z.number().int().min(0).optional(),
  damage: z.number().int().min(0).optional(),
  fold: z.number().int().min(0).optional(),
  backcarpark: z.number().int().min(0).optional(),
  prebook: z.number().int().min(0).optional(),
});

// 產品代碼資料
export const ProductCodeDataSchema = z.object({
  code: ProductCodeSchema,
  description: z.string(),
  colour: z.string(),
  type: z.string(),
  standard_qty: z.number().int().min(0),
  remark: z.string().optional(),
});

// 報表資料類型 (動態)
export const ReportDataSchema = z.record(z.string(), z.unknown());

// Dashboard 統計資料
export const DashboardStatsSchema = z.object({
  totalPallets: z.number().int().min(0),
  awaitingTransfer: z.number().int().min(0),
  todayTransfers: z.number().int().min(0),
  activeOperators: z.number().int().min(0),
  criticalStock: z.number().int().min(0),
});

// Dashboard Widget 資料
export const DashboardWidgetDataSchema = z.object({
  id: z.string(),
  type: z.enum(['chart', 'stats', 'list', 'table']),
  title: z.string(),
  data: z.unknown(),
  config: z.record(z.string(), z.unknown()).optional(),
  lastUpdate: TimestampSchema.optional(),
});

// Dashboard 完整響應
export const DashboardResponseSchema = z.object({
  stats: DashboardStatsSchema,
  widgets: z.array(DashboardWidgetDataSchema),
  alerts: z.array(z.string()).optional(),
  lastRefresh: TimestampSchema,
});

// Admin Dashboard 資料查詢參數
export const DashboardQueryParamsSchema = z.object({
  theme: z.string().optional(),
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  includeAlerts: z.boolean().default(true),
  widgetFilters: z.record(z.string(), z.unknown()).optional(),
});

// 類型推導
export type WorkLevelData = z.infer<typeof WorkLevelDataSchema>;
export type OperatorData = z.infer<typeof OperatorDataSchema>;
export type TransferData = z.infer<typeof TransferDataSchema>;
export type InventoryData = z.infer<typeof InventoryDataSchema>;
export type ProductCodeData = z.infer<typeof ProductCodeDataSchema>;
export type ReportData = z.infer<typeof ReportDataSchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardWidgetData = z.infer<typeof DashboardWidgetDataSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type DashboardQueryParams = z.infer<typeof DashboardQueryParamsSchema>;
