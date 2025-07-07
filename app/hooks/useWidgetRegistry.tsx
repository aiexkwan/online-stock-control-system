'use client';

import { useEffect, useState } from 'react';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';
import { initializeEnhancedRegistry } from '@/app/admin/components/dashboard/LazyWidgetRegistry';

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
        // Check if already initialized
        const definitions = widgetRegistry.getAllDefinitions();
        if (definitions.size > 0) {
          if (mounted) {
            setIsInitialized(true);
          }
          return;
        }

        // Initialize the registry
        console.log('[useWidgetRegistry] Initializing widget registry...');
        await initializeEnhancedRegistry();
        
        // Auto register widgets
        await widgetRegistry.autoRegisterWidgets();
        
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