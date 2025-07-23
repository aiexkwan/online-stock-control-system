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
  DateTime: { input: any; output: any };
  File: { input: any; output: any };
  JSON: { input: any; output: any };
  TableRow: { input: any; output: any };
  Upload: { input: any; output: any };
};

export type AiAnalysisConfig = {
  __typename?: 'AIAnalysisConfig';
  confidenceThreshold: Scalars['Float']['output'];
  enableAnomalyDetection: Scalars['Boolean']['output'];
  enablePredictions: Scalars['Boolean']['output'];
  languages: Array<Scalars['String']['output']>;
  maxTokens: Scalars['Int']['output'];
  modelType: Scalars['String']['output'];
  temperature: Scalars['Float']['output'];
};

export type AiInsight = {
  __typename?: 'AIInsight';
  confidence: Scalars['Float']['output'];
  content: Scalars['String']['output'];
  generatedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  modelUsed?: Maybe<Scalars['String']['output']>;
  processingTime?: Maybe<Scalars['Float']['output']>;
  recommendations: Array<Scalars['String']['output']>;
  relatedData?: Maybe<Scalars['JSON']['output']>;
  severity: InsightSeverity;
  title: Scalars['String']['output'];
  type: InsightType;
};

export type Address = {
  __typename?: 'Address';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  postalCode: Scalars['String']['output'];
  state?: Maybe<Scalars['String']['output']>;
  street: Scalars['String']['output'];
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

export enum AlertSeverity {
  Critical = 'CRITICAL',
  Error = 'ERROR',
  Info = 'INFO',
  Warning = 'WARNING',
}

export enum AlertType {
  InventoryLow = 'INVENTORY_LOW',
  PerformanceDegradation = 'PERFORMANCE_DEGRADATION',
  QualityIssue = 'QUALITY_ISSUE',
  SecurityAlert = 'SECURITY_ALERT',
  SystemError = 'SYSTEM_ERROR',
  TransferDelayed = 'TRANSFER_DELAYED',
}

export type AnalysisCardData = {
  __typename?: 'AnalysisCardData';
  aiInsights: Array<AiInsight>;
  analysisType: AnalysisType;
  cached: Scalars['Boolean']['output'];
  detailData: AnalysisDetailData;
  executionTime: Scalars['Float']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  metadata: AnalysisMetadata;
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  summary: AnalysisSummary;
  visualizations: Array<AnalysisVisualization>;
};

export type AnalysisCardInput = {
  analysisType: AnalysisType;
  filters?: InputMaybe<AnalysisFilters>;
  includeAIInsights?: InputMaybe<Scalars['Boolean']['input']>;
  timeRange?: InputMaybe<DateRangeInput>;
  urgency?: InputMaybe<AnalysisUrgency>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type AnalysisDetailData = {
  __typename?: 'AnalysisDetailData';
  comparisons: Array<Comparison>;
  correlations: Array<Correlation>;
  dataPoints: Array<DataPoint>;
  sections: Array<AnalysisSection>;
};

export type AnalysisFilters = {
  customFilters?: InputMaybe<Scalars['JSON']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  productCategories?: InputMaybe<Array<Scalars['String']['input']>>;
  statusFilters?: InputMaybe<Array<Scalars['String']['input']>>;
  warehouse?: InputMaybe<Scalars['String']['input']>;
};

export type AnalysisGenerationInput = {
  analysisType: AnalysisType;
  description?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<AnalysisFilters>;
  includeAI?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  urgency?: InputMaybe<AnalysisUrgency>;
  userId: Scalars['String']['input'];
};

export type AnalysisGenerationResponse = {
  __typename?: 'AnalysisGenerationResponse';
  analysisId?: Maybe<Scalars['String']['output']>;
  estimatedCompletionTime?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  progress?: Maybe<Scalars['Float']['output']>;
  success: Scalars['Boolean']['output'];
};

export type AnalysisMetadata = {
  __typename?: 'AnalysisMetadata';
  aiModelVersion?: Maybe<Scalars['String']['output']>;
  analysisId: Scalars['String']['output'];
  dataPeriod: Scalars['String']['output'];
  dataSource: Scalars['String']['output'];
  generatedAt: Scalars['DateTime']['output'];
  processingSteps: Array<ProcessingStep>;
  recordsAnalyzed: Scalars['Int']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

export type AnalysisMetrics = {
  __typename?: 'AnalysisMetrics';
  fulfillment_rate: Scalars['Float']['output'];
  inventory_gap: Scalars['Int']['output'];
  status: InventoryStatus;
};

export type AnalysisProgress = {
  __typename?: 'AnalysisProgress';
  analysisType: AnalysisType;
  currentStep: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  estimatedTimeRemaining?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  progress: Scalars['Float']['output'];
  startedAt: Scalars['DateTime']['output'];
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type AnalysisSection = {
  __typename?: 'AnalysisSection';
  content: Scalars['String']['output'];
  data: Scalars['JSON']['output'];
  id: Scalars['String']['output'];
  importance: Scalars['String']['output'];
  title: Scalars['String']['output'];
  visualizationType?: Maybe<Scalars['String']['output']>;
};

export type AnalysisSummary = {
  __typename?: 'AnalysisSummary';
  alertLevel: Scalars['String']['output'];
  description: Scalars['String']['output'];
  keyMetrics: Array<KeyMetric>;
  overallScore?: Maybe<Scalars['Float']['output']>;
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export enum AnalysisType {
  AnomalyDetection = 'ANOMALY_DETECTION',
  InventoryOrderMatching = 'INVENTORY_ORDER_MATCHING',
  OperationalDashboard = 'OPERATIONAL_DASHBOARD',
  PerformanceAnalysis = 'PERFORMANCE_ANALYSIS',
  TrendForecasting = 'TREND_FORECASTING',
}

export enum AnalysisUrgency {
  Fast = 'FAST',
  Normal = 'NORMAL',
  Thorough = 'THOROUGH',
}

export type AnalysisVisualization = {
  __typename?: 'AnalysisVisualization';
  config: Scalars['JSON']['output'];
  data: Scalars['JSON']['output'];
  exportable: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  interactive: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
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

export type AppliedNumberFilter = {
  __typename?: 'AppliedNumberFilter';
  field: Scalars['String']['output'];
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  operator: NumberOperator;
  value?: Maybe<Scalars['Float']['output']>;
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
  ContainsAll = 'CONTAINS_ALL',
  ContainsAny = 'CONTAINS_ANY',
  In = 'IN',
  NotIn = 'NOT_IN',
}

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

export type BooleanFilter = {
  field: Scalars['String']['input'];
  value: Scalars['Boolean']['input'];
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

export type ChartCardData = WidgetData & {
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

export enum ColumnAlign {
  Center = 'CENTER',
  Left = 'LEFT',
  Right = 'RIGHT',
}

export type ColumnFormatter = {
  __typename?: 'ColumnFormatter';
  options?: Maybe<Scalars['JSON']['output']>;
  type: FormatterType;
};

export type Comparison = {
  __typename?: 'Comparison';
  baseline: Scalars['Float']['output'];
  change: Scalars['Float']['output'];
  changePercent: Scalars['Float']['output'];
  current: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  timeframe: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ComparisonData = {
  __typename?: 'ComparisonData';
  change: Scalars['Float']['output'];
  changePercentage: Scalars['Float']['output'];
  previousLabel: Scalars['String']['output'];
  previousValue: Scalars['Float']['output'];
};

export type Correlation = {
  __typename?: 'Correlation';
  coefficient: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  interpretation: Scalars['String']['output'];
  significance: Scalars['Float']['output'];
  strength: Scalars['String']['output'];
  variables: Array<Scalars['String']['output']>;
};

export type CreateProductInput = {
  chinesedescription?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  colour?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  standardQty?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
  volumePerPiece?: InputMaybe<Scalars['Float']['input']>;
  weightPerPiece?: InputMaybe<Scalars['Float']['input']>;
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

export type CreateTransferInput = {
  pltNum: Scalars['String']['input'];
  priority?: InputMaybe<TransferPriority>;
  quantity: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  toLocation: Scalars['String']['input'];
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

export type DataPoint = {
  __typename?: 'DataPoint';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  timestamp: Scalars['DateTime']['output'];
  value: Scalars['Float']['output'];
};

export enum DataSourceType {
  Auto = 'AUTO',
  Cache = 'CACHE',
  Graphql = 'GRAPHQL',
  Rest = 'REST',
}

export type DateFilter = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  field: Scalars['String']['input'];
  operator: DateOperator;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  value?: InputMaybe<Scalars['DateTime']['input']>;
};

export enum DateOperator {
  After = 'AFTER',
  Before = 'BEFORE',
  Between = 'BETWEEN',
  Equals = 'EQUALS',
  Last_7Days = 'LAST_7_DAYS',
  Last_30Days = 'LAST_30_DAYS',
  LastMonth = 'LAST_MONTH',
  ThisMonth = 'THIS_MONTH',
  Today = 'TODAY',
  Yesterday = 'YESTERDAY',
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

export type DepartmentEfficiency = {
  __typename?: 'DepartmentEfficiency';
  department: Scalars['String']['output'];
  efficiency: Scalars['Float']['output'];
  headcount: Scalars['Int']['output'];
  outputPerPerson: Scalars['Float']['output'];
};

export type EfficiencyMetrics = WidgetData & {
  __typename?: 'EfficiencyMetrics';
  averageTaskTime: Scalars['Float']['output'];
  dataSource: Scalars['String']['output'];
  efficiencyByDepartment: Array<DepartmentEfficiency>;
  efficiencyByShift: Array<ShiftEfficiency>;
  efficiencyTrends: Array<TrendPoint>;
  idleTimePercentage: Scalars['Float']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  overallEfficiency: Scalars['Float']['output'];
  productivityIndex: Scalars['Float']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  tasksPerHour: Scalars['Float']['output'];
  utilizationRate: Scalars['Float']['output'];
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
  Excel = 'EXCEL',
  Json = 'JSON',
  Pdf = 'PDF',
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
  checksum?: Maybe<Scalars['String']['output']>;
  extension: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  folder: UploadFolder;
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  originalName: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  uploadedAt: Scalars['DateTime']['output'];
  uploadedBy: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
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

export enum FormatterType {
  Badge = 'BADGE',
  Boolean = 'BOOLEAN',
  Currency = 'CURRENCY',
  Custom = 'CUSTOM',
  Date = 'DATE',
  Datetime = 'DATETIME',
  Default = 'DEFAULT',
  Link = 'LINK',
  Percentage = 'PERCENTAGE',
  Truncate = 'TRUNCATE',
}

export type Grn = {
  __typename?: 'GRN';
  completedDate?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  grnNumber: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  items: Array<GrnItem>;
  qcBy?: Maybe<User>;
  qcCompletedDate?: Maybe<Scalars['DateTime']['output']>;
  qcStatus?: Maybe<QcStatus>;
  receivedDate: Scalars['DateTime']['output'];
  status: GrnStatus;
  supplier: Supplier;
  supplierCode: Scalars['String']['output'];
  totalItems: Scalars['Int']['output'];
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
  standardQty: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

export type HistoryRecord = {
  __typename?: 'HistoryRecord';
  action: Scalars['String']['output'];
  changes?: Maybe<Array<FieldChange>>;
  entityData?: Maybe<Scalars['JSON']['output']>;
  entityId: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  newValue?: Maybe<Scalars['JSON']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  performedBy: User;
  previousValue?: Maybe<Scalars['JSON']['output']>;
  recordType: HistoryType;
  timestamp: Scalars['DateTime']['output'];
  userAgent?: Maybe<Scalars['String']['output']>;
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
  Grn = 'GRN',
  Inventory = 'INVENTORY',
  Order = 'ORDER',
  Pallet = 'PALLET',
  Product = 'PRODUCT',
  System = 'SYSTEM',
  Transfer = 'TRANSFER',
  User = 'USER',
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

export enum InsightSeverity {
  Critical = 'CRITICAL',
  Info = 'INFO',
  Optimization = 'OPTIMIZATION',
  Warning = 'WARNING',
}

export enum InsightType {
  AnomalyDetection = 'ANOMALY_DETECTION',
  OptimizationSuggestion = 'OPTIMIZATION_SUGGESTION',
  PerformanceInsight = 'PERFORMANCE_INSIGHT',
  PredictiveForecast = 'PREDICTIVE_FORECAST',
  RiskAssessment = 'RISK_ASSESSMENT',
  TrendAnalysis = 'TREND_ANALYSIS',
}

export type Inventory = {
  __typename?: 'Inventory';
  availableQuantity: Scalars['Int']['output'];
  awaitQuantity: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  lastMovement?: Maybe<Scalars['DateTime']['output']>;
  lastStocktake?: Maybe<Scalars['DateTime']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  locationQuantities: LocationInventory;
  product: Product;
  productCode: Scalars['String']['output'];
  reservedQuantity: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
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

export type KeyMetric = {
  __typename?: 'KeyMetric';
  change?: Maybe<Scalars['Float']['output']>;
  changeDirection: Scalars['String']['output'];
  name: Scalars['String']['output'];
  trend?: Maybe<Array<TrendPoint>>;
  unit?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

export type Location = {
  __typename?: 'Location';
  capacity?: Maybe<Scalars['Int']['output']>;
  code: Scalars['String']['output'];
  currentOccupancy?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  type: LocationType;
  warehouse: Warehouse;
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

export type LocationInventory = {
  __typename?: 'LocationInventory';
  await: Scalars['Int']['output'];
  backcarpark: Scalars['Int']['output'];
  bulk: Scalars['Int']['output'];
  damage: Scalars['Int']['output'];
  fold: Scalars['Int']['output'];
  injection: Scalars['Int']['output'];
  pipeline: Scalars['Int']['output'];
  prebook: Scalars['Int']['output'];
};

export enum LocationType {
  Await = 'AWAIT',
  Backcarpark = 'BACKCARPARK',
  Bulk = 'BULK',
  Damage = 'DAMAGE',
  Fold = 'FOLD',
  Injection = 'INJECTION',
  Pipeline = 'PIPELINE',
  Prebook = 'PREBOOK',
}

export type Mutation = {
  __typename?: 'Mutation';
  batchOperation: BatchOperationResult;
  batchReportOperation: BatchReportResult;
  cancelAnalysis: Scalars['Boolean']['output'];
  cancelReportGeneration: Scalars['Boolean']['output'];
  cancelTransfer: Transfer;
  cancelUpload: Scalars['Boolean']['output'];
  clearCache: Scalars['Boolean']['output'];
  clearTableCache: Scalars['Boolean']['output'];
  createProduct: Product;
  createReportTemplate: ReportTemplate;
  createTransfer: Transfer;
  deactivateProduct: Product;
  deleteFile: Scalars['Boolean']['output'];
  deleteFiles: BatchResult;
  deleteReport: Scalars['Boolean']['output'];
  deleteReportTemplate: Scalars['Boolean']['output'];
  exportTableData: ExportResult;
  extendReportExpiry: GeneratedReport;
  generateAnalysis: AnalysisGenerationResponse;
  generateReport: ReportGenerationResult;
  reanalyzeOrderPDF: OrderAnalysisResult;
  refreshAnalysis: Scalars['Boolean']['output'];
  refreshCache: Scalars['Boolean']['output'];
  refreshTableData: Scalars['Boolean']['output'];
  regenerateReport: ReportGenerationResult;
  retryUpload: SingleUploadResult;
  shareReport: Scalars['Boolean']['output'];
  updateAnalysisConfig: Scalars['Boolean']['output'];
  updateFileMetadata: FileInfo;
  updateProduct: Product;
  updateReportTemplate: ReportTemplate;
  updateTransferStatus: Transfer;
  uploadBatchFiles: BatchUploadResult;
  uploadSingleFile: SingleUploadResult;
};

export type MutationBatchOperationArgs = {
  operations: Array<BatchOperationInput>;
};

export type MutationBatchReportOperationArgs = {
  input: BatchReportOperationInput;
};

export type MutationCancelAnalysisArgs = {
  analysisId: Scalars['ID']['input'];
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

export type MutationClearTableCacheArgs = {
  dataSource: Scalars['String']['input'];
};

export type MutationCreateProductArgs = {
  input: CreateProductInput;
};

export type MutationCreateReportTemplateArgs = {
  input: CreateReportTemplateInput;
};

export type MutationCreateTransferArgs = {
  input: CreateTransferInput;
};

export type MutationDeactivateProductArgs = {
  code: Scalars['ID']['input'];
};

export type MutationDeleteFileArgs = {
  fileId: Scalars['ID']['input'];
};

export type MutationDeleteFilesArgs = {
  fileIds: Array<Scalars['ID']['input']>;
};

export type MutationDeleteReportArgs = {
  reportId: Scalars['ID']['input'];
};

export type MutationDeleteReportTemplateArgs = {
  templateId: Scalars['ID']['input'];
};

export type MutationExportTableDataArgs = {
  input: ExportTableInput;
};

export type MutationExtendReportExpiryArgs = {
  days: Scalars['Int']['input'];
  reportId: Scalars['ID']['input'];
};

export type MutationGenerateAnalysisArgs = {
  input: AnalysisGenerationInput;
};

export type MutationGenerateReportArgs = {
  input: ReportGenerationInput;
};

export type MutationReanalyzeOrderPdfArgs = {
  fileId: Scalars['ID']['input'];
};

export type MutationRefreshAnalysisArgs = {
  analysisId: Scalars['ID']['input'];
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

export type MutationRetryUploadArgs = {
  uploadId: Scalars['ID']['input'];
};

export type MutationShareReportArgs = {
  emails: Array<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  reportId: Scalars['ID']['input'];
};

export type MutationUpdateAnalysisConfigArgs = {
  config: Scalars['JSON']['input'];
};

export type MutationUpdateFileMetadataArgs = {
  fileId: Scalars['ID']['input'];
  metadata: Scalars['JSON']['input'];
};

export type MutationUpdateProductArgs = {
  code: Scalars['ID']['input'];
  input: UpdateProductInput;
};

export type MutationUpdateReportTemplateArgs = {
  input: UpdateReportTemplateInput;
  templateId: Scalars['ID']['input'];
};

export type MutationUpdateTransferStatusArgs = {
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status: TransferStatus;
};

export type MutationUploadBatchFilesArgs = {
  input: BatchUploadInput;
};

export type MutationUploadSingleFileArgs = {
  input: SingleFileUploadInput;
};

export type NumberFilter = {
  field: Scalars['String']['input'];
  max?: InputMaybe<Scalars['Float']['input']>;
  min?: InputMaybe<Scalars['Float']['input']>;
  operator: NumberOperator;
  value?: InputMaybe<Scalars['Float']['input']>;
};

export enum NumberOperator {
  Between = 'BETWEEN',
  Equals = 'EQUALS',
  Gt = 'GT',
  Gte = 'GTE',
  Lt = 'LT',
  Lte = 'LTE',
  NotEquals = 'NOT_EQUALS',
}

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

export type Order = {
  __typename?: 'Order';
  billingAddress?: Maybe<Address>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  customer: Customer;
  customerCode: Scalars['String']['output'];
  deliveredDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  items: Array<OrderItem>;
  orderDate: Scalars['DateTime']['output'];
  orderNumber: Scalars['String']['output'];
  paymentStatus?: Maybe<PaymentStatus>;
  requiredDate?: Maybe<Scalars['DateTime']['output']>;
  shippedDate?: Maybe<Scalars['DateTime']['output']>;
  shippingAddress: Address;
  shippingStatus?: Maybe<ShippingStatus>;
  status: OrderStatus;
  totalItems: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
  totalValue: Scalars['Float']['output'];
  trackingNumber?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
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
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export enum PaginationStyle {
  Cursor = 'CURSOR',
  LoadMore = 'LOAD_MORE',
  Offset = 'OFFSET',
}

export type Pallet = {
  __typename?: 'Pallet';
  batchNumber?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  expiryDate?: Maybe<Scalars['DateTime']['output']>;
  grn?: Maybe<Grn>;
  grnNumber?: Maybe<Scalars['String']['output']>;
  history: Array<HistoryRecord>;
  lastModifiedBy?: Maybe<User>;
  location?: Maybe<Location>;
  manufactureDate?: Maybe<Scalars['DateTime']['output']>;
  pltNum: Scalars['ID']['output'];
  product: Product;
  productCode: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  status: PalletStatus;
  transfers: TransferConnection;
  updatedAt: Scalars['DateTime']['output'];
};

export type PalletHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

export type PalletTransfersArgs = {
  filter?: InputMaybe<TransferFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};

export type PalletConnection = {
  __typename?: 'PalletConnection';
  edges: Array<PalletEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
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

export enum PalletStatus {
  Active = 'ACTIVE',
  Damaged = 'DAMAGED',
  Shipped = 'SHIPPED',
  Transferred = 'TRANSFERRED',
  Void = 'VOID',
}

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

export type ProcessingStep = {
  __typename?: 'ProcessingStep';
  details?: Maybe<Scalars['String']['output']>;
  duration: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  step: Scalars['String']['output'];
};

export type Product = {
  __typename?: 'Product';
  chinesedescription?: Maybe<Scalars['String']['output']>;
  code: Scalars['ID']['output'];
  colour?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  inventory?: Maybe<InventorySummary>;
  isActive: Scalars['Boolean']['output'];
  pallets: PalletConnection;
  standardQty?: Maybe<Scalars['Int']['output']>;
  statistics?: Maybe<ProductStatistics>;
  type?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  volumePerPiece?: Maybe<Scalars['Float']['output']>;
  weightPerPiece?: Maybe<Scalars['Float']['output']>;
};

export type ProductPalletsArgs = {
  filter?: InputMaybe<PalletFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
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

export type ProductStatistics = {
  __typename?: 'ProductStatistics';
  averageStockLevel: Scalars['Float']['output'];
  lastMovementDate?: Maybe<Scalars['DateTime']['output']>;
  stockTurnoverRate?: Maybe<Scalars['Float']['output']>;
  totalLocations: Scalars['Int']['output'];
  totalPallets: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export enum QcStatus {
  Failed = 'FAILED',
  PartialPass = 'PARTIAL_PASS',
  Passed = 'PASSED',
  Pending = 'PENDING',
}

export type QualityMetrics = WidgetData & {
  __typename?: 'QualityMetrics';
  dataSource: Scalars['String']['output'];
  defectRate: Scalars['Float']['output'];
  defectTrends: Array<TrendPoint>;
  defectsByProduct: Array<ProductDefectMetric>;
  defectsByType: Array<DefectTypeMetric>;
  failedInspections: Scalars['Int']['output'];
  firstPassYield: Scalars['Float']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  overallScore: Scalars['Float']['output'];
  passedInspections: Scalars['Int']['output'];
  pendingInspections: Scalars['Int']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  totalInspections: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  aiAnalysisConfig: AiAnalysisConfig;
  analysisCardData: AnalysisCardData;
  analysisProgress?: Maybe<AnalysisProgress>;
  availableCharts: Array<ChartConfig>;
  availableReportFields: Array<ReportField>;
  availableStats: Array<StatsConfig>;
  batchWidgetData: Array<WidgetDataResponse>;
  chartCardData: ChartCardData;
  chartData: ChartCardData;
  efficiencyMetrics: EfficiencyMetrics;
  estimateReportTime: Scalars['Int']['output'];
  fileInfo?: Maybe<FileInfo>;
  health: SystemStatus;
  historyTree: HistoryTreeResult;
  inventories: Array<Inventory>;
  inventory?: Maybe<Inventory>;
  inventoryOrderedAnalysis: InventoryOrderedAnalysisResult;
  order?: Maybe<Order>;
  orderAnalysisResult?: Maybe<OrderAnalysisResult>;
  orders: OrderConnection;
  pallet?: Maybe<Pallet>;
  pallets: PalletConnection;
  product?: Maybe<Product>;
  productStatistics: ProductStatistics;
  products: ProductConnection;
  qualityMetrics: QualityMetrics;
  reportCardData: ReportCardData;
  reportConfig: ReportConfig;
  reportDetails?: Maybe<GeneratedReport>;
  reportProgress: Array<ReportGenerationProgress>;
  reportTemplates: Array<ReportTemplate>;
  searchFiles: FileSearchResult;
  searchProducts: Array<Product>;
  searchReports: ReportSearchResult;
  statData: StatsData;
  statsCardData: StatsCardData;
  stockDistribution: StockDistributionResult;
  stockLevels: StockLevelData;
  systemPerformance: SystemPerformance;
  tableCardData: TableCardData;
  tableColumns: Array<TableColumn>;
  tablePermissions: TablePermissions;
  topProductsByQuantity: TopProductsResult;
  transfer?: Maybe<Transfer>;
  transfers: TransferConnection;
  unifiedOperations: UnifiedOperationsData;
  updateStatistics: UpdateStatistics;
  uploadCardData: UploadCardData;
  uploadConfig: UploadConfig;
  uploadProgress: Array<UploadProgress>;
  uploadStatistics: UploadStatistics;
  widgetData: Scalars['JSON']['output'];
  workLevel?: Maybe<WorkLevel>;
  workLevels: Array<WorkLevel>;
};

export type QueryAnalysisCardDataArgs = {
  input: AnalysisCardInput;
};

export type QueryAnalysisProgressArgs = {
  analysisId: Scalars['ID']['input'];
};

export type QueryAvailableChartsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAvailableReportFieldsArgs = {
  reportType: ReportType;
};

export type QueryAvailableStatsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  includeDisabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QueryBatchWidgetDataArgs = {
  requests: Array<WidgetDataRequest>;
};

export type QueryChartCardDataArgs = {
  input: ChartQueryInput;
};

export type QueryChartDataArgs = {
  input: SingleChartQueryInput;
};

export type QueryEfficiencyMetricsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  departments?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type QueryEstimateReportTimeArgs = {
  input: ReportGenerationInput;
};

export type QueryFileInfoArgs = {
  id: Scalars['ID']['input'];
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

export type QueryOrderArgs = {
  orderNumber: Scalars['String']['input'];
};

export type QueryOrderAnalysisResultArgs = {
  uploadId: Scalars['ID']['input'];
};

export type QueryOrdersArgs = {
  filter?: InputMaybe<OrderFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type QueryPalletArgs = {
  pltNum: Scalars['ID']['input'];
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

export type QueryStatDataArgs = {
  input: SingleStatQueryInput;
};

export type QueryStatsCardDataArgs = {
  input: StatsQueryInput;
};

export type QueryStockDistributionArgs = {
  input?: InputMaybe<StockDistributionInput>;
};

export type QueryStockLevelsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  warehouse?: InputMaybe<Scalars['String']['input']>;
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

export type QueryWidgetDataArgs = {
  dataSource: Scalars['String']['input'];
  params?: InputMaybe<Scalars['JSON']['input']>;
  timeFrame?: InputMaybe<DateRangeInput>;
};

export type QueryWorkLevelArgs = {
  date: Scalars['DateTime']['input'];
  userId: Scalars['ID']['input'];
};

export type QueryWorkLevelsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
  userIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type ReportAggregation = {
  alias?: InputMaybe<Scalars['String']['input']>;
  field: Scalars['String']['input'];
  function: AggregationFunction;
};

export type ReportCardData = WidgetData & {
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

export type ReportField = {
  __typename?: 'ReportField';
  aggregatable: Scalars['Boolean']['output'];
  dataType: TableDataType;
  filterable: Scalars['Boolean']['output'];
  groupable: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  required: Scalars['Boolean']['output'];
};

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

export type StatsCardData = WidgetData & {
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
  AwaitLocationQty = 'AWAIT_LOCATION_QTY',
  InjectionProductionStats = 'INJECTION_PRODUCTION_STATS',
  ProductionStats = 'PRODUCTION_STATS',
  StaffWorkload = 'STAFF_WORKLOAD',
  StillInAwait = 'STILL_IN_AWAIT',
  StillInAwaitPercentage = 'STILL_IN_AWAIT_PERCENTAGE',
  StockLevelHistory = 'STOCK_LEVEL_HISTORY',
  TransferTimeDistribution = 'TRANSFER_TIME_DISTRIBUTION',
  WarehouseWorkLevel = 'WAREHOUSE_WORK_LEVEL',
  YesterdayTransferCount = 'YESTERDAY_TRANSFER_COUNT',
}

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

export type StockLevelData = WidgetData & {
  __typename?: 'StockLevelData';
  dataSource: Scalars['String']['output'];
  items: Array<StockLevelItem>;
  lastUpdated: Scalars['DateTime']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
  totalItems: Scalars['Int']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type StockLevelItem = {
  __typename?: 'StockLevelItem';
  lastUpdated: Scalars['DateTime']['output'];
  location: Scalars['String']['output'];
  productCode: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
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
  Equals = 'EQUALS',
  NotContains = 'NOT_CONTAINS',
  NotEquals = 'NOT_EQUALS',
  StartsWith = 'STARTS_WITH',
}

export type Subscription = {
  __typename?: 'Subscription';
  analysisCompleted: OrderAnalysisResult;
  chartUpdated: ChartCardData;
  fileUploaded: FileInfo;
  inventoryUpdated: Inventory;
  newReportAvailable: GeneratedReport;
  orderStatusChanged: Order;
  reportGenerated: GeneratedReport;
  reportGenerationError: Scalars['String']['output'];
  reportProgressUpdated: ReportGenerationProgress;
  statsUpdated: StatsData;
  systemAlert: SystemAlert;
  tableDataUpdated: TableCardData;
  transferStatusChanged: Transfer;
  uploadError: Scalars['String']['output'];
  uploadProgressUpdated: UploadProgress;
};

export type SubscriptionAnalysisCompletedArgs = {
  uploadId: Scalars['ID']['input'];
};

export type SubscriptionChartUpdatedArgs = {
  chartTypes: Array<ChartType>;
};

export type SubscriptionFileUploadedArgs = {
  folder?: InputMaybe<UploadFolder>;
};

export type SubscriptionInventoryUpdatedArgs = {
  productCodes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionNewReportAvailableArgs = {
  reportTypes: Array<ReportType>;
};

export type SubscriptionOrderStatusChangedArgs = {
  orderNumbers?: InputMaybe<Array<Scalars['String']['input']>>;
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

export type SubscriptionStatsUpdatedArgs = {
  types: Array<StatsType>;
};

export type SubscriptionSystemAlertArgs = {
  severity?: InputMaybe<AlertSeverity>;
};

export type SubscriptionTableDataUpdatedArgs = {
  dataSource: Scalars['String']['input'];
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
  address?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  contact?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  grns: GrnConnection;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  products?: Maybe<Array<Product>>;
  statistics?: Maybe<SupplierStatistics>;
  updatedAt: Scalars['DateTime']['output'];
};

export type SupplierGrnsArgs = {
  filter?: InputMaybe<GrnFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
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

export type SystemPerformance = WidgetData & {
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

export type TableCardData = WidgetData & {
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
  align?: Maybe<ColumnAlign>;
  dataType: TableDataType;
  filterable: Scalars['Boolean']['output'];
  formatter?: Maybe<ColumnFormatter>;
  header: Scalars['String']['output'];
  hidden?: Maybe<Scalars['Boolean']['output']>;
  key: Scalars['String']['output'];
  required?: Maybe<Scalars['Boolean']['output']>;
  sortable: Scalars['Boolean']['output'];
  width?: Maybe<Scalars['String']['output']>;
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

export enum TableDataType {
  Array = 'ARRAY',
  Boolean = 'BOOLEAN',
  Date = 'DATE',
  Datetime = 'DATETIME',
  Json = 'JSON',
  Number = 'NUMBER',
  Object = 'OBJECT',
  String = 'STRING',
}

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

export enum TimeGranularity {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE',
  Month = 'MONTH',
  Quarter = 'QUARTER',
  Week = 'WEEK',
  Year = 'YEAR',
}

export enum TimeWindow {
  Last_5Minutes = 'LAST_5_MINUTES',
  Last_7Days = 'LAST_7_DAYS',
  Last_15Minutes = 'LAST_15_MINUTES',
  Last_24Hours = 'LAST_24_HOURS',
  Last_30Days = 'LAST_30_DAYS',
  LastHour = 'LAST_HOUR',
}

export type TopProduct = {
  __typename?: 'TopProduct';
  colour: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  locationQuantities: TopProductLocationQuantities;
  productCode: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  productType: Scalars['String']['output'];
  standardQty: Scalars['Int']['output'];
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
  actualDuration?: Maybe<Scalars['Int']['output']>;
  approvedBy?: Maybe<User>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  estimatedDuration?: Maybe<Scalars['Int']['output']>;
  executedBy?: Maybe<User>;
  fromLocation: Location;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  pallet: Pallet;
  pltNum: Scalars['String']['output'];
  priority?: Maybe<TransferPriority>;
  quantity: Scalars['Int']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  requestedAt: Scalars['DateTime']['output'];
  requestedBy: User;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status: TransferStatus;
  toLocation: Location;
  transferNumber: Scalars['String']['output'];
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

export type UnifiedOperationsData = WidgetData & {
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

export type UpdateProductInput = {
  chinesedescription?: InputMaybe<Scalars['String']['input']>;
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

export type UpdateStatistics = WidgetData & {
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

export type UpdateTypeMetric = {
  __typename?: 'UpdateTypeMetric';
  averageTime: Scalars['Float']['output'];
  count: Scalars['Int']['output'];
  successRate: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export type UploadCardData = WidgetData & {
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

export type UploadStatistics = WidgetData & {
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
  createdAt: Scalars['DateTime']['output'];
  department?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  role: UserRole;
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

export type WidgetData = {
  dataSource: Scalars['String']['output'];
  lastUpdated: Scalars['DateTime']['output'];
  refreshInterval?: Maybe<Scalars['Int']['output']>;
};

export type WidgetDataRequest = {
  dataSource: Scalars['String']['input'];
  params?: InputMaybe<Scalars['JSON']['input']>;
  timeFrame?: InputMaybe<DateRangeInput>;
  widgetId: Scalars['String']['input'];
};

export type WidgetDataResponse = {
  __typename?: 'WidgetDataResponse';
  cached: Scalars['Boolean']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  error?: Maybe<Error>;
  executionTime: Scalars['Float']['output'];
  source: DataSourceType;
  widgetId: Scalars['String']['output'];
};

export type WorkLevel = {
  __typename?: 'WorkLevel';
  averageTransferTime: Scalars['Float']['output'];
  date: Scalars['DateTime']['output'];
  efficiency: Scalars['Float']['output'];
  errorRate: Scalars['Float']['output'];
  productivityScore: Scalars['Float']['output'];
  totalPalletsHandled: Scalars['Int']['output'];
  totalQuantityMoved: Scalars['Int']['output'];
  totalTransfers: Scalars['Int']['output'];
  transfersByHour: Array<HourlyBreakdown>;
  transfersByLocation: Array<LocationBreakdown>;
  user: User;
  userId: Scalars['ID']['output'];
};

export type AnalysisCardQueryQueryVariables = Exact<{
  input: AnalysisCardInput;
}>;

export type AnalysisCardQueryQuery = {
  __typename?: 'Query';
  analysisCardData: {
    __typename?: 'AnalysisCardData';
    analysisType: AnalysisType;
    executionTime: number;
    cached: boolean;
    lastUpdated: any;
    refreshInterval?: number | null;
    summary: {
      __typename?: 'AnalysisSummary';
      title: string;
      description: string;
      overallScore?: number | null;
      status: string;
      alertLevel: string;
      keyMetrics: Array<{
        __typename?: 'KeyMetric';
        name: string;
        value: string;
        change?: number | null;
        changeDirection: string;
        unit?: string | null;
        trend?: Array<{
          __typename?: 'TrendPoint';
          timestamp: any;
          value: number;
          label?: string | null;
        }> | null;
      }>;
    };
    detailData: {
      __typename?: 'AnalysisDetailData';
      sections: Array<{
        __typename?: 'AnalysisSection';
        id: string;
        title: string;
        content: string;
        data: any;
        visualizationType?: string | null;
        importance: string;
      }>;
      dataPoints: Array<{
        __typename?: 'DataPoint';
        id: string;
        label: string;
        value: number;
        timestamp: any;
        category?: string | null;
        metadata?: any | null;
      }>;
      comparisons: Array<{
        __typename?: 'Comparison';
        id: string;
        title: string;
        baseline: number;
        current: number;
        change: number;
        changePercent: number;
        timeframe: string;
      }>;
      correlations: Array<{
        __typename?: 'Correlation';
        id: string;
        variables: Array<string>;
        coefficient: number;
        strength: string;
        significance: number;
        interpretation: string;
      }>;
    };
    aiInsights: Array<{
      __typename?: 'AIInsight';
      id: string;
      type: InsightType;
      confidence: number;
      title: string;
      content: string;
      recommendations: Array<string>;
      severity: InsightSeverity;
      relatedData?: any | null;
      generatedAt: any;
      modelUsed?: string | null;
      processingTime?: number | null;
    }>;
    visualizations: Array<{
      __typename?: 'AnalysisVisualization';
      id: string;
      type: string;
      title: string;
      data: any;
      config: any;
      interactive: boolean;
      exportable: boolean;
    }>;
    metadata: {
      __typename?: 'AnalysisMetadata';
      analysisId: string;
      userId: string;
      generatedAt: any;
      dataSource: string;
      dataPeriod: string;
      recordsAnalyzed: number;
      aiModelVersion?: string | null;
      processingSteps: Array<{
        __typename?: 'ProcessingStep';
        step: string;
        duration: number;
        status: string;
        details?: string | null;
      }>;
    };
  };
};

export type GenerateAnalysisMutationVariables = Exact<{
  input: AnalysisGenerationInput;
}>;

export type GenerateAnalysisMutation = {
  __typename?: 'Mutation';
  generateAnalysis: {
    __typename?: 'AnalysisGenerationResponse';
    id: string;
    analysisId?: string | null;
    success: boolean;
    message: string;
    estimatedCompletionTime?: any | null;
    progress?: number | null;
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

export type ReportCardQueryQueryVariables = Exact<{
  input: ReportCardInput;
}>;

export type ReportCardQueryQuery = {
  __typename?: 'Query';
  reportCardData: {
    __typename?: 'ReportCardData';
    reportType: ReportType;
    lastUpdated: any;
    refreshInterval?: number | null;
    dataSource: string;
    config: {
      __typename?: 'ReportConfig';
      reportType: ReportType;
      title: string;
      description?: string | null;
      formats: Array<ReportFormat>;
      maxFileSize: number;
      retentionDays: number;
      requireAuth: boolean;
      allowScheduling: boolean;
      supportsFiltering: boolean;
      supportsGrouping: boolean;
      estimatedGenerationTime?: number | null;
    };
    recentReports: Array<{
      __typename?: 'GeneratedReport';
      id: string;
      reportType: ReportType;
      title: string;
      description?: string | null;
      format: ReportFormat;
      status: ReportStatus;
      fileName?: string | null;
      fileSize?: number | null;
      downloadUrl?: string | null;
      expiresAt?: any | null;
      generatedAt: any;
      generatedBy: string;
      generationTime?: number | null;
      recordCount?: number | null;
      priority: ReportPriority;
      downloadCount: number;
      lastDownloaded?: any | null;
      error?: string | null;
    }>;
    activeGenerations: Array<{
      __typename?: 'ReportGenerationProgress';
      id: string;
      reportType: ReportType;
      title: string;
      status: ReportStatus;
      progress: number;
      estimatedTimeRemaining?: number | null;
      recordsProcessed?: number | null;
      totalRecords?: number | null;
      error?: string | null;
      startedAt: any;
      userId: string;
    }>;
    templates: Array<{
      __typename?: 'ReportTemplate';
      id: string;
      name: string;
      reportType: ReportType;
      description?: string | null;
      config: any;
      filters?: any | null;
      grouping?: any | null;
      isPublic: boolean;
      createdBy: string;
      createdAt: any;
      lastUsed?: any | null;
      usageCount: number;
    }>;
    statistics: {
      __typename?: 'ReportStatistics';
      totalReports: number;
      todayReports: number;
      pendingReports: number;
      completedReports: number;
      failedReports: number;
      averageGenerationTime: number;
      successRate: number;
      diskUsage: number;
      quotaUsage: number;
    };
  };
};

export type GenerateReportMutationVariables = Exact<{
  input: ReportGenerationInput;
}>;

export type GenerateReportMutation = {
  __typename?: 'Mutation';
  generateReport: {
    __typename?: 'ReportGenerationResult';
    id: string;
    reportId: string;
    success: boolean;
    message?: string | null;
    estimatedCompletionTime?: any | null;
    progress?: number | null;
  };
};

export type CancelReportGenerationMutationVariables = Exact<{
  generationId: Scalars['ID']['input'];
}>;

export type CancelReportGenerationMutation = {
  __typename?: 'Mutation';
  cancelReportGeneration: boolean;
};

export type DeleteReportMutationVariables = Exact<{
  reportId: Scalars['ID']['input'];
}>;

export type DeleteReportMutation = { __typename?: 'Mutation'; deleteReport: boolean };

export type StatsCardQueryQueryVariables = Exact<{
  input: StatsQueryInput;
}>;

export type StatsCardQueryQuery = {
  __typename?: 'Query';
  statsCardData: {
    __typename?: 'StatsCardData';
    lastUpdated: any;
    refreshInterval?: number | null;
    stats: Array<{
      __typename?: 'StatsData';
      type: StatsType;
      value: number;
      label: string;
      unit: string;
      lastUpdated: any;
      dataSource: string;
      optimized: boolean;
      trend?: {
        __typename?: 'TrendData';
        direction: TrendDirection;
        value: number;
        percentage: number;
        label?: string | null;
      } | null;
      comparison?: {
        __typename?: 'ComparisonData';
        previousValue: number;
        previousLabel: string;
        change: number;
        changePercentage: number;
      } | null;
    }>;
    configs: Array<{
      __typename?: 'StatsConfig';
      type: StatsType;
      title: string;
      description?: string | null;
      icon?: string | null;
      color?: string | null;
    }>;
    performance: {
      __typename?: 'PerformanceMetrics';
      totalQueries: number;
      cachedQueries: number;
      averageResponseTime: number;
      dataAge: number;
    };
  };
};

export type TableCardQueryQueryVariables = Exact<{
  input: TableDataInput;
}>;

export type TableCardQueryQuery = {
  __typename?: 'Query';
  tableCardData: {
    __typename?: 'TableCardData';
    data: Array<any>;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage?: number | null;
    totalPages?: number | null;
    lastUpdated: any;
    refreshInterval?: number | null;
    columns: Array<{
      __typename?: 'TableColumn';
      key: string;
      header: string;
      dataType: TableDataType;
      sortable: boolean;
      filterable: boolean;
      width?: string | null;
      align?: ColumnAlign | null;
      required?: boolean | null;
      hidden?: boolean | null;
      formatter?: {
        __typename?: 'ColumnFormatter';
        type: FormatterType;
        options?: any | null;
      } | null;
    }>;
    filters?: {
      __typename?: 'AppliedTableFilters';
      stringFilters?: Array<{
        __typename?: 'AppliedStringFilter';
        field: string;
        operator: StringOperator;
        value: string;
        caseSensitive: boolean;
      }> | null;
      numberFilters?: Array<{
        __typename?: 'AppliedNumberFilter';
        field: string;
        operator: NumberOperator;
        value?: number | null;
        min?: number | null;
        max?: number | null;
      }> | null;
      dateFilters?: Array<{
        __typename?: 'AppliedDateFilter';
        field: string;
        operator: DateOperator;
        value?: any | null;
        startDate?: any | null;
        endDate?: any | null;
      }> | null;
      booleanFilters?: Array<{
        __typename?: 'AppliedBooleanFilter';
        field: string;
        value: boolean;
      }> | null;
      arrayFilters?: Array<{
        __typename?: 'AppliedArrayFilter';
        field: string;
        operator: ArrayOperator;
        values: Array<string>;
      }> | null;
    } | null;
    sorting?: {
      __typename?: 'AppliedTableSorting';
      sortBy: string;
      sortOrder: SortDirection;
      secondarySort?: {
        __typename?: 'AppliedTableSorting';
        sortBy: string;
        sortOrder: SortDirection;
      } | null;
    } | null;
    metadata: {
      __typename?: 'TableMetadata';
      queryTime: number;
      cacheHit: boolean;
      dataSource: string;
      lastUpdated: any;
      totalRecords: number;
      filteredRecords: number;
      generatedAt: any;
      permissions: {
        __typename?: 'TablePermissions';
        canView: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canCreate: boolean;
        canExport: boolean;
        canFilter: boolean;
        canSort: boolean;
      };
    };
  };
};

export type UploadCardQueryQueryVariables = Exact<{
  input: UploadCardInput;
}>;

export type UploadCardQueryQuery = {
  __typename?: 'Query';
  uploadCardData: {
    __typename?: 'UploadCardData';
    uploadType: UploadType;
    lastUpdated: any;
    refreshInterval?: number | null;
    dataSource: string;
    config: {
      __typename?: 'UploadConfig';
      uploadType: UploadType;
      allowedTypes: Array<SupportedFileType>;
      maxFileSize: number;
      maxFiles?: number | null;
      folder: UploadFolder;
      requiresAnalysis: boolean;
      allowMultiple: boolean;
      supportsDragDrop: boolean;
      supportsPreview: boolean;
    };
    recentUploads: Array<{
      __typename?: 'FileInfo';
      id: string;
      originalName: string;
      fileName: string;
      size: number;
      extension: string;
      uploadedAt: any;
      url?: string | null;
      thumbnailUrl?: string | null;
    }>;
    activeUploads: Array<{
      __typename?: 'UploadProgress';
      id: string;
      fileName: string;
      progress: number;
      status: UploadStatus;
      error?: string | null;
      bytesUploaded?: number | null;
      totalBytes?: number | null;
    }>;
    statistics: {
      __typename?: 'UploadStatistics';
      totalUploads: number;
      totalSize: number;
      successRate: number;
      todayUploads: number;
      popularFileTypes: Array<{
        __typename?: 'FileTypeStats';
        type: SupportedFileType;
        count: number;
        totalSize: number;
      }>;
    };
  };
};

export type UploadSingleFileMutationVariables = Exact<{
  input: SingleFileUploadInput;
}>;

export type UploadSingleFileMutation = {
  __typename?: 'Mutation';
  uploadSingleFile: {
    __typename?: 'SingleUploadResult';
    id: string;
    fileName: string;
    success: boolean;
    error?: string | null;
    fileInfo?: {
      __typename?: 'FileInfo';
      id: string;
      originalName: string;
      fileName: string;
      size: number;
      extension: string;
      folder: UploadFolder;
      uploadedAt: any;
      url?: string | null;
      thumbnailUrl?: string | null;
    } | null;
    analysisResult?: {
      __typename?: 'OrderAnalysisResult';
      success: boolean;
      recordCount: number;
      processingTime: number;
      confidence?: number | null;
      extractedData?: Array<{
        __typename?: 'OrderData';
        orderNumber: string;
        customerName?: string | null;
        orderDate?: any | null;
        totalAmount?: number | null;
      }> | null;
    } | null;
  };
};

export type HistoryTreeQueryVariables = Exact<{
  input?: InputMaybe<HistoryTreeInput>;
}>;

export type HistoryTreeQuery = {
  __typename?: 'Query';
  historyTree: {
    __typename?: 'HistoryTreeResult';
    totalCount: number;
    hasNextPage: boolean;
    groupedData?: any | null;
    limit: number;
    offset: number;
    entries: Array<{
      __typename?: 'HistoryEntry';
      id: string;
      timestamp: any;
      action: string;
      location?: string | null;
      remark?: string | null;
      user?: {
        __typename?: 'HistoryUser';
        id: string;
        name: string;
        department?: string | null;
        position?: string | null;
        email?: string | null;
      } | null;
      pallet?: {
        __typename?: 'HistoryPallet';
        number: string;
        series?: string | null;
        quantity: number;
        generatedAt?: any | null;
        product?: {
          __typename?: 'HistoryProduct';
          code: string;
          description: string;
          type: string;
          colour: string;
          standardQty: number;
        } | null;
      } | null;
    }>;
    filters: {
      __typename?: 'HistoryTreeFilters';
      actionTypes?: Array<string> | null;
      userIds?: Array<string> | null;
      palletNumbers?: Array<string> | null;
      locations?: Array<string> | null;
      dateRange?: { __typename?: 'DateRange'; start: any; end: any } | null;
    };
    sort: {
      __typename?: 'HistoryTreeSort';
      sortBy: HistoryTreeSortField;
      sortOrder: SortDirection;
    };
  };
};

export type InventoryOrderedAnalysisQueryVariables = Exact<{
  input?: InputMaybe<InventoryOrderedAnalysisInput>;
}>;

export type InventoryOrderedAnalysisQuery = {
  __typename?: 'Query';
  inventoryOrderedAnalysis: {
    __typename?: 'InventoryOrderedAnalysisResult';
    success: boolean;
    generated_at: any;
    summary: {
      __typename?: 'InventoryAnalysisSummary';
      total_products: number;
      total_inventory_value: number;
      total_outstanding_orders_value: number;
      overall_fulfillment_rate: number;
      products_sufficient: number;
      products_insufficient: number;
      products_out_of_stock: number;
      products_no_orders: number;
    };
    data: Array<{
      __typename?: 'InventoryAnalysisItem';
      product_code: string;
      product_description: string;
      product_type: string;
      standard_qty: number;
      inventory: {
        __typename?: 'InventoryDetails';
        total: number;
        last_update?: any | null;
        locations?: {
          __typename?: 'LocationBreakdown';
          injection: number;
          pipeline: number;
          prebook: number;
          await: number;
          fold: number;
          bulk: number;
          backcarpark: number;
          damage: number;
          await_grn: number;
        } | null;
      };
      orders: {
        __typename?: 'OrderDetails';
        total_orders: number;
        total_ordered_qty: number;
        total_loaded_qty: number;
        total_outstanding_qty: number;
      };
      analysis: {
        __typename?: 'AnalysisMetrics';
        fulfillment_rate: number;
        inventory_gap: number;
        status: InventoryStatus;
      };
    }>;
  };
};

export type TopProductsByQuantityQueryVariables = Exact<{
  input?: InputMaybe<TopProductsInput>;
}>;

export type TopProductsByQuantityQuery = {
  __typename?: 'Query';
  topProductsByQuantity: {
    __typename?: 'TopProductsResult';
    totalCount: number;
    averageQuantity: number;
    maxQuantity: number;
    minQuantity: number;
    lastUpdated: any;
    dataSource: string;
    refreshInterval?: number | null;
    products: Array<{
      __typename?: 'TopProduct';
      productCode: string;
      productName: string;
      productType: string;
      colour: string;
      standardQty: number;
      totalQuantity: number;
      lastUpdated: any;
      locationQuantities: {
        __typename?: 'TopProductLocationQuantities';
        injection: number;
        pipeline: number;
        prebook: number;
        await: number;
        fold: number;
        bulk: number;
        backcarpark: number;
        damage: number;
        await_grn: number;
      };
    }>;
  };
};

export const AnalysisCardQueryDocument = gql`
  query AnalysisCardQuery($input: AnalysisCardInput!) {
    analysisCardData(input: $input) {
      analysisType
      summary {
        title
        description
        keyMetrics {
          name
          value
          change
          changeDirection
          unit
          trend {
            timestamp
            value
            label
          }
        }
        overallScore
        status
        alertLevel
      }
      detailData {
        sections {
          id
          title
          content
          data
          visualizationType
          importance
        }
        dataPoints {
          id
          label
          value
          timestamp
          category
          metadata
        }
        comparisons {
          id
          title
          baseline
          current
          change
          changePercent
          timeframe
        }
        correlations {
          id
          variables
          coefficient
          strength
          significance
          interpretation
        }
      }
      aiInsights {
        id
        type
        confidence
        title
        content
        recommendations
        severity
        relatedData
        generatedAt
        modelUsed
        processingTime
      }
      visualizations {
        id
        type
        title
        data
        config
        interactive
        exportable
      }
      metadata {
        analysisId
        userId
        generatedAt
        dataSource
        dataPeriod
        recordsAnalyzed
        aiModelVersion
        processingSteps {
          step
          duration
          status
          details
        }
      }
      executionTime
      cached
      lastUpdated
      refreshInterval
    }
  }
`;

/**
 * __useAnalysisCardQueryQuery__
 *
 * To run a query within a React component, call `useAnalysisCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useAnalysisCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAnalysisCardQueryQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAnalysisCardQueryQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    AnalysisCardQueryQuery,
    AnalysisCardQueryQueryVariables
  > &
    ({ variables: AnalysisCardQueryQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<AnalysisCardQueryQuery, AnalysisCardQueryQueryVariables>(
    AnalysisCardQueryDocument,
    options
  );
}
export function useAnalysisCardQueryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AnalysisCardQueryQuery,
    AnalysisCardQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<AnalysisCardQueryQuery, AnalysisCardQueryQueryVariables>(
    AnalysisCardQueryDocument,
    options
  );
}
export function useAnalysisCardQuerySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        AnalysisCardQueryQuery,
        AnalysisCardQueryQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<AnalysisCardQueryQuery, AnalysisCardQueryQueryVariables>(
    AnalysisCardQueryDocument,
    options
  );
}
export type AnalysisCardQueryQueryHookResult = ReturnType<typeof useAnalysisCardQueryQuery>;
export type AnalysisCardQueryLazyQueryHookResult = ReturnType<typeof useAnalysisCardQueryLazyQuery>;
export type AnalysisCardQuerySuspenseQueryHookResult = ReturnType<
  typeof useAnalysisCardQuerySuspenseQuery
>;
export type AnalysisCardQueryQueryResult = Apollo.QueryResult<
  AnalysisCardQueryQuery,
  AnalysisCardQueryQueryVariables
>;
export const GenerateAnalysisDocument = gql`
  mutation GenerateAnalysis($input: AnalysisGenerationInput!) {
    generateAnalysis(input: $input) {
      id
      analysisId
      success
      message
      estimatedCompletionTime
      progress
    }
  }
`;
export type GenerateAnalysisMutationFn = Apollo.MutationFunction<
  GenerateAnalysisMutation,
  GenerateAnalysisMutationVariables
>;

/**
 * __useGenerateAnalysisMutation__
 *
 * To run a mutation, you first call `useGenerateAnalysisMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateAnalysisMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateAnalysisMutation, { data, loading, error }] = useGenerateAnalysisMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGenerateAnalysisMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    GenerateAnalysisMutation,
    GenerateAnalysisMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<GenerateAnalysisMutation, GenerateAnalysisMutationVariables>(
    GenerateAnalysisDocument,
    options
  );
}
export type GenerateAnalysisMutationHookResult = ReturnType<typeof useGenerateAnalysisMutation>;
export type GenerateAnalysisMutationResult = Apollo.MutationResult<GenerateAnalysisMutation>;
export type GenerateAnalysisMutationOptions = Apollo.BaseMutationOptions<
  GenerateAnalysisMutation,
  GenerateAnalysisMutationVariables
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
export const ReportCardQueryDocument = gql`
  query ReportCardQuery($input: ReportCardInput!) {
    reportCardData(input: $input) {
      reportType
      config {
        reportType
        title
        description
        formats
        maxFileSize
        retentionDays
        requireAuth
        allowScheduling
        supportsFiltering
        supportsGrouping
        estimatedGenerationTime
      }
      recentReports {
        id
        reportType
        title
        description
        format
        status
        fileName
        fileSize
        downloadUrl
        expiresAt
        generatedAt
        generatedBy
        generationTime
        recordCount
        priority
        downloadCount
        lastDownloaded
        error
      }
      activeGenerations {
        id
        reportType
        title
        status
        progress
        estimatedTimeRemaining
        recordsProcessed
        totalRecords
        error
        startedAt
        userId
      }
      templates {
        id
        name
        reportType
        description
        config
        filters
        grouping
        isPublic
        createdBy
        createdAt
        lastUsed
        usageCount
      }
      statistics {
        totalReports
        todayReports
        pendingReports
        completedReports
        failedReports
        averageGenerationTime
        successRate
        diskUsage
        quotaUsage
      }
      lastUpdated
      refreshInterval
      dataSource
    }
  }
`;

/**
 * __useReportCardQueryQuery__
 *
 * To run a query within a React component, call `useReportCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useReportCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReportCardQueryQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useReportCardQueryQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    ReportCardQueryQuery,
    ReportCardQueryQueryVariables
  > &
    ({ variables: ReportCardQueryQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<ReportCardQueryQuery, ReportCardQueryQueryVariables>(
    ReportCardQueryDocument,
    options
  );
}
export function useReportCardQueryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    ReportCardQueryQuery,
    ReportCardQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<ReportCardQueryQuery, ReportCardQueryQueryVariables>(
    ReportCardQueryDocument,
    options
  );
}
export function useReportCardQuerySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<ReportCardQueryQuery, ReportCardQueryQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<ReportCardQueryQuery, ReportCardQueryQueryVariables>(
    ReportCardQueryDocument,
    options
  );
}
export type ReportCardQueryQueryHookResult = ReturnType<typeof useReportCardQueryQuery>;
export type ReportCardQueryLazyQueryHookResult = ReturnType<typeof useReportCardQueryLazyQuery>;
export type ReportCardQuerySuspenseQueryHookResult = ReturnType<
  typeof useReportCardQuerySuspenseQuery
>;
export type ReportCardQueryQueryResult = Apollo.QueryResult<
  ReportCardQueryQuery,
  ReportCardQueryQueryVariables
>;
export const GenerateReportDocument = gql`
  mutation GenerateReport($input: ReportGenerationInput!) {
    generateReport(input: $input) {
      id
      reportId
      success
      message
      estimatedCompletionTime
      progress
    }
  }
`;
export type GenerateReportMutationFn = Apollo.MutationFunction<
  GenerateReportMutation,
  GenerateReportMutationVariables
>;

/**
 * __useGenerateReportMutation__
 *
 * To run a mutation, you first call `useGenerateReportMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateReportMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateReportMutation, { data, loading, error }] = useGenerateReportMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGenerateReportMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    GenerateReportMutation,
    GenerateReportMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<GenerateReportMutation, GenerateReportMutationVariables>(
    GenerateReportDocument,
    options
  );
}
export type GenerateReportMutationHookResult = ReturnType<typeof useGenerateReportMutation>;
export type GenerateReportMutationResult = Apollo.MutationResult<GenerateReportMutation>;
export type GenerateReportMutationOptions = Apollo.BaseMutationOptions<
  GenerateReportMutation,
  GenerateReportMutationVariables
>;
export const CancelReportGenerationDocument = gql`
  mutation CancelReportGeneration($generationId: ID!) {
    cancelReportGeneration(generationId: $generationId)
  }
`;
export type CancelReportGenerationMutationFn = Apollo.MutationFunction<
  CancelReportGenerationMutation,
  CancelReportGenerationMutationVariables
>;

/**
 * __useCancelReportGenerationMutation__
 *
 * To run a mutation, you first call `useCancelReportGenerationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelReportGenerationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelReportGenerationMutation, { data, loading, error }] = useCancelReportGenerationMutation({
 *   variables: {
 *      generationId: // value for 'generationId'
 *   },
 * });
 */
export function useCancelReportGenerationMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CancelReportGenerationMutation,
    CancelReportGenerationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CancelReportGenerationMutation,
    CancelReportGenerationMutationVariables
  >(CancelReportGenerationDocument, options);
}
export type CancelReportGenerationMutationHookResult = ReturnType<
  typeof useCancelReportGenerationMutation
>;
export type CancelReportGenerationMutationResult =
  Apollo.MutationResult<CancelReportGenerationMutation>;
export type CancelReportGenerationMutationOptions = Apollo.BaseMutationOptions<
  CancelReportGenerationMutation,
  CancelReportGenerationMutationVariables
>;
export const DeleteReportDocument = gql`
  mutation DeleteReport($reportId: ID!) {
    deleteReport(reportId: $reportId)
  }
`;
export type DeleteReportMutationFn = Apollo.MutationFunction<
  DeleteReportMutation,
  DeleteReportMutationVariables
>;

/**
 * __useDeleteReportMutation__
 *
 * To run a mutation, you first call `useDeleteReportMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteReportMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteReportMutation, { data, loading, error }] = useDeleteReportMutation({
 *   variables: {
 *      reportId: // value for 'reportId'
 *   },
 * });
 */
export function useDeleteReportMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteReportMutation,
    DeleteReportMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteReportMutation, DeleteReportMutationVariables>(
    DeleteReportDocument,
    options
  );
}
export type DeleteReportMutationHookResult = ReturnType<typeof useDeleteReportMutation>;
export type DeleteReportMutationResult = Apollo.MutationResult<DeleteReportMutation>;
export type DeleteReportMutationOptions = Apollo.BaseMutationOptions<
  DeleteReportMutation,
  DeleteReportMutationVariables
>;
export const StatsCardQueryDocument = gql`
  query StatsCardQuery($input: StatsQueryInput!) {
    statsCardData(input: $input) {
      stats {
        type
        value
        label
        unit
        trend {
          direction
          value
          percentage
          label
        }
        comparison {
          previousValue
          previousLabel
          change
          changePercentage
        }
        lastUpdated
        dataSource
        optimized
      }
      configs {
        type
        title
        description
        icon
        color
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
 * __useStatsCardQueryQuery__
 *
 * To run a query within a React component, call `useStatsCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useStatsCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStatsCardQueryQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useStatsCardQueryQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    StatsCardQueryQuery,
    StatsCardQueryQueryVariables
  > &
    ({ variables: StatsCardQueryQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<StatsCardQueryQuery, StatsCardQueryQueryVariables>(
    StatsCardQueryDocument,
    options
  );
}
export function useStatsCardQueryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    StatsCardQueryQuery,
    StatsCardQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<StatsCardQueryQuery, StatsCardQueryQueryVariables>(
    StatsCardQueryDocument,
    options
  );
}
export function useStatsCardQuerySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<StatsCardQueryQuery, StatsCardQueryQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<StatsCardQueryQuery, StatsCardQueryQueryVariables>(
    StatsCardQueryDocument,
    options
  );
}
export type StatsCardQueryQueryHookResult = ReturnType<typeof useStatsCardQueryQuery>;
export type StatsCardQueryLazyQueryHookResult = ReturnType<typeof useStatsCardQueryLazyQuery>;
export type StatsCardQuerySuspenseQueryHookResult = ReturnType<
  typeof useStatsCardQuerySuspenseQuery
>;
export type StatsCardQueryQueryResult = Apollo.QueryResult<
  StatsCardQueryQuery,
  StatsCardQueryQueryVariables
>;
export const TableCardQueryDocument = gql`
  query TableCardQuery($input: TableDataInput!) {
    tableCardData(input: $input) {
      data
      columns {
        key
        header
        dataType
        sortable
        filterable
        width
        align
        formatter {
          type
          options
        }
        required
        hidden
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
      filters {
        stringFilters {
          field
          operator
          value
          caseSensitive
        }
        numberFilters {
          field
          operator
          value
          min
          max
        }
        dateFilters {
          field
          operator
          value
          startDate
          endDate
        }
        booleanFilters {
          field
          value
        }
        arrayFilters {
          field
          operator
          values
        }
      }
      sorting {
        sortBy
        sortOrder
        secondarySort {
          sortBy
          sortOrder
        }
      }
      metadata {
        queryTime
        cacheHit
        dataSource
        lastUpdated
        totalRecords
        filteredRecords
        permissions {
          canView
          canEdit
          canDelete
          canCreate
          canExport
          canFilter
          canSort
        }
        generatedAt
      }
      lastUpdated
      refreshInterval
    }
  }
`;

/**
 * __useTableCardQueryQuery__
 *
 * To run a query within a React component, call `useTableCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useTableCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTableCardQueryQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTableCardQueryQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    TableCardQueryQuery,
    TableCardQueryQueryVariables
  > &
    ({ variables: TableCardQueryQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<TableCardQueryQuery, TableCardQueryQueryVariables>(
    TableCardQueryDocument,
    options
  );
}
export function useTableCardQueryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    TableCardQueryQuery,
    TableCardQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<TableCardQueryQuery, TableCardQueryQueryVariables>(
    TableCardQueryDocument,
    options
  );
}
export function useTableCardQuerySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<TableCardQueryQuery, TableCardQueryQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<TableCardQueryQuery, TableCardQueryQueryVariables>(
    TableCardQueryDocument,
    options
  );
}
export type TableCardQueryQueryHookResult = ReturnType<typeof useTableCardQueryQuery>;
export type TableCardQueryLazyQueryHookResult = ReturnType<typeof useTableCardQueryLazyQuery>;
export type TableCardQuerySuspenseQueryHookResult = ReturnType<
  typeof useTableCardQuerySuspenseQuery
>;
export type TableCardQueryQueryResult = Apollo.QueryResult<
  TableCardQueryQuery,
  TableCardQueryQueryVariables
>;
export const UploadCardQueryDocument = gql`
  query UploadCardQuery($input: UploadCardInput!) {
    uploadCardData(input: $input) {
      uploadType
      config {
        uploadType
        allowedTypes
        maxFileSize
        maxFiles
        folder
        requiresAnalysis
        allowMultiple
        supportsDragDrop
        supportsPreview
      }
      recentUploads {
        id
        originalName
        fileName
        size
        extension
        uploadedAt
        url
        thumbnailUrl
      }
      activeUploads {
        id
        fileName
        progress
        status
        error
        bytesUploaded
        totalBytes
      }
      statistics {
        totalUploads
        totalSize
        successRate
        todayUploads
        popularFileTypes {
          type
          count
          totalSize
        }
      }
      lastUpdated
      refreshInterval
      dataSource
    }
  }
`;

/**
 * __useUploadCardQueryQuery__
 *
 * To run a query within a React component, call `useUploadCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useUploadCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUploadCardQueryQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUploadCardQueryQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    UploadCardQueryQuery,
    UploadCardQueryQueryVariables
  > &
    ({ variables: UploadCardQueryQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<UploadCardQueryQuery, UploadCardQueryQueryVariables>(
    UploadCardQueryDocument,
    options
  );
}
export function useUploadCardQueryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    UploadCardQueryQuery,
    UploadCardQueryQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<UploadCardQueryQuery, UploadCardQueryQueryVariables>(
    UploadCardQueryDocument,
    options
  );
}
export function useUploadCardQuerySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<UploadCardQueryQuery, UploadCardQueryQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<UploadCardQueryQuery, UploadCardQueryQueryVariables>(
    UploadCardQueryDocument,
    options
  );
}
export type UploadCardQueryQueryHookResult = ReturnType<typeof useUploadCardQueryQuery>;
export type UploadCardQueryLazyQueryHookResult = ReturnType<typeof useUploadCardQueryLazyQuery>;
export type UploadCardQuerySuspenseQueryHookResult = ReturnType<
  typeof useUploadCardQuerySuspenseQuery
>;
export type UploadCardQueryQueryResult = Apollo.QueryResult<
  UploadCardQueryQuery,
  UploadCardQueryQueryVariables
>;
export const UploadSingleFileDocument = gql`
  mutation UploadSingleFile($input: SingleFileUploadInput!) {
    uploadSingleFile(input: $input) {
      id
      fileName
      success
      fileInfo {
        id
        originalName
        fileName
        size
        extension
        folder
        uploadedAt
        url
        thumbnailUrl
      }
      analysisResult {
        success
        recordCount
        processingTime
        extractedData {
          orderNumber
          customerName
          orderDate
          totalAmount
        }
        confidence
      }
      error
    }
  }
`;
export type UploadSingleFileMutationFn = Apollo.MutationFunction<
  UploadSingleFileMutation,
  UploadSingleFileMutationVariables
>;

/**
 * __useUploadSingleFileMutation__
 *
 * To run a mutation, you first call `useUploadSingleFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadSingleFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadSingleFileMutation, { data, loading, error }] = useUploadSingleFileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUploadSingleFileMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UploadSingleFileMutation,
    UploadSingleFileMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UploadSingleFileMutation, UploadSingleFileMutationVariables>(
    UploadSingleFileDocument,
    options
  );
}
export type UploadSingleFileMutationHookResult = ReturnType<typeof useUploadSingleFileMutation>;
export type UploadSingleFileMutationResult = Apollo.MutationResult<UploadSingleFileMutation>;
export type UploadSingleFileMutationOptions = Apollo.BaseMutationOptions<
  UploadSingleFileMutation,
  UploadSingleFileMutationVariables
>;
export const HistoryTreeDocument = gql`
  query HistoryTree($input: HistoryTreeInput) {
    historyTree(input: $input) {
      entries {
        id
        timestamp
        action
        location
        remark
        user {
          id
          name
          department
          position
          email
        }
        pallet {
          number
          series
          quantity
          generatedAt
          product {
            code
            description
            type
            colour
            standardQty
          }
        }
      }
      totalCount
      hasNextPage
      groupedData
      limit
      offset
      filters {
        dateRange {
          start
          end
        }
        actionTypes
        userIds
        palletNumbers
        locations
      }
      sort {
        sortBy
        sortOrder
      }
    }
  }
`;

/**
 * __useHistoryTreeQuery__
 *
 * To run a query within a React component, call `useHistoryTreeQuery` and pass it any options that fit your needs.
 * When your component renders, `useHistoryTreeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHistoryTreeQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useHistoryTreeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<HistoryTreeQuery, HistoryTreeQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<HistoryTreeQuery, HistoryTreeQueryVariables>(
    HistoryTreeDocument,
    options
  );
}
export function useHistoryTreeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<HistoryTreeQuery, HistoryTreeQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<HistoryTreeQuery, HistoryTreeQueryVariables>(
    HistoryTreeDocument,
    options
  );
}
export function useHistoryTreeSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<HistoryTreeQuery, HistoryTreeQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<HistoryTreeQuery, HistoryTreeQueryVariables>(
    HistoryTreeDocument,
    options
  );
}
export type HistoryTreeQueryHookResult = ReturnType<typeof useHistoryTreeQuery>;
export type HistoryTreeLazyQueryHookResult = ReturnType<typeof useHistoryTreeLazyQuery>;
export type HistoryTreeSuspenseQueryHookResult = ReturnType<typeof useHistoryTreeSuspenseQuery>;
export type HistoryTreeQueryResult = Apollo.QueryResult<
  HistoryTreeQuery,
  HistoryTreeQueryVariables
>;
export const InventoryOrderedAnalysisDocument = gql`
  query InventoryOrderedAnalysis($input: InventoryOrderedAnalysisInput) {
    inventoryOrderedAnalysis(input: $input) {
      success
      summary {
        total_products
        total_inventory_value
        total_outstanding_orders_value
        overall_fulfillment_rate
        products_sufficient
        products_insufficient
        products_out_of_stock
        products_no_orders
      }
      data {
        product_code
        product_description
        product_type
        standard_qty
        inventory {
          total
          locations {
            injection
            pipeline
            prebook
            await
            fold
            bulk
            backcarpark
            damage
            await_grn
          }
          last_update
        }
        orders {
          total_orders
          total_ordered_qty
          total_loaded_qty
          total_outstanding_qty
        }
        analysis {
          fulfillment_rate
          inventory_gap
          status
        }
      }
      generated_at
    }
  }
`;

/**
 * __useInventoryOrderedAnalysisQuery__
 *
 * To run a query within a React component, call `useInventoryOrderedAnalysisQuery` and pass it any options that fit your needs.
 * When your component renders, `useInventoryOrderedAnalysisQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useInventoryOrderedAnalysisQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useInventoryOrderedAnalysisQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    InventoryOrderedAnalysisQuery,
    InventoryOrderedAnalysisQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    InventoryOrderedAnalysisQuery,
    InventoryOrderedAnalysisQueryVariables
  >(InventoryOrderedAnalysisDocument, options);
}
export function useInventoryOrderedAnalysisLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    InventoryOrderedAnalysisQuery,
    InventoryOrderedAnalysisQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    InventoryOrderedAnalysisQuery,
    InventoryOrderedAnalysisQueryVariables
  >(InventoryOrderedAnalysisDocument, options);
}
export function useInventoryOrderedAnalysisSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        InventoryOrderedAnalysisQuery,
        InventoryOrderedAnalysisQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    InventoryOrderedAnalysisQuery,
    InventoryOrderedAnalysisQueryVariables
  >(InventoryOrderedAnalysisDocument, options);
}
export type InventoryOrderedAnalysisQueryHookResult = ReturnType<
  typeof useInventoryOrderedAnalysisQuery
>;
export type InventoryOrderedAnalysisLazyQueryHookResult = ReturnType<
  typeof useInventoryOrderedAnalysisLazyQuery
>;
export type InventoryOrderedAnalysisSuspenseQueryHookResult = ReturnType<
  typeof useInventoryOrderedAnalysisSuspenseQuery
>;
export type InventoryOrderedAnalysisQueryResult = Apollo.QueryResult<
  InventoryOrderedAnalysisQuery,
  InventoryOrderedAnalysisQueryVariables
>;
export const TopProductsByQuantityDocument = gql`
  query TopProductsByQuantity($input: TopProductsInput) {
    topProductsByQuantity(input: $input) {
      products {
        productCode
        productName
        productType
        colour
        standardQty
        totalQuantity
        locationQuantities {
          injection
          pipeline
          prebook
          await
          fold
          bulk
          backcarpark
          damage
          await_grn
        }
        lastUpdated
      }
      totalCount
      averageQuantity
      maxQuantity
      minQuantity
      lastUpdated
      dataSource
      refreshInterval
    }
  }
`;

/**
 * __useTopProductsByQuantityQuery__
 *
 * To run a query within a React component, call `useTopProductsByQuantityQuery` and pass it any options that fit your needs.
 * When your component renders, `useTopProductsByQuantityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTopProductsByQuantityQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTopProductsByQuantityQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    TopProductsByQuantityQuery,
    TopProductsByQuantityQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<TopProductsByQuantityQuery, TopProductsByQuantityQueryVariables>(
    TopProductsByQuantityDocument,
    options
  );
}
export function useTopProductsByQuantityLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    TopProductsByQuantityQuery,
    TopProductsByQuantityQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    TopProductsByQuantityQuery,
    TopProductsByQuantityQueryVariables
  >(TopProductsByQuantityDocument, options);
}
export function useTopProductsByQuantitySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        TopProductsByQuantityQuery,
        TopProductsByQuantityQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    TopProductsByQuantityQuery,
    TopProductsByQuantityQueryVariables
  >(TopProductsByQuantityDocument, options);
}
export type TopProductsByQuantityQueryHookResult = ReturnType<typeof useTopProductsByQuantityQuery>;
export type TopProductsByQuantityLazyQueryHookResult = ReturnType<
  typeof useTopProductsByQuantityLazyQuery
>;
export type TopProductsByQuantitySuspenseQueryHookResult = ReturnType<
  typeof useTopProductsByQuantitySuspenseQuery
>;
export type TopProductsByQuantityQueryResult = Apollo.QueryResult<
  TopProductsByQuantityQuery,
  TopProductsByQuantityQueryVariables
>;
