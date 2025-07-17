/**
 * Performance Dashboard Component
 *
 * 實時顯示系統性能指標
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { PerformanceMetric, PerformanceAlert } from '../PerformanceMonitor';
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export function PerformanceDashboard() {
  const { isMonitoring, metrics, alerts, report, startMonitoring, stopMonitoring } =
    usePerformanceMonitor({
      autoStart: true,
      reportInterval: 2000,
    });

  // 計算實時統計
  const realtimeStats = useMemo(() => {
    const apiMetrics = metrics.filter(m => m.category === 'api');
    const dbMetrics = metrics.filter(m => m.category === 'database');
    const renderMetrics = metrics.filter(m => m.category === 'render');

    const avgApiTime =
      apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
        : 0;

    const avgDbTime =
      dbMetrics.length > 0 ? dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length : 0;

    const avgRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
        : 0;

    const errorCount = metrics.filter(m => m.name.includes('error')).length;
    const totalRequests = apiMetrics.length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      avgApiTime,
      avgDbTime,
      avgRenderTime,
      errorRate,
      totalRequests,
    };
  }, [metrics]);

  // 獲取最新的內存使用
  const latestMemoryUsage = useMemo(() => {
    const memoryMetrics = metrics
      .filter(m => m.name === 'memory_usage')
      .sort((a, b) => b.timestamp - a.timestamp);

    return memoryMetrics[0]?.value || 0;
  }, [metrics]);

  // 分組警報
  const groupedAlerts = useMemo(() => {
    const critical = alerts.filter(a => a.type === 'critical');
    const warning = alerts.filter(a => a.type === 'warning');
    return { critical, warning };
  }, [alerts]);

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Activity className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Performance Monitor</h1>
          {isMonitoring && (
            <Badge variant='default' className='animate-pulse'>
              <span className='mr-2'>●</span> Live
            </Badge>
          )}
        </div>

        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className='rounded bg-primary px-4 py-2 text-white hover:bg-primary/90'
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      {/* Alerts */}
      {groupedAlerts.critical.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Critical Performance Issues</AlertTitle>
          <AlertDescription>
            <ul className='mt-2 list-disc pl-5'>
              {groupedAlerts.critical.map((alert, idx) => (
                <li key={idx}>{alert.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Metrics */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='API Response Time'
          value={realtimeStats.avgApiTime}
          unit='ms'
          trend={realtimeStats.avgApiTime > 1000 ? 'up' : 'down'}
          status={
            realtimeStats.avgApiTime > 3000
              ? 'critical'
              : realtimeStats.avgApiTime > 1000
                ? 'warning'
                : 'good'
          }
        />

        <MetricCard
          title='Database Query Time'
          value={realtimeStats.avgDbTime}
          unit='ms'
          trend={realtimeStats.avgDbTime > 500 ? 'up' : 'down'}
          status={
            realtimeStats.avgDbTime > 2000
              ? 'critical'
              : realtimeStats.avgDbTime > 500
                ? 'warning'
                : 'good'
          }
        />

        <MetricCard
          title='Render Time'
          value={realtimeStats.avgRenderTime}
          unit='ms'
          trend={realtimeStats.avgRenderTime > 100 ? 'up' : 'down'}
          status={
            realtimeStats.avgRenderTime > 500
              ? 'critical'
              : realtimeStats.avgRenderTime > 100
                ? 'warning'
                : 'good'
          }
        />

        <MetricCard
          title='Error Rate'
          value={realtimeStats.errorRate}
          unit='%'
          trend={realtimeStats.errorRate > 1 ? 'up' : 'down'}
          status={
            realtimeStats.errorRate > 5
              ? 'critical'
              : realtimeStats.errorRate > 1
                ? 'warning'
                : 'good'
          }
        />
      </div>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <div className='mb-2 flex justify-between text-sm'>
              <span>Memory Usage</span>
              <span>{latestMemoryUsage.toFixed(1)}%</span>
            </div>
            <Progress
              value={latestMemoryUsage}
              className={
                latestMemoryUsage > 95
                  ? 'bg-red-500'
                  : latestMemoryUsage > 80
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              }
            />
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Total Requests</p>
              <p className='text-2xl font-bold'>{realtimeStats.totalRequests}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Active Alerts</p>
              <p className='text-2xl font-bold'>{alerts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {metrics
              .slice(-10)
              .reverse()
              .map((metric, idx) => (
                <MetricRow key={idx} metric={metric} />
              ))}
            {metrics.length === 0 && (
              <p className='py-4 text-center text-muted-foreground'>
                No metrics recorded yet. Start monitoring to see data.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Avg Response Time</p>
                <p className='text-xl font-semibold'>
                  {report.summary.avgResponseTime.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>P95 Response Time</p>
                <p className='text-xl font-semibold'>
                  {report.summary.p95ResponseTime.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>P99 Response Time</p>
                <p className='text-xl font-semibold'>
                  {report.summary.p99ResponseTime.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Error Rate</p>
                <p className='text-xl font-semibold'>{report.summary.errorRate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 指標卡片組件
interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down';
  status?: 'good' | 'warning' | 'critical';
}

function MetricCard({ title, value, unit, trend, status = 'good' }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  };

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <div className='mt-1 flex items-baseline gap-1'>
              <span className={`text-2xl font-bold ${statusColors[status]}`}>
                {value.toFixed(1)}
              </span>
              <span className='text-sm text-muted-foreground'>{unit}</span>
            </div>
          </div>
          {trend && (
            <div className={trend === 'up' ? 'text-red-500' : 'text-green-500'}>
              {trend === 'up' ? (
                <TrendingUp className='h-4 w-4' />
              ) : (
                <TrendingDown className='h-4 w-4' />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 指標行組件
interface MetricRowProps {
  metric: PerformanceMetric;
}

function MetricRow({ metric }: MetricRowProps) {
  const categoryColors = {
    api: 'bg-blue-100 text-blue-800',
    database: 'bg-purple-100 text-purple-800',
    render: 'bg-green-100 text-green-800',
    network: 'bg-orange-100 text-orange-800',
    custom: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className='flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50'>
      <div className='flex items-center gap-3'>
        <Badge variant='secondary' className={`text-xs ${categoryColors[metric.category as keyof typeof categoryColors] || ''}`}>
          {metric.category}
        </Badge>
        <span className='text-sm'>{metric.name}</span>
      </div>
      <div className='flex items-center gap-4'>
        <span className='text-sm font-medium'>
          {metric.value.toFixed(1)} ms
        </span>
        <span className='text-xs text-muted-foreground'>
          {new Date(metric.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
