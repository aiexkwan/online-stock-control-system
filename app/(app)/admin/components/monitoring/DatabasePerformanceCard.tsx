/**
 * 資料庫性能監控組件
 * 顯示資料庫連接狀態、查詢性能、緩存效率等
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Database,
  Activity,
  Zap,
  Clock,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Timer,
  Cpu,
  MemoryStick,
} from 'lucide-react';

interface DatabasePerformanceData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  connectionInfo: {
    activeConnections: number;
    maxConnections: number;
    connectionPool: {
      total: number;
      active: number;
      idle: number;
      waiting: number;
    };
  };
  queryPerformance: {
    averageQueryTime: number;
    slowQueries: number;
    totalQueries: number;
    queriesPerSecond: number;
  };
  cachePerformance: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    averageResponseTime: number;
    memoryUsage: number;
    recommendations: string[];
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: {
      bytesIn: number;
      bytesOut: number;
    };
  };
  performanceHistory?: Array<{
    timestamp: string;
    queryTime: number;
    cacheHitRate: number;
    connections: number;
  }>;
}

interface DatabasePerformanceCardProps {
  data: DatabasePerformanceData | null;
  compact?: boolean;
  onRefresh?: () => void;
}

/**
 * 資料庫性能監控卡片
 *
 * 特點：
 * - 實時監控資料庫性能
 * - 顯示連接池狀態
 * - 查詢性能分析
 * - 緩存效率監控
 */
export default function DatabasePerformanceCard({
  data,
  compact = false,
  onRefresh,
}: DatabasePerformanceCardProps) {
  if (!data) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Database className='h-5 w-5' />
            <span>Database Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 items-center justify-center'>
            <div className='text-center'>
              <RefreshCw className='mx-auto mb-2 h-8 w-8 text-gray-400' />
              <p className='text-sm text-gray-500'>Loading database performance...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'degraded':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'unhealthy':
        return <XCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const connectionUtilization =
    (data.connectionInfo.activeConnections / data.connectionInfo.maxConnections) * 100;
  const poolUtilization =
    (data.connectionInfo.connectionPool.active / data.connectionInfo.connectionPool.total) * 100;

  // Compact 模式 - 用於總覽頁面
  if (compact) {
    return (
      <Card className='w-full'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center justify-between text-base'>
            <div className='flex items-center space-x-2'>
              <Database className='h-4 w-4' />
              <span>Database</span>
            </div>
            {getStatusIcon((data as { status: string }).status)}
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-2'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Status</span>
              <Badge variant={getStatusVariant((data as { status: string }).status)}>
                {(data as { status: string }).status}
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Cache Hit Rate</span>
              <span className='text-sm font-medium'>
                {data.cachePerformance.hitRate.toFixed(1)}%
              </span>
            </div>
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Connections</span>
                <span className='text-sm font-medium'>{connectionUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={connectionUtilization} className='h-2' />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 完整模式 - 用於詳細頁面
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Database className='h-5 w-5' />
            <span>Database Performance</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Badge variant={getStatusVariant((data as { status: string }).status)}>
              {getStatusIcon((data as { status: string }).status)}
              <span className='ml-1 capitalize'>{(data as { status: string }).status}</span>
            </Badge>
            {onRefresh && (
              <Button variant='outline' size='sm' onClick={onRefresh}>
                <RefreshCw className='h-4 w-4' />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>Real-time database performance and connection monitoring</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 連接狀態 */}
        <div>
          <h3 className='mb-3 text-lg font-medium'>Connection Status</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Active Connections</span>
                <span className='text-sm'>
                  {data.connectionInfo.activeConnections} / {data.connectionInfo.maxConnections}
                </span>
              </div>
              <Progress value={connectionUtilization} className='h-2' />
              <p className='text-xs text-gray-500'>
                {connectionUtilization.toFixed(1)}% utilization
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Connection Pool</span>
                <span className='text-sm'>
                  {data.connectionInfo.connectionPool.active} /{' '}
                  {data.connectionInfo.connectionPool.total}
                </span>
              </div>
              <Progress value={poolUtilization} className='h-2' />
              <p className='text-xs text-gray-500'>{poolUtilization.toFixed(1)}% pool usage</p>
            </div>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-lg font-bold text-blue-600'>
                {data.connectionInfo.connectionPool.active}
              </p>
              <p className='text-xs text-gray-500'>Active</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-lg font-bold text-green-600'>
                {data.connectionInfo.connectionPool.idle}
              </p>
              <p className='text-xs text-gray-500'>Idle</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-lg font-bold text-orange-600'>
                {data.connectionInfo.connectionPool.waiting}
              </p>
              <p className='text-xs text-gray-500'>Waiting</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-lg font-bold text-gray-600'>
                {data.connectionInfo.connectionPool.total}
              </p>
              <p className='text-xs text-gray-500'>Total</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 查詢性能 */}
        <div>
          <h3 className='mb-3 text-lg font-medium'>Query Performance</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-lg border p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <Timer className='h-5 w-5 text-blue-500' />
                <span className='text-xs text-gray-500'>Average</span>
              </div>
              <p className='text-2xl font-bold'>{data.queryPerformance.averageQueryTime}ms</p>
              <p className='text-sm text-gray-500'>Query Time</p>
            </div>

            <div className='rounded-lg border p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <AlertTriangle className='h-5 w-5 text-yellow-500' />
                <span className='text-xs text-gray-500'>Count</span>
              </div>
              <p className='text-2xl font-bold'>
                {formatNumber(data.queryPerformance.slowQueries)}
              </p>
              <p className='text-sm text-gray-500'>Slow Queries</p>
            </div>

            <div className='rounded-lg border p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <BarChart3 className='h-5 w-5 text-green-500' />
                <span className='text-xs text-gray-500'>Total</span>
              </div>
              <p className='text-2xl font-bold'>
                {formatNumber(data.queryPerformance.totalQueries)}
              </p>
              <p className='text-sm text-gray-500'>Total Queries</p>
            </div>

            <div className='rounded-lg border p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <Zap className='h-5 w-5 text-purple-500' />
                <span className='text-xs text-gray-500'>Rate</span>
              </div>
              <p className='text-2xl font-bold'>{data.queryPerformance.queriesPerSecond}</p>
              <p className='text-sm text-gray-500'>Queries/sec</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 緩存性能 */}
        <div>
          <h3 className='mb-3 text-lg font-medium'>Cache Performance</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Cache Hit Rate</span>
                  <span className='text-sm'>{data.cachePerformance.hitRate.toFixed(1)}%</span>
                </div>
                <Progress value={data.cachePerformance.hitRate} className='h-2' />
                <p className='text-xs text-gray-500'>
                  {formatNumber(
                    data.cachePerformance.totalRequests -
                      (data.cachePerformance.totalRequests * data.cachePerformance.missRate) / 100
                  )}{' '}
                  hits / {formatNumber(data.cachePerformance.totalRequests)} requests
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Memory Usage</span>
                  <span className='text-sm'>{formatBytes(data.cachePerformance.memoryUsage)}</span>
                </div>
                <Progress
                  value={Math.min(
                    (data.cachePerformance.memoryUsage / (100 * 1024 * 1024)) * 100,
                    100
                  )}
                  className='h-2'
                />
                <p className='text-xs text-gray-500'>Cache memory utilization</p>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-lg border p-3 text-center'>
                  <p className='text-lg font-bold text-green-600'>
                    {data.cachePerformance.hitRate.toFixed(1)}%
                  </p>
                  <p className='text-xs text-gray-500'>Hit Rate</p>
                </div>
                <div className='rounded-lg border p-3 text-center'>
                  <p className='text-lg font-bold text-red-600'>
                    {data.cachePerformance.missRate.toFixed(1)}%
                  </p>
                  <p className='text-xs text-gray-500'>Miss Rate</p>
                </div>
              </div>

              <div className='rounded-lg border p-3 text-center'>
                <p className='text-lg font-bold text-blue-600'>
                  {data.cachePerformance.averageResponseTime}ms
                </p>
                <p className='text-xs text-gray-500'>Avg Response Time</p>
              </div>
            </div>
          </div>

          {/* 緩存優化建議 */}
          {data.cachePerformance.recommendations.length > 0 && (
            <div className='mt-4'>
              <h4 className='mb-2 text-sm font-medium'>Optimization Recommendations</h4>
              <ul className='space-y-1'>
                {data.cachePerformance.recommendations.map((recommendation, index) => (
                  <li key={index} className='flex items-start space-x-2 text-sm text-gray-600'>
                    <span className='mt-1 text-blue-500'>•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* 系統資源使用 */}
        <div>
          <h3 className='mb-3 text-lg font-medium'>System Resources</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Cpu className='h-4 w-4 text-blue-500' />
                  <span className='text-sm font-medium'>CPU Usage</span>
                </div>
                <span className='text-sm'>{data.systemMetrics.cpuUsage}%</span>
              </div>
              <Progress value={data.systemMetrics.cpuUsage} className='h-2' />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <MemoryStick className='h-4 w-4 text-green-500' />
                  <span className='text-sm font-medium'>Memory Usage</span>
                </div>
                <span className='text-sm'>{data.systemMetrics.memoryUsage}%</span>
              </div>
              <Progress value={data.systemMetrics.memoryUsage} className='h-2' />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <HardDrive className='h-4 w-4 text-purple-500' />
                  <span className='text-sm font-medium'>Disk Usage</span>
                </div>
                <span className='text-sm'>{data.systemMetrics.diskUsage}%</span>
              </div>
              <Progress value={data.systemMetrics.diskUsage} className='h-2' />
            </div>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-4'>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-lg font-bold text-green-600'>
                {formatBytes(data.systemMetrics.networkIO.bytesIn)}
              </p>
              <p className='text-xs text-gray-500'>Network In</p>
            </div>
            <div className='rounded-lg border p-3 text-center'>
              <p className='text-lg font-bold text-blue-600'>
                {formatBytes(data.systemMetrics.networkIO.bytesOut)}
              </p>
              <p className='text-xs text-gray-500'>Network Out</p>
            </div>
          </div>
        </div>

        {/* 最後更新時間 */}
        <div className='text-xs text-gray-500'>
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
