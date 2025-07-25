import React from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { DataTable } from '@/app/(app)/admin/components/dashboard/widgets/common/data-display/DataTable';
import { AdminWidgetConfig } from '@/types/components/dashboard';

interface MockData {
  data: Record<string, unknown> | null;
  isLoading: boolean;
  error: Error | null;
}

// 定義表格數據的可能結構
interface TableDataStructure {
  items?: Record<string, unknown>[];
  rows?: Record<string, unknown>[];
  columns?: string[];
}

// Type guard functions
function hasItems(data: unknown): data is { items: Record<string, unknown>[]; columns?: string[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as { items: unknown }).items)
  );
}

function hasRows(data: unknown): data is { rows: Record<string, unknown>[]; columns?: string[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'rows' in data &&
    Array.isArray((data as { rows: unknown }).rows)
  );
}

interface UnifiedTableWidgetMockWrapperProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
  mockData: MockData;
}

/**
 * Mock wrapper for UnifiedTableWidget that works in Storybook
 * Bypasses the hook dependency by accepting mock data as props
 */
export const UnifiedTableWidgetMockWrapper: React.FC<UnifiedTableWidgetMockWrapperProps> = ({
  config,
  dateRange,
  warehouse,
  mockData,
}) => {
  const { data, isLoading, error } = mockData;

  // 處理表格數據和列配置
  const processedTableData = React.useMemo(() => {
    if (!data || !config.dataSource) return null;

    const sourceData = data[config.dataSource];
    if (!sourceData) return null;

    // 如果數據是數組，直接使用
    if (Array.isArray(sourceData)) {
      return {
        data: sourceData,
        columns: sourceData.length > 0 ? Object.keys(sourceData[0]) : [],
      };
    }

    // 如果數據包含 items 屬性
    if (hasItems(sourceData)) {
      return {
        data: sourceData.items,
        columns:
          sourceData.columns ||
          (sourceData.items.length > 0 ? Object.keys(sourceData.items[0]) : []),
      };
    }

    // 如果數據包含 rows 屬性
    if (hasRows(sourceData)) {
      return {
        data: sourceData.rows,
        columns:
          sourceData.columns || (sourceData.rows.length > 0 ? Object.keys(sourceData.rows[0]) : []),
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
          if (
            key.includes('date') ||
            key.includes('time') ||
            key.includes('created') ||
            key.includes('updated')
          ) {
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
      },
    }));
  };

  // 錯誤狀態處理
  if (error) {
    return (
      <div className='rounded-lg border bg-white p-4 shadow-sm'>
        <div className='flex flex-col items-center justify-center py-8'>
          <div className='mb-2 text-lg font-semibold text-red-500'>{config.title}</div>
          <div className='text-sm text-red-400'>資料載入失敗，請稍後再試</div>
        </div>
      </div>
    );
  }

  // 載入狀態
  if (isLoading) {
    return (
      <div className='rounded-lg border bg-white p-4 shadow-sm'>
        <div className='flex flex-col'>
          <div className='mb-4 text-lg font-semibold'>{config.title}</div>
          <div className='space-y-2'>
            {/* 表格骨架屏 */}
            <div className='h-8 animate-pulse rounded bg-gray-200'></div>
            <div className='h-6 animate-pulse rounded bg-gray-100'></div>
            <div className='h-6 animate-pulse rounded bg-gray-100'></div>
            <div className='h-6 animate-pulse rounded bg-gray-100'></div>
          </div>
        </div>
      </div>
    );
  }

  // 無數據狀態
  if (!processedTableData || processedTableData.data.length === 0) {
    return (
      <div className='rounded-lg border bg-white p-4 shadow-sm'>
        <div className='flex flex-col items-center justify-center py-8'>
          <div className='mb-2 text-lg font-semibold text-gray-500'>{config.title}</div>
          <div className='text-sm text-gray-400'>暫無資料</div>
        </div>
      </div>
    );
  }

  const columns = generateColumns(processedTableData.columns);

  return (
    <div className='rounded-lg border bg-white p-4 shadow-sm'>
      <div className='flex flex-col'>
        <div className='mb-4 text-lg font-semibold'>{config.title}</div>
        {config.description && (
          <div className='mb-4 text-sm text-gray-600'>{config.description}</div>
        )}
        <DataTable
          data={processedTableData.data}
          columns={columns}
          loading={isLoading}
          pagination={{
            enabled: true,
            pageSize: 10,
          }}
        />
      </div>
    </div>
  );
};
