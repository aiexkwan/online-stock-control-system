/**
 * Await Location Qty Widget - Batch Query Version
 * 顯示 record_inventory 表內 await 欄位的總和
 * 使用批量查詢系統優化性能
 * 
 * Updated to use MetricCard:
 * - 使用通用 MetricCard 組件簡化代碼
 * - 保持原有功能和動畫效果
 * - 統一的錯誤處理和加載狀態
 */

'use client';

import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
import { MetricCard } from '../common';

interface AwaitLocationQtyData {
  locations: Array<{
    location: string;
    quantity: number;
    lastUpdated: string;
  }>;
  totalAwaitingQty: number;
}

const AwaitLocationQtyWidget = React.memo(function AwaitLocationQtyWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  // 使用批量查詢系統獲取數據
  const { data: rawData, loading, error, refetch } = useWidgetData<AwaitLocationQtyData>('awaitLocationQty');
  
  // 處理數據格式
  const awaitLocationQty = React.useMemo(() => {
    if (!rawData) return 0;
    return rawData.totalAwaitingQty || 0;
  }, [rawData]);

  // 使用 MetricCard 通用組件
  return (
    <MetricCard
      title="Await Location Qty"
      value={awaitLocationQty}
      label="Pallets"
      icon={BuildingOfficeIcon}
      loading={loading}
      error={error}
      onRetry={refetch}
      isEditMode={isEditMode}
      editModeText="Await Location Qty Widget"
      performanceMetrics={{
        label: "Batch Query Optimized",
        icon: "⚡"
      }}
    />
  );
});

export default AwaitLocationQtyWidget;

/**
 * MetricCard Migration completed on 2025-07-10
 * 
 * Features:
 * - 使用通用 MetricCard 組件
 * - 大幅簡化代碼結構（從 178 行減至 64 行）
 * - 保持原有動畫效果和 UI
 * - 統一的錯誤處理和加載狀態
 * 
 * 優化:
 * - 代碼減少約 64%
 * - 使用標準化的 UI 模式
 * - 更易維護和測試
 * - 保持批量查詢優化
 */
