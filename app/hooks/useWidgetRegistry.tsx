'use client';

import { useEffect, useState } from 'react';
import { simpleWidgetRegistry } from '@/lib/widgets/simple-registry';

/**
 * Hook to ensure widget registry is initialized before rendering
 */
export function useWidgetRegistry() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initRegistry = async () => {
      try {
        // Initialize the registry
        console.log('[useWidgetRegistry] Initializing widget registry...');
        await simpleWidgetRegistry.autoRegisterWidgets();

        // Check if registry has widgets registered
        const definitions = simpleWidgetRegistry.getAllDefinitions();
        console.log(`[useWidgetRegistry] Registry has ${definitions.size} widgets registered`);

        if (mounted) {
          setIsInitialized(true);
          console.log('[useWidgetRegistry] Widget registry initialized successfully');
        }
      } catch (err) {
        console.error('[useWidgetRegistry] Failed to initialize widget registry:', err);
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    initRegistry();

    return () => {
      mounted = false;
    };
  }, []);

  return { isInitialized, error };
}
