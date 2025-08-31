import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: any; output: any };
  DateTime: { input: any; output: any };
  File: { input: any; output: any };
  JSON: { input: any; output: any };
  TableRow: { input: any; output: any };
  Upload: { input: any; output: any };
};

export type ApiConfig = {
  __typename?: 'APIConfig';
  configType: ApiConfigType;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  uuid: Scalars['ID']['output'];
  value: Scalars['String']['output'];
};

export type ApiConfigConnection = {
  __typename?: 'APIConfigConnection';
  edges: Array<ApiConfigEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ApiConfigEdge = {
  __typename?: 'APIConfigEdge';
  cursor: Scalars['String']['output'];
  node: ApiConfig;
};

export type ApiConfigFilterInput = {
  configType?: InputMaybe<ApiConfigType>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export enum ApiConfigType {
  Database = 'DATABASE',
  FeatureFlag = 'FEATURE_FLAG',
  Integration = 'INTEGRATION',
  Performance = 'PERFORMANCE',
  Security = 'SECURITY',
  System = 'SYSTEM',
}

export type AcoOrder = {
  __typename?: 'AcoOrder';
  completionStatus: Scalars['String']['output'];
  lastUpdated?: Maybe<Scalars['DateTime']['output']>;
  orderRef: Scalars['Int']['output'];
  productCode: Scalars['String']['output'];
  productDesc?: Maybe<Scalars['String']['output']>;
  quantityOrdered: Scalars['Int']['output'];
  quantityUsed: Scalars['Int']['output'];
  remainingQuantity: Scalars['Int']['output'];
};

export type AcoOrderReportResponse = {
  __typename?: 'AcoOrderReportResponse';
  data: Array<AcoOrder>;
  generatedAt: Scalars['DateTime']['output'];
  reference: Scalars['String']['output'];
  total: Scalars['Int']['output'];
};

export type AcoProductSummary = {
  __typename?: 'AcoProductSummary';
  completionRate: Scalars['Float']['output'];
  orderCount: Scalars['Int']['output'];
  productCode: Scalars['String']['output'];
  totalFinished: Scalars['Int']['output'];
  totalRequired: Scalars['Int']['output'];
};

export type AcoRecord = {
  __typename?: 'AcoRecord';
  code: Scalars['String']['output'];
  completionRate: Scalars['Float']['output'];
  finishedQty?: Maybe<Scalars['Int']['output']>;
  latestUpdate: Scalars['DateTime']['output'];
  orderRef: Scalars['Int']['output'];
  product?: Maybe<Product>;
  remainingQty: Scalars['Int']['output'];
  requiredQty: Scalars['Int']['output'];
  uuid: Scalars['ID']['output'];
};

export type AcoRecordConnection = {
  __typename?: 'AcoRecordConnection';
  edges: Array<AcoRecordEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AcoRecordEdge = {
  __typename?: 'AcoRecordEdge';
  cursor: Scalars['String']['output'];
  node: AcoRecord;
};

export type AcoRecordFilterInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  completionStatus?: InputMaybe<CompletionStatus>;
  dateRange?: InputMaybe<DateRangeInput>;
  maxRequiredQty?: InputMaybe<Scalars['Int']['input']>;
  minRequiredQty?: InputMaybe<Scalars['Int']['input']>;
  orderRef?: InputMaybe<Scalars['Int']['input']>;
};

export type AcoRecordSummary = {
  __typename?: 'AcoRecordSummary';
  averageCompletionRate: Scalars['Float']['output'];
  completedOrders: Scalars['Int']['output'];
  overdeliveredOrders: Scalars['Int']['output'];
  pendingOrders: Scalars['Int']['output'];
  topProductsByVolume: Array<AcoProductSummary>;
  totalFinishedQty: Scalars['Int']['output'];
  totalOrders: Scalars['Int']['output'];
  totalRequiredQty: Scalars['Int']['output'];
};

export type ActionSummary = {
  __typename?: 'ActionSummary';
  action: Scalars['String']['output'];
  avgDuration: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
};

export type ActionTrend = {
  __typename?: 'ActionTrend';
  action: Scalars['String']['output'];
  totalGrowth: Scalars['Float']['output'];
  trend: Array<TrendPoint>;
};

export type Address = {
  __typename?: 'Address';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  postalCode: Scalars['String']['output'];
  state?: Maybe<Scalars['String']['output']>;
  street: Scalars['String']['output'];
};

export type AffectedEntity = {
  __typename?: 'AffectedEntity';
  entityId: Scalars['String']['output'];
  entityName: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  entityUrl?: Maybe<Scalars['String']['output']>;
  impact?: Maybe<Scalars['String']['output']>;
};

export type AffectedEntityInput = {
  entityId: Scalars['String']['input'];
  entityName: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
  entityUrl?: InputMaybe<Scalars['String']['input']>;
  impact?: InputMaybe<Scalars['String']['input']>;
};

export enum AggregationFunction {
  Avg = 'AVG',
  Count = 'COUNT',
  DistinctCount = 'DISTINCT_COUNT',
  Max = 'MAX',
  Min = 'MIN',
  Sum = 'SUM',
}

export enum AggregationType {
  Average = 'AVERAGE',
  Count = 'COUNT',
  Max = 'MAX',
  Median = 'MEDIAN',
  Min = 'MIN',
  Percentile = 'PERCENTILE',
  Sum = 'SUM',
}

export type Alert = {
  __typename?: 'Alert';
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  acknowledgedBy?: Maybe<Scalars['String']['output']>;
  actions?: Maybe<Array<AlertAction>>;
  affectedEntities?: Maybe<Array<AffectedEntity>>;
  createdAt: Scalars['DateTime']['output'];
  details?: Maybe<Scalars['JSON']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedBy?: Maybe<Scalars['String']['output']>;
  severity: AlertSeverity;
  source: Scalars['String']['output'];
  status: AlertStatus;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  type: AlertType;
};

export type AlertAction = {
  __typename?: 'AlertAction';
  confirmRequired: Scalars['Boolean']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  type: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type AlertActionInput = {
  config: Scalars['JSON']['input'];
  type: Scalars['String']['input'];
};

export type AlertCardData = CardData & {
  __typename?: 'AlertCardData';
  alerts: Array<Alert>;
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  pagination: PageInfo;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  statistics: AlertStatistics;
  summary: AlertSummary;
};

export type AlertCardInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  includeAcknowledged?: InputMaybe<Scalars['Boolean']['input']>;
  includeResolved?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  severities?: InputMaybe<Array<AlertSeverity>>;
  sortBy?: InputMaybe<AlertSortBy>;
  statuses?: InputMaybe<Array<AlertStatus>>;
  types?: InputMaybe<Array<AlertType>>;
};

export type AlertPerformanceMetrics = {
  __typename?: 'AlertPerformanceMetrics';
  alertVolume: Scalars['Int']['output'];
  falsePositiveRate: Scalars['Float']['output'];
  mtta: Scalars['Float']['output'];
  mttr: Scalars['Float']['output'];
};

export type AlertRule = {
  __typename?: 'AlertRule';
  actions: Array<AlertAction>;
  conditions: Scalars['JSON']['output'];
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  lastTriggered?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  severity: AlertSeverity;
  throttle: Scalars['Int']['output'];
  triggerCount: Scalars['Int']['output'];
};

export enum AlertSeverity {
  Critical = 'CRITICAL',
  Error = 'ERROR',
  Info = 'INFO',
  Warning = 'WARNING',
}

export enum AlertSortBy {
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  SeverityAsc = 'SEVERITY_ASC',
  SeverityDesc = 'SEVERITY_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
}

export type AlertStatistics = {
  __typename?: 'AlertStatistics';
  acknowledgeRate: Scalars['Float']['output'];
  averageAcknowledgeTime: Scalars['Float']['output'];
  averageResolutionTime: Scalars['Float']['output'];
  performanceMetrics: AlertPerformanceMetrics;
  recurringAlerts: Scalars['Int']['output'];
  resolutionRate: Scalars['Float']['output'];
  trendsData: Array<AlertTrend>;
};

export enum AlertStatus {
  Acknowledged = 'ACKNOWLEDGED',
  Active = 'ACTIVE',
  Dismissed = 'DISMISSED',
  Expired = 'EXPIRED',
  Resolved = 'RESOLVED',
}

export type AlertSummary = {
  __typename?: 'AlertSummary';
  bySeverity: Array<SeverityCount>;
  byStatus: Array<StatusCount>;
  byType: Array<TypeCount>;
  criticalCount: Scalars['Int']['output'];
  recentCount: Scalars['Int']['output'];
  totalActive: Scalars['Int']['output'];
  totalToday: Scalars['Int']['output'];
};

export type AlertTrend = {
  __typename?: 'AlertTrend';
  count: Scalars['Int']['output'];
  severity: AlertSeverity;
  timestamp: Scalars['DateTime']['output'];
};

export enum AlertType {
  CustomAlert = 'CUSTOM_ALERT',
  InventoryAlert = 'INVENTORY_ALERT',
  InventoryLow = 'INVENTORY_LOW',
  OrderAlert = 'ORDER_ALERT',
  PerformanceAlert = 'PERFORMANCE_ALERT',
  PerformanceDegradation = 'PERFORMANCE_DEGRADATION',
  QualityAlert = 'QUALITY_ALERT',
  QualityIssue = 'QUALITY_ISSUE',
  SecurityAlert = 'SECURITY_ALERT',
  SystemAlert = 'SYSTEM_ALERT',
  SystemError = 'SYSTEM_ERROR',
  TransferAlert = 'TRANSFER_ALERT',
  TransferDelayed = 'TRANSFER_DELAYED',
}

export type AnalysisMetrics = {
  __typename?: 'AnalysisMetrics';
  fulfillment_rate: Scalars['Float']['output'];
  inventory_gap: Scalars['Int']['output'];
  status: InventoryStatus;
};

export type AppliedArrayFilter = {
  __typename?: 'AppliedArrayFilter';
  field: Scalars['String']['output'];
  operator: ArrayOperator;
  values: Array<Scalars['String']['output']>;
};

export type AppliedBooleanFilter = {
  __typename?: 'AppliedBooleanFilter';
  field: Scalars['String']['output'];
  value: Scalars['Boolean']['output'];
};

export type AppliedDateFilter = {
  __typename?: 'AppliedDateFilter';
  endDate?: Maybe<Scalars['DateTime']['output']>;
  field: Scalars['String']['output'];
  operator: DateOperator;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  value?: Maybe<Scalars['DateTime']['output']>;
};

export type AppliedFilters = {
  __typename?: 'AppliedFilters';
  action?: Maybe<Scalars['String']['output']>;
  actions?: Maybe<Array<Scalars['String']['output']>>;
  dateRange?: Maybe<DateRange>;
  departments?: Maybe<Array<Scalars['String']['output']>>;
  hasMultipleOperations?: Maybe<Scalars['Boolean']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  locations?: Maybe<Array<Scalars['String']['output']>>;
  maxDuration?: Maybe<Scalars['Int']['output']>;
  minDuration?: Maybe<Scalars['Int']['output']>;
  operatorEmail?: Maybe<Scalars['String']['output']>;
  operatorId?: Maybe<Scalars['Int']['output']>;
  operatorName?: Maybe<Scalars['String']['output']>;
  palletNumbers?: Maybe<Array<Scalars['String']['output']>>;
  pltNum?: Maybe<Scalars['String']['output']>;
  positions?: Maybe<Array<Scalars['String']['output']>>;
  searchTerm?: Maybe<Scalars['String']['output']>;
};

export type AppliedMergingConfig = {
  __typename?: 'AppliedMergingConfig';
  groupByLocation?: Maybe<Scalars['Boolean']['output']>;
  includeSequentialAnalysis?: Maybe<Scalars['Boolean']['output']>;
  maxOperationsPerGroup?: Maybe<Scalars['Int']['output']>;
  minOperationsToMerge?: Maybe<Scalars['Int']['output']>;
  sameActionOnly?: Maybe<Scalars['Boolean']['output']>;
  sameOperatorOnly?: Maybe<Scalars['Boolean']['output']>;
  timeWindowMinutes?: Maybe<Scalars['Int']['output']>;
};

export type AppliedNumberFilter = {
  __typename?: 'AppliedNumberFilter';
  field: Scalars['String']['output'];
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  operator: NumberOperator;
  value?: Maybe<Scalars['Float']['output']>;
};

export type AppliedPagination = {
  __typename?: 'AppliedPagination';
  cursor?: Maybe<Scalars['String']['output']>;
  limit?: Maybe<Scalars['Int']['output']>;
  offset?: Maybe<Scalars['Int']['output']>;
};

export type AppliedSort = {
  __typename?: 'AppliedSort';
  direction?: Maybe<SortDirection>;
  field?: Maybe<RecordHistorySortField>;
};

export type AppliedStringFilter = {
  __typename?: 'AppliedStringFilter';
  caseSensitive: Scalars['Boolean']['output'];
  field: Scalars['String']['output'];
  operator: StringOperator;
  value: Scalars['String']['output'];
};

export type AppliedTableFilters = {
  __typename?: 'AppliedTableFilters';
  arrayFilters?: Maybe<Array<AppliedArrayFilter>>;
  booleanFilters?: Maybe<Array<AppliedBooleanFilter>>;
  dateFilters?: Maybe<Array<AppliedDateFilter>>;
  numberFilters?: Maybe<Array<AppliedNumberFilter>>;
  stringFilters?: Maybe<Array<AppliedStringFilter>>;
};

export type AppliedTableSorting = {
  __typename?: 'AppliedTableSorting';
  secondarySort?: Maybe<AppliedTableSorting>;
  sortBy: Scalars['String']['output'];
  sortOrder: SortDirection;
};

export type ArrayFilter = {
  field: Scalars['String']['input'];
  operator: ArrayOperator;
  values: Array<Scalars['String']['input']>;
};

export enum ArrayOperator {
  Contains = 'CONTAINS',
  ContainsAll = 'CONTAINS_ALL',
  ContainsAny = 'CONTAINS_ANY',
  In = 'IN',
  NotContains = 'NOT_CONTAINS',
  NotIn = 'NOT_IN',
}

export type BatchAlertResult = {
  __typename?: 'BatchAlertResult';
  errors?: Maybe<Array<BatchError>>;
  failed: Scalars['Int']['output'];
  succeeded: Scalars['Int']['output'];
};

export type BatchError = {
  __typename?: 'BatchError';
  alertId: Scalars['ID']['output'];
  error: Scalars['String']['output'];
};

export type BatchOperationInput = {
  data: Scalars['JSON']['input'];
  entityIds: Array<Scalars['ID']['input']>;
  entityType: Scalars['String']['input'];
  operationType: OperationType;
};

export type BatchOperationResult = {
  __typename?: 'BatchOperationResult';
  failed: Array<OperationResult>;
  successful: Array<OperationResult>;
  totalFailed: Scalars['Int']['output'];
  totalProcessed: Scalars['Int']['output'];
  totalSucceeded: Scalars['Int']['output'];
};

export type BatchReportError = {
  __typename?: 'BatchReportError';
  error: Scalars['String']['output'];
  reportId: Scalars['ID']['output'];
};

export type BatchReportOperationInput = {
  operation: ReportOperation;
  params?: InputMaybe<Scalars['JSON']['input']>;
  reportIds: Array<Scalars['ID']['input']>;
};

export type BatchReportResult = {
  __typename?: 'BatchReportResult';
  failed: Array<BatchReportError>;
  successful: Array<Scalars['String']['output']>;
  totalFailed: Scalars['Int']['output'];
  totalProcessed: Scalars['Int']['output'];
  totalSucceeded: Scalars['Int']['output'];
};

export type BatchResult = {
  __typename?: 'BatchResult';
  errors?: Maybe<Array<Error>>;
  failed: Scalars['Int']['output'];
  success: Scalars['Int']['output'];
};

export type BatchStocktakeError = {
  __typename?: 'BatchStocktakeError';
  error: Scalars['String']['output'];
  record?: Maybe<StocktakeRecord>;
  uuid: Scalars['ID']['output'];
};

export type BatchStocktakeResult = {
  __typename?: 'BatchStocktakeResult';
  errors?: Maybe<Array<BatchStocktakeError>>;
  failed: Scalars['Int']['output'];
  records: Array<StocktakeRecord>;
  successful: Scalars['Int']['output'];
  totalVariance: Scalars['Int']['output'];
  totalVarianceValue?: Maybe<Scalars['Float']['output']>;
};

export type BatchStocktakeUpdateInput = {
  countedId?: InputMaybe<Scalars['Int']['input']>;
  countedName?: InputMaybe<Scalars['String']['input']>;
  countedQty: Scalars['Int']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
  uuid: Scalars['ID']['input'];
};

export type BatchUploadInput = {
  files: Array<Scalars['Upload']['input']>;
  folder?: InputMaybe<UploadFolder>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  requiresAnalysis?: InputMaybe<Scalars['Boolean']['input']>;
  uploadType: UploadType;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type BatchUploadResult = {
  __typename?: 'BatchUploadResult';
  analysisResults?: Maybe<Array<OrderAnalysisResult>>;
  failed: Scalars['Int']['output'];
  results: Array<SingleUploadResult>;
  successful: Scalars['Int']['output'];
  totalFiles: Scalars['Int']['output'];
  uploadIds: Array<Scalars['ID']['output']>;
};

export type BatchWorkLevelUpdateInput = {
  updates: UpdateWorkLevelInput;
  uuid: Scalars['ID']['input'];
};

export type BooleanFilter = {
  field: Scalars['String']['input'];
  value: Scalars['Boolean']['input'];
};

export enum BottleneckSeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
}

export type BulkStockLevelUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  stockLevel: Scalars['Int']['input'];
  uuid: Scalars['ID']['input'];
};

export type CacheInvalidationEvent = {
  __typename?: 'CacheInvalidationEvent';
  cacheKeys?: Maybe<Array<Scalars['String']['output']>>;
  changedColumns?: Maybe<Array<Scalars['String']['output']>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isProcessed: Scalars['Boolean']['output'];
  operation: Scalars['String']['output'];
  processed?: Maybe<Scalars['Boolean']['output']>;
  processingDelay?: Maybe<Scalars['Int']['output']>;
  recordId?: Maybe<Scalars['String']['output']>;
  tableName: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CacheInvalidationEventConnection = {
  __typename?: 'CacheInvalidationEventConnection';
  edges: Array<CacheInvalidationEventEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type CacheInvalidationEventEdge = {
  __typename?: 'CacheInvalidationEventEdge';
  cursor: Scalars['String']['output'];
  node: CacheInvalidationEvent;
};

export type CacheInvalidationEventFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  isProcessed?: InputMaybe<Scalars['Boolean']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
  tableName?: InputMaybe<Scalars['String']['input']>;
};

export type CardData = {
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
};

export type CardDataRequest = {
  cardId: Scalars['String']['input'];
  dataSource: Scalars['String']['input'];
  params?: InputMaybe<Scalars['JSON']['input']>;
  timeFrame?: InputMaybe<DateRangeInput>;
};

export type CardDataResponse = {
  __typename?: 'CardDataResponse';
  cached: Scalars['Boolean']['output'];
  cardId: Scalars['String']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  error?: Maybe<Error>;
  executionTime: Scalars['Float']['output'];
  source: DataSourceType;
};

export enum ChangeType {
  Decrease = 'DECREASE',
  Increase = 'INCREASE',
  Stable = 'STABLE',
}

export type ChartAxis = {
  __typename?: 'ChartAxis';
  display?: Maybe<Scalars['Boolean']['output']>;
  format?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  stepSize?: Maybe<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
};

export type ChartCardData = CardData & {
  __typename?: 'ChartCardData';
  config: ChartConfig;
  dataSource: Scalars['String']['output'];
  datasets: Array<ChartDataset>;
  labels?: Maybe<Array<Scalars['String']['output']>>;
  lastUpdated: Scalars['DateTime']['output'];
  performance: PerformanceMetrics;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
};

export type ChartConfig = {
  __typename?: 'ChartConfig';
  animations?: Maybe<Scalars['JSON']['output']>;
  aspectRatio?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  legend?: Maybe<ChartLegend>;
  maintainAspectRatio?: Maybe<Scalars['Boolean']['output']>;
  plugins?: Maybe<Scalars['JSON']['output']>;
  responsive?: Maybe<Scalars['Boolean']['output']>;
  title: Scalars['String']['output'];
  tooltip?: Maybe<ChartTooltip>;
  type: ChartType;
  xAxis?: Maybe<ChartAxis>;
  yAxis?: Maybe<ChartAxis>;
};

export type ChartDataPoint = {
  __typename?: 'ChartDataPoint';
  label?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
  x: Scalars['String']['output'];
  y: Scalars['Float']['output'];
};

export type ChartDataset = {
  __typename?: 'ChartDataset';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  borderColor?: Maybe<Scalars['String']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  data: Array<ChartDataPoint>;
  hidden?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  stack?: Maybe<Scalars['String']['output']>;
  type?: Maybe<ChartDatasetType>;
};

export enum ChartDatasetType {
  Grouped = 'GROUPED',
  Multiple = 'MULTIPLE',
  Single = 'SINGLE',
  Stacked = 'STACKED',
}

export type ChartLegend = {
  __typename?: 'ChartLegend';
  align?: Maybe<Scalars['String']['output']>;
  display: Scalars['Boolean']['output'];
  labels?: Maybe<Scalars['JSON']['output']>;
  position?: Maybe<Scalars['String']['output']>;
};

export type ChartQueryInput = {
  aggregationType?: InputMaybe<AggregationType>;
  chartTypes: Array<ChartType>;
  dateRange?: InputMaybe<DateRangeInput>;
  filters?: InputMaybe<Scalars['JSON']['input']>;
  groupBy?: InputMaybe<Array<Scalars['String']['input']>>;
  includeComparison?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  timeGranularity?: InputMaybe<TimeGranularity>;
};

export type ChartTooltip = {
  __typename?: 'ChartTooltip';
  callbacks?: Maybe<Scalars['JSON']['output']>;
  enabled: Scalars['Boolean']['output'];
  intersect?: Maybe<Scalars['Boolean']['output']>;
  mode?: Maybe<Scalars['String']['output']>;
};

export enum ChartType {
  Area = 'AREA',
  Bar = 'BAR',
  Donut = 'DONUT',
  Heatmap = 'HEATMAP',
  Line = 'LINE',
  Mixed = 'MIXED',
  Pie = 'PIE',
  Radar = 'RADAR',
  Scatter = 'SCATTER',
  Treemap = 'TREEMAP',
}

export type Colour = {
  __typename?: 'Colour';
  colour: Scalars['String']['output'];
};

export type ColourCount = {
  __typename?: 'ColourCount';
  colour: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
};

export type ComparisonData = {
  __typename?: 'ComparisonData';
  change: Scalars['Float']['output'];
  changePercentage: Scalars['Float']['output'];
  previousLabel: Scalars['String']['output'];
  previousValue: Scalars['Float']['output'];
};

export enum CompletionStatus {
  Completed = 'COMPLETED',
  Overdelivered = 'OVERDELIVERED',
  Pending = 'PENDING',
}

export type ComplexityPerformance = {
  __typename?: 'ComplexityPerformance';
  averageExecutionTime: Scalars['Float']['output'];
  complexity: Scalars['String']['output'];
  queryCount: Scalars['Int']['output'];
};

export enum ConfigAccessLevel {
  Admin = 'ADMIN',
  Authenticated = 'AUTHENTICATED',
  Department = 'DEPARTMENT',
  Public = 'PUBLIC',
  SuperAdmin = 'SUPER_ADMIN',
}

export type ConfigBatchError = {
  __typename?: 'ConfigBatchError';
  configId?: Maybe<Scalars['ID']['output']>;
  error: Scalars['String']['output'];
  key?: Maybe<Scalars['String']['output']>;
};

export type ConfigBatchResult = {
  __typename?: 'ConfigBatchResult';
  configs?: Maybe<Array<ConfigItem>>;
  errors?: Maybe<Array<ConfigBatchError>>;
  failed: Scalars['Int']['output'];
  succeeded: Scalars['Int']['output'];
};

export type ConfigBatchUpdateInput = {
  atomicUpdate?: InputMaybe<Scalars['Boolean']['input']>;
  updates: Array<ConfigUpdateInput>;
  validateAll?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ConfigCardData = {
  __typename?: 'ConfigCardData';
  categories: Array<ConfigCategoryGroup>;
  configs: Array<ConfigItem>;
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  permissions: ConfigPermissions;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  summary: ConfigSummary;
  validation: ConfigValidation;
};

export type ConfigCardInput = {
  category?: InputMaybe<ConfigCategory>;
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  includeDefaults?: InputMaybe<Scalars['Boolean']['input']>;
  includeInherited?: InputMaybe<Scalars['Boolean']['input']>;
  roleId?: InputMaybe<Scalars['ID']['input']>;
  scope?: InputMaybe<ConfigScope>;
  search?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export enum ConfigCategory {
  ApiConfig = 'API_CONFIG',
  DepartmentConfig = 'DEPARTMENT_CONFIG',
  DisplayConfig = 'DISPLAY_CONFIG',
  NotificationConfig = 'NOTIFICATION_CONFIG',
  SecurityConfig = 'SECURITY_CONFIG',
  SystemConfig = 'SYSTEM_CONFIG',
  UserPreferences = 'USER_PREFERENCES',
  WorkflowConfig = 'WORKFLOW_CONFIG',
}

export type ConfigCategoryCount = {
  __typename?: 'ConfigCategoryCount';
  category: ConfigCategory;
  count: Scalars['Int']['output'];
  editableCount: Scalars['Int']['output'];
};

export type ConfigCategoryGroup = {
  __typename?: 'ConfigCategoryGroup';
  category: ConfigCategory;
  count: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  editableCount: Scalars['Int']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  items: Array<ConfigItem>;
  label: Scalars['String']['output'];
  lastUpdated?: Maybe<Scalars['DateTime']['output']>;
};

export enum ConfigDataType {
  Array = 'ARRAY',
  Boolean = 'BOOLEAN',
  Color = 'COLOR',
  Date = 'DATE',
  Json = 'JSON',
  Number = 'NUMBER',
  String = 'STRING',
  Url = 'URL',
}

export type ConfigHistory = {
  __typename?: 'ConfigHistory';
  changeReason?: Maybe<Scalars['String']['output']>;
  changedAt: Scalars['DateTime']['output'];
  changedBy: Scalars['String']['output'];
  configId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  newValue: Scalars['JSON']['output'];
  previousValue: Scalars['JSON']['output'];
};

export type ConfigItem = {
  __typename?: 'ConfigItem';
  accessLevel: ConfigAccessLevel;
  category: ConfigCategory;
  createdAt: Scalars['DateTime']['output'];
  dataType: ConfigDataType;
  defaultValue?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  history?: Maybe<Array<ConfigHistory>>;
  id: Scalars['ID']['output'];
  inheritedFrom?: Maybe<Scalars['String']['output']>;
  isEditable: Scalars['Boolean']['output'];
  isInherited: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  scope: ConfigScope;
  scopeId?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['String']['output']>;
  validation?: Maybe<Scalars['JSON']['output']>;
  value: Scalars['JSON']['output'];
};

export type ConfigItemInput = {
  category: ConfigCategory;
  dataType: ConfigDataType;
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  scope: ConfigScope;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  validation?: InputMaybe<Scalars['JSON']['input']>;
  value: Scalars['JSON']['input'];
};

export type ConfigPermissions = {
  __typename?: 'ConfigPermissions';
  accessibleCategories: Array<ConfigCategory>;
  accessibleScopes: Array<ConfigScope>;
  canDelete: Scalars['Boolean']['output'];
  canManageDepartment: Scalars['Boolean']['output'];
  canManageGlobal: Scalars['Boolean']['output'];
  canManageUsers: Scalars['Boolean']['output'];
  canRead: Scalars['Boolean']['output'];
  canWrite: Scalars['Boolean']['output'];
};

export enum ConfigScope {
  Department = 'DEPARTMENT',
  Global = 'GLOBAL',
  Role = 'ROLE',
  User = 'USER',
}

export type ConfigScopeCount = {
  __typename?: 'ConfigScopeCount';
  count: Scalars['Int']['output'];
  editableCount: Scalars['Int']['output'];
  scope: ConfigScope;
};

export type ConfigSummary = {
  __typename?: 'ConfigSummary';
  byCategory: Array<ConfigCategoryCount>;
  byScope: Array<ConfigScopeCount>;
  customConfigs: Scalars['Int']['output'];
  editableConfigs: Scalars['Int']['output'];
  inheritedConfigs: Scalars['Int']['output'];
  recentChanges: Scalars['Int']['output'];
  totalConfigs: Scalars['Int']['output'];
};

export type ConfigTemplate = {
  __typename?: 'ConfigTemplate';
  category: ConfigCategory;
  configs: Scalars['JSON']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  scope: ConfigScope;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  usageCount: Scalars['Int']['output'];
};

export type ConfigUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  validation?: InputMaybe<Scalars['JSON']['input']>;
  value: Scalars['JSON']['input'];
};

export type ConfigValidation = {
  __typename?: 'ConfigValidation';
  errors?: Maybe<Array<ConfigValidationError>>;
  isValid: Scalars['Boolean']['output'];
  warnings?: Maybe<Array<ConfigValidationWarning>>;
};

export type ConfigValidationError = {
  __typename?: 'ConfigValidationError';
  configId: Scalars['ID']['output'];
  details?: Maybe<Scalars['JSON']['output']>;
  key: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type ConfigValidationWarning = {
  __typename?: 'ConfigValidationWarning';
  configId: Scalars['ID']['output'];
  details?: Maybe<Scalars['JSON']['output']>;
  key: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type Connection = {
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type CreateApiConfigInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CreateAcoRecordInput = {
  code: Scalars['String']['input'];
  finishedQty?: InputMaybe<Scalars['Int']['input']>;
  orderRef: Scalars['Int']['input'];
  requiredQty: Scalars['Int']['input'];
};

export type CreateAlertInput = {
  affectedEntities?: InputMaybe<Array<AffectedEntityInput>>;
  details?: InputMaybe<Scalars['JSON']['input']>;
  expiresIn?: InputMaybe<Scalars['Int']['input']>;
  message: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  severity: AlertSeverity;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
  type: AlertType;
};

export type CreateCacheInvalidationEventInput = {
  cacheKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  changedColumns?: InputMaybe<Array<Scalars['String']['input']>>;
  eventType: Scalars['String']['input'];
  operation: Scalars['String']['input'];
  recordId?: InputMaybe<Scalars['String']['input']>;
  tableName: Scalars['String']['input'];
};

export type CreateDatabasePerformanceMetricInput = {
  executionTimeMs?: InputMaybe<Scalars['Float']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  metricName: Scalars['String']['input'];
  metricUnit?: InputMaybe<Scalars['String']['input']>;
  metricValue: Scalars['Float']['input'];
  queryType?: InputMaybe<Scalars['String']['input']>;
  tableName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateFileInfoInput = {
  docName: Scalars['String']['input'];
  docType?: InputMaybe<Scalars['String']['input']>;
  docUrl?: InputMaybe<Scalars['String']['input']>;
  fileSize?: InputMaybe<Scalars['Int']['input']>;
  folder?: InputMaybe<Scalars['String']['input']>;
  jsonTxt?: InputMaybe<Scalars['String']['input']>;
  uploadBy: Scalars['Int']['input'];
};

export type CreateGrnRecordInput = {
  grnRef: Scalars['Int']['input'];
  grossWeight: Scalars['Int']['input'];
  materialCode: Scalars['String']['input'];
  netWeight: Scalars['Int']['input'];
  package: Scalars['String']['input'];
  packageCount: Scalars['Float']['input'];
  pallet: Scalars['String']['input'];
  palletCount: Scalars['Float']['input'];
  pltNum: Scalars['String']['input'];
  supCode: Scalars['String']['input'];
};

export type CreateGrnLevelInput = {
  grnRef?: InputMaybe<Scalars['Int']['input']>;
  totalGross: Scalars['Int']['input'];
  totalNet?: InputMaybe<Scalars['Int']['input']>;
  totalUnit: Scalars['Int']['input'];
};

export type CreateHistoryRecordInput = {
  action: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
};

export type CreateOrderLoadingHistoryInput = {
  actionBy: Scalars['String']['input'];
  actionType: OrderLoadingActionType;
  orderRef: Scalars['String']['input'];
  palletNum: Scalars['String']['input'];
  productCode: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  remark?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePalletNumberBufferInput = {
  dateStr: Scalars['String']['input'];
  palletNumber: Scalars['String']['input'];
  series: Scalars['String']['input'];
};

export type CreateProductInput = {
  code: Scalars['String']['input'];
  colour?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  standardQty?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
  volumePerPiece?: InputMaybe<Scalars['Float']['input']>;
  weightPerPiece?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateQueryPerformanceMetricInput = {
  cacheHit?: InputMaybe<Scalars['Boolean']['input']>;
  errorMessage?: InputMaybe<Scalars['String']['input']>;
  errorOccurred?: InputMaybe<Scalars['Boolean']['input']>;
  executionTimeMs: Scalars['Float']['input'];
  functionName: Scalars['String']['input'];
  memoryUsageMb?: InputMaybe<Scalars['Float']['input']>;
  parameters?: InputMaybe<Scalars['JSON']['input']>;
  queryComplexity?: InputMaybe<Scalars['String']['input']>;
  resultCount?: InputMaybe<Scalars['Int']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateQueryRecordInput = {
  answer: Scalars['String']['input'];
  complexity?: InputMaybe<Scalars['String']['input']>;
  executionTime?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  queryHash?: InputMaybe<Scalars['String']['input']>;
  resultJson?: InputMaybe<Scalars['JSON']['input']>;
  rowCount?: InputMaybe<Scalars['Int']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  sqlQuery?: InputMaybe<Scalars['String']['input']>;
  token: Scalars['Int']['input'];
  user: Scalars['String']['input'];
};

export type CreateRecordHistoryInput = {
  action: Scalars['String']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  operatorId: Scalars['Int']['input'];
  pltNum?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateReportTemplateInput = {
  config: Scalars['JSON']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Scalars['JSON']['input']>;
  grouping?: InputMaybe<Scalars['JSON']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  reportType: ReportType;
};

export type CreateReportVoidInput = {
  damageQty: Scalars['Int']['input'];
  pltNum: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};

export type CreateSlateInfoInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  holeToBottom?: InputMaybe<Scalars['String']['input']>;
  length?: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['String']['input'];
  shapes?: InputMaybe<Scalars['String']['input']>;
  thicknessBottom?: InputMaybe<Scalars['String']['input']>;
  thicknessTop?: InputMaybe<Scalars['String']['input']>;
  toolNum?: InputMaybe<Scalars['String']['input']>;
  weight?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['String']['input']>;
};

export type CreateStockLevelInput = {
  description: Scalars['String']['input'];
  stock: Scalars['String']['input'];
  stockLevel: Scalars['Int']['input'];
};

export type CreateStocktakeRecordInput = {
  countedId?: InputMaybe<Scalars['Int']['input']>;
  countedName?: InputMaybe<Scalars['String']['input']>;
  countedQty?: InputMaybe<Scalars['Int']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['String']['input'];
  productDesc: Scalars['String']['input'];
  remainQty?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateSupplierInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  contact?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fax?: InputMaybe<Scalars['String']['input']>;
  leadTime?: InputMaybe<Scalars['Int']['input']>;
  minimumOrderQuantity?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  paymentTerms?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type CreateThreatStatInput = {
  eventDate: Scalars['Date']['input'];
  eventType: Scalars['String']['input'];
  ipAddress: Scalars['String']['input'];
  occurrenceCount?: InputMaybe<Scalars['Int']['input']>;
  severity: Scalars['String']['input'];
};

export type CreateTransferInput = {
  pltNum: Scalars['String']['input'];
  priority?: InputMaybe<TransferPriority>;
  quantity: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  toLocation: Scalars['String']['input'];
};

export type CreateWorkLevelInput = {
  grn?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
  loading?: InputMaybe<Scalars['Int']['input']>;
  move?: InputMaybe<Scalars['Int']['input']>;
  qc?: InputMaybe<Scalars['Int']['input']>;
};

export type Customer = {
  __typename?: 'Customer';
  code: Scalars['String']['output'];
  contact?: Maybe<Scalars['String']['output']>;
  creditLimit?: Maybe<Scalars['Float']['output']>;
  currentBalance?: Maybe<Scalars['Float']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orders?: Maybe<Array<Order>>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type DailyLoadingActivity = {
  __typename?: 'DailyLoadingActivity';
  date: Scalars['DateTime']['output'];
  totalActions: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
  uniqueOperators: Scalars['Int']['output'];
  uniqueOrders: Scalars['Int']['output'];
};

export type DailyTrend = {
  __typename?: 'DailyTrend';
  avgEfficiency: Scalars['Float']['output'];
  date: Scalars['DateTime']['output'];
  operationCount: Scalars['Int']['output'];
  peakHour: Scalars['Int']['output'];
  uniqueOperators: Scalars['Int']['output'];
};

export type DailyVoidCount = {
  __typename?: 'DailyVoidCount';
  count: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
  totalDamage: Scalars['Int']['output'];
};

export enum DataSourceType {
  Auto = 'AUTO',
  Cache = 'CACHE',
  Graphql = 'GRAPHQL',
  Rest = 'REST',
}

export type DatabasePerformanceMetric = {
  __typename?: 'DatabasePerformanceMetric';
  createdAt: Scalars['DateTime']['output'];
  executionTimeMs?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isSlowQuery: Scalars['Boolean']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  metricName: Scalars['String']['output'];
  metricUnit?: Maybe<Scalars['String']['output']>;
  metricValue: Scalars['Float']['output'];
  performanceRating: PerformanceRating;
  queryType?: Maybe<Scalars['String']['output']>;
  recordedAt?: Maybe<Scalars['DateTime']['output']>;
  tableName?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type DatabasePerformanceMetricConnection = {
  __typename?: 'DatabasePerformanceMetricConnection';
  edges: Array<DatabasePerformanceMetricEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type DatabasePerformanceMetricEdge = {
  __typename?: 'DatabasePerformanceMetricEdge';
  cursor: Scalars['String']['output'];
  node: DatabasePerformanceMetric;
};

export type DatabasePerformanceMetricFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  isSlowQuery?: InputMaybe<Scalars['Boolean']['input']>;
  maxExecutionTime?: InputMaybe<Scalars['Float']['input']>;
  metricName?: InputMaybe<Scalars['String']['input']>;
  minExecutionTime?: InputMaybe<Scalars['Float']['input']>;
  performanceRating?: InputMaybe<PerformanceRating>;
  queryType?: InputMaybe<Scalars['String']['input']>;
  tableName?: InputMaybe<Scalars['String']['input']>;
};

export type DateFilter = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  field: Scalars['String']['input'];
  operator: DateOperator;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  value?: InputMaybe<Scalars['DateTime']['input']>;
};

export enum DateOperator {
  Between = 'BETWEEN',
  DaysAgo = 'DAYS_AGO',
  Eq = 'EQ',
  Gt = 'GT',
  Gte = 'GTE',
  Lt = 'LT',
  Lte = 'LTE',
  MonthsAgo = 'MONTHS_AGO',
  Neq = 'NEQ',
  YearsAgo = 'YEARS_AGO',
}

export type DateRange = {
  __typename?: 'DateRange';
  end: Scalars['DateTime']['output'];
  start: Scalars['DateTime']['output'];
};

export type DateRangeInput = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
};

export enum DefectSeverity {
  Critical = 'CRITICAL',
  Major = 'MAJOR',
  Minor = 'MINOR',
}

export type DefectTypeMetric = {
  __typename?: 'DefectTypeMetric';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  severity: DefectSeverity;
  type: Scalars['String']['output'];
};

export type DeliveryPerformance = {
  __typename?: 'DeliveryPerformance';
  averageDelayDays?: Maybe<Scalars['Float']['output']>;
  earlyDeliveries: Scalars['Int']['output'];
  lateDeliveries: Scalars['Int']['output'];
  onTimeDeliveries: Scalars['Int']['output'];
};

export type DepartmentEfficiency = {
  __typename?: 'DepartmentEfficiency';
  department: Scalars['String']['output'];
  efficiency: Scalars['Float']['output'];
  headcount: Scalars['Int']['output'];
  outputPerPerson: Scalars['Float']['output'];
};

export type DepartmentInjectionData = {
  __typename?: 'DepartmentInjectionData';
  error?: Maybe<Scalars['String']['output']>;
  loading: Scalars['Boolean']['output'];
  machineStates: Array<MachineState>;
  materialStocks: StockItemConnection;
  stats: DepartmentStats;
  topStocks: StockItemConnection;
};

export type DepartmentPipeData = {
  __typename?: 'DepartmentPipeData';
  error?: Maybe<Scalars['String']['output']>;
  loading: Scalars['Boolean']['output'];
  machineStates: Array<MachineState>;
  materialConsumptionRate?: Maybe<Scalars['Float']['output']>;
  materialStocks: StockItemConnection;
  pipeProductionRate?: Maybe<Scalars['Float']['output']>;
  stats: DepartmentStats;
  topStocks: StockItemConnection;
};

export type DepartmentStats = {
  __typename?: 'DepartmentStats';
  lastUpdated: Scalars['String']['output'];
  past7Days: Scalars['Int']['output'];
  past14Days: Scalars['Int']['output'];
  todayFinished?: Maybe<Scalars['Int']['output']>;
  todayTransferred?: Maybe<Scalars['Int']['output']>;
};

export type DepartmentWarehouseData = {
  __typename?: 'DepartmentWarehouseData';
  error?: Maybe<Scalars['String']['output']>;
  loading: Scalars['Boolean']['output'];
  materialStocks: StockItemConnection;
  orderCompletions: Array<OrderCompletion>;
  recentActivities: Array<RecentActivity>;
  stats: DepartmentStats;
  topStocks: StockItemConnection;
};

export type EfficiencyMetrics = CardData & {
  __typename?: 'EfficiencyMetrics';
  averageOperationsPerMinute: Scalars['Float']['output'];
  averageTaskTime: Scalars['Float']['output'];
  dataSource: Scalars['String']['output'];
  efficiencyByDepartment: Array<DepartmentEfficiency>;
  efficiencyByShift: Array<ShiftEfficiency>;
  efficiencyTrends: Array<TrendPoint>;
  fastestOperator: OperatorEfficiency;
  idleTimePercentage: Scalars['Float']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  overallEfficiency: Scalars['Float']['output'];
  peakHour: Scalars['Int']['output'];
  productivityIndex: Scalars['Float']['output'];
  quietHour: Scalars['Int']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  slowestOperator: OperatorEfficiency;
  tasksPerHour: Scalars['Float']['output'];
  utilizationRate: Scalars['Float']['output'];
};

export type EfficiencyTrend = {
  __typename?: 'EfficiencyTrend';
  activeOperators: Scalars['Int']['output'];
  avgOperationsPerMinute: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type EnhancedTransferRecord = {
  __typename?: 'EnhancedTransferRecord';
  action: Scalars['String']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  efficiency?: Maybe<Scalars['Float']['output']>;
  formattedDate: Scalars['String']['output'];
  formattedDuration?: Maybe<Scalars['String']['output']>;
  formattedTime: Scalars['String']['output'];
  fromLocation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isBottleneck: Scalars['Boolean']['output'];
  operator: Scalars['String']['output'];
  operatorInfo?: Maybe<User>;
  pallet?: Maybe<PalletBasicInfo>;
  palletNumber: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  toLocation: Scalars['String']['output'];
};

export type Error = {
  __typename?: 'Error';
  code?: Maybe<Scalars['String']['output']>;
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type ErrorReason = {
  __typename?: 'ErrorReason';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  reason: Scalars['String']['output'];
};

export type ErrorTypeMetric = {
  __typename?: 'ErrorTypeMetric';
  count: Scalars['Int']['output'];
  errorType: Scalars['String']['output'];
  lastOccurrence: Scalars['DateTime']['output'];
  percentage: Scalars['Float']['output'];
};

export enum ExportFormat {
  Csv = 'CSV',
  Env = 'ENV',
  Excel = 'EXCEL',
  Ini = 'INI',
  Json = 'JSON',
  Pdf = 'PDF',
  Yaml = 'YAML',
}

export type ExportResult = {
  __typename?: 'ExportResult';
  downloadUrl: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['DateTime']['output'];
  fileName: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  progress?: Maybe<Scalars['Float']['output']>;
  status: ExportStatus;
};

export enum ExportStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
}

export type ExportTableInput = {
  columns?: InputMaybe<Array<Scalars['String']['input']>>;
  dataSource: Scalars['String']['input'];
  dateRange?: InputMaybe<DateRangeInput>;
  fileName?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<TableFilters>;
  format: ExportFormat;
  includeHeaders?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FieldChange = {
  __typename?: 'FieldChange';
  field: Scalars['String']['output'];
  newValue?: Maybe<Scalars['JSON']['output']>;
  oldValue?: Maybe<Scalars['JSON']['output']>;
};

export type FileInfo = {
  __typename?: 'FileInfo';
  analysisData?: Maybe<Scalars['JSON']['output']>;
  checksum?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  docName: Scalars['String']['output'];
  docType?: Maybe<Scalars['String']['output']>;
  docUrl?: Maybe<Scalars['String']['output']>;
  downloadCount?: Maybe<Scalars['Int']['output']>;
  extension: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  fileSize?: Maybe<Scalars['Int']['output']>;
  folder?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isImage: Scalars['Boolean']['output'];
  isPdf: Scalars['Boolean']['output'];
  isProcessed: Scalars['Boolean']['output'];
  jsonTxt?: Maybe<Scalars['String']['output']>;
  lastAccessed?: Maybe<Scalars['DateTime']['output']>;
  mimeType: Scalars['String']['output'];
  originalName: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  uploadBy: Scalars['Int']['output'];
  uploadedAt: Scalars['DateTime']['output'];
  uploadedBy: Scalars['String']['output'];
  uploader?: Maybe<User>;
  url?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['ID']['output'];
};

export type FileInfoConnection = {
  __typename?: 'FileInfoConnection';
  edges: Array<FileInfoEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FileInfoEdge = {
  __typename?: 'FileInfoEdge';
  cursor: Scalars['String']['output'];
  node: FileInfo;
};

export type FileInfoFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  docType?: InputMaybe<Scalars['String']['input']>;
  folder?: InputMaybe<Scalars['String']['input']>;
  hasAnalysisData?: InputMaybe<Scalars['Boolean']['input']>;
  uploadBy?: InputMaybe<Scalars['Int']['input']>;
};

export type FileSearchInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  fileTypes?: InputMaybe<Array<SupportedFileType>>;
  folder?: InputMaybe<UploadFolder>;
  pagination?: InputMaybe<PaginationInput>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<SortInput>;
  uploadedBy?: InputMaybe<Scalars['String']['input']>;
};

export type FileSearchResult = {
  __typename?: 'FileSearchResult';
  files: Array<FileInfo>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FileTypeStats = {
  __typename?: 'FileTypeStats';
  count: Scalars['Int']['output'];
  totalSize: Scalars['Int']['output'];
  type: SupportedFileType;
};

export type FilterInput = {
  field: Scalars['String']['input'];
  operator: FilterOperator;
  value: Scalars['JSON']['input'];
};

export enum FilterOperator {
  Between = 'BETWEEN',
  Contains = 'CONTAINS',
  Eq = 'EQ',
  Gt = 'GT',
  Gte = 'GTE',
  In = 'IN',
  IsNotNull = 'IS_NOT_NULL',
  IsNull = 'IS_NULL',
  Lt = 'LT',
  Lte = 'LTE',
  Neq = 'NEQ',
  NotContains = 'NOT_CONTAINS',
  NotIn = 'NOT_IN',
}

export type FlowMetrics = {
  __typename?: 'FlowMetrics';
  averageTransferDuration: Scalars['Float']['output'];
  fastestRoute?: Maybe<RouteMetric>;
  p95TransferDuration: Scalars['Float']['output'];
  peakHour: Scalars['String']['output'];
  slowestRoute?: Maybe<RouteMetric>;
  totalThroughput: Scalars['Int']['output'];
};

/**
 * 收貨單 (Goods Received Note) - 商業層級類型
 * 代表完整的收貨作業，包含多個收貨項目的彙總資訊
 * 這是一個虛擬類型，用於提供商業邏輯層的抽象
 */
export type Grn = {
  __typename?: 'GRN';
  /** 完成日期 (可選) */
  completedDate?: Maybe<Scalars['DateTime']['output']>;
  /** 創建時間 */
  createdAt: Scalars['DateTime']['output'];
  /** 創建人員 */
  createdBy: User;
  /** 收貨單編號 */
  grnNumber: Scalars['String']['output'];
  /** 收貨單唯一標識符 */
  id: Scalars['ID']['output'];
  /** 收貨項目清單 (關聯到 GRNRecord) */
  items: Array<GrnItem>;
  /** 品質檢查人員 (可選) */
  qcBy?: Maybe<User>;
  /** 品質檢查完成日期 (可選) */
  qcCompletedDate?: Maybe<Scalars['DateTime']['output']>;
  /** 品質檢查狀態 (可選) */
  qcStatus?: Maybe<QcStatus>;
  /** 收貨日期 */
  receivedDate: Scalars['DateTime']['output'];
  /** 收貨單狀態 */
  status: GrnStatus;
  /** 供應商資訊 (關聯查詢) */
  supplier: Supplier;
  /** 供應商代碼 */
  supplierCode: Scalars['String']['output'];
  /** 總項目數量 (計算欄位) */
  totalItems: Scalars['Int']['output'];
  /** 總收貨數量 (計算欄位) */
  totalQuantity: Scalars['Int']['output'];
};

export type GrnConnection = {
  __typename?: 'GRNConnection';
  edges: Array<GrnEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type GrnEdge = {
  __typename?: 'GRNEdge';
  cursor: Scalars['String']['output'];
  node: Grn;
};

export type GrnFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  grnNumber?: InputMaybe<Scalars['String']['input']>;
  qcStatus?: InputMaybe<QcStatus>;
  status?: InputMaybe<GrnStatus>;
  supplierCode?: InputMaybe<Scalars['String']['input']>;
};

export type GrnItem = {
  __typename?: 'GRNItem';
  palletNumbers: Array<Scalars['String']['output']>;
  product: Product;
  productCode: Scalars['String']['output'];
  qcPassed?: Maybe<Scalars['Boolean']['output']>;
  quantity: Scalars['Int']['output'];
  remarks?: Maybe<Scalars['String']['output']>;
};

/**
 * 收貨記錄項目 (record_grn 表) - 數據庫層級類型
 * 代表收貨單中的單一項目記錄，直接對應數據庫表結構
 * 每一筆記錄代表一個托盤的收貨資訊，包含重量、包裝等詳細數據
 */
export type GrnRecord = {
  __typename?: 'GRNRecord';
  /** 記錄創建時間 (注意：資料庫欄位名稱為 creat_time) */
  creatTime: Scalars['DateTime']['output'];
  /** 發現的差異或問題清單 */
  discrepancies?: Maybe<Array<Scalars['String']['output']>>;
  /** 收貨單參考號碼，關聯到主收貨單 */
  grnRef: Scalars['Int']['output'];
  /** 毛重 (包含包裝重量) */
  grossWeight: Scalars['Int']['output'];
  /** 重量數據是否通過驗證 */
  isWeightValid: Scalars['Boolean']['output'];
  /** 材料/產品代碼，外鍵關聯 data_code 表 */
  materialCode: Scalars['String']['output'];
  /** 淨重 (實際產品重量) */
  netWeight: Scalars['Int']['output'];
  /** 包裝資訊描述 */
  package: Scalars['String']['output'];
  /** 包裝數量 (數值型，支援小數) */
  packageCount: Scalars['Float']['output'];
  /** 包裝效率指標，綜合評估包裝品質 */
  packagingEfficiency?: Maybe<Scalars['Float']['output']>;
  /** 托盤資訊描述 */
  pallet: Scalars['String']['output'];
  /** 托盤數量 (數值型，支援小數) */
  palletCount: Scalars['Float']['output'];
  /** 關聯的托盤詳細資訊 */
  palletInfo: Pallet;
  /** 托盤號碼，外鍵關聯 record_palletinfo 表 */
  pltNum: Scalars['String']['output'];
  /** 關聯的產品資訊 */
  product: Product;
  /** 品質檢查備註 */
  qualityNotes?: Maybe<Scalars['String']['output']>;
  /** 記錄處理狀態 */
  status: GrnRecordStatus;
  /** 供應商代碼，外鍵關聯 data_supplier 表 */
  supCode: Scalars['String']['output'];
  /** 關聯的供應商資訊 */
  supplier: Supplier;
  /** 單位重量 (毛重/包裝數量)，用於標準化比較 */
  unitWeight?: Maybe<Scalars['Float']['output']>;
  /** 記錄唯一標識符 (主鍵) */
  uuid: Scalars['ID']['output'];
  /** 重量比率 (淨重/毛重)，用於評估包裝效率 */
  weightRatio?: Maybe<Scalars['Float']['output']>;
};

export type GrnRecordConnection = {
  __typename?: 'GRNRecordConnection';
  edges: Array<GrnRecordEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type GrnRecordCorrectionInput = {
  correctedBy: Scalars['String']['input'];
  correctionReason: Scalars['String']['input'];
  grossWeight?: InputMaybe<Scalars['Int']['input']>;
  netWeight?: InputMaybe<Scalars['Int']['input']>;
  packageCount?: InputMaybe<Scalars['Float']['input']>;
  palletCount?: InputMaybe<Scalars['Float']['input']>;
};

export type GrnRecordEdge = {
  __typename?: 'GRNRecordEdge';
  cursor: Scalars['String']['output'];
  node: GrnRecord;
};

export type GrnRecordFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  grnRef?: InputMaybe<Scalars['Int']['input']>;
  hasDiscrepancies?: InputMaybe<Scalars['Boolean']['input']>;
  materialCode?: InputMaybe<Scalars['String']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<GrnRecordStatus>;
  supCode?: InputMaybe<Scalars['String']['input']>;
  weightRange?: InputMaybe<WeightRangeInput>;
};

export enum GrnRecordStatus {
  Cancelled = 'CANCELLED',
  Corrected = 'CORRECTED',
  Discrepancy = 'DISCREPANCY',
  Recorded = 'RECORDED',
  Verified = 'VERIFIED',
}

export enum GrnStatus {
  Completed = 'COMPLETED',
  Pending = 'PENDING',
  QcInProgress = 'QC_IN_PROGRESS',
  QcPending = 'QC_PENDING',
  Receiving = 'RECEIVING',
  Rejected = 'REJECTED',
}

export type GeneratedReport = {
  __typename?: 'GeneratedReport';
  description?: Maybe<Scalars['String']['output']>;
  downloadCount: Scalars['Int']['output'];
  downloadUrl?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  fileName?: Maybe<Scalars['String']['output']>;
  fileSize?: Maybe<Scalars['Int']['output']>;
  filters?: Maybe<Scalars['JSON']['output']>;
  format: ReportFormat;
  generatedAt: Scalars['DateTime']['output'];
  generatedBy: Scalars['String']['output'];
  generationTime?: Maybe<Scalars['Int']['output']>;
  grouping?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  lastDownloaded?: Maybe<Scalars['DateTime']['output']>;
  priority: ReportPriority;
  recordCount?: Maybe<Scalars['Int']['output']>;
  reportType: ReportType;
  status: ReportStatus;
  title: Scalars['String']['output'];
};

export type GrnLevel = {
  __typename?: 'GrnLevel';
  averageWeight?: Maybe<Scalars['Float']['output']>;
  grn?: Maybe<Grn>;
  grnRef?: Maybe<Scalars['Int']['output']>;
  latestUpdate: Scalars['DateTime']['output'];
  netToGrossRatio?: Maybe<Scalars['Float']['output']>;
  totalGross: Scalars['Int']['output'];
  totalNet?: Maybe<Scalars['Int']['output']>;
  totalUnit: Scalars['Int']['output'];
  uuid: Scalars['ID']['output'];
};

export type GrnLevelConnection = {
  __typename?: 'GrnLevelConnection';
  edges: Array<GrnLevelEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type GrnLevelEdge = {
  __typename?: 'GrnLevelEdge';
  cursor: Scalars['String']['output'];
  node: GrnLevel;
};

export type GrnLevelFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  grnRef?: InputMaybe<Scalars['Int']['input']>;
  maxTotalUnit?: InputMaybe<Scalars['Int']['input']>;
  minTotalUnit?: InputMaybe<Scalars['Int']['input']>;
};

export type GrnLevelSummary = {
  __typename?: 'GrnLevelSummary';
  averageGrossWeight: Scalars['Float']['output'];
  averageNetToGrossRatio: Scalars['Float']['output'];
  averageNetWeight: Scalars['Float']['output'];
  byGrnRef: Array<GrnRefSummary>;
  lastUpdated: Scalars['DateTime']['output'];
  totalGrossWeight: Scalars['Int']['output'];
  totalNetWeight: Scalars['Int']['output'];
  totalRecords: Scalars['Int']['output'];
  totalUnits: Scalars['Int']['output'];
};

export type GrnRefSummary = {
  __typename?: 'GrnRefSummary';
  grnRef: Scalars['Int']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  recordCount: Scalars['Int']['output'];
  totalGross: Scalars['Int']['output'];
  totalNet: Scalars['Int']['output'];
  totalUnits: Scalars['Int']['output'];
};

export type HighRiskIp = {
  __typename?: 'HighRiskIP';
  ipAddress: Scalars['String']['output'];
  lastActivity: Scalars['DateTime']['output'];
  riskLevel: ThreatRiskLevel;
  threatTypes: Array<Scalars['String']['output']>;
  totalOccurrences: Scalars['Int']['output'];
};

export type HistoryEntry = {
  __typename?: 'HistoryEntry';
  action: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  pallet?: Maybe<HistoryPallet>;
  remark?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  user?: Maybe<HistoryUser>;
};

export type HistoryPallet = {
  __typename?: 'HistoryPallet';
  generatedAt?: Maybe<Scalars['DateTime']['output']>;
  number: Scalars['String']['output'];
  product?: Maybe<HistoryProduct>;
  quantity: Scalars['Int']['output'];
  series?: Maybe<Scalars['String']['output']>;
};

export type HistoryProduct = {
  __typename?: 'HistoryProduct';
  code: Scalars['String']['output'];
  colour: Scalars['String']['output'];
  description: Scalars['String']['output'];
  standardQty?: Maybe<Scalars['Int']['output']>;
  type: Scalars['String']['output'];
};

export type HistoryRecord = {
  __typename?: 'HistoryRecord';
  action: Scalars['String']['output'];
  entityData?: Maybe<Scalars['JSON']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  location?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  pallet?: Maybe<Pallet>;
  performedBy?: Maybe<User>;
  pltNum?: Maybe<Scalars['String']['output']>;
  recordType?: Maybe<HistoryType>;
  remark: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  timestamp: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  uuid: Scalars['ID']['output'];
};

export type HistoryRecordConnection = {
  __typename?: 'HistoryRecordConnection';
  edges: Array<HistoryRecordEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type HistoryRecordEdge = {
  __typename?: 'HistoryRecordEdge';
  cursor: Scalars['String']['output'];
  node: HistoryRecord;
};

export type HistoryRecordFilterInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  location?: InputMaybe<Scalars['String']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  recordType?: InputMaybe<HistoryType>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};

export type HistoryTreeFilters = {
  __typename?: 'HistoryTreeFilters';
  actionTypes?: Maybe<Array<Scalars['String']['output']>>;
  dateRange?: Maybe<DateRange>;
  locations?: Maybe<Array<Scalars['String']['output']>>;
  palletNumbers?: Maybe<Array<Scalars['String']['output']>>;
  userIds?: Maybe<Array<Scalars['String']['output']>>;
};

export enum HistoryTreeGroupBy {
  Action = 'ACTION',
  Location = 'LOCATION',
  Time = 'TIME',
  User = 'USER',
}

export type HistoryTreeInput = {
  actionTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  dateRange?: InputMaybe<DateRangeInput>;
  groupBy?: InputMaybe<HistoryTreeGroupBy>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  locations?: InputMaybe<Array<Scalars['String']['input']>>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  palletNumbers?: InputMaybe<Array<Scalars['String']['input']>>;
  sortBy?: InputMaybe<HistoryTreeSortField>;
  sortOrder?: InputMaybe<SortDirection>;
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type HistoryTreeResult = {
  __typename?: 'HistoryTreeResult';
  entries: Array<HistoryEntry>;
  filters: HistoryTreeFilters;
  groupedData?: Maybe<Scalars['JSON']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  sort: HistoryTreeSort;
  totalCount: Scalars['Int']['output'];
};

export type HistoryTreeSort = {
  __typename?: 'HistoryTreeSort';
  sortBy: HistoryTreeSortField;
  sortOrder: SortDirection;
};

export enum HistoryTreeSortField {
  Action = 'ACTION',
  Location = 'LOCATION',
  Time = 'TIME',
  User = 'USER',
}

export enum HistoryType {
  FileUpload = 'FILE_UPLOAD',
  Grn = 'GRN',
  Inventory = 'INVENTORY',
  Order = 'ORDER',
  Pallet = 'PALLET',
  Product = 'PRODUCT',
  RecordGrn = 'RECORD_GRN',
  System = 'SYSTEM',
  Transfer = 'TRANSFER',
  User = 'USER',
  WorkLevel = 'WORK_LEVEL',
}

export type HistoryUser = {
  __typename?: 'HistoryUser';
  department?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  position?: Maybe<Scalars['String']['output']>;
};

export type HourlyBreakdown = {
  __typename?: 'HourlyBreakdown';
  count: Scalars['Int']['output'];
  hour: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
};

export type HourlyTrend = {
  __typename?: 'HourlyTrend';
  avgEfficiency: Scalars['Float']['output'];
  hour: Scalars['Int']['output'];
  operationCount: Scalars['Int']['output'];
  uniqueOperators: Scalars['Int']['output'];
};

export type Inventory = {
  __typename?: 'Inventory';
  await: Scalars['Int']['output'];
  await_grn?: Maybe<Scalars['Int']['output']>;
  backcarpark: Scalars['Int']['output'];
  bulk: Scalars['Int']['output'];
  damage: Scalars['Int']['output'];
  fold: Scalars['Int']['output'];
  injection: Scalars['Int']['output'];
  latestUpdate?: Maybe<Scalars['DateTime']['output']>;
  locationQuantities: LocationInventory;
  pallet: Pallet;
  pipeline: Scalars['Int']['output'];
  pltNum: Scalars['String']['output'];
  prebook: Scalars['Int']['output'];
  product: Product;
  productCode: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
  uuid: Scalars['ID']['output'];
};

export type InventoryAnalysisItem = {
  __typename?: 'InventoryAnalysisItem';
  analysis: AnalysisMetrics;
  inventory: InventoryDetails;
  orders: OrderDetails;
  product_code: Scalars['String']['output'];
  product_description: Scalars['String']['output'];
  product_type: Scalars['String']['output'];
  standard_qty: Scalars['Int']['output'];
};

export enum InventoryAnalysisSortField {
  FulfillmentRate = 'FULFILLMENT_RATE',
  InventoryGap = 'INVENTORY_GAP',
  ProductCode = 'PRODUCT_CODE',
  Status = 'STATUS',
}

export type InventoryAnalysisSummary = {
  __typename?: 'InventoryAnalysisSummary';
  overall_fulfillment_rate: Scalars['Float']['output'];
  products_insufficient: Scalars['Int']['output'];
  products_no_orders: Scalars['Int']['output'];
  products_out_of_stock: Scalars['Int']['output'];
  products_sufficient: Scalars['Int']['output'];
  total_inventory_value: Scalars['Int']['output'];
  total_outstanding_orders_value: Scalars['Int']['output'];
  total_products: Scalars['Int']['output'];
};

export type InventoryDetails = {
  __typename?: 'InventoryDetails';
  last_update?: Maybe<Scalars['DateTime']['output']>;
  locations?: Maybe<LocationBreakdown>;
  total: Scalars['Int']['output'];
};

export type InventoryFilterInput = {
  hasAwaitQuantity?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<LocationType>;
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
  minQuantity?: InputMaybe<Scalars['Int']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
};

export type InventoryOrderedAnalysisInput = {
  filterStatus?: InputMaybe<InventoryStatus>;
  includeLocationBreakdown?: InputMaybe<Scalars['Boolean']['input']>;
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  productType?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<InventoryAnalysisSortField>;
  sortOrder?: InputMaybe<SortDirection>;
};

export type InventoryOrderedAnalysisResult = {
  __typename?: 'InventoryOrderedAnalysisResult';
  data: Array<InventoryAnalysisItem>;
  generated_at: Scalars['DateTime']['output'];
  success: Scalars['Boolean']['output'];
  summary: InventoryAnalysisSummary;
};

export enum InventoryStatus {
  Insufficient = 'INSUFFICIENT',
  NoOrders = 'NO_ORDERS',
  OutOfStock = 'OUT_OF_STOCK',
  Sufficient = 'SUFFICIENT',
}

export type InventorySummary = {
  __typename?: 'InventorySummary';
  availableQuantity: Scalars['Int']['output'];
  lastUpdate: Scalars['DateTime']['output'];
  locationBreakdown: LocationInventory;
  reservedQuantity: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type LoadingSummary = {
  __typename?: 'LoadingSummary';
  averageLoadPerOrder: Scalars['Float']['output'];
  totalLoaded: Scalars['Int']['output'];
  uniqueOrders: Scalars['Int']['output'];
  uniqueProducts: Scalars['Int']['output'];
};

export type Location = {
  __typename?: 'Location';
  code: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: LocationType;
};

export type LocationBottleneck = {
  __typename?: 'LocationBottleneck';
  avgWaitTime: Scalars['Float']['output'];
  backlogCount: Scalars['Int']['output'];
  location: Scalars['String']['output'];
  severity: BottleneckSeverity;
};

export type LocationBreakdown = {
  __typename?: 'LocationBreakdown';
  await: Scalars['Int']['output'];
  await_grn: Scalars['Int']['output'];
  backcarpark: Scalars['Int']['output'];
  bulk: Scalars['Int']['output'];
  count: Scalars['Int']['output'];
  damage: Scalars['Int']['output'];
  fold: Scalars['Int']['output'];
  injection: Scalars['Int']['output'];
  location: Location;
  pipeline: Scalars['Int']['output'];
  prebook: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
};

export type LocationCount = {
  __typename?: 'LocationCount';
  count: Scalars['Int']['output'];
  location: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
};

export type LocationInventory = {
  __typename?: 'LocationInventory';
  await: Scalars['Int']['output'];
  await_grn?: Maybe<Scalars['Int']['output']>;
  backcarpark: Scalars['Int']['output'];
  bulk: Scalars['Int']['output'];
  damage: Scalars['Int']['output'];
  fold: Scalars['Int']['output'];
  injection: Scalars['Int']['output'];
  pipeline: Scalars['Int']['output'];
  prebook: Scalars['Int']['output'];
};

export type LocationJourney = {
  __typename?: 'LocationJourney';
  actions: Array<StockAction>;
  duration?: Maybe<Scalars['Int']['output']>;
  entryTime: Scalars['DateTime']['output'];
  exitTime?: Maybe<Scalars['DateTime']['output']>;
  location: Scalars['String']['output'];
  operator?: Maybe<Scalars['String']['output']>;
  sequence: Scalars['Int']['output'];
};

export enum LocationType {
  Await = 'AWAIT',
  AwaitGrn = 'AWAIT_GRN',
  Backcarpark = 'BACKCARPARK',
  Bulk = 'BULK',
  Damage = 'DAMAGE',
  Fold = 'FOLD',
  Injection = 'INJECTION',
  Pipeline = 'PIPELINE',
  Prebook = 'PREBOOK',
}

export type MachineState = {
  __typename?: 'MachineState';
  currentTask?: Maybe<Scalars['String']['output']>;
  efficiency?: Maybe<Scalars['Float']['output']>;
  lastActiveTime?: Maybe<Scalars['String']['output']>;
  machineNumber: Scalars['String']['output'];
  nextMaintenance?: Maybe<Scalars['String']['output']>;
  state: MachineStatus;
};

export enum MachineStatus {
  Active = 'ACTIVE',
  Idle = 'IDLE',
  Maintenance = 'MAINTENANCE',
  Offline = 'OFFLINE',
  Unknown = 'UNKNOWN',
}

export type Material = {
  __typename?: 'Material';
  chinese_description?: Maybe<Scalars['String']['output']>;
  product_code: Scalars['String']['output'];
  product_description?: Maybe<Scalars['String']['output']>;
};

export type MergedRecordHistory = {
  __typename?: 'MergedRecordHistory';
  action: Scalars['String']['output'];
  averageTimeBetweenOps?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  efficiency?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  isSequential: Scalars['Boolean']['output'];
  locations?: Maybe<Array<Scalars['String']['output']>>;
  operatorDepartment?: Maybe<Scalars['String']['output']>;
  operatorEmail?: Maybe<Scalars['String']['output']>;
  operatorId: Scalars['Int']['output'];
  operatorName: Scalars['String']['output'];
  operatorPosition?: Maybe<Scalars['String']['output']>;
  palletNumbers: Array<Scalars['String']['output']>;
  remark: Scalars['String']['output'];
  timeEnd: Scalars['DateTime']['output'];
  timeStart: Scalars['DateTime']['output'];
};

export type MergingConfig = {
  groupByLocation?: InputMaybe<Scalars['Boolean']['input']>;
  includeSequentialAnalysis?: InputMaybe<Scalars['Boolean']['input']>;
  maxOperationsPerGroup?: InputMaybe<Scalars['Int']['input']>;
  minOperationsToMerge?: InputMaybe<Scalars['Int']['input']>;
  sameActionOnly?: InputMaybe<Scalars['Boolean']['input']>;
  sameOperatorOnly?: InputMaybe<Scalars['Boolean']['input']>;
  timeWindowMinutes?: InputMaybe<Scalars['Int']['input']>;
};

export type MergingStats = {
  __typename?: 'MergingStats';
  averageGroupSize: Scalars['Float']['output'];
  compressionRatio: Scalars['Float']['output'];
  largestGroupSize: Scalars['Int']['output'];
  sequentialGroups: Scalars['Int']['output'];
  totalMergedGroups: Scalars['Int']['output'];
  totalOriginalRecords: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acknowledgeAlert: Alert;
  activateAPIConfig: ApiConfig;
  applyConfigTemplate: ConfigBatchResult;
  approveStocktakeRecord: StocktakeRecord;
  batchAcknowledgeAlerts: BatchAlertResult;
  batchCreateHistoryRecords: Array<HistoryRecord>;
  batchDeleteFiles: Scalars['Boolean']['output'];
  batchOperation: BatchOperationResult;
  batchReportOperation: BatchReportResult;
  batchResolveAlerts: BatchAlertResult;
  batchUpdateConfigs: ConfigBatchResult;
  batchUpdateStocktakeRecords: BatchStocktakeResult;
  batchUpdateWorkLevels: Array<WorkLevel>;
  blockIpAddress: Scalars['Boolean']['output'];
  bulkCreateDatabaseMetrics: Array<DatabasePerformanceMetric>;
  bulkCreateQueryMetrics: Array<QueryPerformanceMetric>;
  bulkCreateRecordHistory: BatchResult;
  bulkDeleteQueryRecords: Scalars['Int']['output'];
  bulkProcessCacheEvents: Array<CacheInvalidationEvent>;
  bulkUpdateStockLevels: Array<StockLevel>;
  cancelReportGeneration: Scalars['Boolean']['output'];
  cancelTransfer: Transfer;
  cancelUpload: Scalars['Boolean']['output'];
  cancelWarehouseOrder: WarehouseOrder;
  clearCache: Scalars['Boolean']['output'];
  clearRecordHistoryCache: Scalars['Boolean']['output'];
  clearTableCache: Scalars['Boolean']['output'];
  completeAcoRecord: AcoRecord;
  correctGRNRecord: GrnRecord;
  correctOrderLoadingHistory: OrderLoadingHistory;
  createAPIConfig: ApiConfig;
  createAcoRecord: AcoRecord;
  createCacheInvalidationEvent: CacheInvalidationEvent;
  createConfig: ConfigItem;
  createConfigTemplate: ConfigTemplate;
  createCustomAlert: Alert;
  createDatabasePerformanceMetric: DatabasePerformanceMetric;
  createFileInfo: FileInfo;
  createGRNRecord: GrnRecord;
  createGrnLevel: GrnLevel;
  createHistoryRecord: HistoryRecord;
  createOrderLoadingHistory: OrderLoadingHistory;
  createPalletNumberBuffer: PalletNumberBuffer;
  createProduct: Product;
  createQueryPerformanceMetric: QueryPerformanceMetric;
  createQueryRecord: QueryRecord;
  createRecordHistoryEntry: RecordHistoryEntry;
  createReportTemplate: ReportTemplate;
  createReportVoid: ReportVoid;
  createSlateInfo: SlateInfo;
  createStockLevel: StockLevel;
  createStocktakeRecord: StocktakeRecord;
  createSupplier: Supplier;
  createThreatStat: ThreatStat;
  createTransfer: Transfer;
  createWorkLevel: WorkLevel;
  deactivateAPIConfig: ApiConfig;
  deactivateProduct: Product;
  deactivateSupplier: Supplier;
  deleteAPIConfig: Scalars['Boolean']['output'];
  deleteAcoRecord: Scalars['Boolean']['output'];
  deleteCacheInvalidationEvent: Scalars['Boolean']['output'];
  deleteConfig: Scalars['Boolean']['output'];
  deleteDatabasePerformanceMetric: Scalars['Boolean']['output'];
  deleteExpiredQueryRecords: Scalars['Int']['output'];
  deleteFile: Scalars['Boolean']['output'];
  deleteFileInfo: Scalars['Boolean']['output'];
  deleteFiles: BatchResult;
  deleteGRNRecord: Scalars['Boolean']['output'];
  deleteGrnLevel: Scalars['Boolean']['output'];
  deleteHistoryRecord: Scalars['Boolean']['output'];
  deleteOldDatabaseMetrics: Scalars['Int']['output'];
  deleteOldQueryMetrics: Scalars['Int']['output'];
  deleteOldThreatStats: Scalars['Int']['output'];
  deletePalletNumberBuffer: Scalars['Boolean']['output'];
  deleteProcessedCacheEvents: Scalars['Int']['output'];
  deleteQueryPerformanceMetric: Scalars['Boolean']['output'];
  deleteQueryRecord: Scalars['Boolean']['output'];
  deleteReport: Scalars['Boolean']['output'];
  deleteReportTemplate: Scalars['Boolean']['output'];
  deleteReportVoid: Scalars['Boolean']['output'];
  deleteSlateInfo: Scalars['Boolean']['output'];
  deleteStockLevel: Scalars['Boolean']['output'];
  deleteThreatStat: Scalars['Boolean']['output'];
  dismissAlert: Scalars['Boolean']['output'];
  exportConfigs: Scalars['String']['output'];
  exportRecordHistory: RecordHistoryExportResult;
  exportTableData: ExportResult;
  extendReportExpiry: GeneratedReport;
  generatePalletNumbers: Array<PalletNumberBuffer>;
  generateReport: ReportGenerationResult;
  importConfigs: ConfigBatchResult;
  incrementThreatOccurrence: ThreatStat;
  incrementWorkLevel: WorkLevel;
  markCacheEventAsProcessed: CacheInvalidationEvent;
  markPalletNumberAsUnused: PalletNumberBuffer;
  markPalletNumberAsUsed: PalletNumberBuffer;
  markQueryRecordAsExpired: QueryRecord;
  reanalyzeOrderPDF: OrderAnalysisResult;
  refreshCache: Scalars['Boolean']['output'];
  refreshTableData: Scalars['Boolean']['output'];
  regenerateReport: ReportGenerationResult;
  rejectStocktakeRecord: StocktakeRecord;
  reportDiscrepancy: GrnRecord;
  resetConfig: ConfigItem;
  resetConfigCategory: ConfigBatchResult;
  resetWorkLevel: WorkLevel;
  resolveAlert: Alert;
  retryUpload: SingleUploadResult;
  shareReport: Scalars['Boolean']['output'];
  testAlertChannel: Scalars['Boolean']['output'];
  unblockIpAddress: Scalars['Boolean']['output'];
  updateAPIConfig: ApiConfig;
  updateAcoOrder: UpdateAcoOrderResponse;
  updateAcoRecord: AcoRecord;
  updateAcoRecordProgress: AcoRecord;
  updateAlertRule: AlertRule;
  updateConfig: ConfigItem;
  updateFileAnalysis: FileInfo;
  updateFileInfo: FileInfo;
  updateFileMetadata: FileInfo;
  updateGRNRecord: GrnRecord;
  updateGrnLevel: GrnLevel;
  updateHistoryRecord: HistoryRecord;
  updateMergingConfig: Scalars['Boolean']['output'];
  updatePalletNumberBuffer: PalletNumberBuffer;
  updateProduct: Product;
  updateReportTemplate: ReportTemplate;
  updateReportVoid: ReportVoid;
  updateSlateInfo: SlateInfo;
  updateStockLevel: StockLevel;
  updateStockLevelQuantity: StockLevel;
  updateStocktakeRecord: StocktakeRecord;
  updateSupplier: Supplier;
  updateThreatStat: ThreatStat;
  updateTransferStatus: Transfer;
  updateWarehouseOrderStatus: WarehouseOrder;
  updateWorkLevel: WorkLevel;
  uploadBatchFiles: BatchUploadResult;
  uploadSingleFile: SingleUploadResult;
  verifyGRNRecord: GrnRecord;
};

export type MutationAcknowledgeAlertArgs = {
  alertId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
};

export type MutationActivateApiConfigArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationApplyConfigTemplateArgs = {
  scope: ConfigScope;
  scopeId: Scalars['String']['input'];
  templateId: Scalars['ID']['input'];
};

export type MutationApproveStocktakeRecordArgs = {
  approvedBy: Scalars['String']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationBatchAcknowledgeAlertsArgs = {
  alertIds: Array<Scalars['ID']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
};

export type MutationBatchCreateHistoryRecordsArgs = {
  records: Array<CreateHistoryRecordInput>;
};

export type MutationBatchDeleteFilesArgs = {
  uuids: Array<Scalars['ID']['input']>;
};

export type MutationBatchOperationArgs = {
  operations: Array<BatchOperationInput>;
};

export type MutationBatchReportOperationArgs = {
  input: BatchReportOperationInput;
};

export type MutationBatchResolveAlertsArgs = {
  alertIds: Array<Scalars['ID']['input']>;
  resolution: Scalars['String']['input'];
};

export type MutationBatchUpdateConfigsArgs = {
  input: ConfigBatchUpdateInput;
};

export type MutationBatchUpdateStocktakeRecordsArgs = {
  records: Array<BatchStocktakeUpdateInput>;
};

export type MutationBatchUpdateWorkLevelsArgs = {
  updates: Array<BatchWorkLevelUpdateInput>;
};

export type MutationBlockIpAddressArgs = {
  ipAddress: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};

export type MutationBulkCreateDatabaseMetricsArgs = {
  metrics: Array<CreateDatabasePerformanceMetricInput>;
};

export type MutationBulkCreateQueryMetricsArgs = {
  metrics: Array<CreateQueryPerformanceMetricInput>;
};

export type MutationBulkCreateRecordHistoryArgs = {
  entries: Array<CreateRecordHistoryInput>;
};

export type MutationBulkDeleteQueryRecordsArgs = {
  uuids: Array<Scalars['ID']['input']>;
};

export type MutationBulkProcessCacheEventsArgs = {
  ids: Array<Scalars['ID']['input']>;
};

export type MutationBulkUpdateStockLevelsArgs = {
  updates: Array<BulkStockLevelUpdateInput>;
};

export type MutationCancelReportGenerationArgs = {
  generationId: Scalars['ID']['input'];
};

export type MutationCancelTransferArgs = {
  id: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};

export type MutationCancelUploadArgs = {
  uploadId: Scalars['ID']['input'];
};

export type MutationCancelWarehouseOrderArgs = {
  orderId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type MutationClearTableCacheArgs = {
  dataSource: Scalars['String']['input'];
};

export type MutationCompleteAcoRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationCorrectGrnRecordArgs = {
  corrections: GrnRecordCorrectionInput;
  uuid: Scalars['ID']['input'];
};

export type MutationCorrectOrderLoadingHistoryArgs = {
  correctedBy: Scalars['String']['input'];
  correctedQuantity: Scalars['Int']['input'];
  reason: Scalars['String']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationCreateApiConfigArgs = {
  input: CreateApiConfigInput;
};

export type MutationCreateAcoRecordArgs = {
  input: CreateAcoRecordInput;
};

export type MutationCreateCacheInvalidationEventArgs = {
  input: CreateCacheInvalidationEventInput;
};

export type MutationCreateConfigArgs = {
  input: ConfigItemInput;
};

export type MutationCreateConfigTemplateArgs = {
  category: ConfigCategory;
  configIds: Array<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  scope: ConfigScope;
};

export type MutationCreateCustomAlertArgs = {
  input: CreateAlertInput;
};

export type MutationCreateDatabasePerformanceMetricArgs = {
  input: CreateDatabasePerformanceMetricInput;
};

export type MutationCreateFileInfoArgs = {
  input: CreateFileInfoInput;
};

export type MutationCreateGrnRecordArgs = {
  input: CreateGrnRecordInput;
};

export type MutationCreateGrnLevelArgs = {
  input: CreateGrnLevelInput;
};

export type MutationCreateHistoryRecordArgs = {
  input: CreateHistoryRecordInput;
};

export type MutationCreateOrderLoadingHistoryArgs = {
  input: CreateOrderLoadingHistoryInput;
};

export type MutationCreatePalletNumberBufferArgs = {
  input: CreatePalletNumberBufferInput;
};

export type MutationCreateProductArgs = {
  input: CreateProductInput;
};

export type MutationCreateQueryPerformanceMetricArgs = {
  input: CreateQueryPerformanceMetricInput;
};

export type MutationCreateQueryRecordArgs = {
  input: CreateQueryRecordInput;
};

export type MutationCreateRecordHistoryEntryArgs = {
  input: CreateRecordHistoryInput;
};

export type MutationCreateReportTemplateArgs = {
  input: CreateReportTemplateInput;
};

export type MutationCreateReportVoidArgs = {
  input: CreateReportVoidInput;
};

export type MutationCreateSlateInfoArgs = {
  input: CreateSlateInfoInput;
};

export type MutationCreateStockLevelArgs = {
  input: CreateStockLevelInput;
};

export type MutationCreateStocktakeRecordArgs = {
  input: CreateStocktakeRecordInput;
};

export type MutationCreateSupplierArgs = {
  input: CreateSupplierInput;
};

export type MutationCreateThreatStatArgs = {
  input: CreateThreatStatInput;
};

export type MutationCreateTransferArgs = {
  input: CreateTransferInput;
};

export type MutationCreateWorkLevelArgs = {
  input: CreateWorkLevelInput;
};

export type MutationDeactivateApiConfigArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeactivateProductArgs = {
  code: Scalars['ID']['input'];
};

export type MutationDeactivateSupplierArgs = {
  code: Scalars['String']['input'];
};

export type MutationDeleteApiConfigArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteAcoRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteCacheInvalidationEventArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteConfigArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteDatabasePerformanceMetricArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteFileArgs = {
  fileId: Scalars['ID']['input'];
};

export type MutationDeleteFileInfoArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteFilesArgs = {
  fileIds: Array<Scalars['ID']['input']>;
};

export type MutationDeleteGrnRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteGrnLevelArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteHistoryRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteOldDatabaseMetricsArgs = {
  olderThanDays?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationDeleteOldQueryMetricsArgs = {
  olderThanDays?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationDeleteOldThreatStatsArgs = {
  olderThanDays?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationDeletePalletNumberBufferArgs = {
  id: Scalars['Int']['input'];
};

export type MutationDeleteProcessedCacheEventsArgs = {
  olderThanDays?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationDeleteQueryPerformanceMetricArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteQueryRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteReportArgs = {
  reportId: Scalars['ID']['input'];
};

export type MutationDeleteReportTemplateArgs = {
  templateId: Scalars['ID']['input'];
};

export type MutationDeleteReportVoidArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteSlateInfoArgs = {
  productCode: Scalars['String']['input'];
};

export type MutationDeleteStockLevelArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationDeleteThreatStatArgs = {
  id: Scalars['Int']['input'];
};

export type MutationDismissAlertArgs = {
  alertId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type MutationExportConfigsArgs = {
  category?: InputMaybe<ConfigCategory>;
  format: ExportFormat;
  scope?: InputMaybe<ConfigScope>;
};

export type MutationExportRecordHistoryArgs = {
  input: RecordHistoryExportInput;
};

export type MutationExportTableDataArgs = {
  input: ExportTableInput;
};

export type MutationExtendReportExpiryArgs = {
  days: Scalars['Int']['input'];
  reportId: Scalars['ID']['input'];
};

export type MutationGeneratePalletNumbersArgs = {
  count: Scalars['Int']['input'];
  dateStr: Scalars['String']['input'];
  series: Scalars['String']['input'];
};

export type MutationGenerateReportArgs = {
  input: ReportGenerationInput;
};

export type MutationImportConfigsArgs = {
  data: Scalars['String']['input'];
  format: ExportFormat;
  overwrite?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MutationIncrementThreatOccurrenceArgs = {
  id: Scalars['Int']['input'];
};

export type MutationIncrementWorkLevelArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
  operationType: WorkOperationType;
  userId: Scalars['Int']['input'];
};

export type MutationMarkCacheEventAsProcessedArgs = {
  id: Scalars['ID']['input'];
};

export type MutationMarkPalletNumberAsUnusedArgs = {
  id: Scalars['Int']['input'];
};

export type MutationMarkPalletNumberAsUsedArgs = {
  id: Scalars['Int']['input'];
};

export type MutationMarkQueryRecordAsExpiredArgs = {
  expiredReason: Scalars['String']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationReanalyzeOrderPdfArgs = {
  fileId: Scalars['ID']['input'];
};

export type MutationRefreshCacheArgs = {
  dataSource: Scalars['String']['input'];
};

export type MutationRefreshTableDataArgs = {
  dataSource: Scalars['String']['input'];
};

export type MutationRegenerateReportArgs = {
  reportId: Scalars['ID']['input'];
};

export type MutationRejectStocktakeRecordArgs = {
  reason: Scalars['String']['input'];
  rejectedBy: Scalars['String']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationReportDiscrepancyArgs = {
  discrepancy: Scalars['String']['input'];
  reportedBy: Scalars['String']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationResetConfigArgs = {
  id: Scalars['ID']['input'];
};

export type MutationResetConfigCategoryArgs = {
  category: ConfigCategory;
  scope: ConfigScope;
  scopeId?: InputMaybe<Scalars['String']['input']>;
};

export type MutationResetWorkLevelArgs = {
  uuid: Scalars['ID']['input'];
};

export type MutationResolveAlertArgs = {
  alertId: Scalars['ID']['input'];
  resolution: Scalars['String']['input'];
};

export type MutationRetryUploadArgs = {
  uploadId: Scalars['ID']['input'];
};

export type MutationShareReportArgs = {
  emails: Array<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  reportId: Scalars['ID']['input'];
};

export type MutationTestAlertChannelArgs = {
  channelId: Scalars['ID']['input'];
};

export type MutationUnblockIpAddressArgs = {
  ipAddress: Scalars['String']['input'];
};

export type MutationUpdateApiConfigArgs = {
  _input: UpdateApiConfigInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateAcoOrderArgs = {
  input: UpdateAcoOrderInput;
};

export type MutationUpdateAcoRecordArgs = {
  _input: UpdateAcoRecordInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateAcoRecordProgressArgs = {
  finishedQty: Scalars['Int']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateAlertRuleArgs = {
  _input: UpdateAlertRuleInput;
  ruleId: Scalars['ID']['input'];
};

export type MutationUpdateConfigArgs = {
  input: ConfigUpdateInput;
};

export type MutationUpdateFileAnalysisArgs = {
  analysisData: Scalars['JSON']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateFileInfoArgs = {
  _input: UpdateFileInfoInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateFileMetadataArgs = {
  fileId: Scalars['ID']['input'];
  metadata: Scalars['JSON']['input'];
};

export type MutationUpdateGrnRecordArgs = {
  _input: UpdateGrnRecordInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateGrnLevelArgs = {
  _input: UpdateGrnLevelInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateHistoryRecordArgs = {
  _input: UpdateHistoryRecordInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateMergingConfigArgs = {
  config: MergingConfig;
};

export type MutationUpdatePalletNumberBufferArgs = {
  _input: UpdatePalletNumberBufferInput;
  id: Scalars['Int']['input'];
};

export type MutationUpdateProductArgs = {
  _input: UpdateProductInput;
  code: Scalars['ID']['input'];
};

export type MutationUpdateReportTemplateArgs = {
  _input: UpdateReportTemplateInput;
  templateId: Scalars['ID']['input'];
};

export type MutationUpdateReportVoidArgs = {
  _input: UpdateReportVoidInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateSlateInfoArgs = {
  _input: UpdateSlateInfoInput;
  productCode: Scalars['String']['input'];
};

export type MutationUpdateStockLevelArgs = {
  _input: UpdateStockLevelInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateStockLevelQuantityArgs = {
  stockLevel: Scalars['Int']['input'];
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateStocktakeRecordArgs = {
  _input: UpdateStocktakeRecordInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUpdateSupplierArgs = {
  _input: UpdateSupplierInput;
  code: Scalars['String']['input'];
};

export type MutationUpdateThreatStatArgs = {
  _input: UpdateThreatStatInput;
  id: Scalars['Int']['input'];
};

export type MutationUpdateTransferStatusArgs = {
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status: TransferStatus;
};

export type MutationUpdateWarehouseOrderStatusArgs = {
  orderId: Scalars['ID']['input'];
  status: WarehouseOrderStatus;
};

export type MutationUpdateWorkLevelArgs = {
  _input: UpdateWorkLevelInput;
  uuid: Scalars['ID']['input'];
};

export type MutationUploadBatchFilesArgs = {
  input: BatchUploadInput;
};

export type MutationUploadSingleFileArgs = {
  input: SingleFileUploadInput;
};

export type MutationVerifyGrnRecordArgs = {
  uuid: Scalars['ID']['input'];
  verifiedBy: Scalars['String']['input'];
};

export type NotificationChannel = {
  __typename?: 'NotificationChannel';
  config: Scalars['JSON']['output'];
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  lastUsed?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  successRate: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export enum NotificationConfigKey {
  DesktopNotifications = 'DESKTOP_NOTIFICATIONS',
  EmailEnabled = 'EMAIL_ENABLED',
  EmailFrequency = 'EMAIL_FREQUENCY',
  MobileNotifications = 'MOBILE_NOTIFICATIONS',
  NotificationSound = 'NOTIFICATION_SOUND',
  PushEnabled = 'PUSH_ENABLED',
  QuietHours = 'QUIET_HOURS',
  SmsEnabled = 'SMS_ENABLED',
}

export type NumberFilter = {
  field: Scalars['String']['input'];
  max?: InputMaybe<Scalars['Float']['input']>;
  min?: InputMaybe<Scalars['Float']['input']>;
  operator: NumberOperator;
  value?: InputMaybe<Scalars['Float']['input']>;
};

export enum NumberOperator {
  Between = 'BETWEEN',
  Eq = 'EQ',
  Gt = 'GT',
  Gte = 'GTE',
  Lt = 'LT',
  Lte = 'LTE',
  Neq = 'NEQ',
}

export type OperationBreakdown = {
  __typename?: 'OperationBreakdown';
  count: Scalars['Int']['output'];
  operationType: WorkOperationType;
  percentage: Scalars['Float']['output'];
};

export type OperationResult = {
  __typename?: 'OperationResult';
  data?: Maybe<Scalars['JSON']['output']>;
  entityId: Scalars['ID']['output'];
  error?: Maybe<Error>;
  success: Scalars['Boolean']['output'];
};

export enum OperationType {
  Adjust = 'ADJUST',
  Create = 'CREATE',
  Delete = 'DELETE',
  Transfer = 'TRANSFER',
  Update = 'UPDATE',
  Void = 'VOID',
}

export type OperationsSummary = {
  __typename?: 'OperationsSummary';
  activeUsers: Scalars['Int']['output'];
  averageEfficiency: Scalars['Float']['output'];
  totalOrders: Scalars['Int']['output'];
  totalPallets: Scalars['Int']['output'];
  totalTransfers: Scalars['Int']['output'];
};

export type OperatorCount = {
  __typename?: 'OperatorCount';
  count: Scalars['Int']['output'];
  efficiency?: Maybe<Scalars['Float']['output']>;
  operatorId: Scalars['String']['output'];
  operatorName: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
};

export type OperatorEfficiency = {
  __typename?: 'OperatorEfficiency';
  operationsPerMinute: Scalars['Float']['output'];
  operatorId: Scalars['Int']['output'];
  operatorName: Scalars['String']['output'];
  totalOperations: Scalars['Int']['output'];
};

export type OperatorLoadingSummary = {
  __typename?: 'OperatorLoadingSummary';
  lastActivity: Scalars['DateTime']['output'];
  loadActions: Scalars['Int']['output'];
  operatorName: Scalars['String']['output'];
  totalActions: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
  unloadActions: Scalars['Int']['output'];
};

export type OperatorPerformance = {
  __typename?: 'OperatorPerformance';
  averageDuration: Scalars['Float']['output'];
  efficiency: Scalars['Float']['output'];
  operatorName: Scalars['String']['output'];
  rank: Scalars['Int']['output'];
  transfersPerHour: Scalars['Float']['output'];
};

export type OperatorSummary = {
  __typename?: 'OperatorSummary';
  avgEfficiency: Scalars['Float']['output'];
  operationCount: Scalars['Int']['output'];
  operatorId: Scalars['Int']['output'];
  operatorName: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
};

export type OperatorTrend = {
  __typename?: 'OperatorTrend';
  operatorId: Scalars['Int']['output'];
  operatorName: Scalars['String']['output'];
  totalGrowth: Scalars['Float']['output'];
  trend: Array<TrendPoint>;
};

export type Order = {
  __typename?: 'Order';
  accountNum: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  customerRef?: Maybe<Scalars['String']['output']>;
  deliveryAdd: Scalars['String']['output'];
  invoiceTo: Scalars['String']['output'];
  loadedQty: Scalars['String']['output'];
  orderRef: Scalars['String']['output'];
  product?: Maybe<Product>;
  productCode: Scalars['String']['output'];
  productDesc: Scalars['String']['output'];
  productQty: Scalars['Int']['output'];
  token: Scalars['Int']['output'];
  unitPrice: Scalars['String']['output'];
  uploadedBy: Scalars['String']['output'];
  uuid: Scalars['ID']['output'];
  weight?: Maybe<Scalars['Int']['output']>;
};

export type OrderAnalysisResult = {
  __typename?: 'OrderAnalysisResult';
  confidence?: Maybe<Scalars['Float']['output']>;
  errors?: Maybe<Array<Scalars['String']['output']>>;
  extractedData?: Maybe<Array<OrderData>>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  processingTime: Scalars['Int']['output'];
  recordCount: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
  warnings?: Maybe<Array<Scalars['String']['output']>>;
};

export type OrderCompletion = {
  __typename?: 'OrderCompletion';
  completionPercentage: Scalars['Int']['output'];
  docUrl?: Maybe<Scalars['String']['output']>;
  hasPdf: Scalars['Boolean']['output'];
  latestUpdate?: Maybe<Scalars['String']['output']>;
  loadedQty: Scalars['Int']['output'];
  orderRef: Scalars['String']['output'];
  productQty: Scalars['Int']['output'];
};

export type OrderConnection = {
  __typename?: 'OrderConnection';
  edges: Array<OrderEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type OrderData = {
  __typename?: 'OrderData';
  confidence?: Maybe<Scalars['Float']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  customerName?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Array<OrderItem>>;
  orderDate?: Maybe<Scalars['DateTime']['output']>;
  orderNumber: Scalars['String']['output'];
  totalAmount?: Maybe<Scalars['Float']['output']>;
};

export type OrderDetail = {
  __typename?: 'OrderDetail';
  actionTime: Scalars['String']['output'];
  description: Scalars['String']['output'];
  loadedBy: Scalars['String']['output'];
  palletNum: Scalars['String']['output'];
  productQty: Scalars['Int']['output'];
};

export type OrderDetails = {
  __typename?: 'OrderDetails';
  total_loaded_qty: Scalars['Int']['output'];
  total_ordered_qty: Scalars['Int']['output'];
  total_orders: Scalars['Int']['output'];
  total_outstanding_qty: Scalars['Int']['output'];
};

export type OrderEdge = {
  __typename?: 'OrderEdge';
  cursor: Scalars['String']['output'];
  node: Order;
};

export type OrderFilterInput = {
  customerCode?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  maxValue?: InputMaybe<Scalars['Float']['input']>;
  minValue?: InputMaybe<Scalars['Float']['input']>;
  orderNumber?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<OrderStatus>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  allocatedPallets?: Maybe<Array<Pallet>>;
  description?: Maybe<Scalars['String']['output']>;
  product: Product;
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  status: OrderItemStatus;
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
};

export enum OrderItemStatus {
  Allocated = 'ALLOCATED',
  Packed = 'PACKED',
  Pending = 'PENDING',
  Picking = 'PICKING',
  Shipped = 'SHIPPED',
}

export enum OrderLoadingActionType {
  Adjust = 'ADJUST',
  Load = 'LOAD',
  Transfer = 'TRANSFER',
  Unload = 'UNLOAD',
}

export type OrderLoadingFilterInput = {
  actionBy?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['String']['input'];
  orderRef?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
};

export type OrderLoadingHistory = {
  __typename?: 'OrderLoadingHistory';
  actionBy: Scalars['String']['output'];
  actionTime?: Maybe<Scalars['DateTime']['output']>;
  actionType: Scalars['String']['output'];
  operator?: Maybe<User>;
  orderRef: Scalars['String']['output'];
  pallet?: Maybe<Pallet>;
  palletNum: Scalars['String']['output'];
  product?: Maybe<Product>;
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  remark?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['ID']['output'];
};

export type OrderLoadingHistoryConnection = {
  __typename?: 'OrderLoadingHistoryConnection';
  edges: Array<OrderLoadingHistoryEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type OrderLoadingHistoryEdge = {
  __typename?: 'OrderLoadingHistoryEdge';
  cursor: Scalars['String']['output'];
  node: OrderLoadingHistory;
};

export type OrderLoadingHistoryFilterInput = {
  actionBy?: InputMaybe<Scalars['String']['input']>;
  actionType?: InputMaybe<OrderLoadingActionType>;
  dateRange?: InputMaybe<DateRangeInput>;
  orderRef?: InputMaybe<Scalars['String']['input']>;
  palletNum?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
};

export type OrderLoadingRecord = {
  __typename?: 'OrderLoadingRecord';
  action: Scalars['String']['output'];
  loadedQty: Scalars['Int']['output'];
  orderNumber: Scalars['String']['output'];
  productCode: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  userName: Scalars['String']['output'];
};

export type OrderLoadingResponse = {
  __typename?: 'OrderLoadingResponse';
  records: Array<OrderLoadingRecord>;
  summary?: Maybe<LoadingSummary>;
  total: Scalars['Int']['output'];
};

export type OrderLoadingSummary = {
  __typename?: 'OrderLoadingSummary';
  dailyActivity: Array<DailyLoadingActivity>;
  netQuantityChange: Scalars['Int']['output'];
  topOperators: Array<OperatorLoadingSummary>;
  totalQuantityLoaded: Scalars['Int']['output'];
  totalQuantityUnloaded: Scalars['Int']['output'];
  totalRecords: Scalars['Int']['output'];
  uniqueOrders: Scalars['Int']['output'];
  uniquePallets: Scalars['Int']['output'];
  uniqueProducts: Scalars['Int']['output'];
};

export type OrderMetrics = {
  __typename?: 'OrderMetrics';
  cancelledOrders: Scalars['Int']['output'];
  completedOrders: Scalars['Int']['output'];
  pendingOrders: Scalars['Int']['output'];
  totalOrders: Scalars['Int']['output'];
};

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Confirmed = 'CONFIRMED',
  Delivered = 'DELIVERED',
  Draft = 'DRAFT',
  Processing = 'PROCESSING',
  Shipped = 'SHIPPED',
}

export type PageInfo = {
  __typename?: 'PageInfo';
  currentPage: Scalars['Int']['output'];
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaginationInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export enum PaginationStyle {
  Cursor = 'CURSOR',
  Offset = 'OFFSET',
}

export type Pallet = {
  __typename?: 'Pallet';
  generateTime: Scalars['DateTime']['output'];
  history: Array<HistoryRecord>;
  pdfUrl?: Maybe<Scalars['String']['output']>;
  pltNum: Scalars['ID']['output'];
  pltRemark?: Maybe<Scalars['String']['output']>;
  product: Product;
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  series: Scalars['String']['output'];
  transfers: TransferConnection;
};

export type PalletHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

export type PalletTransfersArgs = {
  filter?: InputMaybe<TransferFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};

export type PalletBasicInfo = {
  __typename?: 'PalletBasicInfo';
  palletNumber: Scalars['String']['output'];
  product: ProductBasicInfo;
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
};

export type PalletConnection = {
  __typename?: 'PalletConnection';
  edges: Array<PalletEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PalletCurrentStatus = {
  __typename?: 'PalletCurrentStatus';
  daysInCurrentLocation: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  lastAction: StockAction;
  lastActionAt: Scalars['DateTime']['output'];
  lastOperator: Scalars['String']['output'];
  location?: Maybe<Scalars['String']['output']>;
};

export type PalletEdge = {
  __typename?: 'PalletEdge';
  cursor: Scalars['String']['output'];
  node: Pallet;
};

export type PalletFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  grnNumber?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PalletStatus>;
};

export type PalletHistoryAggregations = {
  __typename?: 'PalletHistoryAggregations';
  mostActiveLocation?: Maybe<Scalars['String']['output']>;
  mostActiveOperator?: Maybe<Scalars['String']['output']>;
  timeRange?: Maybe<DateRange>;
  totalActions: Scalars['Int']['output'];
  uniqueOperators: Scalars['Int']['output'];
  uniquePallets: Scalars['Int']['output'];
};

export type PalletHistoryResult = {
  __typename?: 'PalletHistoryResult';
  aggregations: PalletHistoryAggregations;
  locationDistribution: Array<LocationCount>;
  operatorDistribution: Array<OperatorCount>;
  pageInfo: PageInfo;
  productCode: Scalars['String']['output'];
  productInfo: ProductBasicInfo;
  records: Array<StockHistoryRecord>;
  timelineGroups: Array<TimelineGroup>;
  totalRecords: Scalars['Int']['output'];
};

export type PalletNumberBuffer = {
  __typename?: 'PalletNumberBuffer';
  createdAt: Scalars['DateTime']['output'];
  dateStr: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isExpired: Scalars['Boolean']['output'];
  isUsed: Scalars['Boolean']['output'];
  palletNumber: Scalars['String']['output'];
  series: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  used: Scalars['String']['output'];
};

export type PalletNumberBufferConnection = {
  __typename?: 'PalletNumberBufferConnection';
  edges: Array<PalletNumberBufferEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PalletNumberBufferEdge = {
  __typename?: 'PalletNumberBufferEdge';
  cursor: Scalars['String']['output'];
  node: PalletNumberBuffer;
};

export type PalletNumberBufferFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  dateStr?: InputMaybe<Scalars['String']['input']>;
  isExpired?: InputMaybe<Scalars['Boolean']['input']>;
  isUsed?: InputMaybe<Scalars['Boolean']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
};

export enum PalletStatus {
  Active = 'ACTIVE',
  Damaged = 'DAMAGED',
  Shipped = 'SHIPPED',
  Transferred = 'TRANSFERRED',
  Void = 'VOID',
}

export type PalletTimeline = {
  __typename?: 'PalletTimeline';
  averageLocationStay: Scalars['Float']['output'];
  created: Scalars['DateTime']['output'];
  firstMovement?: Maybe<Scalars['DateTime']['output']>;
  lastMovement?: Maybe<Scalars['DateTime']['output']>;
  totalDaysActive: Scalars['Int']['output'];
  totalMovements: Scalars['Int']['output'];
};

export type PalletVoidSummary = {
  __typename?: 'PalletVoidSummary';
  lastVoidDate: Scalars['DateTime']['output'];
  pltNum: Scalars['String']['output'];
  totalDamage: Scalars['Int']['output'];
  voidCount: Scalars['Int']['output'];
};

export enum PaymentStatus {
  Cancelled = 'CANCELLED',
  Paid = 'PAID',
  Partial = 'PARTIAL',
  Pending = 'PENDING',
  Refunded = 'REFUNDED',
}

export type PerformanceMetrics = {
  __typename?: 'PerformanceMetrics';
  averageResponseTime: Scalars['Float']['output'];
  cachedQueries: Scalars['Int']['output'];
  dataAge: Scalars['Int']['output'];
  totalQueries: Scalars['Int']['output'];
};

export enum PerformanceRating {
  Average = 'AVERAGE',
  Critical = 'CRITICAL',
  Excellent = 'EXCELLENT',
  Good = 'GOOD',
  Poor = 'POOR',
}

export type PeriodComparison = {
  __typename?: 'PeriodComparison';
  currentPeriodTotal: Scalars['Int']['output'];
  growthPercentage: Scalars['Float']['output'];
  previousPeriodTotal: Scalars['Int']['output'];
};

export type Product = {
  __typename?: 'Product';
  chinese_description?: Maybe<Scalars['String']['output']>;
  code: Scalars['ID']['output'];
  colour: Scalars['String']['output'];
  description: Scalars['String']['output'];
  inventory?: Maybe<InventorySummary>;
  pallets: PalletConnection;
  prod_type?: Maybe<Scalars['String']['output']>;
  product_code: Scalars['String']['output'];
  product_description?: Maybe<Scalars['String']['output']>;
  remark?: Maybe<Scalars['String']['output']>;
  standardQty?: Maybe<Scalars['Int']['output']>;
  statistics?: Maybe<ProductStatistics>;
  type: Scalars['String']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};

export type ProductPalletsArgs = {
  filter?: InputMaybe<PalletFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type ProductBasicInfo = {
  __typename?: 'ProductBasicInfo';
  chineseDescription?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  colour?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  standardQty?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type ProductColour = {
  __typename?: 'ProductColour';
  description?: Maybe<Scalars['String']['output']>;
  isDefault: Scalars['Boolean']['output'];
  isDisabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ProductConnection = {
  __typename?: 'ProductConnection';
  edges: Array<ProductEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ProductDefectMetric = {
  __typename?: 'ProductDefectMetric';
  defectCount: Scalars['Int']['output'];
  defectRate: Scalars['Float']['output'];
  product: Product;
  productCode: Scalars['String']['output'];
};

export type ProductEdge = {
  __typename?: 'ProductEdge';
  cursor: Scalars['String']['output'];
  node: Product;
};

export type ProductFilterInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hasInventory?: InputMaybe<Scalars['Boolean']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
  minQuantity?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type ProductFormOptions = {
  __typename?: 'ProductFormOptions';
  colours: Array<ProductColour>;
  materials: Array<Material>;
  products: Array<Product>;
  suppliers: Array<Supplier>;
  types: Array<ProductType>;
  units: Array<ProductUnit>;
};

export type ProductInfo = {
  __typename?: 'ProductInfo';
  code: Scalars['String']['output'];
  colour: Scalars['String']['output'];
  description: Scalars['String']['output'];
  standardQty?: Maybe<Scalars['Int']['output']>;
  type: Scalars['String']['output'];
};

export type ProductStatistics = {
  __typename?: 'ProductStatistics';
  averageStockLevel: Scalars['Float']['output'];
  lastMovementDate?: Maybe<Scalars['DateTime']['output']>;
  stockTurnoverRate?: Maybe<Scalars['Float']['output']>;
  totalLocations: Scalars['Int']['output'];
  totalPallets: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type ProductType = {
  __typename?: 'ProductType';
  description?: Maybe<Scalars['String']['output']>;
  isDefault: Scalars['Boolean']['output'];
  isDisabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ProductTypeCount = {
  __typename?: 'ProductTypeCount';
  count: Scalars['Int']['output'];
  totalStock: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

export type ProductUnit = {
  __typename?: 'ProductUnit';
  description?: Maybe<Scalars['String']['output']>;
  isDefault: Scalars['Boolean']['output'];
  isDisabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export enum QcStatus {
  Failed = 'FAILED',
  PartialPass = 'PARTIAL_PASS',
  Passed = 'PASSED',
  Pending = 'PENDING',
}

export type QualityMetrics = CardData & {
  __typename?: 'QualityMetrics';
  acceptedGRNs: Scalars['Int']['output'];
  dataSource: Scalars['String']['output'];
  defectRate: Scalars['Float']['output'];
  defectTrends: Array<TrendPoint>;
  defectsByProduct: Array<ProductDefectMetric>;
  defectsByType: Array<DefectTypeMetric>;
  failedInspections: Scalars['Int']['output'];
  firstPassYield: Scalars['Float']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  overallScore: Scalars['Float']['output'];
  partialGRNs: Scalars['Int']['output'];
  passedInspections: Scalars['Int']['output'];
  pendingInspections: Scalars['Int']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  rejectedGRNs: Scalars['Int']['output'];
  totalInspections: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  acoOrderReport: AcoOrderReportResponse;
  acoRecord?: Maybe<AcoRecord>;
  acoRecordSummary: AcoRecordSummary;
  acoRecords: AcoRecordConnection;
  acoRecordsByOrder: Array<AcoRecord>;
  acoRecordsByProduct: Array<AcoRecord>;
  activeApiConfigs: Array<ApiConfig>;
  alertCardData: AlertCardData;
  alertChannels: Array<NotificationChannel>;
  alertDetails?: Maybe<Alert>;
  alertHistory: Array<Alert>;
  alertRules: Array<AlertRule>;
  apiConfig?: Maybe<ApiConfig>;
  apiConfigs: ApiConfigConnection;
  apiConfigsByType: Array<ApiConfig>;
  availableCharts: Array<ChartConfig>;
  availablePalletNumbers: Array<PalletNumberBuffer>;
  availableStats: Array<StatsConfig>;
  batchCardData: Array<CardDataResponse>;
  blockedIpAddresses: Array<ThreatStat>;
  cacheEventsByTable: Array<CacheInvalidationEvent>;
  cacheInvalidationEvent?: Maybe<CacheInvalidationEvent>;
  cacheInvalidationEvents: CacheInvalidationEventConnection;
  cacheOptimizedQueries: Array<QueryPerformanceMetric>;
  cardData: Scalars['JSON']['output'];
  chartCardData: ChartCardData;
  chartData: ChartCardData;
  configCardData: ConfigCardData;
  configDefaults: Array<ConfigItem>;
  configHistory: Array<ConfigHistory>;
  configItem?: Maybe<ConfigItem>;
  configTemplates: Array<ConfigTemplate>;
  criticalStockItems: Array<StockLevel>;
  criticalThreatStats: Array<ThreatStat>;
  databaseMetricsByTable: Array<DatabasePerformanceMetric>;
  databaseMetricsByType: Array<DatabasePerformanceMetric>;
  databasePerformanceMetric?: Maybe<DatabasePerformanceMetric>;
  databasePerformanceMetrics: DatabasePerformanceMetricConnection;
  databasePerformanceTrends: Array<DatabasePerformanceMetric>;
  departmentInjectionData: DepartmentInjectionData;
  departmentPipeData: DepartmentPipeData;
  departmentPipeDataAdvanced: DepartmentPipeData;
  departmentWarehouseData: DepartmentWarehouseData;
  efficiencyMetrics: EfficiencyMetrics;
  estimateReportTime: Scalars['Int']['output'];
  expiredPalletNumbers: Array<PalletNumberBuffer>;
  expiredQueryRecords: Array<QueryRecord>;
  fileInfo?: Maybe<FileInfo>;
  fileInfos: FileInfoConnection;
  fileInfosByFolder: Array<FileInfo>;
  fileInfosByType: Array<FileInfo>;
  fileInfosByUploader: Array<FileInfo>;
  grnLevel?: Maybe<GrnLevel>;
  grnLevelSummary: GrnLevelSummary;
  grnLevels: GrnLevelConnection;
  grnLevelsByRef: Array<GrnLevel>;
  grnRecord?: Maybe<GrnRecord>;
  grnRecords: GrnRecordConnection;
  grnRecordsByPallet: Array<GrnRecord>;
  grnRecordsByProduct: Array<GrnRecord>;
  grnRecordsByRef: Array<GrnRecord>;
  grnRecordsBySupplier: Array<GrnRecord>;
  grnRecordsWithDiscrepancies: Array<GrnRecord>;
  health: SystemStatus;
  highRiskThreatStats: Array<ThreatStat>;
  historyRecord?: Maybe<HistoryRecord>;
  historyRecords: HistoryRecordConnection;
  historyRecordsByAction: Array<HistoryRecord>;
  historyRecordsByPallet: Array<HistoryRecord>;
  historyRecordsByUser: Array<HistoryRecord>;
  historyTree: HistoryTreeResult;
  inventories: Array<Inventory>;
  inventory?: Maybe<Inventory>;
  inventoryOrderedAnalysis: InventoryOrderedAnalysisResult;
  lowStockItems: Array<StockLevel>;
  machineStatusRealTime: Array<MachineState>;
  mergedRecord?: Maybe<MergedRecordHistory>;
  operatorActivity: Array<OperatorSummary>;
  order?: Maybe<Order>;
  orderAnalysisResult?: Maybe<OrderAnalysisResult>;
  orderLoadingHistories: OrderLoadingHistoryConnection;
  orderLoadingHistory?: Maybe<OrderLoadingHistory>;
  orderLoadingHistoryByOperator: Array<OrderLoadingHistory>;
  orderLoadingHistoryByOrder: Array<OrderLoadingHistory>;
  orderLoadingHistoryByPallet: Array<OrderLoadingHistory>;
  orderLoadingRecords: OrderLoadingResponse;
  orderLoadingSummary: OrderLoadingSummary;
  orders: OrderConnection;
  pallet?: Maybe<Pallet>;
  palletHistoryByNumber: SinglePalletHistoryResult;
  palletHistoryByProduct: PalletHistoryResult;
  palletNumberBuffer?: Maybe<PalletNumberBuffer>;
  palletNumberBuffers: PalletNumberBufferConnection;
  palletNumberBuffersBySeries: Array<PalletNumberBuffer>;
  pallets: PalletConnection;
  product?: Maybe<Product>;
  productFormOptions: ProductFormOptions;
  productStatistics: ProductStatistics;
  products: ProductConnection;
  qualityMetrics: QualityMetrics;
  queryPerformanceAnalysis: QueryPerformanceAnalysis;
  queryPerformanceByFunction: Array<QueryPerformanceMetric>;
  queryPerformanceBySession: Array<QueryPerformanceMetric>;
  queryPerformanceByUser: Array<QueryPerformanceMetric>;
  queryPerformanceMetric?: Maybe<QueryPerformanceMetric>;
  queryPerformanceMetrics: QueryPerformanceMetricConnection;
  queryPerformanceTrends: QueryPerformanceAnalysis;
  queryPerformanceWithErrors: Array<QueryPerformanceMetric>;
  queryRecord?: Maybe<QueryRecord>;
  queryRecords: QueryRecordConnection;
  queryRecordsBySession: Array<QueryRecord>;
  queryRecordsByUser: Array<QueryRecord>;
  queryRecordsWithResults: Array<QueryRecord>;
  rawRecordHistory: Array<RecordHistoryEntry>;
  realTimeStockLevels: StockItemConnection;
  recentCacheEvents: Array<CacheInvalidationEvent>;
  recentHistoryRecords: Array<HistoryRecord>;
  recentThreatStats: Array<ThreatStat>;
  recentUploads: Array<FileInfo>;
  recordHistory: RecordHistoryResult;
  recordHistorySearchSuggestions: Array<Scalars['String']['output']>;
  recordHistoryTrends: RecordHistoryTrends;
  reportCardData: ReportCardData;
  reportConfig: ReportConfig;
  reportDetails?: Maybe<GeneratedReport>;
  reportProgress: Array<ReportGenerationProgress>;
  reportTemplates: Array<ReportTemplate>;
  reportVoid?: Maybe<ReportVoid>;
  reportVoidSummary: ReportVoidSummary;
  reportVoids: ReportVoidConnection;
  reportVoidsByDateRange: Array<ReportVoid>;
  reportVoidsByPallet: Array<ReportVoid>;
  reportVoidsByReason: Array<ReportVoid>;
  searchFiles: FileSearchResult;
  searchProducts: Array<Product>;
  searchReports: ReportSearchResult;
  searchSlateInfos: Array<SlateInfo>;
  searchSuppliers: Array<Supplier>;
  slateInfo?: Maybe<SlateInfo>;
  slateInfoStatistics: SlateInfoStatistics;
  slateInfos: SlateInfoConnection;
  slowDatabaseQueries: Array<DatabasePerformanceMetric>;
  slowQueryPerformances: Array<QueryPerformanceMetric>;
  slowQueryRecords: Array<QueryRecord>;
  statData: StatsData;
  statsCardData: StatsCardData;
  stockDistribution: StockDistributionResult;
  stockHistoryStats: StockHistoryStats;
  stockLevelAnalysis: StockLevelAnalysis;
  stockLevelByCode?: Maybe<StockLevel>;
  stockLevelChart: StockLevelChartResult;
  stockLevelData?: Maybe<StockLevel>;
  stockLevelDatas: StockLevelConnection;
  stockLevelList: StockLevelListResult;
  stockLevelStats: StockLevelStats;
  stockLevels: StockLevelData;
  stocktakeRecord?: Maybe<StocktakeRecord>;
  stocktakeRecords: StocktakeRecordConnection;
  stocktakeRecordsByPallet: Array<StocktakeRecord>;
  stocktakeRecordsByProduct: Array<StocktakeRecord>;
  stocktakeVarianceReport: Array<StocktakeRecord>;
  stocktakeVarianceSummary: StocktakeVarianceSummary;
  supplier?: Maybe<Supplier>;
  supplierPerformance: SupplierPerformance;
  suppliers: SupplierConnection;
  systemApiConfigs: Array<ApiConfig>;
  systemPerformance: SystemPerformance;
  tableCardData: TableCardData;
  tableColumns: Array<TableColumn>;
  tablePermissions: TablePermissions;
  threatAnalysis: ThreatAnalysis;
  threatStat?: Maybe<ThreatStat>;
  threatStats: ThreatStatConnection;
  threatStatsByIpAddress: Array<ThreatStat>;
  threatStatsBySeverity: Array<ThreatStat>;
  threatStatsByType: Array<ThreatStat>;
  topPerformers: Array<WorkLevel>;
  topProductsByQuantity: TopProductsResult;
  transfer?: Maybe<Transfer>;
  transfers: TransferConnection;
  unifiedOperations: UnifiedOperationsData;
  unprocessedCacheEvents: Array<CacheInvalidationEvent>;
  updateStatistics: UpdateStatistics;
  uploadCardData: UploadCardData;
  uploadConfig: UploadConfig;
  uploadProgress: Array<UploadProgress>;
  uploadStatistics: UploadStatistics;
  usedPalletNumbers: Array<PalletNumberBuffer>;
  validateConfig: ConfigValidation;
  warehouseOrder?: Maybe<WarehouseOrder>;
  warehouseOrders: WarehouseOrdersResponse;
  workLevel?: Maybe<WorkLevel>;
  workLevelEnhanced?: Maybe<WorkLevel>;
  workLevels: Array<WorkLevel>;
  workLevelsByUser: Array<WorkLevel>;
  workLevelsEnhanced: WorkLevelConnection;
  workLevelsSummary: WorkLevelSummary;
};

export type QueryAcoOrderReportArgs = {
  reference: Scalars['String']['input'];
};

export type QueryAcoRecordArgs = {
  code?: InputMaybe<Scalars['String']['input']>;
  orderRef?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryAcoRecordSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryAcoRecordsArgs = {
  filter?: InputMaybe<AcoRecordFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryAcoRecordsByOrderArgs = {
  orderRef: Scalars['Int']['input'];
};

export type QueryAcoRecordsByProductArgs = {
  code: Scalars['String']['input'];
};

export type QueryAlertCardDataArgs = {
  input: AlertCardInput;
};

export type QueryAlertDetailsArgs = {
  alertId: Scalars['ID']['input'];
};

export type QueryAlertHistoryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  entityId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryApiConfigArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryApiConfigsArgs = {
  filter?: InputMaybe<ApiConfigFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryApiConfigsByTypeArgs = {
  configType: ApiConfigType;
};

export type QueryAvailableChartsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAvailablePalletNumbersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  series?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAvailableStatsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  includeDisabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryBatchCardDataArgs = {
  requests: Array<CardDataRequest>;
};

export type QueryCacheEventsByTableArgs = {
  tableName: Scalars['String']['input'];
};

export type QueryCacheInvalidationEventArgs = {
  id: Scalars['ID']['input'];
};

export type QueryCacheInvalidationEventsArgs = {
  filter?: InputMaybe<CacheInvalidationEventFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryCardDataArgs = {
  _params?: InputMaybe<Scalars['JSON']['input']>;
  dataSource: Scalars['String']['input'];
  timeFrame?: InputMaybe<DateRangeInput>;
};

export type QueryChartCardDataArgs = {
  input: ChartQueryInput;
};

export type QueryChartDataArgs = {
  input: SingleChartQueryInput;
};

export type QueryConfigCardDataArgs = {
  input: ConfigCardInput;
};

export type QueryConfigDefaultsArgs = {
  category?: InputMaybe<ConfigCategory>;
};

export type QueryConfigHistoryArgs = {
  configId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryConfigItemArgs = {
  key: Scalars['String']['input'];
  scope: ConfigScope;
  scopeId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryConfigTemplatesArgs = {
  category?: InputMaybe<ConfigCategory>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  scope?: InputMaybe<ConfigScope>;
};

export type QueryDatabaseMetricsByTableArgs = {
  tableName: Scalars['String']['input'];
};

export type QueryDatabaseMetricsByTypeArgs = {
  queryType: Scalars['String']['input'];
};

export type QueryDatabasePerformanceMetricArgs = {
  id: Scalars['ID']['input'];
};

export type QueryDatabasePerformanceMetricsArgs = {
  filter?: InputMaybe<DatabasePerformanceMetricFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryDatabasePerformanceTrendsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  metricName: Scalars['String']['input'];
};

export type QueryDepartmentPipeDataAdvancedArgs = {
  materialFilter?: InputMaybe<StockFilterInput>;
  materialPagination?: InputMaybe<PaginationInput>;
  materialSort?: InputMaybe<StockSortInput>;
  stockFilter?: InputMaybe<StockFilterInput>;
  stockPagination?: InputMaybe<PaginationInput>;
  stockSort?: InputMaybe<StockSortInput>;
};

export type QueryEfficiencyMetricsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  departments?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type QueryEstimateReportTimeArgs = {
  input: ReportGenerationInput;
};

export type QueryExpiredPalletNumbersArgs = {
  dateStr?: InputMaybe<Scalars['String']['input']>;
};

export type QueryFileInfoArgs = {
  id: Scalars['ID']['input'];
  uuid: Scalars['ID']['input'];
};

export type QueryFileInfosArgs = {
  filter?: InputMaybe<FileInfoFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryFileInfosByFolderArgs = {
  folder: Scalars['String']['input'];
};

export type QueryFileInfosByTypeArgs = {
  docType: Scalars['String']['input'];
};

export type QueryFileInfosByUploaderArgs = {
  uploadBy: Scalars['Int']['input'];
};

export type QueryGrnLevelArgs = {
  grnRef?: InputMaybe<Scalars['Int']['input']>;
  uuid?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryGrnLevelSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryGrnLevelsArgs = {
  filter?: InputMaybe<GrnLevelFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryGrnLevelsByRefArgs = {
  grnRef: Scalars['Int']['input'];
};

export type QueryGrnRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryGrnRecordsArgs = {
  filter?: InputMaybe<GrnRecordFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryGrnRecordsByPalletArgs = {
  pltNum: Scalars['String']['input'];
};

export type QueryGrnRecordsByProductArgs = {
  materialCode: Scalars['String']['input'];
};

export type QueryGrnRecordsByRefArgs = {
  grnRef: Scalars['Int']['input'];
};

export type QueryGrnRecordsBySupplierArgs = {
  supCode: Scalars['String']['input'];
};

export type QueryHistoryRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryHistoryRecordsArgs = {
  filter?: InputMaybe<HistoryRecordFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryHistoryRecordsByActionArgs = {
  action: Scalars['String']['input'];
};

export type QueryHistoryRecordsByPalletArgs = {
  pltNum: Scalars['String']['input'];
};

export type QueryHistoryRecordsByUserArgs = {
  userId: Scalars['Int']['input'];
};

export type QueryHistoryTreeArgs = {
  input?: InputMaybe<HistoryTreeInput>;
};

export type QueryInventoriesArgs = {
  filter?: InputMaybe<InventoryFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};

export type QueryInventoryArgs = {
  productCode: Scalars['ID']['input'];
};

export type QueryInventoryOrderedAnalysisArgs = {
  input?: InputMaybe<InventoryOrderedAnalysisInput>;
};

export type QueryLowStockItemsArgs = {
  threshold?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMachineStatusRealTimeArgs = {
  departmentType: Scalars['String']['input'];
};

export type QueryMergedRecordArgs = {
  id: Scalars['ID']['input'];
};

export type QueryOperatorActivityArgs = {
  dateRange: DateRangeInput;
  operatorIds?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type QueryOrderArgs = {
  orderNumber: Scalars['String']['input'];
};

export type QueryOrderAnalysisResultArgs = {
  uploadId: Scalars['ID']['input'];
};

export type QueryOrderLoadingHistoriesArgs = {
  filter?: InputMaybe<OrderLoadingHistoryFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryOrderLoadingHistoryArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryOrderLoadingHistoryByOperatorArgs = {
  actionBy: Scalars['String']['input'];
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryOrderLoadingHistoryByOrderArgs = {
  orderRef: Scalars['String']['input'];
};

export type QueryOrderLoadingHistoryByPalletArgs = {
  palletNum: Scalars['String']['input'];
};

export type QueryOrderLoadingRecordsArgs = {
  input: OrderLoadingFilterInput;
};

export type QueryOrderLoadingSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryOrdersArgs = {
  filter?: InputMaybe<OrderFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryPalletArgs = {
  pltNum: Scalars['ID']['input'];
};

export type QueryPalletHistoryByNumberArgs = {
  includeJourney?: InputMaybe<Scalars['Boolean']['input']>;
  includeSeries?: InputMaybe<Scalars['Boolean']['input']>;
  palletNumber: Scalars['String']['input'];
};

export type QueryPalletHistoryByProductArgs = {
  filter?: InputMaybe<StockHistoryFilter>;
  pagination?: InputMaybe<StockHistoryPagination>;
  productCode: Scalars['String']['input'];
  sort?: InputMaybe<StockHistorySort>;
};

export type QueryPalletNumberBufferArgs = {
  id: Scalars['Int']['input'];
};

export type QueryPalletNumberBuffersArgs = {
  filter?: InputMaybe<PalletNumberBufferFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryPalletNumberBuffersBySeriesArgs = {
  series: Scalars['String']['input'];
};

export type QueryPalletsArgs = {
  filter?: InputMaybe<PalletFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryProductArgs = {
  code: Scalars['ID']['input'];
};

export type QueryProductStatisticsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  productCode: Scalars['ID']['input'];
};

export type QueryProductsArgs = {
  filter?: InputMaybe<ProductFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryQualityMetricsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type QueryQueryPerformanceAnalysisArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryQueryPerformanceByFunctionArgs = {
  functionName: Scalars['String']['input'];
};

export type QueryQueryPerformanceBySessionArgs = {
  sessionId: Scalars['String']['input'];
};

export type QueryQueryPerformanceByUserArgs = {
  userId: Scalars['Int']['input'];
};

export type QueryQueryPerformanceMetricArgs = {
  id: Scalars['ID']['input'];
};

export type QueryQueryPerformanceMetricsArgs = {
  filter?: InputMaybe<QueryPerformanceMetricFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryQueryPerformanceTrendsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  functionName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryQueryRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryQueryRecordsArgs = {
  filter?: InputMaybe<QueryRecordFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryQueryRecordsBySessionArgs = {
  sessionId: Scalars['String']['input'];
};

export type QueryQueryRecordsByUserArgs = {
  user: Scalars['String']['input'];
};

export type QueryRawRecordHistoryArgs = {
  filters?: InputMaybe<RecordHistoryFilters>;
  pagination?: InputMaybe<RecordHistoryPagination>;
  sorting?: InputMaybe<RecordHistorySort>;
};

export type QueryRealTimeStockLevelsArgs = {
  filter?: InputMaybe<StockFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<StockSortInput>;
};

export type QueryRecentCacheEventsArgs = {
  hours?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRecentHistoryRecordsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRecentThreatStatsArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRecentUploadsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRecordHistoryArgs = {
  filters?: InputMaybe<RecordHistoryFilters>;
  mergingConfig?: InputMaybe<MergingConfig>;
  pagination?: InputMaybe<RecordHistoryPagination>;
  sorting?: InputMaybe<RecordHistorySort>;
};

export type QueryRecordHistorySearchSuggestionsArgs = {
  field: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QueryRecordHistoryTrendsArgs = {
  filters?: InputMaybe<RecordHistoryFilters>;
  timeGranularity?: InputMaybe<TimeGranularity>;
};

export type QueryReportCardDataArgs = {
  input: ReportCardInput;
};

export type QueryReportConfigArgs = {
  reportType: ReportType;
};

export type QueryReportDetailsArgs = {
  reportId: Scalars['ID']['input'];
};

export type QueryReportProgressArgs = {
  generationIds: Array<Scalars['ID']['input']>;
};

export type QueryReportTemplatesArgs = {
  reportType?: InputMaybe<ReportType>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type QueryReportVoidArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryReportVoidSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryReportVoidsArgs = {
  filter?: InputMaybe<ReportVoidFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryReportVoidsByDateRangeArgs = {
  dateRange: DateRangeInput;
};

export type QueryReportVoidsByPalletArgs = {
  pltNum: Scalars['String']['input'];
};

export type QueryReportVoidsByReasonArgs = {
  reason: Scalars['String']['input'];
};

export type QuerySearchFilesArgs = {
  input: FileSearchInput;
};

export type QuerySearchProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QuerySearchReportsArgs = {
  input: ReportSearchInput;
};

export type QuerySearchSlateInfosArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QuerySearchSuppliersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QuerySlateInfoArgs = {
  productCode?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['ID']['input']>;
};

export type QuerySlateInfosArgs = {
  filter?: InputMaybe<SlateInfoFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QuerySlowDatabaseQueriesArgs = {
  minExecutionTime?: InputMaybe<Scalars['Float']['input']>;
};

export type QuerySlowQueryPerformancesArgs = {
  minExecutionTime?: InputMaybe<Scalars['Float']['input']>;
};

export type QuerySlowQueryRecordsArgs = {
  minExecutionTime?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryStatDataArgs = {
  input: SingleStatQueryInput;
};

export type QueryStatsCardDataArgs = {
  input: StatsQueryInput;
};

export type QueryStockDistributionArgs = {
  input?: InputMaybe<StockDistributionInput>;
};

export type QueryStockHistoryStatsArgs = {
  filter?: InputMaybe<StockHistoryFilter>;
  includeTrends?: InputMaybe<Scalars['Boolean']['input']>;
  trendsInterval?: InputMaybe<Scalars['String']['input']>;
};

export type QueryStockLevelAnalysisArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryStockLevelByCodeArgs = {
  stock: Scalars['String']['input'];
};

export type QueryStockLevelChartArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  productType?: InputMaybe<Scalars['String']['input']>;
};

export type QueryStockLevelDataArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryStockLevelDatasArgs = {
  filter?: InputMaybe<StockLevelFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryStockLevelListArgs = {
  productType?: InputMaybe<Scalars['String']['input']>;
};

export type QueryStockLevelStatsArgs = {
  filter?: InputMaybe<StockLevelFilter>;
};

export type QueryStockLevelsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  warehouse?: InputMaybe<Scalars['String']['input']>;
};

export type QueryStocktakeRecordArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryStocktakeRecordsArgs = {
  filter?: InputMaybe<StocktakeRecordFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryStocktakeRecordsByPalletArgs = {
  pltNum: Scalars['String']['input'];
};

export type QueryStocktakeRecordsByProductArgs = {
  productCode: Scalars['String']['input'];
};

export type QueryStocktakeVarianceReportArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  minVariancePercentage?: InputMaybe<Scalars['Float']['input']>;
};

export type QueryStocktakeVarianceSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  minVariancePercentage?: InputMaybe<Scalars['Float']['input']>;
};

export type QuerySupplierArgs = {
  code: Scalars['String']['input'];
};

export type QuerySupplierPerformanceArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  supplierCode: Scalars['String']['input'];
};

export type QuerySuppliersArgs = {
  filter?: InputMaybe<SupplierFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QuerySystemPerformanceArgs = {
  timeWindow?: InputMaybe<TimeWindow>;
};

export type QueryTableCardDataArgs = {
  input: TableDataInput;
};

export type QueryTableColumnsArgs = {
  dataSource: Scalars['String']['input'];
};

export type QueryTablePermissionsArgs = {
  dataSource: Scalars['String']['input'];
};

export type QueryThreatAnalysisArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryThreatStatArgs = {
  id: Scalars['Int']['input'];
};

export type QueryThreatStatsArgs = {
  filter?: InputMaybe<ThreatStatFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryThreatStatsByIpAddressArgs = {
  ipAddress: Scalars['String']['input'];
};

export type QueryThreatStatsBySeverityArgs = {
  severity: Scalars['String']['input'];
};

export type QueryThreatStatsByTypeArgs = {
  eventType: Scalars['String']['input'];
};

export type QueryTopPerformersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  operationType?: InputMaybe<WorkOperationType>;
};

export type QueryTopProductsByQuantityArgs = {
  input?: InputMaybe<TopProductsInput>;
};

export type QueryTransferArgs = {
  id: Scalars['ID']['input'];
};

export type QueryTransfersArgs = {
  filter?: InputMaybe<TransferFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryUnifiedOperationsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  warehouse?: InputMaybe<Scalars['String']['input']>;
};

export type QueryUpdateStatisticsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryUploadCardDataArgs = {
  input: UploadCardInput;
};

export type QueryUploadConfigArgs = {
  uploadType: UploadType;
};

export type QueryUploadProgressArgs = {
  uploadIds: Array<Scalars['ID']['input']>;
};

export type QueryUploadStatisticsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryUsedPalletNumbersArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryValidateConfigArgs = {
  input: ConfigItemInput;
};

export type QueryWarehouseOrderArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  orderRef?: InputMaybe<Scalars['String']['input']>;
};

export type QueryWarehouseOrdersArgs = {
  input?: InputMaybe<WarehouseOrderFilterInput>;
};

export type QueryWorkLevelArgs = {
  date: Scalars['DateTime']['input'];
  userId: Scalars['ID']['input'];
};

export type QueryWorkLevelEnhancedArgs = {
  uuid: Scalars['ID']['input'];
};

export type QueryWorkLevelsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  userIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type QueryWorkLevelsByUserArgs = {
  userId: Scalars['Int']['input'];
};

export type QueryWorkLevelsEnhancedArgs = {
  filter?: InputMaybe<WorkLevelFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryWorkLevelsSummaryArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};

export type QueryPerformanceAnalysis = {
  __typename?: 'QueryPerformanceAnalysis';
  averageExecutionTime: Scalars['Float']['output'];
  cacheHitRate: Scalars['Float']['output'];
  errorRate: Scalars['Float']['output'];
  performanceByComplexity: Array<ComplexityPerformance>;
  slowQueryCount: Scalars['Int']['output'];
  topSlowFunctions: Array<SlowFunctionSummary>;
  totalQueries: Scalars['Int']['output'];
};

export type QueryPerformanceMetric = {
  __typename?: 'QueryPerformanceMetric';
  cacheHit?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  errorOccurred?: Maybe<Scalars['Boolean']['output']>;
  executionTimeMs: Scalars['Float']['output'];
  functionName: Scalars['String']['output'];
  hasError: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isCacheOptimized: Scalars['Boolean']['output'];
  memoryUsageMb?: Maybe<Scalars['Float']['output']>;
  parameters?: Maybe<Scalars['JSON']['output']>;
  performanceScore: Scalars['Float']['output'];
  queryComplexity?: Maybe<Scalars['String']['output']>;
  resultCount?: Maybe<Scalars['Int']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['Int']['output']>;
};

export type QueryPerformanceMetricConnection = {
  __typename?: 'QueryPerformanceMetricConnection';
  edges: Array<QueryPerformanceMetricEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryPerformanceMetricEdge = {
  __typename?: 'QueryPerformanceMetricEdge';
  cursor: Scalars['String']['output'];
  node: QueryPerformanceMetric;
};

export type QueryPerformanceMetricFilterInput = {
  cacheHit?: InputMaybe<Scalars['Boolean']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  functionName?: InputMaybe<Scalars['String']['input']>;
  hasError?: InputMaybe<Scalars['Boolean']['input']>;
  maxExecutionTime?: InputMaybe<Scalars['Float']['input']>;
  maxMemoryUsage?: InputMaybe<Scalars['Float']['input']>;
  minExecutionTime?: InputMaybe<Scalars['Float']['input']>;
  minMemoryUsage?: InputMaybe<Scalars['Float']['input']>;
  queryComplexity?: InputMaybe<Scalars['String']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRecord = {
  __typename?: 'QueryRecord';
  answer: Scalars['String']['output'];
  complexity?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  executionTime?: Maybe<Scalars['Int']['output']>;
  expiredAt?: Maybe<Scalars['DateTime']['output']>;
  expiredReason?: Maybe<Scalars['String']['output']>;
  fuzzyHash?: Maybe<Scalars['String']['output']>;
  hasResults: Scalars['Boolean']['output'];
  isExpired: Scalars['Boolean']['output'];
  query: Scalars['String']['output'];
  queryHash?: Maybe<Scalars['String']['output']>;
  queryType: QueryType;
  resultJson?: Maybe<Scalars['JSON']['output']>;
  rowCount?: Maybe<Scalars['Int']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  sqlQuery: Scalars['String']['output'];
  token: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: Scalars['String']['output'];
  uuid: Scalars['ID']['output'];
};

export type QueryRecordConnection = {
  __typename?: 'QueryRecordConnection';
  edges: Array<QueryRecordEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryRecordEdge = {
  __typename?: 'QueryRecordEdge';
  cursor: Scalars['String']['output'];
  node: QueryRecord;
};

export type QueryRecordFilterInput = {
  complexity?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  hasResults?: InputMaybe<Scalars['Boolean']['input']>;
  isExpired?: InputMaybe<Scalars['Boolean']['input']>;
  maxExecutionTime?: InputMaybe<Scalars['Int']['input']>;
  minExecutionTime?: InputMaybe<Scalars['Int']['input']>;
  queryType?: InputMaybe<QueryType>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
};

export enum QueryType {
  Analysis = 'ANALYSIS',
  Delete = 'DELETE',
  Insert = 'INSERT',
  Report = 'REPORT',
  Select = 'SELECT',
  System = 'SYSTEM',
  Update = 'UPDATE',
}

export type ReasonSummary = {
  __typename?: 'ReasonSummary';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  reason: Scalars['String']['output'];
  totalDamage: Scalars['Int']['output'];
};

export type RecentActivity = {
  __typename?: 'RecentActivity';
  action: Scalars['String']['output'];
  detail: Scalars['String']['output'];
  staff: Scalars['String']['output'];
  time: Scalars['String']['output'];
};

export type RecordHistoryEntry = {
  __typename?: 'RecordHistoryEntry';
  action: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  operatorDepartment?: Maybe<Scalars['String']['output']>;
  operatorEmail?: Maybe<Scalars['String']['output']>;
  operatorId?: Maybe<Scalars['Int']['output']>;
  operatorName?: Maybe<Scalars['String']['output']>;
  operatorPosition?: Maybe<Scalars['String']['output']>;
  pltNum?: Maybe<Scalars['String']['output']>;
  remark: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  uuid: Scalars['String']['output'];
};

export type RecordHistoryError = {
  __typename?: 'RecordHistoryError';
  code: RecordHistoryErrorCode;
  details?: Maybe<Scalars['JSON']['output']>;
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export enum RecordHistoryErrorCode {
  DatabaseError = 'DATABASE_ERROR',
  ExportFailed = 'EXPORT_FAILED',
  InvalidOperator = 'INVALID_OPERATOR',
  InvalidTimerange = 'INVALID_TIMERANGE',
  MergeConfigInvalid = 'MERGE_CONFIG_INVALID',
  PermissionDenied = 'PERMISSION_DENIED',
  RateLimitExceeded = 'RATE_LIMIT_EXCEEDED',
}

export type RecordHistoryExportInput = {
  filters?: InputMaybe<RecordHistoryFilters>;
  format: ExportFormat;
  includeRawData?: InputMaybe<Scalars['Boolean']['input']>;
  includeSummaryStats?: InputMaybe<Scalars['Boolean']['input']>;
  mergingConfig?: InputMaybe<MergingConfig>;
};

export type RecordHistoryExportResult = {
  __typename?: 'RecordHistoryExportResult';
  downloadUrl: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
  fileName: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  recordCount: Scalars['Int']['output'];
};

export type RecordHistoryFilters = {
  action?: InputMaybe<Scalars['String']['input']>;
  actions?: InputMaybe<Array<Scalars['String']['input']>>;
  dateRange?: InputMaybe<DateRangeInput>;
  departments?: InputMaybe<Array<Scalars['String']['input']>>;
  hasMultipleOperations?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  locations?: InputMaybe<Array<Scalars['String']['input']>>;
  maxDuration?: InputMaybe<Scalars['Int']['input']>;
  minDuration?: InputMaybe<Scalars['Int']['input']>;
  operatorEmail?: InputMaybe<Scalars['String']['input']>;
  operatorId?: InputMaybe<Scalars['Int']['input']>;
  operatorName?: InputMaybe<Scalars['String']['input']>;
  palletNumbers?: InputMaybe<Array<Scalars['String']['input']>>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  positions?: InputMaybe<Array<Scalars['String']['input']>>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type RecordHistoryPagination = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type RecordHistoryResult = {
  __typename?: 'RecordHistoryResult';
  appliedFilters?: Maybe<AppliedFilters>;
  cacheHit: Scalars['Boolean']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  mergedRecords: Array<MergedRecordHistory>;
  mergingConfig?: Maybe<AppliedMergingConfig>;
  nextCursor?: Maybe<Scalars['String']['output']>;
  pagination?: Maybe<AppliedPagination>;
  previousCursor?: Maybe<Scalars['String']['output']>;
  queryTime: Scalars['Float']['output'];
  sorting?: Maybe<AppliedSort>;
  summary: RecordHistorySummary;
  totalCount: Scalars['Int']['output'];
};

export type RecordHistorySort = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<RecordHistorySortField>;
};

export enum RecordHistorySortField {
  Action = 'ACTION',
  Count = 'COUNT',
  Duration = 'DURATION',
  Efficiency = 'EFFICIENCY',
  OperatorName = 'OPERATOR_NAME',
  PalletCount = 'PALLET_COUNT',
  TimeEnd = 'TIME_END',
  TimeStart = 'TIME_START',
}

export type RecordHistorySummary = {
  __typename?: 'RecordHistorySummary';
  efficiencyMetrics: EfficiencyMetrics;
  mergingStats: MergingStats;
  timeSpan: TimeSpan;
  topActions: Array<ActionSummary>;
  topOperators: Array<OperatorSummary>;
  totalMergedRecords: Scalars['Int']['output'];
  totalOperations: Scalars['Int']['output'];
  uniqueActions: Scalars['Int']['output'];
  uniqueLocations: Scalars['Int']['output'];
  uniqueOperators: Scalars['Int']['output'];
  uniquePallets: Scalars['Int']['output'];
};

export type RecordHistoryTrends = {
  __typename?: 'RecordHistoryTrends';
  actionTrends: Array<ActionTrend>;
  dailyDistribution: Array<DailyTrend>;
  efficiencyTrends: Array<EfficiencyTrend>;
  hourlyDistribution: Array<HourlyTrend>;
  operatorTrends: Array<OperatorTrend>;
};

export type RecordHistoryUpdate = {
  __typename?: 'RecordHistoryUpdate';
  affectedMergedRecord?: Maybe<MergedRecordHistory>;
  operatorId: Scalars['Int']['output'];
  record: RecordHistoryEntry;
  timestamp: Scalars['DateTime']['output'];
  type: RecordHistoryUpdateType;
};

export enum RecordHistoryUpdateType {
  MergedUpdate = 'MERGED_UPDATE',
  NewRecord = 'NEW_RECORD',
  OperatorActivity = 'OPERATOR_ACTIVITY',
}

export type ReportAggregation = {
  alias?: InputMaybe<Scalars['String']['input']>;
  field: Scalars['String']['input'];
  function: AggregationFunction;
};

export type ReportCardData = CardData & {
  __typename?: 'ReportCardData';
  activeGenerations: Array<ReportGenerationProgress>;
  config: ReportConfig;
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  recentReports: Array<GeneratedReport>;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  reportType: ReportType;
  statistics: ReportStatistics;
  templates: Array<ReportTemplate>;
};

export type ReportCardInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  includeActiveGenerations?: InputMaybe<Scalars['Boolean']['input']>;
  includeRecentReports?: InputMaybe<Scalars['Boolean']['input']>;
  includeStatistics?: InputMaybe<Scalars['Boolean']['input']>;
  includeTemplates?: InputMaybe<Scalars['Boolean']['input']>;
  recentLimit?: InputMaybe<Scalars['Int']['input']>;
  reportType?: InputMaybe<ReportType>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type ReportConfig = {
  __typename?: 'ReportConfig';
  allowScheduling: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  estimatedGenerationTime?: Maybe<Scalars['Int']['output']>;
  formats: Array<ReportFormat>;
  maxFileSize: Scalars['Int']['output'];
  reportType: ReportType;
  requireAuth: Scalars['Boolean']['output'];
  retentionDays: Scalars['Int']['output'];
  supportsFiltering: Scalars['Boolean']['output'];
  supportsGrouping: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
};

export type ReportError = {
  __typename?: 'ReportError';
  code: ReportErrorCode;
  details?: Maybe<Scalars['JSON']['output']>;
  message: Scalars['String']['output'];
};

export enum ReportErrorCode {
  ExportError = 'EXPORT_ERROR',
  FilterError = 'FILTER_ERROR',
  GenerationTimeout = 'GENERATION_TIMEOUT',
  InsufficientData = 'INSUFFICIENT_DATA',
  PermissionDenied = 'PERMISSION_DENIED',
  QuotaExceeded = 'QUOTA_EXCEEDED',
  StorageError = 'STORAGE_ERROR',
  SystemError = 'SYSTEM_ERROR',
  TemplateError = 'TEMPLATE_ERROR',
}

export type ReportFilters = {
  customFilters?: InputMaybe<Scalars['JSON']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  locationTypes?: InputMaybe<Array<LocationType>>;
  orderStatuses?: InputMaybe<Array<OrderStatus>>;
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  transferStatuses?: InputMaybe<Array<TransferStatus>>;
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum ReportFormat {
  Csv = 'CSV',
  Excel = 'EXCEL',
  Html = 'HTML',
  Json = 'JSON',
  Pdf = 'PDF',
}

export type ReportFormatStats = {
  __typename?: 'ReportFormatStats';
  count: Scalars['Int']['output'];
  format: ReportFormat;
  totalSize: Scalars['Int']['output'];
};

export type ReportGenerationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  emailTo?: InputMaybe<Array<Scalars['String']['input']>>;
  filters?: InputMaybe<ReportFilters>;
  format: ReportFormat;
  grouping?: InputMaybe<ReportGrouping>;
  priority?: InputMaybe<ReportPriority>;
  reportType: ReportType;
  scheduledFor?: InputMaybe<Scalars['DateTime']['input']>;
  templateId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type ReportGenerationProgress = {
  __typename?: 'ReportGenerationProgress';
  error?: Maybe<Scalars['String']['output']>;
  estimatedTimeRemaining?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  progress: Scalars['Float']['output'];
  recordsProcessed?: Maybe<Scalars['Int']['output']>;
  reportType: ReportType;
  startedAt: Scalars['DateTime']['output'];
  status: ReportStatus;
  title: Scalars['String']['output'];
  totalRecords?: Maybe<Scalars['Int']['output']>;
  userId: Scalars['String']['output'];
};

export type ReportGenerationResult = {
  __typename?: 'ReportGenerationResult';
  estimatedCompletionTime?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  progress?: Maybe<Scalars['Float']['output']>;
  reportId: Scalars['ID']['output'];
  success: Scalars['Boolean']['output'];
};

export type ReportGrouping = {
  aggregations?: InputMaybe<Array<ReportAggregation>>;
  groupBy: Array<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<SortDirection>;
};

export enum ReportOperation {
  Delete = 'DELETE',
  Download = 'DOWNLOAD',
  ExtendExpiry = 'EXTEND_EXPIRY',
  Regenerate = 'REGENERATE',
  Share = 'SHARE',
}

export enum ReportPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Urgent = 'URGENT',
}

export type ReportSearchInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  formats?: InputMaybe<Array<ReportFormat>>;
  generatedBy?: InputMaybe<Scalars['String']['input']>;
  pagination?: InputMaybe<PaginationInput>;
  reportTypes?: InputMaybe<Array<ReportType>>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<SortInput>;
  statuses?: InputMaybe<Array<ReportStatus>>;
};

export type ReportSearchResult = {
  __typename?: 'ReportSearchResult';
  pageInfo: PageInfo;
  reports: Array<GeneratedReport>;
  totalCount: Scalars['Int']['output'];
};

export type ReportStatistics = {
  __typename?: 'ReportStatistics';
  averageGenerationTime: Scalars['Float']['output'];
  completedReports: Scalars['Int']['output'];
  diskUsage: Scalars['Int']['output'];
  failedReports: Scalars['Int']['output'];
  pendingReports: Scalars['Int']['output'];
  popularTemplates: Array<ReportTemplate>;
  quotaUsage: Scalars['Float']['output'];
  recentReports: Array<GeneratedReport>;
  reportsByFormat: Array<ReportFormatStats>;
  reportsByType: Array<ReportTypeStats>;
  reportsByUser: Array<UserReportStats>;
  successRate: Scalars['Float']['output'];
  todayReports: Scalars['Int']['output'];
  totalReports: Scalars['Int']['output'];
};

export enum ReportStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Error = 'ERROR',
  Expired = 'EXPIRED',
  Generating = 'GENERATING',
  Pending = 'PENDING',
}

export type ReportTemplate = {
  __typename?: 'ReportTemplate';
  config: Scalars['JSON']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  filters?: Maybe<Scalars['JSON']['output']>;
  grouping?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  lastUsed?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  reportType: ReportType;
  usageCount: Scalars['Int']['output'];
};

export enum ReportType {
  CustomReport = 'CUSTOM_REPORT',
  FinancialReport = 'FINANCIAL_REPORT',
  InventoryReport = 'INVENTORY_REPORT',
  OperationalReport = 'OPERATIONAL_REPORT',
  SystemReport = 'SYSTEM_REPORT',
  TransactionReport = 'TRANSACTION_REPORT',
}

export type ReportTypeStats = {
  __typename?: 'ReportTypeStats';
  averageGenerationTime: Scalars['Float']['output'];
  averageSize: Scalars['Int']['output'];
  count: Scalars['Int']['output'];
  successRate: Scalars['Float']['output'];
  type: ReportType;
};

export type ReportVoid = {
  __typename?: 'ReportVoid';
  createdAt: Scalars['DateTime']['output'];
  damageQty: Scalars['Int']['output'];
  pltNum: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  updatedAt: Scalars['DateTime']['output'];
  uuid: Scalars['ID']['output'];
};

export type ReportVoidConnection = {
  __typename?: 'ReportVoidConnection';
  edges: Array<ReportVoidEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ReportVoidEdge = {
  __typename?: 'ReportVoidEdge';
  cursor: Scalars['String']['output'];
  node: ReportVoid;
};

export type ReportVoidFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  maxDamageQty?: InputMaybe<Scalars['Int']['input']>;
  minDamageQty?: InputMaybe<Scalars['Int']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type ReportVoidSummary = {
  __typename?: 'ReportVoidSummary';
  dailyVoidCounts: Array<DailyVoidCount>;
  topPallets: Array<PalletVoidSummary>;
  topReasons: Array<ReasonSummary>;
  totalDamageQuantity: Scalars['Int']['output'];
  totalRecords: Scalars['Int']['output'];
};

export type RouteMetric = {
  __typename?: 'RouteMetric';
  averageDuration: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  fromLocation: Scalars['String']['output'];
  toLocation: Scalars['String']['output'];
};

export type ServiceHealth = {
  __typename?: 'ServiceHealth';
  lastError?: Maybe<Scalars['DateTime']['output']>;
  responseTime: Scalars['Float']['output'];
  serviceName: Scalars['String']['output'];
  status: ServiceStatus;
  uptime: Scalars['Float']['output'];
};

export enum ServiceStatus {
  Degraded = 'DEGRADED',
  Healthy = 'HEALTHY',
  Offline = 'OFFLINE',
  Unhealthy = 'UNHEALTHY',
}

export type SeverityCount = {
  __typename?: 'SeverityCount';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  severity: AlertSeverity;
};

export type ShapeCount = {
  __typename?: 'ShapeCount';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  shape: Scalars['String']['output'];
};

export type ShiftEfficiency = {
  __typename?: 'ShiftEfficiency';
  efficiency: Scalars['Float']['output'];
  endTime: Scalars['String']['output'];
  shift: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
};

export enum ShippingStatus {
  Delivered = 'DELIVERED',
  InTransit = 'IN_TRANSIT',
  Pending = 'PENDING',
  Preparing = 'PREPARING',
  Ready = 'READY',
  Returned = 'RETURNED',
  Shipped = 'SHIPPED',
}

export type SingleChartQueryInput = {
  aggregationType?: InputMaybe<AggregationType>;
  chartType: ChartType;
  dataSource: Scalars['String']['input'];
  dateRange?: InputMaybe<DateRangeInput>;
  filters?: InputMaybe<Scalars['JSON']['input']>;
  groupBy?: InputMaybe<Scalars['String']['input']>;
  timeGranularity?: InputMaybe<TimeGranularity>;
};

export type SingleFileUploadInput = {
  file: Scalars['Upload']['input'];
  fileName?: InputMaybe<Scalars['String']['input']>;
  folder?: InputMaybe<UploadFolder>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  requiresAnalysis?: InputMaybe<Scalars['Boolean']['input']>;
  uploadType: UploadType;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type SinglePalletHistoryResult = {
  __typename?: 'SinglePalletHistoryResult';
  pageInfo: PageInfo;
  palletInfo: PalletBasicInfo;
  palletNumber: Scalars['String']['output'];
  records: Array<StockHistoryRecord>;
  totalRecords: Scalars['Int']['output'];
};

export type SingleStatQueryInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  type: StatsType;
};

export type SingleUploadResult = {
  __typename?: 'SingleUploadResult';
  analysisResult?: Maybe<OrderAnalysisResult>;
  error?: Maybe<Scalars['String']['output']>;
  fileInfo?: Maybe<FileInfo>;
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  success: Scalars['Boolean']['output'];
};

export type SlateInfo = {
  __typename?: 'SlateInfo';
  colour?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  holeToBottom?: Maybe<Scalars['String']['output']>;
  length?: Maybe<Scalars['String']['output']>;
  product?: Maybe<Product>;
  productCode: Scalars['String']['output'];
  shapes?: Maybe<Scalars['String']['output']>;
  thicknessBottom?: Maybe<Scalars['String']['output']>;
  thicknessTop?: Maybe<Scalars['String']['output']>;
  toolNum?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['ID']['output'];
  weight?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['String']['output']>;
};

export type SlateInfoConnection = {
  __typename?: 'SlateInfoConnection';
  edges: Array<SlateInfoEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type SlateInfoEdge = {
  __typename?: 'SlateInfoEdge';
  cursor: Scalars['String']['output'];
  node: SlateInfo;
};

export type SlateInfoFilterInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hasDimensions?: InputMaybe<Scalars['Boolean']['input']>;
  hasWeight?: InputMaybe<Scalars['Boolean']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  shapes?: InputMaybe<Scalars['String']['input']>;
  toolNum?: InputMaybe<Scalars['String']['input']>;
};

export type SlateInfoStatistics = {
  __typename?: 'SlateInfoStatistics';
  averageThickness?: Maybe<Scalars['Float']['output']>;
  averageWeight?: Maybe<Scalars['Float']['output']>;
  commonColours: Array<ColourCount>;
  commonShapes: Array<ShapeCount>;
  productsWithDimensions: Scalars['Int']['output'];
  productsWithWeight: Scalars['Int']['output'];
  totalProducts: Scalars['Int']['output'];
};

export type SlowFunctionSummary = {
  __typename?: 'SlowFunctionSummary';
  averageExecutionTime: Scalars['Float']['output'];
  cacheHitRate: Scalars['Float']['output'];
  callCount: Scalars['Int']['output'];
  errorCount: Scalars['Int']['output'];
  functionName: Scalars['String']['output'];
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type SortInput = {
  direction: SortDirection;
  field: Scalars['String']['input'];
};

export type StatMetric = {
  __typename?: 'StatMetric';
  change?: Maybe<Scalars['Float']['output']>;
  changeType?: Maybe<ChangeType>;
  name: Scalars['String']['output'];
  unit?: Maybe<Scalars['String']['output']>;
  value: Scalars['Float']['output'];
};

export type StatsCardData = CardData & {
  __typename?: 'StatsCardData';
  configs: Array<StatsConfig>;
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  performance: PerformanceMetrics;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  stats: Array<StatsData>;
};

export type StatsConfig = {
  __typename?: 'StatsConfig';
  color?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  title: Scalars['String']['output'];
  type: StatsType;
};

export type StatsData = {
  __typename?: 'StatsData';
  comparison?: Maybe<ComparisonData>;
  dataSource: Scalars['String']['output'];
  label: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  optimized: Scalars['Boolean']['output'];
  trend?: Maybe<TrendData>;
  type: StatsType;
  unit: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type StatsQueryInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  departmentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  includeComparison?: InputMaybe<Scalars['Boolean']['input']>;
  locationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  types: Array<StatsType>;
};

export enum StatsType {
  ActiveUsers = 'ACTIVE_USERS',
  AwaitLocationQty = 'AWAIT_LOCATION_QTY',
  CompletionRate = 'COMPLETION_RATE',
  EfficiencyRate = 'EFFICIENCY_RATE',
  ErrorRate = 'ERROR_RATE',
  InjectionProductionStats = 'INJECTION_PRODUCTION_STATS',
  InventoryLevel = 'INVENTORY_LEVEL',
  PalletCount = 'PALLET_COUNT',
  PendingTasks = 'PENDING_TASKS',
  ProductionStats = 'PRODUCTION_STATS',
  QualityScore = 'QUALITY_SCORE',
  StaffWorkload = 'STAFF_WORKLOAD',
  StillInAwait = 'STILL_IN_AWAIT',
  StillInAwaitPercentage = 'STILL_IN_AWAIT_PERCENTAGE',
  StockLevelHistory = 'STOCK_LEVEL_HISTORY',
  TransferCount = 'TRANSFER_COUNT',
  TransferTimeDistribution = 'TRANSFER_TIME_DISTRIBUTION',
  WarehouseWorkLevel = 'WAREHOUSE_WORK_LEVEL',
  YesterdayTransferCount = 'YESTERDAY_TRANSFER_COUNT',
}

export type StatusCount = {
  __typename?: 'StatusCount';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  status: AlertStatus;
};

export enum StockAction {
  Adjusted = 'ADJUSTED',
  Allocated = 'ALLOCATED',
  Created = 'CREATED',
  Damaged = 'DAMAGED',
  Expired = 'EXPIRED',
  FinishedQc = 'FINISHED_QC',
  GrnLabelError = 'GRN_LABEL_ERROR',
  GrnReceiving = 'GRN_RECEIVING',
  Loaded = 'LOADED',
  Moved = 'MOVED',
  QualityCheck = 'QUALITY_CHECK',
  Repaired = 'REPAIRED',
  Transferred = 'TRANSFERRED',
  Unknown = 'UNKNOWN',
  Unloaded = 'UNLOADED',
  Voided = 'VOIDED',
}

export enum StockActionCategory {
  Administrative = 'ADMINISTRATIVE',
  Inbound = 'INBOUND',
  Internal = 'INTERNAL',
  Outbound = 'OUTBOUND',
}

export enum StockActionType {
  Movement = 'MOVEMENT',
  QuantityChange = 'QUANTITY_CHANGE',
  StatusChange = 'STATUS_CHANGE',
  SystemAction = 'SYSTEM_ACTION',
}

export type StockDistribution = {
  __typename?: 'StockDistribution';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  status: StockStatus;
};

export type StockDistributionInput = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  warehouseId?: InputMaybe<Scalars['String']['input']>;
};

export type StockDistributionItem = {
  __typename?: 'StockDistributionItem';
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
  productCode?: Maybe<Scalars['String']['output']>;
  stock: Scalars['String']['output'];
  stockLevel: Scalars['Float']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type StockDistributionResult = {
  __typename?: 'StockDistributionResult';
  dataSource: Scalars['String']['output'];
  items: Array<StockDistributionItem>;
  lastUpdated: Scalars['DateTime']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  totalCount: Scalars['Int']['output'];
  totalStock: Scalars['Int']['output'];
};

export type StockFilterInput = {
  descriptionPattern?: InputMaybe<Scalars['String']['input']>;
  maxLevel?: InputMaybe<Scalars['Int']['input']>;
  minLevel?: InputMaybe<Scalars['Int']['input']>;
  productTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  stockCodePattern?: InputMaybe<Scalars['String']['input']>;
  updatedAfter?: InputMaybe<Scalars['String']['input']>;
  updatedBefore?: InputMaybe<Scalars['String']['input']>;
};

export type StockHistoryFilter = {
  actionCategories?: InputMaybe<Array<StockActionCategory>>;
  actionTypes?: InputMaybe<Array<StockActionType>>;
  actions?: InputMaybe<Array<StockAction>>;
  dateRange?: InputMaybe<DateRangeInput>;
  hasRemark?: InputMaybe<Scalars['Boolean']['input']>;
  includeVoided?: InputMaybe<Scalars['Boolean']['input']>;
  locations?: InputMaybe<Array<Scalars['String']['input']>>;
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
  minQuantity?: InputMaybe<Scalars['Int']['input']>;
  operators?: InputMaybe<Array<Scalars['String']['input']>>;
  palletNumbers?: InputMaybe<Array<Scalars['String']['input']>>;
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type StockHistoryPagination = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  useCursor?: InputMaybe<Scalars['Boolean']['input']>;
};

export type StockHistoryRecord = {
  __typename?: 'StockHistoryRecord';
  action: StockAction;
  actionCategory: StockActionCategory;
  actionType: StockActionType;
  fromLocation?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  operator?: Maybe<User>;
  operatorName: Scalars['String']['output'];
  pallet?: Maybe<Pallet>;
  palletNumber: Scalars['String']['output'];
  product?: Maybe<Product>;
  productCode: Scalars['String']['output'];
  quantity?: Maybe<Scalars['Int']['output']>;
  remark?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  toLocation?: Maybe<Scalars['String']['output']>;
  transfer?: Maybe<Transfer>;
};

export type StockHistorySearchResult = {
  __typename?: 'StockHistorySearchResult';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  matchScore: Scalars['Float']['output'];
  palletNumber?: Maybe<Scalars['String']['output']>;
  productCode?: Maybe<Scalars['String']['output']>;
  recordId?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: StockHistorySearchType;
};

export enum StockHistorySearchType {
  Location = 'LOCATION',
  Operator = 'OPERATOR',
  PalletNumber = 'PALLET_NUMBER',
  ProductCode = 'PRODUCT_CODE',
  Remark = 'REMARK',
}

export type StockHistorySort = {
  direction: SortDirection;
  field: StockHistorySortField;
  secondary?: InputMaybe<StockHistorySort>;
};

export enum StockHistorySortField {
  Action = 'ACTION',
  Location = 'LOCATION',
  Operator = 'OPERATOR',
  PalletNumber = 'PALLET_NUMBER',
  ProductCode = 'PRODUCT_CODE',
  Quantity = 'QUANTITY',
  Timestamp = 'TIMESTAMP',
}

export type StockHistoryStats = {
  __typename?: 'StockHistoryStats';
  activeLocations: Scalars['Int']['output'];
  recentActivity: Scalars['Int']['output'];
  totalRecords: Scalars['Int']['output'];
  trendsData: Array<StockTrendPoint>;
  uniquePallets: Scalars['Int']['output'];
  uniqueProducts: Scalars['Int']['output'];
};

export type StockItem = {
  __typename?: 'StockItem';
  description?: Maybe<Scalars['String']['output']>;
  lastStockUpdate?: Maybe<Scalars['String']['output']>;
  realTimeLevel?: Maybe<Scalars['Int']['output']>;
  stock: Scalars['String']['output'];
  stockLevel: Scalars['Int']['output'];
  type?: Maybe<Scalars['String']['output']>;
  updateTime: Scalars['String']['output'];
};

export type StockItemConnection = Connection & {
  __typename?: 'StockItemConnection';
  edges: Array<StockItemEdge>;
  nodes: Array<StockItem>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StockItemEdge = {
  __typename?: 'StockItemEdge';
  cursor: Scalars['String']['output'];
  node: StockItem;
};

/**
 * 庫存水平記錄 (stock_level 表) - 產品庫存管理
 * 記錄系統中各產品的當前庫存水平，用於庫存監控和補貨決策
 * 每筆記錄代表一個產品的庫存狀況快照
 */
export type StockLevel = {
  __typename?: 'StockLevel';
  /** 產品描述或名稱 */
  description: Scalars['String']['output'];
  /** 低庫存警告標誌，基於預設的庫存閾值判定 */
  isLowStock: Scalars['Boolean']['output'];
  /** 產品庫存代碼，用於識別不同的產品 */
  stock: Scalars['String']['output'];
  /** 當前庫存數量 */
  stockLevel: Scalars['Int']['output'];
  /** 庫存狀態分類 (正常/低庫存/缺貨/超庫存等) */
  stockStatus: StockStatus;
  /** 最後更新時間，反映庫存數據的時效性 */
  updateTime: Scalars['DateTime']['output'];
  /** 記錄唯一標識符 (主鍵) */
  uuid: Scalars['ID']['output'];
};

export type StockLevelAnalysis = {
  __typename?: 'StockLevelAnalysis';
  averageStockLevel: Scalars['Float']['output'];
  criticalStockCount: Scalars['Int']['output'];
  lowStockCount: Scalars['Int']['output'];
  outOfStockCount: Scalars['Int']['output'];
  overstockCount: Scalars['Int']['output'];
  stockDistribution: Array<StockDistribution>;
  totalProducts: Scalars['Int']['output'];
  totalStockValue?: Maybe<Scalars['Float']['output']>;
};

export type StockLevelChartPoint = {
  __typename?: 'StockLevelChartPoint';
  date: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  stockCode: Scalars['String']['output'];
  stockLevel: Scalars['Int']['output'];
};

export type StockLevelChartResult = {
  __typename?: 'StockLevelChartResult';
  chartData: Array<StockLevelChartPoint>;
  dateRange: DateRange;
  productCodes: Array<Scalars['String']['output']>;
};

export type StockLevelConnection = {
  __typename?: 'StockLevelConnection';
  edges: Array<StockLevelEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StockLevelData = CardData & {
  __typename?: 'StockLevelData';
  dataSource: Scalars['String']['output'];
  items: Array<StockLevelItem>;
  lastUpdated: Scalars['DateTime']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  totalItems: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type StockLevelEdge = {
  __typename?: 'StockLevelEdge';
  cursor: Scalars['String']['output'];
  node: StockLevel;
};

export type StockLevelFilter = {
  dateRange?: InputMaybe<DateRangeInput>;
  maxStockLevel?: InputMaybe<Scalars['Int']['input']>;
  minStockLevel?: InputMaybe<Scalars['Int']['input']>;
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  productType?: InputMaybe<Scalars['String']['input']>;
};

export type StockLevelFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  isLowStock?: InputMaybe<Scalars['Boolean']['input']>;
  maxStockLevel?: InputMaybe<Scalars['Int']['input']>;
  minStockLevel?: InputMaybe<Scalars['Int']['input']>;
  stock?: InputMaybe<Scalars['String']['input']>;
  stockStatus?: InputMaybe<StockStatus>;
};

export type StockLevelItem = {
  __typename?: 'StockLevelItem';
  lastUpdated: Scalars['DateTime']['output'];
  location: Scalars['String']['output'];
  productCode: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
};

export type StockLevelListResult = {
  __typename?: 'StockLevelListResult';
  lastUpdated: Scalars['DateTime']['output'];
  records: Array<StockLevelRecord>;
  totalCount: Scalars['Int']['output'];
};

export type StockLevelRecord = {
  __typename?: 'StockLevelRecord';
  description: Scalars['String']['output'];
  productInfo?: Maybe<ProductInfo>;
  stock: Scalars['String']['output'];
  stockLevel: Scalars['Int']['output'];
  updateTime: Scalars['DateTime']['output'];
  uuid: Scalars['ID']['output'];
};

export type StockLevelStats = {
  __typename?: 'StockLevelStats';
  lastUpdate: Scalars['DateTime']['output'];
  productsByType: Array<ProductTypeCount>;
  totalProducts: Scalars['Int']['output'];
  totalStock: Scalars['Int']['output'];
};

export type StockMovementUpdate = {
  __typename?: 'StockMovementUpdate';
  affectedLocations: Array<Scalars['String']['output']>;
  affectedPallets: Array<Scalars['String']['output']>;
  affectedProducts: Array<Scalars['String']['output']>;
  record: StockHistoryRecord;
  recordId: Scalars['ID']['output'];
  timestamp: Scalars['DateTime']['output'];
  type: StockUpdateType;
};

export enum StockSortField {
  Description = 'DESCRIPTION',
  StockCode = 'STOCK_CODE',
  StockLevel = 'STOCK_LEVEL',
  UpdateTime = 'UPDATE_TIME',
}

export type StockSortInput = {
  direction: SortDirection;
  field: StockSortField;
};

export enum StockStatus {
  Critical = 'CRITICAL',
  Low = 'LOW',
  Normal = 'NORMAL',
  OutOfStock = 'OUT_OF_STOCK',
  Overstock = 'OVERSTOCK',
  Reserved = 'RESERVED',
}

export type StockTrendPoint = {
  __typename?: 'StockTrendPoint';
  label?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  value: Scalars['Int']['output'];
};

export enum StockUpdateType {
  LocationChange = 'LOCATION_CHANGE',
  NewRecord = 'NEW_RECORD',
  QuantityChange = 'QUANTITY_CHANGE',
  StatusChange = 'STATUS_CHANGE',
  VoidOperation = 'VOID_OPERATION',
}

export type StocktakeRecord = {
  __typename?: 'StocktakeRecord';
  countedId?: Maybe<Scalars['Int']['output']>;
  countedName?: Maybe<Scalars['String']['output']>;
  countedQty?: Maybe<Scalars['Int']['output']>;
  counter?: Maybe<User>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  pallet?: Maybe<Pallet>;
  pltNum?: Maybe<Scalars['String']['output']>;
  product?: Maybe<Product>;
  productCode: Scalars['String']['output'];
  productDesc: Scalars['String']['output'];
  remainQty?: Maybe<Scalars['Int']['output']>;
  status: StocktakeStatus;
  uuid: Scalars['ID']['output'];
  variance?: Maybe<Scalars['Int']['output']>;
  variancePercentage?: Maybe<Scalars['Float']['output']>;
};

export type StocktakeRecordConnection = {
  __typename?: 'StocktakeRecordConnection';
  edges: Array<StocktakeRecordEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StocktakeRecordEdge = {
  __typename?: 'StocktakeRecordEdge';
  cursor: Scalars['String']['output'];
  node: StocktakeRecord;
};

export type StocktakeRecordFilterInput = {
  countedBy?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  hasVariance?: InputMaybe<Scalars['Boolean']['input']>;
  minVariancePercentage?: InputMaybe<Scalars['Float']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  productCode?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<StocktakeStatus>;
};

export enum StocktakeStatus {
  Approved = 'APPROVED',
  Counted = 'COUNTED',
  NotCounted = 'NOT_COUNTED',
  Rejected = 'REJECTED',
  Variance = 'VARIANCE',
}

export type StocktakeVarianceSummary = {
  __typename?: 'StocktakeVarianceSummary';
  averageVariancePercentage: Scalars['Float']['output'];
  recordsWithVariance: Scalars['Int']['output'];
  topVarianceProducts: Array<VarianceProductSummary>;
  totalRecords: Scalars['Int']['output'];
  totalVariance: Scalars['Int']['output'];
  totalVarianceValue?: Maybe<Scalars['Float']['output']>;
};

export type StringFilter = {
  caseSensitive?: InputMaybe<Scalars['Boolean']['input']>;
  field: Scalars['String']['input'];
  operator: StringOperator;
  value: Scalars['String']['input'];
};

export enum StringOperator {
  Contains = 'CONTAINS',
  EndsWith = 'ENDS_WITH',
  Eq = 'EQ',
  Neq = 'NEQ',
  NotContains = 'NOT_CONTAINS',
  Regex = 'REGEX',
  StartsWith = 'STARTS_WITH',
}

export type Subscription = {
  __typename?: 'Subscription';
  acoRecordCompleted: AcoRecord;
  acoRecordProgressUpdated: AcoRecord;
  alertStatisticsUpdated: AlertStatistics;
  alertStatusChanged: Alert;
  analysisCompleted: OrderAnalysisResult;
  apiConfigActivated: ApiConfig;
  apiConfigDeactivated: ApiConfig;
  apiConfigUpdated: ApiConfig;
  cacheInvalidationEventCreated: CacheInvalidationEvent;
  cacheInvalidationEventProcessed: CacheInvalidationEvent;
  cacheInvalidationRequired: CacheInvalidationEvent;
  cachePerformanceUpdate: QueryPerformanceMetric;
  chartUpdated: ChartCardData;
  configBatchChanged: Array<ConfigItem>;
  configChanged: ConfigItem;
  configValidationChanged: ConfigValidation;
  criticalThreatDetected: ThreatStat;
  databaseMetricCreated: DatabasePerformanceMetric;
  databasePerformanceAlert: DatabasePerformanceMetric;
  fileUploaded: FileInfo;
  grnLevelUpdated: GrnLevel;
  highFrequencyAlert: MergedRecordHistory;
  highRiskIpDetected: ThreatStat;
  inventoryUpdated: Inventory;
  newAlert: Alert;
  newReportAvailable: GeneratedReport;
  operatorActivityAlert: OperatorEfficiency;
  orderLoadingActivity: OrderLoadingHistory;
  orderStatusChanged: Order;
  palletNumberBufferCreated: PalletNumberBuffer;
  palletNumberBufferExpired: PalletNumberBuffer;
  palletNumberBufferUsed: PalletNumberBuffer;
  queryErrorDetected: QueryPerformanceMetric;
  queryPerformanceAlert: QueryPerformanceMetric;
  queryRecordCreated: QueryRecord;
  queryRecordExpired: QueryRecord;
  recordHistoryUpdated: RecordHistoryUpdate;
  reportGenerated: GeneratedReport;
  reportGenerationError: Scalars['String']['output'];
  reportProgressUpdated: ReportGenerationProgress;
  reportVoidCreated: ReportVoid;
  reportVoidDeleted: ReportVoid;
  reportVoidUpdated: ReportVoid;
  slateInfoUpdated: SlateInfo;
  slowDatabaseQueryDetected: DatabasePerformanceMetric;
  slowQueryDetected: QueryRecord;
  slowQueryPerformanceDetected: QueryPerformanceMetric;
  statsUpdated: StatsData;
  stockLevelChanged: StockLevel;
  stockLevelCriticalAlert: StockLevel;
  stockLevelLowAlert: StockLevel;
  stockLevelUpdated: StockLevel;
  stocktakeRecordApproved: StocktakeRecord;
  stocktakeRecordUpdated: StocktakeRecord;
  systemAlert: SystemAlert;
  tableDataUpdated: TableCardData;
  threatStatCreated: ThreatStat;
  threatStatDeleted: ThreatStat;
  threatStatUpdated: ThreatStat;
  transferStatusChanged: Transfer;
  uploadError: Scalars['String']['output'];
  uploadProgressUpdated: UploadProgress;
};

export type SubscriptionAcoRecordCompletedArgs = {
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionAcoRecordProgressUpdatedArgs = {
  orderRefs?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type SubscriptionAlertStatusChangedArgs = {
  alertId?: InputMaybe<Scalars['ID']['input']>;
};

export type SubscriptionAnalysisCompletedArgs = {
  uploadId: Scalars['ID']['input'];
};

export type SubscriptionApiConfigUpdatedArgs = {
  configNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionCacheInvalidationEventCreatedArgs = {
  tableNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionCacheInvalidationRequiredArgs = {
  tableNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionChartUpdatedArgs = {
  chartTypes: Array<ChartType>;
};

export type SubscriptionConfigBatchChangedArgs = {
  category?: InputMaybe<ConfigCategory>;
  scope?: InputMaybe<ConfigScope>;
};

export type SubscriptionConfigChangedArgs = {
  category?: InputMaybe<ConfigCategory>;
  keys?: InputMaybe<Array<Scalars['String']['input']>>;
  scope?: InputMaybe<ConfigScope>;
};

export type SubscriptionDatabaseMetricCreatedArgs = {
  tableNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionDatabasePerformanceAlertArgs = {
  minExecutionTime?: InputMaybe<Scalars['Float']['input']>;
};

export type SubscriptionFileUploadedArgs = {
  folder?: InputMaybe<UploadFolder>;
};

export type SubscriptionGrnLevelUpdatedArgs = {
  grnRefs?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type SubscriptionHighFrequencyAlertArgs = {
  minOperationsPerWindow?: InputMaybe<Scalars['Int']['input']>;
  timeWindowMinutes?: InputMaybe<Scalars['Int']['input']>;
};

export type SubscriptionInventoryUpdatedArgs = {
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionNewAlertArgs = {
  severities?: InputMaybe<Array<AlertSeverity>>;
  types?: InputMaybe<Array<AlertType>>;
};

export type SubscriptionNewReportAvailableArgs = {
  reportTypes: Array<ReportType>;
};

export type SubscriptionOperatorActivityAlertArgs = {
  operatorIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  thresholdOperationsPerMinute?: InputMaybe<Scalars['Float']['input']>;
};

export type SubscriptionOrderLoadingActivityArgs = {
  orderRefs?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionOrderStatusChangedArgs = {
  orderNumbers?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionPalletNumberBufferCreatedArgs = {
  series?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionPalletNumberBufferUsedArgs = {
  series?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionQueryErrorDetectedArgs = {
  functionNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionQueryPerformanceAlertArgs = {
  functionNames?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionQueryRecordCreatedArgs = {
  users?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionRecordHistoryUpdatedArgs = {
  actions?: InputMaybe<Array<Scalars['String']['input']>>;
  locations?: InputMaybe<Array<Scalars['String']['input']>>;
  operatorIds?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type SubscriptionReportGeneratedArgs = {
  userId: Scalars['String']['input'];
};

export type SubscriptionReportGenerationErrorArgs = {
  generationId: Scalars['ID']['input'];
};

export type SubscriptionReportProgressUpdatedArgs = {
  generationIds: Array<Scalars['ID']['input']>;
};

export type SubscriptionReportVoidUpdatedArgs = {
  pltNums?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionSlateInfoUpdatedArgs = {
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionSlowQueryDetectedArgs = {
  minExecutionTime?: InputMaybe<Scalars['Int']['input']>;
};

export type SubscriptionStatsUpdatedArgs = {
  types: Array<StatsType>;
};

export type SubscriptionStockLevelChangedArgs = {
  stockCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionStockLevelLowAlertArgs = {
  threshold?: InputMaybe<Scalars['Int']['input']>;
};

export type SubscriptionStockLevelUpdatedArgs = {
  stockCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionStocktakeRecordApprovedArgs = {
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionStocktakeRecordUpdatedArgs = {
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionSystemAlertArgs = {
  severity?: InputMaybe<AlertSeverity>;
};

export type SubscriptionTableDataUpdatedArgs = {
  dataSource: Scalars['String']['input'];
};

export type SubscriptionThreatStatCreatedArgs = {
  eventTypes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionThreatStatUpdatedArgs = {
  ipAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionTransferStatusChangedArgs = {
  transferIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type SubscriptionUploadErrorArgs = {
  uploadId: Scalars['ID']['input'];
};

export type SubscriptionUploadProgressUpdatedArgs = {
  uploadIds: Array<Scalars['ID']['input']>;
};

export type Supplier = {
  __typename?: 'Supplier';
  supplier_code: Scalars['String']['output'];
  supplier_name?: Maybe<Scalars['String']['output']>;
};

export type SupplierConnection = {
  __typename?: 'SupplierConnection';
  edges: Array<SupplierEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type SupplierEdge = {
  __typename?: 'SupplierEdge';
  cursor: Scalars['String']['output'];
  node: Supplier;
};

export type SupplierFilterInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type SupplierPerformance = {
  __typename?: 'SupplierPerformance';
  deliveryPerformance: DeliveryPerformance;
  orderMetrics: OrderMetrics;
  qualityMetrics: QualityMetrics;
};

export type SupplierStatistics = {
  __typename?: 'SupplierStatistics';
  averageLeadTime?: Maybe<Scalars['Float']['output']>;
  onTimeDeliveryRate?: Maybe<Scalars['Float']['output']>;
  qualityScore?: Maybe<Scalars['Float']['output']>;
  totalGRNs: Scalars['Int']['output'];
  totalProducts: Scalars['Int']['output'];
};

export enum SupportedFileType {
  Doc = 'DOC',
  Docx = 'DOCX',
  Gif = 'GIF',
  Jpeg = 'JPEG',
  Jpg = 'JPG',
  Pdf = 'PDF',
  Png = 'PNG',
  Webp = 'WEBP',
}

export type SystemAlert = {
  __typename?: 'SystemAlert';
  acknowledged: Scalars['Boolean']['output'];
  details?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  severity: AlertSeverity;
  timestamp: Scalars['DateTime']['output'];
  type: AlertType;
};

export enum SystemConfigKey {
  Currency = 'CURRENCY',
  DateFormat = 'DATE_FORMAT',
  DefaultPageSize = 'DEFAULT_PAGE_SIZE',
  Language = 'LANGUAGE',
  NumberFormat = 'NUMBER_FORMAT',
  PasswordPolicy = 'PASSWORD_POLICY',
  SessionTimeout = 'SESSION_TIMEOUT',
  Theme = 'THEME',
  Timezone = 'TIMEZONE',
  TwoFactorAuth = 'TWO_FACTOR_AUTH',
}

export type SystemPerformance = CardData & {
  __typename?: 'SystemPerformance';
  averageResponseTime: Scalars['Float']['output'];
  cpuUsage: Scalars['Float']['output'];
  dataSource: Scalars['String']['output'];
  diskUsage: Scalars['Float']['output'];
  errorRate: Scalars['Float']['output'];
  errorsByType: Array<ErrorTypeMetric>;
  lastUpdated: Scalars['DateTime']['output'];
  memoryUsage: Scalars['Float']['output'];
  networkUsage: Scalars['Float']['output'];
  p95ResponseTime: Scalars['Float']['output'];
  p99ResponseTime: Scalars['Float']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  requestsPerSecond: Scalars['Float']['output'];
  servicesHealth: Array<ServiceHealth>;
  transactionsPerMinute: Scalars['Float']['output'];
};

export type SystemStatus = {
  __typename?: 'SystemStatus';
  activeUsers: Scalars['Int']['output'];
  healthy: Scalars['Boolean']['output'];
  lastBackup?: Maybe<Scalars['DateTime']['output']>;
  uptime: Scalars['Int']['output'];
  version: Scalars['String']['output'];
};

export type TableCardData = CardData & {
  __typename?: 'TableCardData';
  columns: Array<TableColumn>;
  currentPage?: Maybe<Scalars['Int']['output']>;
  data: Array<Scalars['TableRow']['output']>;
  dataSource: Scalars['String']['output'];
  filters?: Maybe<AppliedTableFilters>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  metadata: TableMetadata;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  sorting?: Maybe<AppliedTableSorting>;
  totalCount: Scalars['Int']['output'];
  totalPages?: Maybe<Scalars['Int']['output']>;
};

export type TableColumn = {
  __typename?: 'TableColumn';
  alignment?: Maybe<Scalars['String']['output']>;
  filterable: Scalars['Boolean']['output'];
  format?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  name: Scalars['String']['output'];
  sortable: Scalars['Boolean']['output'];
  type: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type TableDataInput = {
  columns?: InputMaybe<Array<Scalars['String']['input']>>;
  dataSource: Scalars['String']['input'];
  dateRange?: InputMaybe<DateRangeInput>;
  filters?: InputMaybe<TableFilters>;
  includeMetadata?: InputMaybe<Scalars['Boolean']['input']>;
  pagination: TablePagination;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<TableSorting>;
};

export type TableFilters = {
  arrayFilters?: InputMaybe<Array<ArrayFilter>>;
  booleanFilters?: InputMaybe<Array<BooleanFilter>>;
  dateFilters?: InputMaybe<Array<DateFilter>>;
  numberFilters?: InputMaybe<Array<NumberFilter>>;
  stringFilters?: InputMaybe<Array<StringFilter>>;
};

export type TableMetadata = {
  __typename?: 'TableMetadata';
  cacheHit: Scalars['Boolean']['output'];
  dataSource: Scalars['String']['output'];
  filteredRecords: Scalars['Int']['output'];
  generatedAt: Scalars['DateTime']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  permissions: TablePermissions;
  queryTime: Scalars['Float']['output'];
  totalRecords: Scalars['Int']['output'];
};

export type TablePagination = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: Scalars['Int']['input'];
  loadMore?: InputMaybe<Scalars['Boolean']['input']>;
  offset?: Scalars['Int']['input'];
  style?: InputMaybe<PaginationStyle>;
};

export type TablePermissions = {
  __typename?: 'TablePermissions';
  canCreate: Scalars['Boolean']['output'];
  canDelete: Scalars['Boolean']['output'];
  canEdit: Scalars['Boolean']['output'];
  canExport: Scalars['Boolean']['output'];
  canFilter: Scalars['Boolean']['output'];
  canSort: Scalars['Boolean']['output'];
  canView: Scalars['Boolean']['output'];
};

export type TableSorting = {
  secondarySort?: InputMaybe<TableSorting>;
  sortBy: Scalars['String']['input'];
  sortOrder: SortDirection;
};

export type ThreatAnalysis = {
  __typename?: 'ThreatAnalysis';
  criticalThreatCount: Scalars['Int']['output'];
  highRiskIpList: Array<HighRiskIp>;
  threatTrends: Array<ThreatTrend>;
  topThreatTypes: Array<ThreatTypeSummary>;
  totalThreatEvents: Scalars['Int']['output'];
  uniqueIpCount: Scalars['Int']['output'];
};

export enum ThreatRiskLevel {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
}

export type ThreatStat = {
  __typename?: 'ThreatStat';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  eventDate: Scalars['Date']['output'];
  eventType: Scalars['String']['output'];
  firstOccurrence?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['Int']['output'];
  ipAddress: Scalars['String']['output'];
  isBlocked: Scalars['Boolean']['output'];
  isRecent: Scalars['Boolean']['output'];
  lastOccurrence?: Maybe<Scalars['DateTime']['output']>;
  occurrenceCount?: Maybe<Scalars['Int']['output']>;
  riskLevel: ThreatRiskLevel;
  severity: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ThreatStatConnection = {
  __typename?: 'ThreatStatConnection';
  edges: Array<ThreatStatEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ThreatStatEdge = {
  __typename?: 'ThreatStatEdge';
  cursor: Scalars['String']['output'];
  node: ThreatStat;
};

export type ThreatStatFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  isBlocked?: InputMaybe<Scalars['Boolean']['input']>;
  isRecent?: InputMaybe<Scalars['Boolean']['input']>;
  maxOccurrenceCount?: InputMaybe<Scalars['Int']['input']>;
  minOccurrenceCount?: InputMaybe<Scalars['Int']['input']>;
  riskLevel?: InputMaybe<ThreatRiskLevel>;
  severity?: InputMaybe<Scalars['String']['input']>;
};

export type ThreatTrend = {
  __typename?: 'ThreatTrend';
  criticalCount: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
  threatCount: Scalars['Int']['output'];
  uniqueIpCount: Scalars['Int']['output'];
};

export type ThreatTypeSummary = {
  __typename?: 'ThreatTypeSummary';
  averageSeverity: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  eventType: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
};

export enum TimeGranularity {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE',
  Month = 'MONTH',
  Quarter = 'QUARTER',
  Week = 'WEEK',
  Year = 'YEAR',
}

export type TimeSpan = {
  __typename?: 'TimeSpan';
  durationHours: Scalars['Float']['output'];
  end: Scalars['DateTime']['output'];
  start: Scalars['DateTime']['output'];
};

export enum TimeWindow {
  Last_5Minutes = 'LAST_5_MINUTES',
  Last_7Days = 'LAST_7_DAYS',
  Last_15Minutes = 'LAST_15_MINUTES',
  Last_24Hours = 'LAST_24_HOURS',
  Last_30Days = 'LAST_30_DAYS',
  LastHour = 'LAST_HOUR',
}

export type TimelineGroup = {
  __typename?: 'TimelineGroup';
  count: Scalars['Int']['output'];
  date: Scalars['DateTime']['output'];
};

export type TopProduct = {
  __typename?: 'TopProduct';
  colour: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  locationQuantities: TopProductLocationQuantities;
  productCode: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  productType: Scalars['String']['output'];
  standardQty?: Maybe<Scalars['Int']['output']>;
  totalQuantity: Scalars['Int']['output'];
};

export type TopProductLocationQuantities = {
  __typename?: 'TopProductLocationQuantities';
  await: Scalars['Int']['output'];
  await_grn: Scalars['Int']['output'];
  backcarpark: Scalars['Int']['output'];
  bulk: Scalars['Int']['output'];
  damage: Scalars['Int']['output'];
  fold: Scalars['Int']['output'];
  injection: Scalars['Int']['output'];
  pipeline: Scalars['Int']['output'];
  prebook: Scalars['Int']['output'];
};

export type TopProductsInput = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  locationFilter?: InputMaybe<Array<Scalars['String']['input']>>;
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
  productType?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<SortDirection>;
};

export type TopProductsResult = {
  __typename?: 'TopProductsResult';
  averageQuantity: Scalars['Float']['output'];
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  maxQuantity: Scalars['Int']['output'];
  minQuantity: Scalars['Int']['output'];
  products: Array<TopProduct>;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  totalCount: Scalars['Int']['output'];
};

export type Transfer = {
  __typename?: 'Transfer';
  fromLocation: Scalars['String']['output'];
  operator?: Maybe<User>;
  operatorId: Scalars['Int']['output'];
  pallet: Pallet;
  pltNum: Scalars['String']['output'];
  toLocation: Scalars['String']['output'];
  tranDate: Scalars['DateTime']['output'];
  uuid: Scalars['ID']['output'];
};

export type TransferConnection = {
  __typename?: 'TransferConnection';
  edges: Array<TransferEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TransferEdge = {
  __typename?: 'TransferEdge';
  cursor: Scalars['String']['output'];
  node: Transfer;
};

export type TransferFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  executedBy?: InputMaybe<Scalars['ID']['input']>;
  fromLocation?: InputMaybe<Scalars['String']['input']>;
  pltNum?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TransferStatus>;
  toLocation?: InputMaybe<Scalars['String']['input']>;
  transferNumber?: InputMaybe<Scalars['String']['input']>;
};

export type TransferFlowSummary = {
  __typename?: 'TransferFlowSummary';
  averageTransferTime: Scalars['Float']['output'];
  timeSpan: DateRange;
  topFromLocation: Scalars['String']['output'];
  topToLocation: Scalars['String']['output'];
  totalTransfers: Scalars['Int']['output'];
  uniqueOperators: Scalars['Int']['output'];
  uniquePallets: Scalars['Int']['output'];
};

export enum TransferPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Urgent = 'URGENT',
}

export enum TransferStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING',
}

export type TransferTimeFlowFilter = {
  dateRange: DateRangeInput;
  fromLocations?: InputMaybe<Array<Scalars['String']['input']>>;
  includeBottlenecks?: InputMaybe<Scalars['Boolean']['input']>;
  maxDuration?: InputMaybe<Scalars['Int']['input']>;
  minDuration?: InputMaybe<Scalars['Int']['input']>;
  operators?: InputMaybe<Array<Scalars['String']['input']>>;
  palletNumbers?: InputMaybe<Array<Scalars['String']['input']>>;
  toLocations?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type TransferTimeFlowResult = {
  __typename?: 'TransferTimeFlowResult';
  bottlenecks: Array<LocationBottleneck>;
  flowMetrics: FlowMetrics;
  operatorPerformance: Array<OperatorPerformance>;
  pageInfo: PageInfo;
  summary: TransferFlowSummary;
  totalCount: Scalars['Int']['output'];
  transfers: Array<EnhancedTransferRecord>;
};

export type TrendData = {
  __typename?: 'TrendData';
  direction: TrendDirection;
  label?: Maybe<Scalars['String']['output']>;
  percentage: Scalars['Float']['output'];
  value: Scalars['Float']['output'];
};

export enum TrendDirection {
  Decreasing = 'DECREASING',
  Increasing = 'INCREASING',
  Stable = 'STABLE',
}

export type TrendPoint = {
  __typename?: 'TrendPoint';
  label?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  value: Scalars['Float']['output'];
};

export type TypeCount = {
  __typename?: 'TypeCount';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  type: AlertType;
};

export type UnifiedOperationsData = CardData & {
  __typename?: 'UnifiedOperationsData';
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  orders: Array<Order>;
  pallets: Array<Pallet>;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  summary: OperationsSummary;
  transfers: Array<Transfer>;
  workLevels: Array<WorkLevel>;
};

export type UpdateApiConfigInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAcoOrderInput = {
  orderCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  orderRef: Scalars['Int']['input'];
  productCode: Scalars['String']['input'];
  quantityUsed: Scalars['Int']['input'];
  skipUpdate?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateAcoOrderResponse = {
  __typename?: 'UpdateAcoOrderResponse';
  emailSent?: Maybe<Scalars['Boolean']['output']>;
  error?: Maybe<Error>;
  message?: Maybe<Scalars['String']['output']>;
  order?: Maybe<AcoOrder>;
  success: Scalars['Boolean']['output'];
};

export type UpdateAcoRecordInput = {
  finishedQty?: InputMaybe<Scalars['Int']['input']>;
  requiredQty?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateAlertRuleInput = {
  actions?: InputMaybe<Array<AlertActionInput>>;
  conditions?: InputMaybe<Scalars['JSON']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  severity?: InputMaybe<AlertSeverity>;
  throttle?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateFileInfoInput = {
  docName?: InputMaybe<Scalars['String']['input']>;
  docType?: InputMaybe<Scalars['String']['input']>;
  docUrl?: InputMaybe<Scalars['String']['input']>;
  folder?: InputMaybe<Scalars['String']['input']>;
  jsonTxt?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGrnRecordInput = {
  grossWeight?: InputMaybe<Scalars['Int']['input']>;
  netWeight?: InputMaybe<Scalars['Int']['input']>;
  package?: InputMaybe<Scalars['String']['input']>;
  packageCount?: InputMaybe<Scalars['Float']['input']>;
  pallet?: InputMaybe<Scalars['String']['input']>;
  palletCount?: InputMaybe<Scalars['Float']['input']>;
  qualityNotes?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<GrnRecordStatus>;
};

export type UpdateGrnLevelInput = {
  totalGross?: InputMaybe<Scalars['Int']['input']>;
  totalNet?: InputMaybe<Scalars['Int']['input']>;
  totalUnit?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateHistoryRecordInput = {
  action?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePalletNumberBufferInput = {
  used?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProductInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  standardQty?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
  volumePerPiece?: InputMaybe<Scalars['Float']['input']>;
  weightPerPiece?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateReportTemplateInput = {
  config?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Scalars['JSON']['input']>;
  grouping?: InputMaybe<Scalars['JSON']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateReportVoidInput = {
  damageQty?: InputMaybe<Scalars['Int']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSlateInfoInput = {
  colour?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  holeToBottom?: InputMaybe<Scalars['String']['input']>;
  length?: InputMaybe<Scalars['String']['input']>;
  shapes?: InputMaybe<Scalars['String']['input']>;
  thicknessBottom?: InputMaybe<Scalars['String']['input']>;
  thicknessTop?: InputMaybe<Scalars['String']['input']>;
  toolNum?: InputMaybe<Scalars['String']['input']>;
  weight?: InputMaybe<Scalars['String']['input']>;
  width?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStatistics = CardData & {
  __typename?: 'UpdateStatistics';
  averageCompletionTime: Scalars['Float']['output'];
  backlogTrend: Array<TrendPoint>;
  completedToday: Scalars['Int']['output'];
  dataSource: Scalars['String']['output'];
  estimatedClearTime: Scalars['Float']['output'];
  failed: Scalars['Int']['output'];
  inProgress: Scalars['Int']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  pendingCount: Scalars['Int']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  updatesByStatus: Array<UpdateStatusMetric>;
  updatesByType: Array<UpdateTypeMetric>;
};

export type UpdateStatusMetric = {
  __typename?: 'UpdateStatusMetric';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type UpdateStockLevelInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  stockLevel?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateStocktakeRecordInput = {
  countedId?: InputMaybe<Scalars['Int']['input']>;
  countedName?: InputMaybe<Scalars['String']['input']>;
  countedQty?: InputMaybe<Scalars['Int']['input']>;
  remark?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSupplierInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fax?: InputMaybe<Scalars['String']['input']>;
  leadTime?: InputMaybe<Scalars['Int']['input']>;
  minimumOrderQuantity?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  paymentTerms?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateThreatStatInput = {
  eventType?: InputMaybe<Scalars['String']['input']>;
  occurrenceCount?: InputMaybe<Scalars['Int']['input']>;
  severity?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTypeMetric = {
  __typename?: 'UpdateTypeMetric';
  averageTime: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  successRate: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export type UpdateWorkLevelInput = {
  grn?: InputMaybe<Scalars['Int']['input']>;
  loading?: InputMaybe<Scalars['Int']['input']>;
  move?: InputMaybe<Scalars['Int']['input']>;
  qc?: InputMaybe<Scalars['Int']['input']>;
};

export type UploadCardData = CardData & {
  __typename?: 'UploadCardData';
  activeUploads: Array<UploadProgress>;
  config: UploadConfig;
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  recentUploads: Array<FileInfo>;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  statistics: UploadStatistics;
  uploadType: UploadType;
};

export type UploadCardInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  folder?: InputMaybe<UploadFolder>;
  includeActiveUploads?: InputMaybe<Scalars['Boolean']['input']>;
  includeRecentUploads?: InputMaybe<Scalars['Boolean']['input']>;
  includeStatistics?: InputMaybe<Scalars['Boolean']['input']>;
  recentLimit?: InputMaybe<Scalars['Int']['input']>;
  uploadType: UploadType;
};

export type UploadConfig = {
  __typename?: 'UploadConfig';
  allowMultiple: Scalars['Boolean']['output'];
  allowedTypes: Array<SupportedFileType>;
  folder: UploadFolder;
  maxFileSize: Scalars['Int']['output'];
  maxFiles?: Maybe<Scalars['Int']['output']>;
  requiresAnalysis: Scalars['Boolean']['output'];
  supportsDragDrop: Scalars['Boolean']['output'];
  supportsPreview: Scalars['Boolean']['output'];
  uploadType: UploadType;
};

export type UploadError = {
  __typename?: 'UploadError';
  code: UploadErrorCode;
  details?: Maybe<Scalars['JSON']['output']>;
  fileName?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export enum UploadErrorCode {
  AnalysisFailed = 'ANALYSIS_FAILED',
  DuplicateFile = 'DUPLICATE_FILE',
  FileTooLarge = 'FILE_TOO_LARGE',
  InvalidFileType = 'INVALID_FILE_TYPE',
  NetworkError = 'NETWORK_ERROR',
  PermissionDenied = 'PERMISSION_DENIED',
  QuotaExceeded = 'QUOTA_EXCEEDED',
  StorageError = 'STORAGE_ERROR',
  UploadFailed = 'UPLOAD_FAILED',
  VirusDetected = 'VIRUS_DETECTED',
}

export enum UploadFolder {
  OrderPdfs = 'ORDER_PDFS',
  Photos = 'PHOTOS',
  ProductSpec = 'PRODUCT_SPEC',
  StockPic = 'STOCK_PIC',
}

export type UploadProgress = {
  __typename?: 'UploadProgress';
  bytesUploaded?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  estimatedTimeRemaining?: Maybe<Scalars['Int']['output']>;
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  progress: Scalars['Float']['output'];
  status: UploadStatus;
  totalBytes?: Maybe<Scalars['Int']['output']>;
  uploadSpeed?: Maybe<Scalars['Float']['output']>;
};

export type UploadStatistics = CardData & {
  __typename?: 'UploadStatistics';
  averageProcessingTime: Scalars['Float']['output'];
  averageUploadTime: Scalars['Float']['output'];
  dataSource: Scalars['String']['output'];
  errorReasons: Array<ErrorReason>;
  failureRate: Scalars['Float']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  popularFileTypes: Array<FileTypeStats>;
  recentErrors: Array<Scalars['String']['output']>;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  successRate: Scalars['Float']['output'];
  todayUploads: Scalars['Int']['output'];
  totalSize: Scalars['Int']['output'];
  totalUploads: Scalars['Int']['output'];
  uploadTrends: Array<TrendPoint>;
  uploadsByType: Array<UploadTypeMetric>;
  uploadsByUser: Array<UserUploadMetric>;
};

export enum UploadStatus {
  Analyzing = 'ANALYZING',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Error = 'ERROR',
  Pending = 'PENDING',
  Uploading = 'UPLOADING',
}

export enum UploadType {
  GeneralFiles = 'GENERAL_FILES',
  OrderPdf = 'ORDER_PDF',
  Photos = 'PHOTOS',
  ProductSpec = 'PRODUCT_SPEC',
}

export type UploadTypeMetric = {
  __typename?: 'UploadTypeMetric';
  averageSize: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  failureCount: Scalars['Int']['output'];
  successCount: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  department: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  iconUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  position: Scalars['String']['output'];
  role: UserRole;
  uuid: Scalars['String']['output'];
};

export type UserReportStats = {
  __typename?: 'UserReportStats';
  favoriteType?: Maybe<ReportType>;
  lastGenerated: Scalars['DateTime']['output'];
  reportCount: Scalars['Int']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export enum UserRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Operator = 'OPERATOR',
  Supervisor = 'SUPERVISOR',
  Viewer = 'VIEWER',
}

export type UserUploadMetric = {
  __typename?: 'UserUploadMetric';
  lastUpload: Scalars['DateTime']['output'];
  successRate: Scalars['Float']['output'];
  uploadCount: Scalars['Int']['output'];
  user: User;
};

export type VarianceProductSummary = {
  __typename?: 'VarianceProductSummary';
  averageVariancePercentage: Scalars['Float']['output'];
  productCode: Scalars['String']['output'];
  productDesc: Scalars['String']['output'];
  recordCount: Scalars['Int']['output'];
  totalVariance: Scalars['Int']['output'];
};

export type Warehouse = {
  __typename?: 'Warehouse';
  code: Scalars['String']['output'];
  currentOccupancy: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  locations: Array<Location>;
  name: Scalars['String']['output'];
  occupancyRate: Scalars['Float']['output'];
  totalCapacity: Scalars['Int']['output'];
};

export type WarehouseOrder = {
  __typename?: 'WarehouseOrder';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customerName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  items: Array<WarehouseOrderItem>;
  loadedQuantity: Scalars['Int']['output'];
  orderRef: Scalars['String']['output'];
  remainingQuantity: Scalars['Int']['output'];
  status: WarehouseOrderStatus;
  totalQuantity: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type WarehouseOrderAggregates = {
  __typename?: 'WarehouseOrderAggregates';
  completedOrders: Scalars['Int']['output'];
  loadedQuantity: Scalars['Int']['output'];
  pendingOrders: Scalars['Int']['output'];
  totalOrders: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type WarehouseOrderFilterInput = {
  customerName?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  orderRef?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<WarehouseOrderStatus>;
};

export type WarehouseOrderItem = {
  __typename?: 'WarehouseOrderItem';
  id: Scalars['ID']['output'];
  loadedQuantity: Scalars['Int']['output'];
  orderId: Scalars['ID']['output'];
  productCode: Scalars['String']['output'];
  productDesc?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Int']['output'];
  status: WarehouseOrderItemStatus;
};

export enum WarehouseOrderItemStatus {
  Completed = 'COMPLETED',
  Partial = 'PARTIAL',
  Pending = 'PENDING',
}

export enum WarehouseOrderStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING',
}

export type WarehouseOrdersResponse = {
  __typename?: 'WarehouseOrdersResponse';
  aggregates?: Maybe<WarehouseOrderAggregates>;
  items: Array<WarehouseOrder>;
  total: Scalars['Int']['output'];
};

export type WeightRangeInput = {
  maxGrossWeight?: InputMaybe<Scalars['Int']['input']>;
  maxNetWeight?: InputMaybe<Scalars['Int']['input']>;
  minGrossWeight?: InputMaybe<Scalars['Int']['input']>;
  minNetWeight?: InputMaybe<Scalars['Int']['input']>;
};

export type WorkLevel = {
  __typename?: 'WorkLevel';
  dailyAverage?: Maybe<Scalars['Float']['output']>;
  date: Scalars['DateTime']['output'];
  efficiency?: Maybe<Scalars['Float']['output']>;
  grn: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  latestUpdate: Scalars['DateTime']['output'];
  loading: Scalars['Int']['output'];
  mostActiveOperation: WorkOperationType;
  move: Scalars['Int']['output'];
  productivityScore?: Maybe<Scalars['Float']['output']>;
  qc: Scalars['Int']['output'];
  totalOperations: Scalars['Int']['output'];
  totalPalletsHandled: Scalars['Int']['output'];
  totalQuantityMoved: Scalars['Int']['output'];
  totalTransfers: Scalars['Int']['output'];
  user: User;
  userId: Scalars['ID']['output'];
  uuid: Scalars['ID']['output'];
  weeklyTrend?: Maybe<Scalars['Float']['output']>;
};

export type WorkLevelConnection = {
  __typename?: 'WorkLevelConnection';
  edges: Array<WorkLevelEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type WorkLevelEdge = {
  __typename?: 'WorkLevelEdge';
  cursor: Scalars['String']['output'];
  node: WorkLevel;
};

export type WorkLevelFilterInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  minOperations?: InputMaybe<Scalars['Int']['input']>;
  operationType?: InputMaybe<WorkOperationType>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};

export type WorkLevelSummary = {
  __typename?: 'WorkLevelSummary';
  averageOperationsPerUser: Scalars['Float']['output'];
  operationBreakdown: Array<OperationBreakdown>;
  periodComparison?: Maybe<PeriodComparison>;
  topOperationType: WorkOperationType;
  totalOperations: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
};

export enum WorkOperationType {
  Grn = 'GRN',
  Loading = 'LOADING',
  Move = 'MOVE',
  Qc = 'QC',
}

export enum WorkflowConfigKey {
  AutoApproveOrders = 'AUTO_APPROVE_ORDERS',
  OrderPriorityRules = 'ORDER_PRIORITY_RULES',
  ReorderPoints = 'REORDER_POINTS',
  RequireQcApproval = 'REQUIRE_QC_APPROVAL',
  StockAlertThresholds = 'STOCK_ALERT_THRESHOLDS',
  TransferApprovalLevels = 'TRANSFER_APPROVAL_LEVELS',
}

export type GetDepartmentInjectionDataQueryVariables = Exact<{ [key: string]: never }>;

export type GetDepartmentInjectionDataQuery = {
  __typename?: 'Query';
  departmentInjectionData: {
    __typename?: 'DepartmentInjectionData';
    loading: boolean;
    error?: string | null;
    stats: {
      __typename?: 'DepartmentStats';
      todayFinished?: number | null;
      past7Days: number;
      past14Days: number;
      lastUpdated: string;
    };
    topStocks: {
      __typename?: 'StockItemConnection';
      totalCount: number;
      nodes: Array<{
        __typename?: 'StockItem';
        stock: string;
        description?: string | null;
        stockLevel: number;
        updateTime: string;
      }>;
    };
    materialStocks: {
      __typename?: 'StockItemConnection';
      totalCount: number;
      nodes: Array<{
        __typename?: 'StockItem';
        stock: string;
        description?: string | null;
        stockLevel: number;
        updateTime: string;
      }>;
    };
    machineStates: Array<{
      __typename?: 'MachineState';
      machineNumber: string;
      lastActiveTime?: string | null;
      state: MachineStatus;
    }>;
  };
};

export type GetDepartmentPipeDataQueryVariables = Exact<{ [key: string]: never }>;

export type GetDepartmentPipeDataQuery = {
  __typename?: 'Query';
  departmentPipeData: {
    __typename?: 'DepartmentPipeData';
    pipeProductionRate?: number | null;
    materialConsumptionRate?: number | null;
    loading: boolean;
    error?: string | null;
    stats: {
      __typename?: 'DepartmentStats';
      todayFinished?: number | null;
      past7Days: number;
      past14Days: number;
      lastUpdated: string;
    };
    topStocks: {
      __typename?: 'StockItemConnection';
      totalCount: number;
      nodes: Array<{
        __typename?: 'StockItem';
        stock: string;
        description?: string | null;
        stockLevel: number;
        updateTime: string;
        type?: string | null;
        realTimeLevel?: number | null;
        lastStockUpdate?: string | null;
      }>;
      pageInfo: { __typename?: 'PageInfo'; hasNextPage: boolean; hasPreviousPage: boolean };
    };
    materialStocks: {
      __typename?: 'StockItemConnection';
      totalCount: number;
      nodes: Array<{
        __typename?: 'StockItem';
        stock: string;
        description?: string | null;
        stockLevel: number;
        updateTime: string;
        type?: string | null;
        realTimeLevel?: number | null;
        lastStockUpdate?: string | null;
      }>;
      pageInfo: { __typename?: 'PageInfo'; hasNextPage: boolean; hasPreviousPage: boolean };
    };
    machineStates: Array<{
      __typename?: 'MachineState';
      machineNumber: string;
      lastActiveTime?: string | null;
      state: MachineStatus;
      efficiency?: number | null;
      currentTask?: string | null;
      nextMaintenance?: string | null;
    }>;
  };
};

export type GetDepartmentWarehouseDataQueryVariables = Exact<{ [key: string]: never }>;

export type GetDepartmentWarehouseDataQuery = {
  __typename?: 'Query';
  departmentWarehouseData: {
    __typename?: 'DepartmentWarehouseData';
    loading: boolean;
    error?: string | null;
    stats: {
      __typename?: 'DepartmentStats';
      todayTransferred?: number | null;
      past7Days: number;
      past14Days: number;
      lastUpdated: string;
    };
    recentActivities: Array<{
      __typename?: 'RecentActivity';
      time: string;
      staff: string;
      action: string;
      detail: string;
    }>;
    orderCompletions: Array<{
      __typename?: 'OrderCompletion';
      orderRef: string;
      productQty: number;
      loadedQty: number;
      completionPercentage: number;
      latestUpdate?: string | null;
      hasPdf: boolean;
      docUrl?: string | null;
    }>;
  };
};

export type GetOrderDetailsQueryVariables = Exact<{
  orderRef: Scalars['String']['input'];
}>;

export type GetOrderDetailsQuery = {
  __typename?: 'Query';
  warehouseOrder?: {
    __typename?: 'WarehouseOrder';
    id: string;
    orderRef: string;
    customerName?: string | null;
    status: WarehouseOrderStatus;
    totalQuantity: number;
    loadedQuantity: number;
    remainingQuantity: number;
    createdAt: any;
    updatedAt: any;
    items: Array<{
      __typename?: 'WarehouseOrderItem';
      id: string;
      productCode: string;
      productDesc?: string | null;
      quantity: number;
      loadedQuantity: number;
      status: WarehouseOrderItemStatus;
    }>;
  } | null;
};

export type GetProductTypesQueryVariables = Exact<{ [key: string]: never }>;

export type GetProductTypesQuery = {
  __typename?: 'Query';
  productFormOptions: {
    __typename?: 'ProductFormOptions';
    types: Array<{ __typename?: 'ProductType'; value: string; label: string }>;
  };
};

export type GetStockLevelListQueryVariables = Exact<{
  productType: Scalars['String']['input'];
}>;

export type GetStockLevelListQuery = {
  __typename?: 'Query';
  stockLevelList: {
    __typename?: 'StockLevelListResult';
    totalCount: number;
    lastUpdated: any;
    records: Array<{
      __typename?: 'StockLevelRecord';
      uuid: string;
      stock: string;
      description: string;
      stockLevel: number;
      updateTime: any;
      productInfo?: {
        __typename?: 'ProductInfo';
        code: string;
        description: string;
        type: string;
        colour: string;
        standardQty?: number | null;
      } | null;
    }>;
  };
};

export type GetStockLevelChartQueryVariables = Exact<{
  productType: Scalars['String']['input'];
  days?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetStockLevelChartQuery = {
  __typename?: 'Query';
  stockLevelChart: {
    __typename?: 'StockLevelChartResult';
    productCodes: Array<string>;
    chartData: Array<{
      __typename?: 'StockLevelChartPoint';
      date: any;
      stockCode: string;
      stockLevel: number;
      description: string;
    }>;
    dateRange: { __typename?: 'DateRange'; start: any; end: any };
  };
};

export type ChartCardQueryQueryVariables = Exact<{
  input: ChartQueryInput;
}>;

export type ChartCardQueryQuery = {
  __typename?: 'Query';
  chartCardData: {
    __typename?: 'ChartCardData';
    labels?: Array<string> | null;
    lastUpdated: any;
    refreshInterval?: number | null;
    datasets: Array<{
      __typename?: 'ChartDataset';
      id: string;
      label: string;
      color?: string | null;
      backgroundColor?: string | null;
      borderColor?: string | null;
      type?: ChartDatasetType | null;
      stack?: string | null;
      hidden?: boolean | null;
      data: Array<{
        __typename?: 'ChartDataPoint';
        x: string;
        y: number;
        label?: string | null;
        value?: number | null;
        metadata?: any | null;
      }>;
    }>;
    config: {
      __typename?: 'ChartConfig';
      type: ChartType;
      title: string;
      description?: string | null;
      responsive?: boolean | null;
      maintainAspectRatio?: boolean | null;
      aspectRatio?: number | null;
      plugins?: any | null;
      animations?: any | null;
      xAxis?: {
        __typename?: 'ChartAxis';
        type: string;
        label?: string | null;
        min?: number | null;
        max?: number | null;
        stepSize?: number | null;
        format?: string | null;
        display?: boolean | null;
      } | null;
      yAxis?: {
        __typename?: 'ChartAxis';
        type: string;
        label?: string | null;
        min?: number | null;
        max?: number | null;
        stepSize?: number | null;
        format?: string | null;
        display?: boolean | null;
      } | null;
      legend?: {
        __typename?: 'ChartLegend';
        display: boolean;
        position?: string | null;
        align?: string | null;
        labels?: any | null;
      } | null;
      tooltip?: {
        __typename?: 'ChartTooltip';
        enabled: boolean;
        mode?: string | null;
        intersect?: boolean | null;
        callbacks?: any | null;
      } | null;
    };
    performance: {
      __typename?: 'PerformanceMetrics';
      totalQueries: number;
      cachedQueries: number;
      averageResponseTime: number;
      dataAge: number;
    };
  };
};

export const GetDepartmentInjectionDataDocument = gql`
  query GetDepartmentInjectionData {
    departmentInjectionData {
      stats {
        todayFinished
        past7Days
        past14Days
        lastUpdated
      }
      topStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
        }
        totalCount
      }
      materialStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
        }
        totalCount
      }
      machineStates {
        machineNumber
        lastActiveTime
        state
      }
      loading
      error
    }
  }
`;

/**
 * __useGetDepartmentInjectionDataQuery__
 *
 * To run a query within a React component, call `useGetDepartmentInjectionDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDepartmentInjectionDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDepartmentInjectionDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDepartmentInjectionDataQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetDepartmentInjectionDataQuery,
    GetDepartmentInjectionDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    GetDepartmentInjectionDataQuery,
    GetDepartmentInjectionDataQueryVariables
  >(GetDepartmentInjectionDataDocument, options);
}
export function useGetDepartmentInjectionDataLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetDepartmentInjectionDataQuery,
    GetDepartmentInjectionDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetDepartmentInjectionDataQuery,
    GetDepartmentInjectionDataQueryVariables
  >(GetDepartmentInjectionDataDocument, options);
}
export function useGetDepartmentInjectionDataSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetDepartmentInjectionDataQuery,
        GetDepartmentInjectionDataQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetDepartmentInjectionDataQuery,
    GetDepartmentInjectionDataQueryVariables
  >(GetDepartmentInjectionDataDocument, options);
}
export type GetDepartmentInjectionDataQueryHookResult = ReturnType<
  typeof useGetDepartmentInjectionDataQuery
>;
export type GetDepartmentInjectionDataLazyQueryHookResult = ReturnType<
  typeof useGetDepartmentInjectionDataLazyQuery
>;
export type GetDepartmentInjectionDataSuspenseQueryHookResult = ReturnType<
  typeof useGetDepartmentInjectionDataSuspenseQuery
>;
export type GetDepartmentInjectionDataQueryResult = Apollo.QueryResult<
  GetDepartmentInjectionDataQuery,
  GetDepartmentInjectionDataQueryVariables
>;
export const GetDepartmentPipeDataDocument = gql`
  query GetDepartmentPipeData {
    departmentPipeData {
      stats {
        todayFinished
        past7Days
        past14Days
        lastUpdated
      }
      topStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
      materialStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
      machineStates {
        machineNumber
        lastActiveTime
        state
        efficiency
        currentTask
        nextMaintenance
      }
      pipeProductionRate
      materialConsumptionRate
      loading
      error
    }
  }
`;

/**
 * __useGetDepartmentPipeDataQuery__
 *
 * To run a query within a React component, call `useGetDepartmentPipeDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDepartmentPipeDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDepartmentPipeDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDepartmentPipeDataQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetDepartmentPipeDataQuery,
    GetDepartmentPipeDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetDepartmentPipeDataQuery, GetDepartmentPipeDataQueryVariables>(
    GetDepartmentPipeDataDocument,
    options
  );
}
export function useGetDepartmentPipeDataLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetDepartmentPipeDataQuery,
    GetDepartmentPipeDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetDepartmentPipeDataQuery,
    GetDepartmentPipeDataQueryVariables
  >(GetDepartmentPipeDataDocument, options);
}
export function useGetDepartmentPipeDataSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetDepartmentPipeDataQuery,
        GetDepartmentPipeDataQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetDepartmentPipeDataQuery,
    GetDepartmentPipeDataQueryVariables
  >(GetDepartmentPipeDataDocument, options);
}
export type GetDepartmentPipeDataQueryHookResult = ReturnType<typeof useGetDepartmentPipeDataQuery>;
export type GetDepartmentPipeDataLazyQueryHookResult = ReturnType<
  typeof useGetDepartmentPipeDataLazyQuery
>;
export type GetDepartmentPipeDataSuspenseQueryHookResult = ReturnType<
  typeof useGetDepartmentPipeDataSuspenseQuery
>;
export type GetDepartmentPipeDataQueryResult = Apollo.QueryResult<
  GetDepartmentPipeDataQuery,
  GetDepartmentPipeDataQueryVariables
>;
export const GetDepartmentWarehouseDataDocument = gql`
  query GetDepartmentWarehouseData {
    departmentWarehouseData {
      stats {
        todayTransferred
        past7Days
        past14Days
        lastUpdated
      }
      recentActivities {
        time
        staff
        action
        detail
      }
      orderCompletions {
        orderRef
        productQty
        loadedQty
        completionPercentage
        latestUpdate
        hasPdf
        docUrl
      }
      loading
      error
    }
  }
`;

/**
 * __useGetDepartmentWarehouseDataQuery__
 *
 * To run a query within a React component, call `useGetDepartmentWarehouseDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDepartmentWarehouseDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDepartmentWarehouseDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDepartmentWarehouseDataQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetDepartmentWarehouseDataQuery,
    GetDepartmentWarehouseDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    GetDepartmentWarehouseDataQuery,
    GetDepartmentWarehouseDataQueryVariables
  >(GetDepartmentWarehouseDataDocument, options);
}
export function useGetDepartmentWarehouseDataLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetDepartmentWarehouseDataQuery,
    GetDepartmentWarehouseDataQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetDepartmentWarehouseDataQuery,
    GetDepartmentWarehouseDataQueryVariables
  >(GetDepartmentWarehouseDataDocument, options);
}
export function useGetDepartmentWarehouseDataSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetDepartmentWarehouseDataQuery,
        GetDepartmentWarehouseDataQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetDepartmentWarehouseDataQuery,
    GetDepartmentWarehouseDataQueryVariables
  >(GetDepartmentWarehouseDataDocument, options);
}
export type GetDepartmentWarehouseDataQueryHookResult = ReturnType<
  typeof useGetDepartmentWarehouseDataQuery
>;
export type GetDepartmentWarehouseDataLazyQueryHookResult = ReturnType<
  typeof useGetDepartmentWarehouseDataLazyQuery
>;
export type GetDepartmentWarehouseDataSuspenseQueryHookResult = ReturnType<
  typeof useGetDepartmentWarehouseDataSuspenseQuery
>;
export type GetDepartmentWarehouseDataQueryResult = Apollo.QueryResult<
  GetDepartmentWarehouseDataQuery,
  GetDepartmentWarehouseDataQueryVariables
>;
export const GetOrderDetailsDocument = gql`
  query GetOrderDetails($orderRef: String!) {
    warehouseOrder(orderRef: $orderRef) {
      id
      orderRef
      customerName
      status
      totalQuantity
      loadedQuantity
      remainingQuantity
      createdAt
      updatedAt
      items {
        id
        productCode
        productDesc
        quantity
        loadedQuantity
        status
      }
    }
  }
`;

/**
 * __useGetOrderDetailsQuery__
 *
 * To run a query within a React component, call `useGetOrderDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrderDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrderDetailsQuery({
 *   variables: {
 *      orderRef: // value for 'orderRef'
 *   },
 * });
 */
export function useGetOrderDetailsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetOrderDetailsQuery,
    GetOrderDetailsQueryVariables
  > &
    ({ variables: GetOrderDetailsQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetOrderDetailsQuery, GetOrderDetailsQueryVariables>(
    GetOrderDetailsDocument,
    options
  );
}
export function useGetOrderDetailsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetOrderDetailsQuery,
    GetOrderDetailsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetOrderDetailsQuery, GetOrderDetailsQueryVariables>(
    GetOrderDetailsDocument,
    options
  );
}
export function useGetOrderDetailsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetOrderDetailsQuery, GetOrderDetailsQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetOrderDetailsQuery, GetOrderDetailsQueryVariables>(
    GetOrderDetailsDocument,
    options
  );
}
export type GetOrderDetailsQueryHookResult = ReturnType<typeof useGetOrderDetailsQuery>;
export type GetOrderDetailsLazyQueryHookResult = ReturnType<typeof useGetOrderDetailsLazyQuery>;
export type GetOrderDetailsSuspenseQueryHookResult = ReturnType<
  typeof useGetOrderDetailsSuspenseQuery
>;
export type GetOrderDetailsQueryResult = Apollo.QueryResult<
  GetOrderDetailsQuery,
  GetOrderDetailsQueryVariables
>;
export const GetProductTypesDocument = gql`
  query GetProductTypes {
    productFormOptions {
      types {
        value
        label
      }
    }
  }
`;

/**
 * __useGetProductTypesQuery__
 *
 * To run a query within a React component, call `useGetProductTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProductTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProductTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetProductTypesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetProductTypesQuery,
    GetProductTypesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetProductTypesQuery, GetProductTypesQueryVariables>(
    GetProductTypesDocument,
    options
  );
}
export function useGetProductTypesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetProductTypesQuery,
    GetProductTypesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetProductTypesQuery, GetProductTypesQueryVariables>(
    GetProductTypesDocument,
    options
  );
}
export function useGetProductTypesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetProductTypesQuery, GetProductTypesQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetProductTypesQuery, GetProductTypesQueryVariables>(
    GetProductTypesDocument,
    options
  );
}
export type GetProductTypesQueryHookResult = ReturnType<typeof useGetProductTypesQuery>;
export type GetProductTypesLazyQueryHookResult = ReturnType<typeof useGetProductTypesLazyQuery>;
export type GetProductTypesSuspenseQueryHookResult = ReturnType<
  typeof useGetProductTypesSuspenseQuery
>;
export type GetProductTypesQueryResult = Apollo.QueryResult<
  GetProductTypesQuery,
  GetProductTypesQueryVariables
>;
export const GetStockLevelListDocument = gql`
  query GetStockLevelList($productType: String!) {
    stockLevelList(productType: $productType) {
      records {
        uuid
        stock
        description
        stockLevel
        updateTime
        productInfo {
          code
          description
          type
          colour
          standardQty
        }
      }
      totalCount
      lastUpdated
    }
  }
`;

/**
 * __useGetStockLevelListQuery__
 *
 * To run a query within a React component, call `useGetStockLevelListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStockLevelListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStockLevelListQuery({
 *   variables: {
 *      productType: // value for 'productType'
 *   },
 * });
 */
export function useGetStockLevelListQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetStockLevelListQuery,
    GetStockLevelListQueryVariables
  > &
    ({ variables: GetStockLevelListQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetStockLevelListQuery, GetStockLevelListQueryVariables>(
    GetStockLevelListDocument,
    options
  );
}
export function useGetStockLevelListLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetStockLevelListQuery,
    GetStockLevelListQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetStockLevelListQuery, GetStockLevelListQueryVariables>(
    GetStockLevelListDocument,
    options
  );
}
export function useGetStockLevelListSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetStockLevelListQuery,
        GetStockLevelListQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetStockLevelListQuery, GetStockLevelListQueryVariables>(
    GetStockLevelListDocument,
    options
  );
}
export type GetStockLevelListQueryHookResult = ReturnType<typeof useGetStockLevelListQuery>;
export type GetStockLevelListLazyQueryHookResult = ReturnType<typeof useGetStockLevelListLazyQuery>;
export type GetStockLevelListSuspenseQueryHookResult = ReturnType<
  typeof useGetStockLevelListSuspenseQuery
>;
export type GetStockLevelListQueryResult = Apollo.QueryResult<
  GetStockLevelListQuery,
  GetStockLevelListQueryVariables
>;
export const GetStockLevelChartDocument = gql`
  query GetStockLevelChart($productType: String!, $days: Int = 21) {
    stockLevelChart(productType: $productType, days: $days) {
      chartData {
        date
        stockCode
        stockLevel
        description
      }
      productCodes
      dateRange {
        start
        end
      }
    }
  }
`;

/**
 * __useGetStockLevelChartQuery__
 *
 * To run a query within a React component, call `useGetStockLevelChartQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStockLevelChartQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStockLevelChartQuery({
 *   variables: {
 *      productType: // value for 'productType'
 *      days: // value for 'days'
 *   },
 * });
 */
export function useGetStockLevelChartQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetStockLevelChartQuery,
    GetStockLevelChartQueryVariables
  > &
    ({ variables: GetStockLevelChartQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetStockLevelChartQuery, GetStockLevelChartQueryVariables>(
    GetStockLevelChartDocument,
    options
  );
}
export function useGetStockLevelChartLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetStockLevelChartQuery,
    GetStockLevelChartQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetStockLevelChartQuery, GetStockLevelChartQueryVariables>(
    GetStockLevelChartDocument,
    options
  );
}
export function useGetStockLevelChartSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetStockLevelChartQuery,
        GetStockLevelChartQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetStockLevelChartQuery,
    GetStockLevelChartQueryVariables
  >(GetStockLevelChartDocument, options);
}
export type GetStockLevelChartQueryHookResult = ReturnType<typeof useGetStockLevelChartQuery>;
export type GetStockLevelChartLazyQueryHookResult = ReturnType<
  typeof useGetStockLevelChartLazyQuery
>;
export type GetStockLevelChartSuspenseQueryHookResult = ReturnType<
  typeof useGetStockLevelChartSuspenseQuery
>;
export type GetStockLevelChartQueryResult = Apollo.QueryResult<
  GetStockLevelChartQuery,
  GetStockLevelChartQueryVariables
>;
export const ChartCardQueryDocument = gql`
  query ChartCardQuery($input: ChartQueryInput!) {
    chartCardData(input: $input) {
      datasets {
        id
        label
        data {
          x
          y
          label
          value
          metadata
        }
        color
        backgroundColor
        borderColor
        type
        stack
        hidden
      }
      labels
      config {
        type
        title
        description
        responsive
        maintainAspectRatio
        aspectRatio
        xAxis {
          type
          label
          min
          max
          stepSize
          format
          display
        }
        yAxis {
          type
          label
          min
          max
          stepSize
          format
          display
        }
        legend {
          display
          position
          align
          labels
        }
        tooltip {
          enabled
          mode
          intersect
          callbacks
        }
        plugins
        animations
      }
      performance {
        totalQueries
        cachedQueries
        averageResponseTime
        dataAge
      }
      lastUpdated
      refreshInterval
    }
  }
`;

/**
 * __useChartCardQueryQuery__
 *
 * To run a query within a React component, call `useChartCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useChartCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useChartCardQueryQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useChartCardQueryQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    ChartCardQueryQuery,
    ChartCardQueryQueryVariables
  > &
    ({ variables: ChartCardQueryQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<ChartCardQueryQuery, ChartCardQueryQueryVariables>(
    ChartCardQueryDocument,
    options
  );
}
export function useChartCardQueryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    ChartCardQueryQuery,
    ChartCardQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<ChartCardQueryQuery, ChartCardQueryQueryVariables>(
    ChartCardQueryDocument,
    options
  );
}
export function useChartCardQuerySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<ChartCardQueryQuery, ChartCardQueryQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<ChartCardQueryQuery, ChartCardQueryQueryVariables>(
    ChartCardQueryDocument,
    options
  );
}
export type ChartCardQueryQueryHookResult = ReturnType<typeof useChartCardQueryQuery>;
export type ChartCardQueryLazyQueryHookResult = ReturnType<typeof useChartCardQueryLazyQuery>;
export type ChartCardQuerySuspenseQueryHookResult = ReturnType<
  typeof useChartCardQuerySuspenseQuery
>;
export type ChartCardQueryQueryResult = Apollo.QueryResult<
  ChartCardQueryQuery,
  ChartCardQueryQueryVariables
>;
