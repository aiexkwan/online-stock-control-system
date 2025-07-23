/**
 * GraphQL Schema Definitions
 * Combined schema for the NewPennine WMS
 */


export const baseSchema = `
# Base GraphQL Schema - Core Types
scalar DateTime
scalar JSON

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

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
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

# Widget 數據源類型
interface WidgetData {
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
  code: ID!
  description: String!
  chinesedescription: String
  colour: String
  type: String
  standardQty: Int
  unit: String
  weightPerPiece: Float
  volumePerPiece: Float
  
  inventory: InventorySummary
  pallets(filter: PalletFilterInput, pagination: PaginationInput, sort: SortInput): PalletConnection!
  statistics: ProductStatistics
  
  createdAt: DateTime!
  updatedAt: DateTime!
  isActive: Boolean!
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
  id: ID!
  code: String!
  name: String!
  contact: String
  email: String
  phone: String
  address: String
  
  products: [Product!]
  grns(filter: GRNFilterInput, pagination: PaginationInput): GRNConnection!
  statistics: SupplierStatistics
  
  createdAt: DateTime!
  updatedAt: DateTime!
  isActive: Boolean!
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
  chinesedescription: String
  colour: String
  type: String
  standardQty: Int
  unit: String
  weightPerPiece: Float
  volumePerPiece: Float
}

input UpdateProductInput {
  description: String
  chinesedescription: String
  colour: String
  type: String
  standardQty: Int
  unit: String
  weightPerPiece: Float
  volumePerPiece: Float
}
`;

export const inventorySchema = `
# Inventory GraphQL Schema
type Pallet {
  pltNum: ID!
  productCode: String!
  product: Product!
  quantity: Int!
  location: Location
  status: PalletStatus!
  
  transfers(filter: TransferFilterInput, pagination: PaginationInput): TransferConnection!
  history(pagination: PaginationInput): [HistoryRecord!]!
  
  grnNumber: String
  grn: GRN
  
  batchNumber: String
  expiryDate: DateTime
  manufactureDate: DateTime
  
  createdAt: DateTime!
  updatedAt: DateTime!
  createdBy: User!
  lastModifiedBy: User
}

enum PalletStatus {
  ACTIVE
  VOID
  TRANSFERRED
  SHIPPED
  DAMAGED
}

type Inventory {
  id: ID!
  productCode: String!
  product: Product!
  
  locationQuantities: LocationInventory!
  totalQuantity: Int!
  
  awaitQuantity: Int!
  availableQuantity: Int!
  reservedQuantity: Int!
  
  lastUpdate: DateTime!
  lastMovement: DateTime
  lastStocktake: DateTime
}

type LocationInventory {
  injection: Int!
  pipeline: Int!
  prebook: Int!
  await: Int!
  fold: Int!
  bulk: Int!
  backcarpark: Int!
  damage: Int!
}

type InventorySummary {
  totalQuantity: Int!
  availableQuantity: Int!
  reservedQuantity: Int!
  locationBreakdown: LocationInventory!
  lastUpdate: DateTime!
}

type Location {
  id: ID!
  code: String!
  name: String!
  type: LocationType!
  warehouse: Warehouse!
  capacity: Int
  currentOccupancy: Int
  isActive: Boolean!
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

type GRN {
  id: ID!
  grnNumber: String!
  supplierCode: String!
  supplier: Supplier!
  
  items: [GRNItem!]!
  totalItems: Int!
  totalQuantity: Int!
  
  status: GRNStatus!
  receivedDate: DateTime!
  completedDate: DateTime
  
  qcStatus: QCStatus
  qcCompletedDate: DateTime
  qcBy: User
  
  createdAt: DateTime!
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

type StockLevelData implements WidgetData {
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
type Transfer {
  id: ID!
  transferNumber: String!
  pltNum: String!
  pallet: Pallet!
  
  fromLocation: Location!
  toLocation: Location!
  quantity: Int!
  status: TransferStatus!
  
  requestedAt: DateTime!
  startedAt: DateTime
  completedAt: DateTime
  estimatedDuration: Int
  actualDuration: Int
  
  requestedBy: User!
  executedBy: User
  approvedBy: User
  
  reason: String
  notes: String
  priority: TransferPriority
}

enum TransferPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

type Order {
  id: ID!
  orderNumber: String!
  customerCode: String!
  customer: Customer!
  
  items: [OrderItem!]!
  totalItems: Int!
  totalQuantity: Int!
  totalValue: Float!
  
  status: OrderStatus!
  paymentStatus: PaymentStatus
  shippingStatus: ShippingStatus
  
  orderDate: DateTime!
  requiredDate: DateTime
  shippedDate: DateTime
  deliveredDate: DateTime
  
  shippingAddress: Address!
  billingAddress: Address
  trackingNumber: String
  
  createdAt: DateTime!
  updatedAt: DateTime!
  createdBy: User!
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

type HistoryRecord {
  id: ID!
  recordType: HistoryType!
  action: String!
  
  entityType: String!
  entityId: String!
  entityData: JSON
  
  previousValue: JSON
  newValue: JSON
  changes: [FieldChange!]
  
  timestamp: DateTime!
  performedBy: User!
  ipAddress: String
  userAgent: String
  notes: String
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

type WorkLevel {
  userId: ID!
  user: User!
  date: DateTime!
  
  totalTransfers: Int!
  totalPalletsHandled: Int!
  totalQuantityMoved: Int!
  averageTransferTime: Float!
  
  efficiency: Float!
  productivityScore: Float!
  errorRate: Float!
  
  transfersByHour: [HourlyBreakdown!]!
  transfersByLocation: [LocationBreakdown!]!
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
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  department: String
  isActive: Boolean!
  lastLogin: DateTime
  createdAt: DateTime!
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

type UnifiedOperationsData implements WidgetData {
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
type QualityMetrics implements WidgetData {
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

type EfficiencyMetrics implements WidgetData {
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

type UploadStatistics implements WidgetData {
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

type UpdateStatistics implements WidgetData {
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

type SystemPerformance implements WidgetData {
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
  
  # Widget data sources
  widgetData(dataSource: String!, params: JSON, timeFrame: DateRangeInput): JSON!
  batchWidgetData(requests: [WidgetDataRequest!]!): [WidgetDataResponse!]!
  
  # Products
  product(code: ID!): Product
  products(filter: ProductFilterInput, pagination: PaginationInput, sort: SortInput): ProductConnection!
  searchProducts(query: String!, limit: Int = 10): [Product!]!
  productStatistics(productCode: ID!, dateRange: DateRangeInput): ProductStatistics!
  
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
  
  # Operations
  createTransfer(input: CreateTransferInput!): Transfer!
  updateTransferStatus(id: ID!, status: TransferStatus!, notes: String): Transfer!
  cancelTransfer(id: ID!, reason: String!): Transfer!
  
  # Batch operations
  batchOperation(operations: [BatchOperationInput!]!): BatchOperationResult!
}

type Subscription {
  inventoryUpdated(productCodes: [String!]): Inventory!
  transferStatusChanged(transferIds: [ID!]): Transfer!
  orderStatusChanged(orderNumbers: [String!]): Order!
  systemAlert(severity: AlertSeverity): SystemAlert!
}

# Widget data request/response types
input WidgetDataRequest {
  widgetId: String!
  dataSource: String!
  params: JSON
  timeFrame: DateRangeInput
}

type WidgetDataResponse {
  widgetId: String!
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
  standardQty: Int!
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
  standardQty: Int!
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
const chartSchema = `
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

type ChartCardData implements WidgetData {
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

type StatsCardData implements WidgetData {
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

enum StringOperator {
  EQUALS
  CONTAINS
  STARTS_WITH
  ENDS_WITH
  NOT_EQUALS
  NOT_CONTAINS
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

enum ArrayOperator {
  IN
  NOT_IN
  CONTAINS_ANY
  CONTAINS_ALL
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

type TableCardData implements WidgetData {
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
# Consolidates ReportGeneratorWithDialogWidget + TransactionReportWidget + analysis reports

# 報表類型枚舉
enum ReportType {
  TRANSACTION_REPORT    # TransactionReportWidget - 交易報表
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
type ReportCardData implements WidgetData {
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
  
  # 獲取可用的報表欄位
  availableReportFields(reportType: ReportType!): [ReportField!]!
}

# 報表欄位定義
type ReportField {
  key: String!
  label: String!
  dataType: TableDataType!
  filterable: Boolean!
  groupable: Boolean!
  aggregatable: Boolean!
  required: Boolean!
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
  GENERAL_FILES     # UploadFilesWidget - 通用文件上傳
  ORDER_PDF         # UploadOrdersWidget - 訂單PDF分析
  PHOTOS           # UploadPhotoWidget - 圖片上傳
  PRODUCT_SPEC     # UploadProductSpecWidget - 產品規格文檔
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
type FileInfo {
  id: ID!
  originalName: String!
  fileName: String!
  mimeType: String!
  size: Int!
  extension: String!
  folder: UploadFolder!
  uploadedAt: DateTime!
  uploadedBy: String!
  checksum: String
  url: String
  thumbnailUrl: String  # 圖片縮略圖
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
type UploadCardData implements WidgetData {
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

// Analysis Schema - AnalysisCard with AI Integration
export const analysisSchema = `
# Analysis Card Schema - AI-powered analysis and insights
enum AnalysisType {
  INVENTORY_ORDER_MATCHING
  OPERATIONAL_DASHBOARD
  PERFORMANCE_ANALYSIS
  TREND_FORECASTING
  ANOMALY_DETECTION
}

enum AnalysisUrgency {
  FAST
  NORMAL
  THOROUGH
}

enum InsightType {
  TREND_ANALYSIS
  ANOMALY_DETECTION
  OPTIMIZATION_SUGGESTION
  RISK_ASSESSMENT
  PERFORMANCE_INSIGHT
  PREDICTIVE_FORECAST
}

enum InsightSeverity {
  INFO
  WARNING
  CRITICAL
  OPTIMIZATION
}

input AnalysisCardInput {
  analysisType: AnalysisType!
  timeRange: DateRangeInput
  filters: AnalysisFilters
  includeAIInsights: Boolean = true
  urgency: AnalysisUrgency = NORMAL
  userId: String
}

input AnalysisFilters {
  warehouse: String
  productCategories: [String!]
  dateRange: DateRangeInput
  statusFilters: [String!]
  customFilters: JSON
}

input DateRangeInput {
  start: DateTime!
  end: DateTime!
}

type AnalysisCardData {
  analysisType: AnalysisType!
  summary: AnalysisSummary!
  detailData: AnalysisDetailData!
  aiInsights: [AIInsight!]!
  visualizations: [AnalysisVisualization!]!
  metadata: AnalysisMetadata!
  executionTime: Float!
  cached: Boolean!
  lastUpdated: DateTime!
  refreshInterval: Int
}

type AnalysisSummary {
  title: String!
  description: String!
  keyMetrics: [KeyMetric!]!
  overallScore: Float
  status: String!
  alertLevel: String!
}

type KeyMetric {
  name: String!
  value: String!
  change: Float
  changeDirection: String!
  unit: String
  trend: [TrendPoint!]
}

type AnalysisDetailData {
  sections: [AnalysisSection!]!
  dataPoints: [DataPoint!]!
  comparisons: [Comparison!]!
  correlations: [Correlation!]!
}

type AnalysisSection {
  id: String!
  title: String!
  content: String!
  data: JSON!
  visualizationType: String
  importance: String!
}

type DataPoint {
  id: String!
  label: String!
  value: Float!
  timestamp: DateTime!
  category: String
  metadata: JSON
}

type Comparison {
  id: String!
  title: String!
  baseline: Float!
  current: Float!
  change: Float!
  changePercent: Float!
  timeframe: String!
}

type Correlation {
  id: String!
  variables: [String!]!
  coefficient: Float!
  strength: String!
  significance: Float!
  interpretation: String!
}

type AIInsight {
  id: ID!
  type: InsightType!
  confidence: Float!
  title: String!
  content: String!
  recommendations: [String!]!
  severity: InsightSeverity!
  relatedData: JSON
  generatedAt: DateTime!
  modelUsed: String
  processingTime: Float
}

type AnalysisVisualization {
  id: String!
  type: String!
  title: String!
  data: JSON!
  config: JSON!
  interactive: Boolean!
  exportable: Boolean!
}

type AnalysisMetadata {
  analysisId: String!
  userId: String!
  userEmail: String
  generatedAt: DateTime!
  dataSource: String!
  dataPeriod: String!
  recordsAnalyzed: Int!
  aiModelVersion: String
  processingSteps: [ProcessingStep!]!
}

type ProcessingStep {
  step: String!
  duration: Float!
  status: String!
  details: String
}

# Analysis Generation Inputs
input AnalysisGenerationInput {
  analysisType: AnalysisType!
  title: String
  description: String
  filters: AnalysisFilters
  urgency: AnalysisUrgency = NORMAL
  includeAI: Boolean = true
  userId: String!
}

# Analysis Generation Response
type AnalysisGenerationResponse {
  id: ID!
  analysisId: String
  success: Boolean!
  message: String!
  estimatedCompletionTime: DateTime
  progress: Float
}

# Analysis Progress Tracking
type AnalysisProgress {
  id: ID!
  analysisType: AnalysisType!
  title: String!
  status: String!
  progress: Float!
  estimatedTimeRemaining: Int
  currentStep: String!
  error: String
  startedAt: DateTime!
  userId: String!
}

# AI Analysis Configuration
type AIAnalysisConfig {
  modelType: String!
  maxTokens: Int!
  temperature: Float!
  enablePredictions: Boolean!
  enableAnomalyDetection: Boolean!
  confidenceThreshold: Float!
  languages: [String!]!
}

# Query Extensions
extend type Query {
  analysisCardData(input: AnalysisCardInput!): AnalysisCardData!
  analysisProgress(analysisId: ID!): AnalysisProgress
  aiAnalysisConfig: AIAnalysisConfig!
}

# Mutation Extensions
extend type Mutation {
  generateAnalysis(input: AnalysisGenerationInput!): AnalysisGenerationResponse!
  cancelAnalysis(analysisId: ID!): Boolean!
  refreshAnalysis(analysisId: ID!): Boolean!
  updateAnalysisConfig(config: JSON!): Boolean!
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
  ${tableSchema}
  ${reportSchema}
  ${uploadSchema}
  ${analysisSchema}
  ${mainSchema}
`;