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

// Use globalThis to persist Apollo Server across hot reloads in development
declare global {
  var apolloServer: ApolloServer | undefined;
  var apolloServerStarted: boolean | undefined;
  var serverStartPromise: Promise<ApolloServer> | undefined;
  var serverInitLock: boolean | undefined;
}

export async function getApolloServer() {
  // Quick return if server is ready
  if (globalThis.apolloServer && globalThis.apolloServerStarted) {
    return globalThis.apolloServer;
  }

  // Prevent concurrent initialization with lock
  if (globalThis.serverInitLock) {
    // If there's a promise, wait for it
    if (globalThis.serverStartPromise) {
      return await globalThis.serverStartPromise;
    }
    // If lock but no promise, wait briefly and retry
    await new Promise(resolve => setTimeout(resolve, 10));
    return await getApolloServer();
  }

  // Set initialization lock
  globalThis.serverInitLock = true;

  try {
    // Double-check after acquiring lock
    if (globalThis.apolloServer && globalThis.apolloServerStarted) {
      return globalThis.apolloServer;
    }

    // If promise exists, wait for it
    if (globalThis.serverStartPromise) {
      return await globalThis.serverStartPromise;
    }

    // Create new server instance
    globalThis.serverStartPromise = (async () => {
      try {
        // Reuse existing server instance if available but not started
        let server = globalThis.apolloServer;

        if (!server) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Apollo Server] Creating new server instance...');
          }

          server = new ApolloServer({
            schema,
            introspection: process.env.NODE_ENV !== 'production',
            formatError: err => {
              // Only log in development to reduce noise
              if (process.env.NODE_ENV === 'development') {
                console.error('[GraphQL Error]:', err);
              }

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

          // Store the server instance globally
          globalThis.apolloServer = server;
          globalThis.apolloServerStarted = false;
        }

        // Only start if not already started
        if (!globalThis.apolloServerStarted) {
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Apollo Server] Starting server...');
            }

            // Use startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests for serverless
            await server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
            globalThis.apolloServerStarted = true;

            if (process.env.NODE_ENV === 'development') {
              console.log('[Apollo Server] ✅ Server started successfully');
            }
          } catch (error) {
            // If the error is about already being started, just return the server
            if (error instanceof Error && error.message.includes('once on your ApolloServer')) {
              console.log('[Apollo Server] Server already started, reusing instance');
              globalThis.apolloServerStarted = true;
              return server;
            }

            // Clear the started flag on other errors
            globalThis.apolloServerStarted = false;
            throw error;
          }
        }

        return server;
      } catch (error) {
        // Clear state on error to allow retry
        globalThis.serverStartPromise = undefined;
        globalThis.apolloServerStarted = false;
        console.error('[Apollo Server] Startup error:', error);
        throw error;
      }
    })();

    const result = await globalThis.serverStartPromise;
    return result;
  } finally {
    // Always release the lock
    globalThis.serverInitLock = false;
  }
}

// Context creation function
export async function createGraphQLContext(req: Request) {
  // Extract user from request headers or cookies
  let user = null;
  let session = null;

  try {
    // Import Supabase client for server
    const { createClient } = await import('../../app/utils/supabase/server');
    const supabase = await createClient();

    // Try to get session from cookies first (SSR)
    const {
      data: { session: cookieSession },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (cookieSession && !sessionError) {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

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
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser(token);

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
