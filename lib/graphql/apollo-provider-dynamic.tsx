/**
 * Dynamic Apollo Provider Component
 * Creates Apollo Client with proper authentication context
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { createApolloClient } from './apollo-client-factory';
import { createClient } from '@/app/utils/supabase/client';

interface DynamicApolloProviderProps {
  children: React.ReactNode;
}

export function DynamicApolloProvider({ children }: DynamicApolloProviderProps) {
  const [client, setClient] = useState(() => createApolloClient());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Create Supabase client
    const supabase = createClient();

    // Initialize with current session
    const initializeClient = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[DynamicApolloProvider] Auth state changed:', event);
      
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <BaseApolloProvider client={client}>
      {children}
    </BaseApolloProvider>
  );
}

// Export the factory function for server-side use
export { createApolloClient } from './apollo-client-factory';