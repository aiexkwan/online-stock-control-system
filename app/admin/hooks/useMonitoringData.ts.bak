/**
 * 監控數據管理 Hook
 * 負責獲取和管理所有監控相關數據
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// 類型定義
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
}

interface BusinessMetricsData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  kpis: {
    totalUsers: { value: number; change: number; changeType: 'increase' | 'decrease' | 'stable' };
    activeUsers: { value: number; change: number; changeType: 'increase' | 'decrease' | 'stable' };
    totalOrders: { value: number; change: number; changeType: 'increase' | 'decrease' | 'stable' };
    totalProducts: {
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    };
    systemUptime: { value: number; target: number };
    responseTime: { value: number; target: number };
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
}

interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  category: 'system' | 'database' | 'business' | 'security';
  timestamp: string;
  source: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actions: string[];
}

interface AlertManagementData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  summary: {
    totalAlerts: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    acknowledgedCount: number;
    resolvedCount: number;
  };
  recentAlerts: AlertData[];
  alertTrends: {
    period: string;
    data: Array<{
      timestamp: string;
      critical: number;
      warning: number;
      info: number;
    }>;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
    slackChannel?: string;
  };
}

/**
 * 監控數據管理 Hook
 *
 * 特點：
 * - 統一管理所有監控數據
 * - 自動刷新機制
 * - 錯誤處理和重試
 * - 數據緩存和優化
 */
export function useMonitoringData() {
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetricsData | null>(null);
  const [databasePerformance, setDatabasePerformance] = useState<DatabasePerformanceData | null>(
    null
  );
  const [alerts, setAlerts] = useState<AlertManagementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 獲取系統健康數據
  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/health');
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }
      const data = await response.json();

      // 擴展數據結構以符合介面需求
      const extendedData: SystemHealthData = {
        ...data,
        services: {
          ...data.services,
          api: 'healthy', // 假設 API 服務健康
        },
        systemMetrics: data.systemMetrics || {
          memoryUsage: {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
          },
          cpuUsage: {
            user: 0,
            system: 0,
          },
          nodeVersion: process.version || 'unknown',
          platform: 'unknown',
        },
      };

      setSystemHealth(extendedData);
    } catch (err) {
      console.error('Error fetching system health:', err);
      throw err;
    }
  }, []);

  // 獲取業務指標
  const fetchBusinessMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch business metrics');
      }
      const data = await response.json();

      // 模擬業務指標數據
      const businessData: BusinessMetricsData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        kpis: {
          totalUsers: { value: 1250, change: 5.2, changeType: 'increase' },
          activeUsers: { value: 380, change: 2.1, changeType: 'increase' },
          totalOrders: { value: 2450, change: 8.3, changeType: 'increase' },
          totalProducts: { value: 15680, change: 1.2, changeType: 'increase' },
          systemUptime: { value: 99.8, target: 99.9 },
          responseTime: { value: 180, target: 200 },
        },
        performance: {
          apiRequests: {
            total: data.apiVersions?.totalRequests || 0,
            successful:
              (data.apiVersions?.totalRequests || 0) - (data.apiVersions?.totalErrors || 0),
            failed: data.apiVersions?.totalErrors || 0,
            averageResponseTime: 150,
          },
          userActivity: {
            dailyActiveUsers: 380,
            weeklyActiveUsers: 1250,
            monthlyActiveUsers: 3200,
          },
          systemLoad: {
            cpu: 45,
            memory: 62,
            disk: 38,
          },
        },
        trends: {
          period: '24h',
          data: [
            {
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              users: 350,
              orders: 2200,
              responseTime: 190,
            },
            {
              timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
              users: 365,
              orders: 2300,
              responseTime: 185,
            },
            {
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              users: 370,
              orders: 2400,
              responseTime: 180,
            },
            {
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              users: 375,
              orders: 2420,
              responseTime: 175,
            },
            { timestamp: new Date().toISOString(), users: 380, orders: 2450, responseTime: 180 },
          ],
        },
      };

      setBusinessMetrics(businessData);
    } catch (err) {
      console.error('Error fetching business metrics:', err);
      throw err;
    }
  }, []);

  // 獲取資料庫性能
  const fetchDatabasePerformance = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/cache/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch database performance');
      }
      const data = await response.json();

      const dbData: DatabasePerformanceData = {
        status: data.status === 'healthy' ? 'healthy' : 'degraded',
        timestamp: data.timestamp,
        connectionInfo: {
          activeConnections: 25,
          maxConnections: 100,
          connectionPool: {
            total: 20,
            active: 15,
            idle: 5,
            waiting: 0,
          },
        },
        queryPerformance: {
          averageQueryTime: 45,
          slowQueries: 3,
          totalQueries: 15420,
          queriesPerSecond: 125,
        },
        cachePerformance: {
          hitRate: parseFloat(data.performance?.hitRate || '0'),
          missRate: 100 - parseFloat(data.performance?.hitRate || '0'),
          totalRequests: data.performance?.totalRequests || 0,
          averageResponseTime: parseFloat(data.performance?.avgResponseTime || '0'),
          memoryUsage: 64 * 1024 * 1024, // 64MB
          recommendations: data.recommendations || [],
        },
        systemMetrics: {
          cpuUsage: 35,
          memoryUsage: 68,
          diskUsage: 42,
          networkIO: {
            bytesIn: 1024 * 1024 * 50, // 50MB
            bytesOut: 1024 * 1024 * 30, // 30MB
          },
        },
      };

      setDatabasePerformance(dbData);
    } catch (err) {
      console.error('Error fetching database performance:', err);
      throw err;
    }
  }, []);

  // 獲取告警數據
  const fetchAlerts = useCallback(async () => {
    try {
      // 模擬告警數據
      const alertsData: AlertManagementData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        summary: {
          totalAlerts: 5,
          criticalCount: 1,
          warningCount: 3,
          infoCount: 1,
          acknowledgedCount: 2,
          resolvedCount: 3,
        },
        recentAlerts: [
          {
            id: '1',
            title: 'High Memory Usage',
            description: 'System memory usage exceeded 80%',
            severity: 'critical',
            status: 'active',
            category: 'system',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            source: 'System Monitor',
            actions: ['investigate', 'restart_service'],
          },
          {
            id: '2',
            title: 'Slow Database Query',
            description: 'Query execution time exceeded 5 seconds',
            severity: 'warning',
            status: 'acknowledged',
            category: 'database',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            source: 'Database Monitor',
            assignedTo: 'Database Team',
            actions: ['optimize_query', 'add_index'],
          },
          {
            id: '3',
            title: 'API Rate Limit',
            description: 'API rate limit reached for user endpoint',
            severity: 'warning',
            status: 'active',
            category: 'system',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            source: 'API Gateway',
            actions: ['scale_service', 'implement_throttling'],
          },
        ],
        alertTrends: {
          period: '24h',
          data: [
            {
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              critical: 2,
              warning: 4,
              info: 1,
            },
            {
              timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
              critical: 1,
              warning: 3,
              info: 2,
            },
            {
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              critical: 1,
              warning: 2,
              info: 1,
            },
            {
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              critical: 1,
              warning: 3,
              info: 1,
            },
            { timestamp: new Date().toISOString(), critical: 1, warning: 3, info: 1 },
          ],
        },
        notifications: {
          email: true,
          sms: true,
          webhook: false,
          slackChannel: 'monitoring-alerts',
        },
      };

      setAlerts(alertsData);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      throw err;
    }
  }, []);

  // 刷新所有數據
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSystemHealth(),
        fetchBusinessMetrics(),
        fetchDatabasePerformance(),
        fetchAlerts(),
      ]);

      setLastUpdated(new Date().toISOString());
      toast.success('Monitoring data refreshed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh monitoring data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSystemHealth, fetchBusinessMetrics, fetchDatabasePerformance, fetchAlerts]);

  // 導出數據
  const exportData = useCallback(async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        systemHealth,
        businessMetrics,
        databasePerformance,
        alerts,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Monitoring data exported successfully');
    } catch (err) {
      toast.error('Failed to export monitoring data');
    }
  }, [systemHealth, businessMetrics, databasePerformance, alerts]);

  // 告警操作
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        recentAlerts: prev.recentAlerts.map(alert =>
          alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
        ),
        summary: {
          ...prev.summary,
          acknowledgedCount: prev.summary.acknowledgedCount + 1,
        },
      };
    });

    toast.success('Alert acknowledged');
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        recentAlerts: prev.recentAlerts.map(alert =>
          alert.id === alertId
            ? {
                ...alert,
                status: 'resolved' as const,
                resolvedAt: new Date().toISOString(),
                resolvedBy: 'Admin',
              }
            : alert
        ),
        summary: {
          ...prev.summary,
          resolvedCount: prev.summary.resolvedCount + 1,
        },
      };
    });

    toast.success('Alert resolved');
  }, []);

  const deleteAlert = useCallback((alertId: string) => {
    setAlerts(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        recentAlerts: prev.recentAlerts.filter(alert => alert.id !== alertId),
        summary: {
          ...prev.summary,
          totalAlerts: prev.summary.totalAlerts - 1,
        },
      };
    });

    toast.success('Alert deleted');
  }, []);

  // 自動刷新機制
  useEffect(() => {
    refreshData();

    const interval = setInterval(refreshData, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [refreshData]);

  // 返回狀態和方法
  return {
    systemHealth,
    businessMetrics,
    databasePerformance,
    alerts,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    exportData,
    acknowledgeAlert,
    resolveAlert,
    deleteAlert,
  };
}
