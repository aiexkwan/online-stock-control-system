/**
 * Transaction and operation type definitions
 * Manages complex inventory operations with transactional integrity
 */

/**
 * Base transaction operation
 */
export interface TransactionOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'transfer' | 'adjust';
  table: string;
  data: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
  error?: string;
}

/**
 * Transaction context for tracking operations
 */
export interface TransactionContext {
  transactionId: string;
  userId: string;
  startTime: string;
  operations: TransactionOperation[];
  metadata?: Record<string, any>;
}

/**
 * Transaction result
 */
export interface TransactionResult<T = any> {
  success: boolean;
  transactionId: string;
  data?: T;
  error?: string;
  operations: {
    total: number;
    completed: number;
    failed: number;
  };
  duration: number;
}

/**
 * Rollback information
 */
export interface RollbackInfo {
  transactionId: string;
  reason: string;
  operationsToRollback: TransactionOperation[];
  rollbackStrategy: 'reverse' | 'compensate';
}

/**
 * Stock movement transaction details
 */
export interface StockMovementTransaction {
  palletNum: string;
  productCode: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  operator: string;
  operations: {
    updateInventory: boolean;
    createHistory: boolean;
    createTransfer: boolean;
    updateStockLevel: boolean;
  };
}

/**
 * Batch operation transaction
 */
export interface BatchOperationTransaction<T> {
  batchId: string;
  items: T[];
  strategy: 'all_or_nothing' | 'best_effort';
  parallel: boolean;
  maxConcurrency?: number;
}

/**
 * Transaction log entry for audit
 */
export interface TransactionLogEntry {
  uuid: string;
  transaction_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  status: 'success' | 'failed';
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Transaction retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'TEMPORARY_FAILURE'],
};

/**
 * Transaction execution options
 */
export interface TransactionOptions {
  timeout?: number;
  retryConfig?: RetryConfig;
  isolationLevel?: 'read_committed' | 'repeatable_read' | 'serializable';
  savepoint?: boolean;
  trackHistory?: boolean;
}

/**
 * Lock information for concurrent operations
 */
export interface LockInfo {
  resourceType: 'pallet' | 'location' | 'product';
  resourceId: string;
  lockId: string;
  userId: string;
  acquiredAt: string;
  expiresAt: string;
  purpose: string;
}

/**
 * Concurrent operation handler
 */
export interface ConcurrentOperationHandler {
  acquireLock(resource: string, duration: number): Promise<LockInfo>;
  releaseLock(lockId: string): Promise<void>;
  isLocked(resource: string): Promise<boolean>;
  extendLock(lockId: string, duration: number): Promise<void>;
}

/**
 * Transaction event types for monitoring
 */
export type TransactionEventType =
  | 'transaction.started'
  | 'transaction.completed'
  | 'transaction.failed'
  | 'transaction.rolled_back'
  | 'operation.started'
  | 'operation.completed'
  | 'operation.failed'
  | 'lock.acquired'
  | 'lock.released'
  | 'lock.expired';

/**
 * Transaction event
 */
export interface TransactionEvent {
  type: TransactionEventType;
  transactionId: string;
  timestamp: string;
  data?: any;
  userId?: string;
  duration?: number;
}
