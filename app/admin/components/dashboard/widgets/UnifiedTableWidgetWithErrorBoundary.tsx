import React, { useMemo } from 'react';
import { DataTable } from './common/data-display/DataTable';
import { useDashboardConcurrentQuery } from '@/app/admin/hooks/useDashboardConcurrentQuery';
import { AdminWidgetConfig } from '../adminDashboardLayouts';
import { WidgetErrorBoundary, useErrorHandler, WidgetErrorFallback, ERROR_MESSAGES } from '@/lib/error-handling';

interface UnifiedTableWidgetProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
}

/**
 * UnifiedTableWidget - 統一表格組件 (增強錯誤處理版本)
 * 
 * 基於現有的 DataTable 組件，提供統一的表格數據顯示
 * 支持動態列配置和靈活的數據源
 * 整合了統一錯誤邊界系統
 */
export const UnifiedTableWidget: React.FC<UnifiedTableWidgetProps> = (props) => {
  return (
    <WidgetErrorBoundary 
      widgetName="UnifiedTable"
      fallback={({ retry, reset }) => (
        <WidgetErrorFallback 
          error={new Error(ERROR_MESSAGES.RENDERING.TABLE_FAILED)}
          retry={retry}
          reset={reset}
          widgetName={props.config.title}
        />
      )}
      recoveryStrategy={{
        primaryAction: 'retry',
        secondaryActions: ['refresh'],
        autoRetry: {
          enabled: true,
          maxAttempts: 3,
          delayMs: 1000
        }
      }}
    >
      <UnifiedTableWidgetContent {...props} />
    </WidgetErrorBoundary>
  );
};

// 將實際的 widget 內容分離到獨立組件
const UnifiedTableWidgetContent: React.FC<UnifiedTableWidgetProps> = ({
  config,
  dateRange,
  warehouse
}) => {
  const { handleError } = useErrorHandler('UnifiedTableWidget');

  // 轉換 dateRange 格式以匹配 DashboardDateRange 接口
  const dashboardDateRange = dateRange ? {
    startDate: new Date(dateRange.start),
    endDate: new Date(dateRange.end)
  } : {
    startDate: null,
    endDate: null
  };

  // 使用現有的統一API查詢機制
  const { data, isLoading, error } = useDashboardConcurrentQuery({
    dateRange: dashboardDateRange,
    enabledWidgets: [config.dataSource || 'default'],
    enabled: true
  });

  // 處理查詢錯誤
  React.useEffect(() => {
    if (error) {
      handleError(
        typeof error === 'string' ? new Error(error) : error,
        'data_fetch',
        { 
          userMessage: ERROR_MESSAGES.WIDGET.TABLE_DATA_FAILED
        }
      );
    }
  }, [error, handleError]);

  // 處理表格數據和列配置
  const processedTableData = useMemo(() => {
    try {
      if (!data || !config.dataSource) return null;

      const sourceData = data[config.dataSource];
      if (!sourceData) return null;

      // 如果數據是數組，直接使用
      if (Array.isArray(sourceData)) {
        return {
          data: sourceData,
          columns: sourceData.length > 0 ? Object.keys(sourceData[0]) : []
        };
      }

      // 如果數據包含 items 屬性
      if (sourceData.items && Array.isArray(sourceData.items)) {
        return {
          data: sourceData.items,
          columns: sourceData.columns || (sourceData.items.length > 0 ? Object.keys(sourceData.items[0]) : [])
        };
      }

      // 如果數據包含 rows 屬性
      if (sourceData.rows && Array.isArray(sourceData.rows)) {
        return {
          data: sourceData.rows,
          columns: sourceData.columns || (sourceData.rows.length > 0 ? Object.keys(sourceData.rows[0]) : [])
        };
      }

      return null;
    } catch (processingError) {
      handleError(
        processingError as Error,
        'data_processing',
        { 
          userMessage: ERROR_MESSAGES.API.GENERAL
        }
      );
      return null;
    }
  }, [data, config.dataSource, handleError]);

  // 生成動態列配置
  const generateColumns = (columns: string[]) => {
    try {
      return columns.map(key => ({
        key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        dataIndex: key,
        render: (value: unknown) => {
          try {
            // 處理不同類型的數據顯示
            if (value === null || value === undefined) return '-';
            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
            if (typeof value === 'number') {
              // 處理日期時間戳
              if (key.includes('date') || key.includes('time') || key.includes('created') || key.includes('updated')) {
                return new Date(value).toLocaleDateString();
              }
              // 處理大數值
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toString();
            }
            if (typeof value === 'string') {
              // 處理長字符串
              if (value.length > 50) {
                return `${value.substring(0, 50)}...`;
              }
              return value;
            }
            return String(value);
          } catch (renderError) {
            handleError(
              renderError as Error,
              'render_cell',
              { 
                userMessage: ERROR_MESSAGES.RENDERING.COMPONENT_FAILED
              }
            );
            return '-';
          }
        }
      }));
    } catch (columnError) {
      handleError(
        columnError as Error,
        'generate_columns',
        { 
          userMessage: ERROR_MESSAGES.RENDERING.TABLE_FAILED
        }
      );
      return [];
    }
  };

  // 錯誤狀態處理 - 由錯誤邊界處理，這裡只返回 null
  if (error) {
    return null;
  }

  // 載入狀態
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col">
          <div className="text-lg font-semibold mb-4">{config.title}</div>
          <div className="space-y-2">
            {/* 表格骨架屏 */}
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // 無數據狀態
  if (!processedTableData || processedTableData.data.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-500 text-lg font-semibold mb-2">
            {config.title}
          </div>
          <div className="text-gray-400 text-sm">
            No data available
          </div>
        </div>
      </div>
    );
  }

  const columns = generateColumns(processedTableData.columns);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-col">
        <div className="text-lg font-semibold mb-4">{config.title}</div>
        {config.description && (
          <div className="text-sm text-gray-600 mb-4">{config.description}</div>
        )}
        <DataTable
          data={processedTableData.data}
          columns={columns}
          loading={false}
          pagination={{
            enabled: true,
            pageSize: 10
          }}
        />
      </div>
    </div>
  );
};

export default UnifiedTableWidget;