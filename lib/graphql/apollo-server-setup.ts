import type { Server } from 'http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPlugin, BaseContext } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import type { GraphQLContext } from './resolvers/index';
import { createDataLoaderContext } from './dataloaders/base.dataloader';

// Create executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create WebSocket server for subscriptions (disabled for now)
export function createWebSocketServer(_httpServer: Server) {
  console.log('WebSocket server creation skipped - will be implemented in future version');
  return () => {}; // Return a no-op cleanup function
}

// Context creation function
export async function createContext(): Promise<GraphQLContext> {
  const baseContext = await createDataLoaderContext();

  return {
    ...baseContext,
    requestId: crypto.randomUUID(),
    // User will be populated by authentication middleware
    user: undefined,
  };
}

// Apollo Server plugins
const apolloServerPlugins: ApolloServerPlugin<GraphQLContext>[] = [
  {
    async serverWillStart() {
      console.log('GraphQL server starting with enhanced type safety');
      return {
        async serverWillStop() {
          console.log('GraphQL server stopping');
        },
      };
    },
    async requestDidStart() {
      return {
        async willSendResponse(requestContext) {
          // Log successful responses in development
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `GraphQL operation completed: ${requestContext.request.operationName || 'anonymous'}`
            );
          }
        },
        async didEncounterErrors(requestContext) {
          // Enhanced error logging with context
          console.error('GraphQL errors encountered:', {
            operationName: requestContext.request.operationName,
            errors: requestContext.errors.map(error => ({
              message: error.message,
              locations: error.locations,
              path: error.path,
            })),
          });
        },
      };
    },
  },
];

// Enhanced Apollo Server configuration with type safety
export function createApolloServer() {
  return new ApolloServer<GraphQLContext>({
    schema,
    plugins: apolloServerPlugins,
    // Enhanced error formatting
    formatError: error => {
      // Log the full error for debugging
      console.error('GraphQL Error:', error);

      // Return sanitized error to client
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code,
          // Only include stack trace in development
          ...(process.env.NODE_ENV === 'development' && {
            stacktrace: error.extensions?.stacktrace,
          }),
        },
      };
    },
    // Enable introspection and playground in development
    introspection: process.env.NODE_ENV === 'development',
  });
}
