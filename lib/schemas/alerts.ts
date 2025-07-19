/**
 * Alerts 相關 Zod Schemas
 */

import { z } from 'zod';
import { TimestampSchema, UuidSchema } from './shared';

// 告警類型
export const AlertTypeSchema = z.enum([
  'info',
  'warning',
  'error',
  'success'
]);

// 告警優先級
export const AlertPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

// 告警狀態
export const AlertStatusSchema = z.enum([
  'active',
  'acknowledged',
  'resolved',
  'dismissed'
]);

// 告警規則
export const AlertRuleSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  description: z.string().optional(),
  condition: z.string(), // SQL or condition expression
  type: AlertTypeSchema,
  priority: AlertPrioritySchema,
  enabled: z.boolean().default(true),
  created_at: TimestampSchema,
  updated_at: TimestampSchema.optional(),
});

// 告警實例
export const AlertSchema = z.object({
  id: UuidSchema,
  rule_id: UuidSchema,
  message: z.string(),
  type: AlertTypeSchema,
  priority: AlertPrioritySchema,
  status: AlertStatusSchema,
  data: z.unknown().optional(),
  triggered_at: TimestampSchema,
  acknowledged_at: TimestampSchema.optional(),
  resolved_at: TimestampSchema.optional(),
});

export type AlertType = z.infer<typeof AlertTypeSchema>;
export type AlertPriority = z.infer<typeof AlertPrioritySchema>;
export type AlertStatus = z.infer<typeof AlertStatusSchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type Alert = z.infer<typeof AlertSchema>;