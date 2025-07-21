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
  BudgetValidationResult,
} from '@/lib/performance/PerformanceMonitor';

export default function TestPerformancePage() {
  const [isClient, setIsClient] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [webVitalsMetrics, setWebVitalsMetrics] = useState<WebVitalsMetric[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetValidationResult[]>([]);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    setIsClient(true);

    // 初始化增強的性能監控系統
    initializePerformanceMonitoring();

    // 收集傳統 Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      setMetrics({
        // Navigation Timing
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,

        // Paint Timing
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
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
      <div className='min-h-screen bg-[#181c2f] p-8'>
        <h1 className='mb-4 text-3xl font-bold text-white'>Performance Test Page</h1>
        <p className='text-gray-400'>Loading...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#181c2f] p-8'>
      <h1 className='mb-4 text-3xl font-bold text-white'>Enhanced Performance Test Page</h1>

      {/* Performance Score */}
      <div className='mb-8 rounded-lg bg-slate-800 p-6'>
        <h2 className='mb-4 text-xl font-semibold text-white'>Performance Score</h2>
        <div className='flex items-center gap-4'>
          <div className='text-6xl font-bold text-white'>{performanceScore}</div>
          <div className='flex-1'>
            <div className='mb-2 h-4 rounded-full bg-slate-700'>
              <div
                className={`h-4 rounded-full ${
                  performanceScore >= 90
                    ? 'bg-green-500'
                    : performanceScore >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
            <p className='text-sm text-gray-400'>
              {performanceScore >= 90
                ? 'Excellent'
                : performanceScore >= 50
                  ? 'Needs Improvement'
                  : 'Poor'}
            </p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className='mb-8 rounded-lg bg-slate-800 p-6'>
        <h2 className='mb-4 text-xl font-semibold text-white'>Core Web Vitals</h2>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5'>
          {webVitalsMetrics.map(metric => (
            <div key={metric.name} className='text-center'>
              <p className='text-sm text-gray-400'>{metric.name}</p>
              <p
                className={`text-2xl font-bold ${
                  metric.rating === 'good'
                    ? 'text-green-400'
                    : metric.rating === 'needs-improvement'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)}
                {metric.name !== 'CLS' && <span className='text-sm'> ms</span>}
              </p>
              <p
                className={`text-xs ${
                  metric.rating === 'good'
                    ? 'text-green-400'
                    : metric.rating === 'needs-improvement'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {metric.rating.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Validation */}
      <div className='mb-8 rounded-lg bg-slate-800 p-6'>
        <h2 className='mb-4 text-xl font-semibold text-white'>Budget Validation</h2>
        <div className='space-y-4'>
          {budgetReport.map(report => (
            <div
              key={report.metric}
              className='flex items-center justify-between rounded-lg bg-slate-700 p-4'
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`h-4 w-4 rounded-full ${
                    report.passed ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <div>
                  <p className='font-semibold text-white'>{report.metric}</p>
                  <p className='text-sm text-gray-400'>
                    {report.value.toFixed(report.metric === 'CLS' ? 3 : 0)}
                    {report.metric !== 'CLS' && ' ms'} /
                    {report.budget.good.toFixed(report.metric === 'CLS' ? 3 : 0)}
                    {report.metric !== 'CLS' && ' ms'}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className={`font-semibold ${report.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {report.passed ? 'PASS' : 'FAIL'}
                </p>
                <p className='text-sm text-gray-400'>{report.percentage}% of budget</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traditional Web Vitals */}
      <div className='mb-8 rounded-lg bg-slate-800 p-6'>
        <h2 className='mb-4 text-xl font-semibold text-white'>Traditional Metrics</h2>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          <div>
            <p className='text-sm text-gray-400'>First Paint</p>
            <p className='text-2xl font-bold text-white'>
              {metrics.firstPaint?.toFixed(2) || '0'} ms
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-400'>First Contentful Paint</p>
            <p className='text-2xl font-bold text-white'>
              {metrics.firstContentfulPaint?.toFixed(2) || '0'} ms
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-400'>DOM Interactive</p>
            <p className='text-2xl font-bold text-white'>
              {metrics.domInteractive?.toFixed(2) || '0'} ms
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-400'>Load Complete</p>
            <p className='text-2xl font-bold text-white'>
              {metrics.loadComplete?.toFixed(2) || '0'} ms
            </p>
          </div>
        </div>
      </div>

      {/* Test Components */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Chart Skeleton Test */}
        <div className='rounded-lg bg-slate-800 p-6'>
          <h3 className='mb-4 text-lg font-semibold text-white'>Chart Skeleton Test</h3>
          <ChartSkeleton type='line' height='md' showHeader={true} />
        </div>

        {/* Progressive Loading Test */}
        <div className='rounded-lg bg-slate-800 p-6'>
          <h3 className='mb-4 text-lg font-semibold text-white'>Progressive Loading Test</h3>
          <div className='h-[300px]'>
            <StockLevelHistoryChart
              widget={{ id: 'test-widget', type: 'stockLevelHistory' } as any}
              isEditMode={false}
            />
          </div>
        </div>
      </div>

      {/* Test Links */}
      <div className='mt-8 rounded-lg bg-slate-800 p-6'>
        <h3 className='mb-4 text-lg font-semibold text-white'>Test Navigation</h3>
        <div className='space-y-2'>
          <Link href='/admin/injection' className='block text-blue-400 hover:underline'>
            Test Admin Dashboard (Injection)
          </Link>
          <Link href='/access' className='block text-blue-400 hover:underline'>
            Test Access Page
          </Link>
        </div>
      </div>

      {/* Environment Info */}
      <div className='mt-8 text-sm text-gray-500'>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}
