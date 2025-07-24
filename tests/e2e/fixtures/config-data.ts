import { ConfigCategory, ConfigDataType, ConfigScope, ConfigAccessLevel } from '@/lib/graphql/queries/config';

export const mockConfigData = {
  configs: [
    // System Configuration
    {
      id: 'config-1',
      key: 'system.maintenance.mode',
      value: false,
      dataType: ConfigDataType.BOOLEAN,
      category: ConfigCategory.SYSTEM_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Enable system maintenance mode',
      defaultValue: false,
      validation: null,
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['system', 'maintenance'],
      metadata: { critical: true },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      updatedBy: 'admin@example.com'
    },
    {
      id: 'config-2',
      key: 'system.api.rateLimit',
      value: 1000,
      dataType: ConfigDataType.NUMBER,
      category: ConfigCategory.SYSTEM_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'API rate limit per minute',
      defaultValue: 500,
      validation: { min: 100, max: 10000 },
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['api', 'performance'],
      metadata: {},
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      updatedBy: 'admin@example.com'
    },

    // User Preferences
    {
      id: 'config-3',
      key: 'user.theme.mode',
      value: 'light',
      dataType: ConfigDataType.STRING,
      category: ConfigCategory.USER_PREFERENCES,
      scope: ConfigScope.USER,
      scopeId: 'user-123',
      description: 'User interface theme mode',
      defaultValue: 'light',
      validation: { enum: ['light', 'dark', 'auto'] },
      accessLevel: ConfigAccessLevel.AUTHENTICATED,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['theme', 'ui'],
      metadata: {},
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString(),
      updatedBy: 'user@example.com'
    },
    {
      id: 'config-4',
      key: 'user.notifications.email',
      value: ['order_updates', 'inventory_alerts'],
      dataType: ConfigDataType.ARRAY,
      category: ConfigCategory.USER_PREFERENCES,
      scope: ConfigScope.USER,
      scopeId: 'user-123',
      description: 'Email notification preferences',
      defaultValue: [],
      validation: null,
      accessLevel: ConfigAccessLevel.AUTHENTICATED,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['notifications', 'email'],
      metadata: {},
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 28800000).toISOString(),
      updatedBy: 'user@example.com'
    },

    // Department Configuration
    {
      id: 'config-5',
      key: 'department.workflow.autoApprove',
      value: true,
      dataType: ConfigDataType.BOOLEAN,
      category: ConfigCategory.DEPARTMENT_CONFIG,
      scope: ConfigScope.DEPARTMENT,
      scopeId: 'dept-warehouse',
      description: 'Auto-approve orders under threshold',
      defaultValue: false,
      validation: null,
      accessLevel: ConfigAccessLevel.DEPARTMENT,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['workflow', 'automation'],
      metadata: { department: 'warehouse' },
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      updatedAt: new Date(Date.now() - 43200000).toISOString(),
      updatedBy: 'manager@example.com'
    },
    {
      id: 'config-6',
      key: 'department.settings.workingHours',
      value: { start: '09:00', end: '17:00', timezone: 'GMT' },
      dataType: ConfigDataType.OBJECT,
      category: ConfigCategory.DEPARTMENT_CONFIG,
      scope: ConfigScope.DEPARTMENT,
      scopeId: 'dept-warehouse',
      description: 'Department working hours',
      defaultValue: { start: '09:00', end: '17:00', timezone: 'GMT' },
      validation: null,
      accessLevel: ConfigAccessLevel.DEPARTMENT,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['schedule', 'hours'],
      metadata: { department: 'warehouse' },
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      updatedAt: new Date(Date.now() - 57600000).toISOString(),
      updatedBy: 'manager@example.com'
    },

    // Notification Configuration
    {
      id: 'config-7',
      key: 'notification.smtp.server',
      value: 'smtp.example.com',
      dataType: ConfigDataType.STRING,
      category: ConfigCategory.NOTIFICATION_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'SMTP server address',
      defaultValue: 'localhost',
      validation: null,
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['email', 'smtp'],
      metadata: { encrypted: false },
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      updatedAt: new Date(Date.now() - 72000000).toISOString(),
      updatedBy: 'admin@example.com'
    },
    {
      id: 'config-8',
      key: 'notification.channels.enabled',
      value: ['email', 'sms', 'push'],
      dataType: ConfigDataType.ARRAY,
      category: ConfigCategory.NOTIFICATION_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Enabled notification channels',
      defaultValue: ['email'],
      validation: null,
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['channels', 'notifications'],
      metadata: {},
      createdAt: new Date(Date.now() - 691200000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      updatedBy: 'admin@example.com'
    },

    // API Configuration
    {
      id: 'config-9',
      key: 'api.external.weatherApiKey',
      value: '**********',
      dataType: ConfigDataType.STRING,
      category: ConfigCategory.API_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Weather API key for shipping estimates',
      defaultValue: null,
      validation: { pattern: '^[a-zA-Z0-9]{32}$' },
      accessLevel: ConfigAccessLevel.SUPER_ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['api', 'external', 'secure'],
      metadata: { isSecret: true },
      createdAt: new Date(Date.now() - 777600000).toISOString(),
      updatedAt: new Date(Date.now() - 100800000).toISOString(),
      updatedBy: 'superadmin@example.com'
    },
    {
      id: 'config-10',
      key: 'api.endpoints.baseUrl',
      value: 'https://api.example.com/v2',
      dataType: ConfigDataType.URL,
      category: ConfigCategory.API_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Base URL for external API',
      defaultValue: 'https://api.example.com/v1',
      validation: null,
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['api', 'url'],
      metadata: {},
      createdAt: new Date(Date.now() - 864000000).toISOString(),
      updatedAt: new Date(Date.now() - 115200000).toISOString(),
      updatedBy: 'admin@example.com'
    },

    // Security Configuration
    {
      id: 'config-11',
      key: 'security.password.minLength',
      value: 12,
      dataType: ConfigDataType.NUMBER,
      category: ConfigCategory.SECURITY_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Minimum password length',
      defaultValue: 8,
      validation: { min: 8, max: 32 },
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['security', 'password'],
      metadata: { compliance: 'SOC2' },
      createdAt: new Date(Date.now() - 950400000).toISOString(),
      updatedAt: new Date(Date.now() - 129600000).toISOString(),
      updatedBy: 'security@example.com'
    },
    {
      id: 'config-12',
      key: 'security.session.timeout',
      value: 3600,
      dataType: ConfigDataType.NUMBER,
      category: ConfigCategory.SECURITY_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Session timeout in seconds',
      defaultValue: 1800,
      validation: { min: 300, max: 86400 },
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: false,
      isInherited: false,
      inheritedFrom: null,
      tags: ['security', 'session'],
      metadata: { unit: 'seconds' },
      createdAt: new Date(Date.now() - 1036800000).toISOString(),
      updatedAt: new Date(Date.now() - 144000000).toISOString(),
      updatedBy: 'security@example.com'
    },

    // Display Configuration
    {
      id: 'config-13',
      key: 'display.grid.columns',
      value: 12,
      dataType: ConfigDataType.NUMBER,
      category: ConfigCategory.DISPLAY_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Default grid columns',
      defaultValue: 12,
      validation: { min: 4, max: 24 },
      accessLevel: ConfigAccessLevel.AUTHENTICATED,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['display', 'grid'],
      metadata: {},
      createdAt: new Date(Date.now() - 1123200000).toISOString(),
      updatedAt: new Date(Date.now() - 158400000).toISOString(),
      updatedBy: 'designer@example.com'
    },
    {
      id: 'config-14',
      key: 'display.theme.primaryColor',
      value: '#3B82F6',
      dataType: ConfigDataType.COLOR,
      category: ConfigCategory.DISPLAY_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Primary brand color',
      defaultValue: '#3B82F6',
      validation: { pattern: '^#[0-9A-Fa-f]{6}$' },
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['theme', 'color'],
      metadata: {},
      createdAt: new Date(Date.now() - 1209600000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      updatedBy: 'designer@example.com'
    },

    // Workflow Configuration
    {
      id: 'config-15',
      key: 'workflow.approval.levels',
      value: ['supervisor', 'manager', 'director'],
      dataType: ConfigDataType.ARRAY,
      category: ConfigCategory.WORKFLOW_CONFIG,
      scope: ConfigScope.DEPARTMENT,
      scopeId: 'dept-warehouse',
      description: 'Approval hierarchy levels',
      defaultValue: ['manager'],
      validation: null,
      accessLevel: ConfigAccessLevel.DEPARTMENT,
      isEditable: true,
      isInherited: true,
      inheritedFrom: 'GLOBAL',
      tags: ['workflow', 'approval'],
      metadata: {},
      createdAt: new Date(Date.now() - 1296000000).toISOString(),
      updatedAt: new Date(Date.now() - 187200000).toISOString(),
      updatedBy: 'admin@example.com'
    },
    {
      id: 'config-16',
      key: 'workflow.automation.rules',
      value: {
        autoAssign: true,
        priorityThreshold: 5,
        escalationTime: 3600,
        notifyManagers: true
      },
      dataType: ConfigDataType.JSON,
      category: ConfigCategory.WORKFLOW_CONFIG,
      scope: ConfigScope.GLOBAL,
      description: 'Workflow automation rules',
      defaultValue: {},
      validation: null,
      accessLevel: ConfigAccessLevel.ADMIN,
      isEditable: true,
      isInherited: false,
      inheritedFrom: null,
      tags: ['workflow', 'automation', 'rules'],
      metadata: {},
      createdAt: new Date(Date.now() - 1382400000).toISOString(),
      updatedAt: new Date(Date.now() - 201600000).toISOString(),
      updatedBy: 'admin@example.com'
    }
  ],
  categories: [
    {
      category: ConfigCategory.SYSTEM_CONFIG,
      label: 'System',
      description: 'Core system configurations',
      icon: 'settings',
      items: [
        { id: 'config-1', key: 'system.maintenance.mode' },
        { id: 'config-2', key: 'system.api.rateLimit' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 3600000).toISOString()
    },
    {
      category: ConfigCategory.USER_PREFERENCES,
      label: 'User Preferences',
      description: 'User-specific settings',
      icon: 'user',
      items: [
        { id: 'config-3', key: 'user.theme.mode' },
        { id: 'config-4', key: 'user.notifications.email' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 14400000).toISOString()
    },
    {
      category: ConfigCategory.DEPARTMENT_CONFIG,
      label: 'Department',
      description: 'Department-level configurations',
      icon: 'building',
      items: [
        { id: 'config-5', key: 'department.workflow.autoApprove' },
        { id: 'config-6', key: 'department.settings.workingHours' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 43200000).toISOString()
    },
    {
      category: ConfigCategory.NOTIFICATION_CONFIG,
      label: 'Notifications',
      description: 'Notification system settings',
      icon: 'bell',
      items: [
        { id: 'config-7', key: 'notification.smtp.server' },
        { id: 'config-8', key: 'notification.channels.enabled' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 72000000).toISOString()
    },
    {
      category: ConfigCategory.API_CONFIG,
      label: 'API',
      description: 'API and integration settings',
      icon: 'link',
      items: [
        { id: 'config-9', key: 'api.external.weatherApiKey' },
        { id: 'config-10', key: 'api.endpoints.baseUrl' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 100800000).toISOString()
    },
    {
      category: ConfigCategory.SECURITY_CONFIG,
      label: 'Security',
      description: 'Security policies and settings',
      icon: 'lock',
      items: [
        { id: 'config-11', key: 'security.password.minLength' },
        { id: 'config-12', key: 'security.session.timeout' }
      ],
      count: 2,
      editableCount: 1,
      lastUpdated: new Date(Date.now() - 129600000).toISOString()
    },
    {
      category: ConfigCategory.DISPLAY_CONFIG,
      label: 'Display',
      description: 'UI and display settings',
      icon: 'monitor',
      items: [
        { id: 'config-13', key: 'display.grid.columns' },
        { id: 'config-14', key: 'display.theme.primaryColor' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 158400000).toISOString()
    },
    {
      category: ConfigCategory.WORKFLOW_CONFIG,
      label: 'Workflow',
      description: 'Workflow and process settings',
      icon: 'git-branch',
      items: [
        { id: 'config-15', key: 'workflow.approval.levels' },
        { id: 'config-16', key: 'workflow.automation.rules' }
      ],
      count: 2,
      editableCount: 2,
      lastUpdated: new Date(Date.now() - 187200000).toISOString()
    }
  ],
  summary: {
    totalConfigs: 16,
    editableConfigs: 15,
    readOnlyConfigs: 1,
    inheritedConfigs: 1,
    modifiedConfigs: 14,
    lastUpdated: new Date(Date.now() - 3600000).toISOString()
  },
  permissions: {
    canView: true,
    canEdit: true,
    canCreate: true,
    canDelete: true,
    canImport: true,
    canExport: true,
    restrictedKeys: ['api.external.weatherApiKey']
  },
  lastUpdated: new Date().toISOString(),
  refreshInterval: 30000,
  dataSource: 'cache'
};

export const mockConfigHistory = [
  {
    id: 'history-1',
    configId: 'config-1',
    version: 3,
    value: true,
    changedBy: 'admin@example.com',
    changedAt: new Date(Date.now() - 3600000).toISOString(),
    changeReason: 'Enabled maintenance mode for upgrade'
  },
  {
    id: 'history-2',
    configId: 'config-1',
    version: 2,
    value: false,
    changedBy: 'admin@example.com',
    changedAt: new Date(Date.now() - 86400000).toISOString(),
    changeReason: 'Disabled maintenance mode after upgrade'
  },
  {
    id: 'history-3',
    configId: 'config-1',
    version: 1,
    value: false,
    changedBy: 'system',
    changedAt: new Date(Date.now() - 172800000).toISOString(),
    changeReason: 'Initial configuration'
  }
];

export const mockConfigTemplates = [
  {
    id: 'template-1',
    name: 'Production Settings',
    description: 'Recommended settings for production environment',
    category: ConfigCategory.SYSTEM_CONFIG,
    configs: [
      {
        key: 'system.maintenance.mode',
        value: false,
        dataType: ConfigDataType.BOOLEAN
      },
      {
        key: 'system.api.rateLimit',
        value: 5000,
        dataType: ConfigDataType.NUMBER
      }
    ],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'template-2',
    name: 'Development Settings',
    description: 'Settings optimized for development',
    category: ConfigCategory.SYSTEM_CONFIG,
    configs: [
      {
        key: 'system.maintenance.mode',
        value: false,
        dataType: ConfigDataType.BOOLEAN
      },
      {
        key: 'system.api.rateLimit',
        value: 100,
        dataType: ConfigDataType.NUMBER
      }
    ],
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: 'template-3',
    name: 'Department Defaults',
    description: 'Default settings for new departments',
    category: ConfigCategory.DEPARTMENT_CONFIG,
    configs: [
      {
        key: 'department.workflow.autoApprove',
        value: false,
        dataType: ConfigDataType.BOOLEAN
      },
      {
        key: 'department.settings.workingHours',
        value: { start: '09:00', end: '17:00', timezone: 'GMT' },
        dataType: ConfigDataType.OBJECT
      }
    ],
    createdAt: new Date(Date.now() - 1814400000).toISOString(),
    updatedAt: new Date(Date.now() - 864000000).toISOString()
  }
];

// Export format examples
export const mockExportData = {
  json: JSON.stringify(mockConfigData.configs.slice(0, 2), null, 2),
  csv: `key,value,dataType,category,description
system.maintenance.mode,false,BOOLEAN,SYSTEM_CONFIG,Enable system maintenance mode
system.api.rateLimit,1000,NUMBER,SYSTEM_CONFIG,API rate limit per minute`,
  env: `SYSTEM_MAINTENANCE_MODE=false
SYSTEM_API_RATE_LIMIT=1000`
};

// Import test data
export const mockImportData = {
  json: JSON.stringify([
    {
      key: 'imported.test.config',
      value: 'test-value',
      dataType: ConfigDataType.STRING,
      category: ConfigCategory.SYSTEM_CONFIG,
      description: 'Imported test configuration'
    }
  ]),
  csv: `key,value,dataType,category,description
imported.csv.config,123,NUMBER,SYSTEM_CONFIG,Imported from CSV`,
  env: `IMPORTED_ENV_CONFIG=true`
};