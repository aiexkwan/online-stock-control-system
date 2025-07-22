/**
 * Unified type definitions for inventory management
 * Consolidates all inventory-related types to ensure consistency
 */

import { Database } from '@/lib/database.types';
import { DatabaseLocationColumn, StandardLocation } from '../utils/locationMapper';

// Base types from database
export type PalletInfo = Database['public']['Tables']['record_palletinfo']['Row'];
export type InventoryRecord = Database['public']['Tables']['record_inventory']['Row'];
export type TransferRecord = Database['public']['Tables']['record_transfer']['Row'];
export type HistoryRecord = Database['public']['Tables']['record_history']['Row'];
export type StockLevel = Database['public']['Tables']['stock_level']['Row'];

/**
 * Extended pallet information with location
 */
export interface PalletInfoWithLocation extends PalletInfo {
  location?: StandardLocation | DatabaseLocationColumn;
  locationDisplay?: string;
}

/**
 * Search types for pallet lookup
 */
export type PalletSearchType = 'series' | 'pallet_num';

/**
 * Result of a pallet search operation
 */
export interface PalletSearchResult {
  pallet: PalletInfoWithLocation | null;
  error?: string;
  searchTime?: number;
}

/**
 * Stock transfer request data
 */
export interface StockTransferDto {
  palletNum: string;
  productCode: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  operator?: string;
  remark?: string;
  timestamp?: string;
}

/**
 * Result of a stock transfer operation
 */
export interface StockTransferResult {
  success: boolean;
  palletNum: string;
  transferId?: string;
  error?: string;
  details?: {
    fromLocation: string;
    toLocation: string;
    quantity: number;
    timestamp: string;
  };
}

/**
 * Batch transfer request
 */
export interface BatchTransferDto {
  transfers: StockTransferDto[];
  validateBeforeTransfer?: boolean;
  stopOnError?: boolean;
}

/**
 * Result of batch transfer operation
 */
export interface BatchTransferResult {
  totalRequested: number;
  totalSuccessful: number;
  totalFailed: number;
  results: StockTransferResult[];
  duration?: number;
}

/**
 * Stock count data
 */
export interface StockCountDto {
  palletNum?: string;
  productCode: string;
  countedQty: number;
  systemQty?: number;
  location?: string;
  userId: number;
  userName: string;
  sessionId?: string;
}

/**
 * Stock count session
 */
export interface StockCountSession {
  uuid: string;
  sessionDate: string;
  startTime: string;
  endTime?: string;
  userId: number;
  userName: string;
  totalScans: number;
  successScans: number;
  errorScans: number;
  sessionStatus: 'active' | 'completed' | 'cancelled';
}

/**
 * Activity log entry for UI feedback
 */
export interface ActivityLogEntry {
  id?: string;
  timestamp: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  details?: Record<string, unknown>;
}

/**
 * Inventory change event for real-time updates
 */
export interface InventoryChangeEvent {
  type: 'created' | 'updated' | 'deleted' | 'transferred';
  table: 'palletinfo' | 'inventory' | 'transfer';
  recordId: string | number;
  data: PalletInfo | InventoryRecord | TransferRecord;
  timestamp: string;
  userId?: string;
}

/**
 * Inventory location summary
 */
export interface LocationInventory {
  location: StandardLocation;
  dbColumn: DatabaseLocationColumn;
  totalPallets: number;
  totalQuantity: number;
  products: Array<{
    productCode: string;
    quantity: number;
    palletCount: number;
  }>;
  lastUpdated: string;
}

/**
 * Inventory filter options
 */
export interface InventoryFilter {
  locations?: string[];
  productCodes?: string[];
  dateFrom?: string;
  dateTo?: string;
  includeEmpty?: boolean;
}

/**
 * Real-time inventory update event
 */
export interface InventoryUpdateEvent {
  type: 'transfer' | 'adjustment' | 'void' | 'count';
  palletNum: string;
  productCode?: string;
  fromLocation?: string;
  toLocation?: string;
  quantity?: number;
  operator?: string;
  timestamp: string;
}

/**
 * Void pallet request
 */
export interface VoidPalletDto {
  palletNum: string;
  reason: string;
  operator?: string;
  location?: string;
}

/**
 * Inventory adjustment request
 */
export interface InventoryAdjustmentDto {
  palletNum: string;
  adjustmentType: 'quantity' | 'location' | 'status';
  oldValue: string | number;
  newValue: string | number;
  reason: string;
  operator?: string;
}

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';

/**
 * Inventory transaction
 */
export interface InventoryTransaction {
  id: string;
  type: 'transfer' | 'adjustment' | 'void' | 'count' | 'grn';
  status: TransactionStatus;
  startTime: string;
  endTime?: string;
  operations: Array<{
    action: string;
    target: string;
    result: 'success' | 'failed';
    error?: string;
  }>;
  rollbackable: boolean;
}
