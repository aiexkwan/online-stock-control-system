/**
 * Upload Resolver Types
 * 上傳 resolver 專用類型定義
 */

import { GraphQLContext } from './graphql-resolver.types';

// 上傳文件數據庫行類型
export interface UploadedFileRow {
  id: string;
  original_name: string;
  file_name: string;
  mime_type: string;
  size: number;
  extension: string;
  folder: string;
  uploaded_at: string;
  uploaded_by: string;
  checksum?: string;
  url?: string;
  thumbnail_url?: string;
}

// 文件類型統計行
export interface FileTypeStatRow {
  extension: string;
  count: number;
  total_size: number;
}

// 上傳統計數據庫行
export interface UploadStatisticsRow {
  total_uploads: number;
  total_size: number;
  success_rate: number;
  average_upload_time: number;
  average_processing_time: number;
  today_uploads: number;
  failure_rate: number;
  recent_errors: string[];
  popular_file_types: FileTypeStatRow[];
  error_reasons: string[];
  upload_trends: unknown[];
}

// AI 分析原始數據
export interface OrderAnalysisRawData {
  orderNumber: string;
  customerName?: string;
  orderDate?: string;
  items: unknown[];
  totalAmount?: number;
  currency?: string;
  confidence: number;
}

// AI 分析結果
export interface AnalyzeOrderPDFResult {
  success: boolean;
  recordCount?: number;
  extractedData?: OrderAnalysisRawData[];
  error?: string;
}

// Upload Resolver 函數類型
export type UploadGraphQLResolver<TArgs = Record<string, unknown>, TResult = unknown> = (
  parent: unknown,
  args: TArgs,
  context: GraphQLContext
) => Promise<TResult> | TResult;
