/**
 * GraphQL Schema Definitions
 * Combined schema for the NewPennine WMS
 */

// Order Schema - integrated from separate file

export const baseSchema = `
# Base GraphQL Schema - Core Types
scalar DateTime
scalar Date
scalar JSON

# Custom directives
directive @auth(
  requires: String
) on FIELD_DEFINITION | QUERY | MUTATION

directive @rateLimit(
  max: Int!
  window: String!
) on FIELD_DEFINITION | QUERY | MUTATION

directive @cache(
  ttl: Int
  scope: String
) on FIELD_DEFINITION | QUERY | MUTATION

# 基礎枚舉類型
enum LocationType {
  INJECTION
  PIPELINE
  PREBOOK
  AWAIT
  FOLD
  BULK
  BACKCARPARK
  DAMAGE
  AWAIT_GRN     # 新增對應 record_inventory.await_grn
}

enum TransferStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

# 分頁相關類型
input PaginationInput {
  page: Int = 1
  limit: Int = 20
  offset: Int
}

# PageInfo for cursor-based pagination
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  totalCount: Int!
  totalPages: Int!
  currentPage: Int!
}

# 日期範圍輸入
input DateRangeInput {
  start: DateTime!
  end: DateTime!
}

# 日期範圍輸出
type DateRange {
  start: DateTime!
  end: DateTime!
}

# 排序輸入
input SortInput {
  field: String!
  direction: SortDirection!
}

enum SortDirection {
  ASC
  DESC
}

# 通用過濾輸入
input FilterInput {
  field: String!
  operator: FilterOperator!
  value: JSON!
}

enum FilterOperator {
  EQ
  NEQ
  GT
  GTE
  LT
  LTE
  IN
  NOT_IN
  CONTAINS
  NOT_CONTAINS
  BETWEEN
  IS_NULL
  IS_NOT_NULL
}

# 統計相關類型
type StatMetric {
  name: String!
  value: Float!
  unit: String
  change: Float
  changeType: ChangeType
}

enum ChangeType {
  INCREASE
  DECREASE
  STABLE
}

# Card 數據源類型
interface CardData {
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

# 錯誤處理
type Error {
  message: String!
  code: String
  field: String
}

# 批量操作結果
type BatchResult {
  success: Int!
  failed: Int!
  errors: [Error!]
}

# 系統狀態
type SystemStatus {
  healthy: Boolean!
  version: String!
  uptime: Int!
  activeUsers: Int!
  lastBackup: DateTime
}
`;

export const productSchema = `
# Product GraphQL Schema
type Product {
  # 對應 data_code 表的實際欄位
  code: ID!              # data_code.code (text, NOT NULL)
  description: String!   # data_code.description (text, NOT NULL)
  colour: String!        # data_code.colour (text, NOT NULL, default: 'Black')
  type: String!          # data_code.type (text, NOT NULL, default: '-')
  standardQty: Int       # data_code.standard_qty (integer, nullable to handle null values safely)
  remark: String         # data_code.remark (text, nullable, default: '-')
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  inventory: InventorySummary
  pallets(filter: PalletFilterInput, pagination: PaginationInput, sort: SortInput): PalletConnection!
  statistics: ProductStatistics
}

type ProductStatistics {
  totalQuantity: Int!
  totalPallets: Int!
  totalLocations: Int!
  averageStockLevel: Float!
  stockTurnoverRate: Float
  lastMovementDate: DateTime
}

type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProductEdge {
  cursor: String!
  node: Product!
}

type Supplier {
  supplier_code: String!
  supplier_name: String
}

type SupplierStatistics {
  totalProducts: Int!
  totalGRNs: Int!
  averageLeadTime: Float
  qualityScore: Float
  onTimeDeliveryRate: Float
}

input ProductFilterInput {
  code: String
  description: String
  type: String
  colour: String
  isActive: Boolean
  hasInventory: Boolean
  minQuantity: Int
  maxQuantity: Int
}

input CreateProductInput {
  code: String!
  description: String!
  colour: String
  type: String
  standardQty: Int
  unit: String
  weightPerPiece: Float
  volumePerPiece: Float
}

input UpdateProductInput {
  description: String
  colour: String
  type: String
  standardQty: Int
  unit: String
  weightPerPiece: Float
  volumePerPiece: Float
}

input CreateSupplierInput {
  code: String!
  name: String!
  address: String
  contact: String
  email: String
  phone: String
  fax: String
  status: String
  leadTime: Int
  paymentTerms: String
  minimumOrderQuantity: Int
}

input UpdateSupplierInput {
  name: String
  address: String
  contact: String
  email: String
  phone: String
  fax: String
  status: String
  leadTime: Int
  paymentTerms: String
  minimumOrderQuantity: Int
}

input SupplierFilterInput {
  code: String
  name: String
  status: String
  contact: String
}

type SupplierConnection {
  edges: [SupplierEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type SupplierEdge {
  node: Supplier!
  cursor: String!
}

type SupplierPerformance {
  deliveryPerformance: DeliveryPerformance!
  qualityMetrics: QualityMetrics!
  orderMetrics: OrderMetrics!
}

type DeliveryPerformance {
  onTimeDeliveries: Int!
  lateDeliveries: Int!
  earlyDeliveries: Int!
  averageDelayDays: Float
}

type QualityMetrics {
  acceptedGRNs: Int!
  rejectedGRNs: Int!
  partialGRNs: Int!
  defectRate: Float
}

type OrderMetrics {
  totalOrders: Int!
  completedOrders: Int!
  pendingOrders: Int!
  cancelledOrders: Int!
}
`;

export const inventorySchema = `
# Inventory GraphQL Schema
type Pallet {
  # 對應 record_palletinfo 表的實際欄位
  pltNum: ID!            # record_palletinfo.plt_num (text, NOT NULL)
  productCode: String!   # record_palletinfo.product_code (text, NOT NULL)
  quantity: Int!         # record_palletinfo.product_qty (bigint, NOT NULL, default: 0)
  series: String!        # record_palletinfo.series (text, NOT NULL)
  pltRemark: String      # record_palletinfo.plt_remark (text, nullable, default: '-')
  pdfUrl: String         # record_palletinfo.pdf_url (text, nullable)
  generateTime: DateTime! # record_palletinfo.generate_time (timestamp with time zone, NOT NULL)
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product!
  transfers(filter: TransferFilterInput, pagination: PaginationInput): TransferConnection!
  history(pagination: PaginationInput): [HistoryRecord!]!
}

enum PalletStatus {
  ACTIVE
  VOID
  TRANSFERRED
  SHIPPED
  DAMAGED
}

type Inventory {
  # 對應 record_inventory 表的實際欄位
  uuid: ID!              # record_inventory.uuid (uuid, NOT NULL)
  productCode: String!   # record_inventory.product_code (text, NOT NULL)
  pltNum: String!        # record_inventory.plt_num (text, NOT NULL)
  latestUpdate: DateTime # record_inventory.latest_update (timestamp with time zone, nullable)
  
  # 位置數量 (直接對應數據庫欄位)
  injection: Int!        # record_inventory.injection (bigint, NOT NULL, default: 0)
  pipeline: Int!         # record_inventory.pipeline (bigint, NOT NULL, default: 0)
  prebook: Int!          # record_inventory.prebook (bigint, NOT NULL, default: 0)
  await: Int!            # record_inventory.await (bigint, NOT NULL, default: 0)
  fold: Int!             # record_inventory.fold (bigint, NOT NULL, default: 0)
  bulk: Int!             # record_inventory.bulk (bigint, NOT NULL, default: 0)
  backcarpark: Int!      # record_inventory.backcarpark (bigint, NOT NULL, default: 0)
  damage: Int!           # record_inventory.damage (bigint, NOT NULL, default: 0)
  await_grn: Int         # record_inventory.await_grn (bigint, nullable, default: 0)
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product!
  pallet: Pallet!
  locationQuantities: LocationInventory!
  totalQuantity: Int!
}

type LocationInventory {
  # 對應 record_inventory 表的位置欄位
  injection: Int!     # record_inventory.injection (bigint, NOT NULL, default: 0)
  pipeline: Int!      # record_inventory.pipeline (bigint, NOT NULL, default: 0)
  prebook: Int!       # record_inventory.prebook (bigint, NOT NULL, default: 0)
  await: Int!         # record_inventory.await (bigint, NOT NULL, default: 0)
  fold: Int!          # record_inventory.fold (bigint, NOT NULL, default: 0)
  bulk: Int!          # record_inventory.bulk (bigint, NOT NULL, default: 0)
  backcarpark: Int!   # record_inventory.backcarpark (bigint, NOT NULL, default: 0)
  damage: Int!        # record_inventory.damage (bigint, NOT NULL, default: 0)
  await_grn: Int      # record_inventory.await_grn (bigint, nullable, default: 0)
}

type InventorySummary {
  totalQuantity: Int!
  availableQuantity: Int!
  reservedQuantity: Int!
  locationBreakdown: LocationInventory!
  lastUpdate: DateTime!
}

type Location {
  # 注意：數據庫使用文字儲存位置，沒有獨立的位置表
  # 這個類型主要用於應用層的位置管理
  code: String!          # 位置代碼 (如 'INJECTION', 'PIPELINE' 等)
  name: String!          # 位置名稱
  type: LocationType!    # 位置類型枚舉
}

type Warehouse {
  id: ID!
  code: String!
  name: String!
  locations: [Location!]!
  totalCapacity: Int!
  currentOccupancy: Int!
  occupancyRate: Float!
}

"""
收貨單 (Goods Received Note) - 商業層級類型
代表完整的收貨作業，包含多個收貨項目的彙總資訊
這是一個虛擬類型，用於提供商業邏輯層的抽象
"""
type GRN {
  """收貨單唯一標識符"""
  id: ID!
  
  """收貨單編號"""
  grnNumber: String!
  
  """供應商代碼"""
  supplierCode: String!
  
  """供應商資訊 (關聯查詢)"""
  supplier: Supplier!
  
  """收貨項目清單 (關聯到 GRNRecord)"""
  items: [GRNItem!]!
  
  """總項目數量 (計算欄位)"""
  totalItems: Int!
  
  """總收貨數量 (計算欄位)"""
  totalQuantity: Int!
  
  """收貨單狀態"""
  status: GRNStatus!
  
  """收貨日期"""
  receivedDate: DateTime!
  
  """完成日期 (可選)"""
  completedDate: DateTime
  
  """品質檢查狀態 (可選)"""
  qcStatus: QCStatus
  
  """品質檢查完成日期 (可選)"""
  qcCompletedDate: DateTime
  
  """品質檢查人員 (可選)"""
  qcBy: User
  
  """創建時間"""
  createdAt: DateTime!
  
  """創建人員"""
  createdBy: User!
}

type GRNItem {
  productCode: String!
  product: Product!
  quantity: Int!
  palletNumbers: [String!]!
  qcPassed: Boolean
  remarks: String
}

"""
收貨記錄項目 (record_grn 表) - 數據庫層級類型
代表收貨單中的單一項目記錄，直接對應數據庫表結構
每一筆記錄代表一個托盤的收貨資訊，包含重量、包裝等詳細數據
"""
type GRNRecord {
  # === 數據庫實際欄位 ===
  """記錄唯一標識符 (主鍵)"""
  uuid: ID!
  
  """收貨單參考號碼，關聯到主收貨單"""
  grnRef: Int!
  
  """托盤號碼，外鍵關聯 record_palletinfo 表"""
  pltNum: String!
  
  """供應商代碼，外鍵關聯 data_supplier 表"""
  supCode: String!
  
  """材料/產品代碼，外鍵關聯 data_code 表"""
  materialCode: String!
  
  """毛重 (包含包裝重量)"""
  grossWeight: Int!
  
  """淨重 (實際產品重量)"""
  netWeight: Int!
  
  """托盤資訊描述"""
  pallet: String!
  
  """包裝資訊描述"""
  package: String!
  
  """托盤數量 (數值型，支援小數)"""
  palletCount: Float!
  
  """包裝數量 (數值型，支援小數)"""
  packageCount: Float!
  
  """記錄創建時間 (注意：資料庫欄位名稱為 creat_time)"""
  creatTime: DateTime!
  
  # === 關聯數據 (透過 resolver 動態獲取) ===
  """關聯的托盤詳細資訊"""
  palletInfo: Pallet!
  
  """關聯的供應商資訊"""
  supplier: Supplier!
  
  """關聯的產品資訊"""
  product: Product!
  
  # === 計算欄位 (透過 resolver 動態計算) ===
  """重量比率 (淨重/毛重)，用於評估包裝效率"""
  weightRatio: Float
  
  """單位重量 (毛重/包裝數量)，用於標準化比較"""
  unitWeight: Float
  
  """包裝效率指標，綜合評估包裝品質"""
  packagingEfficiency: Float
  
  # === 業務欄位 ===
  """記錄處理狀態"""
  status: GRNRecordStatus!
  
  """重量數據是否通過驗證"""
  isWeightValid: Boolean!
  
  """發現的差異或問題清單"""
  discrepancies: [String!]
  
  """品質檢查備註"""
  qualityNotes: String
}

# 收貨記錄狀態枚舉
enum GRNRecordStatus {
  RECORDED                     # 已記錄
  VERIFIED                     # 已驗證
  DISCREPANCY                  # 有差異
  CORRECTED                    # 已修正
  CANCELLED                    # 已取消
}

enum GRNStatus {
  PENDING
  RECEIVING
  QC_PENDING
  QC_IN_PROGRESS
  COMPLETED
  REJECTED
}

enum QCStatus {
  PENDING
  PASSED
  FAILED
  PARTIAL_PASS
}

type PalletConnection {
  edges: [PalletEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PalletEdge {
  cursor: String!
  node: Pallet!
}

type GRNConnection {
  edges: [GRNEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type GRNEdge {
  cursor: String!
  node: GRN!
}

input PalletFilterInput {
  pltNum: String
  productCode: String
  location: String
  status: PalletStatus
  grnNumber: String
  dateRange: DateRangeInput
}

input InventoryFilterInput {
  productCode: String
  minQuantity: Int
  maxQuantity: Int
  hasAwaitQuantity: Boolean
  location: LocationType
}

input GRNFilterInput {
  grnNumber: String
  supplierCode: String
  status: GRNStatus
  qcStatus: QCStatus
  dateRange: DateRangeInput
}

type StockLevelData implements CardData {
  items: [StockLevelItem!]!
  totalItems: Int!
  totalQuantity: Int!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type StockLevelItem {
  productCode: String!
  productName: String!
  quantity: Int!
  location: String!
  lastUpdated: DateTime!
}
`;

export const operationsSchema = `
# Operations GraphQL Schema

# 核心業務表類型定義

# 1. data_slateinfo - 石板信息表
type SlateInfo {
  # 對應 data_slateinfo 表的實際欄位
  productCode: String!      # data_slateinfo.product_code (text, NOT NULL) - 產品代碼
  description: String       # data_slateinfo.description (text, nullable) - 產品描述
  toolNum: String          # data_slateinfo.tool_num (text, nullable) - 工具編號
  weight: String           # data_slateinfo.weight (text, nullable) - 重量
  thicknessTop: String     # data_slateinfo.thickness_top (text, nullable) - 頂部厚度
  thicknessBottom: String  # data_slateinfo.thickness_bottom (text, nullable) - 底部厚度
  length: String           # data_slateinfo.length (text, nullable) - 長度
  width: String            # data_slateinfo.width (text, nullable) - 寬度
  holeToBottom: String     # data_slateinfo.hole_to_bottom (text, nullable) - 孔到底部距離
  colour: String           # data_slateinfo.colour (text, nullable) - 顏色
  shapes: String           # data_slateinfo.shapes (text, nullable) - 形狀
  uuid: ID!                # data_slateinfo.uuid (uuid, NOT NULL) - 唯一標識
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product         # 關聯的產品信息
}

# 2. record_aco - ACO記錄表
type AcoRecord {
  # 對應 record_aco 表的實際欄位
  uuid: ID!                # record_aco.uuid (uuid, NOT NULL) - 唯一標識
  orderRef: Int!           # record_aco.order_ref (bigint, NOT NULL) - 訂單參考號
  code: String!            # record_aco.code (text, NOT NULL) - 產品代碼
  requiredQty: Int!        # record_aco.required_qty (bigint, NOT NULL) - 需要數量
  finishedQty: Int         # record_aco.finished_qty (bigint, nullable, default: 0) - 完成數量
  latestUpdate: DateTime!  # record_aco.latest_update (timestamp with time zone, NOT NULL) - 最後更新時間
  
  # 計算欄位
  remainingQty: Int!       # 剩餘數量 (requiredQty - finishedQty)
  completionRate: Float!   # 完成率 (finishedQty / requiredQty * 100)
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product         # 關聯的產品信息
}

# 3. record_stocktake - 盤點記錄表
type StocktakeRecord {
  # 對應 record_stocktake 表的實際欄位
  uuid: ID!                # record_stocktake.uuid (uuid, NOT NULL) - 唯一標識
  productCode: String!     # record_stocktake.product_code (text, NOT NULL) - 產品代碼
  pltNum: String           # record_stocktake.plt_num (text, nullable) - 托盤號碼
  productDesc: String!     # record_stocktake.product_desc (text, NOT NULL) - 產品描述
  remainQty: Int           # record_stocktake.remain_qty (bigint, nullable) - 剩餘數量
  countedQty: Int          # record_stocktake.counted_qty (bigint, nullable, default: 0) - 盤點數量
  countedId: Int           # record_stocktake.counted_id (integer, nullable) - 盤點人員ID
  countedName: String      # record_stocktake.counted_name (text, nullable) - 盤點人員名稱
  createdAt: DateTime      # record_stocktake.created_at (timestamp with time zone, nullable) - 創建時間
  
  # 計算欄位
  variance: Int            # 差異數量 (countedQty - remainQty)
  variancePercentage: Float # 差異百分比
  status: StocktakeStatus! # 盤點狀態
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product         # 關聯的產品信息
  pallet: Pallet           # 關聯的托盤信息 (如果有 pltNum)
  counter: User            # 盤點人員信息 (如果有 countedId)
}

# 4. order_loading_history - 訂單裝載歷史表
type OrderLoadingHistory {
  # 對應 order_loading_history 表的實際欄位
  uuid: ID!                # order_loading_history.uuid (uuid, NOT NULL) - 唯一標識
  orderRef: String!        # order_loading_history.order_ref (text, NOT NULL) - 訂單參考號
  palletNum: String!       # order_loading_history.pallet_num (text, NOT NULL) - 托盤號碼
  productCode: String!     # order_loading_history.product_code (text, NOT NULL) - 產品代碼
  quantity: Int!           # order_loading_history.quantity (integer, NOT NULL) - 數量
  actionType: String!      # order_loading_history.action_type (text, NOT NULL) - 操作類型
  actionBy: String!        # order_loading_history.action_by (text, NOT NULL) - 操作人員
  actionTime: DateTime     # order_loading_history.action_time (timestamp with time zone, nullable) - 操作時間
  remark: String           # order_loading_history.remark (text, nullable) - 備註
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product         # 關聯的產品信息
  pallet: Pallet           # 關聯的托盤信息
  operator: User           # 操作人員信息
}

# 5. grn_level - GRN層級表
type GrnLevel {
  # 對應 grn_level 表的實際欄位
  uuid: ID!                # grn_level.uuid (uuid, NOT NULL) - 唯一標識
  latestUpdate: DateTime!  # grn_level.latest_update (timestamp with time zone, NOT NULL) - 最後更新時間
  totalGross: Int!         # grn_level.total_gross (bigint, NOT NULL, default: 0) - 總毛重
  totalUnit: Int!          # grn_level.total_unit (bigint, NOT NULL, default: 0) - 總單位數
  grnRef: Int              # grn_level.grn_ref (bigint, nullable) - GRN參考號
  totalNet: Int            # grn_level.total_net (bigint, nullable, default: 0) - 總淨重
  
  # 計算欄位
  averageWeight: Float     # 平均重量 (totalGross / totalUnit)
  netToGrossRatio: Float   # 淨重/毛重比率
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  grn: GRN                 # 關聯的GRN信息 (如果有 grnRef)
}

# 枚舉類型定義

enum StocktakeStatus {
  NOT_COUNTED    # 未盤點
  COUNTED        # 已盤點
  VARIANCE       # 有差異
  APPROVED       # 已批准
  REJECTED       # 已拒絕
}

enum OrderLoadingActionType {
  LOAD           # 裝載
  UNLOAD         # 卸載
  TRANSFER       # 轉移
  ADJUST         # 調整
}

# 連接類型 (分頁支持)

type SlateInfoConnection {
  edges: [SlateInfoEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type SlateInfoEdge {
  cursor: String!
  node: SlateInfo!
}

type AcoRecordConnection {
  edges: [AcoRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type AcoRecordEdge {
  cursor: String!
  node: AcoRecord!
}

type StocktakeRecordConnection {
  edges: [StocktakeRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type StocktakeRecordEdge {
  cursor: String!
  node: StocktakeRecord!
}

type OrderLoadingHistoryConnection {
  edges: [OrderLoadingHistoryEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OrderLoadingHistoryEdge {
  cursor: String!
  node: OrderLoadingHistory!
}

type GrnLevelConnection {
  edges: [GrnLevelEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type GrnLevelEdge {
  cursor: String!
  node: GrnLevel!
}

# 輸入類型定義

input SlateInfoFilterInput {
  productCode: String
  description: String
  toolNum: String
  colour: String
  shapes: String
  hasWeight: Boolean
  hasDimensions: Boolean
}

input AcoRecordFilterInput {
  orderRef: Int
  code: String
  completionStatus: CompletionStatus
  minRequiredQty: Int
  maxRequiredQty: Int
  dateRange: DateRangeInput
}

input StocktakeRecordFilterInput {
  productCode: String
  pltNum: String
  countedBy: String
  status: StocktakeStatus
  hasVariance: Boolean
  minVariancePercentage: Float
  dateRange: DateRangeInput
}

input OrderLoadingHistoryFilterInput {
  orderRef: String
  palletNum: String
  productCode: String
  actionType: OrderLoadingActionType
  actionBy: String
  dateRange: DateRangeInput
}

input GrnLevelFilterInput {
  grnRef: Int
  minTotalUnit: Int
  maxTotalUnit: Int
  dateRange: DateRangeInput
}

enum CompletionStatus {
  PENDING      # 待處理 (finishedQty < requiredQty)
  COMPLETED    # 已完成 (finishedQty >= requiredQty)
  OVERDELIVERED # 超額完成 (finishedQty > requiredQty)
}

# 創建和更新輸入類型

input CreateSlateInfoInput {
  productCode: String!
  description: String
  toolNum: String
  weight: String
  thicknessTop: String
  thicknessBottom: String
  length: String
  width: String
  holeToBottom: String
  colour: String
  shapes: String
}

input UpdateSlateInfoInput {
  description: String
  toolNum: String
  weight: String
  thicknessTop: String
  thicknessBottom: String
  length: String
  width: String
  holeToBottom: String
  colour: String
  shapes: String
}

input CreateAcoRecordInput {
  orderRef: Int!
  code: String!
  requiredQty: Int!
  finishedQty: Int
}

input UpdateAcoRecordInput {
  requiredQty: Int
  finishedQty: Int
}

input CreateStocktakeRecordInput {
  productCode: String!
  pltNum: String
  productDesc: String!
  remainQty: Int
  countedQty: Int
  countedId: Int
  countedName: String
}

input UpdateStocktakeRecordInput {
  countedQty: Int
  countedId: Int
  countedName: String
  remark: String
}

input CreateOrderLoadingHistoryInput {
  orderRef: String!
  palletNum: String!
  productCode: String!
  quantity: Int!
  actionType: OrderLoadingActionType!
  actionBy: String!
  remark: String
}

input CreateGrnLevelInput {
  totalGross: Int!
  totalUnit: Int!
  grnRef: Int
  totalNet: Int
}

input UpdateGrnLevelInput {
  totalGross: Int
  totalUnit: Int
  totalNet: Int
}

# 批量操作輸入類型

input BatchStocktakeUpdateInput {
  uuid: ID!
  countedQty: Int!
  countedId: Int
  countedName: String
  remark: String
}

# 批量操作結果類型

type BatchStocktakeResult {
  successful: Int!
  failed: Int!
  errors: [BatchStocktakeError!]
  records: [StocktakeRecord!]!
  totalVariance: Int!
  totalVarianceValue: Float
}

type BatchStocktakeError {
  uuid: ID!
  error: String!
  record: StocktakeRecord
}

# 匯總和統計類型

type GrnLevelSummary {
  totalRecords: Int!
  totalGrossWeight: Int!
  totalNetWeight: Int!
  totalUnits: Int!
  averageGrossWeight: Float!
  averageNetWeight: Float!
  averageNetToGrossRatio: Float!
  lastUpdated: DateTime!
  byGrnRef: [GrnRefSummary!]!
}

type GrnRefSummary {
  grnRef: Int!
  recordCount: Int!
  totalGross: Int!
  totalNet: Int!
  totalUnits: Int!
  lastUpdated: DateTime!
}

# 統計分析類型

type SlateInfoStatistics {
  totalProducts: Int!
  productsWithWeight: Int!
  productsWithDimensions: Int!
  averageWeight: Float
  averageThickness: Float
  commonColours: [ColourCount!]!
  commonShapes: [ShapeCount!]!
}

type ColourCount {
  colour: String!
  count: Int!
  percentage: Float!
}

type ShapeCount {
  shape: String!
  count: Int!
  percentage: Float!
}

type AcoRecordSummary {
  totalOrders: Int!
  completedOrders: Int!
  pendingOrders: Int!
  overdeliveredOrders: Int!
  totalRequiredQty: Int!
  totalFinishedQty: Int!
  averageCompletionRate: Float!
  topProductsByVolume: [AcoProductSummary!]!
}

type AcoProductSummary {
  productCode: String!
  orderCount: Int!
  totalRequired: Int!
  totalFinished: Int!
  completionRate: Float!
}

type StocktakeVarianceSummary {
  totalRecords: Int!
  recordsWithVariance: Int!
  totalVariance: Int!
  totalVarianceValue: Float
  averageVariancePercentage: Float!
  topVarianceProducts: [VarianceProductSummary!]!
}

type VarianceProductSummary {
  productCode: String!
  productDesc: String!
  recordCount: Int!
  totalVariance: Int!
  averageVariancePercentage: Float!
}

type OrderLoadingSummary {
  totalRecords: Int!
  totalQuantityLoaded: Int!
  totalQuantityUnloaded: Int!
  netQuantityChange: Int!
  uniqueOrders: Int!
  uniqueProducts: Int!
  uniquePallets: Int!
  topOperators: [OperatorLoadingSummary!]!
  dailyActivity: [DailyLoadingActivity!]!
}

type OperatorLoadingSummary {
  operatorName: String!
  totalActions: Int!
  totalQuantity: Int!
  loadActions: Int!
  unloadActions: Int!
  lastActivity: DateTime!
}

type DailyLoadingActivity {
  date: DateTime!
  totalActions: Int!
  totalQuantity: Int!
  uniqueOrders: Int!
  uniqueOperators: Int!
}

# =============================================================================
# 業務支援表類型定義 (9個表)
# =============================================================================

# 1. report_void - 報廢記錄表
type ReportVoid {
  # 對應 report_void 表的實際欄位
  uuid: ID!                   # report_void.uuid (uuid, NOT NULL) - 唯一標識
  time: DateTime!              # report_void.time (timestamp with time zone, NOT NULL) - 報廢時間
  pltNum: String!              # report_void.plt_num (text, NOT NULL) - 托盤編號
  reason: String!              # report_void.reason (text, NOT NULL) - 報廢原因
  damageQty: Int!              # report_void.damage_qty (integer, NOT NULL) - 損壞數量
  
  # 創建和更新時間戳
  createdAt: DateTime!
  updatedAt: DateTime!
}

"""
庫存水平記錄 (stock_level 表) - 產品庫存管理
記錄系統中各產品的當前庫存水平，用於庫存監控和補貨決策
每筆記錄代表一個產品的庫存狀況快照
"""
type StockLevel {
  # === 數據庫實際欄位 ===
  """記錄唯一標識符 (主鍵)"""
  uuid: ID!
  
  """產品庫存代碼，用於識別不同的產品"""
  stock: String!
  
  """產品描述或名稱"""
  description: String!
  
  """當前庫存數量"""
  stockLevel: Int!
  
  """最後更新時間，反映庫存數據的時效性"""
  updateTime: DateTime!
  
  # === 計算欄位 (透過 resolver 動態計算) ===
  """低庫存警告標誌，基於預設的庫存閾值判定"""
  isLowStock: Boolean!
  
  """庫存狀態分類 (正常/低庫存/缺貨/超庫存等)"""
  stockStatus: StockStatus!
  
  # 注意：createdAt 和 updatedAt 欄位已移除
  # 原因：stock_level 資料庫表中不存在這些欄位
  # 如需要時間參考，請使用 updateTime 欄位
}

# 3. pallet_number_buffer - 托盤編號管理表
type PalletNumberBuffer {
  # 對應 pallet_number_buffer 表的實際欄位
  id: Int!                     # pallet_number_buffer.id (integer, NOT NULL) - 主鍵
  palletNumber: String!        # pallet_number_buffer.pallet_number (text, NOT NULL) - 托盤編號
  series: String!              # pallet_number_buffer.series (text, NOT NULL) - 系列
  dateStr: String!             # pallet_number_buffer.date_str (text, NOT NULL) - 日期字符串
  used: String!                # pallet_number_buffer.used (text, NOT NULL, default: 'False') - 使用狀態
  updatedAt: DateTime          # pallet_number_buffer.updated_at (timestamp with time zone) - 更新時間
  
  # 計算字段
  isUsed: Boolean!             # 基於 used 字段的布爾值
  isExpired: Boolean!          # 基於日期的過期狀態
  
  # 創建時間戳
  createdAt: DateTime!
}

# 4. query_record - 查詢記錄表
type QueryRecord {
  # 對應 query_record 表的實際欄位
  uuid: ID!                   # query_record.uuid (uuid, NOT NULL) - 唯一標識
  createdAt: DateTime!         # query_record.created_at (timestamp with time zone, NOT NULL) - 創建時間
  query: String!               # query_record.query (text, NOT NULL) - 查詢內容
  answer: String!              # query_record.answer (text, NOT NULL) - 回答內容
  user: String!                # query_record.user (text, NOT NULL) - 用戶
  token: Int!                  # query_record.token (bigint, NOT NULL) - 令牌數量
  sqlQuery: String!            # query_record.sql_query (text, NOT NULL, default: '-') - SQL查詢
  resultJson: JSON             # query_record.result_json (jsonb) - 結果JSON
  queryHash: String            # query_record.query_hash (text) - 查詢哈希
  executionTime: Int           # query_record.execution_time (integer) - 執行時間
  rowCount: Int                # query_record.row_count (integer) - 行數
  complexity: String           # query_record.complexity (text) - 複雜度
  sessionId: String            # query_record.session_id (text) - 會話ID
  fuzzyHash: String            # query_record.fuzzy_hash (character varying) - 模糊哈希
  expiredAt: DateTime          # query_record.expired_at (timestamp with time zone) - 過期時間
  expiredReason: String        # query_record.expired_reason (text) - 過期原因
  
  # 計算字段
  isExpired: Boolean!          # 基於 expired_at 的過期狀態
  hasResults: Boolean!         # 基於 result_json 的結果存在狀態
  queryType: QueryType!        # 基於查詢內容的類型分析
  
  # 更新時間戳
  updatedAt: DateTime!
}

# 5. API - 系統配置表
type APIConfig {
  # 對應 API 表的實際欄位
  uuid: ID!                   # API.uuid (uuid, NOT NULL) - 唯一標識
  name: String!                # API.name (text, NOT NULL) - 配置名稱
  value: String!               # API.value (text, NOT NULL) - 配置值
  description: String          # API.description (text) - 描述
  
  # 計算字段
  isActive: Boolean!           # 基於業務規則的激活狀態
  configType: APIConfigType!   # 配置類型
  
  # 創建和更新時間戳
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 6. cache_invalidation_events - 緩存管理表
type CacheInvalidationEvent {
  # 對應 cache_invalidation_events 表的實際欄位
  id: ID!                     # cache_invalidation_events.id (uuid, NOT NULL) - 唯一標識
  eventType: String!           # cache_invalidation_events.event_type (character varying, NOT NULL) - 事件類型
  tableName: String!           # cache_invalidation_events.table_name (character varying, NOT NULL) - 表名
  operation: String!           # cache_invalidation_events.operation (character varying, NOT NULL) - 操作類型
  recordId: String             # cache_invalidation_events.record_id (text) - 記錄ID
  changedColumns: [String!]    # cache_invalidation_events.changed_columns (ARRAY) - 變更欄位
  createdAt: DateTime          # cache_invalidation_events.created_at (timestamp with time zone, default: now()) - 創建時間
  processed: Boolean           # cache_invalidation_events.processed (boolean, default: false) - 處理狀態
  cacheKeys: [String!]         # cache_invalidation_events.cache_keys (ARRAY) - 緩存鍵
  
  # 計算字段
  isProcessed: Boolean!        # 基於 processed 字段
  processingDelay: Int         # 處理延遲時間（秒）
  
  # 更新時間戳
  updatedAt: DateTime!
}

# 7. db_performance_metrics - 數據庫性能表
type DatabasePerformanceMetric {
  # 對應 db_performance_metrics 表的實際欄位
  id: ID!                     # db_performance_metrics.id (uuid, NOT NULL) - 唯一標識
  metricName: String!          # db_performance_metrics.metric_name (character varying, NOT NULL) - 指標名稱
  metricValue: Float!          # db_performance_metrics.metric_value (numeric, NOT NULL) - 指標值
  metricUnit: String           # db_performance_metrics.metric_unit (character varying) - 指標單位
  tableName: String            # db_performance_metrics.table_name (character varying) - 表名
  queryType: String            # db_performance_metrics.query_type (character varying) - 查詢類型
  executionTimeMs: Float       # db_performance_metrics.execution_time_ms (numeric) - 執行時間（毫秒）
  recordedAt: DateTime         # db_performance_metrics.recorded_at (timestamp with time zone, default: now()) - 記錄時間
  metadata: JSON               # db_performance_metrics.metadata (jsonb) - 元數據
  
  # 計算字段
  performanceRating: PerformanceRating! # 基於指標值的性能評級
  isSlowQuery: Boolean!        # 基於執行時間的慢查詢標記
  
  # 創建和更新時間戳
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 8. query_performance_metrics - 查詢性能表
type QueryPerformanceMetric {
  # 對應 query_performance_metrics 表的實際欄位
  id: ID!                     # query_performance_metrics.id (uuid, NOT NULL) - 唯一標識
  functionName: String!        # query_performance_metrics.function_name (text, NOT NULL) - 函數名稱
  executionTimeMs: Float!      # query_performance_metrics.execution_time_ms (numeric, NOT NULL) - 執行時間（毫秒）
  parameters: JSON             # query_performance_metrics.parameters (jsonb) - 參數
  resultCount: Int             # query_performance_metrics.result_count (integer) - 結果數量
  memoryUsageMb: Float         # query_performance_metrics.memory_usage_mb (numeric) - 內存使用（MB）
  createdAt: DateTime          # query_performance_metrics.created_at (timestamp without time zone, default: now()) - 創建時間
  userId: Int                  # query_performance_metrics.user_id (integer) - 用戶ID
  sessionId: String            # query_performance_metrics.session_id (text) - 會話ID
  cacheHit: Boolean            # query_performance_metrics.cache_hit (boolean, default: false) - 緩存命中
  queryComplexity: String      # query_performance_metrics.query_complexity (text) - 查詢複雜度
  errorOccurred: Boolean       # query_performance_metrics.error_occurred (boolean, default: false) - 是否發生錯誤
  errorMessage: String         # query_performance_metrics.error_message (text) - 錯誤信息
  
  # 計算字段
  performanceScore: Float!     # 基於執行時間和結果數量的性能分數
  isCacheOptimized: Boolean!   # 基於緩存命中的優化狀態
  hasError: Boolean!           # 基於 error_occurred 字段
  
  # 更新時間戳
  updatedAt: DateTime!
}

# 9. threat_stats - 威脅統計表
type ThreatStat {
  # 對應 threat_stats 表的實際欄位
  id: Int!                    # threat_stats.id (bigint, NOT NULL) - 主鍵
  eventDate: Date!             # threat_stats.event_date (date, NOT NULL) - 事件日期
  eventType: String!           # threat_stats.event_type (text, NOT NULL) - 事件類型
  severity: String!            # threat_stats.severity (text, NOT NULL) - 嚴重性
  ipAddress: String!           # threat_stats.ip_address (inet, NOT NULL) - IP地址
  occurrenceCount: Int         # threat_stats.occurrence_count (integer, default: 1) - 發生次數
  firstOccurrence: DateTime    # threat_stats.first_occurrence (timestamp with time zone, default: now()) - 首次發生
  lastOccurrence: DateTime     # threat_stats.last_occurrence (timestamp with time zone, default: now()) - 最後發生
  createdAt: DateTime          # threat_stats.created_at (timestamp with time zone, default: now()) - 創建時間
  updatedAt: DateTime          # threat_stats.updated_at (timestamp with time zone, default: now()) - 更新時間
  
  # 計算字段
  isRecent: Boolean!           # 基於 last_occurrence 的近期威脅標記
  riskLevel: ThreatRiskLevel!  # 基於嚴重性和發生頻率的風險等級
  isBlocked: Boolean!          # 基於IP地址和威脅類型的封鎖狀態
}

# =============================================================================
# 業務支援表枚舉定義
# =============================================================================

# 庫存狀態枚舉
enum StockStatus {
  NORMAL              # 正常庫存
  LOW                # 低庫存
  CRITICAL           # 緊急低庫存
  OUT_OF_STOCK       # 無庫存
  OVERSTOCK          # 過量庫存
  RESERVED           # 預留庫存
}

# 查詢類型枚舉
enum QueryType {
  SELECT             # 查詢操作
  INSERT             # 插入操作
  UPDATE             # 更新操作
  DELETE             # 刪除操作
  ANALYSIS           # 分析查詢
  REPORT             # 報表查詢
  SYSTEM             # 系統查詢
}

# API配置類型枚舉
enum APIConfigType {
  SYSTEM             # 系統配置
  DATABASE           # 數據庫配置
  SECURITY           # 安全配置
  PERFORMANCE        # 性能配置
  INTEGRATION        # 集成配置
  FEATURE_FLAG       # 功能開關
}

# 性能評級枚舉
enum PerformanceRating {
  EXCELLENT          # 優秀
  GOOD              # 良好
  AVERAGE           # 平均
  POOR              # 較差
  CRITICAL          # 嚴重問題
}

# 威脅風險等級枚舉
enum ThreatRiskLevel {
  LOW               # 低風險
  MEDIUM            # 中等風險
  HIGH              # 高風險
  CRITICAL          # 嚴重威脅
}

# =============================================================================
# 業務支援表連接類型 (分頁支持)
# =============================================================================

type ReportVoidConnection {
  edges: [ReportVoidEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ReportVoidEdge {
  cursor: String!
  node: ReportVoid!
}

type StockLevelConnection {
  edges: [StockLevelEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type StockLevelEdge {
  cursor: String!
  node: StockLevel!
}

type PalletNumberBufferConnection {
  edges: [PalletNumberBufferEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PalletNumberBufferEdge {
  cursor: String!
  node: PalletNumberBuffer!
}

type QueryRecordConnection {
  edges: [QueryRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type QueryRecordEdge {
  cursor: String!
  node: QueryRecord!
}

type APIConfigConnection {
  edges: [APIConfigEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type APIConfigEdge {
  cursor: String!
  node: APIConfig!
}

type CacheInvalidationEventConnection {
  edges: [CacheInvalidationEventEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CacheInvalidationEventEdge {
  cursor: String!
  node: CacheInvalidationEvent!
}

type DatabasePerformanceMetricConnection {
  edges: [DatabasePerformanceMetricEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type DatabasePerformanceMetricEdge {
  cursor: String!
  node: DatabasePerformanceMetric!
}

type QueryPerformanceMetricConnection {
  edges: [QueryPerformanceMetricEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type QueryPerformanceMetricEdge {
  cursor: String!
  node: QueryPerformanceMetric!
}

type ThreatStatConnection {
  edges: [ThreatStatEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ThreatStatEdge {
  cursor: String!
  node: ThreatStat!
}

# =============================================================================
# 業務支援表輸入類型定義
# =============================================================================

# 報廢記錄過濾輸入
input ReportVoidFilterInput {
  pltNum: String
  reason: String
  minDamageQty: Int
  maxDamageQty: Int
  dateRange: DateRangeInput
}

# 庫存水平過濾輸入
input StockLevelFilterInput {
  stock: String
  description: String
  stockStatus: StockStatus
  isLowStock: Boolean
  minStockLevel: Int
  maxStockLevel: Int
  dateRange: DateRangeInput
}

# 托盤編號緩衝區過濾輸入
input PalletNumberBufferFilterInput {
  series: String
  dateStr: String
  isUsed: Boolean
  isExpired: Boolean
  dateRange: DateRangeInput
}

# 查詢記錄過濾輸入
input QueryRecordFilterInput {
  user: String
  queryType: QueryType
  hasResults: Boolean
  isExpired: Boolean
  complexity: String
  sessionId: String
  minExecutionTime: Int
  maxExecutionTime: Int
  dateRange: DateRangeInput
}

# API配置過濾輸入
input APIConfigFilterInput {
  name: String
  configType: APIConfigType
  isActive: Boolean
}

# 緩存失效事件過濾輸入
input CacheInvalidationEventFilterInput {
  eventType: String
  tableName: String
  operation: String
  isProcessed: Boolean
  dateRange: DateRangeInput
}

# 數據庫性能指標過濾輸入
input DatabasePerformanceMetricFilterInput {
  metricName: String
  tableName: String
  queryType: String
  performanceRating: PerformanceRating
  isSlowQuery: Boolean
  minExecutionTime: Float
  maxExecutionTime: Float
  dateRange: DateRangeInput
}

# 查詢性能指標過濾輸入
input QueryPerformanceMetricFilterInput {
  functionName: String
  userId: Int
  sessionId: String
  queryComplexity: String
  hasError: Boolean
  cacheHit: Boolean
  minExecutionTime: Float
  maxExecutionTime: Float
  minMemoryUsage: Float
  maxMemoryUsage: Float
  dateRange: DateRangeInput
}

# 威脅統計過濾輸入
input ThreatStatFilterInput {
  eventType: String
  severity: String
  ipAddress: String
  riskLevel: ThreatRiskLevel
  isRecent: Boolean
  isBlocked: Boolean
  minOccurrenceCount: Int
  maxOccurrenceCount: Int
  dateRange: DateRangeInput
}

# =============================================================================
# 業務支援表創建和更新輸入類型
# =============================================================================

# 創建報廢記錄輸入
input CreateReportVoidInput {
  pltNum: String!
  reason: String!
  damageQty: Int!
}

# 更新報廢記錄輸入
input UpdateReportVoidInput {
  reason: String
  damageQty: Int
}

# 創建庫存水平輸入
input CreateStockLevelInput {
  stock: String!
  description: String!
  stockLevel: Int!
}

# 更新庫存水平輸入
input UpdateStockLevelInput {
  description: String
  stockLevel: Int
}

# 創建托盤編號緩衝區輸入
input CreatePalletNumberBufferInput {
  palletNumber: String!
  series: String!
  dateStr: String!
}

# 更新托盤編號緩衝區輸入
input UpdatePalletNumberBufferInput {
  used: String
}

# 創建查詢記錄輸入
input CreateQueryRecordInput {
  query: String!
  answer: String!
  user: String!
  token: Int!
  sqlQuery: String
  resultJson: JSON
  queryHash: String
  executionTime: Int
  rowCount: Int
  complexity: String
  sessionId: String
}

# 創建API配置輸入
input CreateAPIConfigInput {
  name: String!
  value: String!
  description: String
}

# 更新API配置輸入
input UpdateAPIConfigInput {
  value: String
  description: String
}

# 創建緩存失效事件輸入
input CreateCacheInvalidationEventInput {
  eventType: String!
  tableName: String!
  operation: String!
  recordId: String
  changedColumns: [String!]
  cacheKeys: [String!]
}

# 創建數據庫性能指標輸入
input CreateDatabasePerformanceMetricInput {
  metricName: String!
  metricValue: Float!
  metricUnit: String
  tableName: String
  queryType: String
  executionTimeMs: Float
  metadata: JSON
}

# 創建查詢性能指標輸入
input CreateQueryPerformanceMetricInput {
  functionName: String!
  executionTimeMs: Float!
  parameters: JSON
  resultCount: Int
  memoryUsageMb: Float
  userId: Int
  sessionId: String
  cacheHit: Boolean
  queryComplexity: String
  errorOccurred: Boolean
  errorMessage: String
}

# 創建威脅統計輸入
input CreateThreatStatInput {
  eventDate: Date!
  eventType: String!
  severity: String!
  ipAddress: String!
  occurrenceCount: Int
}

# 更新威脅統計輸入
input UpdateThreatStatInput {
  eventType: String
  severity: String
  occurrenceCount: Int
}

# 批量更新庫存水平輸入
input BulkStockLevelUpdateInput {
  uuid: ID!
  stockLevel: Int!
  description: String
}

# =============================================================================
# 業務支援表統計和匯總類型
# =============================================================================

# 報廢記錄統計
type ReportVoidSummary {
  totalRecords: Int!
  totalDamageQuantity: Int!
  topReasons: [ReasonSummary!]!
  topPallets: [PalletVoidSummary!]!
  dailyVoidCounts: [DailyVoidCount!]!
}

type ReasonSummary {
  reason: String!
  count: Int!
  totalDamage: Int!
  percentage: Float!
}

type PalletVoidSummary {
  pltNum: String!
  voidCount: Int!
  totalDamage: Int!
  lastVoidDate: DateTime!
}

type DailyVoidCount {
  date: Date!
  count: Int!
  totalDamage: Int!
}

# 庫存水平統計
type StockLevelAnalysis {
  totalProducts: Int!
  lowStockCount: Int!
  criticalStockCount: Int!
  outOfStockCount: Int!
  overstockCount: Int!
  totalStockValue: Float
  averageStockLevel: Float!
  stockDistribution: [StockDistribution!]!
}

type StockDistribution {
  status: StockStatus!
  count: Int!
  percentage: Float!
}

# 查詢性能分析
type QueryPerformanceAnalysis {
  totalQueries: Int!
  averageExecutionTime: Float!
  slowQueryCount: Int!
  cacheHitRate: Float!
  errorRate: Float!
  topSlowFunctions: [SlowFunctionSummary!]!
  performanceByComplexity: [ComplexityPerformance!]!
}

type SlowFunctionSummary {
  functionName: String!
  averageExecutionTime: Float!
  callCount: Int!
  errorCount: Int!
  cacheHitRate: Float!
}

type ComplexityPerformance {
  complexity: String!
  averageExecutionTime: Float!
  queryCount: Int!
}

# 威脅統計分析
type ThreatAnalysis {
  totalThreatEvents: Int!
  uniqueIpCount: Int!
  criticalThreatCount: Int!
  highRiskIpList: [HighRiskIP!]!
  threatTrends: [ThreatTrend!]!
  topThreatTypes: [ThreatTypeSummary!]!
}

type HighRiskIP {
  ipAddress: String!
  totalOccurrences: Int!
  riskLevel: ThreatRiskLevel!
  lastActivity: DateTime!
  threatTypes: [String!]!
}

type ThreatTrend {
  date: Date!
  threatCount: Int!
  uniqueIpCount: Int!
  criticalCount: Int!
}

type ThreatTypeSummary {
  eventType: String!
  count: Int!
  percentage: Float!
  averageSeverity: String!
}

type Transfer {
  # 對應 record_transfer 表的實際欄位
  uuid: ID!              # record_transfer.uuid (uuid, NOT NULL)
  pltNum: String!        # record_transfer.plt_num (text, NOT NULL)
  fromLocation: String!  # record_transfer.f_loc (text, NOT NULL)
  toLocation: String!    # record_transfer.t_loc (text, NOT NULL)
  operatorId: Int!       # record_transfer.operator_id (integer, NOT NULL)
  tranDate: DateTime!    # record_transfer.tran_date (timestamp with time zone, NOT NULL)
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  pallet: Pallet!
  operator: User
}

enum TransferPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

type Order {
  # 對應 data_order 表的實際欄位 (平鋪式結構)
  uuid: ID!              # data_order.uuid (uuid, NOT NULL)
  createdAt: DateTime!   # data_order.created_at (timestamp with time zone, NOT NULL)
  accountNum: String!    # data_order.account_num (text, NOT NULL, default: '-')
  orderRef: String!      # data_order.order_ref (text, NOT NULL, default: '-')
  invoiceTo: String!     # data_order.invoice_to (text, NOT NULL, default: '-')
  deliveryAdd: String!   # data_order.delivery_add (text, NOT NULL, default: '-')
  productCode: String!   # data_order.product_code (text, NOT NULL)
  productDesc: String!   # data_order.product_desc (text, NOT NULL)
  productQty: Int!       # data_order.product_qty (bigint, NOT NULL)
  unitPrice: String!     # data_order.unit_price (text, NOT NULL, default: '-')
  uploadedBy: String!    # data_order.uploaded_by (text, NOT NULL)
  loadedQty: String!     # data_order.loaded_qty (text, NOT NULL, default: '0')
  token: Int!            # data_order.token (bigint, NOT NULL, default: 0)
  weight: Int            # data_order.weight (bigint, nullable)
  customerRef: String    # data_order.customer_ref (text, nullable)
  
  # 關聯數據 (非數據庫欄位，透過 resolver 獲取)
  product: Product
}

type OrderItem {
  productCode: String!
  product: Product!
  quantity: Int!
  unitPrice: Float!
  totalPrice: Float!
  allocatedPallets: [Pallet!]
  status: OrderItemStatus!
}

enum OrderItemStatus {
  PENDING
  ALLOCATED
  PICKING
  PACKED
  SHIPPED
}

enum PaymentStatus {
  PENDING
  PAID
  PARTIAL
  REFUNDED
  CANCELLED
}

enum ShippingStatus {
  PENDING
  PREPARING
  READY
  SHIPPED
  IN_TRANSIT
  DELIVERED
  RETURNED
}

type Customer {
  id: ID!
  code: String!
  name: String!
  contact: String
  email: String
  phone: String
  creditLimit: Float
  currentBalance: Float
  orders: [Order!]
}

type Address {
  street: String!
  city: String!
  state: String
  postalCode: String!
  country: String!
}

# 歷史記錄類型 (record_history 表)
type HistoryRecord {
  # 數據庫實際欄位
  uuid: ID!                    # record_history.uuid (主鍵)
  id: Int!                     # record_history.id (外鍵 → data_id)
  time: DateTime!              # record_history.time (timestamp)
  action: String!              # record_history.action (操作描述)
  pltNum: String               # record_history.plt_num (托盤號，外鍵 → record_palletinfo)
  location: String             # record_history.loc (位置)
  remark: String!              # record_history.remark (備註)
  
  # 關聯數據 (透過 resolver 獲取)
  user: User                   # 透過 id 關聯 data_id 表獲取用戶信息
  pallet: Pallet               # 透過 pltNum 關聯托盤信息
  
  # 向後兼容性欄位 (保留原有API)
  recordType: HistoryType      # 從 action 推斷的類型
  entityType: String           # 從關聯數據推斷
  entityId: String             # pltNum 或其他相關ID
  entityData: JSON             # 包含相關數據的JSON
  
  # 計算欄位
  timestamp: DateTime!         # time 的別名，保持向後兼容
  performedBy: User            # user 的別名，保持向後兼容
  notes: String                # remark 的別名，保持向後兼容
}

type FieldChange {
  field: String!
  oldValue: JSON
  newValue: JSON
}

enum HistoryType {
  PRODUCT
  PALLET
  INVENTORY
  TRANSFER
  ORDER
  GRN
  USER
  SYSTEM
}

# 工作量級類型 (work_level 表)
type WorkLevel {
  # 數據庫實際欄位
  uuid: ID!                    # work_level.uuid (主鍵)
  id: Int!                     # work_level.id (外鍵 → data_id)
  qc: Int!                     # work_level.qc (QC操作計數)
  move: Int!                   # work_level.move (移動操作計數)
  grn: Int!                    # work_level.grn (GRN操作計數)
  loading: Int!                # work_level.loading (裝載操作計數)
  latestUpdate: DateTime!      # work_level.latest_update (最後更新時間)
  
  # 關聯數據 (透過 resolver 獲取)
  user: User!                  # 透過 id 關聯 data_id 表獲取用戶信息
  
  # 計算欄位
  totalOperations: Int!        # qc + move + grn + loading 總計
  mostActiveOperation: WorkOperationType!  # 最活躍的操作類型
  
  # 向後兼容性欄位 (保留原有API)
  userId: ID!                  # id 的別名，保持向後兼容
  date: DateTime!              # latestUpdate 的別名，保持向後兼容
  totalTransfers: Int!         # move 的別名
  totalPalletsHandled: Int!    # move + loading 的組合
  totalQuantityMoved: Int!     # move 的別名
  
  # 性能指標 (可透過歷史數據計算)
  efficiency: Float            # 基於操作數量和時間計算
  productivityScore: Float     # 綜合生產力評分
  dailyAverage: Float          # 日均操作量
  weeklyTrend: Float           # 週趨勢變化
}

# 工作操作類型枚舉
enum WorkOperationType {
  QC                           # 質量檢查
  MOVE                         # 移動操作
  GRN                          # 收貨操作
  LOADING                      # 裝載操作
}

type HourlyBreakdown {
  hour: Int!
  count: Int!
  quantity: Int!
}

type LocationBreakdown {
  location: Location!
  count: Int!
  quantity: Int!
}

type User {
  # 對應 data_id 表的實際欄位
  id: ID!                # data_id.id (integer, NOT NULL)
  uuid: String!          # data_id.uuid (uuid, NOT NULL)
  name: String!          # data_id.name (text, NOT NULL)
  email: String          # data_id.email (text, nullable, default: '')
  department: String!    # data_id.department (text, NOT NULL)
  iconUrl: String        # data_id.icon_url (text, nullable)
  position: String!      # data_id.position (text, NOT NULL, default: 'User')
  
  # 應用層欄位 (非數據庫欄位，透過 resolver 或其他方式提供)
  role: UserRole!        # 可從 position 欄位推導或配置
  isActive: Boolean!     # 透過業務邏輯判斷
  lastLogin: DateTime    # 從 auth 系統獲取
}

enum UserRole {
  ADMIN
  MANAGER
  SUPERVISOR
  OPERATOR
  VIEWER
}

type TransferConnection {
  edges: [TransferEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type TransferEdge {
  cursor: String!
  node: Transfer!
}

type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OrderEdge {
  cursor: String!
  node: Order!
}

input TransferFilterInput {
  transferNumber: String
  pltNum: String
  fromLocation: String
  toLocation: String
  status: TransferStatus
  dateRange: DateRangeInput
  executedBy: ID
}

input OrderFilterInput {
  orderNumber: String
  customerCode: String
  status: OrderStatus
  dateRange: DateRangeInput
  minValue: Float
  maxValue: Float
}

type UnifiedOperationsData implements CardData {
  transfers: [Transfer!]!
  orders: [Order!]!
  pallets: [Pallet!]!
  workLevels: [WorkLevel!]!
  
  summary: OperationsSummary!
  
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type OperationsSummary {
  totalTransfers: Int!
  totalOrders: Int!
  totalPallets: Int!
  activeUsers: Int!
  averageEfficiency: Float!
}

input CreateTransferInput {
  pltNum: String!
  toLocation: String!
  quantity: Int!
  reason: String
  priority: TransferPriority
}
`;

export const analyticsSchema = `
# Analytics GraphQL Schema
type QualityMetrics implements CardData {
  overallScore: Float!
  defectRate: Float!
  firstPassYield: Float!
  
  defectsByType: [DefectTypeMetric!]!
  defectsByProduct: [ProductDefectMetric!]!
  defectTrends: [TrendPoint!]!
  
  totalInspections: Int!
  passedInspections: Int!
  failedInspections: Int!
  pendingInspections: Int!
  
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type DefectTypeMetric {
  type: String!
  count: Int!
  percentage: Float!
  severity: DefectSeverity!
}

type ProductDefectMetric {
  productCode: String!
  product: Product!
  defectCount: Int!
  defectRate: Float!
}

enum DefectSeverity {
  MINOR
  MAJOR
  CRITICAL
}

type EfficiencyMetrics implements CardData {
  overallEfficiency: Float!
  productivityIndex: Float!
  utilizationRate: Float!
  
  efficiencyByDepartment: [DepartmentEfficiency!]!
  efficiencyByShift: [ShiftEfficiency!]!
  efficiencyTrends: [TrendPoint!]!
  
  averageTaskTime: Float!
  tasksPerHour: Float!
  idleTimePercentage: Float!
  
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type DepartmentEfficiency {
  department: String!
  efficiency: Float!
  headcount: Int!
  outputPerPerson: Float!
}

type ShiftEfficiency {
  shift: String!
  efficiency: Float!
  startTime: String!
  endTime: String!
}

type TrendPoint {
  timestamp: DateTime!
  value: Float!
  label: String
}

type UploadStatistics implements CardData {
  todayUploads: Int!
  successRate: Float!
  failureRate: Float!
  averageProcessingTime: Float!
  
  uploadsByType: [UploadTypeMetric!]!
  uploadsByUser: [UserUploadMetric!]!
  errorReasons: [ErrorReason!]!
  
  uploadTrends: [TrendPoint!]!
  
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type UploadTypeMetric {
  type: String!
  count: Int!
  successCount: Int!
  failureCount: Int!
  averageSize: Float!
}

type UserUploadMetric {
  user: User!
  uploadCount: Int!
  successRate: Float!
  lastUpload: DateTime!
}

type ErrorReason {
  reason: String!
  count: Int!
  percentage: Float!
}

type UpdateStatistics implements CardData {
  pendingCount: Int!
  completedToday: Int!
  inProgress: Int!
  failed: Int!
  
  updatesByType: [UpdateTypeMetric!]!
  updatesByStatus: [UpdateStatusMetric!]!
  averageCompletionTime: Float!
  
  backlogTrend: [TrendPoint!]!
  estimatedClearTime: Float!
  
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type UpdateTypeMetric {
  type: String!
  count: Int!
  averageTime: Float!
  successRate: Float!
}

type UpdateStatusMetric {
  status: String!
  count: Int!
  percentage: Float!
}

type SystemPerformance implements CardData {
  averageResponseTime: Float!
  p95ResponseTime: Float!
  p99ResponseTime: Float!
  
  requestsPerSecond: Float!
  transactionsPerMinute: Float!
  
  errorRate: Float!
  errorsByType: [ErrorTypeMetric!]!
  
  cpuUsage: Float!
  memoryUsage: Float!
  diskUsage: Float!
  networkUsage: Float!
  
  servicesHealth: [ServiceHealth!]!
  
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type ErrorTypeMetric {
  errorType: String!
  count: Int!
  percentage: Float!
  lastOccurrence: DateTime!
}

type ServiceHealth {
  serviceName: String!
  status: ServiceStatus!
  uptime: Float!
  lastError: DateTime
  responseTime: Float!
}

enum ServiceStatus {
  HEALTHY
  DEGRADED
  UNHEALTHY
  OFFLINE
}
`;

export const mainSchema = `
# Main GraphQL Schema
type Query {
  # Health check
  health: SystemStatus!
  
  # Card data sources
  cardData(dataSource: String!, params: JSON, timeFrame: DateRangeInput): JSON!
  batchCardData(requests: [CardDataRequest!]!): [CardDataResponse!]!
  
  # Products
  product(code: ID!): Product
  products(filter: ProductFilterInput, pagination: PaginationInput, sort: SortInput): ProductConnection!
  searchProducts(query: String!, limit: Int = 10): [Product!]!
  productStatistics(productCode: ID!, dateRange: DateRangeInput): ProductStatistics!
  
  # Suppliers
  supplier(code: String!): Supplier
  suppliers(filter: SupplierFilterInput, pagination: PaginationInput, sort: SortInput): SupplierConnection!
  searchSuppliers(query: String!, limit: Int = 10): [Supplier!]!
  supplierPerformance(supplierCode: String!, dateRange: DateRangeInput): SupplierPerformance!
  
  # Inventory
  pallet(pltNum: ID!): Pallet
  pallets(filter: PalletFilterInput, pagination: PaginationInput, sort: SortInput): PalletConnection!
  inventory(productCode: ID!): Inventory
  inventories(filter: InventoryFilterInput, pagination: PaginationInput): [Inventory!]!
  stockLevels(warehouse: String, dateRange: DateRangeInput): StockLevelData!
  
  # Operations
  transfer(id: ID!): Transfer
  transfers(filter: TransferFilterInput, pagination: PaginationInput, sort: SortInput): TransferConnection!
  order(orderNumber: String!): Order
  orders(filter: OrderFilterInput, pagination: PaginationInput, sort: SortInput): OrderConnection!
  workLevel(userId: ID!, date: DateTime!): WorkLevel
  workLevels(dateRange: DateRangeInput, userIds: [ID!]): [WorkLevel!]!
  unifiedOperations(warehouse: String, dateRange: DateRangeInput): UnifiedOperationsData!
  
  # 新增的4個表查詢操作
  # 歷史記錄查詢
  historyRecord(uuid: ID!): HistoryRecord
  historyRecords(filter: HistoryRecordFilterInput, pagination: PaginationInput, sort: SortInput): HistoryRecordConnection!
  historyRecordsByPallet(pltNum: String!): [HistoryRecord!]!
  historyRecordsByUser(userId: Int!): [HistoryRecord!]!
  historyRecordsByAction(action: String!): [HistoryRecord!]!
  recentHistoryRecords(limit: Int = 50): [HistoryRecord!]!
  
  # 文件信息查詢
  fileInfo(uuid: ID!): FileInfo
  fileInfos(filter: FileInfoFilterInput, pagination: PaginationInput, sort: SortInput): FileInfoConnection!
  fileInfosByUploader(uploadBy: Int!): [FileInfo!]!
  fileInfosByType(docType: String!): [FileInfo!]!
  fileInfosByFolder(folder: String!): [FileInfo!]!
  recentUploads(limit: Int = 20): [FileInfo!]!
  
  # 工作量級查詢 (增強版本)
  workLevelEnhanced(uuid: ID!): WorkLevel
  workLevelsEnhanced(filter: WorkLevelFilterInput, pagination: PaginationInput, sort: SortInput): WorkLevelConnection!
  workLevelsByUser(userId: Int!): [WorkLevel!]!
  workLevelsSummary(dateRange: DateRangeInput): WorkLevelSummary!
  topPerformers(limit: Int = 10, operationType: WorkOperationType): [WorkLevel!]!
  
  # 收貨記錄查詢
  grnRecord(uuid: ID!): GRNRecord
  grnRecords(filter: GRNRecordFilterInput, pagination: PaginationInput, sort: SortInput): GRNRecordConnection!
  grnRecordsByRef(grnRef: Int!): [GRNRecord!]!
  grnRecordsBySupplier(supCode: String!): [GRNRecord!]!
  grnRecordsByProduct(materialCode: String!): [GRNRecord!]!
  grnRecordsByPallet(pltNum: String!): [GRNRecord!]!
  grnRecordsWithDiscrepancies: [GRNRecord!]!
  
  # 核心業務表查詢
  # 石板信息查詢
  slateInfo(productCode: String, uuid: ID): SlateInfo
  slateInfos(filter: SlateInfoFilterInput, pagination: PaginationInput, sort: SortInput): SlateInfoConnection!
  searchSlateInfos(query: String!, limit: Int = 10): [SlateInfo!]!
  
  # ACO記錄查詢
  acoRecord(uuid: ID, orderRef: Int, code: String): AcoRecord
  acoRecords(filter: AcoRecordFilterInput, pagination: PaginationInput, sort: SortInput): AcoRecordConnection!
  acoRecordsByOrder(orderRef: Int!): [AcoRecord!]!
  acoRecordsByProduct(code: String!): [AcoRecord!]!
  
  # 盤點記錄查詢
  stocktakeRecord(uuid: ID!): StocktakeRecord
  stocktakeRecords(filter: StocktakeRecordFilterInput, pagination: PaginationInput, sort: SortInput): StocktakeRecordConnection!
  stocktakeRecordsByProduct(productCode: String!): [StocktakeRecord!]!
  stocktakeRecordsByPallet(pltNum: String!): [StocktakeRecord!]!
  stocktakeVarianceReport(dateRange: DateRangeInput, minVariancePercentage: Float): [StocktakeRecord!]!
  
  # 訂單裝載歷史查詢
  orderLoadingHistory(uuid: ID!): OrderLoadingHistory
  orderLoadingHistories(filter: OrderLoadingHistoryFilterInput, pagination: PaginationInput, sort: SortInput): OrderLoadingHistoryConnection!
  orderLoadingHistoryByOrder(orderRef: String!): [OrderLoadingHistory!]!
  orderLoadingHistoryByPallet(palletNum: String!): [OrderLoadingHistory!]!
  orderLoadingHistoryByOperator(actionBy: String!, dateRange: DateRangeInput): [OrderLoadingHistory!]!
  
  # GRN層級查詢
  grnLevel(uuid: ID, grnRef: Int): GrnLevel
  grnLevels(filter: GrnLevelFilterInput, pagination: PaginationInput, sort: SortInput): GrnLevelConnection!
  grnLevelsByRef(grnRef: Int!): [GrnLevel!]!
  grnLevelSummary(dateRange: DateRangeInput): GrnLevelSummary!
  
  # 統計分析查詢
  slateInfoStatistics: SlateInfoStatistics!
  acoRecordSummary(dateRange: DateRangeInput): AcoRecordSummary!
  stocktakeVarianceSummary(dateRange: DateRangeInput, minVariancePercentage: Float): StocktakeVarianceSummary!
  orderLoadingSummary(dateRange: DateRangeInput): OrderLoadingSummary!
  
  # =============================================================================
  # 業務支援表查詢 (9個表)
  # =============================================================================
  
  # 報廢記錄查詢
  reportVoid(uuid: ID!): ReportVoid
  reportVoids(filter: ReportVoidFilterInput, pagination: PaginationInput, sort: SortInput): ReportVoidConnection!
  reportVoidsByPallet(pltNum: String!): [ReportVoid!]!
  reportVoidsByReason(reason: String!): [ReportVoid!]!
  reportVoidsByDateRange(dateRange: DateRangeInput!): [ReportVoid!]!
  reportVoidSummary(dateRange: DateRangeInput): ReportVoidSummary!
  
  # 庫存水平查詢
  stockLevelData(uuid: ID!): StockLevel
  stockLevelDatas(filter: StockLevelFilterInput, pagination: PaginationInput, sort: SortInput): StockLevelConnection!
  stockLevelByCode(stock: String!): StockLevel
  lowStockItems(threshold: Int): [StockLevel!]!
  criticalStockItems: [StockLevel!]!
  stockLevelAnalysis(dateRange: DateRangeInput): StockLevelAnalysis!
  
  # 托盤編號緩衝區查詢
  palletNumberBuffer(id: Int!): PalletNumberBuffer
  palletNumberBuffers(filter: PalletNumberBufferFilterInput, pagination: PaginationInput, sort: SortInput): PalletNumberBufferConnection!
  palletNumberBuffersBySeries(series: String!): [PalletNumberBuffer!]!
  availablePalletNumbers(series: String, limit: Int = 10): [PalletNumberBuffer!]!
  usedPalletNumbers(dateRange: DateRangeInput): [PalletNumberBuffer!]!
  expiredPalletNumbers(dateStr: String): [PalletNumberBuffer!]!
  
  # 查詢記錄查詢
  queryRecord(uuid: ID!): QueryRecord
  queryRecords(filter: QueryRecordFilterInput, pagination: PaginationInput, sort: SortInput): QueryRecordConnection!
  queryRecordsByUser(user: String!): [QueryRecord!]!
  queryRecordsBySession(sessionId: String!): [QueryRecord!]!
  expiredQueryRecords: [QueryRecord!]!
  slowQueryRecords(minExecutionTime: Int = 5000): [QueryRecord!]!
  queryRecordsWithResults: [QueryRecord!]!
  queryPerformanceAnalysis(dateRange: DateRangeInput): QueryPerformanceAnalysis!
  
  # API配置查詢
  apiConfig(uuid: ID, name: String): APIConfig
  apiConfigs(filter: APIConfigFilterInput, pagination: PaginationInput, sort: SortInput): APIConfigConnection!
  apiConfigsByType(configType: APIConfigType!): [APIConfig!]!
  activeApiConfigs: [APIConfig!]!
  systemApiConfigs: [APIConfig!]!
  
  # 緩存失效事件查詢
  cacheInvalidationEvent(id: ID!): CacheInvalidationEvent
  cacheInvalidationEvents(filter: CacheInvalidationEventFilterInput, pagination: PaginationInput, sort: SortInput): CacheInvalidationEventConnection!
  unprocessedCacheEvents: [CacheInvalidationEvent!]!
  cacheEventsByTable(tableName: String!): [CacheInvalidationEvent!]!
  recentCacheEvents(hours: Int = 24): [CacheInvalidationEvent!]!
  
  # 數據庫性能指標查詢
  databasePerformanceMetric(id: ID!): DatabasePerformanceMetric
  databasePerformanceMetrics(filter: DatabasePerformanceMetricFilterInput, pagination: PaginationInput, sort: SortInput): DatabasePerformanceMetricConnection!
  slowDatabaseQueries(minExecutionTime: Float = 1000.0): [DatabasePerformanceMetric!]!
  databaseMetricsByTable(tableName: String!): [DatabasePerformanceMetric!]!
  databaseMetricsByType(queryType: String!): [DatabasePerformanceMetric!]!
  databasePerformanceTrends(metricName: String!, dateRange: DateRangeInput): [DatabasePerformanceMetric!]!
  
  # 查詢性能指標查詢
  queryPerformanceMetric(id: ID!): QueryPerformanceMetric
  queryPerformanceMetrics(filter: QueryPerformanceMetricFilterInput, pagination: PaginationInput, sort: SortInput): QueryPerformanceMetricConnection!
  queryPerformanceByFunction(functionName: String!): [QueryPerformanceMetric!]!
  slowQueryPerformances(minExecutionTime: Float = 1000.0): [QueryPerformanceMetric!]!
  queryPerformanceWithErrors: [QueryPerformanceMetric!]!
  queryPerformanceByUser(userId: Int!): [QueryPerformanceMetric!]!
  queryPerformanceBySession(sessionId: String!): [QueryPerformanceMetric!]!
  cacheOptimizedQueries: [QueryPerformanceMetric!]!
  queryPerformanceTrends(functionName: String, dateRange: DateRangeInput): QueryPerformanceAnalysis!
  
  # 威脅統計查詢
  threatStat(id: Int!): ThreatStat
  threatStats(filter: ThreatStatFilterInput, pagination: PaginationInput, sort: SortInput): ThreatStatConnection!
  threatStatsByType(eventType: String!): [ThreatStat!]!
  threatStatsBySeverity(severity: String!): [ThreatStat!]!
  threatStatsByIpAddress(ipAddress: String!): [ThreatStat!]!
  recentThreatStats(days: Int = 7): [ThreatStat!]!
  highRiskThreatStats: [ThreatStat!]!
  criticalThreatStats: [ThreatStat!]!
  blockedIpAddresses: [ThreatStat!]!
  threatAnalysis(dateRange: DateRangeInput): ThreatAnalysis!
  
  # Analytics
  qualityMetrics(dateRange: DateRangeInput, productCodes: [String!]): QualityMetrics!
  efficiencyMetrics(dateRange: DateRangeInput, departments: [String!]): EfficiencyMetrics!
  uploadStatistics(dateRange: DateRangeInput): UploadStatistics!
  updateStatistics(dateRange: DateRangeInput): UpdateStatistics!
  systemPerformance(timeWindow: TimeWindow): SystemPerformance!
  inventoryOrderedAnalysis(input: InventoryOrderedAnalysisInput): InventoryOrderedAnalysisResult!
  historyTree(input: HistoryTreeInput): HistoryTreeResult!
  topProductsByQuantity(input: TopProductsInput): TopProductsResult!
  stockDistribution(input: StockDistributionInput): StockDistributionResult!
}

type Mutation {
  # System operations
  refreshCache(dataSource: String!): Boolean!
  clearCache: Boolean!
  
  # Products
  createProduct(input: CreateProductInput!): Product!
  updateProduct(code: ID!, input: UpdateProductInput!): Product!
  deactivateProduct(code: ID!): Product!
  
  # Suppliers
  createSupplier(input: CreateSupplierInput!): Supplier!
  updateSupplier(code: String!, input: UpdateSupplierInput!): Supplier!
  deactivateSupplier(code: String!): Supplier!
  
  # Operations
  createTransfer(input: CreateTransferInput!): Transfer!
  updateTransferStatus(id: ID!, status: TransferStatus!, notes: String): Transfer!
  cancelTransfer(id: ID!, reason: String!): Transfer!
  
  # 新增的4個表變更操作
  # 歷史記錄變更
  createHistoryRecord(input: CreateHistoryRecordInput!): HistoryRecord!
  updateHistoryRecord(uuid: ID!, input: UpdateHistoryRecordInput!): HistoryRecord!
  deleteHistoryRecord(uuid: ID!): Boolean!
  batchCreateHistoryRecords(records: [CreateHistoryRecordInput!]!): [HistoryRecord!]!
  
  # 文件信息變更
  createFileInfo(input: CreateFileInfoInput!): FileInfo!
  updateFileInfo(uuid: ID!, input: UpdateFileInfoInput!): FileInfo!
  deleteFileInfo(uuid: ID!): Boolean!
  updateFileAnalysis(uuid: ID!, analysisData: JSON!): FileInfo!
  batchDeleteFiles(uuids: [ID!]!): Boolean!
  
  # 工作量級變更
  createWorkLevel(input: CreateWorkLevelInput!): WorkLevel!
  updateWorkLevel(uuid: ID!, input: UpdateWorkLevelInput!): WorkLevel!
  incrementWorkLevel(userId: Int!, operationType: WorkOperationType!, count: Int = 1): WorkLevel!
  resetWorkLevel(uuid: ID!): WorkLevel!
  batchUpdateWorkLevels(updates: [BatchWorkLevelUpdateInput!]!): [WorkLevel!]!
  
  # 收貨記錄變更
  createGRNRecord(input: CreateGRNRecordInput!): GRNRecord!
  updateGRNRecord(uuid: ID!, input: UpdateGRNRecordInput!): GRNRecord!
  verifyGRNRecord(uuid: ID!, verifiedBy: String!): GRNRecord!
  reportDiscrepancy(uuid: ID!, discrepancy: String!, reportedBy: String!): GRNRecord!
  correctGRNRecord(uuid: ID!, corrections: GRNRecordCorrectionInput!): GRNRecord!
  deleteGRNRecord(uuid: ID!): Boolean!
  
  # 核心業務表變更操作
  # 石板信息變更
  createSlateInfo(input: CreateSlateInfoInput!): SlateInfo!
  updateSlateInfo(productCode: String!, input: UpdateSlateInfoInput!): SlateInfo!
  deleteSlateInfo(productCode: String!): Boolean!
  
  # ACO記錄變更
  createAcoRecord(input: CreateAcoRecordInput!): AcoRecord!
  updateAcoRecord(uuid: ID!, input: UpdateAcoRecordInput!): AcoRecord!
  updateAcoRecordProgress(uuid: ID!, finishedQty: Int!): AcoRecord!
  deleteAcoRecord(uuid: ID!): Boolean!
  completeAcoRecord(uuid: ID!): AcoRecord!
  
  # 盤點記錄變更
  createStocktakeRecord(input: CreateStocktakeRecordInput!): StocktakeRecord!
  updateStocktakeRecord(uuid: ID!, input: UpdateStocktakeRecordInput!): StocktakeRecord!
  approveStocktakeRecord(uuid: ID!, approvedBy: String!): StocktakeRecord!
  rejectStocktakeRecord(uuid: ID!, reason: String!, rejectedBy: String!): StocktakeRecord!
  batchUpdateStocktakeRecords(records: [BatchStocktakeUpdateInput!]!): BatchStocktakeResult!
  
  # 訂單裝載歷史變更
  createOrderLoadingHistory(input: CreateOrderLoadingHistoryInput!): OrderLoadingHistory!
  correctOrderLoadingHistory(uuid: ID!, correctedQuantity: Int!, correctedBy: String!, reason: String!): OrderLoadingHistory!
  
  # GRN層級變更
  createGrnLevel(input: CreateGrnLevelInput!): GrnLevel!
  updateGrnLevel(uuid: ID!, input: UpdateGrnLevelInput!): GrnLevel!
  deleteGrnLevel(uuid: ID!): Boolean!
  
  # =============================================================================
  # 業務支援表變更操作 (9個表)
  # =============================================================================
  
  # 報廢記錄變更
  createReportVoid(input: CreateReportVoidInput!): ReportVoid!
  updateReportVoid(uuid: ID!, input: UpdateReportVoidInput!): ReportVoid!
  deleteReportVoid(uuid: ID!): Boolean!
  
  # 庫存水平變更
  createStockLevel(input: CreateStockLevelInput!): StockLevel!
  updateStockLevel(uuid: ID!, input: UpdateStockLevelInput!): StockLevel!
  updateStockLevelQuantity(uuid: ID!, stockLevel: Int!): StockLevel!
  deleteStockLevel(uuid: ID!): Boolean!
  bulkUpdateStockLevels(updates: [BulkStockLevelUpdateInput!]!): [StockLevel!]!
  
  # 托盤編號緩衝區變更
  createPalletNumberBuffer(input: CreatePalletNumberBufferInput!): PalletNumberBuffer!
  updatePalletNumberBuffer(id: Int!, input: UpdatePalletNumberBufferInput!): PalletNumberBuffer!
  markPalletNumberAsUsed(id: Int!): PalletNumberBuffer!
  markPalletNumberAsUnused(id: Int!): PalletNumberBuffer!
  deletePalletNumberBuffer(id: Int!): Boolean!
  generatePalletNumbers(series: String!, count: Int!, dateStr: String!): [PalletNumberBuffer!]!
  
  # 查詢記錄變更
  createQueryRecord(input: CreateQueryRecordInput!): QueryRecord!
  markQueryRecordAsExpired(uuid: ID!, expiredReason: String!): QueryRecord!
  deleteQueryRecord(uuid: ID!): Boolean!
  deleteExpiredQueryRecords: Int!
  bulkDeleteQueryRecords(uuids: [ID!]!): Int!
  
  # API配置變更
  createAPIConfig(input: CreateAPIConfigInput!): APIConfig!
  updateAPIConfig(uuid: ID!, input: UpdateAPIConfigInput!): APIConfig!
  deleteAPIConfig(uuid: ID!): Boolean!
  activateAPIConfig(uuid: ID!): APIConfig!
  deactivateAPIConfig(uuid: ID!): APIConfig!
  
  # 緩存失效事件變更
  createCacheInvalidationEvent(input: CreateCacheInvalidationEventInput!): CacheInvalidationEvent!
  markCacheEventAsProcessed(id: ID!): CacheInvalidationEvent!
  deleteCacheInvalidationEvent(id: ID!): Boolean!
  deleteProcessedCacheEvents(olderThanDays: Int = 7): Int!
  bulkProcessCacheEvents(ids: [ID!]!): [CacheInvalidationEvent!]!
  
  # 數據庫性能指標變更
  createDatabasePerformanceMetric(input: CreateDatabasePerformanceMetricInput!): DatabasePerformanceMetric!
  deleteDatabasePerformanceMetric(id: ID!): Boolean!
  deleteOldDatabaseMetrics(olderThanDays: Int = 30): Int!
  bulkCreateDatabaseMetrics(metrics: [CreateDatabasePerformanceMetricInput!]!): [DatabasePerformanceMetric!]!
  
  # 查詢性能指標變更
  createQueryPerformanceMetric(input: CreateQueryPerformanceMetricInput!): QueryPerformanceMetric!
  deleteQueryPerformanceMetric(id: ID!): Boolean!
  deleteOldQueryMetrics(olderThanDays: Int = 30): Int!
  bulkCreateQueryMetrics(metrics: [CreateQueryPerformanceMetricInput!]!): [QueryPerformanceMetric!]!
  
  # 威脅統計變更
  createThreatStat(input: CreateThreatStatInput!): ThreatStat!
  updateThreatStat(id: Int!, input: UpdateThreatStatInput!): ThreatStat!
  incrementThreatOccurrence(id: Int!): ThreatStat!
  deleteThreatStat(id: Int!): Boolean!
  blockIpAddress(ipAddress: String!, reason: String!): Boolean!
  unblockIpAddress(ipAddress: String!): Boolean!
  deleteOldThreatStats(olderThanDays: Int = 90): Int!
  
  # Batch operations
  batchOperation(operations: [BatchOperationInput!]!): BatchOperationResult!
}

type Subscription {
  inventoryUpdated(productCodes: [String!]): Inventory!
  transferStatusChanged(transferIds: [ID!]): Transfer!
  orderStatusChanged(orderNumbers: [String!]): Order!
  systemAlert(severity: AlertSeverity): SystemAlert!
  
  # 核心業務表訂閱
  slateInfoUpdated(productCodes: [String!]): SlateInfo!
  acoRecordProgressUpdated(orderRefs: [Int!]): AcoRecord!
  acoRecordCompleted(productCodes: [String!]): AcoRecord!
  stocktakeRecordUpdated(productCodes: [String!]): StocktakeRecord!
  stocktakeRecordApproved(productCodes: [String!]): StocktakeRecord!
  orderLoadingActivity(orderRefs: [String!]): OrderLoadingHistory!
  grnLevelUpdated(grnRefs: [Int!]): GrnLevel!
  
  # =============================================================================
  # 業務支援表訂閱 (9個表)
  # =============================================================================
  
  # 報廢記錄訂閱
  reportVoidCreated: ReportVoid!
  reportVoidUpdated(pltNums: [String!]): ReportVoid!
  reportVoidDeleted: ReportVoid!
  
  # 庫存水平訂閱
  stockLevelUpdated(stockCodes: [String!]): StockLevel!
  stockLevelLowAlert(threshold: Int): StockLevel!
  stockLevelCriticalAlert: StockLevel!
  stockLevelChanged(stockCodes: [String!]): StockLevel!
  
  # 托盤編號緩衝區訂閱
  palletNumberBufferCreated(series: [String!]): PalletNumberBuffer!
  palletNumberBufferUsed(series: [String!]): PalletNumberBuffer!
  palletNumberBufferExpired: PalletNumberBuffer!
  
  # 查詢記錄訂閱
  queryRecordCreated(users: [String!]): QueryRecord!
  queryRecordExpired: QueryRecord!
  slowQueryDetected(minExecutionTime: Int): QueryRecord!
  
  # API配置訂閱
  apiConfigUpdated(configNames: [String!]): APIConfig!
  apiConfigActivated: APIConfig!
  apiConfigDeactivated: APIConfig!
  
  # 緩存失效事件訂閱
  cacheInvalidationEventCreated(tableNames: [String!]): CacheInvalidationEvent!
  cacheInvalidationEventProcessed: CacheInvalidationEvent!
  cacheInvalidationRequired(tableNames: [String!]): CacheInvalidationEvent!
  
  # 數據庫性能指標訂閱
  databasePerformanceAlert(minExecutionTime: Float): DatabasePerformanceMetric!
  slowDatabaseQueryDetected: DatabasePerformanceMetric!
  databaseMetricCreated(tableNames: [String!]): DatabasePerformanceMetric!
  
  # 查詢性能指標訂閱
  queryPerformanceAlert(functionNames: [String!]): QueryPerformanceMetric!
  slowQueryPerformanceDetected: QueryPerformanceMetric!
  queryErrorDetected(functionNames: [String!]): QueryPerformanceMetric!
  cachePerformanceUpdate: QueryPerformanceMetric!
  
  # 威脅統計訂閱
  threatStatCreated(eventTypes: [String!]): ThreatStat!
  threatStatUpdated(ipAddresses: [String!]): ThreatStat!
  criticalThreatDetected: ThreatStat!
  highRiskIpDetected: ThreatStat!
  threatStatDeleted: ThreatStat!
}

# Card data request/response types
input CardDataRequest {
  cardId: String!
  dataSource: String!
  params: JSON
  timeFrame: DateRangeInput
}

type CardDataResponse {
  cardId: String!
  data: JSON
  error: Error
  source: DataSourceType!
  executionTime: Float!
  cached: Boolean!
}

enum DataSourceType {
  REST
  GRAPHQL
  CACHE
  AUTO
}

# Batch operation types
input BatchOperationInput {
  operationType: OperationType!
  entityType: String!
  entityIds: [ID!]!
  data: JSON!
}

type BatchOperationResult {
  successful: [OperationResult!]!
  failed: [OperationResult!]!
  totalProcessed: Int!
  totalSucceeded: Int!
  totalFailed: Int!
}

type OperationResult {
  entityId: ID!
  success: Boolean!
  error: Error
  data: JSON
}

enum OperationType {
  CREATE
  UPDATE
  DELETE
  TRANSFER
  ADJUST
  VOID
}

# System alert types
type SystemAlert {
  id: ID!
  severity: AlertSeverity!
  type: AlertType!
  message: String!
  details: JSON
  timestamp: DateTime!
  acknowledged: Boolean!
}

enum AlertSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum AlertType {
  INVENTORY_LOW
  TRANSFER_DELAYED
  QUALITY_ISSUE
  SYSTEM_ERROR
  PERFORMANCE_DEGRADATION
  SECURITY_ALERT
}

# Inventory Ordered Analysis Types
input InventoryOrderedAnalysisInput {
  productType: String
  productCodes: [String!]
  includeLocationBreakdown: Boolean = false
  filterStatus: InventoryStatus
  sortBy: InventoryAnalysisSortField = STATUS
  sortOrder: SortDirection = ASC
}

type InventoryOrderedAnalysisResult {
  success: Boolean!
  summary: InventoryAnalysisSummary!
  data: [InventoryAnalysisItem!]!
  generated_at: DateTime!
}

type InventoryAnalysisSummary {
  total_products: Int!
  total_inventory_value: Int!
  total_outstanding_orders_value: Int!
  overall_fulfillment_rate: Float!
  products_sufficient: Int!
  products_insufficient: Int!
  products_out_of_stock: Int!
  products_no_orders: Int!
}

type InventoryAnalysisItem {
  product_code: String!
  product_description: String!
  product_type: String!
  standard_qty: Int!
  inventory: InventoryDetails!
  orders: OrderDetails!
  analysis: AnalysisMetrics!
}

type InventoryDetails {
  total: Int!
  locations: LocationBreakdown
  last_update: DateTime
}

type LocationBreakdown {
  injection: Int!
  pipeline: Int!
  prebook: Int!
  await: Int!
  fold: Int!
  bulk: Int!
  backcarpark: Int!
  damage: Int!
  await_grn: Int!
}

type OrderDetails {
  total_orders: Int!
  total_ordered_qty: Int!
  total_loaded_qty: Int!
  total_outstanding_qty: Int!
}

type AnalysisMetrics {
  fulfillment_rate: Float!
  inventory_gap: Int!
  status: InventoryStatus!
}

enum InventoryStatus {
  SUFFICIENT
  INSUFFICIENT
  OUT_OF_STOCK
  NO_ORDERS
}

enum InventoryAnalysisSortField {
  STATUS
  FULFILLMENT_RATE
  INVENTORY_GAP
  PRODUCT_CODE
}

enum TimeWindow {
  LAST_5_MINUTES
  LAST_15_MINUTES
  LAST_HOUR
  LAST_24_HOURS
  LAST_7_DAYS
  LAST_30_DAYS
}

# History Tree Types - System Operations History with Hierarchical Structure
input HistoryTreeInput {
  dateRange: DateRangeInput
  actionTypes: [String!]
  userIds: [String!]
  palletNumbers: [String!]
  locations: [String!]
  groupBy: HistoryTreeGroupBy = TIME
  sortBy: HistoryTreeSortField = TIME
  sortOrder: SortDirection = DESC
  limit: Int = 50
  offset: Int = 0
}

type HistoryTreeResult {
  entries: [HistoryEntry!]!
  totalCount: Int!
  hasNextPage: Boolean!
  groupedData: JSON
  limit: Int!
  offset: Int!
  filters: HistoryTreeFilters!
  sort: HistoryTreeSort!
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
  standardQty: Int
}

type HistoryTreeFilters {
  dateRange: DateRange
  actionTypes: [String!]
  userIds: [String!]
  palletNumbers: [String!]
  locations: [String!]
}

type HistoryTreeSort {
  sortBy: HistoryTreeSortField!
  sortOrder: SortDirection!
}

enum HistoryTreeGroupBy {
  TIME
  USER
  ACTION
  LOCATION
}

enum HistoryTreeSortField {
  TIME
  ACTION
  USER
  LOCATION
}

# Top Products by Quantity Types - Product quantity ranking
input TopProductsInput {
  productType: String
  productCodes: [String!]
  limit: Int = 10
  sortOrder: SortDirection = DESC
  includeInactive: Boolean = false
  locationFilter: [String!]
}

type TopProductsResult {
  products: [TopProduct!]!
  totalCount: Int!
  averageQuantity: Float!
  maxQuantity: Int!
  minQuantity: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
}

type TopProduct {
  productCode: String!
  productName: String!
  productType: String!
  colour: String!
  standardQty: Int
  totalQuantity: Int!
  locationQuantities: TopProductLocationQuantities!
  lastUpdated: DateTime!
}

type TopProductLocationQuantities {
  injection: Int!
  pipeline: Int!
  prebook: Int!
  await: Int!
  fold: Int!
  bulk: Int!
  backcarpark: Int!
  damage: Int!
  await_grn: Int!
}

# Stock Distribution Types - Hierarchical stock visualization for Treemap
input StockDistributionInput {
  type: String
  warehouseId: String
  limit: Int = 50
  includeInactive: Boolean = false
}

type StockDistributionResult {
  items: [StockDistributionItem!]!
  totalCount: Int!
  totalStock: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
}

type StockDistributionItem {
  name: String!
  stock: String!
  stockLevel: Float!
  description: String
  type: String
  productCode: String
  percentage: Float!
}
`;

// Chart Schema (embedded to avoid module resolution issues)
export const chartSchema = `
# Chart Related Types
enum ChartType {
  AREA
  BAR
  LINE
  PIE
  DONUT
  SCATTER
  RADAR
  TREEMAP
  MIXED
  HEATMAP
}

enum ChartDatasetType {
  SINGLE
  MULTIPLE
  STACKED
  GROUPED
}

enum TimeGranularity {
  MINUTE
  HOUR
  DAY
  WEEK
  MONTH
  QUARTER
  YEAR
}

enum AggregationType {
  SUM
  AVERAGE
  MIN
  MAX
  COUNT
  MEDIAN
  PERCENTILE
}

type ChartDataPoint {
  x: String!
  y: Float!
  label: String
  value: Float
  metadata: JSON
}

type ChartDataset {
  id: String!
  label: String!
  data: [ChartDataPoint!]!
  color: String
  backgroundColor: String
  borderColor: String
  type: ChartDatasetType
  stack: String
  hidden: Boolean
}

type ChartAxis {
  type: String!
  label: String
  min: Float
  max: Float
  stepSize: Float
  format: String
  display: Boolean
}

type ChartLegend {
  display: Boolean!
  position: String
  align: String
  labels: JSON
}

type ChartTooltip {
  enabled: Boolean!
  mode: String
  intersect: Boolean
  callbacks: JSON
}

type ChartConfig {
  type: ChartType!
  title: String!
  description: String
  responsive: Boolean
  maintainAspectRatio: Boolean
  aspectRatio: Float
  xAxis: ChartAxis
  yAxis: ChartAxis
  legend: ChartLegend
  tooltip: ChartTooltip
  plugins: JSON
  animations: JSON
}

type ChartCardData implements CardData {
  datasets: [ChartDataset!]!
  labels: [String!]
  config: ChartConfig!
  performance: PerformanceMetrics!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

input ChartQueryInput {
  chartTypes: [ChartType!]!
  dateRange: DateRangeInput
  timeGranularity: TimeGranularity
  aggregationType: AggregationType
  groupBy: [String!]
  filters: JSON
  limit: Int
  includeComparison: Boolean
}

input SingleChartQueryInput {
  chartType: ChartType!
  dataSource: String!
  dateRange: DateRangeInput
  timeGranularity: TimeGranularity
  aggregationType: AggregationType
  groupBy: String
  filters: JSON
}

extend type Query {
  chartCardData(input: ChartQueryInput!): ChartCardData!
  chartData(input: SingleChartQueryInput!): ChartCardData!
  availableCharts(category: String): [ChartConfig!]!
}

extend type Subscription {
  chartUpdated(chartTypes: [ChartType!]!): ChartCardData!
}
`;

// Stats Schema
export const statsSchema = `
# Stats Related Types
enum StatsType {
  # 原有統計類型
  YESTERDAY_TRANSFER_COUNT
  AWAIT_LOCATION_QTY
  STILL_IN_AWAIT
  STILL_IN_AWAIT_PERCENTAGE
  PRODUCTION_STATS
  INJECTION_PRODUCTION_STATS
  STAFF_WORKLOAD
  WAREHOUSE_WORK_LEVEL
  TRANSFER_TIME_DISTRIBUTION
  STOCK_LEVEL_HISTORY
  
  # 新Card系統統計類型
  PALLET_COUNT
  QUALITY_SCORE
  EFFICIENCY_RATE
  TRANSFER_COUNT
  INVENTORY_LEVEL
  PENDING_TASKS
  ACTIVE_USERS
  COMPLETION_RATE
  ERROR_RATE
}

enum TrendDirection {
  INCREASING
  DECREASING
  STABLE
}

type TrendData {
  direction: TrendDirection!
  value: Float!
  percentage: Float!
  label: String
}

type ComparisonData {
  previousValue: Float!
  previousLabel: String!
  change: Float!
  changePercentage: Float!
}

type StatsData {
  type: StatsType!
  value: Float!
  label: String!
  unit: String!
  trend: TrendData
  comparison: ComparisonData
  lastUpdated: DateTime!
  dataSource: String!
  optimized: Boolean!
}

type StatsConfig {
  type: StatsType!
  title: String!
  description: String
  icon: String
  refreshInterval: Int
  color: String
}

type PerformanceMetrics {
  totalQueries: Int!
  cachedQueries: Int!
  averageResponseTime: Float!
  dataAge: Int!
}

type StatsCardData implements CardData {
  stats: [StatsData!]!
  configs: [StatsConfig!]!
  performance: PerformanceMetrics!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

input StatsQueryInput {
  types: [StatsType!]!
  dateRange: DateRangeInput
  locationIds: [ID!]
  departmentIds: [ID!]
  includeComparison: Boolean = true
}

input SingleStatQueryInput {
  type: StatsType!
  dateRange: DateRangeInput
  locationId: ID
  departmentId: ID
}

extend type Query {
  statsCardData(input: StatsQueryInput!): StatsCardData!
  statData(input: SingleStatQueryInput!): StatsData!
  availableStats(category: String, includeDisabled: Boolean): [StatsConfig!]!
}

extend type Subscription {
  statsUpdated(types: [StatsType!]!): StatsData!
}
`;

// Table Schema (embedded)
const tableSchema = `
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

# 篩選器類型
input StringFilter {
  field: String!
  operator: StringOperator!
  value: String!
  caseSensitive: Boolean = false
}

input NumberFilter {
  field: String!
  operator: NumberOperator!
  value: Float
  min: Float
  max: Float
}

input DateFilter {
  field: String!
  operator: DateOperator!
  value: DateTime
  startDate: DateTime
  endDate: DateTime
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

input TableFilters {
  stringFilters: [StringFilter!]
  numberFilters: [NumberFilter!]
  dateFilters: [DateFilter!]
  booleanFilters: [BooleanFilter!]
  arrayFilters: [ArrayFilter!]
}

# Output types for filters (separate from input types)
type AppliedTableFilters {
  stringFilters: [AppliedStringFilter!]
  numberFilters: [AppliedNumberFilter!]
  dateFilters: [AppliedDateFilter!]
  booleanFilters: [AppliedBooleanFilter!]
  arrayFilters: [AppliedArrayFilter!]
}

type AppliedStringFilter {
  field: String!
  operator: StringOperator!
  value: String!
  caseSensitive: Boolean!
}

type AppliedNumberFilter {
  field: String!
  operator: NumberOperator!
  value: Float
  min: Float
  max: Float
}

type AppliedDateFilter {
  field: String!
  operator: DateOperator!
  value: DateTime
  startDate: DateTime
  endDate: DateTime
}

type AppliedBooleanFilter {
  field: String!
  value: Boolean!
}

type AppliedArrayFilter {
  field: String!
  operator: ArrayOperator!
  values: [String!]!
}

input TableSorting {
  sortBy: String!
  sortOrder: SortDirection!
  secondarySort: TableSorting
}

# Output type for sorting (separate from input type)
type AppliedTableSorting {
  sortBy: String!
  sortOrder: SortDirection!
  secondarySort: AppliedTableSorting
}

input TablePagination {
  limit: Int! = 20
  offset: Int! = 0
  cursor: String
  style: PaginationStyle = OFFSET
  loadMore: Boolean = false
}

input TableDataInput {
  dataSource: String!
  filters: TableFilters
  sorting: TableSorting
  pagination: TablePagination!
  columns: [String!]
  dateRange: DateRangeInput
  searchTerm: String
  includeMetadata: Boolean = true
}

scalar TableRow

type TablePermissions {
  canView: Boolean!
  canEdit: Boolean!
  canDelete: Boolean!
  canCreate: Boolean!
  canExport: Boolean!
  canFilter: Boolean!
  canSort: Boolean!
}

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

type TableCardData implements CardData {
  data: [TableRow!]!
  columns: [TableColumn!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  currentPage: Int
  totalPages: Int
  filters: AppliedTableFilters
  sorting: AppliedTableSorting
  metadata: TableMetadata!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

extend type Query {
  tableCardData(input: TableDataInput!): TableCardData!
  tableColumns(dataSource: String!): [TableColumn!]!
  tablePermissions(dataSource: String!): TablePermissions!
}

extend type Mutation {
  exportTableData(input: ExportTableInput!): ExportResult!
  clearTableCache(dataSource: String!): Boolean!
  refreshTableData(dataSource: String!): Boolean!
}

extend type Subscription {
  tableDataUpdated(dataSource: String!): TableCardData!
}

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
`;

export const reportSchema = `
# Report-related types for ReportCard
# Consolidates ReportGeneratorCard + TransactionReportCard + analysis reports

# 報表類型枚舉
enum ReportType {
  TRANSACTION_REPORT    # TransactionReportCard - 交易報表
  INVENTORY_REPORT      # 庫存報表
  FINANCIAL_REPORT      # 財務報表
  OPERATIONAL_REPORT    # 運營報表
  CUSTOM_REPORT         # 自定義報表
  SYSTEM_REPORT         # 系統報表
}

# 報表格式
enum ReportFormat {
  PDF
  EXCEL
  CSV
  HTML
  JSON
}

# 報表狀態
enum ReportStatus {
  PENDING           # 等待中
  GENERATING        # 生成中
  COMPLETED         # 完成
  ERROR             # 錯誤
  CANCELLED         # 已取消
  EXPIRED           # 已過期
}

# 報表優先級
enum ReportPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

# 報表配置
type ReportConfig {
  reportType: ReportType!
  title: String!
  description: String
  formats: [ReportFormat!]!
  maxFileSize: Int!           # bytes
  retentionDays: Int!         # 保留天數
  requireAuth: Boolean!
  allowScheduling: Boolean!
  supportsFiltering: Boolean!
  supportsGrouping: Boolean!
  estimatedGenerationTime: Int  # 預估生成時間(秒)
}

# 報表篩選器
input ReportFilters {
  dateRange: DateRangeInput
  productCodes: [String!]
  locationTypes: [LocationType!]
  userIds: [String!]
  orderStatuses: [OrderStatus!]
  transferStatuses: [TransferStatus!]
  customFilters: JSON
}

# 報表分組選項
input ReportGrouping {
  groupBy: [String!]!
  sortBy: String
  sortOrder: SortDirection = DESC
  aggregations: [ReportAggregation!]
}

# 報表聚合
input ReportAggregation {
  field: String!
  function: AggregationFunction!
  alias: String
}

enum AggregationFunction {
  COUNT
  SUM
  AVG
  MIN
  MAX
  DISTINCT_COUNT
}

# 報表模板
type ReportTemplate {
  id: ID!
  name: String!
  reportType: ReportType!
  description: String
  config: JSON!              # 模板配置
  filters: JSON             # 預設篩選器
  grouping: JSON            # 預設分組
  isPublic: Boolean!
  createdBy: String!
  createdAt: DateTime!
  lastUsed: DateTime
  usageCount: Int!
}

# 報表生成請求
input ReportGenerationInput {
  reportType: ReportType!
  format: ReportFormat!
  title: String
  description: String
  filters: ReportFilters
  grouping: ReportGrouping
  templateId: ID            # 使用預設模板
  priority: ReportPriority = NORMAL
  scheduledFor: DateTime    # 排程生成時間
  emailTo: [String!]        # 完成後發送給
  userId: String!
}

# 報表生成結果
type ReportGenerationResult {
  id: ID!
  reportId: ID!
  success: Boolean!
  message: String
  estimatedCompletionTime: DateTime
  progress: Float           # 0-100
}

# 生成的報表
type GeneratedReport {
  id: ID!
  reportType: ReportType!
  title: String!
  description: String
  format: ReportFormat!
  status: ReportStatus!
  
  # 文件信息
  fileName: String
  fileSize: Int            # bytes
  downloadUrl: String
  expiresAt: DateTime
  
  # 生成信息
  generatedAt: DateTime!
  generatedBy: String!
  generationTime: Int      # 實際生成時間(秒)
  recordCount: Int         # 記錄數量
  
  # 請求信息
  filters: JSON
  grouping: JSON
  priority: ReportPriority!
  
  # 統計信息
  downloadCount: Int!
  lastDownloaded: DateTime
  
  error: String           # 錯誤信息
}

# 報表統計
type ReportStatistics {
  totalReports: Int!
  todayReports: Int!
  pendingReports: Int!
  completedReports: Int!
  failedReports: Int!
  
  averageGenerationTime: Float!
  successRate: Float!
  
  reportsByType: [ReportTypeStats!]!
  reportsByFormat: [ReportFormatStats!]!
  reportsByUser: [UserReportStats!]!
  
  popularTemplates: [ReportTemplate!]!
  recentReports: [GeneratedReport!]!
  
  diskUsage: Int!          # bytes
  quotaUsage: Float!       # 0-1
}

type ReportTypeStats {
  type: ReportType!
  count: Int!
  averageSize: Int!
  averageGenerationTime: Float!
  successRate: Float!
}

type ReportFormatStats {
  format: ReportFormat!
  count: Int!
  totalSize: Int!
}

type UserReportStats {
  userId: String!
  userEmail: String!
  reportCount: Int!
  lastGenerated: DateTime!
  favoriteType: ReportType
}

# ReportCard 數據類型
type ReportCardData implements CardData {
  reportType: ReportType!
  config: ReportConfig!
  recentReports: [GeneratedReport!]!
  activeGenerations: [ReportGenerationProgress!]!
  templates: [ReportTemplate!]!
  statistics: ReportStatistics!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

# 報表生成進度
type ReportGenerationProgress {
  id: ID!
  reportType: ReportType!
  title: String!
  status: ReportStatus!
  progress: Float!         # 0-100
  estimatedTimeRemaining: Int  # 秒
  recordsProcessed: Int
  totalRecords: Int
  error: String
  startedAt: DateTime!
  userId: String!
}

# ReportCard 查詢輸入
input ReportCardInput {
  reportType: ReportType
  dateRange: DateRangeInput
  includeStatistics: Boolean = true
  includeRecentReports: Boolean = true
  includeActiveGenerations: Boolean = true
  includeTemplates: Boolean = true
  recentLimit: Int = 10
  userId: String
}

# 報表搜索輸入
input ReportSearchInput {
  reportTypes: [ReportType!]
  formats: [ReportFormat!]
  statuses: [ReportStatus!]
  dateRange: DateRangeInput
  searchTerm: String        # 搜索標題/描述
  generatedBy: String
  pagination: PaginationInput
  sorting: SortInput
}

# 報表搜索結果
type ReportSearchResult {
  reports: [GeneratedReport!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

# 批量報表操作
input BatchReportOperationInput {
  reportIds: [ID!]!
  operation: ReportOperation!
  params: JSON
}

enum ReportOperation {
  DELETE
  DOWNLOAD
  EXTEND_EXPIRY
  REGENERATE
  SHARE
}

type BatchReportResult {
  successful: [String!]!
  failed: [BatchReportError!]!
  totalProcessed: Int!
  totalSucceeded: Int!
  totalFailed: Int!
}

type BatchReportError {
  reportId: ID!
  error: String!
}

# 擴展 Query 類型
extend type Query {
  # ReportCard 數據查詢
  reportCardData(input: ReportCardInput!): ReportCardData!
  
  # 獲取報表配置
  reportConfig(reportType: ReportType!): ReportConfig!
  
  # 搜索報表
  searchReports(input: ReportSearchInput!): ReportSearchResult!
  
  # 獲取報表詳情
  reportDetails(reportId: ID!): GeneratedReport
  
  # 獲取生成進度
  reportProgress(generationIds: [ID!]!): [ReportGenerationProgress!]!
  
  # 獲取報表模板
  reportTemplates(reportType: ReportType, userId: String): [ReportTemplate!]!
  
  # 預估報表生成時間
  estimateReportTime(input: ReportGenerationInput!): Int!
  
}

# 擴展 Mutation 類型
extend type Mutation {
  # 生成報表
  generateReport(input: ReportGenerationInput!): ReportGenerationResult!
  
  # 取消報表生成
  cancelReportGeneration(generationId: ID!): Boolean!
  
  # 刪除報表
  deleteReport(reportId: ID!): Boolean!
  
  # 批量報表操作
  batchReportOperation(input: BatchReportOperationInput!): BatchReportResult!
  
  # 延長報表過期時間
  extendReportExpiry(reportId: ID!, days: Int!): GeneratedReport!
  
  # 創建報表模板
  createReportTemplate(input: CreateReportTemplateInput!): ReportTemplate!
  
  # 更新報表模板
  updateReportTemplate(templateId: ID!, input: UpdateReportTemplateInput!): ReportTemplate!
  
  # 刪除報表模板
  deleteReportTemplate(templateId: ID!): Boolean!
  
  # 分享報表
  shareReport(reportId: ID!, emails: [String!]!, message: String): Boolean!
  
  # 重新生成失敗的報表
  regenerateReport(reportId: ID!): ReportGenerationResult!
}

# 創建報表模板輸入
input CreateReportTemplateInput {
  name: String!
  reportType: ReportType!
  description: String
  config: JSON!
  filters: JSON
  grouping: JSON
  isPublic: Boolean = false
}

# 更新報表模板輸入
input UpdateReportTemplateInput {
  name: String
  description: String
  config: JSON
  filters: JSON
  grouping: JSON
  isPublic: Boolean
}

# 擴展 Subscription 類型
extend type Subscription {
  # 報表生成進度更新
  reportProgressUpdated(generationIds: [ID!]!): ReportGenerationProgress!
  
  # 報表生成完成
  reportGenerated(userId: String!): GeneratedReport!
  
  # 報表生成錯誤
  reportGenerationError(generationId: ID!): String!
  
  # 新報表可用
  newReportAvailable(reportTypes: [ReportType!]!): GeneratedReport!
}

# 報表錯誤類型
type ReportError {
  code: ReportErrorCode!
  message: String!
  details: JSON
}

enum ReportErrorCode {
  INSUFFICIENT_DATA
  GENERATION_TIMEOUT
  STORAGE_ERROR
  PERMISSION_DENIED
  QUOTA_EXCEEDED
  TEMPLATE_ERROR
  FILTER_ERROR
  EXPORT_ERROR
  SYSTEM_ERROR
}
`;

export const uploadSchema = `
# Upload-related scalars
scalar Upload
scalar File

# 文件上傳類型枚舉
enum UploadType {
  GENERAL_FILES     # UploadFilesCard - 通用文件上傳
  ORDER_PDF         # UploadOrdersCard - 訂單PDF分析
  PHOTOS           # UploadPhotoCard - 圖片上傳
  PRODUCT_SPEC     # UploadProductSpecCard - 產品規格文檔
}

# 文件夾類型
enum UploadFolder {
  STOCK_PIC        # 庫存圖片 (PNG, JPEG, JPG)
  PRODUCT_SPEC     # 產品規格 (PDF, DOC, DOCX)
  PHOTOS          # 照片 (PNG, JPEG, JPG, GIF, WEBP)
  ORDER_PDFS      # 訂單PDF
}

# 支援的文件格式
enum SupportedFileType {
  PNG
  JPEG
  JPG
  GIF
  WEBP
  PDF
  DOC
  DOCX
}

# 上傳狀態
enum UploadStatus {
  PENDING         # 等待中
  UPLOADING       # 上傳中
  ANALYZING       # AI分析中 (僅訂單PDF)
  COMPLETED       # 完成
  ERROR           # 錯誤
  CANCELLED       # 已取消
}

# 文件信息類型
# 文件信息類型 (doc_upload 表)
type FileInfo {
  # 數據庫實際欄位
  uuid: ID!                    # doc_upload.uuid (主鍵)
  docName: String!             # doc_upload.doc_name (文件名)
  uploadBy: Int!               # doc_upload.upload_by (上傳者ID)
  docType: String              # doc_upload.doc_type (文件類型)
  docUrl: String               # doc_upload.doc_url (文件URL)
  fileSize: Int                # doc_upload.file_size (文件大小)
  folder: String               # doc_upload.folder (文件夾)
  createdAt: DateTime!         # doc_upload.created_at (創建時間)
  jsonTxt: String              # doc_upload.json_txt (JSON文本數據)
  
  # 關聯數據 (透過 resolver 獲取)
  uploader: User               # 透過 uploadBy 關聯用戶信息
  
  # 計算欄位
  extension: String!           # 從 docName 提取的文件擴展名
  mimeType: String!            # 從 docType 或 extension 推斷的MIME類型
  isImage: Boolean!            # 是否為圖片文件
  isPdf: Boolean!              # 是否為PDF文件
  isProcessed: Boolean!        # jsonTxt 是否有內容
  
  # 向後兼容性欄位 (保留原有API)
  id: ID!                      # uuid 的別名，保持向後兼容
  originalName: String!        # docName 的別名
  fileName: String!            # docName 的別名
  size: Int!                   # fileSize 的別名 (預設為0如果為null)
  uploadedAt: DateTime!        # createdAt 的別名
  uploadedBy: String!          # 從 uploader.name 獲取或預設值
  checksum: String             # 可從其他來源計算
  url: String                  # docUrl 的別名
  thumbnailUrl: String         # 圖片縮略圖URL (如適用)
  
  # 增強功能
  analysisData: JSON           # 從 jsonTxt 解析的分析數據
  downloadCount: Int           # 下載次數 (可從日誌統計)
  lastAccessed: DateTime       # 最後訪問時間
}

# 上傳進度類型
type UploadProgress {
  id: ID!
  fileName: String!
  progress: Float!      # 0-100
  status: UploadStatus!
  error: String
  estimatedTimeRemaining: Int  # 秒
  bytesUploaded: Int
  totalBytes: Int
  uploadSpeed: Float    # bytes/second
}

# AI 分析結果（訂單PDF專用）
type OrderAnalysisResult {
  success: Boolean!
  recordCount: Int!
  processingTime: Int!  # milliseconds
  extractedData: [OrderData!]
  confidence: Float     # 0-1
  warnings: [String!]
  errors: [String!]
  metadata: JSON
}

type OrderData {
  orderNumber: String!
  customerName: String
  orderDate: DateTime
  items: [OrderItem!]
  totalAmount: Float
  currency: String
  confidence: Float
}

type OrderItem {
  productCode: String
  description: String
  quantity: Int
  unitPrice: Float
  totalPrice: Float
}

# 批量上傳結果
type BatchUploadResult {
  totalFiles: Int!
  successful: Int!
  failed: Int!
  uploadIds: [ID!]!
  results: [SingleUploadResult!]!
  analysisResults: [OrderAnalysisResult!]  # 僅當包含訂單PDF時
}

type SingleUploadResult {
  id: ID!
  fileName: String!
  success: Boolean!
  fileInfo: FileInfo
  error: String
  analysisResult: OrderAnalysisResult  # 僅訂單PDF
}

# 上傳配置
type UploadConfig {
  uploadType: UploadType!
  allowedTypes: [SupportedFileType!]!
  maxFileSize: Int!     # bytes
  maxFiles: Int
  folder: UploadFolder!
  requiresAnalysis: Boolean!  # 是否需要AI分析
  allowMultiple: Boolean!
  supportsDragDrop: Boolean!
  supportsPreview: Boolean!   # 圖片預覽
}

# UploadCard 數據類型
type UploadCardData implements CardData {
  uploadType: UploadType!
  config: UploadConfig!
  recentUploads: [FileInfo!]!
  activeUploads: [UploadProgress!]!
  statistics: UploadStatistics!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type UploadStatistics {
  totalUploads: Int!
  totalSize: Int!       # bytes
  successRate: Float!   # 0-1
  averageUploadTime: Float!  # seconds
  todayUploads: Int!
  recentErrors: [String!]!
  popularFileTypes: [FileTypeStats!]!
}

type FileTypeStats {
  type: SupportedFileType!
  count: Int!
  totalSize: Int!
}

# 輸入類型

# 單文件上傳輸入
input SingleFileUploadInput {
  file: Upload!
  uploadType: UploadType!
  folder: UploadFolder
  fileName: String        # 自定義文件名
  metadata: JSON         # 額外元數據
  requiresAnalysis: Boolean  # 是否需要AI分析
  userId: String
}

# 批量上傳輸入
input BatchUploadInput {
  files: [Upload!]!
  uploadType: UploadType!
  folder: UploadFolder
  metadata: JSON
  requiresAnalysis: Boolean
  userId: String
}

# UploadCard 查詢輸入
input UploadCardInput {
  uploadType: UploadType!
  folder: UploadFolder
  dateRange: DateRangeInput
  includeStatistics: Boolean = true
  includeRecentUploads: Boolean = true
  includeActiveUploads: Boolean = true
  recentLimit: Int = 10
}

# 文件搜索輸入
input FileSearchInput {
  folder: UploadFolder
  fileTypes: [SupportedFileType!]
  dateRange: DateRangeInput
  searchTerm: String
  uploadedBy: String
  pagination: PaginationInput
  sorting: SortInput
}

# 文件搜索結果
type FileSearchResult {
  files: [FileInfo!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

# 擴展 Query 類型
extend type Query {
  # UploadCard 數據查詢
  uploadCardData(input: UploadCardInput!): UploadCardData!
  
  # 獲取上傳配置
  uploadConfig(uploadType: UploadType!): UploadConfig!
  
  # 搜索文件
  searchFiles(input: FileSearchInput!): FileSearchResult!
  
  # 獲取上傳進度
  uploadProgress(uploadIds: [ID!]!): [UploadProgress!]!
  
  # 獲取文件詳情
  fileInfo(id: ID!): FileInfo
  
  # 獲取訂單分析結果
  orderAnalysisResult(uploadId: ID!): OrderAnalysisResult
}

# 擴展 Mutation 類型
extend type Mutation {
  # 單文件上傳
  uploadSingleFile(input: SingleFileUploadInput!): SingleUploadResult!
  
  # 批量文件上傳
  uploadBatchFiles(input: BatchUploadInput!): BatchUploadResult!
  
  # 取消上傳
  cancelUpload(uploadId: ID!): Boolean!
  
  # 重新上傳失敗的文件
  retryUpload(uploadId: ID!): SingleUploadResult!
  
  # 刪除文件
  deleteFile(fileId: ID!): Boolean!
  
  # 批量刪除文件
  deleteFiles(fileIds: [ID!]!): BatchResult!
  
  # 重新分析訂單PDF
  reanalyzeOrderPDF(fileId: ID!): OrderAnalysisResult!
  
  # 更新文件元數據
  updateFileMetadata(fileId: ID!, metadata: JSON!): FileInfo!
}

# 擴展 Subscription 類型
extend type Subscription {
  # 上傳進度訂閱
  uploadProgressUpdated(uploadIds: [ID!]!): UploadProgress!
  
  # 新文件上傳完成
  fileUploaded(folder: UploadFolder): FileInfo!
  
  # 分析結果更新
  analysisCompleted(uploadId: ID!): OrderAnalysisResult!
  
  # 上傳錯誤
  uploadError(uploadId: ID!): String!
}

# 錯誤類型
type UploadError {
  code: UploadErrorCode!
  message: String!
  fileName: String
  details: JSON
}

enum UploadErrorCode {
  FILE_TOO_LARGE
  INVALID_FILE_TYPE
  UPLOAD_FAILED
  ANALYSIS_FAILED
  STORAGE_ERROR
  PERMISSION_DENIED
  QUOTA_EXCEEDED
  NETWORK_ERROR
  VIRUS_DETECTED
  DUPLICATE_FILE
}
`;

// Alert Schema - AlertCard with unified alert management
export const alertSchema = `
# Alert Card Schema
enum AlertType {
  SYSTEM_ALERT
  INVENTORY_ALERT
  ORDER_ALERT
  TRANSFER_ALERT
  QUALITY_ALERT
  PERFORMANCE_ALERT
  SECURITY_ALERT
  CUSTOM_ALERT
}

enum AlertSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum AlertStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
  EXPIRED
  DISMISSED
}

# Input types
input AlertCardInput {
  types: [AlertType!]
  severities: [AlertSeverity!]
  statuses: [AlertStatus!]
  dateRange: DateRangeInput
  includeAcknowledged: Boolean = false
  includeResolved: Boolean = false
  limit: Int = 50
  sortBy: AlertSortBy = CREATED_AT_DESC
}

enum AlertSortBy {
  CREATED_AT_ASC
  CREATED_AT_DESC
  SEVERITY_ASC
  SEVERITY_DESC
  STATUS_ASC
  STATUS_DESC
}

# Output types
type AlertCardData implements CardData {
  alerts: [Alert!]!
  summary: AlertSummary!
  statistics: AlertStatistics!
  pagination: PageInfo!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type Alert {
  id: ID!
  type: AlertType!
  severity: AlertSeverity!
  status: AlertStatus!
  title: String!
  message: String!
  details: JSON
  source: String!
  createdAt: DateTime!
  acknowledgedAt: DateTime
  acknowledgedBy: String
  resolvedAt: DateTime
  resolvedBy: String
  expiresAt: DateTime
  affectedEntities: [AffectedEntity!]
  actions: [AlertAction!]
  tags: [String!]
  metadata: JSON
}

type AffectedEntity {
  entityType: String!
  entityId: String!
  entityName: String!
  impact: String
  entityUrl: String
}

type AlertAction {
  id: ID!
  type: String!
  label: String!
  url: String
  confirmRequired: Boolean!
  icon: String
}

type AlertSummary {
  totalActive: Int!
  totalToday: Int!
  bySeverity: [SeverityCount!]!
  byType: [TypeCount!]!
  byStatus: [StatusCount!]!
  recentCount: Int!
  criticalCount: Int!
}

type SeverityCount {
  severity: AlertSeverity!
  count: Int!
  percentage: Float!
}

type TypeCount {
  type: AlertType!
  count: Int!
  percentage: Float!
}

type StatusCount {
  status: AlertStatus!
  count: Int!
  percentage: Float!
}

type AlertStatistics {
  averageResolutionTime: Float!
  averageAcknowledgeTime: Float!
  acknowledgeRate: Float!
  resolutionRate: Float!
  recurringAlerts: Int!
  trendsData: [AlertTrend!]!
  performanceMetrics: AlertPerformanceMetrics!
}

type AlertTrend {
  timestamp: DateTime!
  count: Int!
  severity: AlertSeverity!
}

type AlertPerformanceMetrics {
  mttr: Float! # Mean Time To Resolution
  mtta: Float! # Mean Time To Acknowledge
  alertVolume: Int!
  falsePositiveRate: Float!
}

# Query extensions
extend type Query {
  alertCardData(input: AlertCardInput!): AlertCardData!
  alertDetails(alertId: ID!): Alert
  alertHistory(
    entityId: ID
    dateRange: DateRangeInput
    limit: Int = 100
  ): [Alert!]!
  alertRules: [AlertRule!]!
  alertChannels: [NotificationChannel!]!
}

# Mutation extensions
extend type Mutation {
  acknowledgeAlert(alertId: ID!, note: String): Alert!
  resolveAlert(alertId: ID!, resolution: String!): Alert!
  dismissAlert(alertId: ID!, reason: String): Boolean!
  batchAcknowledgeAlerts(alertIds: [ID!]!, note: String): BatchAlertResult!
  batchResolveAlerts(alertIds: [ID!]!, resolution: String!): BatchAlertResult!
  createCustomAlert(input: CreateAlertInput!): Alert!
  updateAlertRule(ruleId: ID!, input: UpdateAlertRuleInput!): AlertRule!
  testAlertChannel(channelId: ID!): Boolean!
}

# Subscription extensions
extend type Subscription {
  newAlert(types: [AlertType!], severities: [AlertSeverity!]): Alert!
  alertStatusChanged(alertId: ID): Alert!
  alertStatisticsUpdated: AlertStatistics!
}

# Input types for mutations
input CreateAlertInput {
  type: AlertType!
  severity: AlertSeverity!
  title: String!
  message: String!
  details: JSON
  affectedEntities: [AffectedEntityInput!]
  expiresIn: Int # minutes
  tags: [String!]
  metadata: JSON
}

input AffectedEntityInput {
  entityType: String!
  entityId: String!
  entityName: String!
  impact: String
  entityUrl: String
}

input UpdateAlertRuleInput {
  name: String
  enabled: Boolean
  conditions: JSON
  actions: [AlertActionInput!]
  severity: AlertSeverity
  throttle: Int # minutes
}

input AlertActionInput {
  type: String!
  config: JSON!
}

# Supporting types
type BatchAlertResult {
  succeeded: Int!
  failed: Int!
  errors: [BatchError!]
}

type BatchError {
  alertId: ID!
  error: String!
}

type AlertRule {
  id: ID!
  name: String!
  enabled: Boolean!
  conditions: JSON!
  actions: [AlertAction!]!
  severity: AlertSeverity!
  throttle: Int!
  lastTriggered: DateTime
  triggerCount: Int!
}

type NotificationChannel {
  id: ID!
  type: String!
  name: String!
  enabled: Boolean!
  config: JSON!
  lastUsed: DateTime
  successRate: Float!
}
`;

// Config Schema - ConfigCard with unified configuration management (OLD - replaced by imported version)
export const configSchemaOld = `
# Config Card Schema
enum ConfigCategory {
  SYSTEM
  USER_PREFERENCES
  DEPARTMENT
  NOTIFICATION
  API
  SECURITY
  DISPLAY
  WORKFLOW
}

enum ConfigScope {
  GLOBAL      # System-wide configuration
  DEPARTMENT  # Department-specific configuration
  USER        # User-specific preferences
  ROLE        # Role-based configuration
}

enum ConfigDataType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  ARRAY
  DATE
  COLOR
  URL
}

enum ConfigAccessLevel {
  PUBLIC      # Anyone can read
  AUTHENTICATED # Logged-in users
  DEPARTMENT  # Department members
  ADMIN       # Administrators only
  SUPER_ADMIN # Super administrators
}

# Input types
input ConfigCardInput {
  category: ConfigCategory
  scope: ConfigScope
  userId: ID
  departmentId: ID
  roleId: ID
  includeDefaults: Boolean = true
  includeInherited: Boolean = true
  search: String
  tags: [String!]
}

input ConfigItemInput {
  key: String!
  value: JSON!
  category: ConfigCategory!
  scope: ConfigScope!
  description: String
  dataType: ConfigDataType!
  validation: JSON
  metadata: JSON
  tags: [String!]
}

input ConfigUpdateInput {
  id: ID!
  value: JSON!
  description: String
  validation: JSON
  metadata: JSON
  tags: [String!]
}

input ConfigBatchUpdateInput {
  updates: [ConfigUpdateInput!]!
  validateAll: Boolean = true
  atomicUpdate: Boolean = true
}

# Output types
type ConfigCardData implements CardData {
  configs: [ConfigItem!]!
  categories: [ConfigCategoryGroup!]!
  summary: ConfigSummary!
  permissions: ConfigPermissions!
  validation: ConfigValidation!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

type ConfigItem {
  id: ID!
  key: String!
  value: JSON!
  defaultValue: JSON
  category: ConfigCategory!
  scope: ConfigScope!
  scopeId: String
  description: String
  dataType: ConfigDataType!
  validation: JSON
  metadata: JSON
  tags: [String!]
  accessLevel: ConfigAccessLevel!
  isEditable: Boolean!
  isInherited: Boolean!
  inheritedFrom: String
  createdAt: DateTime!
  updatedAt: DateTime!
  updatedBy: String
  history: [ConfigHistory!]
}

type ConfigCategoryGroup {
  category: ConfigCategory!
  label: String!
  description: String
  icon: String
  items: [ConfigItem!]!
  count: Int!
  editableCount: Int!
  lastUpdated: DateTime
}

type ConfigSummary {
  totalConfigs: Int!
  editableConfigs: Int!
  inheritedConfigs: Int!
  customConfigs: Int!
  byCategory: [ConfigCategoryCount!]!
  byScope: [ConfigScopeCount!]!
  recentChanges: Int!
}

type ConfigCategoryCount {
  category: ConfigCategory!
  count: Int!
  editableCount: Int!
}

type ConfigScopeCount {
  scope: ConfigScope!
  count: Int!
  editableCount: Int!
}

type ConfigPermissions {
  canRead: Boolean!
  canWrite: Boolean!
  canDelete: Boolean!
  canManageGlobal: Boolean!
  canManageDepartment: Boolean!
  canManageUsers: Boolean!
  accessibleScopes: [ConfigScope!]!
  accessibleCategories: [ConfigCategory!]!
}

type ConfigValidation {
  isValid: Boolean!
  errors: [ConfigValidationError!]
  warnings: [ConfigValidationWarning!]
}

type ConfigValidationError {
  configId: ID!
  key: String!
  message: String!
  details: JSON
}

type ConfigValidationWarning {
  configId: ID!
  key: String!
  message: String!
  details: JSON
}

type ConfigHistory {
  id: ID!
  configId: ID!
  previousValue: JSON!
  newValue: JSON!
  changedBy: String!
  changedAt: DateTime!
  changeReason: String
  metadata: JSON
}

# Batch operation results
type ConfigBatchResult {
  succeeded: Int!
  failed: Int!
  errors: [ConfigBatchError!]
  configs: [ConfigItem!]
}

type ConfigBatchError {
  configId: ID
  key: String
  error: String!
}

# Template support
type ConfigTemplate {
  id: ID!
  name: String!
  description: String
  category: ConfigCategory!
  scope: ConfigScope!
  configs: JSON!
  tags: [String!]
  isPublic: Boolean!
  createdBy: String!
  createdAt: DateTime!
  usageCount: Int!
}

# Query extensions
extend type Query {
  configCardData(input: ConfigCardInput!): ConfigCardData!
  configItem(key: String!, scope: ConfigScope!, scopeId: String): ConfigItem
  configHistory(
    configId: ID!
    limit: Int = 50
  ): [ConfigHistory!]!
  configTemplates(
    category: ConfigCategory
    scope: ConfigScope
    isPublic: Boolean
  ): [ConfigTemplate!]!
  configDefaults(category: ConfigCategory): [ConfigItem!]!
  validateConfig(input: ConfigItemInput!): ConfigValidation!
}

# Mutation extensions
extend type Mutation {
  createConfig(input: ConfigItemInput!): ConfigItem!
  updateConfig(input: ConfigUpdateInput!): ConfigItem!
  deleteConfig(id: ID!): Boolean!
  batchUpdateConfigs(input: ConfigBatchUpdateInput!): ConfigBatchResult!
  resetConfig(id: ID!): ConfigItem!
  resetConfigCategory(category: ConfigCategory!, scope: ConfigScope!, scopeId: String): ConfigBatchResult!
  createConfigTemplate(
    name: String!
    description: String
    category: ConfigCategory!
    scope: ConfigScope!
    configIds: [ID!]!
    isPublic: Boolean = false
  ): ConfigTemplate!
  applyConfigTemplate(templateId: ID!, scope: ConfigScope!, scopeId: String!): ConfigBatchResult!
  exportConfigs(category: ConfigCategory, scope: ConfigScope, format: ExportFormat!): String!
  importConfigs(data: String!, format: ExportFormat!, overwrite: Boolean = false): ConfigBatchResult!
}

# Subscription extensions
extend type Subscription {
  configChanged(
    category: ConfigCategory
    scope: ConfigScope
    keys: [String!]
  ): ConfigItem!
  configBatchChanged(
    category: ConfigCategory
    scope: ConfigScope
  ): [ConfigItem!]!
  configValidationChanged: ConfigValidation!
}

# Export formats
enum ExportFormat {
  JSON
  YAML
  ENV
  INI
}

# Predefined configuration keys
enum SystemConfigKey {
  THEME
  LANGUAGE
  TIMEZONE
  DATE_FORMAT
  NUMBER_FORMAT
  CURRENCY
  DEFAULT_PAGE_SIZE
  SESSION_TIMEOUT
  PASSWORD_POLICY
  TWO_FACTOR_AUTH
}

enum NotificationConfigKey {
  EMAIL_ENABLED
  SMS_ENABLED
  PUSH_ENABLED
  EMAIL_FREQUENCY
  NOTIFICATION_SOUND
  DESKTOP_NOTIFICATIONS
  MOBILE_NOTIFICATIONS
  QUIET_HOURS
}

enum WorkflowConfigKey {
  AUTO_APPROVE_ORDERS
  REQUIRE_QC_APPROVAL
  TRANSFER_APPROVAL_LEVELS
  ORDER_PRIORITY_RULES
  STOCK_ALERT_THRESHOLDS
  REORDER_POINTS
}
`;

// Import department schema
import { departmentTypeDefs } from './schema/department';
import { configSchema as configSchemaImport } from './schema/config';
import { stockHistorySchema } from './schema/stock-history';
import { stockLevelSchema } from './schema/stock-level';
import { recordHistorySchema } from './schema/record-history';

export const orderSchema = `
# Warehouse Order Types (Loading-focused)
type WarehouseOrder {
  id: ID!
  orderRef: String!
  customerName: String
  status: WarehouseOrderStatus!
  items: [WarehouseOrderItem!]!
  totalQuantity: Int!
  loadedQuantity: Int!
  remainingQuantity: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime
}

type WarehouseOrderItem {
  id: ID!
  orderId: ID!
  productCode: String!
  productDesc: String
  quantity: Int!
  loadedQuantity: Int!
  status: WarehouseOrderItemStatus!
}

type AcoOrder {
  orderRef: Int!
  productCode: String!
  productDesc: String
  quantityOrdered: Int!
  quantityUsed: Int!
  remainingQuantity: Int!
  completionStatus: String!
  lastUpdated: DateTime
}

type OrderLoadingRecord {
  timestamp: DateTime!
  orderNumber: String!
  productCode: String!
  loadedQty: Int!
  userName: String!
  action: String!
}

enum WarehouseOrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum WarehouseOrderItemStatus {
  PENDING
  PARTIAL
  COMPLETED
}

# Input Types
input WarehouseOrderFilterInput {
  orderRef: String
  status: WarehouseOrderStatus
  dateRange: DateRangeInput
  customerName: String
}

input OrderLoadingFilterInput {
  startDate: String!
  endDate: String!
  orderRef: String
  productCode: String
  actionBy: String
}

input UpdateAcoOrderInput {
  orderRef: Int!
  productCode: String!
  quantityUsed: Int!
  skipUpdate: Boolean
  orderCompleted: Boolean
}

# Response Types
type WarehouseOrdersResponse {
  items: [WarehouseOrder!]!
  total: Int!
  aggregates: WarehouseOrderAggregates
}

type WarehouseOrderAggregates {
  totalOrders: Int!
  pendingOrders: Int!
  completedOrders: Int!
  totalQuantity: Int!
  loadedQuantity: Int!
}

type OrderLoadingResponse {
  records: [OrderLoadingRecord!]!
  total: Int!
  summary: LoadingSummary
}

type LoadingSummary {
  totalLoaded: Int!
  uniqueOrders: Int!
  uniqueProducts: Int!
  averageLoadPerOrder: Float!
}

type UpdateAcoOrderResponse {
  success: Boolean!
  message: String
  order: AcoOrder
  emailSent: Boolean
  error: Error
}

type AcoOrderReportResponse {
  data: [AcoOrder!]!
  total: Int!
  reference: String!
  generatedAt: DateTime!
}

# Queries
extend type Query {
  # Get warehouse orders with filtering and pagination
  warehouseOrders(input: WarehouseOrderFilterInput): WarehouseOrdersResponse!
  
  # Get single warehouse order by ID or reference
  warehouseOrder(id: ID, orderRef: String): WarehouseOrder
  
  # Get ACO order report data
  acoOrderReport(reference: String!): AcoOrderReportResponse!
  
  # Get order loading records
  orderLoadingRecords(input: OrderLoadingFilterInput!): OrderLoadingResponse!
}

# Mutations
extend type Mutation {
  # Update ACO order quantities
  updateAcoOrder(input: UpdateAcoOrderInput!): UpdateAcoOrderResponse!
  
  # Update warehouse order status
  updateWarehouseOrderStatus(orderId: ID!, status: WarehouseOrderStatus!): WarehouseOrder!
  
  # Cancel warehouse order
  cancelWarehouseOrder(orderId: ID!, reason: String): WarehouseOrder!
}

# =============================================================================
# 新增的4個表的輸入類型和連接類型定義
# =============================================================================

# HistoryRecord 相關類型
input HistoryRecordFilterInput {
  action: String
  pltNum: String
  userId: Int
  location: String
  dateRange: DateRangeInput
  recordType: HistoryType
}

input CreateHistoryRecordInput {
  id: Int!
  action: String!
  pltNum: String
  location: String
  remark: String = "-"
}

input UpdateHistoryRecordInput {
  action: String
  location: String
  remark: String
}

type HistoryRecordConnection {
  edges: [HistoryRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type HistoryRecordEdge {
  cursor: String!
  node: HistoryRecord!
}

# FileInfo 相關類型
input FileInfoFilterInput {
  docType: String
  folder: String
  uploadBy: Int
  dateRange: DateRangeInput
  hasAnalysisData: Boolean
}

input CreateFileInfoInput {
  docName: String!
  uploadBy: Int!
  docType: String
  docUrl: String
  fileSize: Int
  folder: String
  jsonTxt: String
}

input UpdateFileInfoInput {
  docName: String
  docType: String
  docUrl: String
  folder: String
  jsonTxt: String
}

type FileInfoConnection {
  edges: [FileInfoEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type FileInfoEdge {
  cursor: String!
  node: FileInfo!
}

# WorkLevel 相關類型
input WorkLevelFilterInput {
  userId: Int
  dateRange: DateRangeInput
  minOperations: Int
  operationType: WorkOperationType
}

input CreateWorkLevelInput {
  id: Int!
  qc: Int = 0
  move: Int = 0
  grn: Int = 0
  loading: Int = 0
}

input UpdateWorkLevelInput {
  qc: Int
  move: Int
  grn: Int
  loading: Int
}

input BatchWorkLevelUpdateInput {
  uuid: ID!
  updates: UpdateWorkLevelInput!
}

type WorkLevelConnection {
  edges: [WorkLevelEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type WorkLevelEdge {
  cursor: String!
  node: WorkLevel!
}

type WorkLevelSummary {
  totalUsers: Int!
  totalOperations: Int!
  averageOperationsPerUser: Float!
  topOperationType: WorkOperationType!
  operationBreakdown: [OperationBreakdown!]!
  periodComparison: PeriodComparison
}

type OperationBreakdown {
  operationType: WorkOperationType!
  count: Int!
  percentage: Float!
}

type PeriodComparison {
  currentPeriodTotal: Int!
  previousPeriodTotal: Int!
  growthPercentage: Float!
}

# GRNRecord 相關類型
input GRNRecordFilterInput {
  grnRef: Int
  supCode: String
  materialCode: String
  pltNum: String
  dateRange: DateRangeInput
  status: GRNRecordStatus
  hasDiscrepancies: Boolean
  weightRange: WeightRangeInput
}

input WeightRangeInput {
  minGrossWeight: Int
  maxGrossWeight: Int
  minNetWeight: Int
  maxNetWeight: Int
}

input CreateGRNRecordInput {
  grnRef: Int!
  pltNum: String!
  supCode: String!
  materialCode: String!
  grossWeight: Int!
  netWeight: Int!
  pallet: String!
  package: String!
  palletCount: Float!
  packageCount: Float!
}

input UpdateGRNRecordInput {
  grossWeight: Int
  netWeight: Int
  pallet: String
  package: String
  palletCount: Float
  packageCount: Float
  status: GRNRecordStatus
  qualityNotes: String
}

input GRNRecordCorrectionInput {
  grossWeight: Int
  netWeight: Int
  palletCount: Float
  packageCount: Float
  correctionReason: String!
  correctedBy: String!
}

type GRNRecordConnection {
  edges: [GRNRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type GRNRecordEdge {
  cursor: String!
  node: GRNRecord!
}

# 通用類型擴展
extend enum HistoryType {
  WORK_LEVEL      # 工作量級
  FILE_UPLOAD     # 文件上傳
  RECORD_GRN      # 收貨記錄
}
`;

// Combine all schemas
export const typeDefs = `
  ${baseSchema}
  ${productSchema}
  ${inventorySchema}
  ${operationsSchema}
  ${analyticsSchema}
  ${chartSchema}
  ${statsSchema}
  ${reportSchema}
  ${uploadSchema}
  ${alertSchema}
  ${configSchemaImport}
  ${departmentTypeDefs}
  ${stockHistorySchema}
  ${stockLevelSchema}
  ${recordHistorySchema}
  ${orderSchema}
  ${mainSchema}
`;
