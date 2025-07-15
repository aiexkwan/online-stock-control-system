'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StockLevelHistoryChart } from '@/app/admin/components/dashboard/widgets/StockLevelHistoryChart';
import { ChartSkeleton } from '@/app/admin/components/dashboard/widgets/common/charts/ChartSkeleton';

export default function TestPerformancePage() {
  const [isClient, setIsClient] = useState(false);
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    setIsClient(true);
    
    // 收集 Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      setMetrics({
        // Navigation Timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        
        // Paint Timing
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      });
    }
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#181c2f] p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Performance Test Page</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c2f] p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Performance Test Page</h1>
      
      {/* Web Vitals Metrics */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Web Vitals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-sm">First Paint</p>
            <p className="text-white text-2xl font-bold">{metrics.firstPaint?.toFixed(2) || '0'} ms</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">First Contentful Paint</p>
            <p className="text-white text-2xl font-bold">{metrics.firstContentfulPaint?.toFixed(2) || '0'} ms</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">DOM Interactive</p>
            <p className="text-white text-2xl font-bold">{metrics.domInteractive?.toFixed(2) || '0'} ms</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Load Complete</p>
            <p className="text-white text-2xl font-bold">{metrics.loadComplete?.toFixed(2) || '0'} ms</p>
          </div>
        </div>
      </div>

      {/* Test Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart Skeleton Test */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Chart Skeleton Test</h3>
          <ChartSkeleton type="line" height="md" showHeader={true} />
        </div>

        {/* Progressive Loading Test */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Progressive Loading Test</h3>
          <div className="h-[300px]">
            <StockLevelHistoryChart 
              widget={{ id: 'test-widget', type: 'stockLevelHistory' } as any}
              isEditMode={false}
              useGraphQL={false}
            />
          </div>
        </div>
      </div>

      {/* Test Links */}
      <div className="mt-8 bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Test Navigation</h3>
        <div className="space-y-2">
          <Link href="/admin/injection" className="block text-blue-400 hover:underline">
            Test Admin Dashboard (Injection)
          </Link>
          <a href="/api/graphql" className="block text-blue-400 hover:underline">
            Test GraphQL Endpoint
          </a>
          <Link href="/access" className="block text-blue-400 hover:underline">
            Test Access Page
          </Link>
        </div>
      </div>

      {/* Environment Info */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}