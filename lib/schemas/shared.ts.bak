/**
 * 共用基礎 Zod Schemas
 * 可重用的通用類型定義
 */

import { z } from 'zod';

// 基礎數據類型
export const TimestampSchema = z.string().datetime();
export const UuidSchema = z.string().uuid();
export const ProductCodeSchema = z.string().min(1);
export const PalletNumberSchema = z.string().regex(/^[A-Z0-9]+$/);

// 分頁參數
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0).optional(),
});

// 時間範圍
export const TimeRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

// API 響應基礎結構
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: TimestampSchema.optional(),
  });

// 錯誤響應
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

// 數據庫記錄基礎
export const DatabaseRecordSchema = z.object({
  uuid: UuidSchema,
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional(),
});

// 推導類型
export type Pagination = z.infer<typeof PaginationSchema>;
export type TimeRange = z.infer<typeof TimeRangeSchema>;
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
};
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type DatabaseRecord = z.infer<typeof DatabaseRecordSchema>;
