/**
 * GraphQL Rate Limiting Implementation
 *
 * Features:
 * - Mutation rate limiting by user
 * - Subscription connection limits
 * - IP-based rate limiting
 * - Custom rules for different operations
 */

import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

export interface RateLimitConfig {
  // Mutation limits (per user per time window)
  mutationLimits: {
    [operationName: string]: {
      maxRequests: number;
      windowMs: number;
    };
  };

  // Subscription limits (concurrent connections)
  subscriptionLimits: {
    maxConnectionsPerUser: number;
    maxConnectionsPerIP: number;
    maxTotalConnections: number;
  };

  // IP-based limits (per IP per time window)
  ipLimits: {
    maxRequests: number;
    windowMs: number;
  };

  // Global limits
  globalLimits: {
    maxConcurrentQueries: number;
    maxQueryComplexity: number;
  };
}

// Default rate limiting configuration
export const defaultRateLimitConfig: RateLimitConfig = {
  mutationLimits: {
    // Product management - moderate limits
    createProduct: { maxRequests: 20, windowMs: 60000 }, // 20/min
    updateProduct: { maxRequests: 30, windowMs: 60000 }, // 30/min
    deleteProduct: { maxRequests: 10, windowMs: 60000 }, // 10/min

    // Pallet operations - higher frequency
    createPallet: { maxRequests: 50, windowMs: 60000 }, // 50/min
    updatePallet: { maxRequests: 100, windowMs: 60000 }, // 100/min
    movePallet: { maxRequests: 200, windowMs: 60000 }, // 200/min

    // Stock operations - business critical
    adjustStock: { maxRequests: 100, windowMs: 60000 }, // 100/min
    transferStock: { maxRequests: 150, windowMs: 60000 }, // 150/min

    // Order operations - moderate limits
    createOrder: { maxRequests: 30, windowMs: 60000 }, // 30/min
    updateOrder: { maxRequests: 50, windowMs: 60000 }, // 50/min
    loadPalletToOrder: { maxRequests: 100, windowMs: 60000 }, // 100/min

    // Stocktake operations - periodic usage
    startStocktakeSession: { maxRequests: 10, windowMs: 60000 }, // 10/min
    recordStocktakeCount: { maxRequests: 500, windowMs: 60000 }, // 500/min (scanning)

    // Bulk operations - lower limits
    bulkUpdateInventory: { maxRequests: 5, windowMs: 60000 }, // 5/min
    bulkCreatePallets: { maxRequests: 5, windowMs: 60000 }, // 5/min
  },

  subscriptionLimits: {
    maxConnectionsPerUser: 10, // Max 10 subscriptions per user
    maxConnectionsPerIP: 50, // Max 50 connections per IP
    maxTotalConnections: 1000, // Max 1000 total active subscriptions
  },

  ipLimits: {
    maxRequests: 1000, // 1000 requests per IP per minute
    windowMs: 60000,
  },

  globalLimits: {
    maxConcurrentQueries: 100, // Max 100 concurrent queries
    maxQueryComplexity: 1000, // Max complexity per query
  },
};

// In-memory store for rate limiting (use Redis in production)
class RateLimitStore {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private subscriptionCounts = new Map<string, number>();
  private ipCounts = new Map<string, { count: number; resetTime: number }>();
  private activeQueries = 0;

  // Mutation rate limiting
  checkMutationLimit(
    userId: string,
    operationName: string,
    config: RateLimitConfig
  ): { allowed: boolean; retryAfter?: number } {
    const key = `${userId}:${operationName}`;
    const limit = config.mutationLimits[operationName];

    if (!limit) {
      return { allowed: true }; // No limit configured
    }

    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new window
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + limit.windowMs,
      });
      return { allowed: true };
    }

    if (record.count >= limit.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    record.count++;
    return { allowed: true };
  }

  // Subscription connection limiting
  checkSubscriptionLimit(
    userId: string,
    ipAddress: string,
    config: RateLimitConfig
  ): { allowed: boolean; reason?: string } {
    const userConnections = this.subscriptionCounts.get(`user:${userId}`) || 0;
    const ipConnections = this.subscriptionCounts.get(`ip:${ipAddress}`) || 0;
    const totalConnections = Array.from(this.subscriptionCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    if (userConnections >= config.subscriptionLimits.maxConnectionsPerUser) {
      return { allowed: false, reason: 'Too many connections for this user' };
    }

    if (ipConnections >= config.subscriptionLimits.maxConnectionsPerIP) {
      return { allowed: false, reason: 'Too many connections from this IP' };
    }

    if (totalConnections >= config.subscriptionLimits.maxTotalConnections) {
      return { allowed: false, reason: 'Server subscription limit reached' };
    }

    return { allowed: true };
  }

  // Add subscription connection
  addSubscriptionConnection(userId: string, ipAddress: string) {
    const userKey = `user:${userId}`;
    const ipKey = `ip:${ipAddress}`;

    this.subscriptionCounts.set(userKey, (this.subscriptionCounts.get(userKey) || 0) + 1);
    this.subscriptionCounts.set(ipKey, (this.subscriptionCounts.get(ipKey) || 0) + 1);
  }

  // Remove subscription connection
  removeSubscriptionConnection(userId: string, ipAddress: string) {
    const userKey = `user:${userId}`;
    const ipKey = `ip:${ipAddress}`;

    const userCount = this.subscriptionCounts.get(userKey) || 0;
    const ipCount = this.subscriptionCounts.get(ipKey) || 0;

    if (userCount > 1) {
      this.subscriptionCounts.set(userKey, userCount - 1);
    } else {
      this.subscriptionCounts.delete(userKey);
    }

    if (ipCount > 1) {
      this.subscriptionCounts.set(ipKey, ipCount - 1);
    } else {
      this.subscriptionCounts.delete(ipKey);
    }
  }

  // IP-based rate limiting
  checkIPLimit(
    ipAddress: string,
    config: RateLimitConfig
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.ipCounts.get(ipAddress);

    if (!record || now > record.resetTime) {
      this.ipCounts.set(ipAddress, {
        count: 1,
        resetTime: now + config.ipLimits.windowMs,
      });
      return { allowed: true };
    }

    if (record.count >= config.ipLimits.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    record.count++;
    return { allowed: true };
  }

  // Query concurrency limiting
  checkQueryConcurrency(config: RateLimitConfig): boolean {
    return this.activeQueries < config.globalLimits.maxConcurrentQueries;
  }

  incrementActiveQueries() {
    this.activeQueries++;
  }

  decrementActiveQueries() {
    this.activeQueries = Math.max(0, this.activeQueries - 1);
  }

  // Cleanup expired entries (should be called periodically)
  cleanup() {
    const now = Date.now();

    // Clean up request counts
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }

    // Clean up IP counts
    for (const [key, record] of this.ipCounts.entries()) {
      if (now > record.resetTime) {
        this.ipCounts.delete(key);
      }
    }
  }

  // Get current stats for monitoring
  getStats() {
    return {
      activeQueries: this.activeQueries,
      totalRequestKeys: this.requestCounts.size,
      totalSubscriptions: Array.from(this.subscriptionCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
      totalIPKeys: this.ipCounts.size,
    };
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every minute
setInterval(() => {
  rateLimitStore.cleanup();
}, 60000);

export { rateLimitStore };

// Rate limiting middleware for Apollo Server
export function createRateLimitingPlugin(config: RateLimitConfig = defaultRateLimitConfig) {
  return {
    requestDidStart() {
      return {
        didResolveOperation(requestContext: any) {
          const { request, context } = requestContext;
          const operation = request.operationName;
          const userId = context.user?.id;
          const ipAddress = context.req?.ip || 'unknown';

          // Check IP-based rate limiting
          const ipCheck = rateLimitStore.checkIPLimit(ipAddress, config);
          if (!ipCheck.allowed) {
            throw new ForbiddenError(
              `Rate limit exceeded for IP. Retry after ${ipCheck.retryAfter} seconds.`
            );
          }

          // Check query concurrency
          if (!rateLimitStore.checkQueryConcurrency(config)) {
            throw new ForbiddenError('Server is too busy. Please try again later.');
          }

          rateLimitStore.incrementActiveQueries();
        },

        willSendResponse(requestContext: any) {
          rateLimitStore.decrementActiveQueries();
        },
      };
    },
  };
}

// Mutation rate limiting middleware
export function checkMutationRateLimit(
  operationName: string,
  userId: string,
  config: RateLimitConfig = defaultRateLimitConfig
) {
  if (!userId) {
    throw new AuthenticationError('Authentication required for mutations');
  }

  const result = rateLimitStore.checkMutationLimit(userId, operationName, config);

  if (!result.allowed) {
    throw new ForbiddenError(
      `Rate limit exceeded for ${operationName}. Retry after ${result.retryAfter} seconds.`
    );
  }
}

// Subscription rate limiting middleware
export function checkSubscriptionRateLimit(
  userId: string,
  ipAddress: string,
  config: RateLimitConfig = defaultRateLimitConfig
): string {
  if (!userId) {
    throw new AuthenticationError('Authentication required for subscriptions');
  }

  const result = rateLimitStore.checkSubscriptionLimit(userId, ipAddress, config);

  if (!result.allowed) {
    throw new ForbiddenError(`Subscription limit exceeded: ${result.reason}`);
  }

  // Generate unique connection ID
  const connectionId = `${userId}:${ipAddress}:${Date.now()}:${Math.random()}`;
  rateLimitStore.addSubscriptionConnection(userId, ipAddress);

  return connectionId;
}

// Remove subscription connection
export function removeSubscriptionConnection(userId: string, ipAddress: string) {
  rateLimitStore.removeSubscriptionConnection(userId, ipAddress);
}

// Rate limiting stats for monitoring
export function getRateLimitingStats() {
  return {
    ...rateLimitStore.getStats(),
    config: defaultRateLimitConfig,
    timestamp: new Date().toISOString(),
  };
}

// Rate limiting decorator for resolvers
export function rateLimit(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const mutationName = operationName || propertyKey;

    descriptor.value = async function (...args: any[]) {
      const context = args[2]; // GraphQL context is the third argument
      const userId = context.user?.id;

      checkMutationRateLimit(mutationName, userId);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
