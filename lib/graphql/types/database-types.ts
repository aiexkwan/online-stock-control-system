/**
 * Type-Safe Database Interfaces
 * Ensures type safety between GraphQL schema and database operations
 */

// Base database record interface
export interface BaseRecord {
  id: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Database Table Interfaces (actual database structure)
 */
export interface RecordTransferDB {
  tran_date: Date;
  f_loc: string;
  t_loc: string;
  plt_num: string;
  operator_id: number;
  uuid: string;
}

export interface RecordPalletInfoDB {
  generate_time: Date;
  plt_num: string;
  product_code: string;
  series: string;
  plt_remark?: string;
  product_qty: number;
  pdf_url?: string;
}

export interface RecordHistoryDB {
  time: Date;
  id: number; // operator_id
  action: string;
  plt_num: string;
  remark?: string;
  loc?: string;
}

export interface DataIdDB {
  id: number;
  name: string;
}

export interface DataCodeDB {
  code: string;
  description?: string;
  type?: string;
  colour?: string;
  chinese_description?: string;
  standard_qty?: number;
}

/**
 * GraphQL Schema Interfaces (what resolvers expect)
 */
export interface TransferRecord {
  id: string;
  transferDate: Date;
  fromLocation: string;
  toLocation: string;
  palletNumber: string;
  operatorId: number;
  action: string; // Computed field
  actionType: 'MOVEMENT' | 'STATUS_CHANGE' | 'QUANTITY_CHANGE' | 'SYSTEM_ACTION';
}

export interface PalletInfoRecord {
  id: string;
  generateTime: Date;
  palletNumber: string;
  productCode: string;
  series: string;
  remark?: string;
  quantity: number;
  pdfUrl?: string;
  action: string; // Computed field
}

export interface StockHistoryRecord {
  id: string;
  timestamp: Date;
  palletNumber: string;
  productCode: string;
  action: string;
  location?: string;
  fromLocation?: string;
  toLocation?: string;
  operatorId: number;
  operatorName: string;
  quantity?: number;
  remark?: string;
  actionType: 'MOVEMENT' | 'STATUS_CHANGE' | 'QUANTITY_CHANGE' | 'SYSTEM_ACTION';
  actionCategory: 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | 'ADMINISTRATIVE';
}

export interface ProductInfo {
  code: string;
  description: string;
  chineseDescription?: string;
  type: string;
  colour?: string;
  standardQty?: number;
  totalPallets: number;
  activePallets: number;
}

export interface StaffInfo {
  id: number;
  name: string;
}

/**
 * Department-specific types
 */
export interface DepartmentStats {
  todayFinished?: number;
  todayTransferred?: number;
  past7Days: number;
  past14Days: number;
  lastUpdated: Date;
}

export interface StockItem {
  stock: string;
  description?: string;
  stockLevel: number;
  updateTime: Date;
  type?: string;
  realTimeLevel?: number;
  lastStockUpdate?: Date;
}

export interface StockLevelRecord {
  id: string;
  stock: string;
  stockLevel: number;
  updateTime: Date;
  productInfo?: ProductInfo;
}

export interface Transfer {
  id?: string;
  uuid?: string;
  from_location?: string;
  fromLocation?: string;
  f_loc?: string;
  to_location?: string;
  toLocation?: string;
  t_loc?: string;
  created_at?: Date;
  createdAt?: Date;
  tran_date?: Date;
  plt_num?: string;
  operator_id?: number;
}

export interface MachineState {
  machineNumber: string;
  lastActiveTime?: Date | null;
  state: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN';
}

export interface RecentActivity {
  time: string;
  staff: string;
  action: string;
  detail: string;
}

export interface OrderCompletion {
  orderRef: string;
  productQty: number;
  loadedQty: number;
  completionPercentage: number;
  latestUpdate?: string;
  hasPdf: boolean;
  docUrl?: string;
}

/**
 * Type transformers for converting between database and GraphQL formats
 */
export class TypeTransformers {
  /**
   * Transform database transfer record to GraphQL format
   */
  static transformTransferRecord(db: RecordTransferDB): TransferRecord {
    return {
      id: db.uuid,
      transferDate: db.tran_date,
      fromLocation: db.f_loc,
      toLocation: db.t_loc,
      palletNumber: db.plt_num,
      operatorId: db.operator_id,
      action: 'TRANSFERRED', // Computed default
      actionType: 'MOVEMENT',
    };
  }

  /**
   * Transform database pallet info to GraphQL format
   */
  static transformPalletInfoRecord(db: RecordPalletInfoDB): PalletInfoRecord {
    return {
      id: db.plt_num, // Using pallet number as ID
      generateTime: db.generate_time,
      palletNumber: db.plt_num,
      productCode: db.product_code,
      series: db.series,
      remark: db.plt_remark,
      quantity: db.product_qty,
      pdfUrl: db.pdf_url,
      action: 'CREATED', // Computed default
    };
  }

  /**
   * Transform database history record to GraphQL stock history format
   */
  static transformStockHistoryRecord(
    db: RecordHistoryDB,
    staffInfo?: StaffInfo,
    palletInfo?: PalletInfoRecord
  ): StockHistoryRecord {
    return {
      id: `${db.plt_num}_${db.time.getTime()}`, // Composite ID
      timestamp: db.time,
      palletNumber: db.plt_num,
      productCode: palletInfo?.productCode || 'UNKNOWN',
      action: db.action,
      location: db.loc,
      operatorId: db.id,
      operatorName: staffInfo?.name || 'Unknown',
      quantity: palletInfo?.quantity,
      remark: db.remark,
      actionType: this.computeActionType(db.action),
      actionCategory: this.computeActionCategory(db.action, db.loc),
    };
  }

  /**
   * Compute action type based on action string
   */
  private static computeActionType(
    action: string
  ): 'MOVEMENT' | 'STATUS_CHANGE' | 'QUANTITY_CHANGE' | 'SYSTEM_ACTION' {
    const movementActions = ['TRANSFERRED', 'MOVED', 'Stock Transfer', 'Loading'];
    const statusActions = ['VOIDED', 'ALLOCATED', 'QUALITY_CHECK'];
    const quantityActions = ['ADJUSTED', 'LOADED', 'UNLOADED'];

    if (movementActions.some(a => action.includes(a))) return 'MOVEMENT';
    if (statusActions.some(a => action.includes(a))) return 'STATUS_CHANGE';
    if (quantityActions.some(a => action.includes(a))) return 'QUANTITY_CHANGE';
    return 'SYSTEM_ACTION';
  }

  /**
   * Compute action category based on action and location
   */
  private static computeActionCategory(
    action: string,
    location?: string
  ): 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | 'ADMINISTRATIVE' {
    if (action.includes('Loading') || location?.includes('LOADING')) return 'OUTBOUND';
    if (action.includes('Receiving') || location?.includes('RECEIVING')) return 'INBOUND';
    if (action.includes('Transfer') && location) return 'INTERNAL';
    return 'ADMINISTRATIVE';
  }
}

/**
 * Query parameter types for type-safe database operations
 */
export interface QueryFilters {
  startDate?: Date;
  endDate?: Date;
  productCodes?: string[];
  palletNumbers?: string[];
  actions?: string[];
  operatorIds?: number[];
  locations?: string[];
}

export interface PaginationParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  offset?: number;
  useCursor?: boolean;
}

export interface SortParams {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryOptions {
  filters?: QueryFilters;
  pagination?: PaginationParams;
  sort?: SortParams;
  includeRelated?: boolean;
}

/**
 * Result wrapper types
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface QueryResult<T> {
  data: T[];
  pageInfo: PageInfo;
  aggregations?: Record<string, unknown>;
}

/**
 * Type guards for runtime type checking
 */
export class TypeGuards {
  static isRecordTransferDB(obj: unknown): obj is RecordTransferDB {
    const record = obj as Record<string, unknown>;
    return (
      record &&
      typeof record.tran_date !== 'undefined' &&
      typeof record.f_loc === 'string' &&
      typeof record.t_loc === 'string' &&
      typeof record.plt_num === 'string' &&
      typeof record.operator_id === 'number'
    );
  }

  static isRecordPalletInfoDB(obj: unknown): obj is RecordPalletInfoDB {
    const record = obj as Record<string, unknown>;
    return (
      record &&
      typeof record.generate_time !== 'undefined' &&
      typeof record.plt_num === 'string' &&
      typeof record.product_code === 'string' &&
      typeof record.product_qty === 'number'
    );
  }

  static isRecordHistoryDB(obj: unknown): obj is RecordHistoryDB {
    const record = obj as Record<string, unknown>;
    return (
      record &&
      typeof record.time !== 'undefined' &&
      typeof record.id === 'number' &&
      typeof record.action === 'string' &&
      typeof record.plt_num === 'string'
    );
  }
}

/**
 * Error types for type-safe error handling
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly table?: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class SchemaError extends Error {
  constructor(
    message: string,
    public readonly expectedType: string,
    public readonly actualType: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'SchemaError';
  }
}
