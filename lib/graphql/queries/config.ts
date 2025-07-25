import { gql } from '@apollo/client';

// Config value type system
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ConfigValueByType = {
  [ConfigDataType.STRING]: string;
  [ConfigDataType.NUMBER]: number;
  [ConfigDataType.BOOLEAN]: boolean;
  [ConfigDataType.JSON]: JsonValue;
  [ConfigDataType.ARRAY]: JsonValue[];
  [ConfigDataType.DATE]: string;
  [ConfigDataType.URL]: string;
  [ConfigDataType.COLOR]: string;
  [ConfigDataType.OBJECT]: Record<string, JsonValue>;
};

export type ConfigValue = ConfigValueByType[keyof ConfigValueByType];

export interface ConfigMetadata {
  lastModified?: string;
  modifiedBy?: string;
  source?: 'user' | 'system' | 'template';
  [key: string]: JsonValue | undefined;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: JsonValue[];
  custom?: string;
}

// Enums
export enum ConfigCategory {
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  USER_PREFERENCES = 'USER_PREFERENCES',
  DEPARTMENT_CONFIG = 'DEPARTMENT_CONFIG',
  NOTIFICATION_CONFIG = 'NOTIFICATION_CONFIG',
  API_CONFIG = 'API_CONFIG',
  SECURITY_CONFIG = 'SECURITY_CONFIG',
  DISPLAY_CONFIG = 'DISPLAY_CONFIG',
  WORKFLOW_CONFIG = 'WORKFLOW_CONFIG',
}

export enum ConfigDataType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  DATE = 'DATE',
  URL = 'URL',
  COLOR = 'COLOR',
  OBJECT = 'OBJECT',
}

// Additional types for mutations
export interface ConfigBatchUpdateInput {
  id: string;
  value: ConfigValue;
}

export interface ConfigTemplateItemInput {
  key: string;
  value: ConfigValue;
  dataType: ConfigDataType;
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  ENV = 'ENV',
}

export enum ImportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  ENV = 'ENV',
}

// Types
export interface ConfigItem {
  id: string;
  key: string;
  value: ConfigValue;
  dataType: ConfigDataType;
  category: ConfigCategory;
  scope: ConfigScope;
  scopeId?: string;
  description?: string;
  defaultValue?: ConfigValue;
  validation?: ValidationRule;
  accessLevel: ConfigAccessLevel;
  isEditable: boolean;
  isInherited: boolean;
  inheritedFrom?: string;
  tags?: string[];
  metadata?: ConfigMetadata;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export enum ConfigScope {
  GLOBAL = 'GLOBAL',
  DEPARTMENT = 'DEPARTMENT',
  USER = 'USER',
  ROLE = 'ROLE',
}

export enum ConfigAccessLevel {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  DEPARTMENT = 'DEPARTMENT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface ConfigUpdateInput {
  value: ConfigValue;
  description?: string;
  tags?: string[];
  metadata?: ConfigMetadata;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description?: string;
  category: ConfigCategory;
  configs: Array<{
    key: string;
    value: ConfigValue;
    dataType: ConfigDataType;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigHistoryEntry {
  id: string;
  configId: string;
  version: number;
  value: ConfigValue;
  changedBy: string;
  changedAt: string;
  changeReason?: string;
}

// Queries
export const GET_CONFIG_BY_CATEGORY = gql`
  query GetConfigByCategory($input: ConfigCardInput!) {
    configCardData(input: $input) {
      configs {
        id
        key
        value
        dataType
        category
        scope
        scopeId
        description
        defaultValue
        validation
        accessLevel
        isEditable
        isInherited
        inheritedFrom
        tags
        metadata
        createdAt
        updatedAt
        updatedBy
      }
      categories {
        category
        label
        description
        icon
        items {
          id
          key
        }
        count
        editableCount
        lastUpdated
      }
      summary {
        totalConfigs
        editableConfigs
        readOnlyConfigs
        inheritedConfigs
        modifiedConfigs
        lastUpdated
      }
      permissions {
        canView
        canEdit
        canCreate
        canDelete
        canImport
        canExport
        restrictedKeys
      }
      lastUpdated
      refreshInterval
      dataSource
    }
  }
`;

// Add ConfigCardInput type
export interface ConfigCardInput {
  category?: ConfigCategory;
  scope?: ConfigScope;
  userId?: string;
  departmentId?: string;
  roleId?: string;
  includeDefaults?: boolean;
  includeInherited?: boolean;
  search?: string;
  tags?: string[];
}

export const GET_CONFIG_BY_KEY = gql`
  query GetConfigByKey($key: String!) {
    getConfigByKey(key: $key) {
      id
      key
      value
      dataType
      category
      description
      defaultValue
      validation
      isSecret
      isReadOnly
      isSystem
      tags
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONFIG_HISTORY = gql`
  query GetConfigHistory($configId: String!, $limit: Int) {
    getConfigHistory(configId: $configId, limit: $limit) {
      id
      configId
      version
      value
      changedBy
      changedAt
      changeReason
    }
  }
`;

export const GET_CONFIG_TEMPLATES = gql`
  query GetConfigTemplates($category: ConfigCategory) {
    getConfigTemplates(category: $category) {
      id
      name
      description
      category
      configs
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_CONFIG = gql`
  query SearchConfig($query: String!, $categories: [ConfigCategory!]) {
    searchConfig(query: $query, categories: $categories) {
      id
      key
      value
      dataType
      category
      description
      tags
      createdAt
      updatedAt
    }
  }
`;

// Mutations
export const UPDATE_CONFIG = gql`
  mutation UpdateConfig($id: String!, $input: ConfigUpdateInput!) {
    updateConfig(id: $id, input: $input) {
      id
      key
      value
      dataType
      category
      description
      tags
      metadata
      updatedAt
    }
  }
`;

export const UPDATE_BATCH_CONFIG = gql`
  mutation UpdateBatchConfig($updates: [ConfigBatchUpdateInput!]!) {
    updateBatchConfig(updates: $updates) {
      success
      updated
      errors {
        configId
        error
      }
    }
  }
`;

export const REVERT_CONFIG = gql`
  mutation RevertConfig($configId: String!, $version: Int!) {
    revertConfig(configId: $configId, version: $version) {
      id
      key
      value
      updatedAt
    }
  }
`;

export const SAVE_CONFIG_TEMPLATE = gql`
  mutation SaveConfigTemplate(
    $name: String!
    $description: String
    $category: ConfigCategory!
    $configs: [ConfigTemplateItemInput!]!
  ) {
    saveConfigTemplate(
      name: $name
      description: $description
      category: $category
      configs: $configs
    ) {
      id
      name
      description
      category
      configs
      createdAt
    }
  }
`;

export const APPLY_CONFIG_TEMPLATE = gql`
  mutation ApplyConfigTemplate($templateId: String!) {
    applyConfigTemplate(templateId: $templateId) {
      success
      applied
      errors {
        key
        error
      }
    }
  }
`;

export const DELETE_CONFIG_TEMPLATE = gql`
  mutation DeleteConfigTemplate($id: String!) {
    deleteConfigTemplate(id: $id) {
      success
    }
  }
`;

export const EXPORT_CONFIG = gql`
  mutation ExportConfig($category: ConfigCategory!, $format: ExportFormat!) {
    exportConfig(category: $category, format: $format)
  }
`;

export const IMPORT_CONFIG = gql`
  mutation ImportConfig($category: ConfigCategory!, $data: String!, $format: ImportFormat!) {
    importConfig(category: $category, data: $data, format: $format) {
      success
      imported
      errors {
        key
        error
      }
    }
  }
`;

export const VALIDATE_CONFIG = gql`
  mutation ValidateConfig($key: String!, $value: JSON!, $dataType: ConfigDataType!) {
    validateConfig(key: $key, value: $value, dataType: $dataType) {
      isValid
      errors
    }
  }
`;

// Subscriptions
export const CONFIG_UPDATED = gql`
  subscription ConfigUpdated($categories: [ConfigCategory!]) {
    configUpdated(categories: $categories) {
      id
      key
      value
      category
      updatedAt
    }
  }
`;
