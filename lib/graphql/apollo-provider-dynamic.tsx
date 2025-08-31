/**
 * Dynamic Apollo Provider Component
 * Creates Apollo Client with proper authentication context
 */

'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
// Dynamic imports for Supabase client to handle SSR properly
import { createApolloClient } from './apollo-client-factory';
import { createClient } from '../../app/utils/supabase/client';

interface DynamicApolloProviderProps {
  children: ReactNode;
}

export function DynamicApolloProvider({ children }: DynamicApolloProviderProps): JSX.Element {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>(() =>
    createApolloClient()
  );
  const [isReady, setIsReady] = useState<boolean>(false);

  // Get Supabase client instance
  const supabase = createClient();

  useEffect(() => {
    // Initialize with current session
    const initializeClient = async () => {
      try {
        // Dynamic import to handle SSR properly
        const { createClient } = await import('../../app/utils/supabase/client');
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Create new client with token
          const newClient = createApolloClient(session.access_token);
          setClient(newClient);
        }
        setIsReady(true);
      } catch (error) {
        console.error('[DynamicApolloProvider] Error initializing:', error);
        setIsReady(true); // Still set ready even on error
      }
    };

    initializeClient();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[DynamicApolloProvider] Auth state changed:', event);

      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.access_token) {
            // Create new client with fresh token
            const newClient = createApolloClient(session.access_token);
            setClient(newClient);

            // Clear cache to ensure fresh data
            await newClient.clearStore();
          }
        } else if (event === 'SIGNED_OUT') {
          // Create client without token
          const newClient = createApolloClient();
          setClient(newClient);

          // Clear cache
          await newClient.clearStore();
        }
      } catch (error) {
        console.error('[DynamicApolloProvider] Error handling auth state change:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <p className='mt-2 text-sm text-gray-600'>Initializing...</p>
        </div>
      </div>
    );
  }

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}

// Export the factory function for server-side use
export { createApolloClient } from './apollo-client-factory';
