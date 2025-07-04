# 階段 2.2：庫存模組整合

**階段狀態**: ⏳ 計劃中
**預計開始**: 2025-08-11
**預計完成**: 2025-08-25
**預計用時**: 2 週
**前置條件**: 階段 2.1 打印模組整合完成

## 階段概述

庫存模組整合的目標是統一分散的庫存管理功能，包括庫存轉移（stock-transfer）、庫存盤點（stock-count）、棧板監控（pallet-monitor）等，建立統一的庫存操作接口，實施實時庫存同步機制，優化批量操作性能。

## 現狀分析

### 當前庫存功能分布
1. **庫存轉移** (`/stock-transfer`)
   - 鍵盤快捷鍵支持
   - 實時更新功能
   - 批量轉移操作

2. **庫存盤點** (`/admin/stock-count`)
   - 掃碼器整合
   - 批次模式
   - 離線支持需求

3. **棧板監控** (`/admin/pallet-monitor`)
   - 實時數據更新
   - 狀態追蹤
   - 歷史記錄

4. **作廢棧板** (`/void-pallet`)
   - 掃碼器整合
   - 批量作廢
   - 審核流程

### 主要問題
- 功能分散，缺乏統一管理
- 實時同步機制不一致
- 批量操作性能問題
- 缺乏統一的權限控制

## 架構設計

### 統一庫存服務架構
```typescript
// lib/inventory/unified-inventory-service.ts
export class UnifiedInventoryService {
  constructor(
    private dataLayer: GraphQLDataLayer,
    private realtimeService: RealtimeInventoryService,
    private cacheService: InventoryCacheService
  ) {}
  
  // 核心操作
  async transferStock(request: TransferRequest): Promise<TransferResult>
  async countStock(request: CountRequest): Promise<CountResult>
  async voidPallet(request: VoidRequest): Promise<VoidResult>
  async adjustInventory(request: AdjustmentRequest): Promise<AdjustmentResult>
  
  // 查詢操作
  async getInventoryStatus(filter: InventoryFilter): Promise<InventoryStatus[]>
  async getPalletHistory(palletCode: string): Promise<PalletHistory>
  async getLocationInventory(locationId: string): Promise<LocationInventory>
  
  // 實時訂閱
  subscribeToInventoryChanges(callback: InventoryCallback): Unsubscribe
  subscribeToLocationUpdates(locationId: string, callback: LocationCallback): Unsubscribe
}
```

### 統一庫存操作接口
```typescript
// lib/inventory/inventory-operations.ts
export interface InventoryOperations {
  // 移動操作
  move: {
    single(from: Location, to: Location, pallet: string): Promise<MoveResult>
    batch(movements: Movement[]): Promise<BatchMoveResult>
    validate(movement: Movement): ValidationResult
  }
  
  // 盤點操作
  count: {
    start(location: string): Promise<CountSession>
    scan(session: string, pallet: string): Promise<ScanResult>
    complete(session: string): Promise<CountResult>
    reconcile(differences: CountDifference[]): Promise<ReconcileResult>
  }
  
  // 調整操作
  adjust: {
    quantity(pallet: string, newQty: number, reason: string): Promise<AdjustResult>
    status(pallet: string, newStatus: PalletStatus): Promise<StatusResult>
    location(pallet: string, newLocation: string): Promise<LocationResult>
  }
}
```

## 實施計劃

### 第一週：核心服務開發

#### Day 1-2: 統一服務框架
- [ ] 設計統一數據模型
- [ ] 實現 UnifiedInventoryService
- [ ] 整合 GraphQL 數據層
- [ ] 建立緩存策略

#### Day 3-4: 實時同步機制
- [ ] WebSocket 連接管理
- [ ] 實時事件廣播
- [ ] 衝突解決機制
- [ ] 離線同步支持

#### Day 5: 批量操作優化
- [ ] 批量轉移優化
- [ ] 並行處理框架
- [ ] 事務管理
- [ ] 錯誤恢復機制

### 第二週：功能整合和遷移

#### Day 6-7: 庫存轉移整合
- [ ] 遷移現有轉移邏輯
- [ ] 優化鍵盤快捷鍵
- [ ] 增強批量功能
- [ ] 實時狀態更新

#### Day 8-9: 盤點和監控整合
- [ ] 整合盤點功能
- [ ] 優化掃碼流程
- [ ] 整合監控功能
- [ ] 統一報表生成

#### Day 10: 測試和部署
- [ ] 功能測試
- [ ] 性能測試
- [ ] 用戶培訓
- [ ] 生產部署

## 功能規格

### 庫存轉移增強
```typescript
// 智能轉移建議
interface TransferSuggestion {
  fromLocation: string;
  toLocation: string;
  reason: string;
  priority: number;
  estimatedBenefit: number;
}

// 批量轉移優化
class BatchTransferOptimizer {
  // 路徑優化
  optimizeTransferPath(transfers: Transfer[]): OptimizedPath[]
  
  // 分組執行
  groupTransfers(transfers: Transfer[]): TransferGroup[]
  
  // 並行處理
  async executeInParallel(groups: TransferGroup[]): Promise<BatchResult>
}
```

### 智能盤點系統
```typescript
// 盤點模式
enum CountMode {
  FULL = 'full',          // 全面盤點
  CYCLE = 'cycle',        // 循環盤點
  SPOT = 'spot',          // 抽查盤點
  EXCEPTION = 'exception' // 異常盤點
}

// 盤點策略
interface CountStrategy {
  mode: CountMode;
  frequency: CountFrequency;
  coverage: number; // 覆蓋率百分比
  priorityRules: PriorityRule[];
}

// 離線支持
interface OfflineCountSupport {
  // 本地存儲
  saveOfflineData(data: CountData): void
  
  // 同步機制
  syncWhenOnline(): Promise<SyncResult>
  
  // 衝突解決
  resolveConflicts(conflicts: Conflict[]): Resolution[]
}
```

### 實時庫存追蹤
```typescript
// 實時庫存狀態
interface RealtimeInventoryState {
  location: string;
  pallets: Map<string, PalletInfo>;
  lastUpdate: Date;
  pendingChanges: Change[];
}

// 訂閱管理
class InventorySubscriptionManager {
  // 位置訂閱
  subscribeToLocation(locationId: string): Observable<LocationUpdate>
  
  // 產品訂閱
  subscribeToProduct(productCode: string): Observable<ProductUpdate>
  
  // 異常警報
  subscribeToAlerts(): Observable<InventoryAlert>
}
```

## 性能優化

### 優化目標
| 操作 | 當前性能 | 目標性能 | 優化方法 |
|------|----------|----------|----------|
| 單筆轉移 | 2s | < 500ms | 預驗證緩存 |
| 批量轉移(100) | 3分鐘 | < 30s | 並行處理 |
| 盤點掃描 | 1s | < 200ms | 本地緩存 |
| 實時更新延遲 | 500ms | < 100ms | WebSocket 優化 |

### 緩存策略
```typescript
// 多層緩存架構
interface InventoryCacheStrategy {
  // L1: 內存緩存
  memory: {
    ttl: 60, // 秒
    maxSize: 1000 // 記錄數
  };
  
  // L2: IndexedDB
  indexedDB: {
    ttl: 3600, // 1小時
    maxSize: 10000
  };
  
  // L3: Redis
  redis: {
    ttl: 86400, // 24小時
    evictionPolicy: 'LRU'
  };
}
```

## 數據一致性保證

### 事務管理
```typescript
// 分佈式事務
class InventoryTransactionManager {
  // 開始事務
  async beginTransaction(): Promise<Transaction>
  
  // 提交事務
  async commit(transaction: Transaction): Promise<void>
  
  // 回滾事務
  async rollback(transaction: Transaction): Promise<void>
  
  // 兩階段提交
  async twoPhaseCommit(operations: Operation[]): Promise<CommitResult>
}
```

### 衝突解決
```typescript
// 衝突檢測
interface ConflictDetector {
  detectConflicts(local: InventoryState, remote: InventoryState): Conflict[]
  suggestResolution(conflict: Conflict): Resolution
  applyResolution(resolution: Resolution): Promise<void>
}

// 解決策略
enum ResolutionStrategy {
  LAST_WRITE_WINS = 'last-write-wins',
  MANUAL_REVIEW = 'manual-review',
  MERGE = 'merge',
  BUSINESS_RULES = 'business-rules'
}
```

## 監控和分析

### 庫存健康指標
```typescript
interface InventoryHealthMetrics {
  // 準確性指標
  accuracy: {
    systemVsPhysical: number; // 系統與實物符合率
    lastAuditDate: Date;
    discrepancyRate: number;
  };
  
  // 效率指標
  efficiency: {
    turnoverRate: number;
    utilizationRate: number;
    deadStockPercentage: number;
  };
  
  // 操作指標
  operations: {
    transfersPerDay: number;
    averageTransferTime: number;
    errorRate: number;
  };
}
```

### 智能預警系統
```typescript
// 預警規則
interface AlertRule {
  condition: AlertCondition;
  threshold: number;
  action: AlertAction;
  recipients: string[];
}

// 預警類型
enum AlertType {
  LOW_STOCK = 'low-stock',
  EXPIRY_APPROACHING = 'expiry-approaching',
  LOCATION_FULL = 'location-full',
  UNUSUAL_MOVEMENT = 'unusual-movement',
  DISCREPANCY_FOUND = 'discrepancy-found'
}
```

## 用戶界面改進

### 統一操作界面
```typescript
// 庫存操作中心
<InventoryOperationCenter>
  <OperationTabs>
    <Tab id="transfer">庫存轉移</Tab>
    <Tab id="count">庫存盤點</Tab>
    <Tab id="monitor">實時監控</Tab>
    <Tab id="reports">報表分析</Tab>
  </OperationTabs>
  
  <OperationPanel activeTab={activeTab}>
    {renderActiveOperation()}
  </OperationPanel>
  
  <StatusBar>
    <ConnectionStatus />
    <PendingOperations />
    <LastSyncTime />
  </StatusBar>
</InventoryOperationCenter>
```

### 移動端支持
- 響應式設計
- 觸摸優化
- 離線功能
- 掃碼整合

## 測試計劃

### 功能測試
- 庫存轉移流程
- 盤點準確性
- 實時同步
- 離線操作

### 性能測試
- 大批量操作
- 並發用戶測試
- 網絡延遲測試
- 緩存效果測試

### 整合測試
- 與打印模組整合
- 與訂單系統整合
- 與報表系統整合
- 端到端業務流程

## 風險管理

| 風險 | 影響 | 概率 | 緩解措施 |
|------|------|------|----------|
| 數據不一致 | 高 | 中 | 強事務管理，定期審計 |
| 性能下降 | 中 | 低 | 充分測試，漸進遷移 |
| 用戶抵觸 | 中 | 中 | 保持界面熟悉，充分培訓 |
| 系統整合複雜 | 高 | 高 | 分階段實施，保留兼容層 |

---

**階段狀態**: ⏳ 計劃中
**優先級**: 🔴 高
**依賴**: 階段 2.1 完成
**影響範圍**: 核心業務流程
**下一階段**: [階段 2.3 - 訂單模組優化](Re-Structure-2-3.md)