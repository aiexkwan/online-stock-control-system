/**
 * 倉庫緩存服務 RPC 函數返回類型定義
 * 替代 any 類型使用，提供類型安全
 */

// ======= RPC 返回類型定義 =======

export interface WarehouseSummaryRPCResponse {
  summary?: Array<{
    location: string;
    total_qty: number;
    item_count: number;
    unique_products: number;
  }>;
}

export interface DashboardStatsRPCResponse {
  total_pallets?: number;
  active_pallets?: number;
  unique_products?: number;
  today_transfers?: number;
  pending_orders?: number;
  execution_time_ms?: number;
}

export interface OptimizedInventoryRPCResponse {
  inventory?: Array<{
    product_code: string;
    location: string;
    quantity: number;
    pallet_number?: string;
    last_updated?: string;
    [key: string]: unknown; // 允許其他動態字段
  }>;
  stats?: {
    total_count: number;
    total_value: number;
    unique_locations: number;
    last_updated: string;
  } | null;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
  };
}

// ======= 類型守護函數 =======

/**
 * 驗證倉庫摘要 RPC 響應
 */
export function isWarehouseSummaryResponse(data: unknown): data is WarehouseSummaryRPCResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 檢查 summary 字段
  if ('summary' in obj) {
    if (obj.summary !== undefined && !Array.isArray(obj.summary)) {
      return false;
    }

    // 如果 summary 存在且是數組，檢查數組元素結構
    if (Array.isArray(obj.summary)) {
      return obj.summary.every(
        item =>
          typeof item === 'object' &&
          item !== null &&
          'location' in item &&
          'total_qty' in item &&
          'item_count' in item &&
          'unique_products' in item
      );
    }
  }

  return true;
}

/**
 * 驗證儀表板統計 RPC 響應
 */
export function isDashboardStatsResponse(data: unknown): data is DashboardStatsRPCResponse {
  return typeof data === 'object' && data !== null;
}

/**
 * 驗證優化庫存 RPC 響應
 */
export function isOptimizedInventoryResponse(data: unknown): data is OptimizedInventoryRPCResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 至少需要有 inventory 或 stats 字段之一
  if (!('inventory' in obj) && !('stats' in obj)) {
    return false;
  }

  // 檢查 inventory 字段
  if ('inventory' in obj && obj.inventory !== undefined) {
    if (!Array.isArray(obj.inventory)) {
      return false;
    }
  }

  return true;
}

// ======= 工具函數 =======

/**
 * 安全地提取數字值，帶預設值
 */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 安全地提取字串值，帶預設值
 */
export function safeString(value: unknown, defaultValue: string = ''): string {
  return typeof value === 'string' ? value : String(value || defaultValue);
}

/**
 * 安全地檢查數組長度
 */
export function safeArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}
