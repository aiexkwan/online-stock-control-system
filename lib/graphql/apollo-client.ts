/**
 * Apollo Client Configuration
 * GraphQL client setup for Supabase pg_graphql
 */

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createClient } from '@/lib/supabase';
// import { PerformanceLink } from '@/lib/performance/graphql-performance-monitor';

// GraphQL endpoint - use custom server or Supabase pg_graphql
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';
const USE_SUPABASE_GRAPHQL = process.env.NEXT_PUBLIC_USE_SUPABASE_GRAPHQL === 'true';

// Create a singleton Supabase client for Apollo
let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create a new client
    return createClient();
  }

  // Client-side: use singleton
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

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
    // Get Supabase session for authenticated requests
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, try to refresh
    if (!session) {
      const {
        data: { session: refreshedSession },
      } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        console.log('[Apollo Auth] Session refreshed');
      }
    }

    const authHeaders: Record<string, string> = {
      ...headers,
      authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
      'content-type': 'application/json',
    };

    // Only add apikey for Supabase GraphQL endpoint
    if (USE_SUPABASE_GRAPHQL) {
      authHeaders.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }

    return { headers: authHeaders };
  } catch (error) {
    console.error('[Apollo Auth] Error getting session:', error);
    return { headers };
  }
});

// Error Link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        extensions
      );

      // Check for authentication errors
      if (message.includes('Authentication') || message.includes('Unauthorized')) {
        console.error('[GraphQL error]: Authentication required. Refreshing session...');
        // Try to refresh the session
        if (typeof window !== 'undefined' && supabaseClient) {
          supabaseClient.auth.refreshSession().then(({ data, error }) => {
            if (error) {
              console.error('[GraphQL error]: Failed to refresh session:', error);
              return undefined;
            } else if (data.session) {
              console.log('[GraphQL error]: Session refreshed, retrying operation');
              return forward(operation);
            }
            return undefined;
          });
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Enhanced error logging
    if ('statusCode' in networkError) {
      const statusCode = (networkError as { statusCode?: number }).statusCode;
      console.error(`[Network error]: Status code: ${statusCode}`);
    }

    // Retry logic for network errors
    if (networkError.message === 'Failed to fetch') {
      return forward(operation);
    }
  }
  
  // Return undefined for default case
  return undefined;
});

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Card data caching
        card: {
          keyArgs: ['id', 'params'],
          merge(_existing, incoming) {
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
          merge(_existing, incoming) {
            return incoming;
          },
        },
      },
    },
    // Card-specific cache policies
    CardData: {
      keyFields: ['id'],
    },
    // Department-specific cache policies
    DepartmentPipeData: {
      keyFields: false, // Single instance per query
      fields: {
        stats: {
          merge: true,
        },
        topStocks: {
          keyArgs: false,
          merge(existing, incoming, { args: _args, cache: _cache }) {
            return incoming;
          },
        },
        materialStocks: {
          keyArgs: false,
          merge(existing, incoming, { args: _args, cache: _cache }) {
            return incoming;
          },
        },
        machineStates: {
          merge: (_existing = [], incoming) => incoming,
        },
      },
    },
    StockItem: {
      keyFields: ['stock'],
    },
    MachineState: {
      keyFields: ['machineNumber'],
    },
    // History record caching - use uuid as unique identifier
    HistoryRecord: {
      keyFields: ['uuid'],
    },
  },
});

// Phase 3: Add performance monitoring
// const performanceLink = new PerformanceLink();

// Apollo Client instance
export const apolloClient = new ApolloClient({
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

// Utility function to clear cache
export const clearApolloCache = async () => {
  await apolloClient.clearStore();
};

// Utility function to refetch queries
export const refetchQueries = async (queryNames: string[]) => {
  const queries = apolloClient.getObservableQueries();
  const queriesToRefetch = Array.from(queries.values()).filter(query =>
    queryNames.includes(query.queryName || '')
  );

  await Promise.all(queriesToRefetch.map(query => query.refetch()));
};
