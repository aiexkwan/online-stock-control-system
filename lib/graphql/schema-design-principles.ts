/**
 * GraphQL Schema Design Principles Implementation
 * Week 1.2: Schema Design Principles Enhancement
 * Date: 2025-07-03
 * 
 * This file contains the standardized design principles for our unified GraphQL schema.
 */

// ================================
// 1. 標準命名規範 (Standard Naming Conventions)
// ================================

export const NamingConventions = {
  // Type naming: PascalCase
  types: {
    // Business entities - singular, descriptive
    correct: ['Product', 'Inventory', 'Pallet', 'Order', 'Movement'],
    incorrect: ['product', 'inventoryRecord', 'PALLET', 'order_item']
  },

  // Field naming: camelCase
  fields: {
    correct: ['palletCode', 'createdAt', 'productType', 'warehouseLocation'],
    incorrect: ['pallet_code', 'created_at', 'ProductType', 'warehouse-location']
  },

  // Query naming: descriptive verbs + nouns
  queries: {
    // Single resource: noun(id: ID!)
    single: ['product(id: ID!)', 'inventory(id: ID!)', 'pallet(id: ID!)'],
    // List resources: pluralNoun(filter, pagination, sort)
    list: ['products(filter, pagination, sort)', 'inventories(filter, pagination, sort)'],
    // Business operations: verbNoun
    business: ['getLowStockProducts', 'getPendingOrders', 'getActiveTransfers']
  },

  // Mutation naming: verb + target
  mutations: {
    create: ['createProduct', 'createPallet', 'createInventoryRecord'],
    update: ['updateProduct', 'updateInventory', 'updatePalletStatus'],
    delete: ['deleteProduct', 'voidPallet', 'cancelOrder'],
    business: ['transferStock', 'adjustInventory', 'processStocktake']
  },

  // Subscription naming: noun + event
  subscriptions: {
    correct: ['inventoryUpdated', 'palletMoved', 'orderStatusChanged'],
    incorrect: ['inventory_update', 'PalletMove', 'order-status-change']
  }
};

// ================================
// 2. 統一分頁標準 (Unified Pagination Standard)
// ================================

export interface ConnectionPattern<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface PaginationInput {
  first?: number;      // Forward pagination
  after?: string;      // Cursor for forward pagination
  last?: number;       // Backward pagination  
  before?: string;     // Cursor for backward pagination
}

// Pagination validation rules
export const PaginationRules = {
  maxLimit: 100,       // Maximum items per page
  defaultLimit: 20,    // Default items per page
  
  validate: (input: PaginationInput): string[] => {
    const errors: string[] = [];
    
    // Cannot use both forward and backward pagination
    if ((input.first || input.after) && (input.last || input.before)) {
      errors.push('Cannot use both forward and backward pagination simultaneously');
    }
    
    // Validate limits
    if (input.first && input.first > PaginationRules.maxLimit) {
      errors.push(`'first' cannot exceed ${PaginationRules.maxLimit}`);
    }
    
    if (input.last && input.last > PaginationRules.maxLimit) {
      errors.push(`'last' cannot exceed ${PaginationRules.maxLimit}`);
    }
    
    return errors;
  }
};

// ================================
// 3. 統一錯誤處理 (Unified Error Handling)
// ================================

export interface UserError {
  __typename: 'UserError';
  message: string;
  field?: string;
  code: UserErrorCode;
}

export interface SystemError {
  __typename: 'SystemError';
  message: string;
  code: SystemErrorCode;
  timestamp: string;
  requestId?: string;
}

export enum UserErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_INPUT = 'INVALID_INPUT'
}

export enum SystemErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

// Result union types for operations
export type ProductResult = Product | UserError | SystemError;
export type InventoryResult = Inventory | UserError | SystemError;
export type PalletResult = Pallet | UserError | SystemError;

// ================================
// 4. 輸入驗證標準 (Input Validation Standards)
// ================================

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

export const CommonValidationRules = {
  // Product code validation
  productCode: {
    field: 'productCode',
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9-]+$/,
    customValidator: (value: string) => {
      if (!value.includes('-')) {
        return 'Product code must contain at least one hyphen';
      }
      return null;
    }
  },

  // Pallet number validation
  palletNumber: {
    field: 'palletNumber',
    required: true,
    pattern: /^[A-Z]{2}\d{8}$/,
    customValidator: (value: string) => {
      if (value.length !== 10) {
        return 'Pallet number must be exactly 10 characters';
      }
      return null;
    }
  },

  // Quantity validation
  quantity: {
    field: 'quantity',
    required: true,
    customValidator: (value: number) => {
      if (value < 0) {
        return 'Quantity cannot be negative';
      }
      if (!Number.isInteger(value)) {
        return 'Quantity must be a whole number';
      }
      return null;
    }
  },

  // Location validation
  location: {
    field: 'location',
    required: true,
    pattern: /^[A-Z]\d{2}-[A-Z]\d{2}$/,
    customValidator: (value: string) => {
      if (!value.match(/^[A-Z]\d{2}-[A-Z]\d{2}$/)) {
        return 'Location format must be A00-B00 (e.g., A01-B02)';
      }
      return null;
    }
  }
};

// ================================
// 5. 類型安全性強化 (Type Safety Enhancement)
// ================================

// Scalar type definitions
export const ScalarDefinitions = {
  DateTime: {
    description: 'A date-time string at UTC, such as 2007-12-03T10:15:30Z',
    serialize: (value: Date) => value.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast: any) => new Date(ast.value)
  },

  PositiveInt: {
    description: 'A positive integer',
    serialize: (value: number) => value,
    parseValue: (value: number) => {
      if (value <= 0) throw new Error('Value must be positive');
      return Math.floor(value);
    }
  },

  ProductCode: {
    description: 'A valid product code format',
    serialize: (value: string) => value,
    parseValue: (value: string) => {
      if (!CommonValidationRules.productCode.pattern?.test(value)) {
        throw new Error('Invalid product code format');
      }
      return value;
    }
  }
};

// ================================
// 6. Schema 文檔標準 (Schema Documentation Standards)
// ================================

export const DocumentationStandards = {
  // Type descriptions should be clear and concise
  typeDescription: {
    template: 'Represents a {entity} in the {domain} with {key_attributes}',
    example: 'Represents a product in the inventory system with code, description, and specifications'
  },

  // Field descriptions should explain purpose and constraints
  fieldDescription: {
    template: '{Purpose}. {Constraints if any}',
    examples: [
      'The unique identifier for this product',
      'The product code following company naming conventions. Must be 3-20 characters.',
      'The current stock quantity. Cannot be negative.'
    ]
  },

  // Query descriptions should explain use cases
  queryDescription: {
    template: 'Retrieves {what} for {use_case}. {Additional_info}',
    example: 'Retrieves low stock products for inventory management. Returns products with quantity below threshold.'
  }
};

// ================================
// 7. Schema 版本控制 (Schema Versioning)
// ================================

export interface SchemaVersion {
  version: string;
  releaseDate: string;
  changes: SchemaChange[];
  breakingChanges: boolean;
  deprecations: DeprecationInfo[];
}

export interface SchemaChange {
  type: 'ADDED' | 'MODIFIED' | 'REMOVED' | 'DEPRECATED';
  target: 'TYPE' | 'FIELD' | 'QUERY' | 'MUTATION' | 'SUBSCRIPTION';
  path: string;
  description: string;
  migration?: string;
}

export interface DeprecationInfo {
  path: string;
  reason: string;
  replacement?: string;
  removalDate: string;
}

// Current schema version
export const CURRENT_SCHEMA_VERSION: SchemaVersion = {
  version: '1.2.0',
  releaseDate: '2025-07-03',
  changes: [
    {
      type: 'ADDED',
      target: 'TYPE',
      path: 'SchemaDesignPrinciples',
      description: 'Added comprehensive schema design principles and validation'
    }
  ],
  breakingChanges: false,
  deprecations: []
};

// ================================
// 8. 最佳實踐檢查器 (Best Practices Checker)
// ================================

export class SchemaBestPracticesChecker {
  static validateNaming(name: string, type: 'TYPE' | 'FIELD' | 'QUERY' | 'MUTATION'): string[] {
    const errors: string[] = [];
    
    switch (type) {
      case 'TYPE':
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
          errors.push(`Type name '${name}' should be PascalCase`);
        }
        break;
        
      case 'FIELD':
        if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
          errors.push(`Field name '${name}' should be camelCase`);
        }
        break;
        
      case 'QUERY':
      case 'MUTATION':
        if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
          errors.push(`${type} name '${name}' should be camelCase`);
        }
        break;
    }
    
    return errors;
  }
  
  static validatePagination(queryName: string, hasConnectionType: boolean): string[] {
    const errors: string[] = [];
    
    if (queryName.endsWith('s') && !hasConnectionType) {
      errors.push(`List query '${queryName}' should return a Connection type for pagination`);
    }
    
    return errors;
  }
  
  static validateErrorHandling(returnType: string): string[] {
    const errors: string[] = [];
    
    if (!returnType.includes('UserError') && !returnType.includes('SystemError')) {
      errors.push(`Return type '${returnType}' should include error unions for proper error handling`);
    }
    
    return errors;
  }
}

// ================================
// 9. 性能優化原則 (Performance Optimization Principles)
// ================================

export const PerformanceGuidelines = {
  // Query complexity limits
  complexity: {
    maxDepth: 10,        // Maximum query depth
    maxComplexity: 1000, // Maximum query complexity score
    timeout: 30000       // 30 seconds timeout
  },
  
  // Field resolution guidelines
  fieldResolution: {
    // Expensive fields should be optional and lazily loaded
    expensiveFields: ['movements', 'detailedHistory', 'analytics'],
    
    // Use DataLoader for N+1 problem prevention
    batchLoading: true,
    
    // Cache frequently accessed data
    cacheStrategy: {
      staticData: '24h',     // Product definitions, locations
      semiStaticData: '1h',  // Inventory summaries
      dynamicData: '5m'      // Real-time stock levels
    }
  },
  
  // Subscription guidelines
  subscriptions: {
    // Limit concurrent subscriptions per user
    maxConcurrentSubscriptions: 10,
    
    // Use subscription filtering to reduce bandwidth
    useFiltering: true,
    
    // Implement subscription rate limiting
    rateLimit: '100/minute'
  }
};

// Export all principles for use in schema validation and generation
const schemaDesignPrinciples = {
  NamingConventions,
  PaginationRules,
  UserErrorCode,
  SystemErrorCode,
  CommonValidationRules,
  ScalarDefinitions,
  DocumentationStandards,
  CURRENT_SCHEMA_VERSION,
  SchemaBestPracticesChecker,
  PerformanceGuidelines
};

export default schemaDesignPrinciples; 