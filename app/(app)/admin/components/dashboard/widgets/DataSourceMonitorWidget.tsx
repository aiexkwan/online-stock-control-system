/**
 * 數據源監控 Widget
 * 監控 REST 和 GraphQL API 的性能狀態和切換策略
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  GitBranch, 
  Settings, 
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface DataSourceMetrics {
  restSuccessRate: number;
  graphqlSuccessRate: number;
  restAvgResponseTime: number;
  graphqlAvgResponseTime: number;
  lastUpdated: string;
}

interface DataSourceRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  target: 'rest' | 'graphql';
}

interface ABTest {
  experimentId: string;
  name: string;
  enabled: boolean;
  trafficPercentage: number;
  targetDataSource: 'rest' | 'graphql';
}

interface ConfigStatus {
  metrics: DataSourceMetrics;
  rules: DataSourceRule[];
  abTests: ABTest[];
  defaultDataSource: 'rest' | 'graphql';
  globalFallbackEnabled: boolean;
  performanceMetrics: DataSourceMetrics;
}

export default function DataSourceMonitorWidget() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/data-source-config?action=status');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch status');
      }
      
      setStatus(result.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[DataSourceMonitorWidget] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const switchDataSource = async (targetSource: 'rest' | 'graphql', duration?: number) => {
    try {
      const response = await fetch('/api/admin/data-source-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch_data_source',
          targetSource,
          duration
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchStatus(); // 刷新狀態
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('[DataSourceMonitorWidget] Switch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch data source');
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // 每 30 秒自動刷新
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading data source status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const restHealth = status.performanceMetrics.restSuccessRate;
  const graphqlHealth = status.performanceMetrics.graphqlSuccessRate;

  return (
    <div className="space-y-4">
      {/* 標題和刷新按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Data Source Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 整體狀態 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Default Source</p>
                <p className="text-lg font-semibold capitalize">
                  {status.defaultDataSource}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fallback</p>
                <div className="flex items-center gap-2">
                  {status.globalFallbackEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {status.globalFallbackEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <GitBranch className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-lg font-semibold">
                  {status.rules.filter(r => r.enabled).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API 性能指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              REST API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <div className="flex items-center gap-2">
                <Badge variant={restHealth >= 0.9 ? "default" : restHealth >= 0.7 ? "secondary" : "destructive"}>
                  {(restHealth * 100).toFixed(1)}%
                </Badge>
                {restHealth >= 0.9 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Response Time</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {status.performanceMetrics.restAvgResponseTime.toFixed(0)}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-purple-500" />
              GraphQL API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <div className="flex items-center gap-2">
                <Badge variant={graphqlHealth >= 0.9 ? "default" : graphqlHealth >= 0.7 ? "secondary" : "destructive"}>
                  {(graphqlHealth * 100).toFixed(1)}%
                </Badge>
                {graphqlHealth >= 0.9 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Response Time</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {status.performanceMetrics.graphqlAvgResponseTime.toFixed(0)}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchDataSource('rest', 300000)} // 5 分鐘
              disabled={loading}
            >
              Switch to REST (5min)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchDataSource('graphql', 300000)} // 5 分鐘
              disabled={loading}
            >
              Switch to GraphQL (5min)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchDataSource('rest')}
              disabled={loading}
            >
              Set REST as Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchDataSource('graphql')}
              disabled={loading}
            >
              Set GraphQL as Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 活動規則 */}
      {status.rules.filter(r => r.enabled).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.rules
                .filter(r => r.enabled)
                .sort((a, b) => b.priority - a.priority)
                .slice(0, 5) // 只顯示前 5 個
                .map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Priority: {rule.priority}
                      </p>
                    </div>
                    <Badge variant={rule.target === 'graphql' ? 'default' : 'secondary'}>
                      {rule.target.toUpperCase()}
                    </Badge>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* A/B 測試 */}
      {status.abTests.filter(t => t.enabled).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.abTests
                .filter(t => t.enabled)
                .map((test, index) => (
                  <motion.div
                    key={test.experimentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{test.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Traffic: {test.trafficPercentage}%
                      </p>
                    </div>
                    <Badge variant={test.targetDataSource === 'graphql' ? 'default' : 'secondary'}>
                      {test.targetDataSource.toUpperCase()}
                    </Badge>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}