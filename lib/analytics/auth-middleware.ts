/**
 * Analytics API Authentication Middleware
 * Provides unified authentication and validation for all Analytics APIs
 *
 * Key features:
 * - Session validation to ensure RLS policies work correctly
 * - Input validation using Zod schemas
 * - User-friendly error messages
 * - Minimal performance impact (~5-10ms)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Standard Analytics API response format
 */
export interface AnalyticsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Analytics handler function type
 */
export type AnalyticsHandler<TInput, TOutput> = (
  supabase: SupabaseClient,
  validatedData: TInput
) => Promise<TOutput>;

/**
 * Error response helper
 */
function createErrorResponse(message: string, status: number, errorCode?: string): NextResponse {
  return NextResponse.json<AnalyticsApiResponse<null>>(
    {
      success: false,
      error: message,
      errorCode,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Success response helper
 */
function createSuccessResponse<T>(data: T): NextResponse {
  return NextResponse.json<AnalyticsApiResponse<T>>({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Unified authentication and validation middleware for Analytics APIs
 *
 * @param request - The incoming HTTP request
 * @param schema - Zod schema for input validation
 * @param handler - Business logic handler function
 * @returns NextResponse with standardized format
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   return withAnalyticsAuth(
 *     request,
 *     OutputRatioRequestSchema,
 *     async (supabase, { timeRange }) => {
 *       // Business logic here
 *       const data = await fetchData(supabase, timeRange);
 *       return data;
 *     }
 *   );
 * }
 * ```
 */
export async function withAnalyticsAuth<TInput, TOutput>(
  request: Request,
  schema: z.ZodSchema<TInput>,
  handler: AnalyticsHandler<TInput, TOutput>
): Promise<NextResponse> {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      // User-friendly validation error messages
      const errors = validationResult.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

      return createErrorResponse(`Invalid request parameters: ${errors}`, 400, 'VALIDATION_ERROR');
    }

    // 2. Create Supabase client (automatically handles JWT from cookies/headers)
    const supabase = createClient();

    // 3. Verify session exists (ensures RLS policies will work)
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      // User-friendly authentication error
      return createErrorResponse(
        'Your session has expired. Please refresh the page to continue.',
        401,
        'SESSION_EXPIRED'
      );
    }

    // 4. Execute business logic
    const result = await handler(supabase, validationResult.data);

    // 5. Return success response
    return createSuccessResponse(result);
  } catch (error) {
    // Handle unexpected errors
    console.error('Analytics API error:', error);

    if (error instanceof Error) {
      // Known error types
      if (error.message.includes('fetch')) {
        return createErrorResponse(
          'Unable to fetch data. Please try again later.',
          503,
          'SERVICE_UNAVAILABLE'
        );
      }

      // Database errors
      if (error.message.includes('database') || error.message.includes('PGRST')) {
        return createErrorResponse(
          'Database query error. Please contact support if this persists.',
          500,
          'DATABASE_ERROR'
        );
      }
    }

    // Generic error fallback
    return createErrorResponse(
      'An unexpected error occurred. Please try again.',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * Optional: Middleware without authentication (for public endpoints)
 * Only performs input validation
 */
export async function withAnalyticsValidation<TInput, TOutput>(
  request: Request,
  schema: z.ZodSchema<TInput>,
  handler: (validatedData: TInput) => Promise<TOutput>
): Promise<NextResponse> {
  try {
    // Parse and validate input
    const body = await request.json();
    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

      return createErrorResponse(`Invalid request parameters: ${errors}`, 400, 'VALIDATION_ERROR');
    }

    // Execute business logic
    const result = await handler(validationResult.data);

    // Return success response
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Analytics API error:', error);
    return createErrorResponse(
      'An unexpected error occurred. Please try again.',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * Helper to extract time range from validated data
 * Common pattern in Analytics APIs
 */
export function getDateRangeFromTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '1d':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7); // Default to 7 days
  }

  return { startDate, endDate };
}
