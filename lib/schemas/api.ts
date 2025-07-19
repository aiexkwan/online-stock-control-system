/**
 * API 相關 Zod Schemas
 */

import { z } from 'zod';
import { ApiResponseSchema, ErrorResponseSchema } from './shared';

// API 通用響應類型
export const BaseApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiResponseSchema(dataSchema);

export { ApiResponseSchema, ErrorResponseSchema };