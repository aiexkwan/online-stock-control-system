/**
 * SearchCard GraphQL Schema
 * 統一搜索卡片的 GraphQL 類型定義
 * 支援全域搜索、實體特定搜索、智能建議和搜索分析
 */

export const searchSchema = `
# ================================
# SearchCard 核心類型定義
# ================================

# 可搜索的實體類型
enum SearchableEntity {
  PRODUCT           # 產品 (data_code)
  PALLET           # 托盤 (record_palletinfo)
  INVENTORY        # 庫存 (record_inventory)
  ORDER            # 訂單 (record_aco, data_order)
  GRN              # 物料接收 (record_grn)
  USER             # 用戶 (data_id)
  SUPPLIER         # 供應商 (data_supplier)
  HISTORY          # 歷史記錄 (record_history)
  TRANSFER         # 轉移記錄 (record_transfer)
  FILE             # 文件記錄 (doc_upload)
}

# 搜索模式
enum SearchMode {
  GLOBAL           # 全域搜索
  ENTITY           # 實體特定搜索
  MIXED            # 混合搜索
  SUGGESTION       # 建議搜索
}

# 搜索類型
enum SearchType {
  TEXT             # 文字搜索
  CODE             # 代碼搜索 (SKU, 托盤號等)
  BARCODE          # 條碼搜索
  ADVANCED         # 高級搜索
  FUZZY            # 模糊搜索
  EXACT            # 精確搜索
}

# 搜索結果排序選項
enum SearchSortField {
  RELEVANCE        # 相關性
  NAME             # 名稱
  CODE             # 代碼
  DATE_CREATED     # 創建日期
  DATE_UPDATED     # 更新日期
  QUANTITY         # 數量
  STATUS           # 狀態
}

# ================================
# SearchCard 輸入類型
# ================================

# SearchCard 主要輸入
input SearchCardInput {
  # 搜索配置
  query: String!                    # 搜索查詢字串
  mode: SearchMode!                 # 搜索模式
  type: SearchType = TEXT           # 搜索類型
  entities: [SearchableEntity!]     # 要搜索的實體列表
  
  # 過濾器
  filters: SearchFilters            # 搜索過濾器
  dateRange: DateRangeInput         # 日期範圍
  
  # 分頁和排序
  pagination: PaginationInput       # 分頁參數
  sort: SearchSortInput            # 排序參數
  
  # 搜索選項
  options: SearchOptions           # 搜索選項
}

# 搜索過濾器
input SearchFilters {
  # 通用過濾器
  status: [String!]                # 狀態過濾
  category: [String!]              # 分類過濾
  location: [LocationType!]        # 位置過濾
  
  # 數量範圍
  quantityRange: QuantityRangeInput
  
  # 實體特定過濾器
  productFilters: ProductSearchFilters
  palletFilters: PalletSearchFilters
  inventoryFilters: InventorySearchFilters
  orderFilters: OrderSearchFilters
  userFilters: UserSearchFilters
}

# 產品搜索過濾器
input ProductSearchFilters {
  productCodes: [String!]          # 產品代碼列表
  colours: [String!]               # 顏色過濾
  types: [String!]                # 類型過濾
  hasInventory: Boolean            # 是否有庫存
  isActive: Boolean               # 是否啟用
}

# 托盤搜索過濾器
input PalletSearchFilters {
  series: [String!]               # 系列過濾
  palletNumbers: [String!]        # 托盤編號列表
  hasStock: Boolean              # 是否有庫存
  productCodes: [String!]        # 關聯產品代碼
}

# 庫存搜索過濾器
input InventorySearchFilters {
  locations: [LocationType!]      # 庫存位置
  hasStock: Boolean              # 是否有庫存
  quantityRange: QuantityRangeInput # 數量範圍
}

# 訂單搜索過濾器
input OrderSearchFilters {
  orderStatus: [OrderStatus!]     # 訂單狀態
  customerCodes: [String!]        # 客戶代碼
  isUrgent: Boolean              # 是否緊急
  completionRange: CompletionRangeInput # 完成度範圍
}

# 用戶搜索過濾器
input UserSearchFilters {
  departments: [String!]          # 部門過濾
  positions: [String!]           # 職位過濾
  isActive: Boolean             # 是否啟用
}

# 數量範圍輸入
input QuantityRangeInput {
  min: Float                     # 最小值
  max: Float                     # 最大值
  unit: String                   # 單位
}

# 完成度範圍輸入
input CompletionRangeInput {
  min: Float                     # 最小完成度 (0-100)
  max: Float                     # 最大完成度 (0-100)
}

# 搜索排序輸入
input SearchSortInput {
  field: SearchSortField!         # 排序欄位
  direction: SortDirection!       # 排序方向
  secondary: SearchSortInput      # 次要排序
}

# 搜索選項
input SearchOptions {
  # 性能選項
  enableFuzzySearch: Boolean = true     # 啟用模糊搜索
  enableHighlight: Boolean = true       # 啟用結果高亮
  maxResults: Int = 100                # 最大結果數
  timeoutMs: Int = 5000               # 搜索超時 (毫秒)
  
  # 功能選項
  includeSuggestions: Boolean = true    # 包含搜索建議
  includeAnalytics: Boolean = false     # 包含搜索分析
  includeHistory: Boolean = false       # 包含搜索歷史
  saveToHistory: Boolean = true         # 保存到搜索歷史
  
  # 結果選項
  groupByEntity: Boolean = true         # 按實體分組結果
  includeMetadata: Boolean = true       # 包含元數據
  includeRelated: Boolean = false       # 包含關聯項目
}

# ================================
# SearchCard 輸出類型
# ================================

# SearchCard主要輸出
type SearchCardData {
  # 搜索元信息
  searchMeta: SearchMetadata!      # 搜索元數據
  
  # 搜索結果
  results: SearchResultCollection! # 搜索結果集合
  
  # 搜索建議
  suggestions: [SearchSuggestion!]! # 搜索建議
  
  # 搜索分析
  analytics: SearchAnalytics       # 搜索分析數據
  
  # 搜索歷史
  history: [SearchHistoryItem!]    # 相關搜索歷史
}

# 搜索元數據
type SearchMetadata {
  query: String!                   # 原始查詢
  processedQuery: String!          # 處理後查詢
  searchMode: SearchMode!          # 搜索模式
  searchType: SearchType!          # 搜索類型
  entities: [SearchableEntity!]!   # 搜索實體
  totalResults: Int!               # 總結果數
  searchTime: Float!               # 搜索時間 (毫秒)
  facets: [SearchFacet!]!         # 搜索面向
  hasMore: Boolean!               # 是否有更多結果
}

# 搜索結果集合
type SearchResultCollection {
  # 分組結果
  groups: [SearchResultGroup!]!   # 按實體分組的結果
  
  # 統一結果列表
  items: [SearchResultItem!]!     # 所有結果項目
  
  # 分頁信息
  pageInfo: PageInfo!             # 分頁信息
}

# 搜索結果分組
type SearchResultGroup {
  entity: SearchableEntity!        # 實體類型
  count: Int!                     # 結果數量
  items: [SearchResultItem!]!     # 結果項目
  hasMore: Boolean!               # 是否有更多
  relevanceScore: Float!          # 相關性分數
}

# 搜索結果項目
type SearchResultItem {
  # 基本信息
  id: ID!                         # 唯一標識符  
  entity: SearchableEntity!        # 實體類型
  title: String!                  # 標題
  subtitle: String                # 副標題
  description: String             # 描述
  
  # 搜索相關
  relevanceScore: Float!          # 相關性分數
  highlights: [TextHighlight!]!   # 高亮文本
  matchedFields: [String!]!       # 匹配欄位
  
  # 實體數據
  data: SearchResultData!         # 實體特定數據
  
  # 元數據
  metadata: SearchResultMetadata  # 結果元數據
  
  # 操作
  actions: [SearchResultAction!]! # 可執行操作
}

# 文本高亮
type TextHighlight {
  field: String!                  # 欄位名稱
  text: String!                   # 高亮文本
  positions: [HighlightPosition!]! # 高亮位置
}

# 高亮位置
type HighlightPosition {
  start: Int!                     # 開始位置
  end: Int!                       # 結束位置
  score: Float!                   # 匹配分數
}

# 搜索結果數據聯合類型
union SearchResultData = 
  ProductSearchResult |
  PalletSearchResult |
  InventorySearchResult |
  OrderSearchResult |
  GRNSearchResult |
  UserSearchResult |
  SupplierSearchResult |
  HistorySearchResult |
  TransferSearchResult |
  FileSearchResult

# 產品搜索結果
type ProductSearchResult {
  code: String!                   # 產品代碼
  description: String!            # 產品描述
  colour: String                  # 顏色
  type: String                    # 類型
  standardQty: Float              # 標準數量
  remark: String                  # 備註
  
  # 關聯數據
  inventory: InventorySummary     # 庫存摘要
  pallets: PalletSummary         # 托盤摘要
  orders: OrderSummary           # 訂單摘要
  
  # 統計信息
  totalStock: Float!              # 總庫存
  totalPallets: Int!             # 總托盤數
  lastUpdated: DateTime!         # 最後更新時間
}

# 托盤搜索結果
type PalletSearchResult {
  pltNum: String!                 # 托盤編號
  series: String                  # 系列
  productCode: String!            # 產品代碼
  productQty: Float!             # 產品數量
  generateTime: DateTime!         # 生成時間
  remark: String                  # 備註
  
  # 關聯數據
  product: ProductSummary!        # 產品摘要
  inventory: InventoryLocation    # 當前庫存位置
  transfers: [TransferSummary!]!  # 轉移記錄
  
  # 狀態信息
  currentLocation: LocationType   # 當前位置
  isAvailable: Boolean!          # 是否可用
}

# 庫存搜索結果
type InventorySearchResult {
  id: ID!                        # 庫存記錄ID
  productCode: String!           # 產品代碼
  pltNum: String                 # 托盤編號
  
  # 各位置庫存
  injection: Float!              # 注塑區
  pipeline: Float!               # 管道區
  prebook: Float!               # 預訂區
  await: Float!                 # 等待區
  fold: Float!                  # 摺疊區
  bulk: Float!                  # 散裝區
  backcarpark: Float!           # 後院區
  damage: Float!                # 損壞區
  awaitGrn: Float!              # 等待GRN區
  
  # 統計信息
  totalStock: Float!            # 總庫存
  lastUpdated: DateTime!        # 最後更新時間
  
  # 關聯數據
  product: ProductSummary!       # 產品信息
  pallet: PalletSummary         # 托盤信息
}

# 訂單搜索結果
type OrderSearchResult {
  orderRef: String!              # 訂單參考
  customerCode: String           # 客戶代碼
  productCode: String!           # 產品代碼
  requiredQty: Float!           # 需求數量
  finishedQty: Float!           # 完成數量
  status: OrderStatus!          # 訂單狀態
  orderDate: DateTime           # 訂單日期
  
  # 計算欄位
  completionRate: Float!        # 完成率
  remainingQty: Float!          # 剩餘數量
  isOverdue: Boolean!           # 是否逾期
  
  # 關聯數據
  product: ProductSummary!       # 產品信息
  customer: CustomerSummary     # 客戶信息
}

# GRN搜索結果
type GRNSearchResult {
  grnRef: String!               # GRN參考
  pltNum: String                # 托盤編號
  supCode: String               # 供應商代碼
  materialCode: String!         # 物料代碼
  grossWeight: Float            # 毛重
  netWeight: Float              # 淨重
  palletCount: Float!           # 托盤數量
  packageCount: Float!          # 包裝數量
  createTime: DateTime!         # 創建時間
  
  # 關聯數據
  supplier: SupplierSummary     # 供應商信息
  material: ProductSummary!     # 物料信息
  pallet: PalletSummary        # 托盤信息
}

# 用戶搜索結果
type UserSearchResult {
  id: String!                   # 用戶ID
  name: String!                 # 姓名
  email: String                 # 電子郵件
  department: String            # 部門
  position: String!             # 職位
  
  # 統計信息
  workLevel: WorkLevelSummary   # 工作量統計
  recentActivity: [ActivitySummary!]! # 最近活動
}

# 供應商搜索結果
type SupplierSearchResult {
  supplierCode: String!         # 供應商代碼
  supplierName: String!         # 供應商名稱
  
  # 統計信息
  totalGRNs: Int!              # 總GRN數
  totalMaterials: Int!         # 總物料數
  lastDelivery: DateTime       # 最後交付時間
  
  # 關聯數據
  grns: [GRNSummary!]!         # GRN摘要
  materials: [ProductSummary!]! # 物料列表
}

# 歷史搜索結果
type HistorySearchResult {
  id: ID!                      # 記錄ID
  time: DateTime!              # 操作時間
  action: String!              # 操作類型
  pltNum: String               # 托盤編號
  location: String             # 位置
  remark: String               # 備註
  
  # 關聯數據
  operator: UserSummary        # 操作員信息
  pallet: PalletSummary       # 托盤信息
}

# 轉移搜索結果
type TransferSearchResult {
  id: ID!                      # 轉移ID
  tranDate: DateTime!          # 轉移時間
  fromLocation: LocationType!   # 起始位置
  toLocation: LocationType!     # 目標位置
  pltNum: String!              # 托盤編號
  
  # 關聯數據
  operator: UserSummary!       # 操作員信息
  pallet: PalletSummary!      # 托盤信息
}

# 文件搜索結果
type FileSearchResult {
  id: ID!                      # 文件ID
  fileName: String!            # 文件名稱
  fileType: String             # 文件類型
  fileSize: Int               # 文件大小
  uploadBy: String!           # 上傳者
  createdAt: DateTime!        # 創建時間
  
  # 文件信息
  url: String                 # 文件URL
  folder: String              # 資料夾
  description: String         # 描述
}

# ================================
# 搜索結果摘要類型
# ================================

# 產品摘要
type ProductSummary {
  code: String!
  description: String!
  colour: String
  type: String
}

# 托盤摘要
type PalletSummary {
  pltNum: String!
  series: String
  productCode: String!
  productQty: Float!
}

# 庫存摘要
type InventorySummary {
  totalStock: Float!
  locations: [LocationStockSummary!]!
}

# 位置庫存摘要
type LocationStockSummary {
  location: LocationType!
  stock: Float!
  percentage: Float!
}

# 訂單摘要
type OrderSummary {
  totalOrders: Int!
  pendingOrders: Int!
  completedOrders: Int!
}

# 客戶摘要
type CustomerSummary {
  customerCode: String!
  name: String
  totalOrders: Int!
}

# 供應商摘要
type SupplierSummary {
  supplierCode: String!
  supplierName: String!
}

# GRN摘要
type GRNSummary {
  grnRef: String!
  materialCode: String!
  createTime: DateTime!
}

# 用戶摘要
type UserSummary {
  id: String!
  name: String!
  department: String
  position: String!
}

# 工作量摘要
type WorkLevelSummary {
  qc: Float!
  move: Float!
  grn: Float!
  loading: Float!
}

# 活動摘要
type ActivitySummary {
  action: String!
  time: DateTime!
  description: String!
}

# 庫存位置
type InventoryLocation {
  location: LocationType!
  quantity: Float!
  lastUpdated: DateTime!
}

# 轉移摘要
type TransferSummary {
  fromLocation: LocationType!
  toLocation: LocationType!
  tranDate: DateTime!
}

# ================================
# 搜索建議和分析
# ================================

# 搜索建議
type SearchSuggestion {
  text: String!                 # 建議文本
  type: SuggestionType!         # 建議類型
  entity: SearchableEntity      # 相關實體
  count: Int                    # 結果數量預估
  score: Float!                # 建議分數
  metadata: JSON               # 額外元數據
}

# 建議類型
enum SuggestionType {
  AUTOCOMPLETE                 # 自動完成
  SPELLING_CORRECTION          # 拼寫糾正
  RELATED_SEARCH              # 相關搜索
  POPULAR_SEARCH              # 熱門搜索
  RECENT_SEARCH               # 最近搜索
}

# 搜索分析
type SearchAnalytics {
  # 查詢統計
  queryStats: QueryStats!      # 查詢統計
  
  # 結果統計
  resultStats: ResultStats!    # 結果統計
  
  # 性能統計
  performanceStats: PerformanceStats! # 性能統計
  
  # 用戶行為
  userBehavior: UserBehaviorStats # 用戶行為統計
}

# 查詢統計
type QueryStats {
  totalQueries: Int!           # 總查詢數
  uniqueQueries: Int!          # 唯一查詢數
  averageQueryLength: Float!   # 平均查詢長度
  topQueries: [QueryFrequency!]! # 熱門查詢
}

# 查詢頻率
type QueryFrequency {
  query: String!               # 查詢文本
  count: Int!                 # 查詢次數
  lastUsed: DateTime!         # 最後使用時間
}

# 結果統計
type ResultStats {
  totalResults: Int!           # 總結果數
  averageResults: Float!       # 平均結果數
  zeroResultQueries: Int!      # 零結果查詢數
  entityBreakdown: [EntityResultBreakdown!]! # 按實體分解
}

# 實體結果分解
type EntityResultBreakdown {
  entity: SearchableEntity!    # 實體類型
  resultCount: Int!           # 結果數量
  percentage: Float!          # 百分比
}

# 性能統計
type PerformanceStats {
  averageResponseTime: Float!  # 平均響應時間
  slowQueries: [SlowQuery!]!  # 慢查詢
  cacheHitRate: Float!        # 緩存命中率
}

# 慢查詢
type SlowQuery {
  query: String!              # 查詢文本
  responseTime: Float!        # 響應時間
  timestamp: DateTime!        # 時間戳
}

# 用戶行為統計
type UserBehaviorStats {
  clickThroughRate: Float!    # 點擊率
  abandonmentRate: Float!     # 放棄率
  refinementRate: Float!      # 細化率
  commonPatterns: [SearchPattern!]! # 常見模式
}

# 搜索模式
type SearchPattern {
  pattern: String!            # 模式描述
  frequency: Int!            # 頻率
  successRate: Float!        # 成功率
}

# 搜索歷史項目
type SearchHistoryItem {
  id: ID!                    # 歷史ID
  query: String!             # 查詢文本
  entities: [SearchableEntity!]! # 搜索實體
  resultCount: Int!          # 結果數量
  timestamp: DateTime!       # 時間戳
  userId: ID               # 用戶ID
  success: Boolean!         # 是否成功
}

# 搜索面向
type SearchFacet {
  field: String!             # 欄位名稱
  displayName: String!       # 顯示名稱
  values: [FacetValue!]!     # 面向值
}

# 面向值
type FacetValue {
  value: String!             # 值
  displayValue: String!      # 顯示值
  count: Int!               # 數量
  selected: Boolean!        # 是否選中
}

# 搜索結果元數據
type SearchResultMetadata {
  source: String!            # 數據源
  freshness: DateTime!       # 數據新鮮度
  confidence: Float!         # 置信度
  tags: [String!]!          # 標籤
  customFields: JSON        # 自定義欄位
}

# 搜索結果操作
type SearchResultAction {
  id: String!               # 操作ID
  label: String!            # 操作標籤
  icon: String              # 圖標
  url: String               # 操作URL
  action: String!           # 操作類型
  requiresAuth: Boolean!    # 是否需要認證
}

# ================================
# SearchCard Mutations
# ================================

# 保存搜索配置
input SaveSearchConfigInput {
  name: String!                    # 配置名稱
  query: String!                   # 查詢
  entities: [SearchableEntity!]!   # 實體
  filters: SearchFilters           # 過濾器
  isDefault: Boolean = false       # 是否默認
  isPublic: Boolean = false        # 是否公開
}

# 搜索配置
type SearchConfig {
  id: ID!                         # 配置ID
  name: String!                   # 配置名稱
  query: String!                  # 查詢
  entities: [SearchableEntity!]!  # 實體
  filters: SearchFilters          # 過濾器
  isDefault: Boolean!             # 是否默認
  isPublic: Boolean!              # 是否公開
  createdBy: ID!                 # 創建者
  createdAt: DateTime!           # 創建時間
  updatedAt: DateTime!           # 更新時間
  usageCount: Int!               # 使用次數
}

# ================================
# SearchCard Queries and Mutations
# ================================

extend type Query {
  # 主要搜索查詢
  searchCard(input: SearchCardInput!): SearchCardData!
  
  # 批量搜索
  batchSearch(inputs: [SearchCardInput!]!): [SearchCardData!]!
  
  # 搜索建議
  searchSuggestions(
    query: String!
    entity: SearchableEntity
    limit: Int = 10
  ): [SearchSuggestion!]!
    
    
    
  
  # 搜索歷史
  searchHistory(
    userId: ID
    limit: Int = 50
    offset: Int = 0
  ): [SearchHistoryItem!]!
    
    
  
  # 搜索配置
  searchConfigs(
    userId: ID
    includePublic: Boolean = true
  ): [SearchConfig!]!
    
    
  
  # 搜索分析
  searchAnalytics(
    dateRange: DateRangeInput
    entities: [SearchableEntity!]
  ): SearchAnalytics!
    
    
}

extend type Mutation {
  # 保存搜索配置
  saveSearchConfig(input: SaveSearchConfigInput!): SearchConfig!
    
    
  
  # 刪除搜索配置
  deleteSearchConfig(id: ID!): Boolean!
    
    
  
  # 清除搜索歷史
  clearSearchHistory(userId: ID, olderThan: DateTime): Boolean!
    
    
  
  # 更新搜索偏好
  updateSearchPreferences(
    preferences: JSON!
  ): Boolean!
    
    
}

# ================================
# SearchCard Subscriptions
# ================================

extend type Subscription {
  # 搜索結果更新
  searchResultsUpdated(
    query: String!
    entities: [SearchableEntity!]!
  ): SearchCardData!
  
  # 新搜索建議
  searchSuggestionsUpdated(
    query: String!
  ): [SearchSuggestion!]!
}
`;