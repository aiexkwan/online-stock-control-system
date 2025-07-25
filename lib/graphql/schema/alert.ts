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
