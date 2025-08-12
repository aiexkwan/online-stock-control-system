/**
 * GraphQL Server Configuration - Fixed Version
 * 根據 Apollo Server 官方建議解決重複啟動問題
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

// 根據官方建議：緩存 server instance 和 start promise
declare global {
  var apolloServer: ApolloServer | undefined;
  var apolloStartPromise: Promise<void> | undefined;
}

// 創建 Apollo Server 實例
function createApolloServer() {
  return new ApolloServer({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: err => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[GraphQL Error]:', err);
      }

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
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
}

// 根據官方建議：緩存 start promise 而唔係 server instance
export async function getApolloServer() {
  // 如果 server 未創建，創建一個新嘅
  if (!globalThis.apolloServer) {
    globalThis.apolloServer = createApolloServer();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Apollo Server] Created new server instance');
    }
  }

  // 如果 start promise 未創建，創建並緩存
  if (!globalThis.apolloStartPromise) {
    globalThis.apolloStartPromise = globalThis.apolloServer.start().then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Apollo Server] ✅ Server started successfully');
      }
    }).catch(error => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Apollo Server] ❌ Start failed:', error);
      }
      // 清除 promise 以便重試
      globalThis.apolloStartPromise = undefined;
      throw error;
    });
  }

  // 等待 start promise 完成
  await globalThis.apolloStartPromise;
  
  return globalThis.apolloServer;
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