/**
 * TypeScript type definitions for warehouse work level RPC function
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

// Chart data transformation helpers
export interface ChartDataPoint {
  date: string;
  moves: number;
  operators: number;
}

export function transformToChartData(response: WarehouseWorkLevelResponse): ChartDataPoint[] {
  return response.daily_stats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    }),
    moves: stat.total_moves,
    operators: stat.operator_count
  }));
}

// Summary statistics helper
export interface SummaryStats {
  totalMoves: number;
  uniqueOperators: number;
  avgMovesPerDay: number;
  peakDay: {
    date: string;
    moves: number;
    formattedDate: string;
  } | null;
}

export function extractSummaryStats(response: WarehouseWorkLevelResponse): SummaryStats {
  return {
    totalMoves: response.total_moves,
    uniqueOperators: response.unique_operators,
    avgMovesPerDay: response.avg_moves_per_day,
    peakDay: response.peak_day ? {
      date: response.peak_day.date,
      moves: response.peak_day.moves,
      formattedDate: new Date(response.peak_day.date).toLocaleDateString('en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } : null
  };
}