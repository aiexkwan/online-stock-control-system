/**
 * Performance Monitor Dashboard
 * Card 系統性能監控面板 - MVP 版本
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, ServerIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { cardPerformanceMonitor } from '@/lib/monitoring/performance-monitor';

interface PerformanceStats {
  totalCards: number;
  averageLoadTime: number;
  cacheHitRate: number;
  slowestCard: string;
  fastestCard: string;
  bundleSize: number;
  queryMetrics: {
    total: number;
    average: number;
    slowest: number;
  };
}

export const PerformanceMonitorDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 定期更新數據
  useEffect(() => {
    const updateStats = () => {
      if (isLive) {
        const report = cardPerformanceMonitor.generateReport();
        setStats(report);
      }
    };

    // 立即更新
    updateStats();

    // 每 2 秒更新一次
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isLive, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClearData = () => {
    cardPerformanceMonitor.clearOldMetrics(0); // 清除所有數據
    setRefreshKey(prev => prev + 1);
  };

  const getLoadTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHitColor = (rate: number) => {
    if (rate > 80) return 'text-green-600';
    if (rate > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!stats) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Card Performance Monitor</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
            <span className="text-sm text-gray-600">{isLive ? 'Live' : 'Paused'}</span>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
          >
            Refresh
          </button>
          <button
            onClick={handleClearData}
            className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* 主要指標卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 總載入時間 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
              <p className={`text-2xl font-bold ${getLoadTimeColor(stats.averageLoadTime)}`}>
                {stats.averageLoadTime.toFixed(1)}ms
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Target: &lt;200ms
          </div>
        </div>

        {/* 緩存命中率 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className={`text-2xl font-bold ${getCacheHitColor(stats.cacheHitRate)}`}>
                {stats.cacheHitRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Target: &gt;80%
          </div>
        </div>

        {/* 活躍 Cards */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCards}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Migration Progress
          </div>
        </div>

        {/* 查詢性能 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Query Time</p>
              <p className={`text-2xl font-bold ${getLoadTimeColor(stats.queryMetrics.average)}`}>
                {stats.queryMetrics.average.toFixed(1)}ms
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.queryMetrics.total} queries
          </div>
        </div>
      </div>

      {/* 詳細統計 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card 性能詳情 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Card Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fastest Card:</span>
              <span className="text-sm font-medium text-green-600">{stats.fastestCard}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Slowest Card:</span>
              <span className="text-sm font-medium text-red-600">{stats.slowestCard}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Bundle Size:</span>
              <span className="text-sm font-medium text-gray-900">
                {(stats.bundleSize / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>

        {/* GraphQL 查詢統計 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">GraphQL Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Queries:</span>
              <span className="text-sm font-medium text-gray-900">{stats.queryMetrics.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Time:</span>
              <span className={`text-sm font-medium ${getLoadTimeColor(stats.queryMetrics.average)}`}>
                {stats.queryMetrics.average.toFixed(1)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Slowest Query:</span>
              <span className={`text-sm font-medium ${getLoadTimeColor(stats.queryMetrics.slowest)}`}>
                {stats.queryMetrics.slowest.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 性能狀態指示器 */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Overall Health:</span>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                stats.averageLoadTime < 200 && stats.cacheHitRate > 80 
                  ? 'bg-green-500' 
                  : stats.averageLoadTime < 500 && stats.cacheHitRate > 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {stats.averageLoadTime < 200 && stats.cacheHitRate > 80 
                  ? 'Excellent' 
                  : stats.averageLoadTime < 500 && stats.cacheHitRate > 50
                  ? 'Good'
                  : 'Needs Attention'
                }
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitorDashboard;