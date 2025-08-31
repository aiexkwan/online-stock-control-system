/**
 * Runtime validation schemas for Unified Data Layer
 * Using Zod for type-safe runtime validation
 * Provides comprehensive schema validation for all data layer operations
 */

import { z } from 'zod';
import { DocumentNode } from '@apollo/client';

// Card Parameters Schema
export const WidgetParametersSchema = z
  .object({
    warehouse: z.string().min(1, 'Warehouse cannot be empty').optional(),
    dateRange: z
      .object({
        start: z.string().datetime('Invalid start date format'),
        end: z.string().datetime('Invalid end date format'),
      })
      .refine(data => new Date(data.start) < new Date(data.end), {
        message: 'Start date must be before end date',
        path: ['end'],
      })
      .optional(),
    limit: z
      .number()
      .int()
      .positive('Limit must be positive')
      .max(1000, 'Limit cannot exceed 1000')
      .optional(),
    chartType: z.string().min(1, 'Chart type cannot be empty').optional(),
    timeRange: z.enum(['1h', '24h', '7d', '30d', '90d', 'custom']).optional(),
    widgetId: z.string().min(1, 'Widget ID cannot be empty').optional(),
    widgetCategory: z.enum(['stats', 'chart', 'table', 'analysis', 'unknown']).optional(),
  })
  .catchall(z.unknown()) // Allow additional properties for extensibility
  .refine(
    data => {
      // If timeRange is custom, dateRange must be provided
      if (data.timeRange === 'custom') {
        return data.dateRange !== undefined;
      }
      return true;
    },
    {
      message: 'DateRange is required when timeRange is "custom"',
      path: ['dateRange'],
    }
  );

// GraphQL Variables Schema
export const GraphQLVariablesSchema = z.record(z.unknown());

// Request Body Schema with enhanced validation
export const RequestBodySchema = z
  .union([
    z.record(z.string(), z.unknown()), // JSON object with string keys
    z.instanceof(FormData, {
      message: 'Expected FormData instance for file uploads',
    }),
    z.string().min(1, 'Request body string cannot be empty'),
    z.null(),
  ])
  .describe('Request body for HTTP operations');

// Data Source Type Schema with comprehensive options
export const DataSourceTypeSchema = z.enum(['graphql', 'rest', 'server_action', 'auto'], {
  errorMap: (issue, _ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return {
        message: `Invalid data source type. Must be one of: graphql, rest, server_action, auto`,
      };
    }
    return { message: issue.message || 'Invalid data source type' };
  },
});

// Document Node Schema - Custom validation for GraphQL DocumentNode
export const DocumentNodeSchema = z.custom<DocumentNode>(
  (val): val is DocumentNode => {
    return val !== null && typeof val === 'object' && 'kind' in val && val.kind === 'Document';
  },
  {
    message: 'Expected a valid GraphQL DocumentNode',
  }
);

// Query Options Schema
export const QueryOptionsSchema = z.object({
  source: DataSourceTypeSchema.optional(),
  query: z.union([DocumentNodeSchema, z.string()]).optional(),
  variables: GraphQLVariablesSchema.optional(),
  endpoint: z
    .string()
    .url()
    .optional()
    .or(z.string().regex(/^\/api\//, 'Endpoint must start with /api/ or be a valid URL')),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  fallbackEnabled: z.boolean().optional(),
  cachePolicy: z.enum(['cache-first', 'cache-and-network', 'network-only', 'no-cache']).optional(),
  serverAction: z.function().optional(),
});

// Mutation Options Schema
export const MutationOptionsSchema = z.object({
  source: DataSourceTypeSchema.optional(),
  mutation: z.union([DocumentNodeSchema, z.string()]).optional(),
  variables: GraphQLVariablesSchema.optional(),
  endpoint: z
    .string()
    .url()
    .optional()
    .or(z.string().regex(/^\/api\//, 'Endpoint must start with /api/ or be a valid URL')),
  method: z.enum(['POST', 'PUT', 'DELETE']).optional(),
  body: RequestBodySchema.optional(),
  fallbackEnabled: z.boolean().optional(),
  serverAction: z.function().optional(),
});

// Data Layer Response Schema
export const DataLayerResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.instanceof(Error).optional(),
  source: DataSourceTypeSchema,
  cached: z.boolean().optional(),
  executionTime: z.number().positive().optional(),
});

// Widget Data Mapping Schema
export const WidgetDataMappingSchema = z.record(
  z.string(),
  z.object({
    graphql: z
      .object({
        query: DocumentNodeSchema,
        transform: z.function().optional(),
      })
      .optional(),
    rest: z
      .object({
        endpoint: z.string().regex(/^\/api\//),
        method: z.enum(['GET', 'POST']).optional(),
        transform: z.function().optional(),
      })
      .optional(),
    serverAction: z
      .object({
        action: z.function(),
        transform: z.function().optional(),
      })
      .optional(),
    preferredSource: DataSourceTypeSchema.optional(),
  })
);

// Type inference helpers
export type ValidatedWidgetParameters = z.infer<typeof WidgetParametersSchema>;
export type ValidatedGraphQLVariables = z.infer<typeof GraphQLVariablesSchema>;
export type ValidatedRequestBody = z.infer<typeof RequestBodySchema>;
export type ValidatedQueryOptions = z.infer<typeof QueryOptionsSchema>;
export type ValidatedMutationOptions = z.infer<typeof MutationOptionsSchema>;
export type ValidatedDataLayerResponse<T = unknown> = Omit<
  z.infer<typeof DataLayerResponseSchema>,
  'data'
> & { data: T | null };
export type ValidatedWidgetDataMapping = z.infer<typeof WidgetDataMappingSchema>;

// Validation utility functions with enhanced error handling
export const validateWidgetParameters = (params: unknown): ValidatedWidgetParameters => {
  try {
    return WidgetParametersSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Widget parameters validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
};

export const validateGraphQLVariables = (variables: unknown): ValidatedGraphQLVariables => {
  try {
    return GraphQLVariablesSchema.parse(variables);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `GraphQL variables validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
};

export const validateRequestBody = (body: unknown): ValidatedRequestBody => {
  try {
    return RequestBodySchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Request body validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
};

export const validateQueryOptions = (options: unknown): ValidatedQueryOptions => {
  try {
    return QueryOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Query options validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
};

export const validateMutationOptions = (options: unknown): ValidatedMutationOptions => {
  try {
    return MutationOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Mutation options validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
};

// Safe validation functions that return results instead of throwing
export const safeValidateWidgetParameters = (params: unknown) => {
  return WidgetParametersSchema.safeParse(params);
};

export const safeValidateGraphQLVariables = (variables: unknown) => {
  return GraphQLVariablesSchema.safeParse(variables);
};

export const safeValidateRequestBody = (body: unknown) => {
  return RequestBodySchema.safeParse(body);
};

export const safeValidateQueryOptions = (options: unknown) => {
  return QueryOptionsSchema.safeParse(options);
};

export const safeValidateMutationOptions = (options: unknown) => {
  return MutationOptionsSchema.safeParse(options);
};

export const safeValidateDataLayerResponse = <T = unknown>(response: unknown) => {
  return DataLayerResponseSchema.safeParse(response) as z.SafeParseReturnType<
    unknown,
    ValidatedDataLayerResponse<T>
  >;
};

// Comprehensive validation function for data layer operations
export const validateDataLayerOperation = (operation: 'query' | 'mutation', options: unknown) => {
  if (operation === 'query') {
    return validateQueryOptions(options);
  } else {
    return validateMutationOptions(options);
  }
};

// Schema refinement utilities
export const refineWidgetParameters = (
  params: ValidatedWidgetParameters
): ValidatedWidgetParameters => {
  // Ensure dateRange is valid if provided
  if (params.dateRange) {
    const start = new Date(params.dateRange.start);
    const end = new Date(params.dateRange.end);

    if (start >= end) {
      throw new Error('DateRange start must be before end');
    }

    // Ensure date range is not too large (prevent performance issues)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      throw new Error('DateRange cannot exceed 365 days');
    }
  }

  return params;
};

// Export all schemas for external use
export const schemas = {
  WidgetParameters: WidgetParametersSchema,
  GraphQLVariables: GraphQLVariablesSchema,
  RequestBody: RequestBodySchema,
  DataSourceType: DataSourceTypeSchema,
  QueryOptions: QueryOptionsSchema,
  MutationOptions: MutationOptionsSchema,
  DataLayerResponse: DataLayerResponseSchema,
  WidgetDataMapping: WidgetDataMappingSchema,
  DocumentNode: DocumentNodeSchema,
} as const;
