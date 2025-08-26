/**
 * Centralized Error Handler for GraphQL Resolvers
 * Provides consistent error handling and logging across all resolvers
 */

import { GraphQLError } from 'graphql';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Data errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
}

export interface ErrorOptions {
  code?: ErrorCode;
  path?: string[];
  originalError?: Error;
  details?: Record<string, any>;
}

/**
 * Create a standardized GraphQL error
 */
export function createGraphQLError(message: string, options: ErrorOptions = {}): GraphQLError {
  const extensions: Record<string, any> = {
    code: options.code || ErrorCode.INTERNAL_ERROR,
    timestamp: new Date().toISOString(),
  };

  if (options.details) {
    extensions.details = options.details;
  }

  if (process.env.NODE_ENV === 'development' && options.originalError) {
    extensions.originalError = {
      message: options.originalError.message,
      stack: options.originalError.stack,
    };
  }

  return new GraphQLError(message, {
    path: options.path,
    extensions,
  });
}

/**
 * Handle Supabase database errors
 */
export function handleDatabaseError(error: any, context: string): GraphQLError {
  console.error(`[${context}] Database error:`, error);

  // Check for specific Supabase error codes
  if (error.code === 'PGRST116') {
    return createGraphQLError('Resource not found', {
      code: ErrorCode.NOT_FOUND,
      details: { context },
    });
  }

  if (error.code === '23505') {
    return createGraphQLError('Resource already exists', {
      code: ErrorCode.ALREADY_EXISTS,
      details: { context },
    });
  }

  if (error.code === '23503') {
    return createGraphQLError('Foreign key constraint violation', {
      code: ErrorCode.FOREIGN_KEY_VIOLATION,
      details: { context },
    });
  }

  if (error.code === '23514') {
    return createGraphQLError('Check constraint violation', {
      code: ErrorCode.CONSTRAINT_VIOLATION,
      details: { context },
    });
  }

  // Generic database error
  return createGraphQLError('Database operation failed', {
    code: ErrorCode.DATABASE_ERROR,
    originalError: error,
    details: { context },
  });
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, any>>(
  input: T,
  requiredFields: (keyof T)[],
  context: string
): void {
  const missingFields = requiredFields.filter(field => !input[field]);

  if (missingFields.length > 0) {
    throw createGraphQLError(`Missing required fields: ${missingFields.join(', ')}`, {
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        context,
        missingFields,
      },
    });
  }
}

/**
 * Handle authorization checks
 */
export function checkAuthorization(user: any, requiredRole?: string, context?: string): void {
  if (!user) {
    throw createGraphQLError('Authentication required', {
      code: ErrorCode.UNAUTHENTICATED,
      details: { context },
    });
  }

  if (requiredRole && user.role !== requiredRole) {
    throw createGraphQLError('Insufficient permissions', {
      code: ErrorCode.UNAUTHORIZED,
      details: {
        context,
        requiredRole,
        userRole: user.role,
      },
    });
  }
}

/**
 * Safe error logging
 */
export function logError(context: string, error: any, additionalInfo?: Record<string, any>): void {
  const errorInfo: Record<string, any> = {
    context,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };

  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.stack = error.stack;
  } else {
    errorInfo.error = error;
  }

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., Sentry, LogRocket)
    console.error('[ERROR]', JSON.stringify(errorInfo));
  } else {
    console.error('[ERROR]', errorInfo);
  }
}

/**
 * Wrap resolver with error handling
 */
export function wrapResolver<TArgs = any, TResult = any>(
  resolverName: string,
  resolver: (parent: any, args: TArgs, context: any, info: any) => Promise<TResult>
) {
  return async (parent: any, args: TArgs, context: any, info: any): Promise<TResult> => {
    try {
      return await resolver(parent, args, context, info);
    } catch (error) {
      // If it's already a GraphQLError, re-throw it
      if (error instanceof GraphQLError) {
        throw error;
      }

      // Log the error
      logError(resolverName, error, { args });

      // Handle database errors specifically
      if (error && typeof error === 'object' && 'code' in error) {
        throw handleDatabaseError(error, resolverName);
      }

      // Generic error
      throw createGraphQLError('An unexpected error occurred', {
        code: ErrorCode.INTERNAL_ERROR,
        originalError: error as Error,
        details: { resolver: resolverName },
      });
    }
  };
}

/**
 * Batch error handler for DataLoader
 */
export function handleBatchError<T>(
  error: any,
  keys: readonly any[],
  context: string
): (T | Error)[] {
  logError(context, error, { keysCount: keys.length });

  const graphqlError = error instanceof GraphQLError ? error : handleDatabaseError(error, context);

  return keys.map(() => graphqlError);
}
