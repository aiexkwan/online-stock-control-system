/**
 * Strategy 2: DTO/自定義 interface - Supplier & Warehouse Widget 類型定義
 * 為供應商和倉庫管理相關組件提供類型安全
 */

// Supplier 相關類型
export interface SupplierData {
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface SupplierSearchResponse {
  data_supplierCollection: {
    edges: Array<{
      node: SupplierData;
    }>;
  };
}

export interface SupplierUpdateRequest {
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Warehouse 相關類型
export interface WarehouseData {
  id: string;
  name: string;
  code: string;
  location?: string;
  capacity?: number;
  type?: 'main' | 'sub' | 'temporary';
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface WarehouseTransferData {
  id: string;
  from_warehouse: string;
  to_warehouse: string;
  product_code: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  transfer_date: string;
  completed_date?: string;
  notes?: string;
}

export interface WarehouseWorkLevelData {
  warehouse: string;
  hour: string;
  work_level: number;
  efficiency: number;
  active_workers: number;
  pending_tasks: number;
}

// Transfer 統計類型
export interface TransferStats {
  total_transfers: number;
  pending_transfers: number;
  completed_transfers: number;
  cancelled_transfers: number;
  average_completion_time: number;
}

// Warehouse 工作負載統計
export interface WorkLevelStats {
  peak_hour: string;
  peak_level: number;
  average_level: number;
  total_efficiency: number;
  busiest_warehouse: string;
}

// Status Message 類型
export interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp?: Date;
}

// Performance Metrics 類型
export interface PerformanceMetrics {
  lastOperationTime?: number;
  fetchTime?: number;
  optimized?: boolean;
  source?: string;
  cacheHit?: boolean;
  queryCount?: number;
}

// Widget 配置類型
export interface SupplierWidgetConfig {
  enableSearch: boolean;
  enableCreate: boolean;
  enableUpdate: boolean;
  enableDelete: boolean;
  maxResults: number;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface WarehouseWidgetConfig {
  showTransferHistory: boolean;
  showWorkLevels: boolean;
  maxHistoryItems: number;
  refreshInterval: number;
  defaultTimeRange: {
    start: Date;
    end: Date;
  };
}

// API 響應類型
export interface SupplierAPIResponse {
  success: boolean;
  data?: SupplierData | SupplierData[];
  error?: string;
  message?: string;
  count?: number;
}

export interface WarehouseAPIResponse {
  success: boolean;
  data?: WarehouseData | WarehouseData[];
  transfers?: WarehouseTransferData[];
  workLevels?: WarehouseWorkLevelData[];
  stats?: TransferStats | WorkLevelStats;
  error?: string;
  message?: string;
}

// Form 驗證類型
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// 類型保護函數
export function isValidSupplierData(data: unknown): data is SupplierData {
  if (!data || typeof data !== 'object') return false;

  const s = data as Record<string, unknown>;
  return typeof s.supplier_code === 'string' && typeof s.supplier_name === 'string';
}

export function isValidWarehouseData(data: unknown): data is WarehouseData {
  if (!data || typeof data !== 'object') return false;

  const w = data as Record<string, unknown>;
  return typeof w.id === 'string' && typeof w.name === 'string' && typeof w.code === 'string';
}

export function isValidTransferData(data: unknown): data is WarehouseTransferData {
  if (!data || typeof data !== 'object') return false;

  const t = data as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.from_warehouse === 'string' &&
    typeof t.to_warehouse === 'string' &&
    typeof t.product_code === 'string' &&
    typeof t.quantity === 'number' &&
    typeof t.status === 'string'
  );
}

// 數據轉換工具
export class SupplierWarehouseMapper {
  static transformSupplierSearchResponse(response: unknown): SupplierData[] {
    if (!response || typeof response !== 'object') return [];

    const r = response as Record<string, unknown>;
    const collection = r.data_supplierCollection as Record<string, unknown>;

    if (!collection || !Array.isArray(collection.edges)) return [];

    return collection.edges
      .filter(
        (edge): edge is { node: Record<string, unknown> } =>
          edge && typeof edge === 'object' && 'node' in edge
      )
      .map(edge => edge.node)
      .filter(isValidSupplierData) as unknown as SupplierData[];
  }

  static transformWarehouseTransfers(transfers: unknown[]): WarehouseTransferData[] {
    return transfers
      .filter(isValidTransferData)
      .sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime());
  }

  static transformWorkLevelData(workLevels: unknown[]): WarehouseWorkLevelData[] {
    return workLevels
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        warehouse: String(item.warehouse || ''),
        hour: String(item.hour || ''),
        work_level: Number(item.work_level || 0),
        efficiency: Number(item.efficiency || 0),
        active_workers: Number(item.active_workers || 0),
        pending_tasks: Number(item.pending_tasks || 0),
      }))
      .filter(item => item.warehouse && item.hour);
  }

  static calculateTransferStats(transfers: WarehouseTransferData[]): TransferStats {
    const total = transfers.length;
    const pending = transfers.filter(t => t.status === 'pending').length;
    const completed = transfers.filter(t => t.status === 'completed').length;
    const cancelled = transfers.filter(t => t.status === 'cancelled').length;

    const completedTransfers = transfers.filter(
      t => t.status === 'completed' && t.completed_date && t.transfer_date
    );

    const averageTime =
      completedTransfers.length > 0
        ? completedTransfers.reduce((sum, t) => {
            const start = new Date(t.transfer_date).getTime();
            const end = new Date(t.completed_date!).getTime();
            return sum + (end - start);
          }, 0) /
          completedTransfers.length /
          (1000 * 60 * 60) // Convert to hours
        : 0;

    return {
      total_transfers: total,
      pending_transfers: pending,
      completed_transfers: completed,
      cancelled_transfers: cancelled,
      average_completion_time: Math.round(averageTime * 100) / 100,
    };
  }

  static calculateWorkLevelStats(workLevels: WarehouseWorkLevelData[]): WorkLevelStats {
    if (workLevels.length === 0) {
      return {
        peak_hour: '',
        peak_level: 0,
        average_level: 0,
        total_efficiency: 0,
        busiest_warehouse: '',
      };
    }

    // Find peak hour
    const hourlyTotals = workLevels.reduce(
      (acc, wl) => {
        acc[wl.hour] = (acc[wl.hour] || 0) + wl.work_level;
        return acc;
      },
      {} as Record<string, number>
    );

    const peakHour = Object.entries(hourlyTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    // Find busiest warehouse
    const warehouseTotals = workLevels.reduce(
      (acc, wl) => {
        acc[wl.warehouse] = (acc[wl.warehouse] || 0) + wl.work_level;
        return acc;
      },
      {} as Record<string, number>
    );

    const busiestWarehouse =
      Object.entries(warehouseTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    return {
      peak_hour: peakHour,
      peak_level: Math.max(...Object.values(hourlyTotals)),
      average_level: workLevels.reduce((sum, wl) => sum + wl.work_level, 0) / workLevels.length,
      total_efficiency: workLevels.reduce((sum, wl) => sum + wl.efficiency, 0) / workLevels.length,
      busiest_warehouse: busiestWarehouse,
    };
  }
}

// 驗證工具
export class SupplierValidator {
  static validateSupplierCode(code: string): FormValidationResult {
    const errors: Record<string, string> = {};

    if (!code.trim()) {
      errors.supplier_code = 'Supplier code is required';
    } else if (code.length < 2) {
      errors.supplier_code = 'Supplier code must be at least 2 characters';
    } else if (code.length > 20) {
      errors.supplier_code = 'Supplier code must be less than 20 characters';
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      errors.supplier_code =
        'Supplier code can only contain letters, numbers, underscore and hyphen';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateSupplierName(name: string): FormValidationResult {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.supplier_name = 'Supplier name is required';
    } else if (name.length < 2) {
      errors.supplier_name = 'Supplier name must be at least 2 characters';
    } else if (name.length > 100) {
      errors.supplier_name = 'Supplier name must be less than 100 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateSupplierForm(data: SupplierUpdateRequest): FormValidationResult {
    const codeValidation = this.validateSupplierCode(data.supplier_code);
    const nameValidation = this.validateSupplierName(data.supplier_name);

    return {
      isValid: codeValidation.isValid && nameValidation.isValid,
      errors: {
        ...codeValidation.errors,
        ...nameValidation.errors,
      },
    };
  }
}

// 預設配置
export const DEFAULT_SUPPLIER_CONFIG: SupplierWidgetConfig = {
  enableSearch: true,
  enableCreate: true,
  enableUpdate: true,
  enableDelete: false,
  maxResults: 50,
  autoRefresh: false,
  refreshInterval: 30000,
};

export const DEFAULT_WAREHOUSE_CONFIG: WarehouseWidgetConfig = {
  showTransferHistory: true,
  showWorkLevels: true,
  maxHistoryItems: 20,
  refreshInterval: 15000,
  defaultTimeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    end: new Date(),
  },
};
