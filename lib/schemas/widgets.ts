/**
 * Widget 相關 Zod Schemas
 */

import { z } from 'zod';
import { TimestampSchema } from './shared';

// Widget 基礎配置
export const WidgetConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  dataSource: z.string().optional(),
  refreshInterval: z.number().int().min(1000).optional(),
  theme: z.string().optional(),
  size: z.object({
    width: z.number().int().min(1),
    height: z.number().int().min(1),
  }).optional(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }).optional(),
});

// Widget 數據
export const WidgetDataSchema = z.object({
  data: z.unknown(),
  lastUpdated: TimestampSchema.optional(),
  error: z.string().optional(),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type WidgetData = z.infer<typeof WidgetDataSchema>;