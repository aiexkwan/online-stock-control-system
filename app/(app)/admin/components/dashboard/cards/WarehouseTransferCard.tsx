/**
 * WarehouseTransferCard Component
 * 遷移自 WarehouseTransferListWidget，使用統一的 TableCard 架構
 * 顯示 warehouse transfer 記錄的表格卡片
 */

'use client';

import React, { useMemo } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Clock, Box, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
import { useWidgetDateRange } from '../widgets/common/filters/DateRangeFilter';

interface TransferRecord {
  id: string;
  tran_date: string;
  plt_num: string;
  operator_name: string;
}

export interface WarehouseTransferCardProps extends BaseCardProps {
  widget?: any; // 可選的 widget 配置
  title?: string;
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
}

export const WarehouseTransferCard: React.FC<WarehouseTransferCardProps> = ({
  widget,
  isEditMode = false,
  timeFrame,
  title = 'Warehouse Transfers',
  showFilters = false,
  showExport = true,
  pageSize = 50,
  className,
}) => {
  // 使用通用 hook 處理日期範圍
  const dateRange = useWidgetDateRange(timeFrame, 'yesterday');

  // 配置 TableCard 屬性
  const tableCardProps: Omit<TableCardProps, 'dataSource'> = useMemo(
    () => ({
      columns: ['tran_date', 'plt_num', 'operator_name'],
      sortable: true,
      filterable: showFilters,
      pageSize,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      showHeader: true,
      showPagination: true,
      showFilters,
      showExport,
      showSearch: true,
      showPerformance: false,
      isEditMode,
      className,
      height: 400,
    }),
    [dateRange, showFilters, showExport, pageSize, isEditMode, className]
  );

  return (
    <div className="relative h-full">
      <TableCard
        dataSource="warehouse_transfers"
        {...tableCardProps}
      />
    </div>
  );
};

export default WarehouseTransferCard;