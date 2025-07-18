'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StockLevelHistoryChart } from '@/app/admin/components/dashboard/widgets/StockLevelHistoryChart';
import { ChartSkeleton } from '@/app/admin/components/dashboard/widgets/common/charts/ChartSkeleton';
import { 
  initializePerformanceMonitoring, 
  webVitalsCollector, 
  getBudgetManager,
  WebVitalsMetric,
  BudgetValidationResult 
} from '@/lib/performance/PerformanceMonitor';

export default function TestPerformancePage() {
  const [isClient, setIsClient] = useState(false);
  const [metrics, setMetrics] = useState<any>({});
  const [webVitalsMetrics, setWebVitalsMetrics] = useState<WebVitalsMetric[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetValidationResult[]>([]);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    setIsClient(true);
    
    // 初始化增強的性能監控系統
    initializePerformanceMonitoring();
    
    // 收集傳統 Web Vitals
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

    // 定期更新 Web Vitals 數據
    const interval = setInterval(() => {
      const vitalsMetrics = webVitalsCollector.getMetrics();
      const budgetManager = getBudgetManager();
      const budgetValidation = budgetManager.validateCurrentMetrics();
      const score = webVitalsCollector.getPerformanceScore();
      
      setWebVitalsMetrics(vitalsMetrics);
      setBudgetReport(budgetValidation);
      setPerformanceScore(score);
    }, 2000);

    return () => clearInterval(interval);
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
      <h1 className="text-3xl font-bold text-white mb-4">Enhanced Performance Test Page</h1>
      
      {/* Performance Score */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Performance Score</h2>
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold text-white">
            {performanceScore}
          </div>
          <div className="flex-1">
            <div className="bg-slate-700 rounded-full h-4 mb-2">
              <div 
                className={`h-4 rounded-full ${
                  performanceScore >= 90 ? 'bg-green-500' : 
                  performanceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm">
              {performanceScore >= 90 ? 'Excellent' : 
               performanceScore >= 50 ? 'Needs Improvement' : 'Poor'}
            </p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {webVitalsMetrics.map((metric) => (
            <div key={metric.name} className="text-center">
              <p className="text-gray-400 text-sm">{metric.name}</p>
              <p className={`text-2xl font-bold ${
                metric.rating === 'good' ? 'text-green-400' :
                metric.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)}
                {metric.name !== 'CLS' && <span className="text-sm"> ms</span>}
              </p>
              <p className={`text-xs ${
                metric.rating === 'good' ? 'text-green-400' :
                metric.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metric.rating.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Validation */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Budget Validation</h2>
        <div className="space-y-4">
          {budgetReport.map((report) => (
            <div key={report.metric} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  report.passed ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-white font-semibold">{report.metric}</p>
                  <p className="text-gray-400 text-sm">
                    {report.value.toFixed(report.metric === 'CLS' ? 3 : 0)}
                    {report.metric !== 'CLS' && ' ms'} / 
                    {report.budget.good.toFixed(report.metric === 'CLS' ? 3 : 0)}
                    {report.metric !== 'CLS' && ' ms'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  report.passed ? 'text-green-400' : 'text-red-400'
                }`}>
                  {report.passed ? 'PASS' : 'FAIL'}
                </p>
                <p className="text-gray-400 text-sm">
                  {report.percentage}% of budget
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traditional Web Vitals */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Traditional Metrics</h2>
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