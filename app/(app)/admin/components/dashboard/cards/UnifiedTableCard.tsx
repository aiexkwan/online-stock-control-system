/**
 * UnifiedTableCard Component
 * 遷移自 UnifiedTableWidget，使用統一的 TableCard 架構
 * 提供通用的表格數據顯示功能
 */

'use client';

import React, { useMemo } from 'react';
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

export interface UnifiedTableCardProps extends BaseCardProps {
  widget?: any; // 可選的 widget 配置
  // 從原始 UnifiedTableWidget 的 config 屬性中提取
  config?: {
    title?: string;
    dataSource?: string;
    description?: string;
  };
  title?: string;
  dataSource?: string;
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
  // 從原始的 props 保留
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
}

export const UnifiedTableCard: React.FC<UnifiedTableCardProps> = ({
  widget,
  isEditMode = false,
  timeFrame,
  config,
  title,
  dataSource,
  showFilters = true,
  showExport = true,
  pageSize = 10,
  className,
  dateRange: propDateRange,
  warehouse,
}) => {
  // 確定數據源和標題
  const finalDataSource = dataSource || config?.dataSource || 'unified_table';
  const finalTitle = title || config?.title || 'Unified Table';

  // 轉換日期範圍格式
  const processedDateRange = useMemo(() => {
    if (propDateRange) {
      return {
        start: new Date(propDateRange.start),
        end: new Date(propDateRange.end),
      };
    }
    if (timeFrame) {
      return {
        start: timeFrame.start,
        end: timeFrame.end,
      };
    }
    return undefined;
  }, [propDateRange, timeFrame]);

  // 配置 TableCard 屬性
  const tableCardProps: Omit<TableCardProps, 'dataSource'> = useMemo(
    () => ({
      sortable: true,
      filterable: showFilters,
      pageSize,
      dateRange: processedDateRange,
      showHeader: true,
      showPagination: true,
      showFilters,
      showExport,
      showSearch: true,
      showPerformance: false,
      isEditMode,
      className,
      height: 400,
      // 如果有 warehouse 參數，加入搜索詞
      searchTerm: warehouse ? `warehouse:${warehouse}` : undefined,
    }),
    [showFilters, showExport, pageSize, isEditMode, className, processedDateRange, warehouse]
  );

  return (
    <div className="relative h-full">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {finalTitle}
        </h3>
        {config?.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {config.description}
          </p>
        )}
      </div>
      <TableCard
        dataSource={finalDataSource}
        {...tableCardProps}
      />
    </div>
  );
};

export default UnifiedTableCard;