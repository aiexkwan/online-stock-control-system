/**
 * Apollo Client Configuration
 * GraphQL client setup for Supabase pg_graphql
 *
 * This module provides a unified Apollo Client configuration that integrates with
 * Supabase authentication and follows TypeScript strict mode requirements.
 *
 * This is based on the apollo-client-factory pattern but provides a singleton
 * instance for backward compatibility.
 */

import { createApolloClient } from './apollo-client-factory';

// Export the default singleton Apollo client
export const apolloClient = createApolloClient();

// Re-export utility functions from factory for backward compatibility
export { clearApolloCache, refetchQueries } from './apollo-client-factory';

// Re-export the factory function for creating new instances
export { createApolloClient };

// Export types for better type safety across the application
export type { ApolloClient } from '@apollo/client';

// Utility function to get client connection status
export const getClientConnectionStatus = (): boolean => {
  try {
    // Check if client is properly initialized and can access cache
    const cacheData = apolloClient.cache.extract();
    return cacheData !== null;
  } catch (error) {
    console.error('[Apollo Client] Error checking connection status:', error);
    return false;
  }
};

// Export Apollo Client instance type for better type safety
export type ApolloClientInstance = typeof apolloClient;

// Development helper to access Apollo Client devtools
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__APOLLO_CLIENT__ = apolloClient;
}
