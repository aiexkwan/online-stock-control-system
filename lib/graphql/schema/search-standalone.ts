/**
 * Standalone SearchCard GraphQL Schema
 * 獨立的搜索卡片 GraphQL 類型定義，避免與其他 schema 衝突
 */

export const typeDefs = `
# Base types
scalar DateTime
scalar JSON

# Custom directives
directive @auth(requires: String) on FIELD_DEFINITION
directive @rateLimit(max: Int!, window: String!) on FIELD_DEFINITION  
directive @cache(ttl: Int, scope: String) on FIELD_DEFINITION

# Basic enums
enum LocationType {
  INJECTION
  PIPELINE
  PREBOOK
  AWAIT
  FOLD
  BULK
  BACKCARPARK
  DAMAGE
  AWAIT_GRN
}

enum SortDirection {
  ASC
  DESC
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}

# Basic input types
input DateRangeInput {
  start: DateTime
  end: DateTime
}

input PaginationInput {
  limit: Int = 20
  offset: Int = 0
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  totalCount: Int!
}

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

# SearchCard 主要輸入
input SearchCardInput {
  query: String!                    # 搜索查詢字串
  mode: SearchMode!                 # 搜索模式
  type: SearchType = TEXT           # 搜索類型
  entities: [SearchableEntity!]     # 要搜索的實體列表
  pagination: PaginationInput       # 分頁參數
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
  hasMore: Boolean!               # 是否有更多結果
}

# 搜索結果項目
type SearchResultItem {
  id: ID!                         # 唯一標識符  
  entity: SearchableEntity!        # 實體類型
  title: String!                  # 標題
  subtitle: String                # 副標題
  description: String             # 描述
  relevanceScore: Float!          # 相關性分數
  matchedFields: [String!]!       # 匹配欄位
  data: SearchResultData!         # 實體特定數據
  actions: [SearchResultAction!]! # 可執行操作
}

# 搜索結果數據聯合類型
union SearchResultData = 
  ProductSearchResult |
  PalletSearchResult |
  InventorySearchResult

# 產品搜索結果
type ProductSearchResult {
  code: String!                   # 產品代碼
  description: String!            # 產品描述
  colour: String                  # 顏色
  type: String                    # 類型
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
  isAvailable: Boolean!          # 是否可用
}

# 庫存搜索結果
type InventorySearchResult {
  id: ID!                        # 庫存記錄ID
  productCode: String!           # 產品代碼
  pltNum: String                 # 托盤編號
  totalStock: Float!            # 總庫存
  lastUpdated: DateTime!        # 最後更新時間
}

# 搜索結果集合
type SearchResultCollection {
  items: [SearchResultItem!]!     # 所有結果項目
  pageInfo: PageInfo!             # 分頁信息
}

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

# 搜索結果操作
type SearchResultAction {
  id: String!               # 操作ID
  label: String!            # 操作標籤
  icon: String              # 圖標
  url: String               # 操作URL
  action: String!           # 操作類型
  requiresAuth: Boolean!    # 是否需要認證
}

# SearchCard主要輸出
type SearchCardData {
  searchMeta: SearchMetadata!      # 搜索元數據
  results: SearchResultCollection! # 搜索結果集合
  suggestions: [SearchSuggestion!]! # 搜索建議
}

type Query {
  searchCard(input: SearchCardInput!): SearchCardData!
  
  searchSuggestions(
    query: String!
    entity: SearchableEntity
    limit: Int = 10
  ): [SearchSuggestion!]!
}
`;
