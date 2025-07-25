/**
 * OrderStateCard Component
 * 遷移自 OrderStateListWidget，使用統一的 TableCard 架構
 * 顯示訂單進度狀態的表格卡片
 */

'use client';

import React, { useMemo } from 'react';
import { ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TableCard, TableCardProps } from './TableCard';
// 基礎的 Card 組件屬性，不依賴完整的 Widget 系統
interface BaseCardProps {
  isEditMode?: boolean;
  timeFrame?: {
    start: Date;
    end: Date;
  };
  className?: string;
}

interface OrderProgress {
  id: string;
  uuid: string;
  order_ref: string;
  product_code: string;
  product_desc: string;
  progress: number;
  progress_text: string;
  status: 'pending' | 'in_progress' | 'completed';
  status_color: 'green' | 'orange' | 'yellow' | 'red';
}

export interface OrderStateCardProps extends BaseCardProps {
  widget?: any; // 可選的 widget 配置
  title?: string;
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
}

export const OrderStateCard: React.FC<OrderStateCardProps> = ({
  widget,
  isEditMode = false,
  timeFrame,
  title = 'Order Progress',
  showFilters = false,
  showExport = true,
  pageSize = 50,
  className,
}) => {
  // 配置 TableCard 屬性
  const tableCardProps: Omit<TableCardProps, 'dataSource'> = useMemo(
    () => ({
      columns: ['order_ref', 'product_code', 'progress', 'status'],
      sortable: true,
      filterable: showFilters,
      pageSize,
      showHeader: true,
      showPagination: true,
      showFilters,
      showExport,
      showSearch: true,
      showPerformance: false,
      isEditMode,
      className,
      height: 400,
      // 自定義行渲染函數
      onRowClick: (row) => {
        console.log('Order clicked:', row);
      },
    }),
    [showFilters, showExport, pageSize, isEditMode, className]
  );

  return (
    <div className="relative h-full">
      <TableCard
        dataSource="order_state_list"
        {...tableCardProps}
      />
    </div>
  );
};

export default OrderStateCard;