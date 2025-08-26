/**
 * GraphQL Error Handling and Partial Response Patterns
 * Enhanced error handling for department queries with better debugging info
 */

import { GraphQLError, GraphQLFormattedError } from 'graphql';

// Create compatibility classes for apollo-server-errors
export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'FORBIDDEN' } });
  }
}

export class UserInputError extends GraphQLError {
  constructor(message: string, invalidArgs?: Record<string, unknown>) {
    super(message, { extensions: { code: 'BAD_USER_INPUT', invalidArgs } });
  }
}

// Error types for department queries
export class DepartmentDataError extends GraphQLError {
  constructor(message: string, department: string, originalError?: Error) {
    super(message, {
      extensions: {
        code: 'DEPARTMENT_DATA_ERROR',
        department,
        originalError: originalError?.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export class DatabaseConnectionError extends GraphQLError {
  constructor(table: string, operation: string, originalError?: Error) {
    super(`Database error in ${table} during ${operation}`, {
      extensions: {
        code: 'DATABASE_CONNECTION_ERROR',
        table,
        operation,
        originalError: originalError?.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export class DataLoaderError extends GraphQLError {
  constructor(loaderType: string, keys: readonly unknown[], originalError?: Error) {
    super(`DataLoader error in ${loaderType}`, {
      extensions: {
        code: 'DATALOADER_ERROR',
        loaderType,
        keyCount: keys.length,
        sampleKeys: keys.slice(0, 3),
        originalError: originalError?.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Partial response handler for department data
export interface PartialDepartmentResponse<T> {
  data: T | null;
  errors: GraphQLError[];
  loading: boolean;
  hasPartialData: boolean;
}

/**
 * Create partial response for department queries
 */
export function createPartialResponse<T>(
  data: Partial<T>,
  errors: Error[],
  defaultData: T
): PartialDepartmentResponse<T> {
  const graphqlErrors = errors.map(error =>
    error instanceof GraphQLError ? error : new GraphQLError(error.message)
  );

  // Merge partial data with defaults
  const mergedData = { ...defaultData, ...data };

  return {
    data: mergedData,
    errors: graphqlErrors,
    loading: false,
    hasPartialData: errors.length > 0 && Object.keys(data).length > 0,
  };
}

/**
 * Safe execution wrapper for department operations
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: {
    operation: string;
    department?: string;
    table?: string;
  }
): Promise<{ data: T; error?: Error }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    console.error(`[SafeExecute] Error in ${context.operation}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      department: context.department,
      table: context.table,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return fallback data instead of throwing
    return {
      data: fallback,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * DataLoader error handler
 */
export function handleDataLoaderError<T>(
  error: Error,
  loaderType: string,
  fallbackValue: T
): T | DataLoaderError {
  if (process.env.NODE_ENV === 'production') {
    // In production, log error and return fallback
    console.error(`[DataLoader] ${loaderType} error:`, error.message);
    return fallbackValue;
  } else {
    // In development, throw descriptive error
    throw new DataLoaderError(loaderType, [], error);
  }
}

/**
 * Database query error handler
 */
export function handleDatabaseError(
  error: Error | unknown,
  table: string,
  operation: string
): DatabaseConnectionError {
  const errorObj = error as Record<string, unknown>;
  const errorMessage =
    (error instanceof Error ? error.message : errorObj?.message) || 'Unknown database error';
  const errorCode = errorObj?.code || 'UNKNOWN';

  console.error(`[Database] Error in ${table}.${operation}:`, {
    message: errorMessage,
    code: errorCode,
    details: errorObj?.details,
    hint: errorObj?.hint,
  });

  return new DatabaseConnectionError(table, operation, error instanceof Error ? error : undefined);
}

/**
 * Format GraphQL errors for client
 */
export function formatError(error: GraphQLFormattedError): GraphQLFormattedError {
  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Remove stack traces and internal details
    const { message, locations, path, extensions } = error;

    return {
      message,
      locations,
      path,
      extensions: extensions
        ? {
            code: extensions.code,
            timestamp: extensions.timestamp,
            // Remove sensitive data
            ...(typeof extensions.department === 'string'
              ? { department: extensions.department }
              : {}),
          }
        : undefined,
    };
  }

  // In development, return full error details
  return {
    ...error,
    extensions: {
      ...error.extensions,
    },
  };
}

/**
 * Error recovery strategies for department data
 */
export class DepartmentErrorRecovery {
  static getEmptyDepartmentStats() {
    return {
      todayFinished: 0,
      todayTransferred: 0,
      past7Days: 0,
      past14Days: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  static getEmptyStockItemConnection() {
    return {
      nodes: [],
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    };
  }

  static getEmptyMachineStates() {
    return [];
  }

  static getEmptyRecentActivities() {
    return [];
  }

  static getEmptyOrderCompletions() {
    return [];
  }

  static getEmptyDepartmentData(departmentType: string) {
    const baseData = {
      stats: this.getEmptyDepartmentStats(),
      topStocks: this.getEmptyStockItemConnection(),
      materialStocks: this.getEmptyStockItemConnection(),
      machineStates: this.getEmptyMachineStates(),
      loading: false,
      error: null,
    };

    // Add department-specific empty data
    switch (departmentType) {
      case 'PIPE':
        return {
          ...baseData,
          pipeProductionRate: 0,
          materialConsumptionRate: 0,
        };
      case 'WAREHOUSE':
        return {
          ...baseData,
          recentActivities: this.getEmptyRecentActivities(),
          orderCompletions: this.getEmptyOrderCompletions(),
        };
      case 'INJECTION':
      default:
        return baseData;
    }
  }
}

/**
 * Validation helpers for department queries
 */
export class DepartmentValidation {
  static validatePaginationInput(pagination?: {
    first?: number;
    last?: number;
    after?: string;
    before?: string;
  }) {
    if (!pagination) return;

    const { first, last, after, before } = pagination;

    if (first && first < 0) {
      throw new UserInputError('Pagination "first" argument must be non-negative');
    }

    if (last && last < 0) {
      throw new UserInputError('Pagination "last" argument must be non-negative');
    }

    if (first && first > 100) {
      throw new UserInputError('Pagination "first" argument cannot exceed 100');
    }

    if (last && last > 100) {
      throw new UserInputError('Pagination "last" argument cannot exceed 100');
    }

    if (first && last) {
      throw new UserInputError('Cannot specify both "first" and "last" arguments');
    }

    if (after && before) {
      throw new UserInputError('Cannot specify both "after" and "before" arguments');
    }
  }

  static validateStockFilter(filter?: {
    minLevel?: number;
    maxLevel?: number;
    updatedAfter?: string;
    updatedBefore?: string;
  }) {
    if (!filter) return;

    const { minLevel, maxLevel, updatedAfter, updatedBefore } = filter;

    if (minLevel && minLevel < 0) {
      throw new UserInputError('Stock filter "minLevel" must be non-negative');
    }

    if (maxLevel && maxLevel < 0) {
      throw new UserInputError('Stock filter "maxLevel" must be non-negative');
    }

    if (minLevel && maxLevel && minLevel > maxLevel) {
      throw new UserInputError('Stock filter "minLevel" cannot be greater than "maxLevel"');
    }

    if (updatedAfter && !isValidDateString(updatedAfter)) {
      throw new UserInputError('Stock filter "updatedAfter" must be a valid ISO date string');
    }

    if (updatedBefore && !isValidDateString(updatedBefore)) {
      throw new UserInputError('Stock filter "updatedBefore" must be a valid ISO date string');
    }

    if (updatedAfter && updatedBefore && new Date(updatedAfter) > new Date(updatedBefore)) {
      throw new UserInputError('Stock filter "updatedAfter" cannot be later than "updatedBefore"');
    }
  }

  static validateDepartmentType(departmentType: string) {
    const validTypes = ['INJECTION', 'PIPE', 'WAREHOUSE'];
    if (!validTypes.includes(departmentType)) {
      throw new UserInputError(
        `Invalid department type "${departmentType}". Must be one of: ${validTypes.join(', ')}`
      );
    }
  }
}

function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Apollo Server plugin for error handling
 */
export function createErrorHandlingPlugin() {
  return {
    requestDidStart() {
      return {
        didEncounterErrors(requestContext: {
          errors?: unknown[];
          request: {
            query?: string;
            variables?: Record<string, unknown>;
            operationName?: string;
          };
          context?: { user?: { id?: string } };
        }) {
          // Log errors for monitoring
          if (requestContext.errors) {
            requestContext.errors.forEach(error => {
              const graphQLError = error as GraphQLError;
              console.error('[GraphQL Error]', {
                message: graphQLError.message,
                path: graphQLError.path,
                operation: requestContext.request.operationName,
                variables: requestContext.request.variables,
                userId: requestContext.context?.user?.id,
                timestamp: new Date().toISOString(),
              });
            });
          }
        },
      };
    },
  };
}

/**
 * Wrapper for department resolver functions with error handling
 */
export function withErrorHandling<TArgs = unknown, TContext = unknown, TReturn = unknown>(
  resolverFn: (parent: unknown, args: TArgs, context: TContext, info: unknown) => Promise<TReturn>,
  options: {
    department: string;
    operation: string;
    fallback: TReturn;
  }
) {
  return async (
    parent: unknown,
    args: TArgs,
    context: TContext,
    info: unknown
  ): Promise<TReturn> => {
    try {
      // Validate input arguments
      if (args && typeof args === 'object') {
        interface ArgsWithValidation {
          pagination?: {
            first?: number;
            last?: number;
            after?: string;
            before?: string;
          };
          filter?: {
            minLevel?: number;
            maxLevel?: number;
            updatedAfter?: string;
            updatedBefore?: string;
          };
          departmentType?: string;
        }

        const { pagination, filter, departmentType } = args as ArgsWithValidation;

        DepartmentValidation.validatePaginationInput(pagination);
        DepartmentValidation.validateStockFilter(filter);

        if (departmentType) {
          DepartmentValidation.validateDepartmentType(departmentType);
        }
      }

      return await resolverFn(parent, args, context, info);
    } catch (error) {
      console.error(`[${options.department}] ${options.operation} error:`, error);

      if (
        error instanceof UserInputError ||
        error instanceof AuthenticationError ||
        error instanceof ForbiddenError
      ) {
        // Re-throw client errors
        throw error;
      }

      // Convert other errors to department-specific errors
      throw new DepartmentDataError(
        `Failed to load ${options.operation} for ${options.department} department`,
        options.department,
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  };
}
