/**
 * Central export point for all inventory types
 */

// Re-export all types from individual files
export * from './inventory.types';
export * from './location.types';
export * from './transaction.types';

// Re-export location mapper types with correct syntax
export type { DatabaseLocationColumn, StandardLocation } from '../utils/locationMapper';

// Database types
export type DatabaseRecord = Record<string, unknown>;

// Additional types for services
export interface InventorySnapshot {
  timestamp: string;
  totalPallets: number;
  totalQuantity: number;
  locationBreakdown: Record<string, number>;
  productBreakdown: Record<string, number>;
  data?: Record<string, number>; // 向後兼容
}

export interface InventoryStats {
  totalPallets: number;
  activeTransfers: number;
  voidedToday: number;
  lowStockProducts: number;
  lastUpdated: string;
  locationDistribution?: Record<string, number>; // 向後兼容
}
