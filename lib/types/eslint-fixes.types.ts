// ESLint fixes type definitions
// This file contains common type definitions to help fix ESLint any type warnings

// Common object types
export type UnknownObject = Record<string, unknown>;
export type UnknownArray = unknown[];

// Error handling types
export interface ErrorWithMessage {
  message: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Type guards
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// GraphQL specific types
export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  supabase: unknown; // Will be refined later with proper Supabase client type
  dataSources?: unknown; // Will be refined later with proper DataSource type
}

export interface ResolverArgs {
  [key: string]: unknown;
}

export interface ResolverParent {
  [key: string]: unknown;
}

// API Response types
export interface APIResponse<T = unknown> {
  data?: T;
  error?: ErrorWithMessage;
  success: boolean;
  message?: string;
}

// React component types
export interface BaseCardProps {
  config?: Record<string, unknown>;
  className?: string;
  title?: string;
  [key: string]: unknown;
}

// Chart component types
export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    name: string;
    dataKey?: string;
    color?: string;
    [key: string]: unknown;
  }>;
  label?: string | number;
}

// Dataloader types
export interface DataLoaderKey {
  id: string;
  [key: string]: unknown;
}

// Utility function to safely parse JSON
export function safeJsonParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

// Type assertion helpers
export function assertDefined<T>(value: T | null | undefined, message = 'Value is null or undefined'): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

// Generic filter function with proper typing
export function typedFilter<T>(arr: T[], predicate: (item: T) => unknown): T[] {
  return arr.filter(predicate);
}

// Generic map function with proper typing
export function typedMap<T, U>(arr: T[], mapper: (item: T) => U): U[] {
  return arr.map(mapper);
}

// Type for functions that might throw
export type AsyncResult<T> = { data: T } | { error: ErrorWithMessage };

// Helper for async error handling
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<AsyncResult<T>> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    if (isErrorWithMessage(error)) {
      return { error };
    }
    return { error: { message: String(error) } };
  }
}