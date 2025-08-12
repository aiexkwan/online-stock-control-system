/**
 * Domain-specific types
 */


// Search types
export enum SearchType {
  PALLET = 'pallet',
  PRODUCT = 'product',
  SUPPLIER = 'supplier',
  LOCATION = 'location',
  ORDER = 'order',
}

// Error types
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SYSTEM = 'system',
}