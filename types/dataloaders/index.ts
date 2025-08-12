/**
 * DataLoader Types Index
 * Export all DataLoader-related types
 */

export * from './entities';

// Helper type for DataLoader batch functions
export type BatchLoadFn<K, V> = (keys: readonly K[]) => Promise<(V | Error)[]>;

// Generic constraint for database entities
export type DatabaseEntity = Record<string, unknown>;

// Type guard helper
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Re-export commonly used types for convenience
export type {
  DashboardStatsData,
  TransferEntity,
  ProductEntity,
  InventoryEntity,
  PalletEntity,
  UserEntity,
  GRNEntity,
  HistoryEntity,
  OrderEntity,
} from './entities';
