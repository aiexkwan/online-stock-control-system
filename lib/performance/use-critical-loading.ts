/**
 * Critical Loading Hook for Performance Optimization
 * Prioritizes loading of critical resources and implements progressive enhancement
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Type guard to safely check if PerformanceEntry is PerformanceNavigationTiming
 */
function isPerformanceNavigationTiming(entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation' && 'responseStart' in entry;
}

interface CriticalLoadingOptions {
  /** Critical resources that must load first */
  criticalResources?: string[];
  /** Non-critical resources that can be deferred */
  deferredResources?: string[];
  /** Timeout for critical resource loading */
  criticalTimeout?: number;
  /** Enable progressive enhancement */
  enableProgressiveEnhancement?: boolean;
}

interface LoadingState {
  criticalLoaded: boolean;
  deferredLoaded: boolean;
  error: Error | null;
  loadingProgress: number;
}

export function useCriticalLoading(options: CriticalLoadingOptions = {}) {
  const {
    criticalResources = [],
    deferredResources = [],
    criticalTimeout = 3000,
    enableProgressiveEnhancement = true,
  } = options;

  const [state, setState] = useState<LoadingState>({
    criticalLoaded: false,
    deferredLoaded: false,
    error: null,
    loadingProgress: 0,
  });

  /**
   * Load critical resources with priority
   */
  const loadCriticalResources = useCallback(async () => {
    if (criticalResources.length === 0) {
      setState(prev => ({ ...prev, criticalLoaded: true, loadingProgress: 50 }));
      return;
    }

    try {
      const startTime = performance.now();

      // Load critical resources with timeout
      const promises = criticalResources.map(resource =>
        fetch(resource, {
          priority: 'high' as any,
          cache: 'force-cache',
        }).catch(error => {
          console.warn(`[CriticalLoading] Failed to load critical resource: ${resource}`, error);
          return null;
        })
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Critical loading timeout')), criticalTimeout)
      );

      await Promise.race([Promise.allSettled(promises), timeoutPromise]);

      const endTime = performance.now();
      console.log(`[CriticalLoading] Critical resources loaded in ${endTime - startTime}ms`);

      setState(prev => ({
        ...prev,
        criticalLoaded: true,
        loadingProgress: 50,
      }));
    } catch (error) {
      console.error('[CriticalLoading] Critical loading failed:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
        criticalLoaded: true, // Continue with degraded experience
        loadingProgress: 50,
      }));
    }
  }, [criticalResources, criticalTimeout]);

  /**
   * Load deferred resources after critical ones
   */
  const loadDeferredResources = useCallback(async () => {
    if (deferredResources.length === 0) {
      setState(prev => ({ ...prev, deferredLoaded: true, loadingProgress: 100 }));
      return;
    }

    try {
      const startTime = performance.now();

      // Load deferred resources with lower priority
      const promises = deferredResources.map(resource =>
        fetch(resource, {
          priority: 'low' as any,
          cache: 'default',
        }).catch(error => {
          console.warn(`[CriticalLoading] Failed to load deferred resource: ${resource}`, error);
          return null;
        })
      );

      await Promise.allSettled(promises);

      const endTime = performance.now();
      console.log(`[CriticalLoading] Deferred resources loaded in ${endTime - startTime}ms`);

      setState(prev => ({
        ...prev,
        deferredLoaded: true,
        loadingProgress: 100,
      }));
    } catch (error) {
      console.error('[CriticalLoading] Deferred loading failed:', error);
      setState(prev => ({
        ...prev,
        deferredLoaded: true,
        loadingProgress: 100,
      }));
    }
  }, [deferredResources]);

  /**
   * Implement progressive enhancement
   */
  const enableProgressiveLoading = useCallback(() => {
    if (!enableProgressiveEnhancement) return;

    // Use requestIdleCallback for non-critical enhancements
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        loadDeferredResources();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadDeferredResources, 100);
    }
  }, [enableProgressiveEnhancement, loadDeferredResources]);

  /**
   * Preload critical resources using Resource Hints
   */
  const preloadCriticalResources = useCallback(() => {
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      // Determine resource type
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(png|jpg|jpeg|gif|webp|avif)$/)) {
        link.as = 'image';
      } else {
        link.as = 'fetch';
        link.setAttribute('crossorigin', 'anonymous');
      }

      document.head.appendChild(link);
    });
  }, [criticalResources]);

  // Initialize loading sequence
  useEffect(() => {
    const initializeLoading = async () => {
      // Step 1: Preload critical resources
      preloadCriticalResources();

      // Step 2: Load critical resources
      await loadCriticalResources();

      // Step 3: Progressive enhancement for deferred resources
      enableProgressiveLoading();
    };

    initializeLoading();
  }, [preloadCriticalResources, loadCriticalResources, enableProgressiveLoading]);

  /**
   * Manually trigger resource loading
   */
  const triggerLoad = useCallback(
    async (type: 'critical' | 'deferred' | 'all') => {
      switch (type) {
        case 'critical':
          await loadCriticalResources();
          break;
        case 'deferred':
          await loadDeferredResources();
          break;
        case 'all':
          await loadCriticalResources();
          await loadDeferredResources();
          break;
      }
    },
    [loadCriticalResources, loadDeferredResources]
  );

  return {
    ...state,
    isReady: state.criticalLoaded,
    isFullyLoaded: state.criticalLoaded && state.deferredLoaded,
    triggerLoad,
  };
}

/**
 * Hook for measuring loading performance
 */
export function useLoadingPerformance() {
  const [metrics, setMetrics] = useState({
    lcp: 0,
    fcp: 0,
    ttfb: 0,
    domContentLoaded: 0,
    loadComplete: 0,
  });

  useEffect(() => {
    // Measure performance metrics
    const measurePerformance = () => {
      const entries = performance.getEntriesByType('navigation');
      const navigation = entries.length > 0 && isPerformanceNavigationTiming(entries[0])
        ? entries[0]
        : null;

      if (navigation) {
        setMetrics({
          lcp: 0, // Will be updated by PerformanceObserver
          fcp: 0, // Will be updated by PerformanceObserver
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        });
      }
    };

    // Measure after load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Setup PerformanceObserver for Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
          } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
          }
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'paint', buffered: true });

      return () => observer.disconnect();
    }
  }, []);

  return metrics;
}
