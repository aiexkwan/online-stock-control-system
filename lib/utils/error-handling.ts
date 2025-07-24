/**
 * Error handling utilities for GraphQL resolvers
 */

// Simple cache implementation with generic type
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Wrap function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Wrap function with cache
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < ttlSeconds * 1000) {
    return cached.data;
  }
  
  const data = await fn();
  cache.set(key, { data: data as unknown, timestamp: now });
  
  // Clean up old cache entries
  if (cache.size > 100) {
    const entries = Array.from(cache.entries());
    const expired = entries.filter(([_, value]) => 
      now - value.timestamp > ttlSeconds * 1000
    );
    expired.forEach(([key]) => cache.delete(key));
  }
  
  return data;
}

/**
 * Clear cache by pattern
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

/**
 * Format error for GraphQL response
 */
interface FormattedError {
  message: string;
  code: string;
  details?: string | Record<string, unknown>;
}

export function formatError(error: unknown): FormattedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
  
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}