/**
 * GraphQL Query Complexity Analysis and Rate Limiting
 * Prevents expensive queries from overloading the system
 */

import {
  createComplexityLimitRule,
  fieldExtensionsEstimator,
  simpleEstimator,
  getComplexity,
  // @ts-ignore - graphql-query-complexity types may be outdated
} from 'graphql-query-complexity';
import { ValidationRule, DocumentNode } from 'graphql';
// import depthLimit from 'graphql-depth-limit';
// import costAnalysis from 'graphql-cost-analysis';

// Fallback implementations for missing packages
const _depthLimit = (_maxDepth: number) => () => {};
const _costAnalysis = (_options: Record<string, unknown>) => () => {};

// Complexity scoring rules for different field types
export const COMPLEXITY_SCORES = {
  // Basic fields
  SIMPLE_FIELD: 1,
  COMPUTED_FIELD: 2,
  DATABASE_FIELD: 3,

  // Collections
  SIMPLE_LIST: 5,
  FILTERED_LIST: 8,
  PAGINATED_LIST: 10,

  // Complex operations
  AGGREGATION: 15,
  ANALYTICS: 20,
  REAL_TIME_DATA: 25,

  // Department specific
  DEPARTMENT_STATS: 5,
  STOCK_ITEMS: 10,
  MACHINE_STATES: 8,
  RECENT_ACTIVITIES: 6,
  ORDER_COMPLETIONS: 12,
} as const;

// Maximum complexity limits by user type
export const COMPLEXITY_LIMITS = {
  ANONYMOUS: 100,
  USER: 200,
  ADMIN: 500,
  SYSTEM: 1000,
} as const;

// Rate limiting by user type (queries per minute)
export const RATE_LIMITS = {
  ANONYMOUS: 10,
  USER: 60,
  ADMIN: 120,
  SYSTEM: 300,
} as const;

/**
 * Custom complexity estimator for department queries
 */
export function departmentComplexityEstimator(_options: {
  scalarCost?: number;
  objectCost?: number;
  listFactor?: number;
  introspectionCost?: number;
  maxAliases?: number;
  maxDepth?: number;
}) {
  return (args: Record<string, unknown>, childComplexity: number) => {
    const field = args.field as { name: { value: string } };

    // Base complexity scores for department fields
    switch (field?.name?.value) {
      case 'stats':
        return COMPLEXITY_SCORES.DEPARTMENT_STATS;

      case 'topStocks':
      case 'materialStocks':
        // Consider pagination arguments
        const queryArgs = args.args as
          | { first?: { value: number }; filter?: Record<string, unknown> }
          | undefined;
        const first = queryArgs?.first?.value || 10;
        const hasFilters = queryArgs?.filter ? 2 : 1;
        return COMPLEXITY_SCORES.STOCK_ITEMS * hasFilters * Math.min(first / 10, 3);

      case 'machineStates':
        return COMPLEXITY_SCORES.MACHINE_STATES;

      case 'recentActivities':
        return COMPLEXITY_SCORES.RECENT_ACTIVITIES;

      case 'orderCompletions':
        return COMPLEXITY_SCORES.ORDER_COMPLETIONS;

      case 'realTimeStockLevels':
        const queryArgsComplex = args.args as
          | { pagination?: { first?: { value: number } }; filter?: Record<string, unknown> }
          | undefined;
        const limit = queryArgsComplex?.pagination?.first?.value || 20;
        const hasComplexFilters = queryArgsComplex?.filter ? 2 : 1;
        return COMPLEXITY_SCORES.REAL_TIME_DATA * hasComplexFilters * Math.min(limit / 10, 5);

      case 'departmentPipeData':
      case 'departmentInjectionData':
      case 'departmentWarehouseData':
        return COMPLEXITY_SCORES.AGGREGATION + childComplexity;

      case 'departmentPipeDataAdvanced':
        return COMPLEXITY_SCORES.ANALYTICS + childComplexity * 1.5;

      default:
        return childComplexity + COMPLEXITY_SCORES.SIMPLE_FIELD;
    }
  };
}

/**
 * Create complexity analysis rule
 */
export function createComplexityRule(maxComplexity: number): ValidationRule {
  return createComplexityLimitRule(maxComplexity, {
    estimators: [
      fieldExtensionsEstimator(),
      departmentComplexityEstimator({}),
      simpleEstimator({ defaultComplexity: COMPLEXITY_SCORES.SIMPLE_FIELD }),
    ],
    createError: (max: number, actual: number) => {
      return new Error(
        `Query complexity ${actual} exceeds maximum allowed complexity ${max}. ` +
          'Please simplify your query by reducing the number of fields, ' +
          'using pagination, or splitting into multiple queries.'
      );
    },
  });
}

/**
 * Create depth limit rule
 */
export function createDepthRule(_maxDepth: number = 10): ValidationRule {
  // Fallback implementation - returns a no-op validation rule
  return (_context => {
    return {
      enter() {
        // No-op validation
      },
    };
  }) as ValidationRule;
}

/**
 * Rate limiting storage (in production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface GraphQLContext {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Rate limiting middleware
 */
export function createRateLimitRule(
  getUserId: (context: GraphQLContext) => string,
  getUserType: (context: GraphQLContext) => keyof typeof RATE_LIMITS
) {
  return {
    requestDidStart() {
      return {
        didResolveOperation(requestContext: { context: GraphQLContext }) {
          const _userId = getUserId(requestContext.context);
          const userType = getUserType(requestContext.context);
          const limit = RATE_LIMITS[userType];

          const now = Date.now();
          const windowMs = 60 * 1000; // 1 minute window

          const userKey = `rate_limit:${_userId}`;
          const current = rateLimitStore.get(userKey);

          if (!current || now > current.resetTime) {
            // New window
            rateLimitStore.set(userKey, {
              count: 1,
              resetTime: now + windowMs,
            });
          } else {
            // Within window
            if (current.count >= limit) {
              throw new Error(
                `Rate limit exceeded. Maximum ${limit} queries per minute allowed for ${userType} users. ` +
                  `Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
              );
            }

            current.count++;
            rateLimitStore.set(userKey, current);
          }
        },
      };
    },
  };
}

/**
 * Cost analysis configuration
 */
export const costAnalysisConfig = {
  createError: (max: number, actual: number) => {
    return new Error(
      `Query cost ${actual} exceeds maximum allowed cost ${max}. ` +
        'This query would consume too many resources. Please optimize your query.'
    );
  },
  introspection: false, // Disable introspection cost analysis
  scalarCost: 1,
  objectCost: 2,
  listFactor: 10,
  introspectionCost: 1000, // Make introspection expensive
  defaultCost: COMPLEXITY_SCORES.SIMPLE_FIELD,
};

/**
 * Get query complexity score
 */
export function getQueryComplexity(
  document: DocumentNode,
  variables?: Record<string, unknown>,
  schema?: unknown
): number {
  try {
    return getComplexity({
      estimators: [
        fieldExtensionsEstimator(),
        departmentComplexityEstimator({}),
        simpleEstimator({ defaultComplexity: COMPLEXITY_SCORES.SIMPLE_FIELD }),
      ],
      query: document,
      variables: variables || {},
      schema,
    });
  } catch (error) {
    console.error('[QueryComplexity] Error calculating complexity:', error);
    return 0;
  }
}

/**
 * Query performance monitoring
 */
export interface QueryMetrics {
  complexity: number;
  depth: number;
  executionTime: number;
  fieldsCount: number;
  userId?: string;
  userType?: string;
  query: string;
  variables?: Record<string, unknown>;
  errors?: unknown[];
}

interface RequestContext {
  document: DocumentNode;
  request: {
    variables?: Record<string, unknown>;
    query?: string;
    operationName?: string;
  };
  context?: GraphQLContext;
  errors?: unknown[];
}

const queryMetricsStore: QueryMetrics[] = [];

/**
 * Query monitoring plugin
 */
export function createQueryMonitoringPlugin() {
  return {
    requestDidStart() {
      let startTime: number;
      let queryMetrics: Partial<QueryMetrics> = {};

      return {
        didResolveOperation(requestContext: RequestContext) {
          startTime = Date.now();

          try {
            queryMetrics = {
              complexity: getQueryComplexity(
                requestContext.document,
                requestContext.request.variables
              ),
              query: requestContext.request.query || '',
              variables: requestContext.request.variables,
              userId: requestContext.context?.user?.id,
              userType: requestContext.context?.user?.role || 'USER',
            };
          } catch (error) {
            console.error('[QueryMonitoring] Error in operation resolution:', error);
          }
        },

        willSendResponse(requestContext: RequestContext) {
          try {
            const _endTime = Date.now();
            const executionTime = _endTime - startTime;

            const finalMetrics: QueryMetrics = {
              ...queryMetrics,
              executionTime,
              depth: 0, // Could be calculated if needed
              fieldsCount: 0, // Could be calculated if needed
              errors: requestContext.errors,
            } as QueryMetrics;

            // Store metrics (in production, send to monitoring service)
            queryMetricsStore.push(finalMetrics);

            // Log expensive queries
            if (
              executionTime > 5000 ||
              (finalMetrics.complexity && finalMetrics.complexity > 100)
            ) {
              console.warn('[QueryMonitoring] Expensive query detected:', {
                complexity: finalMetrics.complexity,
                executionTime: finalMetrics.executionTime,
                userId: finalMetrics.userId,
                query: finalMetrics.query?.substring(0, 200) + '...',
              });
            }

            // Keep only recent metrics (last 1000)
            if (queryMetricsStore.length > 1000) {
              queryMetricsStore.splice(0, 500);
            }
          } catch (error) {
            console.error('[QueryMonitoring] Error in response phase:', error);
          }
        },
      };
    },
  };
}

/**
 * Get query performance statistics
 */
export function getQueryMetrics() {
  return {
    totalQueries: queryMetricsStore.length,
    averageComplexity:
      queryMetricsStore.reduce((sum, m) => sum + (m.complexity || 0), 0) / queryMetricsStore.length,
    averageExecutionTime:
      queryMetricsStore.reduce((sum, m) => sum + m.executionTime, 0) / queryMetricsStore.length,
    expensiveQueries: queryMetricsStore.filter(
      m => (m.complexity || 0) > 50 || m.executionTime > 2000
    ).length,
    errorRate:
      queryMetricsStore.filter(m => m.errors && m.errors.length > 0).length /
      queryMetricsStore.length,
  };
}

/**
 * Clear query metrics (for testing)
 */
export function clearQueryMetrics() {
  queryMetricsStore.length = 0;
  rateLimitStore.clear();
}
