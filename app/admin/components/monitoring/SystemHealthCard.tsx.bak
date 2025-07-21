/**
 * 系統健康狀態卡片組件
 * 顯示系統運行狀態、服務健康度、資源使用情況
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Server,
  Activity,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: string;
  timestamp: string;
  environment: string;
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    authentication: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
    api: 'healthy' | 'degraded' | 'unhealthy';
  };
  systemMetrics: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
    nodeVersion: string;
    platform: string;
  };
  performanceHistory?: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    responseTime: number;
  }>;
}

interface SystemHealthCardProps {
  data: SystemHealthData | null;
  compact?: boolean;
  onRefresh?: () => void;
}

/**
 * 系統健康狀態卡片
 *
 * 特點：
 * - 實時顯示系統健康狀態
 * - 支援 compact 模式用於總覽
 * - 響應式設計，支援移動端
 * - 無障礙設計支援
 */
export default function SystemHealthCard({
  data,
  compact = false,
  onRefresh,
}: SystemHealthCardProps) {
  if (!data) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Server className='h-5 w-5' />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-32 items-center justify-center'>
            <div className='text-center'>
              <RefreshCw className='mx-auto mb-2 h-8 w-8 text-gray-400' />
              <p className='text-sm text-gray-500'>Loading system health data...</p>
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

  const formatUptime = (uptime: string) => {
    const seconds = parseInt(uptime.replace('s', ''));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const memoryUsagePercentage = data.systemMetrics
    ? (data.systemMetrics.memoryUsage.heapUsed / data.systemMetrics.memoryUsage.heapTotal) * 100
    : 0;

  // Compact 模式 - 用於總覽頁面
  if (compact) {
    return (
      <Card className='w-full'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center justify-between text-base'>
            <div className='flex items-center space-x-2'>
              <Server className='h-4 w-4' />
              <span>System Health</span>
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
              <span className='text-sm'>Uptime</span>
              <span className='text-sm font-medium'>{formatUptime(data.uptime)}</span>
            </div>
            {data.systemMetrics && (
              <div className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Memory</span>
                  <span className='text-sm font-medium'>{memoryUsagePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={memoryUsagePercentage} className='h-2' />
              </div>
            )}
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
            <Server className='h-5 w-5' />
            <span>System Health</span>
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
        <CardDescription>Real-time system health and performance metrics</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 基本信息 */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='flex items-center space-x-2'>
            <Clock className='h-4 w-4 text-gray-500' />
            <div>
              <p className='text-sm font-medium'>Uptime</p>
              <p className='text-sm text-gray-600'>{formatUptime(data.uptime)}</p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Activity className='h-4 w-4 text-gray-500' />
            <div>
              <p className='text-sm font-medium'>Version</p>
              <p className='text-sm text-gray-600'>{data.version}</p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Wifi className='h-4 w-4 text-gray-500' />
            <div>
              <p className='text-sm font-medium'>Environment</p>
              <p className='text-sm text-gray-600'>{data.environment}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 服務狀態 */}
        <div>
          <h3 className='mb-3 text-lg font-medium'>Service Status</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            {Object.entries(data.services).map(([service, status]) => (
              <div
                key={service}
                className='flex items-center justify-between rounded-lg border p-3'
              >
                <div className='flex items-center space-x-2'>
                  {getStatusIcon(status)}
                  <span className='text-sm font-medium capitalize'>{service}</span>
                </div>
                <Badge variant={getStatusVariant(status)}>{status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 系統指標 */}
        {data.systemMetrics && (
          <>
            <Separator />
            <div>
              <h3 className='mb-3 text-lg font-medium'>System Metrics</h3>
              <div className='space-y-4'>
                {/* 記憶體使用 */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <HardDrive className='h-4 w-4 text-gray-500' />
                      <span className='text-sm font-medium'>Memory Usage</span>
                    </div>
                    <span className='text-sm font-medium'>
                      {formatBytes(data.systemMetrics.memoryUsage.heapUsed)} /{' '}
                      {formatBytes(data.systemMetrics.memoryUsage.heapTotal)}
                    </span>
                  </div>
                  <Progress value={memoryUsagePercentage} className='h-2' />
                  <p className='text-xs text-gray-500'>{memoryUsagePercentage.toFixed(1)}% used</p>
                </div>

                {/* CPU 使用 */}
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Cpu className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium'>CPU Usage</span>
                  </div>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='text-gray-600'>
                        User: {(data.systemMetrics.cpuUsage.user / 1000).toFixed(1)}ms
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-600'>
                        System: {(data.systemMetrics.cpuUsage.system / 1000).toFixed(1)}ms
                      </p>
                    </div>
                  </div>
                </div>

                {/* 平台信息 */}
                <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
                  <div>
                    <p className='font-medium'>Node Version</p>
                    <p className='text-gray-600'>{data.systemMetrics.nodeVersion}</p>
                  </div>
                  <div>
                    <p className='font-medium'>Platform</p>
                    <p className='text-gray-600'>{data.systemMetrics.platform}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 最後更新時間 */}
        <div className='text-xs text-gray-500'>
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
