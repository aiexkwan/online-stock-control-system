/**
 * ListCard Component
 * 統一的列表卡片組件，取代原有的4個獨立列表widgets
 * 使用 GraphQL 批量查詢優化性能，支援動態配置
 * 
 * 支援的List類型：
 * - ORDER_STATE: 訂單狀態列表
 * - ORDER_RECORD: 訂單記錄列表  
 * - WAREHOUSE_TRANSFER: 倉庫轉移列表
 * - OTHER_FILES: 其他文件列表
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  TruckIcon,
  FolderIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ensureString } from '@/utils/graphql-types';
import { DataTable, DataTableColumn } from '../widgets/common/data-display/DataTable';
import { Progress } from '@/components/ui/progress';
import {
  ListType,
  ListCardInput,
  ListDataUnion,
  OrderStateList,
  OrderRecordList,
  WarehouseTransferList,
  OtherFilesList,
  ListFilters,
  SortInput,
  PaginationInput,
  DateRangeInput,
  OrderState,
  OrderRecord,
  Transfer,
  FileRecord,
  StatusSummary,
  OrderProgressMetrics,
  OrderRecordAnalytics,
  StatusDistribution,
  TransferPerformanceMetrics,
  FileCategorySummary,
  StorageMetrics,
} from '@/types/generated/graphql';

// GraphQL 查詢
const LIST_CARD_QUERY = gql`
  query ListCardQuery($input: ListCardInput!) {
    listCardData(input: $input) {
      ... on OrderStateList {
        id
        listType
        title
        description
        totalCount
        filteredCount
        lastUpdated
        dataSource
        orders(first: 50) {
          edges {
            node {
              order {
                id
                orderNumber
                customerCode
                status
                orderDate
              }
              currentStage
              progress
              isUrgent
              estimatedCompletion
            }
          }
          totalCount
        }
        statusSummary {
          status
          count
          percentage
          averageProcessingTime
          urgentCount
        }
        progressMetrics {
          totalInProgress
          averageCompletionRate
          bottleneckStage
          predictedCompletionTime
        }
      }
      
      ... on OrderRecordList {
        id
        listType
        title
        description
        totalCount
        filteredCount
        lastUpdated
        dataSource
        records(first: 50) {
          edges {
            node {
              order {
                id
                orderNumber
                customerCode
              }
              recordType
              timestamp
              performedBy {
                id
                name
                email
              }
              details
            }
          }
          totalCount
        }
        analytics {
          averageOrderCycle
          commonBottlenecks
          performanceMetrics
        }
      }
      
      ... on WarehouseTransferList {
        id
        listType
        title
        description
        totalCount
        filteredCount
        lastUpdated
        dataSource
        transfers(first: 50) {
          edges {
            node {
              id
              transferNumber
              pltNum
              fromLocation {
                id
                code
                name
              }
              toLocation {
                id
                code
                name
              }
              status
              requestedAt
              completedAt
            }
          }
          totalCount
        }
        statusDistribution {
          status
          count
          percentage
          averageDuration
        }
        performanceMetrics {
          averageTransferTime
          onTimePercentage
          delayedCount
          efficiencyScore
        }
      }
      
      ... on OtherFilesList {
        id
        listType
        title
        description
        totalCount
        filteredCount
        lastUpdated
        dataSource
        files(first: 50) {
          edges {
            node {
              id
              fileName
              fileType
              fileCategory
              size
              status
              uploadedAt
              uploadedBy {
                id
                name
                email
              }
              url
              thumbnailUrl
            }
          }
          totalCount
        }
        categorySummary {
          category
          count
          totalSize
          averageSize
          recentCount
        }
        storageMetrics {
          totalSize
          totalFiles
          averageFileSize
          storageUtilization
          growthRate
        }
      }
    }
  }
`;

// 類型定義
type ListNodeType = OrderState | OrderRecord | Transfer | FileRecord;

// Metadata 類型定義
type OrderStateMetadata = {
  totalCount: number;
  filteredCount: number;
  statusSummary?: StatusSummary[];
  progressMetrics?: OrderProgressMetrics;
};

type OrderRecordMetadata = {
  totalCount: number;
  filteredCount: number;
  analytics?: OrderRecordAnalytics;
};

type WarehouseTransferMetadata = {
  totalCount: number;
  filteredCount: number;
  statusDistribution?: StatusDistribution[];
  performanceMetrics?: TransferPerformanceMetrics;
};

type OtherFilesMetadata = {
  totalCount: number;
  filteredCount: number;
  categorySummary?: FileCategorySummary[];
  storageMetrics?: StorageMetrics;
};

type ListMetadata = OrderStateMetadata | OrderRecordMetadata | WarehouseTransferMetadata | OtherFilesMetadata;

// 類型守衛函數
function isOrderState(item: ListNodeType): item is OrderState {
  return 'currentStage' in item && 'progress' in item;
}

function isOrderRecord(item: ListNodeType): item is OrderRecord {
  return 'recordType' in item && 'timestamp' in item;
}

function isTransfer(item: ListNodeType): item is Transfer {
  return 'fromLocation' in item && 'toLocation' in item && 'pallet' in item;
}

function isFileRecord(item: ListNodeType): item is FileRecord {
  return 'fileName' in item && 'fileType' in item && 'fileCategory' in item;
}

// ListCard 組件 Props
export interface ListCardProps {
  // List 類型配置
  listType: ListType;
  
  // 篩選和排序
  initialFilters?: ListFilters;
  initialSort?: SortInput;
  
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
  showMetrics?: boolean;
  showRefreshButton?: boolean;
  showPerformance?: boolean;
  
  // 樣式
  className?: string;
  height?: number | string;
  
  // 編輯模式
  isEditMode?: boolean;
  
  // 回調
  onRowClick?: (item: ListNodeType) => void;
  onRefresh?: () => void;
}

export const ListCard: React.FC<ListCardProps> = ({
  listType,
  initialFilters,
  initialSort,
  pageSize = 50,
  dateRange,
  searchTerm: initialSearchTerm = '',
  showHeader = true,
  showMetrics = true,
  showRefreshButton = true,
  showPerformance = false,
  className,
  height = 600,
  isEditMode = false,
  onRowClick,
  onRefresh,
}) => {
  // 狀態管理
  const [filters, setFilters] = useState<ListFilters | undefined>(initialFilters);
  const [sort, setSort] = useState<SortInput | undefined>(initialSort);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // 準備查詢輸入
  const queryInput: ListCardInput = useMemo(
    () => ({
      listType,
      filters: {
        ...filters,
        search: searchTerm || undefined,
      },
      pagination: {
        limit: pageSize,
        offset: 0,
        loadMore: false,
      },
      sort,
      dateRange: dateRange
        ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        : undefined,
      includeMetrics: showMetrics,
    }),
    [listType, filters, sort, pageSize, dateRange, searchTerm, showMetrics]
  );

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ listCardData: ListDataUnion }>(
    LIST_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      skip: isEditMode,
    }
  );

  // 處理刷新
  const handleRefresh = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // 根據listType獲取適當的圖標和顏色
  const getListConfig = useCallback((type: ListType) => {
    switch (type) {
      case ListType.OrderState:
        return {
          icon: ClipboardDocumentListIcon,
          color: 'from-blue-500 to-cyan-500',
          title: 'Order Progress',
        };
      case ListType.OrderRecord:
        return {
          icon: DocumentTextIcon,
          color: 'from-green-500 to-emerald-500',
          title: 'Order Records',
        };
      case ListType.WarehouseTransfer:
        return {
          icon: TruckIcon,
          color: 'from-orange-500 to-amber-500',
          title: 'Warehouse Transfers',
        };
      case ListType.OtherFiles:
        return {
          icon: FolderIcon,
          color: 'from-purple-500 to-violet-500',
          title: 'Other Files',
        };
      default:
        return {
          icon: ClipboardDocumentListIcon,
          color: 'from-gray-500 to-slate-500',
          title: 'List Data',
        };
    }
  }, []);

  // 為不同類型的數據創建columns
  const getColumnsForType = useCallback((type: ListType, listData: ListDataUnion): DataTableColumn[] => {
    switch (type) {
      case ListType.OrderState:
        return [
          {
            key: 'orderNumber',
            header: 'Order',
            icon: ClipboardDocumentListIcon,
            width: '25%',
            render: (_, item: ListNodeType) => {
              if (!isOrderState(item)) return null;
              const order = item.order;
              const progress = item.progress || 0;
              const isUrgent = item.isUrgent;
              
              return (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 flex-shrink-0 rounded-full',
                      isUrgent ? 'bg-red-400' : progress >= 75 ? 'bg-green-400' : progress >= 50 ? 'bg-orange-400' : 'bg-yellow-400'
                    )}
                  />
                  <span className="font-medium text-white">{order?.orderNumber || ''}</span>
                </div>
              );
            },
          },
          {
            key: 'customerCode',
            header: 'Customer',
            width: '25%',
            render: (_, item: ListNodeType) => {
              if (!isOrderState(item)) return null;
              return <div className="text-white">{item.order?.customerCode || ''}</div>;
            },
          },
          {
            key: 'progress',
            header: 'Progress',
            width: '30%',
            render: (_, item: ListNodeType) => {
              if (!isOrderState(item)) return null;
              const progress = item.progress || 0;
              const stage = item.currentStage || '';
              
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{stage}</span>
                    <span className="font-medium text-white">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            width: '20%',
            align: 'center',
            render: (_, item: ListNodeType) => {
              if (!isOrderState(item)) return null;
              const progress = item.progress || 0;
              const isUrgent = item.isUrgent;
              
              if (progress >= 100) {
                return <TruckIcon className="h-4 w-4 text-green-400 mx-auto" />;
              }
              
              if (isUrgent) {
                return <span className="text-xs font-medium text-red-400">Urgent</span>;
              }
              
              return (
                <span className="text-xs font-medium text-orange-400">
                  {progress >= 75 ? 'Almost' : 'In Progress'}
                </span>
              );
            },
          },
        ];

      case ListType.OrderRecord:
        return [
          {
            key: 'orderNumber',
            header: 'Order',
            width: '20%',
            render: (_, item: ListNodeType) => {
              if (!isOrderRecord(item)) return null;
              return <span className="font-medium text-white">{item.order?.orderNumber || ''}</span>;
            },
          },
          {
            key: 'recordType',
            header: 'Type',
            width: '15%',
            render: (value) => (
              <span className="text-xs font-medium text-blue-400">{String(value || '')}</span>
            ),
          },
          {
            key: 'timestamp',
            header: 'Time',
            width: '20%',
            render: (value) => (
              <span className="text-sm text-slate-300">
                {value ? new Date(String(value)).toLocaleString() : ''}
              </span>
            ),
          },
          {
            key: 'performedBy',
            header: 'Operator',
            width: '20%',
            render: (_, item: ListNodeType) => {
              if (!isOrderRecord(item)) return null;
              return (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-white">{item.performedBy?.name || ''}</span>
                </div>
              );
            },
          },
          {
            key: 'details',
            header: 'Details',
            width: '25%',
            render: (value) => (
              <span className="text-sm text-slate-400 truncate">
                {value ? JSON.stringify(value).substring(0, 50) : ''}
              </span>
            ),
          },
        ];

      case ListType.WarehouseTransfer:
        return [
          {
            key: 'id',
            header: 'Transfer ID',
            width: '15%',
            render: (value) => (
              <span className="font-medium text-white">{String(value || '')}</span>
            ),
          },
          {
            key: 'pallet',
            header: 'Pallet',
            width: '15%',
            render: (_, item: ListNodeType) => {
              if (!isTransfer(item)) return null;
              return <span className="text-white">{item.pallet?.pltNum || ''}</span>;
            },
          },
          {
            key: 'fromLocation',
            header: 'From',
            width: '20%',
            render: (_, item: ListNodeType) => {
              if (!isTransfer(item)) return null;
              return <span className="text-slate-300">{item.fromLocation?.name || ''}</span>;
            },
          },
          {
            key: 'toLocation',
            header: 'To',
            width: '20%',
            render: (_, item: ListNodeType) => {
              if (!isTransfer(item)) return null;
              return <span className="text-slate-300">{item.toLocation?.name || ''}</span>;
            },
          },
          {
            key: 'status',
            header: 'Status',
            width: '15%',
            render: (value) => (
              <span className={cn(
                'text-xs font-medium',
                value === 'COMPLETED' ? 'text-green-400' :
                value === 'IN_PROGRESS' ? 'text-orange-400' :
                value === 'PENDING' ? 'text-yellow-400' : 'text-slate-400'
              )}>
                {String(value || '')}
              </span>
            ),
          },
          {
            key: 'requestedAt',
            header: 'Time',
            width: '15%',
            render: (_, item: ListNodeType) => {
              if (!isTransfer(item)) return null;
              const date = item.requestedAt;
              return (
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-300">
                    {date ? new Date(String(date)).toLocaleDateString() : ''}
                  </span>
                </div>
              );
            },
          },
        ];

      case ListType.OtherFiles:
        return [
          {
            key: 'fileName',
            header: 'File Name',
            width: '30%',
            render: (value) => (
              <span className="font-medium text-white truncate">{String(value || '')}</span>
            ),
          },
          {
            key: 'fileType',
            header: 'Type',
            width: '10%',
            render: (value) => (
              <span className="text-xs font-medium text-blue-400">{String(value || '')}</span>
            ),
          },
          {
            key: 'fileCategory',
            header: 'Category',
            width: '15%',
            render: (value) => (
              <span className="text-xs text-slate-300">{String(value || '')}</span>
            ),
          },
          {
            key: 'size',
            header: 'Size',
            width: '10%',
            render: (value) => {
              const bytes = Number(value || 0);
              const mb = bytes / (1024 * 1024);
              return <span className="text-xs text-slate-400">{mb.toFixed(1)}MB</span>;
            },
          },
          {
            key: 'uploadedBy',
            header: 'Uploaded By',
            width: '15%',
            render: (_, item: ListNodeType) => {
              if (!isFileRecord(item)) return null;
              return <span className="text-sm text-slate-300">{item.uploadedBy?.name || ''}</span>;
            },
          },
          {
            key: 'uploadedAt',
            header: 'Upload Date',
            width: '20%',
            render: (value) => (
              <span className="text-sm text-slate-300">
                {value ? new Date(String(value)).toLocaleDateString() : ''}
              </span>
            ),
          },
        ];

      default:
        return [];
    }
  }, []);

  // 獲取當前列表的數據和列配置
  const { tableData, columns, config, metadata } = useMemo(() => {
    if (!data?.listCardData) {
      return { tableData: [], columns: [], config: getListConfig(listType), metadata: null };
    }

    const listData = data.listCardData;
    const config = getListConfig(listType);
    const columns = getColumnsForType(listType, listData);

    // 根據類型提取實際的表格數據
    let tableData: ListNodeType[] = [];
    let metadata: ListMetadata | null = null;

    switch (listType) {
      case ListType.OrderState:
        const orderStateList = listData as OrderStateList;
        tableData = orderStateList.orders?.edges?.map(edge => edge.node) || [];
        metadata = {
          totalCount: orderStateList.totalCount,
          filteredCount: orderStateList.filteredCount,
          statusSummary: orderStateList.statusSummary,
          progressMetrics: orderStateList.progressMetrics,
        };
        break;

      case ListType.OrderRecord:
        const orderRecordList = listData as OrderRecordList;
        tableData = orderRecordList.records?.edges?.map(edge => edge.node) || [];
        metadata = {
          totalCount: orderRecordList.totalCount,
          filteredCount: orderRecordList.filteredCount,
          analytics: orderRecordList.analytics,
        };
        break;

      case ListType.WarehouseTransfer:
        const warehouseTransferList = listData as WarehouseTransferList;
        tableData = warehouseTransferList.transfers?.edges?.map(edge => edge.node) || [];
        metadata = {
          totalCount: warehouseTransferList.totalCount,
          filteredCount: warehouseTransferList.filteredCount,
          statusDistribution: warehouseTransferList.statusDistribution,
          performanceMetrics: warehouseTransferList.performanceMetrics,
        };
        break;

      case ListType.OtherFiles:
        const otherFilesList = listData as OtherFilesList;
        tableData = otherFilesList.files?.edges?.map(edge => edge.node) || [];
        metadata = {
          totalCount: otherFilesList.totalCount,
          filteredCount: otherFilesList.filteredCount,
          categorySummary: otherFilesList.categorySummary,
          storageMetrics: otherFilesList.storageMetrics,
        };
        break;
    }

    return { tableData, columns, config, metadata };
  }, [data, listType, getListConfig, getColumnsForType]);

  // Edit mode - 顯示空白狀態
  if (isEditMode) {
    return (
      <div className={cn('w-full', className)}>
        <DataTable
          title={config.title}
          icon={config.icon}
          iconColor={config.color}
          data={[]}
          columns={[]}
          empty={true}
          emptyMessage={`${config.title} - Edit Mode`}
          emptyIcon={config.icon}
        />
      </div>
    );
  }

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
          Failed to load {config.title}: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <DataTable
        title={data?.listCardData.title || config.title}
        subtitle={metadata ? `${metadata.filteredCount} of ${metadata.totalCount} items` : undefined}
        icon={config.icon}
        iconColor={config.color}
        data={tableData}
        columns={columns}
        keyField="id"
        loading={loading}
        error={error}
        empty={tableData.length === 0}
        emptyMessage={`No ${config.title.toLowerCase()} found`}
        emptyIcon={config.icon}
        onRowClick={onRowClick}
        onRefresh={showRefreshButton ? handleRefresh : undefined}
        showRefreshButton={showRefreshButton}
        animate={true}
        className="h-full"
        performanceMetrics={showPerformance ? {
          source: 'GraphQL',
          optimized: true,
          mode: 'Unified ListCard',
        } : undefined}
        connectionStatus={{
          type: 'realtime',
          label: '🚀 GraphQL',
        }}
        pagination={{
          enabled: false, // 固定顯示配置的pageSize數量
        }}
      />
    </div>
  );
};

// 導出類型，方便其他組件使用
export type { 
  ListType, 
  ListCardInput, 
  ListDataUnion,
  OrderStateList,
  OrderRecordList,
  WarehouseTransferList,
  OtherFilesList 
} from '@/types/generated/graphql';