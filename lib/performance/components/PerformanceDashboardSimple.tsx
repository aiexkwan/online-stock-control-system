/**
 * Simple Performance Dashboard Component
 * 提供實時性能監控和統計顯示功能
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { GlassmorphicCard } from '@/app/(app)/admin/components/GlassmorphicCard';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import type { 
  SimpleMetric, 
  PerformanceAlert, 
  PerformanceSummary 
} from '../types';

// 性能指標卡片組件
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  trend = 'stable',
  status = 'good',
  icon: Icon,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'text-red-400 border-red-500/30';
      case 'warning':
        return 'text-yellow-400 border-yellow-500/30';
      default:
        return 'text-green-400 border-green-500/30';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <GlassmorphicCard 
      variant="light" 
      className={`transition-all duration-300 hover:scale-105 border ${getStatusColor()} ${className}`}
      padding="medium"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${getStatusColor().split(' ')[0]}`} />
        {getTrendIcon()}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${getStatusColor().split(' ')[0]}`}>
          {value}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </p>
      </div>
    </GlassmorphicCard>
  );
};

// 警報列表組件
interface AlertListProps {
  alerts: PerformanceAlert[];
}

const AlertList: React.FC<AlertListProps> = ({ alerts }) => {
  const recentAlerts = alerts.slice(0, 5); // 只顯示最近5個警報

  if (recentAlerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No alerts - System running smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentAlerts.map((alert, index) => (
        <div 
          key={`${alert.timestamp}-${index}`}
          className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
            alert.type === 'critical' 
              ? 'bg-red-500/10 border-red-500/30 text-red-300' 
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
          }`}
        >
          <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
            alert.type === 'critical' ? 'text-red-400' : 'text-yellow-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.message}</p>
            <div className="flex items-center gap-4 mt-1 text-xs opacity-75">
              <span>Metric: {alert.metric}</span>
              <span>Value: {alert.value}</span>
              <span>Threshold: {alert.threshold}</span>
              <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 主要組件接口
export interface PerformanceDashboardProps {
  className?: string;
  autoStart?: boolean;
  refreshInterval?: number;
}

export function PerformanceDashboard({ 
  className = '',
  autoStart = true,
  refreshInterval = 3000 
}: PerformanceDashboardProps) {
  // 使用性能監控 Hook
  const {
    isMonitoring,
    metrics,
    alerts,
    report,
    startMonitoring,
    stopMonitoring
  } = usePerformanceMonitor({
    autoStart,
    reportInterval: refreshInterval,
    onAlert: (alert) => {
      console.warn('[Performance Alert]', alert);
    }
  });

  // 計算性能統計
  const performanceStats = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        avgResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        totalRequests: 0,
        errorRate: 0
      };
    }

    // 過濾和計算各類指標
    const apiMetrics = metrics.filter(m => m.category === 'api');
    const renderMetrics = metrics.filter(m => m.category === 'render');
    const componentMetrics = metrics.filter(m => m.category === 'component');

    const avgResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;

    const avgRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      memoryUsage: report?.memoryUsage || 0,
      cpuUsage: avgRenderTime, // 以渲染時間作為 CPU 使用率的近似值
      totalRequests: apiMetrics.length + renderMetrics.length + componentMetrics.length,
      errorRate: alerts.filter(a => a.type === 'critical').length
    };
  }, [metrics, alerts, report]);

  // 切換監控狀態
  const handleToggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  // 獲取系統狀態
  const systemStatus = useMemo(() => {
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    const warningAlerts = alerts.filter(a => a.type === 'warning').length;

    if (criticalAlerts > 0) return 'critical';
    if (warningAlerts > 0) return 'warning';
    return 'good';
  }, [alerts]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <Activity className='h-6 w-6 text-white' />
          <h1 className='text-2xl font-bold text-white'>Performance Monitor</h1>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            systemStatus === 'critical' ? 'bg-red-500/20 text-red-400' :
            systemStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            {systemStatus.toUpperCase()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMonitoring}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              isMonitoring 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            {isMonitoring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Stop Monitoring
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Start Monitoring
              </>
            )}
          </button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Response Time"
          value={performanceStats.avgResponseTime}
          unit="ms"
          status={performanceStats.avgResponseTime > 1000 ? 'critical' : 
                  performanceStats.avgResponseTime > 500 ? 'warning' : 'good'}
          trend={performanceStats.avgResponseTime > 500 ? 'up' : 'stable'}
          icon={Clock}
        />
        
        <MetricCard
          title="Memory Usage"
          value={Math.round(performanceStats.memoryUsage / 1024 / 1024)}
          unit="MB"
          status={performanceStats.memoryUsage > 100 * 1024 * 1024 ? 'warning' : 'good'}
          trend="stable"
          icon={HardDrive}
        />
        
        <MetricCard
          title="CPU Usage"
          value={Math.round(performanceStats.cpuUsage)}
          unit="ms"
          status={performanceStats.cpuUsage > 16 ? 'warning' : 'good'}
          trend="stable"
          icon={Cpu}
        />
        
        <MetricCard
          title="Total Metrics"
          value={performanceStats.totalRequests}
          status="good"
          trend="up"
          icon={Zap}
        />
      </div>

      {/* Alerts Section */}
      <GlassmorphicCard 
        variant='default' 
        hover={false} 
        borderGlow={false}
        className="transition-all duration-300"
      >
        <div className='p-6'>
          <div className="flex items-center justify-between mb-4">
            <h3 className='text-lg font-semibold text-white'>System Alerts</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{alerts.length} total alerts</span>
            </div>
          </div>
          <AlertList alerts={alerts} />
        </div>
      </GlassmorphicCard>

      {/* Performance Summary */}
      {report && (
        <GlassmorphicCard 
          variant='light' 
          hover={false} 
          borderGlow={false}
          className="transition-all duration-300"
        >
          <div className='p-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Active Categories</p>
                <p className="text-white font-medium">{report.activeCategories.length}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Metrics</p>
                <p className="text-white font-medium">{report.totalMetrics}</p>
              </div>
              <div>
                <p className="text-slate-400">Recent Alerts</p>
                <p className="text-white font-medium">{report.recentAlerts}</p>
              </div>
              <div>
                <p className="text-slate-400">Alert Count</p>
                <p className="text-white font-medium">{report.alertCount}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400">
                Last updated: {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassmorphicCard>
      )}

      {/* No Data State */}
      {!isMonitoring && metrics.length === 0 && (
        <GlassmorphicCard 
          variant='default' 
          hover={false} 
          borderGlow={false}
          className="transition-all duration-300"
        >
          <div className='p-6 text-center'>
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className='text-lg font-semibold text-white mb-2'>Performance Monitoring</h3>
            <p className='text-slate-400 mb-4'>
              Start monitoring to view real-time performance metrics and system health.
            </p>
            <button
              onClick={startMonitoring}
              className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-300"
            >
              Start Monitoring
            </button>
          </div>
        </GlassmorphicCard>
      )}
    </div>
  );
}

export default PerformanceDashboard;