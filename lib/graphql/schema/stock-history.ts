/**
 * Stock History GraphQL Schema
 * Complete schema for stock history operations with pagination, filtering, and real-time updates
 */

export const stockHistorySchema = `
# Stock History Core Types
type StockHistoryRecord {
  id: ID!
  timestamp: DateTime!
  palletNumber: String!
  productCode: String!
  action: StockAction!
  location: String
  fromLocation: String
  toLocation: String
  operator: User
  operatorName: String! # Denormalized for performance
  quantity: Int
  remark: String
  metadata: JSON
  
  # Relations
  pallet: Pallet
  product: Product
  transfer: Transfer
  
  # Computed fields
  actionType: StockActionType!
  actionCategory: StockActionCategory!
}

# Enhanced enum for stock actions
enum StockAction {
  CREATED
  TRANSFERRED
  MOVED
  ALLOCATED
  VOIDED
  ADJUSTED
  LOADED
  UNLOADED
  QUALITY_CHECK
  FINISHED_QC
  GRN_RECEIVING
  GRN_LABEL_ERROR # Simplified name for GRN label business errors
  DAMAGED
  REPAIRED
  EXPIRED
  UNKNOWN
}

enum StockActionType {
  MOVEMENT
  STATUS_CHANGE
  QUANTITY_CHANGE
  SYSTEM_ACTION
}

enum StockActionCategory {
  INBOUND
  OUTBOUND
  INTERNAL
  ADMINISTRATIVE
}

# Pallet History - Product Code based lookup
type PalletHistoryResult {
  productCode: String!
  productInfo: ProductBasicInfo!
  records: [StockHistoryRecord!]!
  totalRecords: Int!
  pageInfo: PageInfo!
  aggregations: PalletHistoryAggregations!
  
  # Time-based groupings
  timelineGroups: [TimelineGroup!]!
  locationDistribution: [LocationCount!]!
  operatorDistribution: [OperatorCount!]!
}

type ProductBasicInfo {
  code: String!
  description: String!
  chineseDescription: String # Note: Field doesn't exist in database
  type: String
  colour: String
  standardQty: Int # Maps to standard_qty column
  # Removed: totalPallets and activePallets (not needed for simplified version)
}

type PalletHistoryAggregations {
  totalActions: Int!
  uniquePallets: Int!
  uniqueOperators: Int!
  timeRange: DateRange  # Made optional for all-time history views
  mostActiveLocation: String
  mostActiveOperator: String
}

# Pallet-specific history (by pallet number) - simplified
type SinglePalletHistoryResult {
  palletNumber: String!
  palletInfo: PalletBasicInfo!
  records: [StockHistoryRecord!]!
  totalRecords: Int!
  pageInfo: PageInfo!
  
  # Removed: timeline, currentStatus, journey (not needed for simplified version)
}

type PalletBasicInfo {
  palletNumber: String!
  # Removed: series (not needed for simplified version)
  productCode: String!
  product: ProductBasicInfo!
  quantity: Int!
  # Removed: currentLocation, status, createdAt, createdBy (not needed for simplified version)
}

type PalletTimeline {
  created: DateTime!
  firstMovement: DateTime
  lastMovement: DateTime
  totalMovements: Int!
  totalDaysActive: Int!
  averageLocationStay: Float!
}

type PalletCurrentStatus {
  location: String
  lastAction: StockAction!
  lastActionAt: DateTime!
  lastOperator: String!
  isActive: Boolean!
  daysInCurrentLocation: Int!
}

type LocationJourney {
  sequence: Int!
  location: String!
  entryTime: DateTime!
  exitTime: DateTime
  duration: Int # minutes
  actions: [StockAction!]!
  operator: String
}

# Transfer Time Flow (Enhanced)
type TransferTimeFlowResult {
  transfers: [EnhancedTransferRecord!]!
  totalCount: Int!
  pageInfo: PageInfo!
  summary: TransferFlowSummary!
  
  # Time-based analysis
  flowMetrics: FlowMetrics!
  bottlenecks: [LocationBottleneck!]!
  operatorPerformance: [OperatorPerformance!]!
}

type EnhancedTransferRecord {
  id: ID!
  timestamp: DateTime!
  operator: String!
  operatorInfo: User
  action: String!
  palletNumber: String!
  fromLocation: String!
  toLocation: String!
  duration: Int # minutes if calculable
  
  # Formatted display fields
  formattedDate: String!
  formattedTime: String!
  formattedDuration: String
  
  # Relations
  pallet: PalletBasicInfo
  
  # Performance metrics
  isBottleneck: Boolean!
  efficiency: Float
}

type TransferFlowSummary {
  totalTransfers: Int!
  uniquePallets: Int!
  uniqueOperators: Int!
  averageTransferTime: Float!
  timeSpan: DateRange!
  topFromLocation: String!
  topToLocation: String!
}

# Supporting types for aggregations
type TimelineGroup {
  date: DateTime!
  count: Int!
}

type LocationCount {
  location: String!
  count: Int!
  percentage: Float!
}

type OperatorCount {
  operatorName: String!
  operatorId: String!
  count: Int!
  percentage: Float!
  efficiency: Float
}


type FlowMetrics {
  averageTransferDuration: Float!
  p95TransferDuration: Float!
  totalThroughput: Int!
  peakHour: String!
  slowestRoute: RouteMetric
  fastestRoute: RouteMetric
}

type LocationBottleneck {
  location: String!
  avgWaitTime: Float!
  backlogCount: Int!
  severity: BottleneckSeverity!
}

type OperatorPerformance {
  operatorName: String!
  transfersPerHour: Float!
  averageDuration: Float!
  efficiency: Float!
  rank: Int!
}

type RouteMetric {
  fromLocation: String!
  toLocation: String!
  averageDuration: Float!
  count: Int!
}

enum BottleneckSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

# Input Types for Filtering and Pagination

input StockHistoryFilter {
  productCodes: [String!]
  palletNumbers: [String!]
  actions: [StockAction!]
  actionTypes: [StockActionType!]
  actionCategories: [StockActionCategory!]
  locations: [String!]
  operators: [String!]
  dateRange: DateRangeInput
  
  # Advanced filters
  hasRemark: Boolean
  minQuantity: Int
  maxQuantity: Int
  includeVoided: Boolean
}

input TransferTimeFlowFilter {
  dateRange: DateRangeInput!
  operators: [String!]
  fromLocations: [String!]
  toLocations: [String!]
  palletNumbers: [String!]
  minDuration: Int
  maxDuration: Int
  includeBottlenecks: Boolean
}

input StockHistoryPagination {
  first: Int
  after: String
  last: Int
  before: String
  offset: Int
  limit: Int = 20
  
  # Cursor-based pagination preferred
  useCursor: Boolean = true
}

input StockHistorySort {
  field: StockHistorySortField!
  direction: SortDirection!
  secondary: StockHistorySort
}

enum StockHistorySortField {
  TIMESTAMP
  PALLET_NUMBER
  PRODUCT_CODE
  ACTION
  LOCATION
  OPERATOR
  QUANTITY
}

# Real-time Subscription Types

type StockMovementUpdate {
  recordId: ID!
  type: StockUpdateType!
  record: StockHistoryRecord!
  affectedPallets: [String!]!
  affectedProducts: [String!]!
  affectedLocations: [String!]!
  timestamp: DateTime!
}

enum StockUpdateType {
  NEW_RECORD
  STATUS_CHANGE
  LOCATION_CHANGE
  QUANTITY_CHANGE
  VOID_OPERATION
}

# Query Extensions
extend type Query {
  # Product-based history lookup (main StockHistoryCard functionality)
  palletHistoryByProduct(
    productCode: String!
    filter: StockHistoryFilter
    pagination: StockHistoryPagination
    sort: StockHistorySort
  ): PalletHistoryResult!
  
  # Pallet-specific history lookup
  palletHistoryByNumber(
    palletNumber: String!
    includeJourney: Boolean = true
    includeSeries: Boolean = true
  ): SinglePalletHistoryResult!
  
  # Stock history statistics for analytics
  stockHistoryStats(
    filter: StockHistoryFilter
    includeTrends: Boolean = false
    trendsInterval: String = "1d"
  ): StockHistoryStats!
}

enum StockHistorySearchType {
  PRODUCT_CODE
  PALLET_NUMBER
  OPERATOR
  LOCATION
  REMARK
}

type StockHistorySearchResult {
  id: String!
  type: StockHistorySearchType!
  title: String!
  subtitle: String
  description: String
  matchScore: Float!
  
  # Context for navigation
  productCode: String
  palletNumber: String
  recordId: String
}

type StockHistoryStats {
  totalRecords: Int!
  uniquePallets: Int!
  uniqueProducts: Int!
  activeLocations: Int!
  recentActivity: Int! # last 24h
  
  # Trend data for charts (only for StockLevelListAndChartCard)
  trendsData: [StockTrendPoint!]!
}

type StockTrendPoint {
  timestamp: DateTime!
  value: Int!
  label: String
}

# Removed: All input types and result types for mutations and subscriptions
# (not needed for simplified version)
`;