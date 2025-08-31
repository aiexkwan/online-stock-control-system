/**
 * Apollo Client Factory
 * Creates Apollo Client instances with proper authentication handling
 */

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
// Dynamic imports to handle SSR properly
// We'll import the client functions dynamically when needed

// GraphQL endpoint
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';
const USE_SUPABASE_GRAPHQL = process.env.NEXT_PUBLIC_USE_SUPABASE_GRAPHQL === 'true';

// Cache instance (shared across all clients)
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Card data caching
        card: {
          keyArgs: ['id', 'params'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        cards: {
          keyArgs: ['ids', 'params'],
          merge(_existing = [], incoming) {
            return [...incoming];
          },
        },
        // Dashboard caching
        dashboard: {
          keyArgs: ['theme'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        // Card data caching
        statsCardData: {
          merge: false, // Always use incoming data
        },
        chartCardData: {
          merge: false,
        },
      },
    },
    // Card-specific cache policies
    CardData: {
      keyFields: ['id'],
    },
  },
});

/**
 * Creates a new Apollo Client instance with authentication
 * @param accessToken Optional access token for server-side rendering
 */
export function createApolloClient(accessToken?: string) {
  // HTTP Link
  const httpLink = createHttpLink({
    uri: USE_SUPABASE_GRAPHQL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
      : GRAPHQL_ENDPOINT,
    credentials: 'same-origin',
  });

  // Auth Link - adds authentication headers
  const authLink = setContext(async (_, { headers }) => {
    try {
      let token = accessToken;

      // If no token provided and we're on client-side, get from Supabase
      if (!token && typeof window !== 'undefined') {
        try {
          const { createClient } = await import('../../app/utils/supabase/client');
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.access_token) {
            token = session.access_token;
          } else {
            // Try to refresh session
            const {
              data: { session: refreshedSession },
            } = await supabase.auth.refreshSession();
            if (refreshedSession?.access_token) {
              token = refreshedSession.access_token;
              console.log('[Apollo Client] Session refreshed');
            }
          }
        } catch (importError) {
          console.warn('[Apollo Client] Failed to import Supabase client:', importError);
        }
      }

      const authHeaders: Record<string, string> = {
        ...headers,
        'content-type': 'application/json',
      };

      if (token) {
        authHeaders.authorization = `Bearer ${token}`;
      }

      // Only add apikey for Supabase GraphQL endpoint
      if (USE_SUPABASE_GRAPHQL) {
        authHeaders.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      }

      return { headers: authHeaders };
    } catch (error) {
      console.error('[Apollo Client] Error setting auth headers:', error);
      return { headers };
    }
  });

  // Error Link
  const errorLink = onError(
    ({ graphQLErrors, networkError, operation: _operation, forward: _forward }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path, extensions }) => {
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
            extensions
          );

          // Check for authentication errors
          if (
            message.includes('Authentication') ||
            message.includes('Unauthorized') ||
            message.includes('JWT')
          ) {
            console.error('[GraphQL error]: Authentication error detected');

            // On client-side, try to refresh and retry
            if (typeof window !== 'undefined') {
              import('../../app/utils/supabase/client')
                .then(async ({ createClient }) => {
                  try {
                    const supabase = createClient();
                    const { data, error } = await supabase.auth.refreshSession();
                    if (!error && data.session) {
                      console.log('[GraphQL error]: Session refreshed, please retry');
                      // Note: In a real app, you might want to implement a retry queue
                    }
                  } catch (refreshError) {
                    console.error('[GraphQL error]: Failed to refresh session:', refreshError);
                  }
                })
                .catch(importError => {
                  console.warn('[GraphQL error]: Failed to import Supabase client:', importError);
                });
            }
          }
        });
      }

      if (networkError) {
        console.error(`[Network error]:`, networkError);

        // Log additional details
        if ('statusCode' in networkError) {
          const statusCode = (networkError as { statusCode?: number }).statusCode;
          console.error(`[Network error] Status: ${statusCode}`);
        }
        if ('result' in networkError) {
          const result = (networkError as { result?: unknown }).result;
          console.error(`[Network error] Result:`, result);
        }
      }
    }
  );

  // Create Apollo Client
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
  });
}

// Create a default client instance for backward compatibility
export const apolloClient = createApolloClient();

// Utility functions
export const clearApolloCache = async () => {
  await apolloClient.clearStore();
};

export const refetchQueries = async (queryNames: string[]) => {
  const queries = apolloClient.getObservableQueries();
  const queriesToRefetch = Array.from(queries.values()).filter(query =>
    queryNames.includes(query.queryName || '')
  );

  await Promise.all(queriesToRefetch.map(query => query.refetch()));
};
