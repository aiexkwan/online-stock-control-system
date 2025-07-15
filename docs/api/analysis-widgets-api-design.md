# 分析圖表 Widgets REST API 設計文檔

## 目錄
1. [API 架構概述](#api-架構概述)
2. [通用設計原則](#通用設計原則)
3. [優先級1 - 已有Fallback需優化](#優先級1---已有fallback需優化)
4. [優先級2 - 低複雜度](#優先級2---低複雜度)
5. [優先級3 - 中複雜度](#優先級3---中複雜度)
6. [通用組件](#通用組件)
7. [實施計劃](#實施計劃)

## API 架構概述

### 基礎路徑
```
/api/v1/analysis/
```

### 通用響應格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}
```

### 通用查詢參數
```typescript
interface BaseQueryParams {
  startDate?: string;  // ISO 8601 format
  endDate?: string;    // ISO 8601 format
  timezone?: string;   // e.g., 'Asia/Hong_Kong'
  format?: 'json' | 'csv';
}
```

## 通用設計原則

### 1. 分頁策略
```typescript
interface PaginationParams {
  page?: number;      // Default: 1
  limit?: number;     // Default: 20, Max: 100
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### 2. 緩存策略
- **Redis緩存**: 所有分析數據默認緩存5分鐘
- **Cache-Control Headers**: 
  - 實時數據: `max-age=60`
  - 歷史數據: `max-age=300`
  - 靜態分析: `max-age=3600`

### 3. 錯誤處理
```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## 優先級1 - 已有Fallback需優化

### 1. ACO Order Progress Cards
**端點**: `GET /api/v1/analysis/aco-order-progress-cards`

#### Query DTO
```typescript
interface AcoOrderProgressCardsQueryDto extends BaseQueryParams {
  status?: 'all' | 'pending' | 'processing' | 'completed';
  groupBy?: 'day' | 'week' | 'month';
  includeDetails?: boolean;
}
```

#### Response DTO
```typescript
interface AcoOrderProgressCardsResponseDto {
  summary: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    completionRate: number;
    averageProcessingTime: number; // in hours
  };
  trends: {
    daily: Array<{
      date: string;
      pending: number;
      processing: number;
      completed: number;
    }>;
  };
  topProducts?: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    percentage: number;
  }>;
}
```

#### 數據庫查詢策略
```sql
-- RPC Function: get_aco_order_progress_summary
CREATE OR REPLACE FUNCTION get_aco_order_progress_summary(
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  total_orders BIGINT,
  pending_orders BIGINT,
  processing_orders BIGINT,
  completed_orders BIGINT,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      AVG(completed_at - created_at) FILTER (WHERE status = 'completed') as avg_time
    FROM record_aco
    WHERE created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT * FROM order_stats;
END;
$$ LANGUAGE plpgsql;
```

#### 緩存策略
- **Key Pattern**: `aco:progress:cards:{startDate}:{endDate}:{status}`
- **TTL**: 5分鐘
- **Invalidation**: 當有新訂單或訂單狀態更新時

### 2. ACO Order Progress Chart
**端點**: `GET /api/v1/analysis/aco-order-progress-chart`

#### Query DTO
```typescript
interface AcoOrderProgressChartQueryDto extends BaseQueryParams {
  interval?: 'hour' | 'day' | 'week' | 'month';
  metrics?: Array<'count' | 'volume' | 'value'>;
  breakdown?: 'status' | 'product' | 'warehouse';
}
```

#### Response DTO
```typescript
interface AcoOrderProgressChartResponseDto {
  chartData: Array<{
    timestamp: string;
    metrics: {
      orderCount: number;
      totalVolume?: number;
      totalValue?: number;
    };
    breakdown?: {
      [key: string]: number;
    };
  }>;
  summary: {
    totalDataPoints: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}
```

## 優先級2 - 低複雜度

### 3. Stock Level History Chart
**端點**: `GET /api/v1/analysis/stock-level-history`

#### Query DTO
```typescript
interface StockLevelHistoryQueryDto extends BaseQueryParams {
  productCodes?: string[];  // Comma-separated
  warehouses?: string[];    // Comma-separated
  interval?: 'hour' | 'day' | 'week';
  aggregation?: 'sum' | 'avg' | 'min' | 'max';
}
```

#### Response DTO
```typescript
interface StockLevelHistoryResponseDto {
  history: Array<{
    timestamp: string;
    totalStock: number;
    breakdown: {
      byProduct?: Record<string, number>;
      byWarehouse?: Record<string, number>;
    };
    changes: {
      inbound: number;
      outbound: number;
      adjustment: number;
    };
  }>;
  products: Array<{
    code: string;
    name: string;
    currentStock: number;
  }>;
}
```

#### RPC Function
```sql
CREATE OR REPLACE FUNCTION get_stock_level_history(
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP,
  p_product_codes TEXT[],
  p_interval TEXT
) RETURNS TABLE (
  time_bucket TIMESTAMP,
  total_stock NUMERIC,
  inbound NUMERIC,
  outbound NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(p_interval, created_at) as time_bucket,
    SUM(current_stock) as total_stock,
    SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) as inbound,
    SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) as outbound
  FROM record_inventory
  WHERE created_at BETWEEN p_start_date AND p_end_date
    AND (p_product_codes IS NULL OR product_code = ANY(p_product_codes))
  GROUP BY time_bucket
  ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql;
```

### 4. Transfer Time Distribution Widget
**端點**: `GET /api/v1/analysis/transfer-time-distribution`

#### Query DTO
```typescript
interface TransferTimeDistributionQueryDto extends BaseQueryParams {
  fromLocation?: string;
  toLocation?: string;
  productCategory?: string;
  bucketSize?: number; // Hours per bucket, default: 24
}
```

#### Response DTO
```typescript
interface TransferTimeDistributionResponseDto {
  distribution: Array<{
    bucket: string;  // e.g., "0-24 hours"
    count: number;
    percentage: number;
    averageTime: number;
  }>;
  statistics: {
    median: number;
    mean: number;
    standardDeviation: number;
    p95: number;
    p99: number;
  };
  outliers: Array<{
    transferId: string;
    duration: number;
    fromLocation: string;
    toLocation: string;
  }>;
}
```

### 5. Void Records Analysis
**端點**: `GET /api/v1/analysis/void-records`

#### Query DTO
```typescript
interface VoidRecordsAnalysisQueryDto extends BaseQueryParams, PaginationParams {
  reason?: string;
  voidedBy?: string;
  minValue?: number;
  groupBy?: 'reason' | 'user' | 'product' | 'date';
}
```

#### Response DTO
```typescript
interface VoidRecordsAnalysisResponseDto {
  summary: {
    totalVoids: number;
    totalValue: number;
    averageValue: number;
    topReason: {
      reason: string;
      count: number;
      percentage: number;
    };
  };
  breakdown: Array<{
    group: string;
    count: number;
    value: number;
    percentage: number;
    items?: Array<{
      id: string;
      timestamp: string;
      reason: string;
      value: number;
    }>;
  }>;
  trends: {
    daily: Array<{
      date: string;
      count: number;
      value: number;
    }>;
  };
  pagination?: PaginationMeta;
}
```

### 6. Stocktake Accuracy Trend
**端點**: `GET /api/v1/analysis/stocktake-accuracy-trend`

#### Query DTO
```typescript
interface StocktakeAccuracyTrendQueryDto extends BaseQueryParams {
  warehouseIds?: string[];
  productCategories?: string[];
  accuracyThreshold?: number; // Percentage, default: 95
  includeDetails?: boolean;
}
```

#### Response DTO
```typescript
interface StocktakeAccuracyTrendResponseDto {
  trends: Array<{
    date: string;
    accuracyRate: number;
    totalCounted: number;
    accurateCount: number;
    discrepancies: {
      overCount: number;
      underCount: number;
      totalVariance: number;
    };
  }>;
  byWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    overallAccuracy: number;
    lastStocktake: string;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  problemProducts?: Array<{
    productCode: string;
    productName: string;
    accuracyRate: number;
    varianceCount: number;
  }>;
}
```

## 優先級3 - 中複雜度

### 7. Top Products By Quantity Widget
**端點**: `GET /api/v1/analysis/top-products-by-quantity`

#### Query DTO
```typescript
interface TopProductsByQuantityQueryDto extends BaseQueryParams {
  limit?: number;  // Default: 10
  category?: string;
  warehouse?: string;
  includeInactive?: boolean;
  metric?: 'quantity' | 'movement' | 'turnover';
}
```

#### Response DTO
```typescript
interface TopProductsByQuantityResponseDto {
  products: Array<{
    rank: number;
    productCode: string;
    productName: string;
    category: string;
    metrics: {
      currentQuantity: number;
      totalMovement: number;
      turnoverRate: number;
      percentageOfTotal: number;
    };
    trend: {
      direction: 'up' | 'down' | 'stable';
      changePercentage: number;
    };
  }>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    averageTurnover: number;
  };
}
```

### 8. Top Products Distribution Widget
**端點**: `GET /api/v1/analysis/top-products-distribution`

#### Query DTO
```typescript
interface TopProductsDistributionQueryDto extends BaseQueryParams {
  limit?: number;
  groupBy?: 'category' | 'supplier' | 'warehouse';
  includeSubGroups?: boolean;
}
```

#### Response DTO
```typescript
interface TopProductsDistributionResponseDto {
  distribution: Array<{
    group: string;
    count: number;
    quantity: number;
    value: number;
    percentage: number;
    subGroups?: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  }>;
  visualization: {
    type: 'pie' | 'treemap' | 'sunburst';
    data: any; // Chart-specific data format
  };
}
```

### 9. Warehouse Work Level Area Chart
**端點**: `GET /api/v1/analysis/warehouse-work-level`

#### Query DTO
```typescript
interface WarehouseWorkLevelQueryDto extends BaseQueryParams {
  warehouseIds?: string[];
  interval?: 'hour' | 'day' | 'week';
  metrics?: Array<'inbound' | 'outbound' | 'picking' | 'packing'>;
  shift?: 'all' | 'morning' | 'afternoon' | 'night';
}
```

#### Response DTO
```typescript
interface WarehouseWorkLevelResponseDto {
  workLevels: Array<{
    timestamp: string;
    warehouses: Record<string, {
      inbound: number;
      outbound: number;
      picking: number;
      packing: number;
      totalOperations: number;
      efficiency: number;
    }>;
  }>;
  peaks: {
    daily: Array<{
      hour: number;
      averageOperations: number;
    }>;
    weekly: Array<{
      dayOfWeek: number;
      averageOperations: number;
    }>;
  };
  efficiency: {
    overall: number;
    byWarehouse: Record<string, number>;
    trend: 'improving' | 'stable' | 'declining';
  };
}
```

### 10. Top Products Inventory Chart
**端點**: `GET /api/v1/analysis/top-products-inventory`

#### Query DTO
```typescript
interface TopProductsInventoryQueryDto extends BaseQueryParams {
  limit?: number;
  sortBy?: 'value' | 'quantity' | 'turnover' | 'demand';
  includeForecasts?: boolean;
  warehouseIds?: string[];
}
```

#### Response DTO
```typescript
interface TopProductsInventoryResponseDto {
  products: Array<{
    productCode: string;
    productName: string;
    inventory: {
      currentStock: number;
      availableStock: number;
      reservedStock: number;
      inTransit: number;
      value: number;
    };
    metrics: {
      turnoverRate: number;
      daysOfSupply: number;
      stockoutRisk: 'low' | 'medium' | 'high';
    };
    forecast?: {
      nextWeekDemand: number;
      nextMonthDemand: number;
      reorderPoint: number;
      suggestedOrderQuantity: number;
    };
    locations: Array<{
      warehouseId: string;
      warehouseName: string;
      quantity: number;
      percentage: number;
    }>;
  }>;
  summary: {
    totalValue: number;
    totalQuantity: number;
    averageTurnover: number;
    criticalItems: number;
  };
}
```

### 11. Real Time Inventory Map
**端點**: `GET /api/v1/analysis/real-time-inventory-map`

#### Query DTO
```typescript
interface RealTimeInventoryMapQueryDto {
  warehouseId: string;
  floor?: number;
  zone?: string;
  productFilter?: string;
  heatmapMetric?: 'quantity' | 'value' | 'movement' | 'age';
  refreshInterval?: number; // seconds
}
```

#### Response DTO
```typescript
interface RealTimeInventoryMapResponseDto {
  warehouse: {
    id: string;
    name: string;
    floors: number;
    zones: Array<{
      id: string;
      name: string;
      type: 'storage' | 'picking' | 'staging' | 'shipping';
    }>;
  };
  locations: Array<{
    id: string;
    code: string;
    zone: string;
    coordinates: {
      x: number;
      y: number;
      z: number;
    };
    inventory: {
      isEmpty: boolean;
      products: Array<{
        productCode: string;
        quantity: number;
        lastMovement: string;
        age: number; // days
      }>;
    };
    metrics: {
      utilization: number;  // percentage
      value: number;
      heatmapValue: number;
    };
  }>;
  statistics: {
    totalLocations: number;
    occupiedLocations: number;
    utilizationRate: number;
    hotspots: Array<{
      locationId: string;
      reason: string;
      value: number;
    }>;
  };
  lastUpdate: string;
}
```

## 通用組件

### 批量查詢端點
**端點**: `POST /api/v1/analysis/batch`

#### Request DTO
```typescript
interface BatchAnalysisRequestDto {
  queries: Array<{
    id: string;
    endpoint: string;
    params: any;
  }>;
  parallel?: boolean;
  timeout?: number; // milliseconds
}
```

#### Response DTO
```typescript
interface BatchAnalysisResponseDto {
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
    error?: any;
    executionTime: number;
  }>;
  summary: {
    totalQueries: number;
    successCount: number;
    failureCount: number;
    totalExecutionTime: number;
  };
}
```

### 數據導出端點
**端點**: `POST /api/v1/analysis/export`

#### Request DTO
```typescript
interface ExportAnalysisRequestDto {
  endpoint: string;
  params: any;
  format: 'csv' | 'excel' | 'pdf';
  options?: {
    includeCharts?: boolean;
    timezone?: string;
    locale?: string;
  };
}
```

## 實施計劃

### Phase 1: 基礎架構 (第1週)
1. 建立 NestJS 分析模組
2. 實現通用 DTOs 和 Validators
3. 設置 Redis 緩存層
4. 建立錯誤處理框架

### Phase 2: 優先級1 APIs (第2週)
1. 實現 ACO Order Progress 相關端點
2. 創建對應的 RPC 函數
3. 優化現有 fallback 邏輯
4. 性能測試和調優

### Phase 3: 優先級2 APIs (第3週)
1. 實現低複雜度分析端點
2. 建立數據聚合 pipelines
3. 實施緩存策略
4. 添加監控和日誌

### Phase 4: 優先級3 APIs (第4週)
1. 實現中複雜度分析端點
2. 優化實時數據處理
3. 建立 WebSocket 支持
4. 完成批量查詢功能

### Phase 5: 優化和測試 (第5週)
1. 性能優化和壓力測試
2. 安全審計
3. 文檔完善
4. 部署準備

## 性能目標
- **響應時間**: P95 < 200ms (緩存命中), P95 < 1s (緩存未命中)
- **吞吐量**: 支持每秒 1000+ 請求
- **可用性**: 99.9% uptime
- **數據新鮮度**: 實時數據延遲 < 1分鐘

## 安全考慮
1. **認證**: JWT token 驗證
2. **授權**: 基於角色的訪問控制
3. **限流**: 每用戶每分鐘 100 請求
4. **數據過濾**: 基於用戶權限過濾敏感數據
5. **審計日誌**: 記錄所有 API 訪問

## 監控指標
1. **API 性能**: 響應時間、錯誤率、吞吐量
2. **緩存效率**: 命中率、過期率、內存使用
3. **數據庫性能**: 查詢時間、連接池使用率
4. **業務指標**: 最常用端點、數據訪問模式