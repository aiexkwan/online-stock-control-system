/**
 * Core interface for the unified inventory service
 * Defines all inventory operations in a standardized way
 */

import {
  PalletInfo,
  PalletInfoWithLocation,
  PalletSearchResult,
  StockTransferDto,
  StockTransferResult,
  BatchTransferDto,
  BatchTransferResult,
  StockCountDto,
  StockCountSession,
  VoidPalletDto,
  InventoryAdjustmentDto,
  LocationInventory,
  InventoryFilter,
  HistoryRecord,
  StockLevel,
  ActivityLogEntry,
} from '../types';

export interface IInventoryService {
  // Pallet Management
  searchPallet(searchType: 'series' | 'pallet_num', value: string): Promise<PalletSearchResult>;
  createPallet(data: Partial<PalletInfo>): Promise<PalletInfo>;
  voidPallet(data: VoidPalletDto): Promise<void>;
  getPalletHistory(palletNum: string, limit?: number): Promise<HistoryRecord[]>;

  // Stock Level Operations
  getStockLevel(productCode: string): Promise<StockLevel | null>;
  getInventoryByLocation(location: string): Promise<LocationInventory>;
  getInventoryByFilter(filter: InventoryFilter): Promise<PalletInfoWithLocation[]>;

  // Stock Movement
  transferStock(transfer: StockTransferDto): Promise<StockTransferResult>;
  bulkTransfer(data: BatchTransferDto): Promise<BatchTransferResult>;
  validateTransfer(transfer: StockTransferDto): Promise<{ valid: boolean; errors: string[] }>;

  // Stock Count
  startStockCount(sessionId: string, userId: number): Promise<StockCountSession>;
  submitStockCount(data: StockCountDto): Promise<void>;
  completeStockCount(sessionId: string): Promise<void>;
  getStockCountSession(sessionId: string): Promise<StockCountSession | null>;

  // Inventory Adjustments
  adjustInventory(adjustment: InventoryAdjustmentDto): Promise<void>;

  // Activity Logging
  getActivityLog(filter?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
  }): Promise<ActivityLogEntry[]>;

  // Real-time Updates (if applicable)
  subscribeToInventoryChanges?(
    callback: (event: import('../types/inventory.types').InventoryChangeEvent) => void
  ): () => void;
}
