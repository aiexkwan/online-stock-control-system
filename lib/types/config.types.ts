/**
 * Configuration System Type Definitions
 * Provides type-safe definitions for the configuration management system
 */

import { z } from 'zod';
import type {
  ConfigCategory,
  ConfigScope,
  ConfigDataType,
  ConfigAccessLevel,
  Scalars,
} from '@/types/generated/graphql';

// Re-export GraphQL enums for convenience
export { ConfigCategory, ConfigScope, ConfigDataType, ConfigAccessLevel };

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Data type validation schema
 */
export const ConfigDataTypeSchema = z.enum([
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'JSON',
  'ARRAY',
  'DATE',
  'COLOR',
  'URL',
]);

/**
 * Individual value schemas for each data type
 */
export const ConfigValueSchemas = {
  STRING: z.string(),
  NUMBER: z.number(),
  BOOLEAN: z.boolean(),
  JSON: z.record(z.unknown()),
  ARRAY: z.array(z.unknown()),
  DATE: z.union([z.string().datetime(), z.date()]),
  COLOR: z.string().regex(/^#[0-9A-F]{6}$/i),
  URL: z.string().url(),
} as const;

/**
 * Validation rules schema
 */
export const ValidationRulesSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.unknown()).optional(),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    custom: z.string().optional(), // Custom validation function name
  })
  .passthrough();

/**
 * Metadata schema - flexible key-value pairs
 */
export const MetadataSchema = z.record(z.unknown());

/**
 * Config item schema
 */
export const ConfigItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  defaultValue: z.unknown().optional(),
  category: z.string(),
  scope: z.string(),
  scopeId: z.string().optional(),
  description: z.string().optional(),
  dataType: ConfigDataTypeSchema,
  validation: ValidationRulesSchema.optional(),
  metadata: MetadataSchema.optional(),
  tags: z.array(z.string()).optional(),
  accessLevel: z.string(),
  isEditable: z.boolean(),
  isInherited: z.boolean(),
  inheritedFrom: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  updatedBy: z.string().optional(),
});

/**
 * Config history schema
 */
export const ConfigHistorySchema = z.object({
  id: z.string(),
  configId: z.string(),
  previousValue: z.unknown(),
  newValue: z.unknown(),
  changedBy: z.string(),
  changedAt: z.union([z.string(), z.date()]),
  changeReason: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

// ============================================================================
// TypeScript Types (derived from Zod schemas)
// ============================================================================

export type ConfigValue = z.infer<(typeof ConfigValueSchemas)[keyof typeof ConfigValueSchemas]>;
export type ValidationRules = z.infer<typeof ValidationRulesSchema>;
export type ConfigMetadata = z.infer<typeof MetadataSchema>;
export type ConfigItem = z.infer<typeof ConfigItemSchema>;
export type ConfigHistory = z.infer<typeof ConfigHistorySchema>;

// ============================================================================
// Utility Types and Interfaces
// ============================================================================

/**
 * Type-safe config value based on data type
 */
export type TypedConfigValue<T extends ConfigDataType> = T extends 'STRING'
  ? string
  : T extends 'NUMBER'
    ? number
    : T extends 'BOOLEAN'
      ? boolean
      : T extends 'JSON'
        ? Record<string, unknown>
        : T extends 'ARRAY'
          ? unknown[]
          : T extends 'DATE'
            ? string | Date
            : T extends 'COLOR'
              ? string
              : T extends 'URL'
                ? string
                : unknown;

/**
 * Config input with proper typing
 */
export interface ConfigInput {
  category?: ConfigCategory;
  scope?: ConfigScope;
  scopeId?: string;
  userId?: string;
  departmentId?: string;
  roleId?: string;
  includeDefaults?: boolean;
  includeInherited?: boolean;
  search?: string;
  tags?: string[];
}

/**
 * Config update input
 */
export interface ConfigUpdateInput {
  id: string;
  value: unknown;
  description?: string;
  validation?: ValidationRules;
  metadata?: ConfigMetadata;
  tags?: string[];
}

/**
 * Config create input
 */
export interface ConfigCreateInput {
  key: string;
  value: unknown;
  defaultValue?: unknown;
  category: ConfigCategory;
  scope: ConfigScope;
  scopeId?: string;
  description?: string;
  dataType: ConfigDataType;
  validation?: ValidationRules;
  metadata?: ConfigMetadata;
  tags?: string[];
  accessLevel?: ConfigAccessLevel;
}

/**
 * Batch update input
 */
export interface ConfigBatchUpdateInput {
  updates: ConfigUpdateInput[];
  validateAll?: boolean;
  atomicUpdate?: boolean;
}

/**
 * Config validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

/**
 * User permissions for config access
 */
export interface ConfigUserPermissions {
  userId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  departments: string[];
  roles: string[];
}

/**
 * Config category group
 */
export interface ConfigCategoryGroup {
  category: ConfigCategory;
  label: string;
  description?: string;
  icon?: string;
  items: ConfigItem[];
  count: number;
  editableCount: number;
  lastUpdated?: Date | string;
}

/**
 * Config summary statistics
 */
export interface ConfigSummary {
  totalConfigs: number;
  editableConfigs: number;
  inheritedConfigs: number;
  customConfigs: number;
  byCategory: Array<{
    category: string;
    count: number;
    editableCount: number;
  }>;
  byScope: Array<{
    scope: string;
    count: number;
    editableCount: number;
  }>;
  recentChanges: number;
}

/**
 * Config permissions
 */
export interface ConfigPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageGlobal: boolean;
  canManageDepartment: boolean;
  canManageUsers: boolean;
  accessibleScopes: ConfigScope[];
  accessibleCategories: ConfigCategory[];
}

/**
 * Config template
 */
export interface ConfigTemplate {
  id: string;
  name: string;
  description?: string;
  category: ConfigCategory;
  scope: ConfigScope;
  configs: Array<{
    key: string;
    value: unknown;
    dataType: ConfigDataType;
    validation?: ValidationRules;
  }>;
  tags?: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date | string;
  usageCount: number;
}

/**
 * Import/Export result
 */
export interface ConfigImportResult {
  succeeded: number;
  failed: number;
  errors: Array<{
    key?: string;
    error: string;
  }>;
}

/**
 * Configuration history entry parameters
 */
export interface ConfigHistoryParams {
  configId: string;
  previousValue: unknown;
  newValue: unknown;
  userId: string;
  changeReason?: string;
}

/**
 * Configuration validation error with additional context
 */
export interface ConfigValidationError {
  configId?: string;
  key?: string;
  message: string;
  details?: {
    field?: string;
    code?: string;
    value?: unknown;
  };
}

/**
 * Enhanced validation result with warnings
 */
export interface ConfigValidationResultExtended {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings?: ConfigValidationError[];
}

/**
 * Configuration card data response
 */
export interface ConfigCardData {
  configs: ConfigItem[];
  categories: ConfigCategoryGroup[];
  summary: ConfigSummary;
  permissions: ConfigPermissions;
  validation: ConfigValidationResultExtended;
  lastUpdated: Date | string;
  refreshInterval: number;
  dataSource: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid config value for the given data type
 */
export function isValidConfigValue(value: unknown, dataType: ConfigDataType): boolean {
  try {
    const schema = ConfigValueSchemas[dataType];
    if (!schema) return false;
    schema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a config value and return parsed result
 */
export function validateConfigValue<T extends ConfigDataType>(
  value: unknown,
  dataType: T
): TypedConfigValue<T> | null {
  try {
    const schema = ConfigValueSchemas[dataType];
    if (!schema) return null;
    return schema.parse(value) as TypedConfigValue<T>;
  } catch {
    return null;
  }
}

/**
 * Type guard for ConfigItem
 */
export function isConfigItem(value: unknown): value is ConfigItem {
  return ConfigItemSchema.safeParse(value).success;
}

/**
 * Type guard for ValidationRules
 */
export function isValidationRules(value: unknown): value is ValidationRules {
  return ValidationRulesSchema.safeParse(value).success;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert database config to typed ConfigItem
 */
export function toConfigItem(dbConfig: Record<string, unknown>): ConfigItem {
  return {
    id: dbConfig.id as string,
    key: dbConfig.key as string,
    value: dbConfig.value,
    defaultValue: dbConfig.default_value,
    category: dbConfig.category as string,
    scope: dbConfig.scope as string,
    scopeId: dbConfig.scope_id as string | undefined,
    description: dbConfig.description as string | undefined,
    dataType: dbConfig.data_type as ConfigDataType,
    validation: dbConfig.validation as ValidationRules | undefined,
    metadata: dbConfig.metadata as ConfigMetadata | undefined,
    tags: dbConfig.tags as string[] | undefined,
    accessLevel: (dbConfig.access_level as string) || 'AUTHENTICATED',
    isEditable: Boolean(dbConfig.is_editable),
    isInherited: Boolean(dbConfig.is_inherited),
    inheritedFrom: dbConfig.inherited_from as string | undefined,
    createdAt: dbConfig.created_at as string | Date,
    updatedAt: dbConfig.updated_at as string | Date,
    updatedBy: dbConfig.updated_by as string | undefined,
  };
}

/**
 * Create a safe config value validator
 */
export function createConfigValidator(dataType: ConfigDataType, validation?: ValidationRules) {
  return (value: unknown): ConfigValidationResult => {
    const errors: ConfigValidationResult['errors'] = [];

    // Check data type
    if (!isValidConfigValue(value, dataType)) {
      errors.push({
        message: `Value must be of type ${dataType}`,
        code: 'INVALID_TYPE',
      });
    }

    // Apply custom validation rules
    if (validation) {
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          errors.push({
            message: `Value must be at least ${validation.min}`,
            code: 'MIN_VALUE',
          });
        }
        if (validation.max !== undefined && value > validation.max) {
          errors.push({
            message: `Value must be at most ${validation.max}`,
            code: 'MAX_VALUE',
          });
        }
      }

      if (typeof value === 'string') {
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors.push({
            message: `Value must be at least ${validation.minLength} characters`,
            code: 'MIN_LENGTH',
          });
        }
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors.push({
            message: `Value must be at most ${validation.maxLength} characters`,
            code: 'MAX_LENGTH',
          });
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          errors.push({
            message: `Value does not match required pattern`,
            code: 'PATTERN_MISMATCH',
          });
        }
      }

      if (validation.enum && !validation.enum.includes(value)) {
        errors.push({
          message: `Value must be one of: ${validation.enum.join(', ')}`,
          code: 'ENUM_MISMATCH',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };
}
