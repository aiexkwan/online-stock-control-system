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
  let session = null;
  
  try {
    // Import Supabase client for server
    const { createClient } = await import('@/app/utils/supabase/server');
    const supabase = await createClient();
    
    // Try to get session from cookies first (SSR)
    const { data: { session: cookieSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (cookieSession && !sessionError) {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (!userError && authUser) {
        user = {
          id: authUser.id,
          email: authUser.email,
          role: authUser.role,
          metadata: authUser.user_metadata,
        };
        session = cookieSession;
        console.log('[GraphQL Context] User authenticated from cookies:', authUser.email);
      }
    } else {
      // Fallback to Authorization header
      const authHeader = req.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Verify the JWT token with Supabase
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        
        if (!error && authUser) {
          user = {
            id: authUser.id,
            email: authUser.email,
            role: authUser.role,
            metadata: authUser.user_metadata,
          };
          session = { access_token: token };
          console.log('[GraphQL Context] User authenticated from header:', authUser.email);
        } else {
          console.error('[GraphQL Context] Auth header error:', error?.message);
        }
      }
    }
  } catch (error) {
    console.error('[GraphQL Context] Failed to get authentication:', error);
  }

  // Create DataLoader context
  const dataLoaderContext = await createDataLoaderContext();

  return {
    ...dataLoaderContext,
    user,
    session,
    requestId: crypto.randomUUID(),
  };
}