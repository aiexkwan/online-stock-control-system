/**
 * Unified Inventory Service
 * Central service that orchestrates all inventory operations
 * Consolidates logic from multiple sources and provides a single interface
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IInventoryService } from '../interfaces/IInventoryService';
import { PalletService } from './PalletService';
import { TransactionService } from './TransactionService';
import {
  PalletSearchResult,
  StockTransferDto,
  StockTransferResult,
  VoidPalletDto,
  BatchTransferDto,
  BatchTransferResult,
  InventorySnapshot,
  InventoryStats,
  PalletInfo,
  TransactionResult
} from '../types';
import { getCurrentUserId } from '../utils/authHelpers';
import { validatePalletNumber, validateStockTransfer } from '../utils/validators';
import { detectSearchType } from '@/app/utils/palletSearchUtils';

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
        searchTime: 0
      };
    }
    
    return this.palletService.search(searchType, value);
  }

  /**
   * Transfer stock between locations
   * Uses TransactionService to ensure atomic updates
   */
  async transferStock(transfer: StockTransferDto): Promise<StockTransferResult> {
    const startTime = Date.now();

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
          error: validation.error || 'Invalid transfer data',
          transferTime: Date.now() - startTime
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
        error: result.error,
        transferId: result.transactionId,
        transferTime: Date.now() - startTime,
        updatedPallet: result.success ? 
          await this.getUpdatedPalletInfo(transfer.palletNum) : undefined
      };
    } catch (error: any) {
      console.error('[UnifiedInventoryService] Transfer stock error:', error);
      return {
        success: false,
        error: error.message || 'Transfer failed',
        transferTime: Date.now() - startTime
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
    } catch (error: any) {
      console.error('[UnifiedInventoryService] Void pallet error:', error);
      throw error;
    }
  }

  /**
   * Batch transfer multiple pallets
   * Executes all transfers within a single transaction
   */
  async batchTransfer(batch: BatchTransferDto): Promise<BatchTransferResult> {
    const startTime = Date.now();
    const results: Map<string, StockTransferResult> = new Map();

    try {
      // Add operator info if not provided
      const operator = batch.operator || await getCurrentUserId(this.supabase) || 'system';

      // Validate all transfers first
      const validationErrors: string[] = [];
      for (const transfer of batch.transfers) {
        transfer.operator = operator;
        const validation = validateStockTransfer(transfer);
        if (!validation.valid) {
          validationErrors.push(`${transfer.palletNum}: ${validation.error}`);
        }
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: `Validation errors: ${validationErrors.join(', ')}`,
          results,
          totalTime: Date.now() - startTime,
          successCount: 0,
          failureCount: batch.transfers.length
        };
      }

      // Execute all transfers in a single transaction
      const operations = batch.transfers.map(transfer => 
        () => this.transactionService.executeStockTransfer(transfer)
      );

      const txResult = await this.transactionService.executeBatchOperations<TransactionResult<void>>(
        operations.map(op => async (client) => {
          const result = await op();
          if (!result.success) {
            throw new Error(result.error);
          }
          return result;
        }),
        {
          description: `Batch transfer: ${batch.transfers.length} pallets`,
          logTransaction: true
        }
      );

      // Process results
      let successCount = 0;
      let failureCount = 0;

      batch.transfers.forEach((transfer, index) => {
        const result = txResult.data?.[index];
        if (result?.success) {
          successCount++;
          results.set(transfer.palletNum, {
            success: true,
            transferId: result.transactionId,
            transferTime: result.executionTime || 0
          });
        } else {
          failureCount++;
          results.set(transfer.palletNum, {
            success: false,
            error: result?.error || 'Unknown error',
            transferTime: 0
          });
        }
      });

      // Invalidate cache for all transferred pallets
      if (successCount > 0) {
        await Promise.all(
          batch.transfers.map(t => this.invalidateCache(t.palletNum))
        );
      }

      return {
        success: txResult.success,
        error: txResult.error,
        results,
        totalTime: Date.now() - startTime,
        successCount,
        failureCount
      };
    } catch (error: any) {
      console.error('[UnifiedInventoryService] Batch transfer error:', error);
      return {
        success: false,
        error: error.message || 'Batch transfer failed',
        results,
        totalTime: Date.now() - startTime,
        successCount: 0,
        failureCount: batch.transfers.length
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
      let query = this.supabase
        .from('record_inventory')
        .select('*, record_palletinfo!inner(*)');

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
        productBreakdown: {}
      };

      // Calculate totals and breakdowns
      (data || []).forEach(record => {
        const palletInfo = record.record_palletinfo;
        const qty = palletInfo.product_qty || 0;
        
        snapshot.totalQuantity += qty;

        // Location breakdown
        const location = this.palletService.getCurrentLocation(record.plt_num);
        if (location) {
          snapshot.locationBreakdown[location] = 
            (snapshot.locationBreakdown[location] || 0) + qty;
        }

        // Product breakdown
        const productCode = palletInfo.product_code;
        if (productCode) {
          snapshot.productBreakdown[productCode] = 
            (snapshot.productBreakdown[productCode] || 0) + qty;
        }
      });

      return snapshot;
    } catch (error: any) {
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
      const [
        totalPallets,
        activeTransfers,
        voidedToday,
        lowStockProducts
      ] = await Promise.all([
        this.getTotalPalletCount(),
        this.getActiveTransferCount(),
        this.getVoidedTodayCount(),
        this.getLowStockProducts()
      ]);

      return {
        totalPallets,
        activeTransfers,
        voidedToday,
        lowStockProducts,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
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
    try {
      // Mark materialized view as needing refresh
      await this.supabase.rpc('mark_mv_needs_refresh', {
        p_mv_name: 'mv_pallet_current_location'
      });
    } catch (error) {
      console.error('[UnifiedInventoryService] Invalidate cache error:', error);
    }
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
      const { data, error } = await this.supabase
        .rpc('get_product_stock_levels');

      if (error || !data) return 0;

      return data.filter((product: any) => product.total_quantity < 100).length;
    } catch (error) {
      return 0;
    }
  }
}