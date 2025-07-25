/**
 * Runtime validation schemas for Unified Data Layer
 * Using Zod for type-safe runtime validation
 */

import { z } from 'zod';

// Widget Parameters Schema
export const WidgetParametersSchema = z
  .object({
    warehouse: z.string().optional(),
    dateRange: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      })
      .optional(),
    limit: z.number().int().positive().max(1000).optional(),
    chartType: z.string().optional(),
    timeRange: z.string().optional(),
    widgetId: z.string().optional(),
    widgetCategory: z.string().optional(),
  })
  .catchall(z.unknown()); // Allow additional properties

// GraphQL Variables Schema
export const GraphQLVariablesSchema = z.record(z.unknown());

// Request Body Schema
export const RequestBodySchema = z.union([
  z.record(z.unknown()),
  z.instanceof(FormData),
  z.string(),
  z.null(),
]);

// Data Source Type Schema
export const DataSourceTypeSchema = z.enum(['graphql', 'rest', 'auto']);

// Query Options Schema
export const QueryOptionsSchema = z.object({
  source: DataSourceTypeSchema.optional(),
  query: z.union([z.any(), z.string()]).optional(), // DocumentNode or string
  variables: GraphQLVariablesSchema.optional(),
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  fallbackEnabled: z.boolean().optional(),
  cachePolicy: z.enum(['cache-first', 'cache-and-network', 'network-only', 'no-cache']).optional(),
});

// Mutation Options Schema
export const MutationOptionsSchema = z.object({
  source: DataSourceTypeSchema.optional(),
  mutation: z.union([z.any(), z.string()]).optional(), // DocumentNode or string
  variables: GraphQLVariablesSchema.optional(),
  endpoint: z.string().optional(),
  method: z.enum(['POST', 'PUT', 'DELETE']).optional(),
  body: RequestBodySchema.optional(),
  fallbackEnabled: z.boolean().optional(),
});

// Type inference helpers
export type ValidatedWidgetParameters = z.infer<typeof WidgetParametersSchema>;
export type ValidatedGraphQLVariables = z.infer<typeof GraphQLVariablesSchema>;
export type ValidatedRequestBody = z.infer<typeof RequestBodySchema>;
export type ValidatedQueryOptions = z.infer<typeof QueryOptionsSchema>;
export type ValidatedMutationOptions = z.infer<typeof MutationOptionsSchema>;

// Validation utility functions
export const validateWidgetParameters = (params: unknown): ValidatedWidgetParameters => {
  return WidgetParametersSchema.parse(params);
};

export const validateGraphQLVariables = (variables: unknown): ValidatedGraphQLVariables => {
  return GraphQLVariablesSchema.parse(variables);
};

export const validateRequestBody = (body: unknown): ValidatedRequestBody => {
  return RequestBodySchema.parse(body);
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
