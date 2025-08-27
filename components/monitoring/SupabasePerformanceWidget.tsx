/**
 * Supabase Performance Widget Component
 * Visual representation of Supabase connection and query performance
 */

import React from 'react';
import { useSupabasePerformance } from '@/lib/hooks/useSupabasePerformance';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SupabasePerformanceWidgetProps {
  className?: string;
  compact?: boolean;
  showAlerts?: boolean;
  showRecommendations?: boolean;
  autoStart?: boolean;
}

/**
 * Performance Widget Component
 */
export const SupabasePerformanceWidget: React.FC<SupabasePerformanceWidgetProps> = ({
  className,
  compact = false,
  showAlerts = true,
  showRecommendations = true,
  autoStart = true,
}) => {
  const {
    metrics,
    health,
    alerts,
    recommendations,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshMetrics,
  } = useSupabasePerformance({
    enabled: autoStart,
    showAlerts: true,
    alertToast: false,
    updateInterval: 30000,
  });

  // Get status icon
  const getStatusIcon = () => {
    if (!health) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!health) return 'text-gray-500';
    
    switch (health.status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get health badge color
  const getHealthBadgeColor = () => {
    if (!health) return 'bg-gray-100 text-gray-700';
    
    switch (health.status) {
      case 'healthy':
        return 'bg-green-100 text-green-700';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-700';
      case 'unhealthy':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (compact) {
    // Compact view for inline display
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className={cn('font-medium capitalize', getStatusColor())}>
            {health?.status || 'Unknown'}
          </span>
        </div>
        {metrics && (
          <>
            <span className="text-gray-400">•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">{metrics.averageQueryTime.toFixed(0)}ms</span>
            </div>
            <span className="text-gray-400">•</span>
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">{metrics.totalQueries} queries</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold">Database Performance</h3>
        </div>
        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            isMonitoring 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {isMonitoring ? 'Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      {/* Health Status */}
      {health && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={cn('text-sm font-medium capitalize', getStatusColor())}>
                {health.status}
              </span>
            </div>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getHealthBadgeColor())}>
              Score: {health.score}/100
            </span>
          </div>
          <Progress value={health.score} className="h-2" />
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Queries */}
          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Total Queries</span>
              <Activity className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-lg font-semibold">{metrics.totalQueries}</div>
          </div>

          {/* Average Query Time */}
          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Avg Query Time</span>
              <Clock className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-lg font-semibold">{metrics.averageQueryTime.toFixed(0)}ms</div>
          </div>

          {/* Cache Hit Rate */}
          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Cache Hit Rate</span>
              <Zap className="h-3 w-3 text-gray-400" />
            </div>
            <div className="text-lg font-semibold">{metrics.cacheHitRate.toFixed(1)}%</div>
          </div>

          {/* Failed Queries */}
          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Failed Queries</span>
              <AlertCircle className="h-3 w-3 text-gray-400" />
            </div>
            <div className={cn('text-lg font-semibold', metrics.failedQueries > 0 ? 'text-red-600' : '')}>
              {metrics.failedQueries}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {metrics && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-gray-50 p-2">
          <span className="text-sm text-gray-600">Connection Status</span>
          <span className={cn(
            'flex items-center gap-1 text-sm font-medium',
            metrics.connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
          )}>
            <span className={cn(
              'h-2 w-2 rounded-full',
              metrics.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            )} />
            {metrics.connectionStatus}
          </span>
        </div>
      )}

      {/* Recent Alerts */}
      {showAlerts && alerts.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Recent Alerts</h4>
          <div className="space-y-1">
            {alerts.slice(-3).map((alert, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-md p-2 text-xs',
                  alert.severity === 'critical' || alert.severity === 'error'
                    ? 'bg-red-50 text-red-700'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-blue-50 text-blue-700'
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">Recommendations</h4>
          <ul className="space-y-1 text-xs text-gray-600">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-gray-400">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={refreshMetrics}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Refresh Metrics
        </button>
      </div>
    </div>
  );
};

/**
 * Inline Performance Indicator
 * Small inline component for showing connection status
 */
export const SupabaseStatusIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { metrics, health } = useSupabasePerformance({
    enabled: true,
    showAlerts: false,
    updateInterval: 60000,
  });

  const getColor = () => {
    if (!health) return 'bg-gray-400';
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className={cn('h-2 w-2 rounded-full', getColor())} />
        {metrics?.connectionStatus === 'connected' && (
          <div className={cn('absolute inset-0 h-2 w-2 animate-ping rounded-full', getColor())} />
        )}
      </div>
      <span className="text-xs text-gray-600">
        {metrics ? `${metrics.averageQueryTime.toFixed(0)}ms` : 'N/A'}
      </span>
    </div>
  );
};