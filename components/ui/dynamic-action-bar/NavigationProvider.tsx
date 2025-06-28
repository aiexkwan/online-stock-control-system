'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { navigationPreloader } from '@/lib/navigation/preloader';
import { navigationCacheManager } from '@/lib/navigation/cache-manager';
import { NavigationErrorBoundary } from './NavigationErrorBoundary';
import { NavigationSkeleton, MobileNavigationSkeleton } from './NavigationSkeleton';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/app/hooks/useAuth';

interface NavigationContextType {
  isLoading: boolean;
  error: Error | null;
  preloadRoute: (route: string) => void;
  clearCache: () => void;
  getCacheStats: () => any;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useAuth();

  // 初始化導航系統
  useEffect(() => {
    const initializeNavigation = async () => {
      try {
        setIsLoading(true);
        
        // 預熱緩存和加載歷史數據
        if (user?.id) {
          await Promise.all([
            navigationCacheManager.warmupCache([user.id]),
            navigationPreloader.preloadUserData(user.id)
          ]);
        }
        
        setIsReady(true);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to initialize navigation:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNavigation();
  }, [user?.id]);

  // 預加載路由
  const preloadRoute = useCallback((route: string) => {
    if (user?.id) {
      navigationPreloader.predictAndPreload(user.id, route);
    }
  }, [user?.id]);

  // 清理緩存
  const clearCache = useCallback(() => {
    navigationPreloader.clearCache();
    navigationCacheManager.clearAllCache();
  }, []);

  // 獲取緩存統計
  const getCacheStats = useCallback(() => {
    return {
      preloader: navigationPreloader.getStats(),
      cache: navigationCacheManager.getCacheStats()
    };
  }, []);

  const contextValue: NavigationContextType = {
    isLoading,
    error,
    preloadRoute,
    clearCache,
    getCacheStats
  };

  // 顯示加載狀態
  if (isLoading && !isReady) {
    return isMobile ? <MobileNavigationSkeleton /> : <NavigationSkeleton />;
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      <NavigationErrorBoundary>
        {children}
      </NavigationErrorBoundary>
    </NavigationContext.Provider>
  );
}

// Performance monitoring hook
export function useNavigationPerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
  });

  useEffect(() => {
    // 使用 Performance API 監測性能
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        setMetrics({
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          renderTime: navigation.domComplete - navigation.responseEnd,
          interactionTime: navigation.domInteractive - navigation.responseEnd
        });
      }
    }
  }, []);

  return metrics;
}