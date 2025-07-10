/**
 * Apollo Client Configuration for Supabase GraphQL
 * 用於 GraphQL widgets 遷移
 */

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createClient } from '@/app/utils/supabase/client';

// HTTP connection to Supabase GraphQL endpoint
const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
});

// Authentication link
const authLink = setContext(async (_, { headers }) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    headers: {
      ...headers,
      authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
  };
});

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
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

// Export type for use in components
export type ApolloClientType = typeof apolloClient;