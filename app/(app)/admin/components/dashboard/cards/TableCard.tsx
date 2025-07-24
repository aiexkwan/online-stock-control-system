/**
 * TableCard Component
 * 統一的表格卡片組件，取代原有的6個獨立表格widgets
 * 使用 GraphQL 批量查詢優化性能，支援動態配置
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ensureString } from '@/utils/graphql-types';
import {
  TableDataInput,
  TableCardData,
  TableColumn,
  TableFilters,
  TableSorting,
  TablePagination,
  SortDirection,
  TableDataType,
  FormatterType,
  ColumnAlign,
} from '@/types/generated/graphql';

// GraphQL 查詢
const TABLE_CARD_QUERY = gql`
  query TableCardQuery($input: TableDataInput!) {
    tableCardData(input: $input) {
      data
      columns {
        key
        header
        dataType
        sortable
        filterable
        width
        align
        formatter {
          type
          options
        }
        required
        hidden
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
      filters {
        stringFilters {
          field
          operator
          value
          caseSensitive
        }
        numberFilters {
          field
          operator
          value
          min
          max
        }
        dateFilters {
          field
          operator
          value
          startDate
          endDate
        }
        booleanFilters {
          field
          value
        }
        arrayFilters {
          field
          operator
          values
        }
      }
      sorting {
        sortBy
        sortOrder
        secondarySort {
          sortBy
          sortOrder
        }
      }
      metadata {
        queryTime
        cacheHit
        dataSource
        lastUpdated
        totalRecords
        filteredRecords
        permissions {
          canView
          canEdit
          canDelete
          canCreate
          canExport
          canFilter
          canSort
        }
        generatedAt
      }
      lastUpdated
      refreshInterval
    }
  }
`;

export interface TableCardProps {
  // 數據源配置
  dataSource: string;
  
  // 初始篩選條件
  initialFilters?: TableFilters;
  
  // 初始排序配置
  initialSorting?: TableSorting;
  
  // 分頁配置
  pageSize?: number;
  
  // 時間範圍
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // 搜索關鍵詞
  searchTerm?: string;
  
  // 顯示選項
  showHeader?: boolean;
  showPagination?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  showSearch?: boolean;
  showPerformance?: boolean;
  
  // 樣式
  className?: string;
  height?: number | string;
  
  // 編輯模式
  isEditMode?: boolean;
  
  // 回調
  onRowClick?: (row: any) => void;
  onRowDoubleClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  onExport?: (format: string) => void;
  onRefresh?: () => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  dataSource,
  initialFilters,
  initialSorting,
  pageSize = 20,
  dateRange,
  searchTerm: initialSearchTerm = '',
  showHeader = true,
  showPagination = true,
  showFilters = true,
  showExport = true,
  showSearch = true,
  showPerformance = false,
  className,
  height = 600,
  isEditMode = false,
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  onExport,
  onRefresh,
}) => {
  // 狀態管理
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TableFilters | undefined>(initialFilters);
  const [sorting, setSorting] = useState<TableSorting | undefined>(initialSorting);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 準備查詢輸入
  const queryInput: TableDataInput = useMemo(
    () => ({
      dataSource,
      filters,
      sorting,
      pagination: {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        loadMore: false,
      },
      dateRange: dateRange
        ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        : undefined,
      searchTerm: searchTerm || undefined,
      includeMetadata: true,
    }),
    [dataSource, filters, sorting, currentPage, pageSize, dateRange, searchTerm]
  );

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ tableCardData: TableCardData }>(
    TABLE_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
    }
  );

  // 處理排序
  const handleSort = useCallback((columnKey: string) => {
    setSorting((prevSorting) => {
      if (!prevSorting || prevSorting.sortBy !== columnKey) {
        return {
          sortBy: columnKey,
          sortOrder: SortDirection.Asc,
        };
      }
      
      if (prevSorting.sortOrder === SortDirection.Asc) {
        return {
          sortBy: columnKey,
          sortOrder: SortDirection.Desc,
        };
      }
      
      return undefined; // 清除排序
    });
  }, []);

  // 處理分頁
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 處理行選擇
  const handleRowSelection = useCallback((row: any, selected: boolean) => {
    setSelectedRows((prev) => {
      const newSelection = selected
        ? [...prev, row]
        : prev.filter((r) => r.id !== row.id);
      
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);

  // 處理全選
  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelection = selected ? (data?.tableCardData.data || []) : [];
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  }, [data?.tableCardData.data, onSelectionChange]);

  // 處理刷新
  const handleRefresh = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // 格式化單元格值
  const formatCellValue = useCallback((value: any, column: TableColumn) => {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (column.formatter?.type) {
      case FormatterType.Date:
        return new Date(value).toLocaleDateString();
      case FormatterType.Datetime:
        return new Date(value).toLocaleString();
      case FormatterType.Boolean:
        return value ? 'Yes' : 'No';
      case FormatterType.Currency:
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case FormatterType.Percentage:
        return `${(value * 100).toFixed(1)}%`;
      case FormatterType.Truncate:
        return typeof value === 'string' && value.length > 50
          ? `${value.substring(0, 47)}...`
          : value;
      case FormatterType.Link:
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Link
          </a>
        );
      default:
        return String(value);
    }
  }, []);

  // 渲染表格標題
  const renderTableHeader = () => {
    if (!showHeader || !data?.tableCardData.columns) return null;

    return (
      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
        <tr>
          {showFilters && (
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={selectedRows.length === data.tableCardData.data.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
          )}
          {data.tableCardData.columns
            .filter((col) => !col.hidden)
            .map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                  column.align === ColumnAlign.Center && 'text-center',
                  column.align === ColumnAlign.Right && 'text-right'
                )}
                style={{ width: ensureString(column.width ?? null) || undefined }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <ArrowsUpDownIcon className="w-4 h-4" />
                  )}
                  {sorting?.sortBy === column.key && (
                    <span className="text-blue-500">
                      {sorting.sortOrder === SortDirection.Asc ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
        </tr>
      </thead>
    );
  };

  // 渲染表格行
  const renderTableRows = () => {
    if (!data?.tableCardData.data) return null;

    return (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {data.tableCardData.data.map((row: any, index: number) => (
          <motion.tr
            key={row.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => onRowClick?.(row)}
            onDoubleClick={() => onRowDoubleClick?.(row)}
          >
            {showFilters && (
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.some((r) => r.id === row.id)}
                  onChange={(e) => handleRowSelection(row, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
            )}
            {data.tableCardData.columns
              .filter((col) => !col.hidden)
              .map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                    column.align === ColumnAlign.Center && 'text-center',
                    column.align === ColumnAlign.Right && 'text-right'
                  )}
                >
                  {formatCellValue(row[column.key], column)}
                </td>
              ))}
          </motion.tr>
        ))}
      </tbody>
    );
  };

  // 渲染分頁控制
  const renderPagination = () => {
    if (!showPagination || !data?.tableCardData) return null;

    const { totalPages, currentPage: page, hasNextPage, hasPreviousPage } = data.tableCardData;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, data.tableCardData.totalCount)} of{' '}
            {data.tableCardData.totalCount} results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // 錯誤狀態
  if (error && !data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-lg',
          className
        )}
      >
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700 dark:text-red-300">
          Failed to load table: {error.message}
        </span>
      </div>
    );
  }

  // 加載狀態
  if (loading && !data) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg" style={{ height }} />
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden', className)}>
      {/* 表格工具欄 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {data?.tableCardData.metadata.dataSource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          {showSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
          )}
          {showExport && data?.tableCardData.metadata.permissions.canExport && (
            <button
              onClick={() => onExport?.('csv')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 性能指標（可選） */}
      {showPerformance && data?.tableCardData.metadata && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800">
          <span>Query Time: {data.tableCardData.metadata.queryTime}ms</span>
          <span>Cache: {data.tableCardData.metadata.cacheHit ? 'Hit' : 'Miss'}</span>
          <span>Records: {data.tableCardData.metadata.filteredRecords}/{data.tableCardData.metadata.totalRecords}</span>
          <span>Updated: {new Date(data.tableCardData.metadata.lastUpdated).toLocaleTimeString()}</span>
        </div>
      )}

      {/* 表格容器 */}
      <div className="overflow-auto" style={{ maxHeight: height }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {renderTableHeader()}
          {renderTableRows()}
        </table>
      </div>

      {/* 分頁控制 */}
      {renderPagination()}

      {/* 空數據狀態 */}
      {data?.tableCardData.data.length === 0 && (
        <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No data found</div>
            <div className="text-sm">Try adjusting your filters or search terms</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 導出類型，方便其他組件使用
export type { TableDataInput, TableCardData, TableColumn } from '@/types/generated/graphql';