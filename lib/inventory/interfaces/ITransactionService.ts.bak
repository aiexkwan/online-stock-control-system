/**
 * Interface for transaction management
 * Handles database transactions with proper rollback support
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { TransactionContext, TransactionResult, TransactionOptions } from '../types';

export interface ITransactionService {
  // Transaction Management
  beginTransaction(): Promise<TransactionContext>;
  commit(context: TransactionContext): Promise<void>;
  rollback(context: TransactionContext): Promise<void>;

  // Transactional Operations
  runInTransaction<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>>;

  // Batch Transaction Support
  runBatchInTransaction<T>(
    operations: Array<(client: SupabaseClient) => Promise<T>>,
    options?: TransactionOptions & { stopOnError?: boolean }
  ): Promise<TransactionResult<T[]>>;

  // Transaction Status
  isInTransaction(): boolean;
  getCurrentTransaction(): TransactionContext | null;

  // Audit and Logging
  logTransaction(
    context: TransactionContext,
    result: 'success' | 'failed',
    error?: Error | { message: string; code?: string }
  ): Promise<void>;
  getTransactionHistory(transactionId: string): Promise<TransactionContext | null>;
}
