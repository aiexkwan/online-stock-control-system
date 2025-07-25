/**
 * TableCard GraphQL Schema
 * 統一表格組件的 GraphQL 類型定義
 * 整合6個表格類widgets的數據查詢接口
 */

export const tableSchema = `
# TableCard 核心類型定義

enum TableDataType {
  STRING
  NUMBER
  BOOLEAN
  DATE
  DATETIME
  ARRAY
  OBJECT
  JSON
}

enum SortOrder {
  ASC
  DESC
}

enum ColumnAlign {
  LEFT
  CENTER
  RIGHT
}

enum FormatterType {
  DEFAULT
  CURRENCY
  PERCENTAGE
  DATE
  DATETIME
  BOOLEAN
  TRUNCATE
  LINK
  BADGE
  CUSTOM
}

enum PaginationStyle {
  OFFSET
  CURSOR
  LOAD_MORE
}

enum CacheType {
  NO_CACHE
  CLIENT_CACHE
  SERVER_CACHE
  HYBRID_CACHE
}

enum ExportFormat {
  CSV
  EXCEL
  PDF
  JSON
}

enum ExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

# 表格列配置
type TableColumn {
  key: String!
  header: String!
  dataType: TableDataType!
  sortable: Boolean!
  filterable: Boolean!
  width: String
  align: ColumnAlign
  formatter: ColumnFormatter
  required: Boolean
  hidden: Boolean
}

type ColumnFormatter {
  type: FormatterType!
  options: JSON
}

# 篩選器類型
input StringFilter {
  field: String!
  operator: StringOperator!
  value: String!
  caseSensitive: Boolean = false
}

enum StringOperator {
  EQUALS
  CONTAINS
  STARTS_WITH
  ENDS_WITH
  NOT_EQUALS
  NOT_CONTAINS
}

input NumberFilter {
  field: String!
  operator: NumberOperator!
  value: Float
  min: Float
  max: Float
}

enum NumberOperator {
  EQUALS
  GT
  GTE
  LT
  LTE
  BETWEEN
  NOT_EQUALS
}

input DateFilter {
  field: String!
  operator: DateOperator!
  value: DateTime
  startDate: DateTime
  endDate: DateTime
}

enum DateOperator {
  EQUALS
  BEFORE
  AFTER
  BETWEEN
  TODAY
  YESTERDAY
  LAST_7_DAYS
  LAST_30_DAYS
  THIS_MONTH
  LAST_MONTH
}

input BooleanFilter {
  field: String!
  value: Boolean!
}

input ArrayFilter {
  field: String!
  operator: ArrayOperator!
  values: [String!]!
}

enum ArrayOperator {
  IN
  NOT_IN
  CONTAINS_ANY
  CONTAINS_ALL
}

# 通用篩選器組合
input TableFilters {
  stringFilters: [StringFilter!]
  numberFilters: [NumberFilter!]
  dateFilters: [DateFilter!]
  booleanFilters: [BooleanFilter!]
  arrayFilters: [ArrayFilter!]
}

# 排序配置
input TableSorting {
  sortBy: String!
  sortOrder: SortOrder!
  secondarySort: TableSorting
}

# 分頁配置
input TablePagination {
  limit: Int! = 20
  offset: Int! = 0
  cursor: String
  style: PaginationStyle = OFFSET
  loadMore: Boolean = false
  preloadNext: Boolean = false
}

# 緩存策略
input CacheStrategy {
  ttl: Int
  strategy: CacheType!
  invalidateOn: [String!]
}

# 統一表格查詢輸入
input TableDataInput {
  dataSource: String!
  filters: TableFilters
  sorting: TableSorting
  pagination: TablePagination!
  columns: [String!]
  dateRange: DateRangeInput
  searchTerm: String
  cacheStrategy: CacheStrategy
  includeMetadata: Boolean = true
}

# 表格權限
type TablePermissions {
  canView: Boolean!
  canEdit: Boolean!
  canDelete: Boolean!
  canCreate: Boolean!
  canExport: Boolean!
  canFilter: Boolean!
  canSort: Boolean!
}

# 表格元數據
type TableMetadata {
  queryTime: Float!
  cacheHit: Boolean!
  dataSource: String!
  lastUpdated: DateTime!
  totalRecords: Int!
  filteredRecords: Int!
  permissions: TablePermissions!
  generatedAt: DateTime!
}

# 表格行數據（動態結構）
scalar TableRow

# 統一表格響應
type TableCardData implements WidgetData {
  data: [TableRow!]!
  columns: [TableColumn!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  currentPage: Int
  totalPages: Int
  filters: TableFilters
  sorting: TableSorting
  metadata: TableMetadata!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

# === 專用數據類型 ===

# 庫存分析數據
input InventoryAnalysisInput {
  productType: String
  productCodes: [String!]
  includeOrderDemand: Boolean = true
  includeLocationBreakdown: Boolean = false
  dateRange: DateRangeInput
  sortBy: InventoryAnalysisSortField = STATUS
  sortOrder: SortDirection = ASC
}

enum InventoryAnalysisSortField {
  STATUS
  FULFILLMENT_RATE
  INVENTORY_GAP
  PRODUCT_CODE
}

type InventoryAnalysisData implements WidgetData {
  products: [InventoryProduct!]!
  summary: InventoryAnalysisSummary!
  columns: [TableColumn!]!
  metadata: TableMetadata!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type InventoryProduct {
  productCode: String!
  description: String!
  productType: String!
  colour: String!
  standardQty: Int!
  currentStock: Int!
  orderDemand: Int!
  remainingStock: Int!
  fulfillmentRate: Float!
  isSufficient: Boolean!
  locationBreakdown: LocationBreakdown
}

type InventoryAnalysisSummary {
  totalProducts: Int!
  totalStock: Int!
  totalDemand: Int!
  totalRemaining: Int!
  overallSufficient: Boolean!
  sufficientCount: Int!
  insufficientCount: Int!
  averageFulfillmentRate: Float!
}

# 訂單列表數據
input OrdersListInput {
  pagination: TablePagination!
  dateRange: DateRangeInput
  uploaderFilter: [String!]
  statusFilter: [String!]
  searchTerm: String
}

type OrdersListData implements WidgetData {
  orders: [OrderRecord!]!
  columns: [TableColumn!]!
  totalCount: Int!
  hasMore: Boolean!
  metadata: TableMetadata!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type OrderRecord {
  uuid: ID!
  id: String!
  time: DateTime!
  remark: String!
  uploaderName: String
  docUrl: String
  status: OrderStatus
  createdAt: DateTime!
  updatedAt: DateTime
}

enum OrderStatus {
  UPLOADED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

# 歷史記錄樹數據
input HistoryTreeInput {
  dateRange: DateRangeInput!
  actionTypes: [String!]
  userIds: [String!]
  palletNumbers: [String!]
  locations: [String!]
  groupBy: HistoryGroupBy = TIME
  sortBy: HistorySortBy = TIME
  sortOrder: SortOrder = DESC
  pagination: TablePagination!
  searchTerm: String
}

enum HistoryGroupBy {
  TIME
  USER
  ACTION
  LOCATION
  PALLET
}

enum HistorySortBy {
  TIME
  ACTION
  USER
  LOCATION
}

type HistoryTreeData implements WidgetData {
  entries: [HistoryEntry!]!
  columns: [TableColumn!]!
  totalCount: Int!
  hasNextPage: Boolean!
  groupedData: JSON
  appliedFilters: HistoryTreeFilters!
  metadata: TableMetadata!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type HistoryEntry {
  id: ID!
  timestamp: DateTime!
  action: String!
  location: String
  remark: String
  user: HistoryUser
  pallet: HistoryPallet
}

type HistoryUser {
  id: String!
  name: String!
  department: String
  position: String
  email: String
}

type HistoryPallet {
  number: String!
  series: String
  quantity: Int!
  generatedAt: DateTime
  product: HistoryProduct
}

type HistoryProduct {
  code: String!
  description: String!
  type: String!
  colour: String!
  standardQty: Int!
}

type HistoryTreeFilters {
  dateRange: DateRange!
  actionTypes: [String!]
  userIds: [String!]
  palletNumbers: [String!]
  locations: [String!]
}

# 生產詳情數據
input ProductionDetailsInput {
  dateRange: DateRangeInput!
  departmentIds: [String!]
  productCodes: [String!]
  pagination: TablePagination!
  includeMetrics: Boolean = true
}

type ProductionDetailsData implements WidgetData {
  records: [ProductionRecord!]!
  columns: [TableColumn!]!
  summary: ProductionSummary!
  metadata: TableMetadata!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type ProductionRecord {
  id: ID!
  timestamp: DateTime!
  productCode: String!
  productName: String!
  quantity: Int!
  department: String!
  operator: String!
  efficiency: Float!
  qualityScore: Float!
  notes: String
}

type ProductionSummary {
  totalRecords: Int!
  totalQuantity: Int!
  averageEfficiency: Float!
  averageQualityScore: Float!
  departmentBreakdown: [DepartmentProductionSummary!]!
}

type DepartmentProductionSummary {
  department: String!
  quantity: Int!
  efficiency: Float!
  qualityScore: Float!
}

# 導出功能
input ExportTableInput {
  dataSource: String!
  filters: TableFilters
  columns: [String!]
  format: ExportFormat!
  includeHeaders: Boolean = true
  dateRange: DateRangeInput
  fileName: String
}

type ExportResult {
  downloadUrl: String!
  fileName: String!
  fileSize: Int!
  expiresAt: DateTime!
  status: ExportStatus!
  progress: Float
  error: String
}

# 查詢接口擴展
extend type Query {
  # 統一表格數據查詢
  tableCardData(input: TableDataInput!): TableCardData!
  
  # 庫存分析表格
  inventoryAnalysisTable(input: InventoryAnalysisInput!): InventoryAnalysisData!
  
  # 訂單列表表格
  ordersListTable(input: OrdersListInput!): OrdersListData!
  
  # 歷史記錄表格
  historyTreeTable(input: HistoryTreeInput!): HistoryTreeData!
  
  # 生產詳情表格
  productionDetailsTable(input: ProductionDetailsInput!): ProductionDetailsData!
  
  # 獲取表格列配置
  tableColumns(dataSource: String!): [TableColumn!]!
  
  # 獲取表格權限
  tablePermissions(dataSource: String!): TablePermissions!
}

# 變更接口擴展
extend type Mutation {
  # 導出表格數據
  exportTableData(input: ExportTableInput!): ExportResult!
  
  # 清除表格緩存
  clearTableCache(dataSource: String!): Boolean!
  
  # 刷新表格數據
  refreshTableData(dataSource: String!): Boolean!
}

# 訂閱接口擴展
extend type Subscription {
  # 表格數據更新訂閱
  tableDataUpdated(dataSource: String!): TableCardData!
  
  # 導出進度訂閱
  exportProgress(exportId: ID!): ExportResult!
}
`;
