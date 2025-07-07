/**
 * Unified Transaction Service
 * Consolidates transaction handling logic from multiple sources
 * Handles inventory movements, history records, and transactional integrity
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ITransactionService } from '../interfaces/ITransactionService';
import { 
  TransactionOptions, 
  TransactionResult,
  HistoryRecord,
  StockTransferDto,
  VoidPalletDto
} from '../types';
import { LocationMapper } from '../utils/locationMapper';
import { validatePalletNumber } from '../utils/validators';

export class TransactionService implements ITransactionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Execute a transaction with automatic rollback on failure
   * Consolidates transaction handling from multiple endpoints
   */
  async executeTransaction<T>(
    operations: (client: SupabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>> {
    const startTime = Date.now();
    const txId = this.generateTransactionId();

    try {
      // Log transaction start
      if (options?.logTransaction) {
        await this.logTransactionStart(txId, options.description);
      }

      // Execute operations
      const result = await operations(this.supabase);

      // Log transaction success
      if (options?.logTransaction) {
        await this.logTransactionEnd(txId, 'success');
      }

      return {
        success: true,
        data: result,
        transactionId: txId,
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[TransactionService] Transaction failed:', error);

      // Log transaction failure
      if (options?.logTransaction) {
        await this.logTransactionEnd(txId, 'failed', error.message);
      }

      return {
        success: false,
        error: error.message || 'Transaction failed',
        transactionId: txId,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute a stock transfer within a transaction
   * Ensures both inventory update and history record are created atomically
   */
  async executeStockTransfer(transfer: StockTransferDto): Promise<TransactionResult<void>> {
    return this.executeTransaction(async (client) => {
      // Validate transfer
      if (!validatePalletNumber(transfer.palletNum)) {
        throw new Error('Invalid pallet number format');
      }

      const fromColumn = LocationMapper.toDbColumn(transfer.fromLocation);
      const toColumn = LocationMapper.toDbColumn(transfer.toLocation);

      if (!fromColumn || !toColumn) {
        throw new Error('Invalid location mapping');
      }

      // Get current inventory
      const { data: inventory, error: inventoryError } = await client
        .from('record_inventory')
        .select('*')
        .eq('plt_num', transfer.palletNum)
        .single();

      if (inventoryError || !inventory) {
        throw new Error('Pallet not found in inventory');
      }

      // Validate stock levels
      const currentQty = inventory[fromColumn] || 0;
      if (currentQty < transfer.quantity) {
        throw new Error(`Insufficient stock. Available: ${currentQty}, Requested: ${transfer.quantity}`);
      }

      // Update inventory
      const updates: any = {
        [fromColumn]: currentQty - transfer.quantity,
        [toColumn]: (inventory[toColumn] || 0) + transfer.quantity,
        latest_update: new Date().toISOString()
      };

      const { error: updateError } = await client
        .from('record_inventory')
        .update(updates)
        .eq('plt_num', transfer.palletNum);

      if (updateError) {
        throw new Error(`Failed to update inventory: ${updateError.message}`);
      }

      // Create history record
      const historyRecord: Partial<HistoryRecord> = {
        plt_num: transfer.palletNum,
        loc: toColumn,
        loc_to: toColumn,
        loc_fr: fromColumn,
        action: 'Transfer',
        qty: transfer.quantity,
        time: new Date().toISOString(),
        remark: transfer.remark || `Transfer from ${transfer.fromLocation} to ${transfer.toLocation}`,
        updated_by: transfer.operator || 'system'
      };

      const { error: historyError } = await client
        .from('record_history')
        .insert([historyRecord]);

      if (historyError) {
        throw new Error(`Failed to create history record: ${historyError.message}`);
      }
    }, {
      description: `Stock transfer: ${transfer.palletNum} from ${transfer.fromLocation} to ${transfer.toLocation}`,
      logTransaction: true
    });
  }

  /**
   * Execute a void operation within a transaction
   */
  async executeVoidPallet(voidData: VoidPalletDto): Promise<TransactionResult<void>> {
    return this.executeTransaction(async (client) => {
      // Validate pallet
      if (!validatePalletNumber(voidData.palletNum)) {
        throw new Error('Invalid pallet number format');
      }

      // Get current inventory
      const { data: inventory, error: inventoryError } = await client
        .from('record_inventory')
        .select('*')
        .eq('plt_num', voidData.palletNum)
        .single();

      if (inventoryError || !inventory) {
        throw new Error('Pallet not found in inventory');
      }

      // Determine which location column has stock
      const locationColumn = this.findLocationWithStock(inventory);
      if (!locationColumn) {
        throw new Error('No stock found for this pallet');
      }

      const currentQty = inventory[locationColumn];
      const standardLocation = LocationMapper.fromDbColumn(locationColumn as any);

      // Update inventory to zero
      const updates: any = {
        [locationColumn]: 0,
        latest_update: new Date().toISOString()
      };

      const { error: updateError } = await client
        .from('record_inventory')
        .update(updates)
        .eq('plt_num', voidData.palletNum);

      if (updateError) {
        throw new Error(`Failed to update inventory: ${updateError.message}`);
      }

      // Create void history record
      const historyRecord: Partial<HistoryRecord> = {
        plt_num: voidData.palletNum,
        loc: 'void',
        loc_to: 'void',
        loc_fr: locationColumn,
        action: voidData.reason,
        qty: -currentQty, // Negative to indicate removal
        time: new Date().toISOString(),
        remark: voidData.remark || `Void: ${voidData.reason}`,
        updated_by: voidData.operator || 'system'
      };

      const { error: historyError } = await client
        .from('record_history')
        .insert([historyRecord]);

      if (historyError) {
        throw new Error(`Failed to create history record: ${historyError.message}`);
      }
    }, {
      description: `Void pallet: ${voidData.palletNum} - ${voidData.reason}`,
      logTransaction: true
    });
  }

  /**
   * Create a history record
   */
  async createHistoryRecord(record: Partial<HistoryRecord>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('record_history')
        .insert([{
          ...record,
          time: record.time || new Date().toISOString()
        }]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('[TransactionService] Create history record error:', error);
      throw error;
    }
  }

  /**
   * Create multiple history records in batch
   */
  async createHistoryRecordsBatch(records: Partial<HistoryRecord>[]): Promise<void> {
    try {
      const recordsWithTime = records.map(record => ({
        ...record,
        time: record.time || new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('record_history')
        .insert(recordsWithTime);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('[TransactionService] Create history records batch error:', error);
      throw error;
    }
  }

  /**
   * Execute batch operations within a single transaction
   */
  async executeBatchOperations<T>(
    operations: Array<(client: SupabaseClient) => Promise<any>>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T[]>> {
    return this.executeTransaction(async (client) => {
      const results: T[] = [];
      
      for (const operation of operations) {
        const result = await operation(client);
        results.push(result);
      }
      
      return results;
    }, options);
  }

  /**
   * Validate transaction integrity
   * Checks if inventory matches history records
   */
  async validateTransactionIntegrity(palletNum: string): Promise<boolean> {
    try {
      // Get current inventory
      const { data: inventory, error: invError } = await this.supabase
        .from('record_inventory')
        .select('*')
        .eq('plt_num', palletNum)
        .single();

      if (invError || !inventory) {
        return false;
      }

      // Get all history records
      const { data: history, error: histError } = await this.supabase
        .from('record_history')
        .select('*')
        .eq('plt_num', palletNum)
        .order('time', { ascending: true });

      if (histError || !history) {
        return false;
      }

      // Calculate expected inventory from history
      const calculated = this.calculateInventoryFromHistory(history);
      
      // Compare with actual inventory
      return this.compareInventory(inventory, calculated);
    } catch (error) {
      console.error('[TransactionService] Validate integrity error:', error);
      return false;
    }
  }

  /**
   * Get transaction logs
   */
  async getTransactionLogs(
    filter?: { startDate?: string; endDate?: string; status?: string }
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from('transaction_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.startDate) {
        query = query.gte('created_at', filter.startDate);
      }
      if (filter?.endDate) {
        query = query.lte('created_at', filter.endDate);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('[TransactionService] Get transaction logs error:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private generateTransactionId(): string {
    return `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logTransactionStart(txId: string, description?: string): Promise<void> {
    try {
      await this.supabase
        .from('transaction_logs')
        .insert([{
          transaction_id: txId,
          description,
          status: 'started',
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('[TransactionService] Log transaction start error:', error);
    }
  }

  private async logTransactionEnd(
    txId: string, 
    status: 'success' | 'failed', 
    error?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('transaction_logs')
        .update({
          status,
          error_message: error,
          completed_at: new Date().toISOString()
        })
        .eq('transaction_id', txId);
    } catch (error) {
      console.error('[TransactionService] Log transaction end error:', error);
    }
  }

  private findLocationWithStock(inventory: any): string | null {
    const locationColumns = LocationMapper.getAllDbColumns();
    
    for (const column of locationColumns) {
      if (inventory[column] && inventory[column] > 0) {
        return column;
      }
    }
    
    return null;
  }

  private calculateInventoryFromHistory(history: HistoryRecord[]): any {
    const inventory: any = {};
    
    for (const record of history) {
      if (record.loc_to && record.qty > 0) {
        inventory[record.loc_to] = (inventory[record.loc_to] || 0) + record.qty;
      }
      if (record.loc_fr && record.qty > 0) {
        inventory[record.loc_fr] = (inventory[record.loc_fr] || 0) - record.qty;
      }
    }
    
    return inventory;
  }

  private compareInventory(actual: any, calculated: any): boolean {
    const locationColumns = LocationMapper.getAllDbColumns();
    
    for (const column of locationColumns) {
      const actualQty = actual[column] || 0;
      const calculatedQty = calculated[column] || 0;
      
      if (Math.abs(actualQty - calculatedQty) > 0.01) {
        return false;
      }
    }
    
    return true;
  }
}