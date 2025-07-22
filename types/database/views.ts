/**
 * 數據庫視圖和複合查詢類型定義
 */

// 庫存摘要視圖
export interface InventorySummary {
  productCode: string;
  productDescription: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  locations: InventoryLocationSummary[];
  lastUpdated: string;
}

export interface InventoryLocationSummary {
  location: string;
  quantity: number;
  lastCountDate?: string;
}

// 訂單進度視圖
export interface OrderProgress {
  orderRef: string;
  productCode: string;
  requiredQty: number;
  completedQty: number;
  pendingQty: number;
  progressPercentage: number;
  estimatedCompletion?: string;
}

// 生產統計視圖
export interface ProductionStats {
  date: string;
  totalPallets: number;
  completedPallets: number;
  qcPassRate: number;
  topProducts: ProductStats[];
  operatorStats: OperatorStats[];
}

export interface ProductStats {
  productCode: string;
  productDescription: string;
  quantity: number;
  palletCount: number;
}

export interface OperatorStats {
  operatorId: number;
  operatorName: string;
  totalPallets: number;
  efficiency: number;
}

// 倉庫統計視圖
export interface WarehouseSummary {
  totalProducts: number;
  totalPallets: number;
  totalQuantity: number;
  locationUtilization: LocationUtilization[];
  stockTurnover: number;
  lowStockAlerts: LowStockAlert[];
}

export interface LocationUtilization {
  location: string;
  capacity: number;
  used: number;
  utilizationRate: number;
}

export interface LowStockAlert {
  productCode: string;
  productDescription: string;
  currentStock: number;
  minimumStock: number;
  severity: 'low' | 'critical';
}

// 轉移統計視圖
export interface TransferSummary {
  date: string;
  totalTransfers: number;
  transfersByLocation: TransferLocationStats[];
  transfersByOperator: TransferOperatorStats[];
  averageTransferTime: number;
}

export interface TransferLocationStats {
  fromLocation: string;
  toLocation: string;
  count: number;
  totalQuantity: number;
}

export interface TransferOperatorStats {
  operatorId: number;
  operatorName: string;
  transferCount: number;
  efficiency: number;
}

// 品質控制統計
export interface QualityControlStats {
  date: string;
  totalInspections: number;
  passCount: number;
  failCount: number;
  passRate: number;
  defectTypes: DefectTypeStats[];
  inspectorStats: InspectorStats[];
}

export interface DefectTypeStats {
  type: string;
  count: number;
  percentage: number;
}

export interface InspectorStats {
  inspectorId: number;
  inspectorName: string;
  inspectionCount: number;
  accuracy: number;
}

// 異常分析視圖
export interface AnomalyDetection {
  type: 'stock_discrepancy' | 'quality_issue' | 'transfer_delay' | 'production_variance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: string[];
  detectedAt: string;
  resolvedAt?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}
