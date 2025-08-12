/**
 * Admin Service Types
 * Types for the AdminDataService and related admin functionality
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
  description: string;
  ordered: number;
  completed: number;
  remaining: number;
  percentage: number;
  orderRef: number;
  updatedAt: string;
}

export interface InventorySearchResult {
  productCode: string;
  productName: string;
  totalStock: number;
  locations: InventoryLocation[];
  lastUpdated: string;
}

export interface InventoryLocation {
  location: string;
  quantity: number;
  palletCount: number;
}

// Additional admin types that might be needed
export interface AdminStats {
  dashboard: DashboardStats;
  timeRange: TimeRangeData;
}

export type AdminTimeRange = 'today' | 'yesterday' | 'past3days' | 'past7days';

export interface AdminServiceError {
  code: string;
  message: string;
  details?: unknown;
}