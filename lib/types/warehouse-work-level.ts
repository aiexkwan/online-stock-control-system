/**
 * Warehouse Work Level Types
 * 從 types/api/response.ts 遷移的倉庫工作量分析相關類型
 */

export interface WarehouseWorkLevelParams {
  startDate?: Date | string;
  endDate?: Date | string;
  department?: string;
}

export interface DailyWorkStat {
  date: string;
  total_moves: number;
  operator_count: number;
  operators: string[];
}

export interface PeakDay {
  date: string;
  moves: number;
}

export interface QueryParams {
  start_date: string;
  end_date: string;
  department: string;
}

export interface Metadata {
  executed_at: string;
  version: string;
}

export interface WarehouseWorkLevelResponse {
  daily_stats: DailyWorkStat[];
  total_moves: number;
  unique_operators: number;
  avg_moves_per_day: number;
  peak_day: PeakDay | null;
  calculation_time: string;
  query_params: QueryParams;
  metadata: Metadata;
}

export interface WarehouseWorkLevelError {
  error: true;
  message: string;
  detail: string;
  hint: string;
  query_params: QueryParams;
}

export type WarehouseWorkLevelResult = WarehouseWorkLevelResponse | WarehouseWorkLevelError;

// Type guard to check if result is an error
export function isWarehouseWorkLevelError(
  result: WarehouseWorkLevelResult
): result is WarehouseWorkLevelError {
  return 'error' in result && result.error === true;
}

// Helper functions for date formatting
export function formatDateForRPC(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString();
}

export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return { startDate, endDate };
}
