import { GraphQLResolveInfo } from 'graphql';
import { GraphQLContext as Context } from './index';
import { createClient } from '@/app/utils/supabase/server';
import { dashboardSettingsService } from '../../../app/services/dashboardSettingsService';
import { withRetry, withCache } from '../../utils/error-handling';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';
import {
  ConfigItem,
  ConfigHistory,
  ConfigInput,
  ConfigUpdateInput,
  ConfigCreateInput,
  ConfigBatchUpdateInput,
  ConfigValidationResult,
  ConfigValidationResultExtended,
  ConfigValidationError,
  ConfigUserPermissions,
  ConfigCategoryGroup,
  ConfigSummary,
  ConfigPermissions,
  ConfigTemplate,
  ConfigImportResult,
  ConfigHistoryParams,
  ConfigCardData,
  ValidationRules,
  ConfigMetadata,
  ConfigValue,
  toConfigItem,
  createConfigValidator,
  ConfigDataType,
  ConfigCategory,
  ConfigScope,
  ConfigAccessLevel
} from '@/lib/types/config.types';

// Configuration service singleton
class ConfigService {
  private static instance: ConfigService;
  public cache = new Map<string, { data: ConfigItem[]; timestamp: number }>();
  public cacheTimeout = 5 * 60 * 1000; // 5 minutes
  public supabase = createClient();

  // Get Supabase client dynamically to support SSR
  async getSupabase() {
    return await createClient();
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
      // Fetch from database
      let query = this.supabase
        .from('system_configs')
        .select('*');

      // Apply filters
      if (input.category) {
        query = query.eq('category', input.category);
      }
      if (input.scope) {
        query = query.eq('scope', input.scope);
      }
      if (input.scopeId) {
        query = query.eq('scope_id', input.scopeId);
      }
      if (input.search) {
        query = query.or(`key.ilike.%${input.search}%,description.ilike.%${input.search}%`);
      }
      if (input.tags && input.tags.length > 0) {
        query = query.contains('tags', input.tags);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process inherited configs if needed
      let configs = data || [];
      if (input.includeInherited) {
        configs = await this.processInheritedConfigs(configs, input);
      }

      // Apply access control
      configs = await this.applyAccessControl(configs, userId);

      this.cache.set(cacheKey, { data: configs, timestamp: Date.now() });
      return configs;
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw new Error('Failed to fetch configurations');
    }
  }

  // Process inherited configurations
  private async processInheritedConfigs(configs: ConfigItem[], input: ConfigInput): Promise<ConfigItem[]> {
    const result = [...configs];
    
    // Check for department inheritance
    if (input.scope === 'USER' && input.departmentId) {
      const departmentConfigs = await this.getConfigs({
        ...input,
        scope: 'DEPARTMENT',
        scopeId: input.departmentId
      });
      
      // Merge department configs
      departmentConfigs.forEach(deptConfig => {
        if (!result.find(c => c.key === deptConfig.key)) {
          result.push({
            ...deptConfig,
            isInherited: true,
            inheritedFrom: 'DEPARTMENT'
          });
        }
      });
    }
    
    // Check for global inheritance
    if (input.includeDefaults) {
      const globalConfigs = await this.getConfigs({
        ...input,
        scope: 'GLOBAL',
        scopeId: null
      });
      
      // Merge global configs
      globalConfigs.forEach(globalConfig => {
        if (!result.find(c => c.key === globalConfig.key)) {
          result.push({
            ...globalConfig,
            isInherited: true,
            inheritedFrom: 'GLOBAL'
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
        value: hasReadAccess ? config.value : null
      };
    });
  }

  // Check if user has specific access to config
  private checkAccess(config: ConfigItem, permissions: ConfigUserPermissions, action: string): boolean {
    switch (config.accessLevel) {
      case 'PUBLIC':
        return true;
      case 'AUTHENTICATED':
        return !!permissions.userId;
      case 'DEPARTMENT':
        return permissions.departments?.includes(config.scopeId);
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
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return { userId, isAdmin: false, isSuperAdmin: false, departments: [] };
    }

    // Get user roles
    const { data: userRoles } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    // Get user departments
    const { data: userDepartments } = await this.supabase
      .from('user_departments')
      .select('department_id')
      .eq('user_id', userId);

    return {
      userId,
      isAdmin: userRoles?.some((r: { role: string }) => r.role === 'admin') || false,
      isSuperAdmin: userRoles?.some((r: { role: string }) => r.role === 'super_admin') || false,
      departments: userDepartments?.map((d: { department_id: string }) => d.department_id) || [],
      roles: userRoles?.map((r: { role: string }) => r.role) || []
    };
  }

  // Create new config
  async createConfig(input: ConfigCreateInput, userId: string): Promise<ConfigItem> {
    try {
      const validation = await this.validateConfig(input);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors[0]?.message}`);
      }

      const { data, error } = await this.supabase
        .from('system_configs')
        .insert({
          id: uuidv4(),
          ...input,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

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
  async updateConfig(id: string, value: ConfigValue, userId: string, metadata?: ConfigMetadata): Promise<ConfigItem> {
    try {
      // Get current config
      const { data: currentConfig, error: fetchError } = await this.supabase
        .from('system_configs')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentConfig) {
        throw new Error('Configuration not found');
      }

      // Validate new value
      const validation = await this.validateConfigValue(currentConfig, value);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors[0]?.message}`);
      }

      // Update config
      const { data, error } = await this.supabase
        .from('system_configs')
        .update({
          value,
          metadata: { ...(currentConfig.metadata as object || {}), ...metadata },
          updated_by: userId,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add to history
      await this.addToHistory(id, currentConfig.value, value, userId);

      // Clear cache
      this.cache.clear();

      return toConfigItem(data);
    } catch (error) {
      console.error('Error updating config:', error);
      throw new Error('Failed to update configuration');
    }
  }

  // Add config change to history
  private async addToHistory(
    configId: string,
    previousValue: ConfigValue,
    newValue: ConfigValue,
    userId: string,
    changeReason?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('config_history')
        .insert({
          id: uuidv4(),
          config_id: configId,
          previous_value: previousValue,
          new_value: newValue,
          changed_by: userId,
          changed_at: new Date(),
          change_reason: changeReason
        });
    } catch (error) {
      console.error('Error adding to config history:', error);
    }
  }

  // Validate configuration
  async validateConfig(input: ConfigCreateInput | ConfigUpdateInput): Promise<ConfigValidationResult> {
    const errors = [];

    // Required fields validation
    if (!input.key) errors.push({ message: 'Key is required' });
    if (!input.category) errors.push({ message: 'Category is required' });
    if (!input.scope) errors.push({ message: 'Scope is required' });
    if (!input.dataType) errors.push({ message: 'Data type is required' });

    // Data type validation
    if (input.value !== null && input.value !== undefined) {
      const typeValidation = this.validateDataType(input.value, input.dataType);
      if (!typeValidation.isValid) {
        errors.push({ message: typeValidation.error });
      }
    }

    // Custom validation rules
    if (input.validation) {
      const customValidation = await this.runCustomValidation(input.value, input.validation);
      if (!customValidation.isValid) {
        errors.push(...customValidation.errors);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate config value
  async validateConfigValue(config: ConfigItem, value: ConfigValue): Promise<ConfigValidationResult> {
    return this.validateConfig({ ...config, value });
  }

  // Validate data type
  private validateDataType(value: ConfigValue, dataType: ConfigDataType): { isValid: boolean; error?: string } {
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
        } catch (e) {
          return { isValid: false, error: 'Invalid JSON' };
        }
      case 'ARRAY':
        return { isValid: Array.isArray(value) };
      case 'DATE':
        return { isValid: !isNaN(Date.parse(value)) };
      case 'COLOR':
        return { isValid: /^#[0-9A-F]{6}$/i.test(value) };
      case 'URL':
        try {
          new URL(value);
          return { isValid: true };
        } catch (e) {
          return { isValid: false, error: 'Invalid URL' };
        }
      default:
        return { isValid: true };
    }
  }

  // Run custom validation rules
  private async runCustomValidation(value: ConfigValue, rules: ValidationRules): Promise<ConfigValidationResult> {
    const errors = [];

    // Min/max validation
    if (rules.min !== undefined && value < rules.min) {
      errors.push({ message: `Value must be at least ${rules.min}` });
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push({ message: `Value must be at most ${rules.max}` });
    }

    // Pattern validation
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
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
    const configs = await this.getConfigs({ category, scope });
    
    switch (format) {
      case 'JSON':
        return JSON.stringify(configs, null, 2);
      
      case 'YAML':
        return yaml.dump(configs);
      
      case 'ENV':
        return configs
          .map(c => `${c.key.toUpperCase()}=${JSON.stringify(c.value)}`)
          .join('\n');
      
      case 'INI':
        const grouped = configs.reduce((acc, c) => {
          if (!acc[c.category]) acc[c.category] = [];
          acc[c.category].push(c);
          return acc;
        }, {} as Record<string, ConfigItem[]>);
        
        return Object.entries(grouped)
          .map(([category, items]) => 
            `[${category}]\n${items.map((c: ConfigItem) => `${c.key}=${JSON.stringify(c.value)}`).join('\n')}`
          )
          .join('\n\n');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Import configurations
  async importConfigs(data: string, format: string, userId: string, overwrite: boolean = false): Promise<ConfigImportResult> {
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
          configs = data.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => {
              const [key, ...valueParts] = line.split('=');
              return {
                key: key.toLowerCase(),
                value: JSON.parse(valueParts.join('=')),
                category: 'SYSTEM_CONFIG',
                scope: 'GLOBAL',
                dataType: 'STRING'
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
        const existing = await this.supabase
          .from('system_configs')
          .select('id')
          .eq('key', config.key)
          .eq('scope', config.scope)
          .eq('scope_id', config.scopeId)
          .single();

        if (existing.data && !overwrite) {
          throw new Error(`Configuration ${config.key} already exists`);
        }

        if (existing.data) {
          return this.updateConfig(existing.data.id, config.value, userId);
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
        .map((r, i) => {
          if (r.status === 'rejected') {
            return {
              key: configs[i].key,
              error: r.reason?.message || 'Unknown error'
            };
          }
          return null;
        })
        .filter(Boolean)
    };
  }
}

// Initialize service (commented out to prevent SSR issues)
// const configService = ConfigService.getInstance();

// Export for use in resolvers
export const getConfigService = () => ConfigService.getInstance();

// Get service instance for resolvers
const configService = getConfigService();

// Helper function to map database config to GraphQL type
function mapConfigToGraphQL(config: ConfigItem, permissions?: ConfigPermissions): ConfigItem {
  return {
    id: config.id,
    key: config.key,
    value: config.value,
    defaultValue: config.default_value,
    category: config.category,
    scope: config.scope,
    scopeId: config.scope_id,
    description: config.description,
    dataType: config.data_type,
    validation: config.validation,
    metadata: config.metadata,
    tags: config.tags || [],
    accessLevel: config.access_level || 'AUTHENTICATED',
    isEditable: permissions?.canWrite && !config.is_inherited,
    isInherited: config.is_inherited || false,
    inheritedFrom: config.inherited_from,
    createdAt: config.created_at,
    updatedAt: config.updated_at,
    updatedBy: config.updated_by,
    history: []
  };
}

// GraphQL Resolvers
export const configResolvers = {
  Query: {
    configCardData: async (
      _parent: unknown,
      args: { input: ConfigInput },
      context: Context,
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
            const permissions = await configService.getUserPermissions(userId);
            
            // Group by category
            const categoryGroups = configs.reduce((acc, config) => {
              const category = config.category;
              if (!acc[category]) {
                acc[category] = {
                  category,
                  label: category.replace(/_/g, ' ').toLowerCase()
                    .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  description: `${category} configurations`,
                  icon: getCategoryIcon(category),
                  items: [],
                  count: 0,
                  editableCount: 0,
                  lastUpdated: null
                };
              }
              
              (acc[category] as ConfigCategoryGroup).items.push(config);
              (acc[category] as ConfigCategoryGroup).count++;
              if (config.isEditable) (acc[category] as ConfigCategoryGroup).editableCount++;
              
              const updatedAt = new Date(config.updatedAt);
              if (!(acc[category] as ConfigCategoryGroup).lastUpdated || updatedAt > new Date((acc[category] as ConfigCategoryGroup).lastUpdated || 0)) {
                (acc[category] as ConfigCategoryGroup).lastUpdated = updatedAt;
              }
              
              return acc;
            }, {} as Record<string, ConfigCategoryGroup>);
            
            // Calculate summary
            const summary = {
              totalConfigs: configs.length,
              editableConfigs: configs.filter(c => c.isEditable).length,
              inheritedConfigs: configs.filter(c => c.isInherited).length,
              customConfigs: configs.filter(c => !c.isInherited && !c.defaultValue).length,
              byCategory: Object.values(categoryGroups).map(group => ({
                category: group.category,
                count: group.count,
                editableCount: group.editableCount
              })),
              byScope: calculateScopeDistribution(configs),
              recentChanges: configs.filter(c => {
                const updatedAt = new Date(c.updatedAt);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return updatedAt > oneDayAgo;
              }).length
            };
            
            // Validate all configs
            const validationResults = await Promise.all(
              configs.map(async config => {
                const validation = await configService.validateConfigValue(config, config.value);
                return { configId: config.id, validation };
              })
            );
            
            const validation = {
              isValid: validationResults.every(r => r.validation.isValid),
              errors: validationResults
                .filter(r => !r.validation.isValid)
                .flatMap(r => r.validation.errors.map((e: ConfigValidationError) => ({
                  configId: r.configId,
                  key: configs.find(c => c.id === r.configId)?.key,
                  message: e.message,
                  details: e
                }))),
              warnings: []
            };
            
            // Build permissions object
            const configPermissions = {
              canRead: true,
              canWrite: permissions.isAdmin || permissions.isSuperAdmin,
              canDelete: permissions.isSuperAdmin,
              canManageGlobal: permissions.isSuperAdmin,
              canManageDepartment: permissions.isAdmin || permissions.departments.length > 0,
              canManageUsers: permissions.isAdmin || permissions.isSuperAdmin,
              accessibleScopes: getAccessibleScopes(permissions),
              accessibleCategories: getAccessibleCategories(permissions)
            };
            
            return {
              configs: configs.map(c => mapConfigToGraphQL(c, configPermissions)),
              categories: Object.values(categoryGroups),
              summary,
              permissions: configPermissions,
              validation,
              lastUpdated: new Date(),
              refreshInterval: 60,
              dataSource: 'config-service'
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
      context: Context
    ) => {
      try {
        const configs = await configService.getConfigs({
          scope: args.scope,
          scopeId: args.scopeId
        }, context.user?.id);
        
        const config = configs.find(c => c.key === args.key);
        return config ? mapConfigToGraphQL(config) : null;
      } catch (error) {
        console.error('Error fetching config item:', error);
        throw new Error('Failed to fetch configuration item');
      }
    },

    configHistory: async (
      _parent: unknown,
      args: { configId: string; limit?: number },
      context: Context
    ) => {
      try {
        const { data, error } = await configService.supabase
          .from('config_history')
          .select('*')
          .eq('config_id', args.configId)
          .order('changed_at', { ascending: false })
          .limit(args.limit || 50);
        
        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('Error fetching config history:', error);
        throw new Error('Failed to fetch configuration history');
      }
    },

    configTemplates: async (
      _parent: unknown,
      args: { category?: string; scope?: string; isPublic?: boolean },
      context: Context
    ) => {
      try {
        let query = configService.supabase
          .from('config_templates')
          .select('*');
        
        if (args.category) query = query.eq('category', args.category);
        if (args.scope) query = query.eq('scope', args.scope);
        if (args.isPublic !== undefined) query = query.eq('is_public', args.isPublic);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('Error fetching config templates:', error);
        throw new Error('Failed to fetch configuration templates');
      }
    },

    configDefaults: async (
      _parent: unknown,
      args: { category?: string },
      context: Context
    ) => {
      try {
        const configs = await configService.getConfigs({
          scope: 'GLOBAL',
          category: args.category,
          includeDefaults: true
        });
        
        return configs
          .filter(c => c.defaultValue !== null && c.defaultValue !== undefined)
          .map(mapConfigToGraphQL);
      } catch (error) {
        console.error('Error fetching config defaults:', error);
        throw new Error('Failed to fetch configuration defaults');
      }
    },

    validateConfig: async (
      _parent: unknown,
      args: { input: ConfigCreateInput | ConfigUpdateInput },
      context: Context
    ) => {
      try {
        return await configService.validateConfig(args.input);
      } catch (error) {
        console.error('Error validating config:', error);
        throw new Error('Failed to validate configuration');
      }
    }
  },

  Mutation: {
    createConfig: async (
      _parent: unknown,
      args: { input: ConfigCreateInput },
      context: Context
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
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        const config = await configService.updateConfig(
          args.input.id,
          args.input.value,
          context.user.id,
          args.input.metadata
        );
        return mapConfigToGraphQL(config);
      } catch (error) {
        console.error('Error updating config:', error);
        throw new Error('Failed to update configuration');
      }
    },

    deleteConfig: async (
      _parent: unknown,
      args: { id: string },
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        const { error } = await configService.supabase
          .from('system_configs')
          .delete()
          .eq('id', args.id);
        
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
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        const results = await Promise.allSettled(
          args.input.updates.map((update) =>
            configService.updateConfig(
              update.id,
              update.value,
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
            .map((r, i) => {
              if (r.status === 'rejected') {
                return {
                  configId: args.input.updates[i].id,
                  error: r.reason?.message || 'Unknown error'
                };
              }
              return null;
            })
            .filter(Boolean),
          configs
        };
      } catch (error) {
        console.error('Error batch updating configs:', error);
        throw new Error('Failed to batch update configurations');
      }
    },

    resetConfig: async (
      _parent: unknown,
      args: { id: string },
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        // Get config with default value
        const { data: config, error: fetchError } = await configService.supabase
          .from('system_configs')
          .select('*')
          .eq('id', args.id)
          .single();
        
        if (fetchError || !config) {
          throw new Error('Configuration not found');
        }
        
        if (config.default_value === null || config.default_value === undefined) {
          throw new Error('No default value available for this configuration');
        }
        
        // Reset to default
        const updatedConfig = await configService.updateConfig(
          args.id,
          config.default_value,
          context.user.id,
          { resetAt: new Date() }
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
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        // Get all configs in category
        const configs = await configService.getConfigs({
          category: args.category,
          scope: args.scope,
          scopeId: args.scopeId
        });
        
        const results = await Promise.allSettled(
          configs
            .filter(c => c.defaultValue !== null && c.defaultValue !== undefined)
            .map(config =>
              configService.updateConfig(
                config.id,
                config.defaultValue,
                context.user!.id,
                { resetAt: new Date() }
              )
            )
        );
        
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
          succeeded,
          failed,
          errors: results
            .map((r, i) => {
              if (r.status === 'rejected') {
                return {
                  error: r.reason?.message || 'Unknown error'
                };
              }
              return null;
            })
            .filter(Boolean)
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
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        // Get configs to include in template
        const { data: configs, error: fetchError } = await configService.supabase
          .from('system_configs')
          .select('*')
          .in('id', args.configIds);
        
        if (fetchError || !configs || configs.length === 0) {
          throw new Error('No valid configurations found');
        }
        
        // Create template
        const { data, error } = await configService.supabase
          .from('config_templates')
          .insert({
            id: uuidv4(),
            name: args.name,
            description: args.description,
            category: args.category,
            scope: args.scope,
            configs: configs.map(c => ({
              key: c.key,
              value: c.value,
              dataType: c.data_type,
              validation: c.validation
            })),
            tags: [],
            is_public: args.isPublic || false,
            created_by: context.user.id,
            created_at: new Date(),
            usage_count: 0
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Error creating config template:', error);
        throw new Error('Failed to create configuration template');
      }
    },

    applyConfigTemplate: async (
      _parent: unknown,
      args: { templateId: string; scope: string; scopeId: string },
      context: Context
    ) => {
      try {
        if (!context.user?.id) {
          throw new Error('Authentication required');
        }
        
        // Get template
        const { data: template, error: fetchError } = await configService.supabase
          .from('config_templates')
          .select('*')
          .eq('id', args.templateId)
          .single();
        
        if (fetchError || !template) {
          throw new Error('Template not found');
        }
        
        // Apply template configs
        const results = await Promise.allSettled(
          (template.configs as Array<{key: string; value: unknown; dataType: ConfigDataType; validation?: ValidationRules}>).map(async (configDef) => {
            const input = {
              ...configDef,
              category: template.category,
              scope: args.scope,
              scopeId: args.scopeId
            };
            
            // Check if config exists
            const existing = await configService.getConfigs({
              scope: args.scope,
              scopeId: args.scopeId
            });
            
            const existingConfig = existing.find(c => c.key === configDef.key);
            
            if (existingConfig) {
              return configService.updateConfig(
                existingConfig.id,
                configDef.value,
                context.user!.id,
                { templateId: args.templateId }
              );
            } else {
              return configService.createConfig(input, context.user!.id);
            }
          })
        );
        
        // Update usage count
        await configService.supabase
          .from('config_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', args.templateId);
        
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
          succeeded,
          failed,
          errors: results
            .map((r, i) => {
              if (r.status === 'rejected') {
                return {
                  key: (template.configs as Array<{key: string}>)[i].key,
                  error: r.reason?.message || 'Unknown error'
                };
              }
              return null;
            })
            .filter(Boolean)
        };
      } catch (error) {
        console.error('Error applying config template:', error);
        throw new Error('Failed to apply configuration template');
      }
    },

    exportConfigs: async (
      _parent: unknown,
      args: { category?: string; scope?: string; format: string },
      context: Context
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
      context: Context
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
    }
  },

  Subscription: {
    configChanged: {
      subscribe: async (
        _parent: unknown,
        args: { category?: string; scope?: string; keys?: string[] },
        context: Context
      ) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        const channel = `config-changes:${args.category || '*'}:${args.scope || '*'}`;
        
        // In a real implementation, you would:
        // 1. Set up a real-time subscription using your pubsub system
        // 2. Filter events based on the provided arguments
        // 3. Return an async iterator
        
        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder implementation
            yield { configChanged: {} };
          }
        };
      }
    },

    configBatchChanged: {
      subscribe: async (
        _parent: unknown,
        args: { category?: string; scope?: string },
        context: Context
      ) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        const channel = `config-batch-changes:${args.category || '*'}:${args.scope || '*'}`;
        
        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder implementation
            yield { configBatchChanged: [] };
          }
        };
      }
    },

    configValidationChanged: {
      subscribe: async (
        _parent: unknown,
        _args: unknown,
        context: Context
      ) => {
        // Implementation depends on your subscription mechanism
        // This is a placeholder for the subscription logic
        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder implementation
            yield { configValidationChanged: { isValid: true, errors: [], warnings: [] } };
          }
        };
      }
    }
  }
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
    WORKFLOW_CONFIG: 'account_tree'
  };
  return iconMap[category] || 'settings';
}

function calculateScopeDistribution(configs: ConfigItem[]) {
  const scopes = ['GLOBAL', 'DEPARTMENT', 'USER', 'ROLE'];
  const total = configs.length || 1;
  
  return scopes.map(scope => {
    const count = configs.filter(c => c.scope === scope).length;
    return {
      scope,
      count,
      editableCount: configs.filter(c => c.scope === scope && c.isEditable).length
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
  const categories = [
    'USER_PREFERENCES',
    'DISPLAY_CONFIG',
    'NOTIFICATION_CONFIG'
  ];
  
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