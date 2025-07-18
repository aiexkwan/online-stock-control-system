'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
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
  ResponsiveContainer,
} from 'recharts';
// Remove server-side imports that use Redis
// import { unifiedPreloadService } from '@/lib/preload/unified-preload-service';

interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  activeConnections: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
}

interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheSize: string;
  topPerformingQueries: Array<{ query: string; hitRate: number }>;
  underPerformingQueries: Array<{ query: string; hitRate: number }>;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory: string;
  responseTime: number;
  errorRate: number;
}

interface WarmupStats {
  activeWarmups: string[];
  completedToday: number;
  successRate: number;
  strategies: Array<{ name: string; lastRun: Date; success: boolean; duration: number }>;
}

interface PreloadStats {
  queueLength: number;
  activePreloads: number;
  successRate: number;
  avgDuration: number;
  tasksByType: {
    navigation: number;
    graphql: number;
    cache: number;
  };
}

interface PerformanceData {
  timestamp: string;
  responseTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
}

export default function GraphQLMonitorPage() {
  const [rateLimitStats, setRateLimitStats] = useState<RateLimitStats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [warmupStats, setWarmupStats] = useState<WarmupStats | null>(null);
  const [preloadStats, setPreloadStats] = useState<PreloadStats | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);

      // Fetch all monitoring data in parallel
      const [rateLimitRes, cacheRes, healthRes, warmupRes, performanceRes] =
        await Promise.allSettled([
          fetch('/api/graphql-monitoring?type=rate-limiting'),
          fetch('/api/graphql-monitoring?type=cache-stats'),
          fetch('/api/graphql-monitoring?type=health'),
          fetch('/api/graphql-monitoring?type=warmup-stats'),
          fetch('/api/graphql-monitoring?type=performance-history'),
        ]);

      if (rateLimitRes.status === 'fulfilled' && rateLimitRes.value.ok) {
        const data = await rateLimitRes.value.json();
        setRateLimitStats(data);
      }

      if (cacheRes.status === 'fulfilled' && cacheRes.value.ok) {
        const data = await cacheRes.value.json();
        setCacheStats(data);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const data = await healthRes.value.json();
        setSystemHealth(data);
      }

      if (warmupRes.status === 'fulfilled' && warmupRes.value.ok) {
        const data = await warmupRes.value.json();
        setWarmupStats(data);
      }

      if (performanceRes.status === 'fulfilled' && performanceRes.value.ok) {
        const data = await performanceRes.value.json();
        setPerformanceData(data.history || []);
      }

      // Get preload stats from API instead of directly from service
      // const preloadServiceStats = unifiedPreloadService.getStats();
      // setPreloadStats(preloadServiceStats);
      // TODO: Add API endpoint to get preload stats
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchMonitoringData();
  };

  // Trigger cache optimization
  const handleOptimizeCache = async () => {
    try {
      const response = await fetch('/api/graphql-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize-cache' }),
      });

      if (response.ok) {
        alert('Cache optimization triggered');
        fetchMonitoringData();
      }
    } catch (error) {
      console.error('Failed to optimize cache:', error);
    }
  };

  // Reset cache metrics
  const handleResetMetrics = async () => {
    try {
      const response = await fetch('/api/graphql-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-cache-metrics' }),
      });

      if (response.ok) {
        alert('Cache metrics reset');
        fetchMonitoringData();
      }
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    }
  };

  // Initialize and auto-refresh
  useEffect(() => {
    fetchMonitoringData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // System health status icon
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'warning':
        return <AlertCircle className='h-5 w-5 text-yellow-500' />;
      case 'critical':
        return <XCircle className='h-5 w-5 text-red-500' />;
      default:
        return <AlertCircle className='h-5 w-5 text-gray-500' />;
    }
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading && !rateLimitStats && !cacheStats) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='text-center'>
          <RefreshCw className='mx-auto mb-2 h-8 w-8 animate-spin' />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>GraphQL Monitoring Dashboard</h1>
          <p className='text-gray-600'>
            Real-time monitoring of GraphQL API performance and health
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-200 bg-green-50' : ''}
          >
            {autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF'}
          </Button>

          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant='outline' size='sm' onClick={handleOptimizeCache}>
            Optimize Cache
          </Button>

          <Button variant='outline' size='sm' onClick={handleResetMetrics}>
            Reset Metrics
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card className='mb-6'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                {getHealthIcon((systemHealth as { status: string }).status)}
                System Health Status
              </CardTitle>
              <Badge variant={(systemHealth as { status: string }).status === 'healthy' ? 'default' : 'destructive'}>
                {(systemHealth as { status: string }).status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div>
                <p className='text-sm text-gray-600'>Uptime</p>
                <p className='text-2xl font-bold'>{formatDuration(systemHealth.uptime)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Memory Usage</p>
                <p className='text-2xl font-bold'>{systemHealth.memory}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Avg Response Time</p>
                <p className='text-2xl font-bold'>{systemHealth.responseTime}ms</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Error Rate</p>
                <p className='text-2xl font-bold'>{systemHealth.errorRate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue='rate-limiting' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='rate-limiting'>Rate Limiting</TabsTrigger>
          <TabsTrigger value='cache'>Cache Performance</TabsTrigger>
          <TabsTrigger value='warmup'>Warmup Strategies</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='performance-test'>Performance Test</TabsTrigger>
        </TabsList>

        {/* Rate Limiting Tab */}
        <TabsContent value='rate-limiting'>
          {rateLimitStats ? (
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Request Statistics</CardTitle>
                  <CardDescription>Real-time rate limiting status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <div className='flex items-center justify-between'>
                        <span>Total Requests</span>
                        <span className='font-bold'>
                          {rateLimitStats.totalRequests.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className='flex items-center justify-between'>
                        <span>Blocked Requests</span>
                        <span className='font-bold text-red-600'>
                          {rateLimitStats.blockedRequests.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={
                          (rateLimitStats.blockedRequests / rateLimitStats.totalRequests) * 100
                        }
                        className='mt-2'
                      />
                    </div>

                    <div>
                      <div className='flex items-center justify-between'>
                        <span>Active Connections</span>
                        <span className='font-bold text-blue-600'>
                          {rateLimitStats.activeConnections}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Blocked IPs</CardTitle>
                  <CardDescription>IP addresses frequently hitting rate limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {rateLimitStats.topBlockedIPs?.length > 0 ? (
                      rateLimitStats.topBlockedIPs.map((item, index) => (
                        <div key={item.ip} className='flex items-center justify-between'>
                          <span className='font-mono text-sm'>{item.ip}</span>
                          <Badge variant='destructive'>{item.count} times</Badge>
                        </div>
                      ))
                    ) : (
                      <p className='py-4 text-center text-gray-500'>No blocked IPs</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className='flex h-32 items-center justify-center'>
                <p className='text-gray-500'>Unable to load rate limiting data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cache Performance Tab */}
        <TabsContent value='cache'>
          {cacheStats ? (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <Card>
                  <CardHeader>
                    <CardTitle>Cache Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <div className='mb-2 text-4xl font-bold'>
                        {cacheStats.hitRate.toFixed(1)}%
                      </div>
                      <Progress value={cacheStats.hitRate} className='mb-2' />
                      <p className='text-sm text-gray-600'>
                        {cacheStats.totalRequests.toLocaleString()} total requests
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cache Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <div className='mb-2 text-4xl font-bold'>{cacheStats.cacheSize}</div>
                      <p className='text-sm text-gray-600'>Current cache usage</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <TrendingUp className='mx-auto mb-2 h-8 w-8 text-green-500' />
                      <p className='text-sm text-gray-600'>Performance improving</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Queries</CardTitle>
                    <CardDescription>Queries with high cache hit rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {cacheStats.topPerformingQueries?.length > 0 ? (
                        cacheStats.topPerformingQueries.slice(0, 5).map((item, index) => (
                          <div key={index} className='flex items-center justify-between'>
                            <span className='truncate text-sm'>{item.query}</span>
                            <Badge variant='default'>{item.hitRate.toFixed(1)}%</Badge>
                          </div>
                        ))
                      ) : (
                        <p className='py-4 text-center text-gray-500'>No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Queries Needing Optimization</CardTitle>
                    <CardDescription>Queries with low cache hit rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {cacheStats.underPerformingQueries?.length > 0 ? (
                        cacheStats.underPerformingQueries.slice(0, 5).map((item, index) => (
                          <div key={index} className='flex items-center justify-between'>
                            <span className='truncate text-sm'>{item.query}</span>
                            <Badge variant='destructive'>{item.hitRate.toFixed(1)}%</Badge>
                          </div>
                        ))
                      ) : (
                        <p className='py-4 text-center text-gray-500'>
                          All queries performing well
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className='flex h-32 items-center justify-center'>
                <p className='text-gray-500'>Unable to load cache performance data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Warmup Tab */}
        <TabsContent value='warmup'>
          {warmupStats ? (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Warmups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <div className='mb-2 text-4xl font-bold'>
                        {warmupStats.activeWarmups.length}
                      </div>
                      <p className='text-sm text-gray-600'>Currently running warmup strategies</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completed Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <div className='mb-2 text-4xl font-bold'>{warmupStats.completedToday}</div>
                      <p className='text-sm text-gray-600'>Warmup completions today</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center'>
                      <div className='mb-2 text-4xl font-bold'>
                        {warmupStats.successRate.toFixed(1)}%
                      </div>
                      <Progress value={warmupStats.successRate} className='mb-2' />
                      <p className='text-sm text-gray-600'>Warmup strategy success rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Warmup Strategy Status</CardTitle>
                  <CardDescription>Execution status of each warmup strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {warmupStats.strategies?.length > 0 ? (
                      warmupStats.strategies.map((strategy, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between rounded-lg border p-3'
                        >
                          <div>
                            <h4 className='font-medium'>{strategy.name}</h4>
                            <p className='text-sm text-gray-600'>
                              Last run: {new Date(strategy.lastRun).toLocaleString()}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm'>{formatDuration(strategy.duration)}</span>
                            <Badge variant={strategy.success ? 'default' : 'destructive'}>
                              {strategy.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className='py-4 text-center text-gray-500'>No warmup strategy records</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className='flex h-32 items-center justify-center'>
                <p className='text-gray-500'>Unable to load warmup strategy data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics'>
          <div className='space-y-6'>
            {/* Preload Service Stats */}
            {preloadStats && (
              <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm'>Preload Queue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{preloadStats.queueLength}</div>
                    <p className='text-xs text-gray-600'>Tasks waiting</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm'>Active Preloads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{preloadStats.activePreloads}</div>
                    <p className='text-xs text-gray-600'>Currently running</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm'>Preload Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{preloadStats.successRate.toFixed(1)}%</div>
                    <p className='text-xs text-gray-600'>
                      Avg: {preloadStats.avgDuration.toFixed(0)}ms
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm'>Task Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-1 text-xs'>
                      <div>Nav: {preloadStats.tasksByType.navigation}</div>
                      <div>GraphQL: {preloadStats.tasksByType.graphql}</div>
                      <div>Cache: {preloadStats.tasksByType.cache}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Trend Charts */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend</CardTitle>
                  <CardDescription>Average response time over the past hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='timestamp'
                        tickFormatter={value =>
                          new Date(value).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={value => new Date(value).toLocaleTimeString('en-GB')}
                        formatter={(value: number) => `${value.toFixed(0)}ms`}
                      />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='responseTime'
                        stroke='#8884d8'
                        name='Response Time (ms)'
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Hit Rate & Error Rate</CardTitle>
                  <CardDescription>System efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='timestamp'
                        tickFormatter={value =>
                          new Date(value).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={value => new Date(value).toLocaleTimeString('en-GB')}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='cacheHitRate'
                        stackId='1'
                        stroke='#82ca9d'
                        fill='#82ca9d'
                        name='Cache Hit Rate (%)'
                      />
                      <Area
                        type='monotone'
                        dataKey='errorRate'
                        stackId='2'
                        stroke='#ff6b6b'
                        fill='#ff6b6b'
                        name='Error Rate (%)'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Throughput Analysis</CardTitle>
                  <CardDescription>Requests per second over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='timestamp'
                        tickFormatter={value =>
                          new Date(value).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={value => new Date(value).toLocaleTimeString('en-GB')}
                        formatter={(value: number) => `${value.toFixed(0)} RPS`}
                      />
                      <Legend />
                      <Bar dataKey='throughput' fill='#ffc658' name='Throughput (RPS)' />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Real-time Performance Metrics</CardTitle>
                  <CardDescription>Current system performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm'>Query Complexity Score</span>
                        <span className='text-sm font-bold'>324 / 1000</span>
                      </div>
                      <Progress value={32.4} className='h-2' />
                    </div>

                    <div>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm'>DataLoader Efficiency</span>
                        <span className='text-sm font-bold'>87%</span>
                      </div>
                      <Progress value={87} className='h-2' />
                    </div>

                    <div>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm'>Preload Accuracy</span>
                        <span className='text-sm font-bold'>78%</span>
                      </div>
                      <Progress value={78} className='h-2' />
                    </div>

                    <div>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm'>Cache Memory Usage</span>
                        <span className='text-sm font-bold'>1.2GB / 4GB</span>
                      </div>
                      <Progress value={30} className='h-2' />
                    </div>
                  </div>

                  <div className='mt-6'>
                    <h4 className='mb-2 text-sm font-semibold'>Performance Insights</h4>
                    <div className='space-y-2 text-xs'>
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='h-3 w-3 text-green-500' />
                        <span>Cache hit rate above target (80%+)</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <AlertCircle className='h-3 w-3 text-yellow-500' />
                        <span>Consider increasing preload threshold</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <TrendingUp className='h-3 w-3 text-blue-500' />
                        <span>Response time improved by 23% today</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Test Tab */}
        <TabsContent value='performance-test'>
          <div className='space-y-6'>
            {/* Test Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Test Control</CardTitle>
                <CardDescription>Run automated performance tests and benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div>
                      <label className='text-sm font-medium'>Test Scenario</label>
                      <select className='mt-1 w-full rounded border p-2'>
                        <option value='basic'>Basic Query Test</option>
                        <option value='load'>Load Test (100 users)</option>
                        <option value='stress'>Stress Test (500 users)</option>
                        <option value='spike'>Spike Test</option>
                      </select>
                    </div>

                    <div>
                      <label className='text-sm font-medium'>Duration (seconds)</label>
                      <input
                        type='number'
                        defaultValue='60'
                        className='mt-1 w-full rounded border p-2'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium'>Target RPS</label>
                      <input
                        type='number'
                        defaultValue='100'
                        className='mt-1 w-full rounded border p-2'
                      />
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      onClick={async () => {
                        const response = await fetch('/api/graphql-monitoring', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'run-performance-test',
                            params: { scenario: 'basic_inventory_query' },
                          }),
                        });
                        if (response.ok) {
                          alert('Performance test started');
                        }
                      }}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      Run Test
                    </Button>

                    <Button variant='outline'>Schedule Test</Button>
                    <Button variant='outline'>View History</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Latest Test Results</CardTitle>
                  <CardDescription>Results from the most recent performance test</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-gray-600'>Test Status</p>
                        <p className='flex items-center gap-2 text-lg font-semibold'>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          Passed
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>Completion Time</p>
                        <p className='text-lg font-semibold'>2m 34s</p>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-sm'>Response Time (P95)</span>
                        <span className='text-sm font-bold'>145ms</span>
                      </div>
                      <Progress value={72.5} className='h-2' />

                      <div className='flex justify-between'>
                        <span className='text-sm'>Throughput</span>
                        <span className='text-sm font-bold'>425 RPS</span>
                      </div>
                      <Progress value={85} className='h-2' />

                      <div className='flex justify-between'>
                        <span className='text-sm'>Error Rate</span>
                        <span className='text-sm font-bold'>0.04%</span>
                      </div>
                      <Progress value={4} className='h-2' />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Recommendations</CardTitle>
                  <CardDescription>AI-powered optimization suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-start gap-3'>
                      <AlertCircle className='mt-0.5 h-5 w-5 text-yellow-500' />
                      <div>
                        <p className='text-sm font-medium'>Optimize Complex Queries</p>
                        <p className='text-xs text-gray-600'>
                          3 queries exceed complexity threshold
                        </p>
                      </div>
                    </div>

                    <div className='flex items-start gap-3'>
                      <TrendingUp className='mt-0.5 h-5 w-5 text-blue-500' />
                      <div>
                        <p className='text-sm font-medium'>Enable Query Batching</p>
                        <p className='text-xs text-gray-600'>Could reduce response time by 40%</p>
                      </div>
                    </div>

                    <div className='flex items-start gap-3'>
                      <CheckCircle className='mt-0.5 h-5 w-5 text-green-500' />
                      <div>
                        <p className='text-sm font-medium'>Cache Performance Good</p>
                        <p className='text-xs text-gray-600'>Hit rate above target threshold</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* A/B Test Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>A/B Test Comparison</CardTitle>
                <CardDescription>
                  Compare performance before and after optimizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='text-center'>
                      <p className='text-sm text-gray-600'>Response Time Improvement</p>
                      <p className='text-3xl font-bold text-green-600'>-23%</p>
                      <p className='text-xs text-gray-500'>180ms → 145ms</p>
                    </div>

                    <div className='text-center'>
                      <p className='text-sm text-gray-600'>Throughput Increase</p>
                      <p className='text-3xl font-bold text-green-600'>+15%</p>
                      <p className='text-xs text-gray-500'>370 → 425 RPS</p>
                    </div>

                    <div className='text-center'>
                      <p className='text-sm text-gray-600'>Error Rate Reduction</p>
                      <p className='text-3xl font-bold text-green-600'>-60%</p>
                      <p className='text-xs text-gray-500'>0.1% → 0.04%</p>
                    </div>
                  </div>

                  <div className='flex justify-center'>
                    <Button variant='outline' size='sm'>
                      View Detailed Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
