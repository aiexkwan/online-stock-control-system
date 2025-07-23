/**
 * GraphQL Server Configuration
 * Sets up Apollo Server for Next.js App Router
 */

import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';
import { createDataLoaderContext } from './dataloaders/base.dataloader';
import { typeDefs } from './schema';

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Apollo Server instance
export const apolloServer = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (err) => {
    console.error('[GraphQL Error]:', err);
    
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      // Generic error message for production
      if (err.message.includes('Authentication')) {
        return new Error('Authentication required');
      }
      if (err.message.includes('Permission')) {
        return new Error('Insufficient permissions');
      }
      return new Error('Internal server error');
    }
    
    return err;
  },
});

// Start the server (for serverless, this is handled differently)
let serverStarted = false;

export async function getApolloServer() {
  if (!serverStarted) {
    await apolloServer.start();
    serverStarted = true;
  }
  return apolloServer;
}

// Context creation function
export async function createGraphQLContext(req: Request) {
  // Extract user from request headers or cookies
  let user = null;
  const authHeader = req.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Validate token and extract user
    // This would use Supabase auth or JWT validation
    // For now, we'll leave it as null
  }

  // Create DataLoader context
  const dataLoaderContext = await createDataLoaderContext();

  return {
    ...dataLoaderContext,
    user,
    requestId: crypto.randomUUID(),
  };
}