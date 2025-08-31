/**
 * Unified Inventory Service
 * Central service that orchestrates all inventory operations
 * Consolidates logic from multiple sources and provides a single interface
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { detectSearchType } from '../../../app/utils/palletSearchUtils';
import { IInventoryService } from '../interfaces/IInventoryService';
import {
  PalletSearchResult,
  StockTransferDto,
  StockTransferResult,
  VoidPalletDto,
  BatchTransferDto,
  BatchTransferResult,
  PalletInfo,
  HistoryRecord,
  StockLevel,
  LocationInventory,
  InventoryFilter,
  PalletInfoWithLocation,
  StockCountSession,
  StockCountDto,
  InventoryAdjustmentDto,
  ActivityLogEntry,
} from '../types/inventory.types';
import { InventorySnapshot, InventoryStats } from '../types/index';
import { TransactionResult } from '../types/transaction.types';
import { getCurrentUserId } from '../utils/authHelpers';
import { validatePalletNumber, validateStockTransfer } from '../utils/validators';
import { LocationMapper } from '../utils/locationMapper';
import { TransactionService } from './TransactionService';
import { PalletService } from './PalletService';

export class UnifiedInventoryService implements IInventoryService {
  private palletService: PalletService;
  private transactionService: TransactionService;

  constructor(private supabase: SupabaseClient) {
    this.palletService = new PalletService(supabase);
    this.transactionService = new TransactionService(supabase);
  }

  /**
   * Search for a pallet
   * Delegates to PalletService for actual search
   */
  async searchPallet(
    searchType: 'series' | 'pallet_num',
    value: string
  ): Promise<PalletSearchResult> {
    return this.palletService.search(searchType, value);
  }

  /**
   * Search for a pallet with auto-detection of search type
   * Uses detectSearchType to automatically determine if input is series or pallet number
   */
  async searchPalletAuto(value: string): Promise<PalletSearchResult> {
    const searchType = detectSearchType(value);

    if (searchType === 'unknown') {
      return {
        pallet: null,
        error: 'Invalid search format. Expected pallet number (DDMMYY/XXX) or series',
        searchTime: 0,
      };
    }

    return this.palletService.search(searchType, value);
  }

  /**
   * Transfer stock between locations
   * Uses TransactionService to ensure atomic updates
   */
  async transferStock(transfer: StockTransferDto): Promise<StockTransferResult> {
    const _startTime = Date.now();

    try {
      // Add operator info if not provided
      if (!transfer.operator) {
        const userId = await getCurrentUserId(this.supabase);
        transfer.operator = userId || 'system';
      }

      // Validate transfer
      const validation = validateStockTransfer(transfer);
      if (!validation.valid) {
        return {
          success: false,
          palletNum: transfer.palletNum,
          error: validation.errors?.join(', ') || 'Invalid transfer data',
        };
      }

      // Execute transfer within transaction
      const result = await this.transactionService.executeStockTransfer(transfer);

      if (result.success) {
        // Invalidate cache if using optimized queries
        await this.invalidateCache(transfer.palletNum);
      }

      return {
        success: result.success,
        palletNum: transfer.palletNum,
        transferId: result.transactionId,
        error: result.error,
        details: {
          fromLocation: transfer.fromLocation,
          toLocation: transfer.toLocation,
          quantity: transfer.quantity,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      console.error('[UnifiedInventoryService] Transfer stock error:', error);
      return {
        success: false,
        palletNum: transfer.palletNum,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  /**
   * Void a pallet
   * Uses TransactionService to ensure atomic updates
   */
  async voidPallet(voidData: VoidPalletDto): Promise<void> {
    try {
      // Add operator info if not provided
      if (!voidData.operator) {
        const userId = await getCurrentUserId(this.supabase);
        voidData.operator = userId || 'system';
      }

      const result = await this.transactionService.executeVoidPallet(voidData);

      if (!result.success) {
        throw new Error(result.error || 'Void operation failed');
      }

      // Invalidate cache
      await this.invalidateCache(voidData.palletNum);
    } catch (error: unknown) {
      console.error('[UnifiedInventoryService] Void pallet error:', error);
      throw error;
    }
  }

  /**
   * Batch transfer multiple pallets
   * Executes all transfers within a single transaction
   */
  async batchTransfer(batch: BatchTransferDto): Promise<BatchTransferResult> {
    const _startTime = Date.now();
    const results: Map<string, StockTransferResult> = new Map();

    try {
      // Add operator info if not provided
      const operator = (await getCurrentUserId(this.supabase)) || 'system';

      // Validate all transfers first
      const validationErrors: string[] = [];
      for (const transfer of batch.transfers) {
        transfer.operator = operator;
        const validation = validateStockTransfer(transfer);
        if (!validation.valid) {
          validationErrors.push(
            `${transfer.palletNum}: ${validation.errors?.join(', ') || 'Invalid'}`
          );
        }
      }

      if (validationErrors.length > 0) {
        return {
          totalRequested: batch.transfers.length,
          totalSuccessful: 0,
          totalFailed: batch.transfers.length,
          results: Array.from(results.values()),
          duration: Date.now() - _startTime,
        };
      }

      // Execute all transfers in a single transaction
      const operations = batch.transfers.map(
        (transfer: StockTransferDto) => () => this.transactionService.executeStockTransfer(transfer)
      );

      const txResult = await this.transactionService.executeBatchOperations<
        TransactionResult<void>
      >(
        operations.map(
          (op: () => Promise<TransactionResult<void>>) => async (client: SupabaseClient) => {
            const result = await op();
            if (!result.success) {
              throw new Error(result.error);
            }
            return result;
          }
        ),
        {
          description: `Batch transfer: ${batch.transfers.length} pallets`,
          logTransaction: true,
        }
      );

      // Process results
      let successCount = 0;
      let failureCount = 0;

      batch.transfers.forEach((transfer: StockTransferDto, index: number) => {
        const result = txResult.data?.[index];
        if (result?.success) {
          successCount++;
          results.set(transfer.palletNum, {
            success: true,
            palletNum: transfer.palletNum,
            transferId: result.transactionId,
          });
        } else {
          failureCount++;
          results.set(transfer.palletNum, {
            success: false,
            palletNum: transfer.palletNum,
            error: result?.error || 'Unknown error',
          });
        }
      });

      // Invalidate cache for all transferred pallets
      if (successCount > 0) {
        await Promise.all(
          batch.transfers.map((t: StockTransferDto) => this.invalidateCache(t.palletNum))
        );
      }

      return {
        totalRequested: batch.transfers.length,
        totalSuccessful: successCount,
        totalFailed: failureCount,
        results: Array.from(results.values()),
        duration: Date.now() - _startTime,
      };
    } catch (error: unknown) {
      console.error('[UnifiedInventoryService] Batch transfer error:', error);
      return {
        totalRequested: batch.transfers.length,
        totalSuccessful: 0,
        totalFailed: batch.transfers.length,
        results: Array.from(results.values()),
        duration: Date.now() - _startTime,
      };
    }
  }

  /**
   * Get inventory snapshot for reporting
   */
  async getInventorySnapshot(options?: {
    locations?: string[];
    productCodes?: string[];
  }): Promise<InventorySnapshot> {
    try {
      let query = this.supabase.from('record_inventory').select('*, record_palletinfo!inner(*)');

      // Apply filters if provided
      if (options?.productCodes?.length) {
        query = query.in('record_palletinfo.product_code', options.productCodes);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process data to create snapshot
      const snapshot: InventorySnapshot = {
        timestamp: new Date().toISOString(),
        totalPallets: data?.length || 0,
        totalQuantity: 0,
        locationBreakdown: {},
        productBreakdown: {},
      };

      // Calculate totals and breakdowns
      for (const record of data || []) {
        const palletInfo = record.record_palletinfo;
        const qty = palletInfo.product_qty || 0;

        snapshot.totalQuantity += qty;

        // Location breakdown
        const location = await this.palletService.getCurrentLocation(record.plt_num);
        if (location) {
          snapshot.locationBreakdown[location] = (snapshot.locationBreakdown[location] || 0) + qty;
        }

        // Product breakdown
        const productCode = palletInfo.product_code;
        if (productCode) {
          snapshot.productBreakdown[productCode] =
            (snapshot.productBreakdown[productCode] || 0) + qty;
        }
      }

      return snapshot;
    } catch (error: unknown) {
      console.error('[UnifiedInventoryService] Get inventory snapshot error:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      // Get various stats from database
      const [totalPallets, activeTransfers, voidedToday, lowStockProducts] = await Promise.all([
        this.getTotalPalletCount(),
        this.getActiveTransferCount(),
        this.getVoidedTodayCount(),
        this.getLowStockProducts(),
      ]);

      return {
        totalPallets,
        activeTransfers,
        voidedToday,
        lowStockProducts,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: unknown) {
      console.error('[UnifiedInventoryService] Get inventory stats error:', error);
      throw error;
    }
  }

  /**
   * Validate pallet for operations
   */
  async validatePallet(palletNum: string): Promise<{
    valid: boolean;
    pallet?: PalletInfo;
    error?: string;
  }> {
    return this.palletService.validate(palletNum);
  }

  /**
   * Private helper methods
   */
  private async getUpdatedPalletInfo(palletNum: string): Promise<PalletInfo | undefined> {
    try {
      const result = await this.palletService.search('pallet_num', palletNum);
      return result.pallet || undefined;
    } catch (error) {
      console.error('[UnifiedInventoryService] Get updated pallet info error:', error);
      return undefined;
    }
  }

  private async invalidateCache(palletNum: string): Promise<void> {
    // No longer needed - we're using direct queries instead of materialized view
    // Cache invalidation can be handled at the application level if needed
  }

  private async getTotalPalletCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .not('is_voided', 'eq', true);

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveTransferCount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await this.supabase
        .from('record_history')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'Transfer')
        .gte('time', today.toISOString());

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getVoidedTodayCount(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await this.supabase
        .from('record_history')
        .select('*', { count: 'exact', head: true })
        .or('action.eq.Void,action.eq.Damage')
        .gte('time', today.toISOString());

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getLowStockProducts(): Promise<number> {
    try {
      // This would need a proper implementation based on business rules
      // For now, return products with total quantity < 100
      const { data, error } = await this.supabase.rpc('get_product_stock_levels');

      if (error || !data) return 0;

      return data.filter(
        (product: { product_code: string; total_quantity: number }) => product.total_quantity < 100
      ).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create a new pallet
   */
  async createPallet(data: Partial<PalletInfo>): Promise<PalletInfo> {
    return this.palletService.createPallet(data);
  }

  /**
   * Get pallet history
   */
  async getPalletHistory(palletNum: string, limit?: number): Promise<HistoryRecord[]> {
    return this.palletService.getPalletHistory(palletNum, limit);
  }

  /**
   * Get stock level by product code
   */
  async getStockLevel(productCode: string): Promise<StockLevel | null> {
    try {
      const { data, error } = await this.supabase
        .from('stock_level')
        .select('*')
        .eq('product_code', productCode)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get inventory by location
   */
  async getInventoryByLocation(location: string): Promise<LocationInventory> {
    const dbColumn = LocationMapper.toDbColumn(location);
    if (!dbColumn) {
      throw new Error(`Invalid location: ${location}`);
    }

    const { data, error } = await this.supabase
      .from('record_inventory')
      .select('*')
      .gt(dbColumn, 0);

    if (error) throw error;

    const totalQuantity = data?.reduce((sum, item) => sum + (item[dbColumn] || 0), 0) || 0;

    const standardLocation = LocationMapper.toStandardLocation(location);
    if (!standardLocation) {
      throw new Error(`Invalid location: ${location}`);
    }

    return {
      location: standardLocation,
      dbColumn,
      totalPallets: data?.length || 0,
      totalQuantity,
      products: [], // This would need to be populated based on requirements
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get inventory by filter
   */
  async getInventoryByFilter(filter: InventoryFilter): Promise<PalletInfoWithLocation[]> {
    return this.palletService.getByFilter(filter);
  }

  /**
   * Bulk transfer alias for batchTransfer
   */
  async bulkTransfer(data: BatchTransferDto): Promise<BatchTransferResult> {
    return this.batchTransfer(data);
  }

  /**
   * Validate a stock transfer
   */
  async validateTransfer(
    transfer: StockTransferDto
  ): Promise<{ valid: boolean; errors: string[] }> {
    const validation = validateStockTransfer(transfer);
    return {
      valid: validation.valid,
      errors: validation.errors || [],
    };
  }

  /**
   * Start a stock count session
   */
  async startStockCount(sessionId: string, userId: number): Promise<StockCountSession> {
    const session: StockCountSession = {
      uuid: sessionId,
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      userId,
      userName: 'Unknown User', // Would need to fetch from user table
      totalScans: 0,
      successScans: 0,
      errorScans: 0,
      sessionStatus: 'active',
    };

    // Store session in cache or database
    return session;
  }

  /**
   * Submit stock count data
   */
  async submitStockCount(data: StockCountDto): Promise<void> {
    // Implementation for stock count submission
    const { error } = await this.supabase.from('stock_count_submissions').insert([
      {
        ...data,
        submitted_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
  }

  /**
   * Complete a stock count session
   */
  async completeStockCount(sessionId: string): Promise<void> {
    // Implementation for completing stock count
    console.log(`Completing stock count session: ${sessionId}`);
  }

  /**
   * Get stock count session
   */
  async getStockCountSession(sessionId: string): Promise<StockCountSession | null> {
    // Implementation for getting stock count session
    return null;
  }

  /**
   * Adjust inventory
   */
  async adjustInventory(adjustment: InventoryAdjustmentDto): Promise<void> {
    // Implementation for inventory adjustment
    console.log(`Adjusting inventory:`, adjustment);
  }

  /**
   * Get activity log
   */
  async getActivityLog(filter?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
  }): Promise<ActivityLogEntry[]> {
    let query = this.supabase
      .from('record_history')
      .select('*')
      .order('time', { ascending: false });

    if (filter?.startDate) {
      query = query.gte('time', filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      query = query.lte('time', filter.endDate.toISOString());
    }
    if (filter?.action) {
      query = query.eq('action', filter.action);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(record => ({
      id: record.uuid,
      timestamp: record.time,
      message: `${record.action}: ${record.remark || 'No details'}`,
      type: 'info' as const,
      details: {
        action: record.action,
        remark: record.remark,
        userId: record.id,
      },
    }));
  }
}
