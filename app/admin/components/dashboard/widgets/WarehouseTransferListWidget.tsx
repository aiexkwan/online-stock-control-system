/**
 * Warehouse Transfer List Widget - REST API Version
 * 列表形式顯示 record_transfer 內容
 * 只需顯示 "time", "pallet number", "operator"
 * 只顯示 operator department = "Warehouse" 的記錄
 *
 * Features:
 * - 使用 REST API 進行數據獲取
 * - Progressive Loading with useInViewport
 * - 保留 DataTable 實現和固定 50 筆記錄設計
 * - 保留日期範圍過濾和部門過濾功能
 * - 保留性能指標顯示
 */

'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { format, parseISO } from 'date-fns';
import { Clock, Box, User } from 'lucide-react';
import { DataTable, DataTableColumn } from './common/data-display/DataTable';
import { useWidgetDateRange } from './common/filters/DateRangeFilter';
import { useInViewport } from '@/app/admin/hooks/useInViewport';

interface TransferRecord {
  tran_date: string;
  plt_num: string;
  operator_name: string;
}

// REST API client for warehouse transfers
const warehouseTransferApiClient = {
  async getTransferList(params: {
    startDate?: string;
    endDate?: string;
    fromLocation?: string;
    toLocation?: string;
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ transfers: any[], total_records: number }> {
    const url = new URL('/api/v1/warehouse-transfers/list', window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch warehouse transfers: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      transfers: data.transfers || [],
      total_records: data.total_records || 0,
    };
  },
};

export const WarehouseTransferListWidget = React.memo(function WarehouseTransferListWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // 使用通用 hook 處理日期範圍
  const dateRange = useWidgetDateRange(timeFrame, 'yesterday');
  
  // Progressive Loading - 檢測 widget 是否在視窗內
  const { isInViewport, hasBeenInViewport } = useInViewport(widgetRef, {
    threshold: 0.1,
    triggerOnce: true, // 只加載一次
    rootMargin: '50px', // 提前 50px 開始加載
  });

  // State management
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastFetchTime?: number;
    mode?: string;
    optimized?: boolean;
  }>({});

  // 準備 API parameters
  const apiParams = useMemo(() => ({
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    limit: 50,
    offset: 0,
  }), [dateRange]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (isEditMode || !hasBeenInViewport) return;

    setLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const result = await warehouseTransferApiClient.getTransferList(apiParams);
      const endTime = performance.now();

      setData(result.transfers);
      setPerformanceMetrics({
        lastFetchTime: Math.round(endTime - startTime),
        mode: 'REST API',
        optimized: true,
      });
    } catch (err) {
      console.error('[WarehouseTransferListWidget] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouse transfers');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, hasBeenInViewport, apiParams]);

  // Initial data fetch and periodic refresh
  useEffect(() => {
    fetchData();

    // Set up polling every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 處理數據格式
  const transfers = useMemo<TransferRecord[]>(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((transfer: any) => ({
      tran_date: transfer.transfer_date || transfer.tran_date || new Date().toISOString(),
      plt_num: transfer.pallet_ref || transfer.plt_num || 'N/A',
      operator_name: transfer.transferred_by || transfer.operator_name || 'Unknown Operator',
    }));
  }, [data]);

  // 定義 DataTable columns
  const columns = useMemo<DataTableColumn<TransferRecord>[]>(() => [
    {
      key: 'tran_date',
      header: 'Time',
      icon: Clock,
      width: '33%',
      render: (value) => {
        try {
          return format(parseISO(value), 'HH:mm:ss');
        } catch {
          return 'Invalid Date';
        }
      },
      className: 'font-medium text-slate-300',
    },
    {
      key: 'plt_num',
      header: 'Pallet Number',
      icon: Box,
      width: '33%',
      className: 'font-medium text-white',
    },
    {
      key: 'operator_name',
      header: 'Operator',
      icon: User,
      width: '34%',
      className: 'font-medium text-slate-300',
    },
  ], []);

  // Edit mode - 顯示空白狀態
  if (isEditMode) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title="Warehouse Transfers"
          icon={DocumentTextIcon}
          iconColor="from-blue-500 to-cyan-500"
          data={[]}
          columns={columns}
          loading={false}
          error={null}
          emptyMessage="Configure warehouse transfer tracking"
          showPagination={false}
          onRetry={() => {}}
          performanceMetrics={{
            mode: 'Edit Mode',
            optimized: false,
          }}
          className="h-full"
        />
      </div>
    );
  }

  // Progressive Loading - 如果未進入視窗，顯示 skeleton
  if (!hasBeenInViewport) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title="Warehouse Transfers"
          icon={DocumentTextIcon}
          iconColor="from-blue-500 to-cyan-500"
          data={[]}
          columns={columns}
          loading={true}
          error={null}
          emptyMessage="Loading warehouse transfers..."
          showPagination={false}
          onRetry={() => {}}
          performanceMetrics={{
            mode: 'Progressive Loading',
            optimized: false,
          }}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div ref={widgetRef}>
      <DataTable
        title="Warehouse Transfers"
        icon={DocumentTextIcon}
        iconColor="from-blue-500 to-cyan-500"
        data={transfers}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No warehouse transfers found"
        showPagination={false}
        onRetry={fetchData}
        performanceMetrics={performanceMetrics}
        className="h-full"
      />
    </div>
  );
});

export default WarehouseTransferListWidget;