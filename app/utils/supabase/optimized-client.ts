/**
 * Optimized Supabase Client with Singleton Pattern
 * Provides enhanced client creation with performance monitoring and connection pooling
 */

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database/supabase';
import { getSupabaseClient } from '@/lib/database/supabase-client-manager';

// Global singleton instance
let singletonClient: SupabaseClient<Database> | null = null;
let clientManager: ReturnType<typeof getSupabaseClient> | null = null;

/**
 * Get optimized Supabase client with singleton pattern
 * This is the recommended way to get Supabase client in the application
 */
export function getOptimizedClient(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    throw new Error('Optimized client should only be used on client side');
  }

  // Use the client manager for enhanced features
  if (!clientManager) {
    clientManager = getSupabaseClient({
      maxRetries: 3,
      retryDelayMs: 1000,
      healthCheckIntervalMs: 30000,
      connectionTimeoutMs: 10000,
      enableAutoReconnect: true,
      enableQueryMetrics: true,
      enableQueryCache: true,
    });
  }

  return clientManager.getClient();
}

/**
 * Legacy createClient function for backward compatibility
 * @deprecated Use getOptimizedClient() instead for better performance
 */
export function createClient(): SupabaseClient<Database> {
  console.warn('[createClient] Deprecated: Use getOptimizedClient() for better performance');
  
  // Return singleton instance for backward compatibility
  if (singletonClient) {
    return singletonClient;
  }

  if (typeof window === 'undefined') {
    throw new Error('Supabase client should only be used on client side');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create singleton instance
  singletonClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
    global: {
      headers: {
        'x-client-info': 'optimized-client/1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
  });

  return singletonClient;
}

/**
 * Get client metrics for monitoring
 */
export function getClientMetrics() {
  if (!clientManager) {
    return null;
  }
  return clientManager.getMetrics();
}

/**
 * Clear client cache
 */
export function clearClientCache() {
  if (clientManager) {
    clientManager.clearCache();
  }
}

/**
 * Clear cache by pattern
 */
export function clearCacheByPattern(pattern: string | RegExp) {
  if (clientManager) {
    clientManager.clearCacheByPattern(pattern);
  }
}

/**
 * Execute query with caching and retry logic
 */
export async function executeOptimizedQuery<T = any>(
  queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T; error: any }>,
  cacheKey?: string,
  options?: {
    skipCache?: boolean;
    ttl?: number;
    retries?: number;
  }
): Promise<{ data: T | null; error: any }> {
  if (!clientManager) {
    clientManager = getSupabaseClient();
  }
  
  return clientManager.executeQuery(queryFn, cacheKey, options);
}

/**
 * Execute batch queries
 */
export async function executeBatchQueries<T = any>(
  queries: Array<{
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: any; error: any }>;
    cacheKey?: string;
    options?: any;
  }>
): Promise<Array<{ data: T | null; error: any }>> {
  if (!clientManager) {
    clientManager = getSupabaseClient();
  }
  
  return clientManager.executeBatch<T>(queries);
}

/**
 * Reset all metrics
 */
export function resetMetrics() {
  if (clientManager) {
    clientManager.resetMetrics();
  }
}

/**
 * Dispose of client resources
 * Should be called when the application unmounts
 */
export function disposeClient() {
  if (clientManager) {
    clientManager.dispose();
    clientManager = null;
  }
  if (singletonClient) {
    singletonClient = null;
  }
}