/**
 * Admin Cards Migration Utilities
 * Helper functions for migrating existing data to new type-safe formats
 */

import {
  MetricType,
  ChartType,
  CategoryType,
  SearchMode,
  SearchEntity,
  MetricItem,
  PrefilledData,
  safeParseChartType,
  safeParseCategory,
  safeParseSearchMode,
  safeParseSearchEntities,
} from '@/lib/types/admin-cards';

// 專用的遷移數據類型
interface LegacyConfig {
  metrics?: unknown[];
  columns?: unknown;
  showTrend?: unknown;
  showComparison?: unknown;
  chartType?: unknown;
  dataSource?: unknown;
  description?: unknown;
  component?: unknown;
  config?: unknown;
}

interface LegacyMetric {
  type?: unknown;
  [key: string]: unknown;
}

// 類型守衛函數
function isLegacyMetric(value: unknown): value is LegacyMetric {
  return typeof value === 'object' && value !== null;
}

function isStringOrObject(value: unknown): value is string | LegacyMetric {
  return typeof value === 'string' || isLegacyMetric(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Migration utility for config objects
 * Ensures backward compatibility while enforcing type safety
 */
export class AdminCardsMigration {
  /**
   * Migrate StatsCard configuration
   */
  static migrateStatsCardConfig(config: LegacyConfig): {
    statTypes: MetricItem[];
    columns: number;
    showTrend: boolean;
    showComparison: boolean;
  } {
    const metrics = Array.isArray(config.metrics) ? config.metrics : [];
    const statTypes = metrics
      .filter(isStringOrObject)
      .filter(
        (m): m is string | LegacyMetric =>
          typeof m === 'string' || (typeof m === 'object' && m !== null && 'type' in m)
      )
      .map((metric: string | LegacyMetric): MetricItem => {
        if (typeof metric === 'string') {
          return { type: metric as MetricType };
        }
        return metric as MetricItem;
      });

    return {
      statTypes,
      columns: typeof config.columns === 'number' ? config.columns : 1,
      showTrend: config.showTrend !== false,
      showComparison: config.showComparison !== false,
    };
  }

  /**
   * Migrate ChartCard configuration
   */
  static migrateChartCardConfig(config: LegacyConfig): {
    chartTypes: ChartType[];
    dataSources: string[];
  } {
    const chartType = safeParseChartType(config.chartType || 'line');

    return {
      chartTypes: [chartType], // safeParseChartType 現在返回 GraphQLChartType
      dataSources: [String(config.dataSource || 'default')],
    };
  }

  /**
   * Migrate ConfigCard configuration
   */
  static migrateConfigCardConfig(config: LegacyConfig): {
    defaultCategory: CategoryType;
    showSearch: boolean;
    showHistory: boolean;
    showTemplates: boolean;
    refreshInterval: number;
    permissions: string[];
  } {
    // Category mapping
    const categorySource = String(
      config.dataSource || config.description || config.component || 'SYSTEM'
    );
    const categoryMap: Record<string, CategoryType> = {
      system: 'SYSTEM',
      user: 'USER_PREFERENCES',
      'user-preferences': 'USER_PREFERENCES',
      department: 'DEPARTMENT',
      notification: 'NOTIFICATION',
      api: 'API',
      security: 'SECURITY',
      display: 'DISPLAY',
      workflow: 'WORKFLOW',
    };

    const defaultCategory = safeParseCategory(
      categoryMap[categorySource.toLowerCase()] || categorySource
    );

    const metrics = Array.isArray(config.metrics)
      ? config.metrics.filter((m): m is string => typeof m === 'string')
      : [];

    return {
      defaultCategory,
      showSearch: !metrics.includes('noSearch'),
      showHistory: !metrics.includes('noHistory'),
      showTemplates: !metrics.includes('noTemplates'),
      refreshInterval: metrics.includes('fastRefresh') ? 10 : 30,
      permissions: metrics.filter(m => m.startsWith('perm:')).map(m => m.substring(5)),
    };
  }

  /**
   * Migrate SearchCard configuration
   */
  static migrateSearchCardConfig(config: LegacyConfig): {
    placeholder: string;
    defaultMode: SearchMode;
    defaultEntities: SearchEntity[];
  } {
    let defaultSearchMode: SearchMode = 'GLOBAL';
    let defaultSearchEntities: SearchEntity[] = ['PRODUCT', 'PALLET'];
    let searchPlaceholder = 'Search products, pallets, orders...';

    // Parse from metrics
    if (Array.isArray(config.metrics) && config.metrics.length > 0) {
      config.metrics
        .filter((m): m is string => typeof m === 'string')
        .forEach((metric: string) => {
          if (metric.startsWith('mode:')) {
            defaultSearchMode = safeParseSearchMode(metric.split(':')[1].toUpperCase());
          } else if (metric.startsWith('entities:')) {
            const entitiesStr = metric.substring('entities:'.length);
            defaultSearchEntities = safeParseSearchEntities(
              entitiesStr.split(',').map(e => e.trim().toUpperCase())
            );
          } else if (metric.startsWith('placeholder:')) {
            searchPlaceholder = metric.substring('placeholder:'.length);
          }
        });
    }

    // Parse from config object
    if (config.config && typeof config.config === 'object') {
      const configObj = config.config as Record<string, unknown>;
      if (configObj.searchMode) {
        defaultSearchMode = safeParseSearchMode(configObj.searchMode);
      }
      if (configObj.searchEntities && Array.isArray(configObj.searchEntities)) {
        defaultSearchEntities = safeParseSearchEntities(configObj.searchEntities);
      }
      if (configObj.placeholder && typeof configObj.placeholder === 'string') {
        searchPlaceholder = configObj.placeholder;
      }
    }

    return {
      placeholder: searchPlaceholder,
      defaultMode: defaultSearchMode,
      defaultEntities: defaultSearchEntities,
    };
  }

  /**
   * Validate and sanitize prefilled data
   */
  static sanitizePrefilledData(data: unknown): PrefilledData {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized: PrefilledData = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip null/undefined values
      if (value == null) continue;

      // Only allow primitive types and arrays of strings
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value instanceof Date ||
        (Array.isArray(value) && value.every(v => typeof v === 'string'))
      ) {
        sanitized[key] = value;
      } else {
        console.warn(`Skipping invalid prefilled data value for key "${key}":`, value);
      }
    }

    return sanitized;
  }

  /**
   * Log migration warnings for debugging
   */
  static logMigrationWarning(
    component: string,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    console.warn(
      `[AdminCardsMigration] ${component}.${field}: Migrated "${oldValue}" to "${newValue}"`
    );
  }
}
