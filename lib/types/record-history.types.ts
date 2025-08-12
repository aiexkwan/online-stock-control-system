/**
 * Record History Types
 * TypeScript type definitions for Record History GraphQL operations
 */

// Base record history entry from database
export interface RecordHistoryEntry {
  id: string;
  time: string;
  operatorId?: number;
  operatorName?: string;
  operatorDepartment?: string;
  operatorPosition?: string;
  operatorEmail?: string;
  action: string;
  pltNum?: string;
  location?: string;
  remark: string;
  uuid: string;
}

// Merged record for timeline display
export interface MergedRecordHistory {
  id: string;
  operatorId: number;
  operatorName: string;
  operatorDepartment?: string;
  operatorPosition?: string;
  operatorEmail?: string;
  action: string;
  count: number;
  palletNumbers: string[];
  timeStart: string;
  timeEnd: string;
  remark: string;
  duration: number; // in seconds
  efficiency: number; // operations per minute
  locations: string[];
  isSequential: boolean;
  averageTimeBetweenOps: number; // in seconds
}

// Filtering options
export interface RecordHistoryFilters {
  operatorId?: number;
  operatorName?: string;
  operatorEmail?: string;
  action?: string;
  pltNum?: string;
  location?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  searchTerm?: string;
  departments?: string[];
  positions?: string[];
  actions?: string[];
  palletNumbers?: string[];
  locations?: string[];
  minDuration?: number;
  maxDuration?: number;
  hasMultipleOperations?: boolean;
}

// Pagination options
export interface RecordHistoryPagination {
  limit?: number;
  offset?: number;
  cursor?: string;
}

// Sorting options
export type RecordHistorySortField = 
  | 'TIME_START'
  | 'TIME_END'
  | 'OPERATOR_NAME'
  | 'ACTION'
  | 'COUNT'
  | 'DURATION'
  | 'EFFICIENCY'
  | 'PALLET_COUNT';

export interface RecordHistorySort {
  field?: RecordHistorySortField;
  direction?: 'ASC' | 'DESC';
}

// Merging configuration
export interface MergingConfig {
  timeWindowMinutes?: number;
  sameOperatorOnly?: boolean;
  sameActionOnly?: boolean;
  minOperationsToMerge?: number;
  maxOperationsPerGroup?: number;
  includeSequentialAnalysis?: boolean;
  groupByLocation?: boolean;
}

// Summary statistics
export interface TimeSpan {
  start: string;
  end: string;
  durationHours: number;
}

export interface OperatorSummary {
  operatorId: number;
  operatorName: string;
  operationCount: number;
  percentage: number;
  avgEfficiency: number;
}

export interface ActionSummary {
  action: string;
  count: number;
  percentage: number;
  avgDuration: number;
}

export interface OperatorEfficiency {
  operatorId: number;
  operatorName: string;
  operationsPerMinute: number;
  totalOperations: number;
}

export interface EfficiencyMetrics {
  averageOperationsPerMinute: number;
  fastestOperator: OperatorEfficiency;
  slowestOperator: OperatorEfficiency;
  peakHour: number;
  quietHour: number;
}

export interface MergingStats {
  totalOriginalRecords: number;
  totalMergedGroups: number;
  compressionRatio: number;
  averageGroupSize: number;
  largestGroupSize: number;
  sequentialGroups: number;
}

export interface RecordHistorySummary {
  totalOperations: number;
  totalMergedRecords: number;
  uniqueOperators: number;
  uniqueActions: number;
  uniqueLocations: number;
  uniquePallets: number;
  timeSpan: TimeSpan;
  topOperators: OperatorSummary[];
  topActions: ActionSummary[];
  efficiencyMetrics: EfficiencyMetrics;
  mergingStats: MergingStats;
}

// Main query result
export interface RecordHistoryResult {
  mergedRecords: MergedRecordHistory[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
  summary: RecordHistorySummary;
  queryTime: number;
  cacheHit: boolean;
  appliedFilters: RecordHistoryFilters;
  pagination: RecordHistoryPagination;
  sorting: RecordHistorySort;
  mergingConfig: MergingConfig;
}

// Real-time update types
export type RecordHistoryUpdateType = 
  | 'NEW_RECORD'
  | 'MERGED_UPDATE'
  | 'OPERATOR_ACTIVITY';

export interface RecordHistoryUpdate {
  type: RecordHistoryUpdateType;
  record: RecordHistoryEntry;
  affectedMergedRecord?: MergedRecordHistory;
  operatorId: number;
  timestamp: string;
}

// Trend analysis types
export interface TrendPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface HourlyTrend {
  hour: number;
  operationCount: number;
  uniqueOperators: number;
  avgEfficiency: number;
}

export interface DailyTrend {
  date: string;
  operationCount: number;
  uniqueOperators: number;
  avgEfficiency: number;
  peakHour: number;
}

export interface OperatorTrend {
  operatorId: number;
  operatorName: string;
  trend: TrendPoint[];
  totalGrowth: number;
}

export interface ActionTrend {
  action: string;
  trend: TrendPoint[];
  totalGrowth: number;
}

export interface EfficiencyTrend {
  timestamp: string;
  avgOperationsPerMinute: number;
  activeOperators: number;
}

export interface RecordHistoryTrends {
  hourlyDistribution: HourlyTrend[];
  dailyDistribution: DailyTrend[];
  operatorTrends: OperatorTrend[];
  actionTrends: ActionTrend[];
  efficiencyTrends: EfficiencyTrend[];
}

// Export types
export type ExportFormat = 'CSV' | 'EXCEL' | 'PDF' | 'JSON';

export interface RecordHistoryExportInput {
  filters?: RecordHistoryFilters;
  format: ExportFormat;
  includeRawData?: boolean;
  includeSummaryStats?: boolean;
  mergingConfig?: MergingConfig;
}

export interface RecordHistoryExportResult {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  expiresAt: string;
}

// Mutation input types
export interface CreateRecordHistoryInput {
  operatorId: number;
  action: string;
  pltNum?: string;
  location?: string;
  remark?: string;
  timestamp?: string;
}

// Error types
export type RecordHistoryErrorCode = 
  | 'INVALID_OPERATOR'
  | 'INVALID_TIMERANGE'
  | 'EXPORT_FAILED'
  | 'MERGE_CONFIG_INVALID'
  | 'DATABASE_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED';

export interface RecordHistoryError {
  code: RecordHistoryErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface BatchResult {
  success: number;
  failed: number;
  errors: RecordHistoryError[];
}

// GraphQL Query Response Types
export interface GetRecordHistoryResponse {
  recordHistory: RecordHistoryResult;
}

export interface GetRawRecordHistoryResponse {
  rawRecordHistory: RecordHistoryEntry[];
}

export interface GetRecordHistorySuggestionsResponse {
  recordHistorySearchSuggestions: string[];
}

export interface GetOperatorActivityResponse {
  operatorActivity: OperatorSummary[];
}

export interface GetRecordHistoryTrendsResponse {
  recordHistoryTrends: RecordHistoryTrends;
}

export interface GetMergedRecordResponse {
  mergedRecord: MergedRecordHistory | null;
}

// Mutation Response Types
export interface CreateRecordHistoryEntryResponse {
  createRecordHistoryEntry: RecordHistoryEntry;
}

export interface BulkCreateRecordHistoryResponse {
  bulkCreateRecordHistory: BatchResult;
}

export interface ExportRecordHistoryResponse {
  exportRecordHistory: RecordHistoryExportResult;
}

export interface UpdateMergingConfigResponse {
  updateMergingConfig: boolean;
}

export interface ClearRecordHistoryCacheResponse {
  clearRecordHistoryCache: boolean;
}

// Subscription Response Types
export interface RecordHistoryUpdatedResponse {
  recordHistoryUpdated: RecordHistoryUpdate;
}

export interface OperatorActivityAlertResponse {
  operatorActivityAlert: OperatorEfficiency;
}

export interface HighFrequencyAlertResponse {
  highFrequencyAlert: MergedRecordHistory;
}

// Apollo Client Variables Types
export interface GetRecordHistoryVariables {
  filters?: RecordHistoryFilters;
  pagination?: RecordHistoryPagination;
  sorting?: RecordHistorySort;
  mergingConfig?: MergingConfig;
}

export interface GetRawRecordHistoryVariables {
  filters?: RecordHistoryFilters;
  pagination?: RecordHistoryPagination;
  sorting?: RecordHistorySort;
}

export interface GetRecordHistorySuggestionsVariables {
  field: 'operator' | 'action' | 'pallet' | 'location';
  query: string;
  limit?: number;
}

export interface GetOperatorActivityVariables {
  operatorIds?: number[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface GetRecordHistoryTrendsVariables {
  filters?: RecordHistoryFilters;
  timeGranularity?: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
}

export interface CreateRecordHistoryEntryVariables {
  input: CreateRecordHistoryInput;
}

export interface BulkCreateRecordHistoryVariables {
  entries: CreateRecordHistoryInput[];
}

export interface ExportRecordHistoryVariables {
  input: RecordHistoryExportInput;
}

export interface UpdateMergingConfigVariables {
  config: MergingConfig;
}

// Subscription Variables Types
export interface RecordHistoryUpdatedVariables {
  operatorIds?: number[];
  actions?: string[];
  locations?: string[];
}

export interface OperatorActivityAlertVariables {
  operatorIds?: number[];
  thresholdOperationsPerMinute?: number;
}

export interface HighFrequencyAlertVariables {
  timeWindowMinutes?: number;
  minOperationsPerWindow?: number;
}

// Utility types for components
export interface TimelineComponentProps {
  data?: GetRecordHistoryResponse;
  loading?: boolean;
  error?: Error | null;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onFilterChange?: (filters: RecordHistoryFilters) => void;
  onSortChange?: (sort: RecordHistorySort) => void;
  onMergingConfigChange?: (config: MergingConfig) => void;
}

export interface TimelineItemProps {
  record: MergedRecordHistory;
  onExpand?: (record: MergedRecordHistory) => void;
  showDetails?: boolean;
  compact?: boolean;
}

export interface TimelineFiltersProps {
  filters: RecordHistoryFilters;
  onChange: (filters: RecordHistoryFilters) => void;
  suggestions?: {
    operators: string[];
    actions: string[];
    locations: string[];
  };
  loading?: boolean;
}

export interface TimelineAnalyticsProps {
  summary: RecordHistorySummary;
  trends?: RecordHistoryTrends;
  onExport?: (format: ExportFormat) => void;
  exportLoading?: boolean;
}

// Default values and constants
export const DEFAULT_RECORD_HISTORY_PAGINATION: RecordHistoryPagination = {
  limit: 10,
  offset: 0,
};

export const DEFAULT_RECORD_HISTORY_SORT: RecordHistorySort = {
  field: 'TIME_START',
  direction: 'DESC',
};

export const DEFAULT_MERGING_CONFIG: MergingConfig = {
  timeWindowMinutes: 5,
  sameOperatorOnly: true,
  sameActionOnly: true,
  minOperationsToMerge: 2,
  maxOperationsPerGroup: 50,
  includeSequentialAnalysis: true,
  groupByLocation: false,
};

export const RECORD_HISTORY_CACHE_KEY = 'recordHistory';
export const OPERATOR_CACHE_KEY = 'operator';
export const ACTION_SUGGESTIONS_CACHE_KEY = 'actionSuggestions';