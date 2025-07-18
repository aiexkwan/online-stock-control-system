import React, { useMemo } from 'react';
import { DataTable } from './common/data-display/DataTable';
import { useDashboardConcurrentQuery } from '@/app/admin/hooks/useDashboardConcurrentQuery';
import { AdminWidgetConfig } from '../adminDashboardLayouts';

interface UnifiedTableWidgetProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
}

/**
 * UnifiedTableWidget - 統一表格組件
 * 
 * 基於現有的 DataTable 組件，提供統一的表格數據顯示
 * 支持動態列配置和靈活的數據源
 */
export const UnifiedTableWidget: React.FC<UnifiedTableWidgetProps> = ({
  config,
  dateRange,
  warehouse
}) => {
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

  // 處理表格數據和列配置
  const processedTableData = useMemo(() => {
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
  }, [data, config.dataSource]);

  // 生成動態列配置
  const generateColumns = (columns: string[]) => {
    return columns.map(key => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      dataIndex: key,
      render: (value: unknown) => {
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
      }
    }));
  };

  // 錯誤狀態處理
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 text-lg font-semibold mb-2">
            {config.title}
          </div>
          <div className="text-red-400 text-sm">
            資料載入失敗，請稍後再試
          </div>
        </div>
      </div>
    );
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
            暫無資料
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
          loading={isLoading}
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