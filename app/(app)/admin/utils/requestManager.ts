/**
 * Request Manager for handling API calls with AbortController support
 * Provides centralized request management, cancellation, and error handling
 */

export interface RequestOptions {
  useCache?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class RequestManager {
  private activeRequests = new Map<string, AbortController>();
  private requestCache = new Map<string, CachedResponse<unknown>>();
  private readonly DEFAULT_CACHE_TTL = 60000; // 1 minute
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute a request with automatic abort controller management
   */
  async executeRequest<T>(
    key: string,
    requestFn: (signal: AbortSignal) => Promise<T>,
    options?: RequestOptions
  ): Promise<T> {
    // Cancel any existing request with the same key
    this.cancelRequest(key);

    // Check cache if enabled
    if (options?.useCache) {
      const cached = this.getCachedResponse<T>(key);
      if (cached) {
        return cached;
      }
    }

    // Create new abort controller
    const controller = new AbortController();
    this.activeRequests.set(key, controller);

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (options?.timeout) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, options.timeout);
    }

    try {
      // Execute the request with retry logic
      const result = await this.executeWithRetry(
        () => requestFn(controller.signal),
        options?.retryCount || 0,
        options?.retryDelay || 1000
      );

      // Cache successful response if caching is enabled
      if (options?.useCache) {
        this.setCachedResponse(key, result);
      }

      return result;
    } catch (error) {
      // Convert abort errors to a more user-friendly format
      if (this.isAbortError(error)) {
        throw new Error('Request was cancelled');
      }
      throw error;
    } finally {
      // Clean up
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.activeRequests.delete(key);
    }
  }

  /**
   * Execute a request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retryCount: number,
    retryDelay: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort errors
        if (this.isAbortError(error)) {
          throw error;
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < retryCount) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(key: string): void {
    const controller = this.activeRequests.get(key);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(key);
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    // Remove expired cache entry
    if (cached) {
      this.requestCache.delete(key);
    }
    return null;
  }

  /**
   * Set cached response
   */
  private setCachedResponse<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.DEFAULT_CACHE_TTL);
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Clear expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.requestCache.entries()) {
      if (cached.expiresAt <= now) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Check if an error is an abort error
   */
  private isAbortError(error: unknown): boolean {
    return (
      error instanceof Error &&
      ((error as any).name === 'AbortError' || error.message === 'Request aborted')
    );
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics about active requests and cache
   */
  getStats(): {
    activeRequests: number;
    cachedResponses: number;
    cacheSize: number;
  } {
    return {
      activeRequests: this.activeRequests.size,
      cachedResponses: this.requestCache.size,
      cacheSize: Array.from(this.requestCache.values()).reduce(
        (total, cached) => total + JSON.stringify(cached.data).length,
        0
      ),
    };
  }
}

// Singleton instance for the application
export const requestManager = new RequestManager();

// Hook for using RequestManager in React components
export function useRequestManager() {
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      requestManager.cancelAllRequests();
    };
  }, []);

  return requestManager;
}

// Import for the hook
import { useEffect } from 'react';
