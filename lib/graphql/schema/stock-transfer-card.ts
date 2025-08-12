/**
 * GraphQL Schema for StockTransferCard
 * Handles transfer history records with aggregation and filtering
 */

export const stockTransferCardSchema = `
# Stock Transfer Card Types
type StockTransferRecord {
  id: ID!
  time: DateTime!
  user: TransferUser!
  action: String!
  pltNums: [String!]!  # Aggregated pallet numbers
  location: String
  remarks: [String!]!  # Aggregated remarks
  isAggregated: Boolean!
  recordCount: Int!     # Number of records aggregated
  timeRange: TransferTimeRange
  uuid: String!
}

type TransferUser {
  id: String!
  name: String!
  department: String!
  position: String!
  email: String
  iconUrl: String
}

type TransferTimeRange {
  start: DateTime!
  end: DateTime!
  duration: Int!  # minutes
}

type StockTransferConnection {
  edges: [StockTransferEdge!]!
  pageInfo: StockTransferPageInfo!
  totalCount: Int!
  hasNextPage: Boolean!
  aggregatedCount: Int!  # Number of records before aggregation
}

type StockTransferEdge {
  cursor: String!
  node: StockTransferRecord!
}

type StockTransferPageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  currentPage: Int!
  totalPages: Int!
}

# Input Types
input StockTransferCardInput {
  # Pagination
  first: Int = 10
  after: String
  page: Int = 1
  
  # Filters
  filters: StockTransferFilters
  
  # Aggregation settings
  aggregation: TransferAggregationSettings
  
  # Sorting
  sortBy: TransferSortField = TIME
  sortOrder: SortDirection = DESC
}

input StockTransferFilters {
  # User filters
  userId: String
  userName: String
  department: String
  
  # Action filters
  action: String
  actions: [String!]
  
  # Pallet filters
  pltNum: String
  pltNums: [String!]
  pltNumPattern: String  # For pattern matching like "070825/*"
  
  # Location filters
  location: String
  locations: [String!]
  
  # Time filters
  dateRange: DateRangeInput
  timeRange: TimeRangeInput
  
  # Other filters
  hasRemarks: Boolean
  excludeSystemActions: Boolean = true
}

input TimeRangeInput {
  startTime: String  # HH:MM format
  endTime: String    # HH:MM format
}

input TransferAggregationSettings {
  enabled: Boolean = true
  timeWindow: Int = 5        # minutes
  maxRecordsPerGroup: Int = 50
  groupBySameAction: Boolean = true
  groupBySameUser: Boolean = true
  groupBySameLocation: Boolean = false
  enablePalletRanges: Boolean = true
  combineRemarks: Boolean = true
}

enum TransferSortField {
  TIME
  USER_NAME
  ACTION
  PALLET_COUNT
  RECORD_COUNT
}

# Aggregation Helper Types
type PalletRange {
  prefix: String!     # e.g., "070825/"
  start: Int!         # e.g., 1
  end: Int!          # e.g., 4
  formatted: String!  # e.g., "070825/1 - 070825/4"
  count: Int!        # e.g., 4
}

type TransferStatistics {
  totalRecords: Int!
  uniqueUsers: Int!
  uniqueActions: Int!
  uniquePallets: Int!
  dateRange: DateRange!
  topActions: [ActionCount!]!
  topUsers: [UserCount!]!
  activityByHour: [HourlyActivity!]!
}

type ActionCount {
  action: String!
  count: Int!
  percentage: Float!
}

type UserCount {
  user: TransferUser!
  count: Int!
  percentage: Float!
}

type HourlyActivity {
  hour: Int!  # 0-23
  count: Int!
  label: String!  # e.g., "2:00 PM"
}

# Card Data Type
type StockTransferCardData implements WidgetData {
  transfers: StockTransferConnection!
  statistics: TransferStatistics!
  filters: StockTransferFilters
  aggregationSettings: TransferAggregationSettings!
  lastUpdated: DateTime!
  refreshInterval: Int
  dataSource: String!
}

# Query Extensions
extend type Query {
  stockTransferCardData(input: StockTransferCardInput!): StockTransferCardData!
  stockTransferRecord(id: ID!): StockTransferRecord
  stockTransferStatistics(
    filters: StockTransferFilters
    dateRange: DateRangeInput
  ): TransferStatistics!
}

# Mutation Extensions
extend type Mutation {
  refreshStockTransferCache: Boolean!
}

# Subscription Extensions
extend type Subscription {
  stockTransferUpdated(
    filters: StockTransferFilters
  ): StockTransferRecord!
}
`;