import { GraphQLResolveInfo } from 'graphql';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';
import { createClient } from '../../../app/utils/supabase/server';
import {
  ConfigItem,
  ConfigInput,
  ConfigUpdateInput,
  ConfigCreateInput,
  ConfigBatchUpdateInput,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigUserPermissions,
  ConfigCategoryGroup,
  ConfigPermissions,
  ConfigImportResult,
  ValidationRules,
  ConfigMetadata,
  ConfigValue,
  toConfigItem,
  ConfigDataType,
  ConfigCategory,
  ConfigScope,
  ConfigAccessLevel,
} from '../../types/config.types';
import { withCache } from '../../utils/error-handling';
import type { GraphQLContext } from './index';
import type { Database } from '../../database.types';

// Configuration service singleton
class ConfigService {
  private static instance: ConfigService;
  public cache = new Map<string, { data: ConfigItem[]; timestamp: number }>();
  public cacheTimeout = 5 * 60 * 1000; // 5 minutes
  public supabase: SupabaseClient<Database> | null = null;

  // Get Supabase client dynamically to support SSR
  async getSupabase(): Promise<SupabaseClient<Database>> {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Get configs based on filters
  async getConfigs(input: ConfigInput, userId?: string): Promise<ConfigItem[]> {
    const cacheKey = `configs:${JSON.stringify(input)}:${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const supabase = await this.getSupabase();
      // Fetch from database
      let query = supabase.from('API').select('*'); // Using API table as config store

      // Simplified filtering for API table compatibility
      if (input.search) {
        query = query.or(`name.ilike.%${input.search}%,description.ilike.%${input.search}%`);
      }
      // Note: Other filters disabled until proper config table is created

      const { data, error } = await query;
      if (error) throw error;

      // Transform API table records to simplified config items with explicit typing
      const configs: ConfigItem[] = (data || []).map(
        (item: any): ConfigItem => ({
          id: item.uuid,
          key: item.name,
          value: item.value,
          defaultValue: null,
          description: item.description || '',
          category: 'SYSTEM' as ConfigCategory,
          scope: 'GLOBAL' as ConfigScope,
          scopeId: undefined,
          dataType: 'STRING' as ConfigDataType,
          validation: undefined,
          metadata: undefined,
          tags: [],
          accessLevel: 'READ_ONLY' as ConfigAccessLevel,
          isEditable: false,
          isInherited: false,
          inheritedFrom: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: undefined,
        })
      );

      this.cache.set(cacheKey, { data: configs, timestamp: Date.now() });
      return configs;
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw new Error('Failed to fetch configurations');
    }
  }

  // Process inherited configurations
  private async processInheritedConfigs(
    configs: ConfigItem[],
    input: ConfigInput
  ): Promise<ConfigItem[]> {
    const result = [...configs];

    // Check for department inheritance
    if (input.scope === 'USER' && input.departmentId) {
      const departmentConfigs = await this.getConfigs({
        ...input,
        scope: ConfigScope.DEPARTMENT,
        scopeId: input.departmentId,
      });

      // Merge department configs
      departmentConfigs.forEach(deptConfig => {
        if (!result.find(c => c.key === deptConfig.key)) {
          result.push({
            ...deptConfig,
            isInherited: true,
            inheritedFrom: 'DEPARTMENT',
          });
        }
      });
    }

    // Check for global inheritance
    if (input.includeDefaults) {
      const globalConfigs = await this.getConfigs({
        ...input,
        scope: ConfigScope.GLOBAL,
        scopeId: undefined,
      });

      // Merge global configs
      globalConfigs.forEach(globalConfig => {
        if (!result.find(c => c.key === globalConfig.key)) {
          result.push({
            ...globalConfig,
            isInherited: true,
            inheritedFrom: 'GLOBAL',
          });
        }
      });
    }

    return result;
  }

  // Apply access control based on user permissions
  private async applyAccessControl(configs: ConfigItem[], userId?: string): Promise<ConfigItem[]> {
    if (!userId) {
      // Return only public configs for anonymous users
      return configs.filter(c => c.accessLevel === 'PUBLIC');
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(userId);

    return configs.map(config => {
      const hasReadAccess = this.checkAccess(config, permissions, 'read');
      const hasWriteAccess = this.checkAccess(config, permissions, 'write');

      return {
        ...config,
        isEditable: hasWriteAccess && !config.isInherited,
        // Mask sensitive values if no read access
        value: hasReadAccess ? config.value : null,
      };
    });
  }

  // Check if user has specific access to config
  private checkAccess(
    config: ConfigItem,
    permissions: ConfigUserPermissions,
    _action: string
  ): boolean {
    switch (config.accessLevel) {
      case 'PUBLIC':
        return true;
      case 'AUTHENTICATED':
        return !!permissions.userId;
      case 'DEPARTMENT':
        return permissions.departments?.includes(config.scopeId || '');
      case 'ADMIN':
        return permissions.isAdmin;
      case 'SUPER_ADMIN':
        return permissions.isSuperAdmin;
      default:
        return false;
    }
  }

  // Get user permissions
  public async getUserPermissions(userId: string): Promise<ConfigUserPermissions> {
    // Simplified implementation using available tables
    // Since users/user_roles/user_departments tables don't exist in current schema,
    // we'll provide a fallback implementation
    try {
      const supabase = await this.getSupabase();

      // Try to get user info from data_id table as fallback
      const { data: userInfo } = await supabase
        .from('data_id')
        .select('*')
        .eq('uuid', userId)
        .single();

      // Basic permission structure based on available data
      const permissions: ConfigUserPermissions = {
        userId,
        isAdmin: userInfo?.department === 'ADMIN' || false,
        isSuperAdmin: userInfo?.position === 'SUPER_ADMIN' || false,
        departments: userInfo?.department ? [userInfo.department] : [],
        roles: [], // No roles table available
      };

      return permissions;
    } catch (error) {
      // Return default permissions on error
      return {
        userId,
        isAdmin: false,
        isSuperAdmin: false,
        departments: [],
        roles: [],
      };
    }
  }

  // Create new config
  async createConfig(input: ConfigCreateInput, userId: string): Promise<ConfigItem> {
    try {
      const validation = await this.validateConfig(input);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors[0]?.message}`);
      }

      const supabase = await this.getSupabase();

      // Use API table as fallback for config storage
      const configData = {
        uuid: uuidv4(),
        name: input.key,
        value: JSON.stringify(input.value),
        description: input.description || '',
      };

      const { data, error } = await supabase.from('API').insert(configData).select().single();

      if (error) throw error;

      // Clear cache
      this.cache.clear();

      return toConfigItem(data);
    } catch (error) {
      console.error('Error creating config:', error);
      throw new Error('Failed to create configuration');
    }
  }

  // Update config
  async updateConfig(
    id: string,
    value: ConfigValue,
    userId: string,
    metadata?: ConfigMetadata
  ): Promise<ConfigItem> {
    try {
      const supabase = await this.getSupabase();
      // Get current config from API table
      const { data: currentConfig, error: fetchError } = await supabase
        .from('API')
        .select('*')
        .eq('uuid', id)
        .single();

      if (fetchError || !currentConfig) {
        throw new Error('Configuration not found');
      }

      // Validate new value
      const validation = await this.validateConfigValue(currentConfig, value);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors[0]?.message}`);
      }

      // Update config in API table
      const { data, error } = await supabase
        .from('API')
        .update({
          value: JSON.stringify(value),
          description: currentConfig.description || '',
        })
        .eq('uuid', id)
        .select()
        .single();

      if (error) throw error;

      // Skip history for now since config_history table doesn't exist
      // await this.addToHistory(id, currentConfig.value, value, userId);

      // Clear cache
      this.cache.clear();

      return toConfigItem(data);
    } catch (error) {
      console.error('Error updating config:', error);
      throw new Error('Failed to update configuration');
    }
  }

  // Add config change to history (disabled - table doesn't exist)
  private async addToHistory(
    _configId: string,
    _previousValue: ConfigValue,
    _newValue: ConfigValue,
    _userId: string,
    _changeReason?: string
  ): Promise<void> {
    // Skip history logging since config_history table doesn't exist
    // This would be implemented when the proper config tables are created
    console.log('Config history logging skipped - table not available');
  }

  // Validate configuration
  async validateConfig(
    input: ConfigCreateInput | ConfigUpdateInput
  ): Promise<ConfigValidationResult> {
    const errors = [];

    // Required fields validation
    const inputWithRequired = input as ConfigCreateInput | ConfigUpdateInput;
    if (!('key' in inputWithRequired) || !inputWithRequired.key)
      errors.push({ message: 'Key is required' });
    if (!('category' in inputWithRequired) || !inputWithRequired.category)
      errors.push({ message: 'Category is required' });
    if (!('scope' in inputWithRequired) || !inputWithRequired.scope)
      errors.push({ message: 'Scope is required' });
    if (!('dataType' in inputWithRequired) || !inputWithRequired.dataType)
      errors.push({ message: 'Data type is required' });

    // Data type validation
    if (input.value !== null && input.value !== undefined) {
      const dataType =
        'dataType' in inputWithRequired ? inputWithRequired.dataType : ConfigDataType.STRING;
      const typeValidation = this.validateDataType(input.value as ConfigValue, dataType);
      if (!typeValidation.isValid) {
        errors.push({ message: typeValidation.error || 'Invalid data type' });
      }
    }

    // Custom validation rules
    if (input.validation) {
      const validation =
        'validation' in inputWithRequired ? inputWithRequired.validation : undefined;
      if (validation) {
        const customValidation = await this.runCustomValidation(
          input.value as ConfigValue,
          validation as ValidationRules
        );
        if (!customValidation.isValid) {
          errors.push(
            ...(customValidation.errors || [])
              .filter(e => e && typeof e.message === 'string')
              .map(e => ({ ...e, message: e.message as string }))
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors as { field?: string; message: string; code?: string }[],
    };
  }

  // Validate config value
  async validateConfigValue(
    config: ConfigItem,
    value: ConfigValue
  ): Promise<ConfigValidationResult> {
    return this.validateConfig({ ...config, value } as ConfigCreateInput | ConfigUpdateInput);
  }

  // Validate data type
  private validateDataType(
    value: ConfigValue,
    dataType: ConfigDataType
  ): { isValid: boolean; error?: string } {
    switch (dataType) {
      case 'STRING':
        return { isValid: typeof value === 'string' };
      case 'NUMBER':
        return { isValid: typeof value === 'number' };
      case 'BOOLEAN':
        return { isValid: typeof value === 'boolean' };
      case 'JSON':
        try {
          JSON.parse(JSON.stringify(value));
          return { isValid: true };
        } catch {
          return { isValid: false, error: 'Invalid JSON' };
        }
      case 'ARRAY':
        return { isValid: Array.isArray(value) };
      case 'DATE':
        return { isValid: !isNaN(Date.parse(value as string)) };
      case 'COLOR':
        return { isValid: /^#[0-9A-F]{6}$/i.test(value as string) };
      case 'URL':
        try {
          new URL(value as string);
          return { isValid: true };
        } catch {
          return { isValid: false, error: 'Invalid URL' };
        }
      default:
        return { isValid: true };
    }
  }

  // Run custom validation rules
  private async runCustomValidation(
    value: ConfigValue,
    rules: ValidationRules
  ): Promise<ConfigValidationResult> {
    const errors = [];

    // Min/max validation
    if (rules.min !== undefined && (value as number) < rules.min) {
      errors.push({ message: `Value must be at least ${rules.min}` });
    }
    if (rules.max !== undefined && (value as number) > rules.max) {
      errors.push({ message: `Value must be at most ${rules.max}` });
    }

    // Pattern validation
    if (rules.pattern && !new RegExp(rules.pattern).test(value as string)) {
      errors.push({ message: `Value does not match required pattern` });
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({ message: `Value must be one of: ${rules.enum.join(', ')}` });
    }

    return { isValid: errors.length === 0, errors };
  }

  // Export configurations
  async exportConfigs(category?: string, scope?: string, format: string = 'JSON'): Promise<string> {
    const configs = await this.getConfigs({
      category: category as ConfigCategory | undefined,
      scope: scope as ConfigScope | undefined,
    });

    switch (format) {
      case 'JSON':
        return JSON.stringify(configs, null, 2);

      case 'YAML':
        return yaml.dump(configs);

      case 'ENV':
        return configs.map(c => `${c.key.toUpperCase()}=${JSON.stringify(c.value)}`).join('\n');

      case 'INI':
        const grouped = configs.reduce(
          (acc, c) => {
            if (!acc[c.category]) acc[c.category] = [];
            acc[c.category].push(c);
            return acc;
          },
          {} as Record<string, ConfigItem[]>
        );

        return Object.entries(grouped)
          .map(
            ([category, items]) =>
              `[${category}]\n${(items as ConfigItem[]).map((c: ConfigItem) => `${c.key}=${JSON.stringify(c.value)}`).join('\n')}`
          )
          .join('\n\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Import configurations
  async importConfigs(
    data: string,
    format: string,
    userId: string,
    overwrite: boolean = false
  ): Promise<ConfigImportResult> {
    let configs: ConfigCreateInput[];

    try {
      switch (format) {
        case 'JSON':
          configs = JSON.parse(data);
          break;

        case 'YAML':
          configs = yaml.load(data) as ConfigCreateInput[];
          break;

        case 'ENV':
          configs = data
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => {
              const [key, ...valueParts] = line.split('=');
              return {
                key: key.toLowerCase(),
                value: JSON.parse(valueParts.join('=')),
                category: ConfigCategory.SYSTEM_CONFIG,
                scope: ConfigScope.GLOBAL,
                dataType: ConfigDataType.STRING,
              };
            });
          break;

        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format} data: ${(error as Error).message}`);
    }

    const results = await Promise.allSettled(
      configs.map(async config => {
        // Check if config exists
        const supabase = await this.getSupabase();
        const existing = await supabase.from('API').select('uuid').eq('name', config.key).single();

        if (existing.data && !overwrite) {
          throw new Error(`Configuration ${config.key} already exists`);
        }

        if (existing.data) {
          return this.updateConfig(existing.data.uuid, config.value as ConfigValue, userId);
        } else {
          return this.createConfig(config, userId);
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      succeeded,
      failed,
      errors: results
        .map((r, _i) => {
          if (r.status === 'rejected') {
            return {
              key: configs[_i].key,
              error: r.reason?.message || 'Unknown error',
            };
          }
          return null;
        })
        .filter((validation): validation is { key: string; error: string } => Boolean(validation)),
    };
  }
}

// Initialize service (commented out to prevent SSR issues)
// const configService = ConfigService.getInstance();

// Export for use in resolvers
export const getConfigService = () => ConfigService.getInstance();

// Get service instance for resolvers
const configService = getConfigService();

// Database config type with snake_case fields
interface DatabaseConfig
  extends Omit<
    ConfigItem,
    | 'defaultValue'
    | 'scopeId'
    | 'dataType'
    | 'accessLevel'
    | 'isInherited'
    | 'inheritedFrom'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedBy'
  > {
  default_value?: ConfigValue;
  scope_id?: string | null;
  data_type?: ConfigDataType;
  access_level?: ConfigAccessLevel;
  is_inherited?: boolean;
  inherited_from?: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

// Helper function to map database config to GraphQL type
function mapConfigToGraphQL(
  config: ConfigItem | DatabaseConfig,
  permissions?: ConfigPermissions
): ConfigItem {
  const isConfigItem = 'defaultValue' in config;
  const dbConfig = config as DatabaseConfig;
  const configItem = config as ConfigItem;

  return {
    id: config.id,
    key: config.key,
    value: config.value,
    defaultValue: isConfigItem ? configItem.defaultValue : dbConfig.default_value,
    category: config.category,
    scope: config.scope,
    scopeId: isConfigItem ? configItem.scopeId : (dbConfig.scope_id ?? undefined),
    description: config.description,
    dataType: isConfigItem ? configItem.dataType : (dbConfig.data_type ?? ConfigDataType.STRING),
    validation: config.validation,
    metadata: config.metadata,
    tags: config.tags || [],
    accessLevel: isConfigItem
      ? configItem.accessLevel
      : (dbConfig.access_level ?? ConfigAccessLevel.READ_WRITE),
    isEditable: Boolean(
      permissions?.canWrite && !dbConfig.is_inherited && !(isConfigItem && configItem.isInherited)
    ),
    isInherited: isConfigItem
      ? (configItem.isInherited ?? false)
      : (dbConfig.is_inherited ?? false),
    inheritedFrom: isConfigItem ? configItem.inheritedFrom : (dbConfig.inherited_from ?? undefined),
    createdAt: isConfigItem ? configItem.createdAt : (dbConfig.created_at ?? new Date()),
    updatedAt: isConfigItem ? configItem.updatedAt : (dbConfig.updated_at ?? new Date()),
    updatedBy: isConfigItem ? configItem.updatedBy : dbConfig.updated_by,
  };
}

// Type-safe resolver definitions
type ConfigQueryResolvers = {
  productFormOptions: (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
    _info: GraphQLResolveInfo
  ) => Promise<any>;
  configCardData: (
    _parent: unknown,
    args: { input: ConfigInput },
    context: GraphQLContext,
    _info: GraphQLResolveInfo
  ) => Promise<any>;
  [key: string]: any;
};

type ConfigMutationResolvers = {
  [key: string]: any;
};

// GraphQL Resolvers with explicit typing
export const configResolvers = {
  Query: {
    productFormOptions: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
      _info: GraphQLResolveInfo
    ) => {
      try {
        const supabase = context.supabase;

        // Fetch all product types directly from data_code table
        const { data: typeData, error: typeError } = await supabase
          .from('data_code')
          .select('type')
          .not('type', 'is', null)
          .neq('type', '')
          .neq('type', '-')
          .order('type');

        if (typeError) throw typeError;

        // Get unique types - already filtered at database level
        const uniqueTypes = Array.from(new Set(typeData?.map(item => item.type) || []));

        const types = uniqueTypes.map(type => ({
          value: type,
          label: type,
          description: null,
          isDefault: false,
          isDisabled: false,
        }));

        // Fetch colours
        const { data: colourData, error: colourError } = await supabase
          .from('data_code')
          .select('colour')
          .not('colour', 'is', null)
          .order('colour');

        if (colourError) throw colourError;

        // Get unique colours
        const uniqueColours = Array.from(new Set(colourData?.map(item => item.colour) || []));
        const colours = uniqueColours
          .filter(colour => colour)
          .map(colour => ({
            value: colour,
            label: colour,
            description: null,
            isDefault: false,
            isDisabled: false,
          }));

        // Units (hardcoded for now - could be from config table)
        const units = [
          { value: 'PCS', label: 'Pieces', description: null, isDefault: true, isDisabled: false },
          { value: 'BOX', label: 'Box', description: null, isDefault: false, isDisabled: false },
          {
            value: 'PALLET',
            label: 'Pallet',
            description: null,
            isDefault: false,
            isDisabled: false,
          },
        ];

        // Suppliers - not needed for Stock Distribution Card, return empty array
        const suppliers: unknown[] = [];

        return {
          colours,
          types,
          units,
          suppliers,
        };
      } catch (error) {
        console.error('[productFormOptions] Error:', error);
        // Better error handling with more details
        if (error instanceof Error) {
          throw new Error(`Failed to fetch product form options: ${error.message}`);
        } else {
          throw new Error(`Failed to fetch product form options: ${JSON.stringify(error)}`);
        }
      }
    },
    configCardData: async (
      _parent: unknown,
      args: { input: ConfigInput },
      context: GraphQLContext,
      _info: GraphQLResolveInfo
    ) => {
      try {
        const { input } = args;
        const userId = context.user?.id;
        const cacheKey = `config-card-data:${JSON.stringify(input)}:${userId}`;

        return await withCache(
          cacheKey,
          async () => {
            // Get configs
            const configs = await configService.getConfigs(input, userId);

            // Get permissions
            const permissions = await configService.getUserPermissions(userId || '');

            // Group by category
            const categoryGroups = configs.reduce(
              (acc, config) => {
                const category = config.category;
                if (!acc[category]) {
                  acc[category] = {
                    category: category as ConfigCategory,
                    label: category
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                    description: `${category} configurations`,
                    icon: getCategoryIcon(category),
                    items: [],
                    count: 0,
                    editableCount: 0,
                    lastUpdated: undefined,
                  };
                }

                (acc[category] as ConfigCategoryGroup).items.push(config);
                (acc[category] as ConfigCategoryGroup).count++;
                if (config.isEditable) (acc[category] as ConfigCategoryGroup).editableCount++;

                const updatedAt = new Date(config.updatedAt);
                if (
                  !(acc[category] as ConfigCategoryGroup).lastUpdated ||
                  updatedAt > new Date((acc[category] as ConfigCategoryGroup).lastUpdated || 0)
                ) {
                  (acc[category] as ConfigCategoryGroup).lastUpdated = updatedAt;
                }

                return acc;
              },
              {} as Record<string, ConfigCategoryGroup>
            );

            // Calculate summary
            const summary = {
              totalConfigs: configs.length,
              editableConfigs: configs.filter(c => c.isEditable).length,
              inheritedConfigs: configs.filter(c => c.isInherited).length,
              customConfigs: configs.filter(c => !c.isInherited && !c.defaultValue).length,
              byCategory: Object.values(categoryGroups).map((group: ConfigCategoryGroup) => ({
                category: group.category,
                count: group.count,
                editableCount: group.editableCount,
              })),
              byScope: calculateScopeDistribution(configs),
              recentChanges: configs.filter(c => {
                const updatedAt = new Date(c.updatedAt);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return updatedAt > oneDayAgo;
              }).length,
            };

            // Validate all configs
            const validationResults = await Promise.all(
              configs.map(async config => {
                const validation = await configService.validateConfigValue(
                  config,
                  config.value as ConfigValue
                );
                return { configId: config.id, validation };
              })
            );

            const validation = {
              isValid: validationResults.every(r => r.validation.isValid),
              errors: validationResults
                .filter(r => !r.validation.isValid)
                .flatMap(r =>
                  r.validation.errors.map((e: ConfigValidationError) => ({
                    configId: r.configId,
                    key: configs.find(c => c.id === r.configId)?.key,
                    message: e.message,
                    details: e,
                  }))
                ),
              warnings: [],
            };

            // Build permissions object
            const configPermissions = {
              canRead: true,
              canWrite: permissions.isAdmin || permissions.isSuperAdmin,
              canDelete: permissions.isSuperAdmin,
              canManageGlobal: permissions.isSuperAdmin,
              canManageDepartment: permissions.isAdmin || permissions.departments.length > 0,
              canManageUsers: permissions.isAdmin || permissions.isSuperAdmin,
              accessibleScopes: getAccessibleScopes(permissions) as ConfigScope[],
              accessibleCategories: getAccessibleCategories(permissions) as ConfigCategory[],
            } as ConfigPermissions;

            return {
              configs: configs.map(c => mapConfigToGraphQL(c, configPermissions)),
              categories: Object.values(categoryGroups),
              summary,
              permissions: configPermissions,
              validation,
              lastUpdated: new Date(),
              refreshInterval: 60,
              dataSource: 'config-service',
            };
          },
          300 // Cache for 5 minutes
        );
      } catch (error) {
        console.error('Error fetching config card data:', error);
        throw new Error('Failed to fetch configuration data');
      }
    },

    configItem: async (
      _parent: unknown,
      args: { key: string; scope: string; scopeId?: string },
      context: GraphQLContext
    ) => {
      try {
        const configs = await configService.getConfigs(
          {
            scope: args.scope as ConfigScope | undefined,
            scopeId: args.scopeId,
          },
          context.user?.id
        );

        const config = configs.find(c => c.key === args.key);
        return config ? mapConfigToGraphQL(config) : null;
      } catch (error) {
        console.error('Error fetching config item:', error);
        throw new Error('Failed to fetch configuration item');
      }
    },

    configHistory: async (
      _parent: unknown,
      _args: { configId: string; limit?: number },
      _context: GraphQLContext
    ) => {
      // Return empty array since config_history table doesn't exist
      return [];
    },

    configTemplates: async (
      _parent: unknown,
      _args: { category?: string; scope?: string; isPublic?: boolean },
      _context: GraphQLContext
    ) => {
      // Return empty array since config_templates table doesn't exist
      return [];
    },

    configDefaults: async (
      _parent: unknown,
      args: { category?: string },
      context: GraphQLContext
    ) => {
      try {
        const configs = await configService.getConfigs({
          scope: ConfigScope.GLOBAL,
          category: args.category as ConfigCategory | undefined,
          includeDefaults: true,
        });

        return configs
          .filter(c => c.defaultValue !== null && c.defaultValue !== undefined)
          .map(config => mapConfigToGraphQL(config));
      } catch (error) {
        console.error('Error fetching config defaults:', error);
        throw new Error('Failed to fetch configuration defaults');
      }
    },

    validateConfig: async (
      _parent: unknown,
      args: { input: ConfigCreateInput | ConfigUpdateInput },
      context: GraphQLContext
    ) => {
      try {
        return await configService.validateConfig(args.input);
      } catch (error) {
        console.error('Error validating config:', error);
        throw new Error('Failed to validate configuration');
      }
    },
  },

  Mutation: {
    createConfig: async (
      _parent: unknown,
      args: { input: ConfigCreateInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        const config = await configService.createConfig(args.input, context.user.id);
        return mapConfigToGraphQL(config);
      } catch (error) {
        console.error('Error creating config:', error);
        throw new Error('Failed to create configuration');
      }
    },

    updateConfig: async (
      _parent: unknown,
      args: { input: ConfigUpdateInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        const config = await configService.updateConfig(
          args.input.id,
          args.input.value as ConfigValue,
          context.user.id,
          args.input.metadata
        );
        return mapConfigToGraphQL(config);
      } catch (error) {
        console.error('Error updating config:', error);
        throw new Error('Failed to update configuration');
      }
    },

    deleteConfig: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        const supabase = await configService.getSupabase();
        const { error } = await supabase.from('API').delete().eq('uuid', args.id);

        if (error) throw error;

        // Clear cache
        configService.cache.clear();

        return true;
      } catch (error) {
        console.error('Error deleting config:', error);
        throw new Error('Failed to delete configuration');
      }
    },

    batchUpdateConfigs: async (
      _parent: unknown,
      args: { input: ConfigBatchUpdateInput },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        const results = await Promise.allSettled(
          args.input.updates.map(update =>
            configService.updateConfig(
              update.id,
              update.value as ConfigValue,
              context.user!.id,
              update.metadata
            )
          )
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const configs = results
          .filter(r => r.status === 'fulfilled')
          .map(r => mapConfigToGraphQL((r as PromiseFulfilledResult<ConfigItem>).value));

        return {
          succeeded,
          failed,
          errors: results
            .map((r, _i) => {
              if (r.status === 'rejected') {
                return {
                  configId: args.input.updates[_i].id,
                  error: r.reason?.message || 'Unknown error',
                };
              }
              return null;
            })
            .filter(Boolean),
          configs,
        };
      } catch (error) {
        console.error('Error batch updating configs:', error);
        throw new Error('Failed to batch update configurations');
      }
    },

    resetConfig: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        // Get config with default value
        const supabase = await configService.getSupabase();
        const { data: config, error: fetchError } = await supabase
          .from('API')
          .select('*')
          .eq('uuid', args.id)
          .single();

        if (fetchError || !config) {
          throw new Error('Configuration not found');
        }

        // For API table, we don't have default_value field, so use empty string as fallback
        const defaultValue = '';

        // Reset to default
        const updatedConfig = await configService.updateConfig(
          args.id,
          defaultValue,
          context.user.id
        );

        return mapConfigToGraphQL(updatedConfig);
      } catch (error) {
        console.error('Error resetting config:', error);
        throw new Error('Failed to reset configuration');
      }
    },

    resetConfigCategory: async (
      _parent: unknown,
      args: { category: string; scope: string; scopeId?: string },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        // Get all configs in category
        const configs = await configService.getConfigs({
          category: args.category as ConfigCategory | undefined,
          scope: args.scope as ConfigScope | undefined,
          scopeId: args.scopeId,
        });

        const results = await Promise.allSettled(
          configs
            .filter(c => c.defaultValue !== null && c.defaultValue !== undefined)
            .map(config =>
              configService.updateConfig(
                config.id,
                config.defaultValue as ConfigValue,
                context.user!.id,
                {
                  resetAt: new Date(),
                }
              )
            )
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
          succeeded,
          failed,
          errors: results
            .map((r, _i) => {
              if (r.status === 'rejected') {
                return {
                  error: r.reason?.message || 'Unknown error',
                };
              }
              return null;
            })
            .filter(Boolean),
        };
      } catch (error) {
        console.error('Error resetting config category:', error);
        throw new Error('Failed to reset configuration category');
      }
    },

    createConfigTemplate: async (
      _parent: unknown,
      args: {
        name: string;
        description?: string;
        category: string;
        scope: string;
        configIds: string[];
        isPublic?: boolean;
      },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        // Get configs to include in template
        const supabase = await configService.getSupabase();
        const { data: configs, error: fetchError } = await supabase
          .from('API')
          .select('*')
          .in('uuid', args.configIds);

        if (fetchError || !configs || configs.length === 0) {
          throw new Error('No valid configurations found');
        }

        // Simplified template creation (no table available)
        const templateData = {
          id: uuidv4(),
          name: args.name,
          description: args.description,
          category: args.category,
          scope: args.scope,
          configs: configs.map((c: any) => ({
            key: c.name,
            value: c.value,
            dataType: 'STRING',
            validation: {},
          })),
          tags: [],
          is_public: args.isPublic || false,
          created_by: context.user.id,
          created_at: new Date(),
          usage_count: 0,
        };

        return templateData;
      } catch (error) {
        console.error('Error creating config template:', error);
        throw new Error('Failed to create configuration template');
      }
    },

    applyConfigTemplate: async (
      _parent: unknown,
      args: { templateId: string; scope: string; scopeId: string },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        // Template functionality disabled (no table available)
        throw new Error(
          'Template functionality is not available - config_templates table does not exist'
        );
      } catch (error) {
        console.error('Error applying config template:', error);
        throw new Error('Failed to apply configuration template');
      }
    },

    exportConfigs: async (
      _parent: unknown,
      args: { category?: string; scope?: string; format: string },
      context: GraphQLContext
    ) => {
      try {
        return await configService.exportConfigs(args.category, args.scope, args.format);
      } catch (error) {
        console.error('Error exporting configs:', error);
        throw new Error('Failed to export configurations');
      }
    },

    importConfigs: async (
      _parent: unknown,
      args: { data: string; format: string; overwrite?: boolean },
      context: GraphQLContext
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }

        return await configService.importConfigs(
          args.data,
          args.format,
          context.user.id,
          args.overwrite || false
        );
      } catch (error) {
        console.error('Error importing configs:', error);
        throw new Error('Failed to import configurations');
      }
    },
  },

  Subscription: {
    configChanged: {
      subscribe: async (
        _parent: unknown,
        args: { category?: string; scope?: string; keys?: string[] },
        context: GraphQLContext
      ) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        const _channel = `config-changes:${args.category || '*'}:${args.scope || '*'}`;

        // In a real implementation, you would:
        // 1. Set up a real-time subscription using your pubsub system
        // 2. Filter events based on the provided arguments
        // 3. Return an async iterator

        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder implementation
            yield { configChanged: {} };
          },
        };
      },
    },

    configBatchChanged: {
      subscribe: async (
        _parent: unknown,
        args: { category?: string; scope?: string },
        context: GraphQLContext
      ) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        const _channel = `config-batch-changes:${args.category || '*'}:${args.scope || '*'}`;

        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder implementation
            yield { configBatchChanged: [] };
          },
        };
      },
    },

    configValidationChanged: {
      subscribe: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder implementation
            yield { configValidationChanged: { isValid: true, errors: [], warnings: [] } };
          },
        };
      },
    },
  },
};

// Helper functions
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    SYSTEM_CONFIG: 'settings',
    USER_PREFERENCES: 'person',
    DEPARTMENT_CONFIG: 'business',
    NOTIFICATION_CONFIG: 'notifications',
    API_CONFIG: 'api',
    SECURITY_CONFIG: 'security',
    DISPLAY_CONFIG: 'display_settings',
    WORKFLOW_CONFIG: 'account_tree',
  };
  return iconMap[category] || 'settings';
}

function calculateScopeDistribution(configs: ConfigItem[]) {
  const scopes = ['GLOBAL', 'DEPARTMENT', 'USER', 'ROLE'];
  const _total = configs.length || 1;

  return scopes.map(scope => {
    const count = configs.filter(c => c.scope === scope).length;
    return {
      scope,
      count,
      editableCount: configs.filter(c => c.scope === scope && c.isEditable).length,
    };
  });
}

function getAccessibleScopes(permissions: ConfigUserPermissions): string[] {
  const scopes = ['USER'];

  if (permissions.departments?.length > 0) {
    scopes.push('DEPARTMENT');
  }

  if (permissions.isAdmin || permissions.isSuperAdmin) {
    scopes.push('ROLE');
  }

  if (permissions.isSuperAdmin) {
    scopes.push('GLOBAL');
  }

  return scopes;
}

function getAccessibleCategories(permissions: ConfigUserPermissions): string[] {
  const categories = ['USER_PREFERENCES', 'DISPLAY_CONFIG', 'NOTIFICATION_CONFIG'];

  if (permissions.departments?.length > 0) {
    categories.push('DEPARTMENT_CONFIG', 'WORKFLOW_CONFIG');
  }

  if (permissions.isAdmin || permissions.isSuperAdmin) {
    categories.push('SYSTEM_CONFIG', 'API_CONFIG');
  }

  if (permissions.isSuperAdmin) {
    categories.push('SECURITY_CONFIG');
  }

  return categories;
}
