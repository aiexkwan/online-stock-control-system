'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Code,
  TestTube,
  Settings,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface TechDebtMetrics {
  timestamp: string;
  source: string;
  metrics: {
    typescript: {
      errorCount: number;
      warningCount: number;
      details: Array<{
        file: string;
        line?: number;
        message: string;
        severity: 'error' | 'warning';
        category?: string;
      }>;
    };
    eslint: {
      errorCount: number;
      warningCount: number;
      fixableCount: number;
      details: Array<{
        file: string;
        line?: number;
        rule: string;
        message: string;
        severity: 'error' | 'warning';
        fixable: boolean;
      }>;
    };
    testing: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      coverage?: {
        lines: number;
        statements: number;
        functions: number;
        branches: number;
      };
    };
    build: {
      status: 'success' | 'failure';
      duration?: number;
      warnings?: number;
    };
  };
}

interface DashboardData {
  current: TechDebtMetrics | null;
  historical: TechDebtMetrics[];
  summary: {
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

// 顏色配置
const COLORS = {
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
  purple: '#8b5cf6',
};

export default function TechDebtMonitoringPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 載入數據
  const loadData = useCallback(
    async (includeRealtime = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: timeRange,
          ...(includeRealtime && { realtime: 'true' }),
        });

        const response = await fetch(`/api/monitoring/tech-debt?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setLastUpdated(new Date());
          if (includeRealtime) {
            toast.success('即時數據已更新');
          }
        } else {
          toast.error('載入數據失敗: ' + result.error);
        }
      } catch (error) {
        console.error('Load data error:', error);
        toast.error('載入數據時發生錯誤');
      } finally {
        setLoading(false);
      }
    },
    [timeRange]
  );

  // 頁面載入時獲取歷史數據
  useEffect(() => {
    loadData(false);
  }, [timeRange, loadData]);

  // 計算趨勢
  const calculateTrend = (historical: TechDebtMetrics[], metric: string) => {
    if (historical.length < 2) return { value: 0, direction: 'stable' };

    const recent = historical.slice(0, 3);
    const older = historical.slice(-3);

    const recentAvg =
      recent.reduce((sum, item) => {
        const value = getNestedValue(item.metrics, metric);
        return sum + (typeof value === 'number' ? value : 0);
      }, 0) / recent.length;

    const olderAvg =
      older.reduce((sum, item) => {
        const value = getNestedValue(item.metrics, metric);
        return sum + (typeof value === 'number' ? value : 0);
      }, 0) / older.length;

    const diff = recentAvg - olderAvg;

    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
    };
  };

  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && current !== null) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  };

  // 準備圖表數據
  const chartData =
    data?.historical
      ?.slice(0, 20)
      .reverse()
      .map(item => ({
        date: new Date(item.timestamp).toLocaleDateString(),
        typescript: item.metrics.typescript.errorCount,
        eslint: item.metrics.eslint.errorCount,
        tests: item.metrics.testing.failedTests,
      })) || [];

  const pieData = data?.current
    ? [
        {
          name: 'TypeScript 錯誤',
          value: data.current.metrics.typescript.errorCount,
          color: COLORS.error,
        },
        {
          name: 'ESLint 錯誤',
          value: data.current.metrics.eslint.errorCount,
          color: COLORS.warning,
        },
        {
          name: 'TypeScript 警告',
          value: data.current.metrics.typescript.warningCount,
          color: COLORS.info,
        },
        {
          name: 'ESLint 警告',
          value: data.current.metrics.eslint.warningCount,
          color: COLORS.purple,
        },
      ].filter(item => item.value > 0)
    : [];

  if (!data) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex h-64 items-center justify-center'>
          <RefreshCw className='mr-2 h-8 w-8 animate-spin' />
          <span>載入技術債務監控數據...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* 標題與控制 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>技術債務監控</h1>
          <p className='text-muted-foreground'>實時監控代碼品質、建置狀態和技術債務指標</p>
        </div>
        <div className='flex items-center gap-4'>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className='rounded border px-3 py-2'
          >
            <option value='1d'>今日</option>
            <option value='7d'>近7天</option>
            <option value='30d'>近30天</option>
            <option value='90d'>近90天</option>
          </select>
          <Button onClick={() => loadData(true)} disabled={loading} variant='outline'>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            立即更新
          </Button>
        </div>
      </div>

      {/* 最後更新時間 */}
      {lastUpdated && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Clock className='h-4 w-4' />
          最後更新: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* 概覽卡片 */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {/* TypeScript 錯誤 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>TypeScript 錯誤</CardTitle>
            <Code className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {data.current?.metrics.typescript.errorCount || 0}
            </div>
            {data.historical.length > 1 && (
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                {calculateTrend(data.historical, 'typescript.errorCount').direction === 'down' ? (
                  <TrendingDown className='h-3 w-3 text-green-600' />
                ) : (
                  <TrendingUp className='h-3 w-3 text-red-600' />
                )}
                <span>vs 前期</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ESLint 問題 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>ESLint 問題</CardTitle>
            <Bug className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {(data.current?.metrics.eslint.errorCount || 0) +
                (data.current?.metrics.eslint.warningCount || 0)}
            </div>
            <div className='text-xs text-muted-foreground'>
              {data.current?.metrics.eslint.fixableCount || 0} 可自動修復
            </div>
          </CardContent>
        </Card>

        {/* 測試狀態 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>測試狀態</CardTitle>
            <TestTube className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {data.current?.metrics.testing.passedTests || 0} /{' '}
              {data.current?.metrics.testing.totalTests || 0}
            </div>
            <div className='text-xs text-muted-foreground'>
              通過率:{' '}
              {data.current?.metrics.testing.totalTests
                ? Math.round(
                    (data.current.metrics.testing.passedTests /
                      data.current.metrics.testing.totalTests) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        {/* 建置狀態 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>建置狀態</CardTitle>
            <Settings className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              {data.current?.metrics.build.status === 'success' ? (
                <CheckCircle className='h-6 w-6 text-green-600' />
              ) : (
                <XCircle className='h-6 w-6 text-red-600' />
              )}
              <span
                className={`text-lg font-semibold ${
                  data.current?.metrics.build.status === 'success'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.current?.metrics.build.status === 'success' ? '成功' : '失敗'}
              </span>
            </div>
            {data.current?.metrics.build.duration && (
              <div className='text-xs text-muted-foreground'>
                耗時: {Math.round(data.current.metrics.build.duration / 1000)}秒
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 詳細數據 */}
      <Tabs defaultValue='trends' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='trends'>趨勢圖表</TabsTrigger>
          <TabsTrigger value='details'>詳細問題</TabsTrigger>
          <TabsTrigger value='distribution'>問題分佈</TabsTrigger>
        </TabsList>

        {/* 趨勢圖表 */}
        <TabsContent value='trends' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>技術債務趨勢</CardTitle>
              <CardDescription>過去 {timeRange} 的錯誤和警告趨勢</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type='monotone'
                    dataKey='typescript'
                    stroke={COLORS.error}
                    strokeWidth={2}
                    name='TypeScript 錯誤'
                  />
                  <Line
                    type='monotone'
                    dataKey='eslint'
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    name='ESLint 錯誤'
                  />
                  <Line
                    type='monotone'
                    dataKey='tests'
                    stroke={COLORS.info}
                    strokeWidth={2}
                    name='測試失敗'
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 詳細問題 */}
        <TabsContent value='details' className='space-y-6'>
          {data.current && (
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {/* TypeScript 問題 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Code className='h-5 w-5' />
                    TypeScript 問題
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {data.current.metrics.typescript.details.slice(0, 10).map((issue, index) => (
                    <div key={index} className='border-l-4 border-l-red-500 py-2 pl-4'>
                      <div className='flex items-center gap-2'>
                        <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                        <span className='text-sm font-medium'>{issue.file}</span>
                        {issue.line && (
                          <span className='text-xs text-muted-foreground'>:{issue.line}</span>
                        )}
                      </div>
                      <p className='mt-1 text-sm text-muted-foreground'>{issue.message}</p>
                    </div>
                  ))}
                  {data.current.metrics.typescript.details.length > 10 && (
                    <p className='text-center text-sm text-muted-foreground'>
                      還有 {data.current.metrics.typescript.details.length - 10} 個問題...
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ESLint 問題 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Bug className='h-5 w-5' />
                    ESLint 問題
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {data.current.metrics.eslint.details.slice(0, 10).map((issue, index) => (
                    <div key={index} className='border-l-4 border-l-orange-500 py-2 pl-4'>
                      <div className='flex items-center gap-2'>
                        <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                        <span className='text-sm font-medium'>{issue.rule}</span>
                        {issue.fixable && <Badge variant='outline'>可修復</Badge>}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {issue.file}:{issue.line}
                      </div>
                      <p className='mt-1 text-sm text-muted-foreground'>{issue.message}</p>
                    </div>
                  ))}
                  {data.current.metrics.eslint.details.length > 10 && (
                    <p className='text-center text-sm text-muted-foreground'>
                      還有 {data.current.metrics.eslint.details.length - 10} 個問題...
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 問題分佈 */}
        <TabsContent value='distribution' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* 問題類型分佈 */}
            <Card>
              <CardHeader>
                <CardTitle>問題類型分佈</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey='value'
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-4 space-y-2'>
                  {pieData.map((entry, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div
                        className='h-3 w-3 rounded-full'
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className='text-sm'>
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 修復建議 */}
            <Card>
              <CardHeader>
                <CardTitle>修復建議</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {data.current && (
                  <>
                    {data.current.metrics.typescript.errorCount > 0 && (
                      <div className='rounded-lg border bg-red-50 p-3'>
                        <h4 className='mb-2 font-medium text-red-800'>高優先級</h4>
                        <p className='text-sm text-red-700'>
                          修復 {data.current.metrics.typescript.errorCount} 個 TypeScript 錯誤
                        </p>
                      </div>
                    )}

                    {data.current.metrics.eslint.fixableCount > 0 && (
                      <div className='rounded-lg border bg-blue-50 p-3'>
                        <h4 className='mb-2 font-medium text-blue-800'>可自動修復</h4>
                        <p className='text-sm text-blue-700'>
                          運行 <code>npm run lint --fix</code> 修復{' '}
                          {data.current.metrics.eslint.fixableCount} 個問題
                        </p>
                      </div>
                    )}

                    {data.current.metrics.testing.failedTests > 0 && (
                      <div className='rounded-lg border bg-yellow-50 p-3'>
                        <h4 className='mb-2 font-medium text-yellow-800'>測試問題</h4>
                        <p className='text-sm text-yellow-700'>
                          修復 {data.current.metrics.testing.failedTests} 個失敗的測試
                        </p>
                      </div>
                    )}

                    {data.current.metrics.build.status === 'failure' && (
                      <div className='rounded-lg border bg-red-50 p-3'>
                        <h4 className='mb-2 font-medium text-red-800'>建置失敗</h4>
                        <p className='text-sm text-red-700'>檢查建置日誌並修復編譯錯誤</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
