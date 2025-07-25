/**
 * GraphQL Schema Definitions
 * Combined schema for the NewPennine WMS
 */

export const baseSchema = `
# Base GraphQL Schema - Core Types
scalar DateTime
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
type AlertCardData implements WidgetData {
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

// List Schema - ListCard with unified list support
export const listSchema = `
# List GraphQL Schema
# ListCard 組件相關類型定義
# 支援統一的列表數據查詢和管理

# 基礎 ListData interface
interface ListData {
  id: ID!
  listType: ListType!
  title: String!
  description: String
  totalCount: Int!
  filteredCount: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
}

# List 類型枚舉
enum ListType {
  ORDER_STATE
  ORDER_RECORD
  WAREHOUSE_TRANSFER
  OTHER_FILES
}

# 訂單狀態列表 (OrderState Lists)
type OrderStateList implements ListData {
  id: ID!
  listType: ListType!
  title: String!
  description: String
  totalCount: Int!
  filteredCount: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
  
  # 訂單狀態特定數據
  orders: OrderStateConnection!
  statusSummary: [OrderStatusSummary!]!
  progressMetrics: OrderProgressMetrics!
}

type OrderStatusSummary {
  status: OrderStatus!
  count: Int!
  percentage: Float!
  averageProcessingTime: Int # minutes
  urgentCount: Int
}

type OrderProgressMetrics {
  totalInProgress: Int!
  averageCompletionRate: Float!
  bottleneckStage: OrderStatus
  predictedCompletionTime: DateTime
}

type OrderStateConnection {
  edges: [OrderStateEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OrderStateEdge {
  cursor: String!
  node: OrderState!
}

type OrderState {
  order: Order!
  currentStage: OrderStatus!
  progress: Float! # 0-100
  stageHistory: [OrderStageHistory!]!
  estimatedCompletion: DateTime
  actualCompletion: DateTime
  isUrgent: Boolean!
  bottlenecks: [String!]
  nextActions: [String!]
}

type OrderStageHistory {
  stage: OrderStatus!
  enteredAt: DateTime!
  exitedAt: DateTime
  duration: Int # minutes
  performedBy: User
  notes: String
}

# 訂單記錄列表 (OrderRecord Lists)
type OrderRecordList implements ListData {
  id: ID!
  listType: ListType!
  title: String!
  description: String
  totalCount: Int!
  filteredCount: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
  
  # 訂單記錄特定數據
  records: OrderRecordConnection!
  timeline: [OrderTimelineEvent!]!
  analytics: OrderRecordAnalytics!
}

type OrderRecordConnection {
  edges: [OrderRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type OrderRecordEdge {
  cursor: String!
  node: OrderRecord!
}

type OrderRecord {
  order: Order!
  recordType: OrderRecordType!
  timestamp: DateTime!
  performedBy: User!
  details: JSON!
  impact: OrderRecordImpact
  relatedRecords: [OrderRecord!]
}

enum OrderRecordType {
  CREATED
  MODIFIED
  STATUS_CHANGED
  ALLOCATED
  PICKED
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
  EXCEPTION
}

type OrderRecordImpact {
  delayMinutes: Int
  costImpact: Float
  customerSatisfaction: OrderRecordImpactLevel
  operationalComplexity: OrderRecordImpactLevel
}

enum OrderRecordImpactLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

type OrderTimelineEvent {
  timestamp: DateTime!
  event: String!
  description: String!
  actor: String!
  category: OrderRecordType!
}

type OrderRecordAnalytics {
  averageOrderCycle: Int! # minutes
  commonBottlenecks: [String!]!
  performanceMetrics: JSON!
  trendData: [OrderTrendPoint!]!
}

type OrderTrendPoint {
  date: DateTime!
  orderCount: Int!
  averageCycleTime: Int!
  completionRate: Float!
}

# 倉庫轉移列表 (WarehouseTransfer Lists)
type WarehouseTransferList implements ListData {
  id: ID!
  listType: ListType!
  title: String!
  description: String
  totalCount: Int!
  filteredCount: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
  
  # 轉移記錄特定數據
  transfers: TransferConnection!
  statusDistribution: [TransferStatusDistribution!]!
  performanceMetrics: TransferPerformanceMetrics!
  locationAnalysis: [LocationTransferAnalysis!]!
}

type TransferStatusDistribution {
  status: TransferStatus!
  count: Int!
  percentage: Float!
  averageDuration: Int # minutes
}

type TransferPerformanceMetrics {
  averageTransferTime: Int! # minutes
  onTimePercentage: Float!
  delayedCount: Int!
  efficiencyScore: Float!
  resourceUtilization: Float!
}

type LocationTransferAnalysis {
  location: Location!
  incomingCount: Int!
  outgoingCount: Int!
  netFlow: Int!
  averageWaitTime: Int! # minutes
  congestionLevel: CongestionLevel!
}

enum CongestionLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

# 其他文件列表 (OtherFiles Lists)
type OtherFilesList implements ListData {
  id: ID!
  listType: ListType!
  title: String!
  description: String
  totalCount: Int!
  filteredCount: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
  
  # 文件列表特定數據
  files: FileRecordConnection!
  categorySummary: [FileCategorySummary!]!
  storageMetrics: FileStorageMetrics!
}

type FileRecordConnection {
  edges: [FileRecordEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type FileRecordEdge {
  cursor: String!
  node: FileRecord!
}

type FileRecord {
  id: ID!
  fileName: String!
  fileType: FileType!
  fileCategory: FileCategory!
  size: Int! # bytes
  mimeType: String!
  url: String!
  thumbnailUrl: String
  
  # 元數據
  uploadedAt: DateTime!
  uploadedBy: User!
  lastModified: DateTime!
  version: String!
  
  # 狀態和標籤
  status: FileStatus!
  tags: [String!]!
  accessibility: FileAccessibility!
  
  # 關聯數據
  relatedEntity: FileRelatedEntity
  permissions: [FilePermission!]!
  downloadCount: Int!
  lastAccessed: DateTime
}

enum FileType {
  DOCUMENT
  IMAGE
  SPREADSHEET
  PDF
  ARCHIVE
  VIDEO
  AUDIO
  OTHER
}

enum FileCategory {
  QC_REPORT
  GRN_DOCUMENT
  SHIPPING_LABEL
  INVOICE
  CERTIFICATE
  PHOTO
  MANUAL
  TEMPLATE
  BACKUP
  LOG
  OTHER
}

enum FileStatus {
  ACTIVE
  ARCHIVED
  PENDING_REVIEW
  EXPIRED
  DELETED
}

enum FileAccessibility {
  PUBLIC
  INTERNAL
  RESTRICTED
  CONFIDENTIAL
}

type FileRelatedEntity {
  entityType: String!
  entityId: String!
  relationship: String!
}

type FilePermission {
  user: User!
  permission: FilePermissionType!
  grantedAt: DateTime!
  grantedBy: User!
}

enum FilePermissionType {
  READ
  WRITE
  DELETE
  SHARE
  ADMIN
}

type FileCategorySummary {
  category: FileCategory!
  count: Int!
  totalSize: Int! # bytes
  averageSize: Int! # bytes
  recentCount: Int! # files added in last 7 days
}

type FileStorageMetrics {
  totalSize: Int! # bytes
  totalFiles: Int!
  averageFileSize: Int! # bytes
  storageUtilization: Float! # percentage
  growthRate: Float! # bytes per day
  topCategories: [FileCategorySummary!]!
}

# Union type for different list data types
union ListDataUnion = OrderStateList | OrderRecordList | WarehouseTransferList | OtherFilesList

# List 輸入參數
input ListCardInput {
  listType: ListType!
  filters: ListFilters
  pagination: PaginationInput
  sort: SortInput
  dateRange: DateRangeInput
  includeMetrics: Boolean = true
}

input ListFilters {
  # 通用過濾器
  search: String
  status: [String!]
  category: [String!]
  tags: [String!]
  userId: ID
  
  # 特定類型過濾器
  orderFilters: OrderListFilters
  transferFilters: TransferListFilters
  fileFilters: FileListFilters
}

input OrderListFilters {
  orderNumbers: [String!]
  customerCodes: [String!]
  statuses: [OrderStatus!]
  priorities: [OrderPriority!]
  isUrgent: Boolean
  valueRange: FloatRangeInput
}

input TransferListFilters {
  transferNumbers: [String!]
  palletNumbers: [String!]
  fromLocations: [String!]
  toLocations: [String!]
  statuses: [TransferStatus!]
  priorities: [TransferPriority!]
}

input FileListFilters {
  fileTypes: [FileType!]
  categories: [FileCategory!]
  statuses: [FileStatus!]
  accessibility: [FileAccessibility!]
  sizeRange: IntRangeInput
  hasPermissions: [FilePermissionType!]
}

input FloatRangeInput {
  min: Float
  max: Float
}

input IntRangeInput {
  min: Int
  max: Int
}

enum OrderPriority {
  LOW
  NORMAL
  HIGH
  URGENT
  CRITICAL
}

# 統計和分析輸入
input ListAnalyticsInput {
  listType: ListType!
  dateRange: DateRangeInput!
  groupBy: AnalyticsGroupBy
  metrics: [AnalyticsMetric!]
}

enum AnalyticsGroupBy {
  HOUR
  DAY
  WEEK
  MONTH
  STATUS
  CATEGORY
  USER
  LOCATION
}

enum AnalyticsMetric {
  COUNT
  AVERAGE_DURATION
  SUCCESS_RATE
  THROUGHPUT
  EFFICIENCY
  UTILIZATION
}

type ListMetadata {
  listType: ListType!
  availableFilters: [FilterMetadata!]!
  availableSorts: [SortMetadata!]!
  defaultPageSize: Int!
  maxPageSize: Int!
  supportedFormats: [ExportFormat!]!
}

type FilterMetadata {
  field: String!
  type: FilterFieldType!
  options: [String!]
  required: Boolean!
}

enum FilterFieldType {
  STRING
  NUMBER
  DATE
  BOOLEAN
  ENUM
  ARRAY
}

type SortMetadata {
  field: String!
  displayName: String!
  defaultDirection: SortDirection!
}

enum ExportFormat {
  CSV
  EXCEL
  PDF
  JSON
}

# 文件操作輸入類型
input FileUploadInput {
  fileName: String!
  fileType: FileType!
  category: FileCategory!
  data: String! # Base64 encoded
  relatedEntity: FileRelatedEntityInput
  tags: [String!]
  accessibility: FileAccessibility
}

input FileRelatedEntityInput {
  entityType: String!
  entityId: String!
  relationship: String!
}

input FileMetadataInput {
  fileName: String
  category: FileCategory
  tags: [String!]
  accessibility: FileAccessibility
  status: FileStatus
}

input BatchFileOperationInput {
  operation: FileOperation!
  fileIds: [ID!]!
  metadata: FileMetadataInput
}

enum FileOperation {
  DELETE
  ARCHIVE
  UPDATE_CATEGORY
  UPDATE_TAGS
  CHANGE_ACCESSIBILITY
}

input ListConfigurationInput {
  listType: ListType!
  name: String!
  filters: ListFilters!
  sort: SortInput!
  isDefault: Boolean!
  isPublic: Boolean!
}
`;

// Form Schema - FormCard with unified form support
export const formSchema = `
# Form GraphQL Schema
# FormCard 統一表單系統
# NewPennine Warehouse Management System

# ==========================================
# 核心表單類型枚舉
# ==========================================

enum FormType {
  # 產品相關表單
  PRODUCT_EDIT         # 產品編輯表單 (基於 ProductEditForm)
  PRODUCT_CREATE       # 產品創建表單
  PRODUCT_BULK_EDIT    # 產品批量編輯
  
  # 文件相關表單
  FILE_UPLOAD          # 文件上傳表單
  FILE_METADATA_EDIT   # 文件元數據編輯
  DOCUMENT_UPLOAD      # 文檔上傳表單
  
  # 操作確認表單
  VOID_CONFIRMATION    # 作廢確認表單
  DELETE_CONFIRMATION  # 刪除確認表單
  TRANSFER_CONFIRMATION # 轉移確認表單
  
  # 庫存相關表單
  INVENTORY_ADJUST     # 庫存調整表單
  INVENTORY_TRANSFER   # 庫存轉移表單
  STOCK_COUNT         # 盤點表單
  
  # 訂單相關表單
  ORDER_CREATE        # 訂單創建表單
  ORDER_EDIT          # 訂單編輯表單
  GRN_CREATE          # GRN 創建表單
  
  # 系統配置表單
  USER_PROFILE        # 用戶配置表單
  SYSTEM_CONFIG       # 系統配置表單
  NOTIFICATION_CONFIG # 通知配置表單
}

enum FormFieldType {
  TEXT
  EMAIL
  PASSWORD
  NUMBER
  DECIMAL
  DATE
  DATETIME
  TIME
  SELECT
  MULTI_SELECT
  RADIO
  CHECKBOX
  TOGGLE
  TEXTAREA
  RICH_TEXT
  FILE_UPLOAD
  IMAGE_UPLOAD
  COLOR_PICKER
  PRODUCT_SELECTOR
  LOCATION_SELECTOR
  USER_SELECTOR
  BARCODE_SCANNER
}

enum ValidationRuleType {
  REQUIRED
  MIN_LENGTH
  MAX_LENGTH
  MIN_VALUE
  MAX_VALUE
  PATTERN
  EMAIL
  URL
  CUSTOM
  UNIQUE
  EXISTS
}

type ValidationRule {
  type: ValidationRuleType!
  value: JSON
  message: String!
  errorCode: String
}

type FormField {
  id: ID!
  name: String!
  label: String!
  type: FormFieldType!
  placeholder: String
  helpText: String
  defaultValue: JSON
  validationRules: [ValidationRule!]!
  isRequired: Boolean!
  isDisabled: Boolean!
  isReadOnly: Boolean!
  isHidden: Boolean!
  options: [FormFieldOption!]
  order: Int!
  gridCols: Int
}

type FormFieldOption {
  value: String!
  label: String!
  description: String
  isDefault: Boolean!
  isDisabled: Boolean!
}

type FormConfig {
  id: ID!
  type: FormType!
  name: String!
  title: String!
  description: String
  fields: [FormField!]!
  layout: FormLayout!
  submitButtonText: String
  cancelButtonText: String
  validateOnChange: Boolean!
  version: String!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum FormLayout {
  VERTICAL
  HORIZONTAL
  GRID
  WIZARD
  TABS
}

type FormData {
  formType: FormType!
  formConfigId: ID!
  data: JSON!
  submittedAt: DateTime!
  submittedBy: String!
  validation: FormValidationResult
}

type FormValidationResult {
  isValid: Boolean!
  errors: [FormFieldError!]!
  warnings: [FormFieldWarning!]!
}

type FormFieldError {
  fieldName: String!
  message: String!
  errorCode: String!
  value: JSON
}

type FormFieldWarning {
  fieldName: String!
  message: String!
  warningCode: String!
  value: JSON
}

type ProductFormOptions {
  colours: [FormFieldOption!]!
  types: [FormFieldOption!]!
  units: [FormFieldOption!]!
  suppliers: [FormFieldOption!]!
}

input FormSubmissionInput {
  formType: FormType!
  formConfigId: ID
  data: JSON!
  entityId: ID
  submitMode: FormSubmitMode!
  validateOnly: Boolean
}

enum FormSubmitMode {
  CREATE
  UPDATE
  UPSERT
  DELETE
}

type FormSubmissionResult {
  success: Boolean!
  entityId: ID
  data: JSON
  validation: FormValidationResult
  error: Error
}

extend type Query {
  formConfig(type: FormType!): FormConfig
    @auth(requires: VIEWER)
    @cache(ttl: 3600, scope: PUBLIC)
    
  formConfigs(types: [FormType!]): [FormConfig!]!
    @auth(requires: VIEWER)
    @cache(ttl: 3600, scope: PUBLIC)
    
  productFormOptions: ProductFormOptions!
    @auth(requires: VIEWER)
    @cache(ttl: 3600, scope: PUBLIC)
    
  validateFormData(formType: FormType!, data: JSON!): FormValidationResult!
    @auth(requires: VIEWER)
    @rateLimit(max: 100, window: "1m")
    
  formPrefillData(formType: FormType!, entityId: ID, params: JSON): JSON
    @auth(requires: VIEWER)
    @rateLimit(max: 50, window: "1m")
}

extend type Mutation {
  submitForm(input: FormSubmissionInput!): FormSubmissionResult!
    @auth(requires: OPERATOR)
    @rateLimit(max: 30, window: "1m")
}

extend type Subscription {
  formConfigUpdated(formType: FormType!): FormConfig!
    @auth(requires: VIEWER)
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

// Config Schema - ConfigCard with unified configuration management
export const configSchema = `
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
type ConfigCardData implements WidgetData {
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

// Search Schema - SearchCard with unified search interface
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
  filters: JSON                   # 過濾器 (JSON格式)
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
    @auth(requires: VIEWER)
    @rateLimit(max: 100, window: "1m")
    @cache(ttl: 300, scope: USER)
  
  # 批量搜索
  batchSearch(inputs: [SearchCardInput!]!): [SearchCardData!]!
    @auth(requires: VIEWER)
    @rateLimit(max: 20, window: "1m")
  
  # 搜索建議
  searchSuggestions(
    query: String!
    entity: SearchableEntity
    limit: Int = 10
  ): [SearchSuggestion!]!
    @auth(requires: VIEWER)
    @rateLimit(max: 200, window: "1m")
    @cache(ttl: 600, scope: USER)
  
  # 搜索歷史
  searchHistory(
    userId: ID
    limit: Int = 50
    offset: Int = 0
  ): [SearchHistoryItem!]!
    @auth(requires: VIEWER)
    @rateLimit(max: 50, window: "1m")
  
  # 搜索配置
  searchConfigs(
    userId: ID
    includePublic: Boolean = true
  ): [SearchConfig!]!
    @auth(requires: VIEWER)
    @cache(ttl: 1800, scope: USER)
  
  # 搜索分析
  searchAnalytics(
    dateRange: DateRangeInput
    entities: [SearchableEntity!]
  ): SearchAnalytics!
    @auth(requires: SUPERVISOR)
    @cache(ttl: 3600, scope: ADMIN)
}

extend type Mutation {
  # 保存搜索配置
  saveSearchConfig(input: SaveSearchConfigInput!): SearchConfig!
    @auth(requires: VIEWER)
    @rateLimit(max: 10, window: "1m")
  
  # 刪除搜索配置
  deleteSearchConfig(id: ID!): Boolean!
    @auth(requires: VIEWER)
    @rateLimit(max: 20, window: "1m")
  
  # 清除搜索歷史
  clearSearchHistory(userId: ID, olderThan: DateTime): Boolean!
    @auth(requires: VIEWER)
    @rateLimit(max: 5, window: "1m")
  
  # 更新搜索偏好
  updateSearchPreferences(
    preferences: JSON!
  ): Boolean!
    @auth(requires: VIEWER)
    @rateLimit(max: 10, window: "1m")
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
  ${alertSchema}
  ${listSchema}
  ${analysisSchema}
  ${configSchema}
  ${formSchema}
  ${searchSchema}
  ${mainSchema}
`;
