/**
 * Record History GraphQL Schema
 * For VerticalTimelineCard functionality with merged operation support
 */

export const recordHistorySchema = `
  # Record History Schema - Enhanced with intelligent merging

  # Basic record history entry from database
  type RecordHistoryEntry {
    id: ID!
    time: DateTime!
    operatorId: Int
    operatorName: String
    operatorDepartment: String
    operatorPosition: String
    operatorEmail: String
    action: String!
    pltNum: String
    location: String
    remark: String!
    uuid: String!
  }

  # Merged record for timeline display with smart grouping
  type MergedRecordHistory {
    id: ID!
    operatorId: Int!
    operatorName: String!
    operatorDepartment: String
    operatorPosition: String
    operatorEmail: String
    action: String!
    count: Int!
    palletNumbers: [String!]!
    timeStart: DateTime!
    timeEnd: DateTime!
    remark: String!
    duration: Int! # Duration in seconds
    efficiency: Float # Operations per minute
    locations: [String!] # All locations involved
    isSequential: Boolean! # Whether operations were performed sequentially
    averageTimeBetweenOps: Float # Average seconds between operations
  }

  # Pagination and filtering
  input RecordHistoryFilters {
    operatorId: Int
    operatorName: String
    operatorEmail: String
    action: String
    pltNum: String
    location: String
    dateRange: DateRangeInput
    searchTerm: String # Search across operator name, action, pallet, location
    departments: [String!] # Filter by operator departments
    positions: [String!] # Filter by operator positions
    actions: [String!] # Multiple action types
    palletNumbers: [String!] # Multiple pallet numbers
    locations: [String!] # Multiple locations
    minDuration: Int # Minimum operation duration
    maxDuration: Int # Maximum operation duration
    hasMultipleOperations: Boolean # Only show merged records with count > 1
  }

  input RecordHistoryPagination {
    limit: Int = 10
    offset: Int = 0
    cursor: String # For cursor-based pagination
  }

  input RecordHistorySort {
    field: RecordHistorySortField = TIME_START
    direction: SortDirection = DESC
  }

  enum RecordHistorySortField {
    TIME_START
    TIME_END
    OPERATOR_NAME
    ACTION
    COUNT
    DURATION
    EFFICIENCY
    PALLET_COUNT
  }

  # Advanced merging configuration
  input MergingConfig {
    timeWindowMinutes: Int = 5 # Time window for merging operations
    sameOperatorOnly: Boolean = true # Only merge operations by same operator
    sameActionOnly: Boolean = true # Only merge same action types
    minOperationsToMerge: Int = 2 # Minimum operations needed for merging
    maxOperationsPerGroup: Int = 50 # Maximum operations to merge into one group
    includeSequentialAnalysis: Boolean = true # Calculate sequential operation metrics
    groupByLocation: Boolean = false # Whether to consider location in grouping
  }

  # Output types for applied settings
  type AppliedFilters {
    operatorId: Int
    operatorName: String
    operatorEmail: String
    action: String
    pltNum: String
    location: String
    dateRange: DateRange
    searchTerm: String
    departments: [String!]
    positions: [String!]
    actions: [String!]
    palletNumbers: [String!]
    locations: [String!]
    minDuration: Int
    maxDuration: Int
    hasMultipleOperations: Boolean
  }

  type AppliedPagination {
    limit: Int
    offset: Int
    cursor: String
  }

  type AppliedSort {
    field: RecordHistorySortField
    direction: SortDirection
  }

  type AppliedMergingConfig {
    timeWindowMinutes: Int
    sameOperatorOnly: Boolean
    sameActionOnly: Boolean
    minOperationsToMerge: Int
    maxOperationsPerGroup: Int
    includeSequentialAnalysis: Boolean
    groupByLocation: Boolean
  }

  # Main query result
  type RecordHistoryResult {
    mergedRecords: [MergedRecordHistory!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    nextCursor: String
    previousCursor: String
    
    # Summary statistics
    summary: RecordHistorySummary!
    
    # Performance metrics
    queryTime: Float!
    cacheHit: Boolean!
    
    # Applied filters and settings
    appliedFilters: AppliedFilters
    pagination: AppliedPagination
    sorting: AppliedSort
    mergingConfig: AppliedMergingConfig
  }

  # Summary statistics for the query results
  type RecordHistorySummary {
    totalOperations: Int!
    totalMergedRecords: Int!
    uniqueOperators: Int!
    uniqueActions: Int!
    uniqueLocations: Int!
    uniquePallets: Int!
    timeSpan: TimeSpan!
    topOperators: [OperatorSummary!]!
    topActions: [ActionSummary!]!
    efficiencyMetrics: EfficiencyMetrics!
    mergingStats: MergingStats!
  }

  type TimeSpan {
    start: DateTime!
    end: DateTime!
    durationHours: Float!
  }

  type OperatorSummary {
    operatorId: Int!
    operatorName: String!
    operationCount: Int!
    percentage: Float!
    avgEfficiency: Float!
  }

  type ActionSummary {
    action: String!
    count: Int!
    percentage: Float!
    avgDuration: Float!
  }

  type EfficiencyMetrics {
    averageOperationsPerMinute: Float!
    fastestOperator: OperatorEfficiency!
    slowestOperator: OperatorEfficiency!
    peakHour: Int! # Hour of day with most operations
    quietHour: Int! # Hour of day with least operations
  }

  type OperatorEfficiency {
    operatorId: Int!
    operatorName: String!
    operationsPerMinute: Float!
    totalOperations: Int!
  }

  type MergingStats {
    totalOriginalRecords: Int!
    totalMergedGroups: Int!
    compressionRatio: Float! # How much data was compressed
    averageGroupSize: Float!
    largestGroupSize: Int!
    sequentialGroups: Int! # Groups with sequential operations
  }

  # Real-time data types for subscriptions
  type RecordHistoryUpdate {
    type: RecordHistoryUpdateType!
    record: RecordHistoryEntry!
    affectedMergedRecord: MergedRecordHistory
    operatorId: Int!
    timestamp: DateTime!
  }

  enum RecordHistoryUpdateType {
    NEW_RECORD
    MERGED_UPDATE
    OPERATOR_ACTIVITY
  }

  # Trend analysis types
  type RecordHistoryTrends {
    hourlyDistribution: [HourlyTrend!]!
    dailyDistribution: [DailyTrend!]!
    operatorTrends: [OperatorTrend!]!
    actionTrends: [ActionTrend!]!
    efficiencyTrends: [EfficiencyTrend!]!
  }

  type HourlyTrend {
    hour: Int!
    operationCount: Int!
    uniqueOperators: Int!
    avgEfficiency: Float!
  }

  type DailyTrend {
    date: DateTime!
    operationCount: Int!
    uniqueOperators: Int!
    avgEfficiency: Float!
    peakHour: Int!
  }

  type OperatorTrend {
    operatorId: Int!
    operatorName: String!
    trend: [TrendPoint!]!
    totalGrowth: Float! # Growth in operations over period
  }

  type ActionTrend {
    action: String!
    trend: [TrendPoint!]!
    totalGrowth: Float!
  }

  type EfficiencyTrend {
    timestamp: DateTime!
    avgOperationsPerMinute: Float!
    activeOperators: Int!
  }

  # Export functionality
  input RecordHistoryExportInput {
    filters: RecordHistoryFilters
    format: ExportFormat!
    includeRawData: Boolean = false
    includeSummaryStats: Boolean = true
    mergingConfig: MergingConfig
  }

  type RecordHistoryExportResult {
    downloadUrl: String!
    fileName: String!
    fileSize: Int!
    recordCount: Int!
    expiresAt: DateTime!
  }

  # Extended Query types
  extend type Query {
    # Main record history query with intelligent merging
    recordHistory(
      filters: RecordHistoryFilters
      pagination: RecordHistoryPagination
      sorting: RecordHistorySort
      mergingConfig: MergingConfig
    ): RecordHistoryResult!

    # Get single merged record by ID
    mergedRecord(id: ID!): MergedRecordHistory

    # Get raw records without merging
    rawRecordHistory(
      filters: RecordHistoryFilters
      pagination: RecordHistoryPagination
      sorting: RecordHistorySort
    ): [RecordHistoryEntry!]!

    # Get trends and analytics
    recordHistoryTrends(
      filters: RecordHistoryFilters
      timeGranularity: TimeGranularity = HOUR
    ): RecordHistoryTrends!

    # Get operator activity summary
    operatorActivity(
      operatorIds: [Int!]
      dateRange: DateRangeInput!
    ): [OperatorSummary!]!

    # Search suggestions for autocomplete
    recordHistorySearchSuggestions(
      field: String! # "operator", "action", "pallet", "location"
      query: String!
      limit: Int = 10
    ): [String!]!
  }

  # Extended Mutation types
  extend type Mutation {
    # Create new record history entry (usually called by system)
    createRecordHistoryEntry(input: CreateRecordHistoryInput!): RecordHistoryEntry!

    # Bulk create record history entries
    bulkCreateRecordHistory(entries: [CreateRecordHistoryInput!]!): BatchResult!

    # Export record history data
    exportRecordHistory(input: RecordHistoryExportInput!): RecordHistoryExportResult!

    # Update merging configuration globally
    updateMergingConfig(config: MergingConfig!): Boolean!

    # Clear record history cache
    clearRecordHistoryCache: Boolean!
  }

  # Extended Subscription types
  extend type Subscription {
    # Real-time record history updates
    recordHistoryUpdated(
      operatorIds: [Int!]
      actions: [String!]
      locations: [String!]
    ): RecordHistoryUpdate!

    # Operator activity alerts
    operatorActivityAlert(
      operatorIds: [Int!]
      thresholdOperationsPerMinute: Float = 10.0
    ): OperatorEfficiency!

    # High-frequency operation alerts
    highFrequencyAlert(
      timeWindowMinutes: Int = 1
      minOperationsPerWindow: Int = 20
    ): MergedRecordHistory!
  }

  # Input types for mutations
  input CreateRecordHistoryInput {
    operatorId: Int!
    action: String!
    pltNum: String
    location: String
    remark: String = ""
    timestamp: DateTime # If not provided, uses current time
  }

  # Error types
  type RecordHistoryError {
    code: RecordHistoryErrorCode!
    message: String!
    field: String
    details: JSON
  }

  enum RecordHistoryErrorCode {
    INVALID_OPERATOR
    INVALID_TIMERANGE
    EXPORT_FAILED
    MERGE_CONFIG_INVALID
    DATABASE_ERROR
    PERMISSION_DENIED
    RATE_LIMIT_EXCEEDED
  }
`;