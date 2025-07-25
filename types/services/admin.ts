/**
 * 管理服務類型定義
 */

export interface DashboardStats {
  dailyDonePallets: number;
  dailyTransferredPallets: number;
  yesterdayDonePallets: number;
  yesterdayTransferredPallets: number;
  past3DaysGenerated: number;
  past3DaysTransferredPallets: number;
  past7DaysGenerated: number;
  past7DaysTransferredPallets: number;
}

export interface TimeRangeData {
  generated: number;
  transferred: number;
}

export interface AcoOrderProgress {
  code: string;
  required_qty: number;
  remain_qty: number;
  completed_qty: number;
  completion_percentage: number;
}

export interface InventorySearchResult {
  product_code: string;
  injection: number;
  pipeline: number;
  await: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  total: number;
}
