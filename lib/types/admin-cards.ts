/**
 * Admin Cards Type Definitions
 * Provides type safety for AdminCardRenderer component
 * Uses Zod for runtime validation and TypeScript for static typing
 */

import { z } from 'zod';
import { StatsType, ChartType as GraphQLChartType } from '@/types/generated/graphql';

// Basic enumeration types
export const MetricTypeSchema = z.enum(['COUNT', 'SUM', 'AVERAGE', 'MIN', 'MAX']);
export const ChartTypeSchema = z.enum(['line', 'bar', 'pie', 'area', 'scatter']);
export const CategoryTypeSchema = z.enum([
  'SYSTEM',
  'USER',
  'ADMIN',
  'PUBLIC',
  'USER_PREFERENCES',
  'DEPARTMENT',
  'NOTIFICATION',
  'API',
  'SECURITY',
  'DISPLAY',
  'WORKFLOW',
]);
export const SearchModeSchema = z.enum(['GLOBAL', 'LOCAL', 'SPECIFIC', 'ADVANCED']);
export const SearchEntitySchema = z.enum([
  'PRODUCT',
  'PALLET',
  'ORDER',
  'SUPPLIER',
  'LOCATION',
  'USER',
  'CUSTOMER',
]);

// Composite types
export const MetricItemSchema = z.object({
  type: MetricTypeSchema,
  label: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
});

// PrefilledData type for form fields
export const PrefilledDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.date(), z.array(z.string())])
);

// Export TypeScript types
export type MetricType = z.infer<typeof MetricTypeSchema>;
export type ChartType = GraphQLChartType; // 使用 GraphQL 生成的 ChartType
export type CategoryType = z.infer<typeof CategoryTypeSchema>;
export type SearchMode = z.infer<typeof SearchModeSchema>;
export type SearchEntity = z.infer<typeof SearchEntitySchema>;
export type MetricItem = z.infer<typeof MetricItemSchema>;
export type PrefilledData = z.infer<typeof PrefilledDataSchema>;

// Chart type mapping: Zod schema values -> GraphQL ChartType enum
const CHART_TYPE_MAPPING: Record<z.infer<typeof ChartTypeSchema>, GraphQLChartType> = {
  line: GraphQLChartType.Line,
  bar: GraphQLChartType.Bar,
  pie: GraphQLChartType.Pie,
  area: GraphQLChartType.Area,
  scatter: GraphQLChartType.Scatter,
};

// Safe parsing functions with fallback values
export function safeParseChartType(value: unknown): ChartType {
  const result = ChartTypeSchema.safeParse(value);
  if (result.success) {
    return CHART_TYPE_MAPPING[result.data];
  }
  console.warn(`Invalid chart type: ${value}, falling back to GraphQLChartType.Line`);
  return GraphQLChartType.Line;
}

export function safeParseCategory(value: unknown): CategoryType {
  const result = CategoryTypeSchema.safeParse(value);
  if (result.success) return result.data;
  console.warn(`Invalid category: ${value}, falling back to 'SYSTEM'`);
  return 'SYSTEM';
}

export function safeParseSearchMode(value: unknown): SearchMode {
  const result = SearchModeSchema.safeParse(value);
  if (result.success) return result.data;
  console.warn(`Invalid search mode: ${value}, falling back to 'GLOBAL'`);
  return 'GLOBAL';
}

export function safeParseSearchEntities(values: unknown[]): SearchEntity[] {
  const validEntities: SearchEntity[] = [];

  for (const value of values) {
    const result = SearchEntitySchema.safeParse(value);
    if (result.success) {
      validEntities.push(result.data);
    } else {
      console.warn(`Invalid search entity: ${value}, skipping`);
    }
  }

  // Return default if no valid entities
  if (validEntities.length === 0) {
    return ['PRODUCT', 'PALLET'];
  }

  return validEntities;
}

// Migration helper for legacy metric formats
export function migrateMetrics(metrics: unknown[]): MetricItem[] {
  return metrics.map(metric => {
    if (typeof metric === 'string') {
      const result = MetricTypeSchema.safeParse(metric);
      if (result.success) {
        return { type: result.data };
      }
    }

    const itemResult = MetricItemSchema.safeParse(metric);
    if (itemResult.success) {
      return itemResult.data;
    }

    console.warn(`Invalid metric format: ${JSON.stringify(metric)}`);
    return { type: 'COUNT' as MetricType }; // Fallback
  });
}

// Migration helper for StatsCard component - converts metrics to StatsType[]
export function migrateStatsTypes(metrics: unknown[]): StatsType[] {
  const defaultMapping: Record<MetricType, StatsType> = {
    COUNT: StatsType.PalletCount,
    SUM: StatsType.TransferCount,
    AVERAGE: StatsType.EfficiencyRate,
    MIN: StatsType.InventoryLevel,
    MAX: StatsType.WarehouseWorkLevel,
  };

  return metrics.map(metric => {
    // Handle string metric types
    if (typeof metric === 'string') {
      const metricTypeResult = MetricTypeSchema.safeParse(metric);
      if (metricTypeResult.success) {
        return defaultMapping[metricTypeResult.data];
      }

      // Try to parse as direct StatsType value
      const statsTypeValues = Object.values(StatsType) as string[];
      if (statsTypeValues.includes(metric)) {
        return metric as StatsType;
      }
    }

    // Handle MetricItem objects
    const itemResult = MetricItemSchema.safeParse(metric);
    if (itemResult.success) {
      return defaultMapping[itemResult.data.type];
    }

    console.warn(
      `Invalid stats metric format: ${JSON.stringify(metric)}, falling back to ACTIVE_USERS`
    );
    return StatsType.ActiveUsers; // Safe fallback
  });
}

// Convert CategoryType to ConfigCategory for compatibility
export function categoryTypeToConfigCategory(
  categoryType: CategoryType
): import('@/lib/graphql/queries/config').ConfigCategory {
  const { ConfigCategory } = require('@/lib/graphql/queries/config');

  const mapping: Record<CategoryType, (typeof ConfigCategory)[keyof typeof ConfigCategory]> = {
    SYSTEM: ConfigCategory.SYSTEM_CONFIG,
    USER: ConfigCategory.USER_PREFERENCES,
    ADMIN: ConfigCategory.SYSTEM_CONFIG,
    PUBLIC: ConfigCategory.SYSTEM_CONFIG,
    USER_PREFERENCES: ConfigCategory.USER_PREFERENCES,
    DEPARTMENT: ConfigCategory.DEPARTMENT_CONFIG,
    NOTIFICATION: ConfigCategory.NOTIFICATION_CONFIG,
    API: ConfigCategory.API_CONFIG,
    SECURITY: ConfigCategory.SECURITY_CONFIG,
    DISPLAY: ConfigCategory.DISPLAY_CONFIG,
    WORKFLOW: ConfigCategory.WORKFLOW_CONFIG,
  };

  return mapping[categoryType] || ConfigCategory.SYSTEM_CONFIG;
}
