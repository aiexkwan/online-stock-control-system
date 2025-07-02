'use client';

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/app/utils/supabase/client';

// 事務來源定義
export enum TransactionSource {
  // 標籤打印模組
  GRN_LABEL = 'grn_label',
  QC_LABEL = 'qc_label',
  
  // 庫存管理模組
  INVENTORY_TRANSFER = 'inventory_transfer',
  STOCK_ADJUSTMENT = 'stock_adjustment',
  CYCLE_COUNT = 'cycle_count',
  
  // 訂單處理模組
  ACO_ORDER = 'aco_order',
  CUSTOMER_ORDER = 'customer_order',
  LOADING = 'loading',
  
  // 其他模組
  PRODUCT_RECEIVE = 'product_receive',
  LOCATION_MANAGEMENT = 'location_management'
}

// 事務操作類型
export enum TransactionOperation {
  // 通用操作
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_PROCESS = 'bulk_process',
  
  // 特定操作
  PRINT_LABEL = 'print_label',
  GENERATE_PDF = 'generate_pdf',
  ALLOCATE_RESOURCE = 'allocate_resource',
  TRANSFER_STOCK = 'transfer_stock',
  ADJUST_QUANTITY = 'adjust_quantity'
}

// 事務狀態
export enum TransactionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  ROLLBACK_FAILED = 'rollback_failed'
}

// 事務記錄介面
export interface TransactionLogEntry {
  transactionId: string;
  sourceModule: TransactionSource;
  sourcePage: string;
  sourceAction: string;
  operationType: TransactionOperation;
  userId: string;
  userClockNumber?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// 事務步驟介面
export interface TransactionStep {
  name: string;
  sequence: number;
  data?: any;
}

// 回滾結果介面
export interface RollbackResult {
  success: boolean;
  rolledBackSteps: number;
  errorCount: number;
  details: Array<{
    step: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * 通用事務記錄服務
 * 提供事務記錄、步驟追蹤、錯誤處理和回滾功能
 */
export class TransactionLogService {
  private supabase: SupabaseClient;
  
  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient();
  }
  
  /**
   * 生成事務 ID
   */
  generateTransactionId(): string {
    return crypto.randomUUID();
  }
  
  /**
   * 開始新事務
   */
  async startTransaction(
    entry: TransactionLogEntry,
    preState?: any
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('start_transaction', {
        p_transaction_id: entry.transactionId,
        p_source_module: entry.sourceModule,
        p_source_page: entry.sourcePage,
        p_source_action: entry.sourceAction,
        p_operation_type: entry.operationType,
        p_user_id: entry.userId,
        p_user_clock_number: entry.userClockNumber,
        p_session_id: entry.sessionId,
        p_pre_state: preState,
        p_metadata: entry.metadata
      });
      
      if (error) {
        console.error('[TransactionLogService] Failed to start transaction:', error);
        throw error;
      }
      
      console.log('[TransactionLogService] Transaction started:', entry.transactionId);
      return entry.transactionId;
    } catch (error) {
      console.error('[TransactionLogService] Error starting transaction:', error);
      throw error;
    }
  }
  
  /**
   * 記錄事務步驟
   */
  async recordStep(
    transactionId: string,
    step: TransactionStep
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('record_transaction_step', {
        p_transaction_id: transactionId,
        p_step_name: step.name,
        p_step_sequence: step.sequence,
        p_step_data: step.data
      });
      
      if (error) {
        console.error('[TransactionLogService] Failed to record step:', error);
        throw error;
      }
      
      console.log('[TransactionLogService] Step recorded:', step.name);
    } catch (error) {
      console.error('[TransactionLogService] Error recording step:', error);
      throw error;
    }
  }
  
  /**
   * 完成事務
   */
  async completeTransaction(
    transactionId: string,
    postState?: any,
    affectedRecords?: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('complete_transaction', {
        p_transaction_id: transactionId,
        p_post_state: postState,
        p_affected_records: affectedRecords
      });
      
      if (error) {
        console.error('[TransactionLogService] Failed to complete transaction:', error);
        throw error;
      }
      
      console.log('[TransactionLogService] Transaction completed:', transactionId);
    } catch (error) {
      console.error('[TransactionLogService] Error completing transaction:', error);
      throw error;
    }
  }
  
  /**
   * 記錄事務錯誤
   */
  async recordError(
    transactionId: string,
    error: Error,
    errorCode?: string,
    errorDetails?: any
  ): Promise<string | null> {
    try {
      const { data, error: rpcError } = await this.supabase.rpc('record_transaction_error', {
        p_transaction_id: transactionId,
        p_error_code: errorCode || error.name,
        p_error_message: error.message,
        p_error_details: errorDetails,
        p_error_stack: error.stack
      });
      
      if (rpcError) {
        console.error('[TransactionLogService] Failed to record error:', rpcError);
        return null;
      }
      
      console.log('[TransactionLogService] Error recorded:', data);
      return data as string;
    } catch (err) {
      console.error('[TransactionLogService] Exception recording error:', err);
      return null;
    }
  }
  
  /**
   * 執行回滾
   */
  async executeRollback(
    transactionId: string,
    rollbackBy: string,
    reason: string
  ): Promise<RollbackResult> {
    try {
      const { data, error } = await this.supabase.rpc('rollback_transaction', {
        p_transaction_id: transactionId,
        p_rollback_by: rollbackBy,
        p_rollback_reason: reason
      });
      
      if (error) {
        console.error('[TransactionLogService] Failed to execute rollback:', error);
        throw error;
      }
      
      console.log('[TransactionLogService] Rollback executed:', data);
      return data as RollbackResult;
    } catch (error) {
      console.error('[TransactionLogService] Error executing rollback:', error);
      throw error;
    }
  }
  
  /**
   * 查詢事務狀態
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus | null> {
    try {
      const { data, error } = await this.supabase
        .from('transaction_log')
        .select('status')
        .eq('transaction_id', transactionId)
        .is('step_name', null)
        .single();
      
      if (error) {
        console.error('[TransactionLogService] Failed to get transaction status:', error);
        return null;
      }
      
      return data?.status as TransactionStatus;
    } catch (error) {
      console.error('[TransactionLogService] Error getting transaction status:', error);
      return null;
    }
  }
  
  /**
   * 查詢事務歷史
   */
  async getTransactionHistory(
    sourceModule?: TransactionSource,
    userId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from('v_transaction_report')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (sourceModule) {
        query = query.eq('source_module', sourceModule);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[TransactionLogService] Failed to get transaction history:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[TransactionLogService] Error getting transaction history:', error);
      return [];
    }
  }
}

// 導出單例
export const transactionLogService = new TransactionLogService();