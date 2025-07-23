/**
 * Apollo Client Configuration
 * GraphQL client setup for Supabase pg_graphql
 */

import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createClient } from '@/lib/supabase';

// GraphQL endpoint - use custom server or Supabase pg_graphql
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';
const USE_SUPABASE_GRAPHQL = process.env.NEXT_PUBLIC_USE_SUPABASE_GRAPHQL === 'true';

// HTTP Link
const httpLink = createHttpLink({
  uri: USE_SUPABASE_GRAPHQL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
    : GRAPHQL_ENDPOINT,
  credentials: 'same-origin',
});

// Auth Link - adds authentication headers
const authLink = setContext(async (_, { headers }) => {
  // Get Supabase session for authenticated requests
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const authHeaders: any = {
    ...headers,
    authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    'content-type': 'application/json',
  };

  // Only add apikey for Supabase GraphQL endpoint
  if (USE_SUPABASE_GRAPHQL) {
    authHeaders.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  
  return { headers: authHeaders };
});

// Error Link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Retry logic for network errors
    if (networkError.message === 'Failed to fetch') {
      return forward(operation);
    }
  }
});

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Widget data caching
        widget: {
          keyArgs: ['id', 'params'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        widgets: {
          keyArgs: ['ids', 'params'],
          merge(existing = [], incoming) {
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
      },
    },
    // Widget-specific cache policies
    WidgetData: {
      keyFields: ['id'],
    },
  },
});

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
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