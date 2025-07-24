# SearchCard Comprehensive Analysis Report

> 📋 **Report Type**: SearchCard Implementation Preparation  
> 📅 **Date**: 2025-07-24  
> 🎯 **Status**: Analysis Complete - Ready for Implementation  
> 👥 **Stakeholders**: 16 Expert Team + Development Team  

## 執行摘要

SearchCard將成為NewPennine WMS系統的統一搜尋入口，整合現有分散的搜索功能於單一、高效能的卡片組件中。基於對1,672個搜索相關文件的綜合分析，我們識別出完整的搜索需求並制定了統一架構方案。

## 1. 現有搜索功能分析

### 1.1 核心搜索組件分析

#### **UnifiedSearch Component** (`/components/ui/unified-search.tsx`)
- **功能範圍**: 產品和托盤搜索
- **特色功能**:
  - 智能搜索類型自動檢測 (series vs pallet_num)
  - QR/條碼掃描整合
  - 產品下拉式即時篩選
  - 類型特定搜索處理
  - 搜索狀態持久化

#### **QuickSearch Component** (`/app/(app)/admin/components/QuickSearch/index.tsx`)
- **功能範圍**: 管理介面庫存查詢
- **特色功能**:
  - 產品代碼特定搜索
  - 位置分布顯示 (injection, pipeline, await, fold, bulk等)
  - 即時庫存統計
  - `useInventorySearch` Hook整合

#### **Pallet Search Utils** (`/app/utils/palletSearchUtils.ts`)
- **功能範圍**: 托盤搜索邏輯和驗證
- **核心功能**:
  - 25種預定義搜索模式
  - 智能類型檢測算法
  - QR碼解析邏輯
  - 搜索建議生成
  - 格式驗證和標準化

### 1.2 搜索模式分析

#### **Series搜索模式**:
```javascript
// 標準系列模式
/^[A-Z]{2,3}-\d{6}$/           // PM-240615, PT-240615
/^[A-Z]{2,3}-\d{4}-\d{6}$/     // PM-2024-060615
/^[A-Z]+-[A-Z0-9]+$/           // ACO-FEB24
/^[\w]+-[\w]+$/                // 通用系列模式
/^[A-Z0-9]{12}$/               // 12位英數混合 (舊系統)
```

#### **Pallet搜索模式**:
```javascript
// 托盤編號模式
/^\d{6}\/\d{1,3}$/             // 240615/1, 240615/12
/^\d{6}-\d{1,3}$/              // 240615-1 (替代格式)
/^PLT-\d{6}\/\d{1,3}$/         // PLT-240615/1 (前綴格式)
```

### 1.3 E2E測試需求分析

基於 `e2e/inventory/inventory-search.spec.ts` 的190行測試代碼，識別出以下核心需求：

1. **搜索介面要求**:
   - 搜索輸入框、搜索按鈕、類型選擇器
   - Series和Pallet Number選項支援
   - 輸入驗證和錯誤處理

2. **搜索功能要求**:
   - 托盤編號搜索 (`240615/1`)
   - 系列號搜索 (`PM-240615`)
   - 空結果處理和無結果訊息
   - 搜索結果導出功能

3. **高級功能要求**:
   - 庫存轉移操作整合
   - 數量驗證和庫存檢查
   - 併發搜索處理
   - 條碼掃描支援
   - 搜索狀態持久化

## 2. 資料庫實體搜索分析

### 2.1 主要可搜索實體 (基於76個數據庫表格)

#### **產品相關** (4個核心表格):
- **`data_code`** - 產品主表
  - **搜索欄位**: `code` (SKU), `description`, `colour`, `type`, `remark`
  - **索引需求**: 全文搜索索引 on `description`, `remark`
  - **關聯搜索**: 連接至pallets, inventory, orders

- **`data_slateinfo`** - 磚板產品詳細規格
  - **搜索欄位**: `product_code`, `description`, `tool_num`, `colour`, `shapes`
  - **高級搜索**: 按尺寸、重量、厚度範圍搜索

#### **托盤管理** (3個核心表格):
- **`record_palletinfo`** - 托盤參考資料
  - **搜索欄位**: `plt_num` (主鍵), `product_code`, `series`, `plt_remark`
  - **模式搜索**: 支援複雜托盤號碼模式匹配
  - **關聯搜索**: 產品信息、庫存位置、歷史記錄

- **`pallet_number_buffer`** - 托盤編號緩衝區
  - **搜索欄位**: `pallet_number`, `series`, `date_str`
  - **狀態搜索**: 按使用狀態 (False/Holded/True) 過濾

#### **庫存管理** (2個核心表格):
- **`record_inventory`** - 庫存分類帳
  - **搜索欄位**: `product_code`, `plt_num`
  - **位置搜索**: 8個庫存位置 (injection, pipeline, prebook, await, fold, bulk, backcarpark, damage, await_grn)
  - **數量搜索**: 按庫存量範圍搜索

- **`stock_level`** - 產品總庫存統計
  - **搜索欄位**: `stock` (產品編號), `description`
  - **數量搜索**: 按總庫存量搜索

#### **訂單管理** (3個核心表格):
- **`record_aco`** - ACO訂單資料
  - **搜索欄位**: `order_ref`, `code` (產品編號)
  - **數量搜索**: `required_qty`, `finished_qty`
  - **進度搜索**: 按訂單完成狀態

- **`data_order`** - 客戶訂單管理
  - **搜索欄位**: `account_num`, `order_ref`, `customer_ref`, `product_code`, `product_desc`
  - **客戶搜索**: 按客戶帳號、發票地址、交付地址

#### **物料接收** (2個核心表格):
- **`record_grn`** - 材料接收詳細資料
  - **搜索欄位**: `grn_ref`, `plt_num`, `sup_code`, `material_code`
  - **重量搜索**: `gross_weight`, `net_weight`
  - **供應商搜索**: 關聯 `data_supplier`

#### **用戶管理** (1個核心表格):
- **`data_id`** - 用戶ID資料庫
  - **搜索欄位**: `id` (員工編號), `name`, `email`, `department`, `position`
  - **組織搜索**: 按部門、職位搜索

#### **歷史記錄** (3個核心表格):
- **`record_history`** - 操作歷史記錄
  - **搜索欄位**: `action`, `plt_num`, `loc`, `remark`
  - **時間搜索**: 按操作時間範圍
  - **操作員搜索**: 關聯用戶信息

- **`record_transfer`** - 庫存轉移分類帳
  - **搜索欄位**: `f_loc`, `t_loc`, `plt_num`, `operator_id`
  - **位置搜索**: 起始和目標位置搜索

### 2.2 搜索複雜度分析

#### **簡單搜索** (1-2個表格聯查):
- 產品代碼搜索
- 托盤編號搜索
- 用戶姓名搜索

#### **中等複雜度搜索** (3-5個表格聯查):
- 產品庫存跨位置搜索
- 訂單狀態追蹤搜索
- 供應商材料搜索

#### **高複雜度搜索** (5+個表格聯查):
- 全系統跨實體搜索
- 歷史追蹤關聯搜索
- 多維度分析搜索

## 3. GraphQL搜索模式分析

### 3.1 現有GraphQL查詢模式

#### **過濾器模式**:
```graphql
# 現有過濾器結構
input FilterInput {
  field: String!
  operator: FilterOperator!
  value: JSON!
}

enum FilterOperator {
  EQ, NEQ, GT, GTE, LT, LTE
  IN, NOT_IN, CONTAINS, NOT_CONTAINS
  BETWEEN, IS_NULL, IS_NOT_NULL
}
```

#### **分頁和排序**:
```graphql
input PaginationInput {
  page: Int = 1
  limit: Int = 20
  offset: Int
}

input SortInput {
  field: String!
  direction: SortDirection!
}
```

#### **現有搜索查詢示例**:
```graphql
# 產品搜索
products(filter: ProductFilterInput, pagination: PaginationInput, sort: SortInput): ProductConnection!
searchProducts(query: String!, limit: Int = 10): [Product!]!

# 托盤搜索
pallets(filter: PalletFilterInput, pagination: PaginationInput, sort: SortInput): PalletConnection!
```

### 3.2 搜索性能考量

#### **現有優化機制**:
- **查詢緩存**: `@cache(ttl: 300, scope: USER)`
- **速率限制**: `@rateLimit(max: 100, window: "1m")`
- **權限控制**: `@auth(requires: VIEWER)`
- **批量查詢**: `batchWidgetData`, `batchListCardData`

## 4. 搜索需求統整

### 4.1 核心搜索實體優先級

#### **Tier 1 - 核心業務實體** (即時搜索):
1. **Products** - 產品搜索 (SKU, 描述, 規格)
2. **Pallets** - 托盤搜索 (編號, 系列, 狀態)
3. **Inventory** - 庫存搜索 (位置, 數量, 可用性)
4. **Orders** - 訂單搜索 (編號, 客戶, 狀態)

#### **Tier 2 - 重要支援實體** (快速搜索):
5. **GRN Records** - 物料接收搜索
6. **Users** - 用戶/員工搜索
7. **Suppliers** - 供應商搜索

#### **Tier 3 - 歷史和分析實體** (標準搜索):
8. **History** - 操作歷史搜索
9. **Transfers** - 轉移記錄搜索
10. **Files** - 文檔和配置搜索

### 4.2 搜索模式需求

#### **全域搜索** (Global Search):
- 跨所有實體的統一搜索介面
- 智能結果分類和排序
- 搜索結果高亮和相關性評分

#### **實體特定搜索** (Entity-Specific Search):
- 每個實體的專用搜索過濾器
- 高級搜索表單與欄位
- 實體間關聯搜索

#### **智能搜索** (Smart Search):
- 自動完成和搜索建議
- 搜索歷史和偏好
- 模糊匹配和容錯搜索

### 4.3 性能需求

#### **響應時間目標**:
- **即時搜索** (<100ms): 自動完成、建議
- **快速搜索** (<500ms): 簡單實體搜索
- **標準搜索** (<2s): 複雜關聯查詢
- **重量級搜索** (<10s): 全文搜索、分析查詢

#### **搜索索引策略**:
- **PostgreSQL全文搜索**: 產品描述、備註欄位
- **複合索引**: 常見搜索欄位組合
- **部分索引**: 按狀態、日期範圍
- **GIN索引**: JSONB欄位搜索

## 5. 建議架構設計

### 5.1 SearchCard組件架構

```typescript
interface SearchCardProps {
  // 搜索配置
  searchMode: 'global' | 'entity' | 'mixed'
  enabledEntities: SearchableEntity[]
  defaultEntity?: SearchableEntity
  
  // 界面配置
  layout: 'compact' | 'full' | 'modal'
  showAdvancedFilters: boolean
  enableSavedSearches: boolean
  
  // 功能配置
  enableBarcodeScan: boolean
  enableExport: boolean
  enableRealTimeSearch: boolean
  
  // 回調函數
  onSearchResult: (results: SearchResult[]) => void
  onEntitySelect: (entity: SearchableEntity, result: any) => void
}
```

### 5.2 GraphQL搜索架構

#### **統一搜索入口**:
```graphql
type Query {
  # 全域搜索
  globalSearch(
    query: String!
    entities: [SearchableEntity!]
    filters: GlobalSearchFilters
    pagination: PaginationInput
    options: SearchOptions
  ): GlobalSearchResult!
  
  # 實體搜索
  entitySearch(
    entity: SearchableEntity!
    query: String!
    filters: EntityFilters
    pagination: PaginationInput
    sort: SortInput
  ): EntitySearchResult!
  
  # 搜索建議
  searchSuggestions(
    query: String!
    entity: SearchableEntity
    limit: Int = 10
  ): [SearchSuggestion!]!
  
  # 搜索歷史
  searchHistory(
    userId: ID
    limit: Int = 20
  ): [SearchHistoryItem!]!
}
```

### 5.3 搜索結果結構

```graphql
union SearchResultUnion = 
  ProductSearchResult | 
  PalletSearchResult | 
  InventorySearchResult | 
  OrderSearchResult |
  UserSearchResult |
  GRNSearchResult |
  HistorySearchResult

type GlobalSearchResult {
  query: String!
  totalResults: Int!
  executionTime: Float!
  results: [SearchResultGroup!]!
  suggestions: [String!]!
  facets: [SearchFacet!]!
}

type SearchResultGroup {
  entity: SearchableEntity!
  count: Int!
  results: [SearchResultUnion!]!
  hasMore: Boolean!
}
```

## 6. 實施建議

### 6.1 階段性開發計劃

#### **階段 1: 基礎搜索 (Week 1-2)**
- SearchCard組件骨架
- 產品和托盤搜索整合
- 基本GraphQL查詢實現
- 簡單UI和狀態管理

#### **階段 2: 擴展實體 (Week 3-4)**
- 庫存、訂單、用戶搜索
- 高級過濾器實現
- 搜索結果優化
- 性能調優和緩存

#### **階段 3: 智能功能 (Week 5-6)**
- 全域搜索實現
- 搜索建議和自動完成
- 搜索歷史和偏好
- 條碼掃描整合

#### **階段 4: 高級功能 (Week 7-8)**
- 搜索分析和報告
- 導出和保存功能
- 實時搜索更新
- 全面測試和優化

### 6.2 技術選擇建議

#### **前端技術**:
- **React + TypeScript**: 類型安全和組件化
- **Apollo Client**: GraphQL狀態管理
- **Framer Motion**: 動畫效果
- **React Hook Form**: 表單處理
- **Fuse.js**: 客戶端模糊搜索

#### **後端技術**:
- **PostgreSQL全文搜索**: `tsvector`, `tsquery`
- **GraphQL DataLoader**: 批量查詢優化
- **Redis**: 搜索結果緩存
- **Elasticsearch** (可選): 高級全文搜索

### 6.3 性能優化策略

#### **查詢優化**:
- 搜索查詢預編譯和緩存
- 分頁和虛擬滾動
- 結果預加載和背景更新
- 查詢合併和批量處理

#### **用戶體驗優化**:
- 即時搜索和防抖動
- 搜索結果高亮
- 載入狀態和錯誤處理
- 鍵盤導航支援

## 結論

SearchCard將成為NewPennine WMS系統搜索功能的統一入口，整合現有的UnifiedSearch、QuickSearch和PalletSearchUtils功能，並擴展至全系統76個數據表格的搜索能力。

**關鍵成功因素**:
1. **統一性**: 單一搜索介面提升用戶體驗
2. **性能**: 優化的查詢和索引策略確保快速響應
3. **擴展性**: 模組化設計支持未來功能擴展
4. **易用性**: 智能搜索和建議提升工作效率

**預期效益**:
- **用戶體驗提升**: 統一搜索介面，減少學習成本
- **操作效率提升**: 智能搜索和建議，縮短查找時間
- **系統維護簡化**: 統一架構減少代碼重複
- **數據洞察增強**: 搜索分析提供業務洞察

此分析為SearchCard實施提供了完整的技術基礎和實施路線圖，確保項目成功交付並滿足NewPennine WMS系統的搜索需求。