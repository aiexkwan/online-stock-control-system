/**
 * Chart GraphQL Schema
 * 統一圖表組件的 GraphQL 類型定義
 */

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

type ChartCardData {
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
