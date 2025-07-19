'use client';

import React from 'react';
import { DashboardDataProvider } from '@/app/admin/contexts/DashboardDataContext';
import { AdminDashboardContent } from '@/app/admin/components/dashboard/AdminDashboardContent';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'; // 暫時注釋，組件不存在
import { useDashboardData } from '@/app/admin/contexts/DashboardDataContext';

// 日期選擇器組件，使用 Context 中的狀態
function DashboardDateSelector() {
  const { dateRange, setDateRange } = useDashboardData();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">
        Date Range: {dateRange.startDate?.toDateString()} - {dateRange.endDate?.toDateString()}
      </span>
      {/* DatePickerWithRange 暫時用簡單文字替代 */}
    </div>
  );
}

// 主儀表板頁面組件
export default function AdminDashboardPage() {
  // 設置初始日期範圍為最近 30 天
  const initialDateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  };

  return (
    <DashboardDataProvider 
      initialDateRange={initialDateRange}
      autoRefreshInterval={5 * 60 * 1000} // 5 分鐘自動刷新
    >
      <div className="h-full flex flex-col">
        {/* 頂部工具欄 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <DashboardDateSelector />
        </div>

        {/* 儀表板內容 */}
        <div className="flex-1 overflow-auto">
          <AdminDashboardContent 
            theme="production"
            timeFrame={{
              label: "Last 7 Days",
              value: "7d",
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date()
            }}
          />
        </div>
      </div>
    </DashboardDataProvider>
  );
}

// 示例：如何在現有 widget 中遷移使用 Context
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';

export function MigratedStatsCardWidget() {
  // 之前：使用自己的 API 調用
  // const { data, loading, error } = useQuery(...)
  
  // 現在：使用共享的 Context 數據
  const { data, loading, error, refetch } = useWidgetData('statsCard');

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (error) {
    return <div>Error: {(error as { message: string }).message}</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-500">Total Products</h3>
        <p className="text-2xl font-bold">{(data as { totalProducts?: number })?.totalProducts || 0}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-500">Total Stock</h3>
        <p className="text-2xl font-bold">{(data as { totalStock?: number })?.totalStock || 0}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-500">Low Stock</h3>
        <p className="text-2xl font-bold text-red-600">{(data as { lowStockCount?: number })?.lowStockCount || 0}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm text-gray-500">Avg Stock Level</h3>
        <p className="text-2xl font-bold">{(data as { averageStockLevel?: number })?.averageStockLevel || 0}</p>
      </div>
    </div>
  );
}

// 示例：如何創建一個使用多個 widget 數據的複合組件
export function WarehouseOverviewWidget() {
  const { getWidgetData, isWidgetLoading, refetchWidget } = useDashboardData();
  
  // 獲取多個相關數據
  const stockDistribution = getWidgetData('stockDistribution');
  const warehouseTransfers = getWidgetData('warehouseTransferList');
  const workLevel = getWidgetData('warehouseWorkLevel');
  
  const isLoading = isWidgetLoading('stockDistribution') || 
                   isWidgetLoading('warehouseTransferList') || 
                   isWidgetLoading('warehouseWorkLevel');

  const handleRefresh = async () => {
    // 批量刷新相關數據
    await Promise.all([
      refetchWidget('stockDistribution'),
      refetchWidget('warehouseTransferList'),
      refetchWidget('warehouseWorkLevel')
    ]);
  };

  if (isLoading) {
    return <div>Loading warehouse data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Warehouse Overview</h2>
        <button onClick={handleRefresh} className="text-blue-600">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium mb-2">Stock Distribution</h3>
          <p className="text-2xl font-bold">
            {(stockDistribution as { warehouseData?: Array<unknown> })?.warehouseData?.length || 0} warehouses
          </p>
          <p className="text-sm text-gray-500">
            Total: {(stockDistribution as { totalQuantity?: number })?.totalQuantity || 0} units
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium mb-2">Active Transfers</h3>
          <p className="text-2xl font-bold">
            {(warehouseTransfers as { pendingCount?: number })?.pendingCount || 0}
          </p>
          <p className="text-sm text-gray-500">
            Completed today: {(warehouseTransfers as { completedCount?: number })?.completedCount || 0}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium mb-2">Peak Activity</h3>
          <p className="text-2xl font-bold">
            {(workLevel as { peakHour?: number })?.peakHour || 0}:00
          </p>
          <p className="text-sm text-gray-500">
            Avg activity: {(workLevel as { averageActivity?: number })?.averageActivity || 0}/hr
          </p>
        </div>
      </div>
    </div>
  );
}