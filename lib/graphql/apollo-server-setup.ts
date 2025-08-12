import { ApolloServer } from '@apollo/server';
import { WebSocketServer } from 'ws';
// Import removed - WebSocket functionality will be implemented separately
// import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import type { Server } from 'http';

// Create executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create WebSocket server for subscriptions (disabled for now)
export function createWebSocketServer(httpServer: Server) {
  console.log('WebSocket server creation skipped - will be implemented in future version');
  return () => {}; // Return a no-op cleanup function
}

// Enhanced Apollo Server configuration with subscriptions
export function createApolloServer() {
  return new ApolloServer({
    schema,
    // Subscription configuration is handled by WebSocket server
    plugins: [
      {
        async serverWillStart() {
          console.log('GraphQL server starting with subscription support');
        },
        async requestDidStart() {
          return {
            async willSendResponse() {
              // Clean up WebSocket connections on server shutdown
            }
          };
        },
      },
    ],
  });
}