// Dashboard 相關類型定義

export interface DashboardDateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DashboardBatchQueryData {
  // 基礎統計數據
  statsCard?: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    averageStockLevel: number;
  };
  
  // 庫存相關數據
  stockDistribution?: {
    warehouseData: Array<{
      warehouse: string;
      quantity: number;
      percentage: number;
    }>;
    totalQuantity: number;
  };
  
  stockLevelHistory?: {
    history: Array<{
      date: string;
      totalStock: number;
      changeFromPrevious: number;
    }>;
  };
  
  topProducts?: {
    products: Array<{
      productCode: string;
      productName: string;
      quantity: number;
      percentage: number;
    }>;
  };
  
  // 訂單相關數據
  acoOrderProgress?: {
    states: Array<{
      state: string;
      count: number;
      percentage: number;
    }>;
    totalOrders: number;
  };
  
  ordersList?: {
    orders: Array<{
      id: string;
      orderNumber: string;
      customer: string;
      status: string;
      date: string;
      items: number;
    }>;
    totalCount: number;
  };
  
  // 生產相關數據
  injectionProductionStats?: {
    todayProduction: number;
    weeklyAverage: number;
    monthlyTotal: number;
    efficiency: number;
  };
  
  productionDetails?: {
    lines: Array<{
      lineId: string;
      lineName: string;
      currentProduct: string;
      quantity: number;
      status: 'running' | 'stopped' | 'maintenance';
    }>;
  };
  
  staffWorkload?: {
    staff: Array<{
      staffId: string;
      name: string;
      completedTasks: number;
      pendingTasks: number;
      efficiency: number;
    }>;
  };
  
  // 倉庫相關數據
  warehouseTransferList?: {
    transfers: Array<{
      id: string;
      fromLocation: string;
      toLocation: string;
      quantity: number;
      status: string;
      date: string;
    }>;
    pendingCount: number;
    completedCount: number;
  };
  
  warehouseWorkLevel?: {
    workLevels: Array<{
      hour: number;
      inbound: number;
      outbound: number;
      transfers: number;
    }>;
    peakHour: number;
    averageActivity: number;
  };
  
  // GRN 相關數據
  grnReport?: {
    recentGrns: Array<{
      id: string;
      supplierName: string;
      date: string;
      itemsCount: number;
      status: string;
    }>;
    pendingCount: number;
    completedToday: number;
  };
  
  // 其他數據
  availableSoon?: {
    items: Array<{
      productCode: string;
      productName: string;
      expectedDate: string;
      quantity: number;
      supplier: string;
    }>;
    totalExpected: number;
  };
  
  awaitLocationQty?: {
    records: Array<{
      location: string;
      quantity: number;
    }>;
    value: number;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    // Legacy fields for compatibility
    locations?: Array<{
      location: string;
      quantity: number;
      lastUpdated: string;
    }>;
    totalAwaitingQty?: number;
  };
  
  historyTree?: {
    nodes: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      user: string;
      children?: string[];
    }>;
  };
  
  yesterdayTransferCount?: {
    count: number;
    trend: number;
    dateRange: {
      start: string;
      end: string;
    };
    optimized?: boolean;
  };
  
  // 可以根據需要擴展更多 widget 數據類型
  [key: string]: any; // 允許動態添加新的 widget 數據
}

export interface DashboardBatchQueryError extends Error {
  type: 'batch' | 'widget';
  message: string;
  widgetId?: string;
  details?: any;
  timestamp: Date;
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  enabled: boolean;
  refreshInterval?: number;
  dependencies?: string[]; // 依賴其他 widget 的數據
}

export interface DashboardBatchQueryOptions {
  dateRange: DashboardDateRange;
  enabledWidgets?: string[];
  batchSize?: number;
  timeout?: number;
}