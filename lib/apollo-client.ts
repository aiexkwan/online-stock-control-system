/**
 * Apollo Client Configuration for Supabase GraphQL
 * 用於 GraphQL widgets 遷移
 */

import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { createHttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { createClient } from '@/app/utils/supabase/client';

// HTTP connection to Supabase GraphQL endpoint
const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
});

// Authentication link with SSR safety
const authLink = setContext(async (_, { headers }) => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return {
      headers: {
        ...headers,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
    };
  }

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      headers: {
        ...headers,
        authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
    };
  } catch (error) {
    console.warn('Apollo auth link error:', error);
    return {
      headers: {
        ...headers,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
    };
  }
});

// Create Apollo Client instance with SSR safety
function createApolloClient() {
  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // 配置 cache 策略
            record_inventoryCollection: {
              keyArgs: ["filter", "orderBy"],
              merge(existing, incoming, { args }) {
                // 合併策略
                return incoming;
              },
            },
            record_transferCollection: {
              keyArgs: ["filter", "orderBy"],
            },
            record_historyCollection: {
              keyArgs: ["filter", "orderBy"],
            },
          },
        },
      },
    }),
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

// Singleton Apollo client instance
let apolloClientInstance: ApolloClient<any> | null = null;

// Safe getter function for Apollo client
export function getApolloClient(): ApolloClient<any> | null {
  // Never create client on server side
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Use singleton pattern in browser
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient();
  }
  
  return apolloClientInstance;
}

// Export the client getter - this will be null on server
export const apolloClient = getApolloClient();

// Export type for use in components
export type ApolloClientType = ApolloClient<any> | null;