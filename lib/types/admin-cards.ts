/**
 * Admin Cards Type Definitions
 * Provides type safety for AdminCardRenderer component
 * Uses Zod for runtime validation and TypeScript for static typing
 */

import { z } from 'zod';

// Basic enumeration types
export const MetricTypeSchema = z.enum(['COUNT', 'SUM', 'AVERAGE', 'MIN', 'MAX']);
export const ChartTypeSchema = z.enum(['line', 'bar', 'pie', 'area', 'scatter']);
export const CategoryTypeSchema = z.enum(['SYSTEM', 'USER', 'ADMIN', 'PUBLIC', 'USER_PREFERENCES', 'DEPARTMENT', 'NOTIFICATION', 'API', 'SECURITY', 'DISPLAY', 'WORKFLOW']);
export const SearchModeSchema = z.enum(['GLOBAL', 'LOCAL', 'SPECIFIC', 'ADVANCED']);
export const SearchEntitySchema = z.enum(['PRODUCT', 'PALLET', 'ORDER', 'SUPPLIER', 'LOCATION', 'USER', 'CUSTOMER']);

// Composite types
export const MetricItemSchema = z.object({
  type: MetricTypeSchema,
  label: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional()
});

// PrefilledData type for form fields
export const PrefilledDataSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
    z.array(z.string())
  ])
);

// Export TypeScript types
export type MetricType = z.infer<typeof MetricTypeSchema>;
export type ChartType = z.infer<typeof ChartTypeSchema>;
export type CategoryType = z.infer<typeof CategoryTypeSchema>;
export type SearchMode = z.infer<typeof SearchModeSchema>;
export type SearchEntity = z.infer<typeof SearchEntitySchema>;
export type MetricItem = z.infer<typeof MetricItemSchema>;
export type PrefilledData = z.infer<typeof PrefilledDataSchema>;

// Safe parsing functions with fallback values
export function safeParseChartType(value: unknown): ChartType {
  const result = ChartTypeSchema.safeParse(value);
  if (result.success) return result.data;
  console.warn(`Invalid chart type: ${value}, falling back to 'line'`);
  return 'line';
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