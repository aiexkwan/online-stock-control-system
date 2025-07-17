/**
 * 業務指標顯示組件
 * 顯示關鍵業務指標、KPI、用戶活動等
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart,
  Clock,
  Activity,
  BarChart3,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface BusinessMetricsData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  kpis: {
    totalUsers: {
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    };
    activeUsers: {
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    };
    totalOrders: {
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    };
    totalProducts: {
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    };
    systemUptime: {
      value: number;
      target: number;
    };
    responseTime: {
      value: number;
      target: number;
    };
  };
  performance: {
    apiRequests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
    userActivity: {
      dailyActiveUsers: number;
      weeklyActiveUsers: number;
      monthlyActiveUsers: number;
    };
    systemLoad: {
      cpu: number;
      memory: number;
      disk: number;
    };
  };
  trends: {
    period: string;
    data: Array<{
      timestamp: string;
      users: number;
      orders: number;
      responseTime: number;
    }>;
  };
}

interface BusinessMetricsCardProps {
  data: BusinessMetricsData | null;
  compact?: boolean;
  onRefresh?: () => void;
}

/**
 * 業務指標卡片
 * 
 * 特點：
 * - 顯示關鍵業務 KPI
 * - 支援趨勢分析
 * - 響應式設計
 * - 支援 compact 模式
 */
export default function BusinessMetricsCard({ data, compact = false, onRefresh }: BusinessMetricsCardProps) {
  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Business Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading business metrics...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case 'decrease':
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (value: number, target: number) => {
    return ((value / target) * 100).toFixed(1);
  };

  const successRate = data.performance.apiRequests.total > 0 ? 
    (data.performance.apiRequests.successful / data.performance.apiRequests.total) * 100 : 0;

  // Compact 模式 - 用於總覽頁面
  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Business Metrics</span>
            </div>
            <Badge variant={data.status === 'healthy' ? 'default' : 'secondary'}>
              {data.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatNumber(data.kpis.activeUsers.value)}</p>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatNumber(data.kpis.totalOrders.value)}</p>
                <p className="text-xs text-gray-500">Total Orders</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Success Rate</span>
                <span className="text-sm font-medium">{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 完整模式 - 用於詳細頁面
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Business Metrics</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={data.status === 'healthy' ? 'default' : 'secondary'}>
              {data.status}
            </Badge>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Key business indicators and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 關鍵 KPI */}
        <div>
          <h3 className="text-lg font-medium mb-3">Key Performance Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div className={`flex items-center space-x-1 ${getChangeColor(data.kpis.activeUsers.changeType)}`}>
                  {getChangeIcon(data.kpis.activeUsers.changeType)}
                  <span className="text-sm">{Math.abs(data.kpis.activeUsers.change)}%</span>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.kpis.activeUsers.value)}</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                <div className={`flex items-center space-x-1 ${getChangeColor(data.kpis.totalOrders.changeType)}`}>
                  {getChangeIcon(data.kpis.totalOrders.changeType)}
                  <span className="text-sm">{Math.abs(data.kpis.totalOrders.change)}%</span>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.kpis.totalOrders.value)}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-5 w-5 text-purple-500" />
                <div className={`flex items-center space-x-1 ${getChangeColor(data.kpis.totalProducts.changeType)}`}>
                  {getChangeIcon(data.kpis.totalProducts.changeType)}
                  <span className="text-sm">{Math.abs(data.kpis.totalProducts.change)}%</span>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatNumber(data.kpis.totalProducts.value)}</p>
              <p className="text-sm text-gray-500">Total Products</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-gray-500">Target: {data.kpis.responseTime.target}ms</span>
              </div>
              <p className="text-2xl font-bold">{data.kpis.responseTime.value}ms</p>
              <p className="text-sm text-gray-500">Avg Response Time</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 系統性能指標 */}
        <div>
          <h3 className="text-lg font-medium mb-3">System Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm">{formatPercentage(data.kpis.systemUptime.value, data.kpis.systemUptime.target)}%</span>
              </div>
              <Progress value={parseFloat(formatPercentage(data.kpis.systemUptime.value, data.kpis.systemUptime.target))} className="h-2" />
              <p className="text-xs text-gray-500">Target: {data.kpis.systemUptime.target}% uptime</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Success Rate</span>
                <span className="text-sm">{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
              <p className="text-xs text-gray-500">
                {data.performance.apiRequests.successful} / {data.performance.apiRequests.total} requests
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Load</span>
                <span className="text-sm">{data.performance.systemLoad.cpu}%</span>
              </div>
              <Progress value={data.performance.systemLoad.cpu} className="h-2" />
              <p className="text-xs text-gray-500">CPU usage</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 用戶活動 */}
        <div>
          <h3 className="text-lg font-medium mb-3">User Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{formatNumber(data.performance.userActivity.dailyActiveUsers)}</p>
              <p className="text-sm text-gray-500">Daily Active Users</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{formatNumber(data.performance.userActivity.weeklyActiveUsers)}</p>
              <p className="text-sm text-gray-500">Weekly Active Users</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{formatNumber(data.performance.userActivity.monthlyActiveUsers)}</p>
              <p className="text-sm text-gray-500">Monthly Active Users</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* API 請求統計 */}
        <div>
          <h3 className="text-lg font-medium mb-3">API Request Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{formatNumber(data.performance.apiRequests.total)}</p>
              <p className="text-sm text-gray-500">Total Requests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatNumber(data.performance.apiRequests.successful)}</p>
              <p className="text-sm text-gray-500">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatNumber(data.performance.apiRequests.failed)}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{data.performance.apiRequests.averageResponseTime}ms</p>
              <p className="text-sm text-gray-500">Avg Response</p>
            </div>
          </div>
        </div>

        {/* 最後更新時間 */}
        <div className="text-xs text-gray-500">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}