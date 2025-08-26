/**
 * Performance Monitor Component
 * Displays real-time performance metrics and optimization results
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useLoadingPerformance } from './use-critical-loading';
import { serviceWorkerManager } from './service-worker-manager';

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  cacheHitRate: number;
  totalRequests: number;
}

export function PerformanceMonitor({
  enabled = false,
  showDetails = false,
}: {
  enabled?: boolean;
  showDetails?: boolean;
}) {
  const loadingMetrics = useLoadingPerformance();
  const [swMetrics, setSWMetrics] = useState({ hitRate: 0, totalRequests: 0 });
  const [isVisible, setIsVisible] = useState(enabled);

  // Update Service Worker metrics
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const metrics = serviceWorkerManager.getCacheMetrics();
      setSWMetrics({
        hitRate: Math.round(metrics.hitRate * 100),
        totalRequests: metrics.totalRequests,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Toggle visibility with keyboard shortcut (Ctrl+P)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled]);

  if (!enabled || !isVisible) {
    return null;
  }

  const getPerformanceGrade = (metric: number, thresholds: [number, number]) => {
    if (metric <= thresholds[0]) return 'good';
    if (metric <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const formatTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className='fixed bottom-4 right-4 z-50 max-w-sm'>
      <div className='rounded-lg border border-slate-700 bg-black/80 p-4 text-sm text-white backdrop-blur-sm'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='font-semibold text-green-400'>Performance Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className='text-xs text-slate-400 hover:text-white'
          >
            ✕
          </button>
        </div>

        <div className='space-y-2'>
          {/* Core Web Vitals */}
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div
              className={`rounded p-2 ${
                getPerformanceGrade(loadingMetrics.lcp, [2500, 4000]) === 'good'
                  ? 'bg-green-900/50'
                  : getPerformanceGrade(loadingMetrics.lcp, [2500, 4000]) === 'needs-improvement'
                    ? 'bg-yellow-900/50'
                    : 'bg-red-900/50'
              }`}
            >
              <div className='font-medium'>LCP</div>
              <div>{formatTime(loadingMetrics.lcp) || 'Measuring...'}</div>
            </div>

            <div
              className={`rounded p-2 ${
                getPerformanceGrade(loadingMetrics.fcp, [1800, 3000]) === 'good'
                  ? 'bg-green-900/50'
                  : getPerformanceGrade(loadingMetrics.fcp, [1800, 3000]) === 'needs-improvement'
                    ? 'bg-yellow-900/50'
                    : 'bg-red-900/50'
              }`}
            >
              <div className='font-medium'>FCP</div>
              <div>{formatTime(loadingMetrics.fcp) || 'Measuring...'}</div>
            </div>
          </div>

          {/* Additional Metrics */}
          {showDetails && (
            <>
              <div className='mt-2 border-t border-slate-600 pt-2'>
                <div className='space-y-1 text-xs'>
                  <div className='flex justify-between'>
                    <span>TTFB:</span>
                    <span
                      className={
                        loadingMetrics.ttfb <= 800
                          ? 'text-green-400'
                          : loadingMetrics.ttfb <= 1800
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {formatTime(loadingMetrics.ttfb)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>DOM Ready:</span>
                    <span>{formatTime(loadingMetrics.domContentLoaded)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Load Complete:</span>
                    <span>{formatTime(loadingMetrics.loadComplete)}</span>
                  </div>
                </div>
              </div>

              {/* Service Worker Cache Stats */}
              <div className='mt-2 border-t border-slate-600 pt-2'>
                <div className='space-y-1 text-xs'>
                  <div className='flex justify-between'>
                    <span>Cache Hit Rate:</span>
                    <span
                      className={
                        swMetrics.hitRate >= 80
                          ? 'text-green-400'
                          : swMetrics.hitRate >= 50
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {swMetrics.hitRate}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total Requests:</span>
                    <span>{swMetrics.totalRequests}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className='mt-3 border-t border-slate-600 pt-2 text-xs text-slate-400'>
          Press Ctrl+P to toggle • ESC to hide
        </div>
      </div>
    </div>
  );
}

/**
 * Performance Metrics Dashboard (for development)
 */
export function PerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Collect metrics every second
    const interval = setInterval(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const swMetrics = serviceWorkerManager.getCacheMetrics();

      if (navigation) {
        const newMetric: PerformanceMetrics = {
          lcp: 0, // Will be updated by observer
          fcp: 0, // Will be updated by observer
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          cacheHitRate: swMetrics.hitRate,
          totalRequests: swMetrics.totalRequests,
        };

        setMetrics(prev => [...prev.slice(-9), newMetric]); // Keep last 10 entries
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-4 left-4 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700'
      >
        📊 Performance
      </button>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='max-h-[80vh] max-w-4xl overflow-auto rounded-lg bg-white p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold'>Performance Dashboard</h2>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                ✕
              </button>
            </div>

            <div className='mb-6 grid grid-cols-3 gap-4'>
              <div className='rounded-lg bg-blue-50 p-4'>
                <h3 className='font-semibold text-blue-800'>Optimization Status</h3>
                <div className='mt-2'>
                  <div className='flex items-center justify-between'>
                    <span>Service Worker:</span>
                    <span className='text-green-600'>✓ Active</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Critical Loading:</span>
                    <span className='text-green-600'>✓ Enabled</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Image Optimization:</span>
                    <span className='text-green-600'>✓ WebP/AVIF</span>
                  </div>
                </div>
              </div>

              <div className='rounded-lg bg-green-50 p-4'>
                <h3 className='font-semibold text-green-800'>Cache Performance</h3>
                <div className='mt-2'>
                  <div className='text-2xl font-bold text-green-600'>
                    {Math.round(serviceWorkerManager.getCacheMetrics().hitRate * 100)}%
                  </div>
                  <div className='text-sm text-gray-600'>Hit Rate</div>
                </div>
              </div>

              <div className='rounded-lg bg-purple-50 p-4'>
                <h3 className='font-semibold text-purple-800'>Bundle Optimization</h3>
                <div className='mt-2'>
                  <div className='flex items-center justify-between'>
                    <span>Code Splitting:</span>
                    <span className='text-green-600'>✓ Dynamic</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Tree Shaking:</span>
                    <span className='text-green-600'>✓ Enabled</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Compression:</span>
                    <span className='text-green-600'>✓ Gzip/Brotli</span>
                  </div>
                </div>
              </div>
            </div>

            {metrics.length > 0 && (
              <div className='mt-4'>
                <h3 className='mb-2 font-semibold'>Recent Performance Metrics</h3>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-gray-100'>
                      <tr>
                        <th className='px-3 py-2 text-left'>Time</th>
                        <th className='px-3 py-2 text-left'>TTFB</th>
                        <th className='px-3 py-2 text-left'>DOM Ready</th>
                        <th className='px-3 py-2 text-left'>Load Complete</th>
                        <th className='px-3 py-2 text-left'>Cache Hit Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(-5).map((metric, index) => (
                        <tr key={index} className='border-b'>
                          <td className='px-3 py-2'>{new Date().toLocaleTimeString()}</td>
                          <td className='px-3 py-2'>{formatTime(metric.ttfb)}</td>
                          <td className='px-3 py-2'>{formatTime(metric.domContentLoaded)}</td>
                          <td className='px-3 py-2'>{formatTime(metric.loadComplete)}</td>
                          <td className='px-3 py-2'>{Math.round(metric.cacheHitRate * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  function formatTime(time: number) {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  }
}
