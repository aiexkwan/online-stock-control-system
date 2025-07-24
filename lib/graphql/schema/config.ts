export const configSchema = `
# Config Card Schema
enum ConfigCategory {
  SYSTEM_CONFIG
  USER_PREFERENCES
  DEPARTMENT_CONFIG
  NOTIFICATION_CONFIG
  API_CONFIG
  SECURITY_CONFIG
  DISPLAY_CONFIG
  WORKFLOW_CONFIG
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