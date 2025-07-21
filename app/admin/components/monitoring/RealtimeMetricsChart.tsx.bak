/**
 * 實時監控圖表組件
 * 顯示實時性能指標、趨勢分析等
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Download,
  Settings,
  Database,
  AlertTriangle,
} from 'lucide-react';

interface MetricDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
  [key: string]: unknown; // 添加索引簽名以支持Record<string, unknown>兼容性
}

interface RealtimeMetricsChartProps {
  type: 'performance' | 'database' | 'business' | 'alerts';
  title: string;
  data: MetricDataPoint[] | null;
  timeRange?: '5m' | '1h' | '24h' | '7d';
  chartType?: 'line' | 'area' | 'bar' | 'pie';
  showTrend?: boolean;
  compact?: boolean;
  onTimeRangeChange?: (range: string) => void;
  onChartTypeChange?: (type: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
}

// 預設顏色配置
const COLORS = {
  performance: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  database: ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
  business: ['#ec4899', '#14b8a6', '#f59e0b', '#6366f1'],
  alerts: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
};

/**
 * 實時監控圖表組件
 *
 * 特點：
 * - 支援多種圖表類型
 * - 實時數據更新
 * - 響應式設計
 * - 可配置時間範圍
 */
export default function RealtimeMetricsChart({
  type,
  title,
  data,
  timeRange = '1h',
  chartType = 'line',
  showTrend = true,
  compact = false,
  onTimeRangeChange,
  onChartTypeChange,
  onRefresh,
  onExport,
}: RealtimeMetricsChartProps) {
  // 處理數據
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item: Record<string, unknown>) => ({
      ...item,
      timestamp: new Date(item.timestamp as string | number | Date).toLocaleTimeString(),
      time: new Date(item.timestamp as string | number | Date).getTime(),
      value: Number(item.value || 0),
      label: String(item.label || ''),
    }));
  }, [data]);

  // 計算趨勢
  const trend = useMemo(() => {
    if (!processedData || processedData.length < 2) return null;

    const firstValue = Number(processedData[0].value || 0);
    const lastValue = Number(processedData[processedData.length - 1].value || 0);
    const change = lastValue - firstValue;
    const percentage = firstValue !== 0 ? (change / firstValue) * 100 : 0;

    return {
      change,
      percentage,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }, [processedData]);

  // 獲取圖表顏色
  const getChartColors = () => {
    return COLORS[type as keyof typeof COLORS] || COLORS.performance;
  };

  // 格式化工具提示
  const formatTooltip = (value: number, name: string) => {
    switch (type) {
      case 'performance':
        return [`${value}ms`, 'Response Time'];
      case 'database':
        return [`${value}%`, 'Hit Rate'];
      case 'business':
        return [`${value}`, 'Count'];
      case 'alerts':
        return [`${value}`, 'Alerts'];
      default:
        return [value, name];
    }
  };

  // 渲染圖表
  const renderChart = () => {
    if (!processedData || processedData.length === 0) {
      return (
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <BarChart3 className='mx-auto mb-4 h-12 w-12 text-gray-400' />
            <p className='text-sm text-gray-500'>No data available</p>
          </div>
        </div>
      );
    }

    const colors = getChartColors();
    const height = compact ? 200 : 300;

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width='100%' height={height}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='timestamp' />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Area
                type='monotone'
                dataKey='value'
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width='100%' height={height}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='timestamp' />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Bar dataKey='value' fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        // 為餅圖處理數據
        const pieData = processedData.slice(-5).map((item, index) => ({
          name: item.label || `Item ${index + 1}`,
          value: item.value,
          fill: colors[index % colors.length],
        }));

        return (
          <ResponsiveContainer width='100%' height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
      default:
        return (
          <ResponsiveContainer width='100%' height={height}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='timestamp' />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Line
                type='monotone'
                dataKey='value'
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  // 獲取趨勢圖標
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  // 獲取趨勢顏色
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';

    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'performance':
        return <Zap className='h-4 w-4' />;
      case 'database':
        return <Database className='h-4 w-4' />;
      case 'business':
        return <TrendingUp className='h-4 w-4' />;
      case 'alerts':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Activity className='h-4 w-4' />;
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {getTypeIcon()}
            <span>{title}</span>
          </div>
          <div className='flex items-center space-x-2'>
            {showTrend && trend && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className='text-sm'>
                  {trend.percentage > 0 ? '+' : ''}
                  {trend.percentage.toFixed(1)}%
                </span>
              </div>
            )}
            <Badge variant='outline'>{timeRange}</Badge>
          </div>
        </CardTitle>
        {!compact && (
          <CardDescription className='flex items-center justify-between'>
            <span>Real-time {type} metrics</span>
            <div className='flex items-center space-x-2'>
              {onTimeRangeChange && (
                <Select value={timeRange} onValueChange={onTimeRangeChange}>
                  <SelectTrigger className='w-20'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='5m'>5m</SelectItem>
                    <SelectItem value='1h'>1h</SelectItem>
                    <SelectItem value='24h'>24h</SelectItem>
                    <SelectItem value='7d'>7d</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {onChartTypeChange && (
                <Select value={chartType} onValueChange={onChartTypeChange}>
                  <SelectTrigger className='w-20'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='line'>
                      <LineChartIcon className='h-4 w-4' />
                    </SelectItem>
                    <SelectItem value='area'>
                      <BarChart3 className='h-4 w-4' />
                    </SelectItem>
                    <SelectItem value='bar'>
                      <BarChart3 className='h-4 w-4' />
                    </SelectItem>
                    <SelectItem value='pie'>
                      <PieChartIcon className='h-4 w-4' />
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              {onRefresh && (
                <Button variant='outline' size='sm' onClick={onRefresh}>
                  <RefreshCw className='h-4 w-4' />
                </Button>
              )}
              {onExport && (
                <Button variant='outline' size='sm' onClick={onExport}>
                  <Download className='h-4 w-4' />
                </Button>
              )}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {renderChart()}
        {processedData && processedData.length > 0 && (
          <div className='mt-4 flex items-center justify-between text-sm text-gray-500'>
            <span>
              Latest: {processedData[processedData.length - 1]?.value}
              {type === 'performance' && 'ms'}
              {type === 'database' && '%'}
            </span>
            <span>{processedData.length} data points</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
