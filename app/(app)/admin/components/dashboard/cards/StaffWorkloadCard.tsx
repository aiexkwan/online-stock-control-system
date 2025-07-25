/**
 * StaffWorkloadCard Component
 * 遷移自 StaffWorkloadWidget，使用統一的 TableCard 架構
 * 將原本的圖表顯示轉換為表格形式顯示員工工作量數據
 */

'use client';

import React, { useMemo } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
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

interface StaffWorkloadRecord {
  id: string;
  work_date: string;
  staff_name: string;
  action_count: number;
  department: string;
}

export interface StaffWorkloadCardProps extends BaseCardProps {
  widget?: any; // 可選的 widget 配置
  title?: string;
  department?: string;
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
}

export const StaffWorkloadCard: React.FC<StaffWorkloadCardProps> = ({
  widget,
  isEditMode = false,
  timeFrame,
  title = 'Staff Workload',
  department = 'Injection',
  showFilters = true,
  showExport = true,
  pageSize = 20,
  className,
}) => {
  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 默認使用過去7天
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      return { start: startDate, end: endDate };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

  // 配置 TableCard 屬性
  const tableCardProps: Omit<TableCardProps, 'dataSource'> = useMemo(
    () => ({
      columns: ['work_date', 'staff_name', 'action_count', 'department'],
      sortable: true,
      filterable: showFilters,
      initialSorting: {
        sortBy: 'work_date',
        sortOrder: 'DESC' as any,
      },
      pageSize,
      dateRange,
      showHeader: true,
      showPagination: true,
      showFilters,
      showExport,
      showSearch: true,
      showPerformance: true,
      isEditMode,
      className,
      height: 400,
      // 根據部門過濾數據
      searchTerm: department ? `department:${department}` : undefined,
    }),
    [dateRange, showFilters, showExport, pageSize, isEditMode, className, department]
  );

  if (isEditMode) {
    return (
      <div className="relative h-full">
        <div className="mb-2 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {department} Department Staff Workload Table
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="mb-2 flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {department} Department - From {format(dateRange.start, 'MMM d')} to{' '}
          {format(dateRange.end, 'MMM d')}
        </span>
      </div>
      <TableCard
        dataSource="staff_workload"
        {...tableCardProps}
      />
    </div>
  );
};

export default StaffWorkloadCard;