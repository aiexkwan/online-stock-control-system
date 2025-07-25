/**
 * Printing 相關 Zod Schemas
 * 列印服務和模板類型定義
 */

import { z } from 'zod';
import {
  TimestampSchema,
  UuidSchema,
  ProductCodeSchema,
  PalletNumberSchema,
  DatabaseRecordSchema,
} from './shared';

// 列印類型枚舉
export const PrintTypeSchema = z.enum([
  'QC_LABEL',
  'GRN_LABEL',
  'TRANSACTION_REPORT',
  'INVENTORY_REPORT',
  'PALLET_LABEL',
  'TRANSFER_SLIP',
  'VOID_REPORT',
]);

// QC 標籤數據
export const QcLabelDataSchema = z.object({
  plt_num: PalletNumberSchema,
  product_code: ProductCodeSchema,
  product_qty: z.number().int().min(1),
  generate_time: TimestampSchema,
  series: z.string(),
  pdf_url: z.string().url().optional(),
  plt_remark: z.string().optional(),
});

// GRN 標籤數據
export const GrnLabelDataSchema = z.object({
  grn_ref: z.number().int(),
  plt_num: PalletNumberSchema,
  material_code: ProductCodeSchema,
  gross_weight: z.number().min(0),
  net_weight: z.number().min(0),
  package: z.string(),
  package_count: z.number().int().min(1),
  pallet: z.string(),
  pallet_count: z.number().int().min(1),
  sup_code: z.string(),
  creat_time: TimestampSchema,
});

// 列印模板配置
export const TemplateConfigSchema = z.object({
  id: z.string(),
  type: PrintTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  template: z.string(), // HTML/template string
  styles: z.string().optional(), // CSS styles
  pageSize: z.enum(['A4', 'A5', 'Letter', 'Custom']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  margins: z
    .object({
      top: z.number().min(0),
      right: z.number().min(0),
      bottom: z.number().min(0),
      left: z.number().min(0),
    })
    .optional(),
  schema: z.any().optional(), // Zod schema for data validation
  variables: z.record(z.string(), z.string()).optional(),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional(),
});

// 列印任務
export const PrintJobSchema = z.object({
  id: UuidSchema,
  type: PrintTypeSchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  data: z.unknown(), // 待列印的數據
  template_id: z.string(),
  options: z
    .object({
      copies: z.number().int().min(1).default(1),
      printer: z.string().optional(),
      priority: z.enum(['low', 'normal', 'high']).default('normal'),
      duplex: z.boolean().default(false),
      color: z.boolean().default(false),
    })
    .optional(),
  created_at: TimestampSchema,
  started_at: TimestampSchema.optional(),
  completed_at: TimestampSchema.optional(),
  error_message: z.string().optional(),
  result: z
    .object({
      file_path: z.string().optional(),
      file_url: z.string().url().optional(),
      pages: z.number().int().min(1).optional(),
      size_bytes: z.number().int().min(0).optional(),
    })
    .optional(),
});

// 列印歷史記錄
export const PrintHistorySchema = z.object({
  id: UuidSchema,
  job_id: z.string(),
  type: PrintTypeSchema,
  data: z.unknown(),
  options: z.unknown().optional(),
  result: z.unknown().optional(),
  metadata: z.unknown().optional(),
  created_at: TimestampSchema,
});

// 列印服務響應
export const PrintServiceResponseSchema = z.object({
  success: z.boolean(),
  job_id: z.string().optional(),
  file_url: z.string().url().optional(),
  error: z.string().optional(),
  metadata: z
    .object({
      processing_time: z.number(),
      template_used: z.string(),
      pages_generated: z.number().int().min(1),
      file_size: z.number().int().min(0),
    })
    .optional(),
});

// 模板驗證結果
export const TemplateValidationSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  missing_variables: z.array(z.string()),
  unused_variables: z.array(z.string()),
});

// 列印統計
export const PrintStatsSchema = z.object({
  total_jobs: z.number().int().min(0),
  completed_jobs: z.number().int().min(0),
  failed_jobs: z.number().int().min(0),
  pending_jobs: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  avg_processing_time: z.number().min(0),
  success_rate: z.number().min(0).max(100),
  most_used_template: z.string().optional(),
  peak_hour: z.number().int().min(0).max(23).optional(),
});

// 類型推導
export type PrintType = z.infer<typeof PrintTypeSchema>;
export type QcLabelData = z.infer<typeof QcLabelDataSchema>;
export type GrnLabelData = z.infer<typeof GrnLabelDataSchema>;
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type PrintJob = z.infer<typeof PrintJobSchema>;
export type PrintHistory = z.infer<typeof PrintHistorySchema>;
export type PrintServiceResponse = z.infer<typeof PrintServiceResponseSchema>;
export type TemplateValidation = z.infer<typeof TemplateValidationSchema>;
export type PrintStats = z.infer<typeof PrintStatsSchema>;

// 格式化輔助函數
export const formatPrintData = {
  qcLabel: (data: unknown): QcLabelData => QcLabelDataSchema.parse(data),
  grnLabel: (data: unknown): GrnLabelData => GrnLabelDataSchema.parse(data),
  validateTemplate: (config: unknown): TemplateConfig => TemplateConfigSchema.parse(config),
  validateJob: (job: unknown): PrintJob => PrintJobSchema.parse(job),
};
