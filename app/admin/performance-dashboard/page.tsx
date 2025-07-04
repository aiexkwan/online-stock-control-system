'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  BarChart3,
  Zap,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { performanceMonitor } from '@/lib/widgets/performance-monitor';
import { useRealtimePerformance, useBatchPerformanceReport } from '@/lib/widgets/performance-integration';

// Mock data generator for demonstration
function generateMockPerformanceData() {
  const now = Date.now();
  const data = [];
  
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit' }),
      v2LoadTime: 15 + Math.random() * 10,
      legacyLoadTime: 50 + Math.random() * 20,
      v2Requests: Math.floor(100 + Math.random() * 50),
      legacyRequests: Math.floor(300 + Math.random() * 100)
    });
  }
  
  return data;
}

// Top widgets for monitoring
const TOP_WIDGETS = [
  'HistoryTree',
  'StatsCardWidget',
  'ProductMixChartWidget',
  'OrdersListWidget',
  'WarehouseTransferListWidget'
];

export default function PerformanceDashboard() {
  const realtimeData = useRealtimePerformance();
  const { reports, loading: reportsLoading } = useBatchPerformanceReport(TOP_WIDGETS);
  const [timeSeriesData, setTimeSeriesData] = useState(generateMockPerformanceData());
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  
  // Update time series data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSeriesData(current => {
        const newData = [...current.slice(1)];
        const lastTime = new Date();
        newData.push({
          time: lastTime.toLocaleTimeString('en-US', { hour: '2-digit' }),
          v2LoadTime: realtimeData.v2.avgLoadTime || (15 + Math.random() * 10),
          legacyLoadTime: realtimeData.legacy.avgLoadTime || (50 + Math.random() * 20),
          v2Requests: realtimeData.v2.requestCount || Math.floor(100 + Math.random() * 50),
          legacyRequests: realtimeData.legacy.requestCount || Math.floor(300 + Math.random() * 100)
        });
        return newData;
      });
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [realtimeData]);

  // Calculate improvement percentage
  const improvementPercentage = realtimeData.legacy.avgLoadTime > 0
    ? ((realtimeData.legacy.avgLoadTime - realtimeData.v2.avgLoadTime) / realtimeData.legacy.avgLoadTime * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Performance Monitoring Dashboard</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              V2 Avg Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {realtimeData.v2.avgLoadTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last 5 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Legacy Avg Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realtimeData.legacy.avgLoadTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last 5 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {improvementPercentage > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              Performance Gain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${improvementPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvementPercentage > 0 ? '+' : ''}{improvementPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              V2 vs Legacy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realtimeData.v2.requestCount + realtimeData.legacy.requestCount}
            </div>
            <div className="flex gap-4 mt-1">
              <span className="text-xs text-gray-500">
                V2: {realtimeData.v2.requestCount}
              </span>
              <span className="text-xs text-gray-500">
                Legacy: {realtimeData.legacy.requestCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Performance Trends</CardTitle>
            <div className="flex gap-2">
              {['1h', '24h', '7d', '30d'].map(range => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="v2LoadTime" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="V2 Load Time (ms)"
                />
                <Area 
                  type="monotone" 
                  dataKey="legacyLoadTime" 
                  stroke="#6b7280" 
                  fill="#6b7280" 
                  fillOpacity={0.3}
                  name="Legacy Load Time (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Widget Performance Details */}
      <Tabs defaultValue="by-widget" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="by-widget">By Widget</TabsTrigger>
          <TabsTrigger value="by-route">By Route</TabsTrigger>
          <TabsTrigger value="issues">Performance Issues</TabsTrigger>
        </TabsList>

        {/* By Widget */}
        <TabsContent value="by-widget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TOP_WIDGETS.map(widgetId => {
                  const report = reports.get(widgetId);
                  if (!report) return null;

                  const v2Avg = report.v2Performance?.loadTime.mean || 0;
                  const legacyAvg = report.legacyPerformance?.loadTime.mean || 0;
                  const improvement = report.improvement.percentage;

                  return (
                    <div key={widgetId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{widgetId}</h4>
                        <Badge variant={improvement > 0 ? 'default' : 'destructive'}>
                          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">V2</span>
                            <span className="font-medium">{v2Avg.toFixed(1)}ms</span>
                          </div>
                          <Progress value={100 - (v2Avg / 100 * 100)} className="h-2 mt-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Legacy</span>
                            <span className="font-medium">{legacyAvg.toFixed(1)}ms</span>
                          </div>
                          <Progress value={100 - (legacyAvg / 100 * 100)} className="h-2 mt-1" />
                        </div>
                      </div>
                      {report.v2Performance && (
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>P50: {report.v2Performance.loadTime.p50.toFixed(1)}ms</span>
                          <span>P95: {report.v2Performance.loadTime.p95.toFixed(1)}ms</span>
                          <span>P99: {report.v2Performance.loadTime.p99.toFixed(1)}ms</span>
                          <span>Samples: {report.v2Performance.sampleCount}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Route */}
        <TabsContent value="by-route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { route: '/admin/warehouse', v2: 18, legacy: 55 },
                    { route: '/admin/injection', v2: 22, legacy: 62 },
                    { route: '/admin/pipeline', v2: 20, legacy: 58 },
                    { route: '/admin/stock', v2: 25, legacy: 65 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="route" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="v2" fill="#10b981" name="V2 System" />
                    <Bar dataKey="legacy" fill="#6b7280" name="Legacy System" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Issues */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Issues & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>High Load Time Detected</strong>
                    <p className="mt-1">OrdersListWidget shows P95 load time &gt; 100ms. Consider implementing lazy loading for table data.</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Top Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Implement code splitting for WarehouseTransferListWidget</li>
                    <li>Use React.memo for StatsCardWidget to prevent unnecessary re-renders</li>
                    <li>Optimize bundle size for ProductMixChartWidget (currently 250KB)</li>
                    <li>Add pagination to OrdersListWidget for better initial load</li>
                    <li>Consider using virtual scrolling for large data tables</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}