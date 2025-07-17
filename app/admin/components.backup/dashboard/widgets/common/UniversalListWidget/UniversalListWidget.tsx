/**
 * Universal List Widget
 * 統一的列表 Widget 組件，替代 5 個現有的 list widgets
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable } from '../data-display/DataTable';
import { useUniversalList } from './useUniversalList';
import {
  UniversalListWidgetProps,
  ConnectionStatus,
  PerformanceMetrics,
} from './types';

/**
 * 連接狀態組件
 */
function ConnectionStatusBadge({ 
  status, 
  className 
}: { 
  status: ConnectionStatus;
  className?: string;
}) {
  const getStatusColor = () => {
    switch (status.type) {
      case 'realtime':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'polling':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'offline':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border',
      getStatusColor(),
      className
    )}>
      {status.optimized && <span className="text-xs">⚡</span>}
      {status.label}
    </div>
  );
}

/**
 * 性能指標組件
 */
function PerformanceIndicator({ 
  metrics, 
  className 
}: { 
  metrics: PerformanceMetrics;
  className?: string;
}) {
  if (!metrics.queryTime && !metrics.fetchTime) return null;

  return (
    <div className={cn('text-xs text-gray-500', className)}>
      {metrics.queryTime && (
        <span>Query: {metrics.queryTime}ms</span>
      )}
      {metrics.fetchTime && (
        <span className="ml-2">Fetch: {metrics.fetchTime}ms</span>
      )}
    </div>
  );
}

/**
 * 載入骨架組件
 */
function ListSkeleton({ 
  title, 
  icon: Icon,
  iconColor,
  rows = 5 
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-8 w-8 rounded-lg bg-gradient-to-r flex items-center justify-center',
            iconColor || 'from-blue-500 to-cyan-500'
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-1">
            <div className="h-5 w-32 rounded bg-gray-700 animate-pulse" />
            <div className="h-3 w-20 rounded bg-gray-800 animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-16 rounded bg-gray-700 animate-pulse" />
      </div>
      
      {/* Table skeleton */}
      <div className="space-y-2">
        {/* Table header */}
        <div className="flex gap-4 px-4 py-2 border-b border-gray-700">
          {[1, 2, 3, 4].map(col => (
            <div key={col} className="h-4 w-20 rounded bg-gray-700 animate-pulse" />
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-4 px-4 py-3 border-b border-gray-800/50">
            {[1, 2, 3, 4].map(col => (
              <div key={col} className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 錯誤顯示組件
 */
function ErrorDisplay({ 
  error, 
  title,
  onRetry 
}: { 
  error: Error;
  title: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-red-400 mb-2">
        Failed to Load {title}
      </h3>
      <p className="text-sm text-gray-400 mb-4 max-w-md">
        {error.message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * 空狀態組件
 */
function EmptyState({ 
  message, 
  icon: Icon,
  onRefresh 
}: {
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRefresh?: () => void;
}) {
  const DefaultIcon = Icon || (() => (
    <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center">
      <span className="text-2xl text-gray-400">📭</span>
    </div>
  ));

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <DefaultIcon className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm text-gray-400 mb-4">
        {message || 'No data available'}
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    </div>
  );
}

/**
 * 編輯模式顯示組件
 */
function EditModeDisplay({ 
  config,
  className,
  style 
}: {
  config: any;
  className?: string;
  style?: React.CSSProperties;
}) {
  const mockData = config.interaction?.editMode?.mockData || [
    { id: '1', name: 'Mock Item 1', status: 'Active' },
    { id: '2', name: 'Mock Item 2', status: 'Pending' },
    { id: '3', name: 'Mock Item 3', status: 'Completed' },
  ];

  return (
    <div className={cn('cursor-not-allowed opacity-75', className)} style={style}>
      <DataTable
        title={config.display.title}
        icon={config.display.icon}
        iconColor={config.display.iconColor}
        data={mockData}
        columns={config.display.columns}
        loading={false}
        error={null}
        className="border-dashed"
        performanceMetrics={{
          source: 'Edit Mode',
          optimized: false,
        }}
        connectionStatus={{
          type: 'offline',
          label: '✏️ Edit Mode',
        }}
      />
    </div>
  );
}

/**
 * 主要的 Universal List Widget 組件
 */
export const UniversalListWidget = React.memo(function UniversalListWidget<T = any>({
  config,
  widget,
  isEditMode,
  timeFrame,
  className,
  style,
}: UniversalListWidgetProps<T>) {
  // 獲取數據和狀態
  const {
    data,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore,
    refresh,
    mode,
    lastUpdated,
    source,
    performanceMetrics,
    containerRef,
    isInViewport,
    hasBeenInViewport,
  } = useUniversalList(config, timeFrame, isEditMode);

  // 連接狀態
  const connectionStatus: ConnectionStatus = useMemo(() => {
    if (mode === 'context') {
      return { type: 'realtime', label: '🚀 Batch Query', optimized: true };
    } else if (mode === 'server-action') {
      return { type: 'polling', label: '🔄 Server Action', optimized: false };
    } else {
      return { type: 'offline', label: '⚠️ Offline', optimized: false };
    }
  }, [mode]);

  // 處理交互
  const handleRowClick = useCallback((item: T) => {
    if (config.interaction?.rowClickable && config.interaction.onRowClick) {
      config.interaction.onRowClick(item);
    } else if (config.interaction?.drillDown?.enabled) {
      const url = config.interaction.drillDown.getUrl(item);
      const target = config.interaction.drillDown.target || '_blank';
      window.open(url, target);
    }
  }, [config.interaction]);

  const handleRefresh = useCallback(() => {
    if (config.interaction?.onRefresh) {
      config.interaction.onRefresh();
    } else {
      refresh();
    }
  }, [config.interaction, refresh]);

  // 格式化時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) return undefined;
    return `${format(timeFrame.start, 'MMM d')} - ${format(timeFrame.end, 'MMM d')}`;
  }, [timeFrame]);

  // 編輯模式
  if (isEditMode) {
    return <EditModeDisplay config={config} className={className} style={style} />;
  }

  // 載入狀態 (Progressive Loading)
  if ((loading && !data?.length) || (config.performance?.progressiveLoading && !hasBeenInViewport)) {
    return (
      <div ref={containerRef} className={className} style={style}>
        <ListSkeleton
          title={config.display.title}
          icon={config.display.icon}
          iconColor={config.display.iconColor}
          rows={config.pagination?.pageSize || 5}
        />
      </div>
    );
  }

  // 錯誤狀態
  if (error && !config.performance?.fallbackData?.length) {
    return (
      <div ref={containerRef} className={className} style={style}>
        <ErrorDisplay
          error={error}
          title={config.display.title}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  // 空狀態
  if (!loading && (!data || data.length === 0)) {
    return (
      <div ref={containerRef} className={className} style={style}>
        <EmptyState
          message={config.display.emptyMessage}
          icon={config.display.emptyIcon}
          onRefresh={config.interaction?.refreshable ? handleRefresh : undefined}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        config.interaction?.rowClickable && 'cursor-pointer',
        className
      )}
      style={style}
    >
      <DataTable
        title={config.display.title}
        icon={config.display.icon}
        iconColor={config.display.iconColor}
        data={data || []}
        columns={config.display.columns}
        keyField={config.display.keyField}
        loading={loading}
        error={error}
        onRowClick={config.interaction?.rowClickable ? handleRowClick : undefined}
        dateRange={dateRange}
        performanceMetrics={performanceMetrics}
        connectionStatus={connectionStatus}
        className={cn(
          config.display.className,
          config.display.tableClassName
        )}
        showHeader={config.display.showHeader}
        striped={config.display.striped}
        hover={config.display.hover}
        
        // 分頁功能
        pagination={config.pagination?.type === 'infinite' ? {
          hasMore,
          onLoadMore: loadMore,
          loading: loading,
        } : undefined}
        
        // 刷新功能
        onRefresh={config.interaction?.refreshable ? handleRefresh : undefined}
        
        // 選擇功能
        selectable={config.interaction?.selectable}
        onSelectionChange={config.interaction?.onSelectionChange}
      />
      
      {/* 性能調試信息 (僅開發模式) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 space-y-1">
          <ConnectionStatusBadge status={connectionStatus} />
          <PerformanceIndicator metrics={performanceMetrics} />
          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Updated: {format(lastUpdated, 'HH:mm:ss')}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default UniversalListWidget;