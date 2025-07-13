/**
 * React Hook for Widget Performance Tracking
 * 
 * Integrates enhanced performance monitoring:
 * - Automatic performance tracking
 * - Error monitoring
 * - A/B testing support
 * - Real-time metrics
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { performanceMonitor, PerformanceTimer } from '@/lib/widgets/performance-monitor';
import { 
  enhancedPerformanceMonitor,
  type ErrorMetrics,
  type ABTestConfig 
} from '@/lib/widgets/enhanced-performance-monitor';

export interface UseWidgetPerformanceTrackingOptions {
  widgetId: string;
  variant?: 'v2' | 'legacy';
  enableAutoTracking?: boolean;
  abTest?: {
    testId: string;
    variant: 'control' | 'test';
  };
  customMetrics?: Record<string, any>;
}

export interface UseWidgetPerformanceTrackingResult {
  // Performance tracking
  startTracking: () => void;
  stopTracking: () => void;
  trackRender: () => void;
  trackDataFetch: (fetchFn: () => Promise<any>) => Promise<any>;
  
  // Error tracking
  trackError: (error: Error, errorType?: ErrorMetrics['errorType']) => void;
  
  // Metrics
  getMetrics: () => {
    loadTime?: number;
    renderTime?: number;
    dataFetchTime?: number;
    errorCount: number;
  };
  
  // A/B testing
  isTestVariant: boolean;
  trackConversion: (conversionType: string) => void;
}

/**
 * Performance tracking hook for widgets
 */
export function useWidgetPerformanceTracking({
  widgetId,
  variant = 'v2',
  enableAutoTracking = true,
  abTest,
  customMetrics,
}: UseWidgetPerformanceTrackingOptions): UseWidgetPerformanceTrackingResult {
  const pathname = usePathname();
  const timerRef = useRef<PerformanceTimer | null>(null);
  const errorCountRef = useRef(0);
  const sessionIdRef = useRef(generateSessionId());
  const renderStartTimeRef = useRef<number | null>(null);
  const metricsRef = useRef({
    loadTime: undefined as number | undefined,
    renderTime: undefined as number | undefined,
    dataFetchTime: undefined as number | undefined,
  });
  
  // Start performance tracking
  const startTracking = useCallback(() => {
    if (!timerRef.current) {
      timerRef.current = performanceMonitor.startMonitoring(widgetId, variant);
      console.log(`[PerformanceTracking] Started tracking for ${widgetId}`);
    }
  }, [widgetId, variant]);
  
  // Stop tracking and record metrics
  const stopTracking = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.complete({
        route: pathname,
        sessionId: sessionIdRef.current,
        userId: customMetrics?.userId,
      });
      
      console.log(`[PerformanceTracking] Completed tracking for ${widgetId}`);
      timerRef.current = null;
    }
  }, [widgetId, pathname, customMetrics?.userId]);
  
  // Track render phase
  const trackRender = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.startRender();
      renderStartTimeRef.current = performance.now();
    }
  }, []);
  
  // Track data fetching with timing
  const trackDataFetch = useCallback(async <T,>(fetchFn: () => Promise<T>): Promise<T> => {
    if (!timerRef.current) {
      return fetchFn();
    }
    
    timerRef.current.startDataFetch();
    const startTime = performance.now();
    
    try {
      const result = await fetchFn();
      const fetchTime = performance.now() - startTime;
      metricsRef.current.dataFetchTime = fetchTime;
      
      console.log(`[PerformanceTracking] Data fetch completed for ${widgetId}: ${fetchTime.toFixed(2)}ms`);
      return result;
    } catch (error) {
      // Track fetch errors
      trackError(error as Error, 'data-fetch');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId]);
  
  // Track errors
  const trackError = useCallback((error: Error, errorType: ErrorMetrics['errorType'] = 'runtime') => {
    errorCountRef.current++;
    
    const errorMetric: ErrorMetrics = {
      widgetId,
      timestamp: Date.now(),
      errorType,
      errorMessage: error.message,
      errorStack: error.stack,
      severity: determineSeverity(error, errorType),
      userImpact: 1, // Single user impact
      context: {
        route: pathname,
        variant,
        sessionId: sessionIdRef.current,
        userId: customMetrics?.userId,
      },
    };
    
    enhancedPerformanceMonitor.recordError(errorMetric);
    console.error(`[PerformanceTracking] Error in ${widgetId}:`, error);
  }, [widgetId, pathname, variant, customMetrics?.userId]);
  
  // Get current metrics
  const getMetrics = useCallback(() => {
    return {
      loadTime: metricsRef.current.loadTime,
      renderTime: metricsRef.current.renderTime,
      dataFetchTime: metricsRef.current.dataFetchTime,
      errorCount: errorCountRef.current,
    };
  }, []);
  
  // Track conversion for A/B testing
  const trackConversion = useCallback((conversionType: string) => {
    if (abTest) {
      console.log(`[PerformanceTracking] Conversion tracked for ${abTest.testId}: ${conversionType}`);
      // In production, this would send conversion data to analytics
    }
  }, [abTest]);
  
  // Auto-tracking effect
  useEffect(() => {
    if (enableAutoTracking) {
      startTracking();
      
      // Track initial render
      trackRender();
      
      // Complete tracking on unmount
      return () => {
        stopTracking();
      };
    }
  }, [enableAutoTracking, startTracking, stopTracking, trackRender]);
  
  // Setup error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error) {
        trackError(event.error, 'runtime');
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [trackError]);
  
  // A/B test setup
  useEffect(() => {
    if (abTest) {
      const config: ABTestConfig = {
        testId: abTest.testId,
        widgetId,
        variants: {
          control: 'v2',
          test: 'v2-test',
        },
        metrics: ['loadTime', 'errorRate', 'conversionRate'],
        startDate: new Date(),
        splitRatio: 0.5,
      };
      
      enhancedPerformanceMonitor.setupABTest(config);
    }
  }, [abTest, widgetId]);
  
  return {
    startTracking,
    stopTracking,
    trackRender,
    trackDataFetch,
    trackError,
    getMetrics,
    isTestVariant: abTest?.variant === 'test',
    trackConversion,
  };
}

/**
 * Hook to access performance reports
 */
export function usePerformanceReports() {
  const generateReport = useCallback((
    type: 'daily' | 'weekly' | 'monthly',
    customRange?: { start: Date; end: Date }
  ) => {
    return enhancedPerformanceMonitor.generateReport(type, customRange);
  }, []);
  
  const getABTestResults = useCallback((testId: string) => {
    return enhancedPerformanceMonitor.analyzeABTest(testId);
  }, []);
  
  const exportPerformanceData = useCallback((format: 'json' | 'csv' = 'json') => {
    return enhancedPerformanceMonitor.exportData(format);
  }, []);
  
  const detectAnomalies = useCallback((widgetId: string, sensitivity?: number) => {
    return enhancedPerformanceMonitor.detectAnomalies(widgetId, sensitivity);
  }, []);
  
  return {
    generateReport,
    getABTestResults,
    exportPerformanceData,
    detectAnomalies,
  };
}

/**
 * Hook for real-time performance monitoring
 */
export function useRealtimePerformanceMonitor(widgetId?: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);
  
  useEffect(() => {
    if (!isMonitoring) return;
    
    const updateMetrics = () => {
      const realtimeData = performanceMonitor.getRealtimeMetrics();
      
      if (widgetId) {
        const widgetReport = performanceMonitor.getWidgetReport(widgetId);
        const errorRate = enhancedPerformanceMonitor.getErrorRate(widgetId);
        
        setMetrics({
          widget: {
            id: widgetId,
            loadTime: widgetReport.v2Performance?.loadTime.mean || 0,
            renderTime: widgetReport.v2Performance?.renderTime.mean || 0,
            errorRate,
            sampleSize: widgetReport.v2Performance?.sampleCount || 0,
          },
          global: realtimeData,
        });
      } else {
        setMetrics({ global: realtimeData });
      }
    };
    
    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update
    
    return () => clearInterval(interval);
  }, [isMonitoring, widgetId]);
  
  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}

// Helper functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function determineSeverity(
  error: Error,
  errorType: ErrorMetrics['errorType']
): ErrorMetrics['severity'] {
  // Critical errors
  if (error.message.includes('Cannot read') || error.message.includes('undefined')) {
    return 'critical';
  }
  
  // High severity for data fetch errors
  if (errorType === 'data-fetch') {
    return 'high';
  }
  
  // Medium severity for render errors
  if (errorType === 'render') {
    return 'medium';
  }
  
  // Default to low
  return 'low';
}

// Re-export types for convenience
export type { ErrorMetrics, ABTestResults, AutomatedPerformanceReport } from '@/lib/widgets/enhanced-performance-monitor';

import { useState } from 'react';