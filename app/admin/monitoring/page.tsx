/**
 * 系統監控儀表板主頁面
 * 支援多角色需求：Frontend (UX)、Backend (可靠性)、DevOps (可觀察性)、Architecture (可維護性)
 */

'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Server, 
  Database, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

// 導入監控組件
import SystemHealthCard from '../components/monitoring/SystemHealthCard';
import BusinessMetricsCard from '../components/monitoring/BusinessMetricsCard';
import DatabasePerformanceCard from '../components/monitoring/DatabasePerformanceCard';
import AlertManagementCard from '../components/monitoring/AlertManagementCard';
import RealtimeMetricsChart from '../components/monitoring/RealtimeMetricsChart';
import { useMonitoringData } from '../hooks/useMonitoringData';

/**
 * 監控儀表板主頁面
 * 
 * 設計原則：
 * - Frontend: 直觀易用，響應式設計，< 3s 載入時間
 * - Backend: 可靠數據獲取，99.9% 可用性監控
 * - DevOps: 自動化監控收集，可觀察性設計
 * - Architecture: 可擴展組件架構，模組化設計
 */
export default function MonitoringDashboard() {
  const { 
    systemHealth, 
    businessMetrics, 
    databasePerformance, 
    alerts,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    exportData
  } = useMonitoringData();

  // 載入狀態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Monitoring Error</span>
            </CardTitle>
            <CardDescription>
              Failed to load monitoring data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshData} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 計算總體系統狀態
  const overallStatus = systemHealth?.status === 'healthy' && 
                       databasePerformance?.status === 'healthy' && 
                       alerts?.summary?.criticalCount === 0 
                       ? 'healthy' : 'degraded';

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 頁面標題和控制 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" role="heading" aria-level={1}>
            System Monitoring
          </h1>
          <p className="text-muted-foreground" role="text">
            Real-time system health and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant={overallStatus === 'healthy' ? 'default' : 'destructive'}
            className="flex items-center space-x-1"
            role="status"
            aria-label={`System status: ${overallStatus === 'healthy' ? 'All Systems Operational' : 'System Degraded'}`}
          >
            <Activity className="h-3 w-3" aria-hidden="true" />
            <span>{overallStatus === 'healthy' ? 'All Systems Operational' : 'System Degraded'}</span>
          </Badge>
          
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            aria-label="Refresh monitoring data"
            aria-describedby="refresh-help"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
          <div id="refresh-help" className="sr-only">
            Refresh all monitoring data and update displayed metrics
          </div>
          
          <Button 
            onClick={exportData} 
            variant="outline" 
            size="sm"
            aria-label="Export monitoring data"
            aria-describedby="export-help"
          >
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
          <div id="export-help" className="sr-only">
            Export current monitoring data as JSON file
          </div>
        </div>
      </div>

      {/* 最後更新時間 */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* 主要監控內容 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5" role="tablist" aria-label="Monitoring sections">
          <TabsTrigger 
            value="overview" 
            className="flex items-center space-x-2"
            role="tab"
            aria-controls="overview-panel"
            aria-label="Overview monitoring dashboard"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="system" 
            className="flex items-center space-x-2"
            role="tab"
            aria-controls="system-panel"
            aria-label="System health monitoring"
          >
            <Server className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger 
            value="database" 
            className="flex items-center space-x-2"
            role="tab"
            aria-controls="database-panel"
            aria-label="Database performance monitoring"
          >
            <Database className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger 
            value="business" 
            className="flex items-center space-x-2"
            role="tab"
            aria-controls="business-panel"
            aria-label="Business metrics monitoring"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="flex items-center space-x-2"
            role="tab"
            aria-controls="alerts-panel"
            aria-label={`Alert management ${alerts?.summary?.criticalCount && alerts.summary.criticalCount > 0 ? `- ${alerts.summary.criticalCount} critical alerts` : ''}`}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Alerts</span>
            {alerts?.summary?.criticalCount && alerts.summary.criticalCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-1 h-4 w-4 p-0 text-xs"
                role="status"
                aria-label={`${alerts.summary.criticalCount} critical alerts`}
              >
                {alerts.summary.criticalCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 總覽頁面 */}
        <TabsContent 
          value="overview" 
          className="space-y-6"
          role="tabpanel"
          id="overview-panel"
          aria-labelledby="overview-tab"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Overview metrics cards">
            <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" aria-label="Loading system health" />}>
              <SystemHealthCard data={systemHealth} compact />
            </Suspense>
            <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" aria-label="Loading database performance" />}>
              <DatabasePerformanceCard data={databasePerformance} compact />
            </Suspense>
            <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" aria-label="Loading business metrics" />}>
              <BusinessMetricsCard data={businessMetrics} compact />
            </Suspense>
            <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" aria-label="Loading alert management" />}>
              <AlertManagementCard data={alerts} compact />
            </Suspense>
          </div>
          
          {/* 實時圖表 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
              <RealtimeMetricsChart 
                type="performance" 
                title="System Performance" 
                data={[]} 
              />
            </Suspense>
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
              <RealtimeMetricsChart 
                type="database" 
                title="Database Performance" 
                data={[]} 
              />
            </Suspense>
          </div>
        </TabsContent>

        {/* 系統監控頁面 */}
        <TabsContent value="system" className="space-y-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
            <SystemHealthCard data={systemHealth} />
          </Suspense>
        </TabsContent>

        {/* 資料庫監控頁面 */}
        <TabsContent value="database" className="space-y-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
            <DatabasePerformanceCard data={databasePerformance} />
          </Suspense>
        </TabsContent>

        {/* 業務指標頁面 */}
        <TabsContent value="business" className="space-y-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
            <BusinessMetricsCard data={businessMetrics} />
          </Suspense>
        </TabsContent>

        {/* 告警管理頁面 */}
        <TabsContent value="alerts" className="space-y-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
            <AlertManagementCard data={alerts} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}