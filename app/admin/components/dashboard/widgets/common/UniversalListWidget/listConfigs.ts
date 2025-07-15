/**
 * List Widget Configurations
 * 為 5 個現有 List Widgets 創建統一配置
 */

import React from 'react';
import {
  DocumentArrowUpIcon,
  FolderOpenIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { cn } from '@/lib/utils';

// Note: GraphQL Documents removed - migrated to REST API

// Server Actions
import { ordersAPI } from '@/lib/api/modules/OrdersAPI';
import { createDashboardAPIClient } from '@/lib/api/admin/DashboardAPI.client';
import { getPdfUrl } from '@/lib/api/modules/ordersActions';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

// Types
import type {
  UniversalListWidgetConfig,
  CreateListConfigFunction,
  OrderItem,
  TransferItem,
  FileItem,
  ProductionItem,
} from './types';
import type { DataTableColumn } from '../data-display/DataTable';

// ================================
// Helper Functions
// ================================

/**
 * 格式化時間戳
 */
function formatTime(timestamp: string): string {
  try {
    const date = fromDbTime(timestamp);
    return format(date, 'dd MMM yyyy HH:mm');
  } catch {
    return 'Unknown';
  }
}


// ================================
// 1. Orders List Widget Configuration
// ================================

export const OrdersListConfig: CreateListConfigFunction<OrderItem> = (overrides = {}) => ({
  // 數據源配置
  dataSource: {
    graphqlQuery: GetOrdersListDocument,
    serverAction: async (variables: { limit: number; offset: number }) => {
      const response = await ordersAPI.getOrdersList(variables.limit || 15, variables.offset || 0);
      return response.orders;
    },
    variables: { limit: 15, offset: 0 },
    extractFromContext: (ctx) => ctx?.getWidgetData?.('orders-list'),
    transform: (data: any) => {
      if (data && 'record_historyCollection' in data) {
        // GraphQL response
        const edges = data.record_historyCollection?.edges || [];
        return edges.map((edge: any) => ({
          uuid: edge.node.uuid,
          time: edge.node.time,
          id: edge.node.id,
          action: edge.node.action,
          plt_num: edge.node.plt_num,
          loc: edge.node.loc,
          remark: edge.node.remark,
          uploader_name: edge.node.data_id?.name || 
            (edge.node.id ? `User ${edge.node.id}` : 'Unknown'),
          doc_url: null,
        }));
      }
      return data?.orders || data || [];
    },
  },

  // 顯示配置
  display: {
    title: 'Order Upload History',
    icon: DocumentArrowUpIcon,
    iconColor: 'from-blue-500 to-cyan-500',
    keyField: 'uuid',
    emptyMessage: 'No orders uploaded',
    emptyIcon: DocumentArrowUpIcon,
    columns: [
      {
        key: 'time',
        header: 'Date',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-cyan-300' 
          }, formatTime(value))
        ),
      },
      {
        key: 'remark',
        header: 'Order Ref',
        align: 'center',
        render: (value: string, item: any) => {
          // PDF 開啟按鈕 - 簡化版本，避免 hooks 規則違反
          return React.createElement('button', {
            onClick: async (e: React.MouseEvent) => {
              e.stopPropagation();
              // 直接調用 PDF 開啟功能，不使用本地狀態
              try {
                const pdfUrl = await getPdfUrl(value);
                if (pdfUrl) {
                  window.open(pdfUrl, '_blank');
                  errorHandler.handleSuccess(
                    `PDF opened for order ${value}`,
                    { component: 'UniversalListWidget', action: 'open_pdf' }
                  );
                } else {
                  errorHandler.handleWarning(`No PDF found for order ${value}`, {
                    component: 'UniversalListWidget',
                    action: 'open_pdf',
                  });
                }
              } catch (error) {
                errorHandler.handleApiError(
                  error as Error,
                  { component: 'UniversalListWidget', action: 'open_pdf' },
                  'Error opening PDF. Please try again.'
                );
              }
            },
            disabled: item.uploader_name === 'Loading...',
            className: cn(
              'truncate text-center text-xs text-cyan-400',
              'transition-colors hover:text-cyan-300 hover:underline',
              'flex items-center justify-center gap-1',
              'disabled:cursor-not-allowed disabled:opacity-50'
            ),
            title: `Click to open PDF for order ${value}`,
          }, React.createElement('span', {
            className: 'flex items-center gap-1'
          }, value));
        },
      },
      {
        key: 'uploader_name',
        header: 'Upload By',
        align: 'right',
        render: (value: string, item: any) => (
          React.createElement('span', {
            className: 'truncate text-right text-xs text-cyan-300'
          }, value || item.id || 'Unknown')
        ),
      },
    ] as DataTableColumn<OrderItem>[],
  },

  // 分頁配置
  pagination: {
    type: 'infinite',
    pageSize: 15,
    maxPages: 10,
  },

  // 實時更新配置
  realtime: {
    enabled: true,
    pollInterval: 30000,
    refetchOnWindowFocus: true,
  },

  // 交互配置
  interaction: {
    rowClickable: true,
    onRowClick: (item: OrderItem) => {
      // PDF 開啟功能在列內部處理
    },
    refreshable: true,
    editMode: {
      enabled: true,
      mockData: [
        { uuid: '1', time: new Date().toISOString(), remark: 'ORD-001', uploader_name: 'Demo User' },
        { uuid: '2', time: new Date().toISOString(), remark: 'ORD-002', uploader_name: 'Demo User' },
      ] as OrderItem[],
      placeholder: 'Edit Mode - Order History',
    },
  },

  // 性能配置
  performance: {
    progressiveLoading: true,
    memoization: true,
    caching: { enabled: true, duration: 5 * 60 * 1000 },
  },

  ...overrides,
});

// ================================
// 2. Other Files List Widget Configuration
// ================================

export const OtherFilesListConfig: CreateListConfigFunction<FileItem> = (overrides = {}) => ({
  // 數據源配置
  dataSource: {
    graphqlQuery: GetOtherFilesListDocument,
    serverAction: async (variables: any) => {
      const api = createDashboardAPIClient();
      return api.getOtherFilesList(variables);
    },
    variables: { limit: 20, offset: 0 },
    extractFromContext: (ctx) => ctx?.getWidgetData?.('other-files-list'),
  },

  // 顯示配置
  display: {
    title: 'Other Files',
    icon: FolderOpenIcon,
    iconColor: 'from-green-500 to-blue-500',
    keyField: 'id',
    emptyMessage: 'No files available',
    emptyIcon: FolderOpenIcon,
    columns: [
      {
        key: 'fileName',
        header: 'File Name',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-sm font-medium text-white truncate' 
          }, value)
        ),
      },
      {
        key: 'fileType',
        header: 'Type',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', {
            className: cn(
              'px-2 py-1 text-xs rounded-full',
              value.toLowerCase() === 'pdf' ? 'bg-red-500/20 text-red-400' :
              value.toLowerCase() === 'excel' ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            )
          }, value.toUpperCase())
        ),
      },
      {
        key: 'uploadDate',
        header: 'Upload Date',
        align: 'right',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, formatTime(value))
        ),
      },
      {
        key: 'size',
        header: 'Size',
        align: 'right',
        render: (value: number) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-400' 
          }, value ? `${(value / 1024).toFixed(1)} KB` : 'Unknown')
        ),
      },
    ] as DataTableColumn<FileItem>[],
  },

  pagination: { type: 'infinite', pageSize: 20 },
  realtime: { enabled: true, pollInterval: 60000 },
  interaction: {
    rowClickable: true,
    onRowClick: (item: FileItem) => {
      if (item.url) {
        window.open(item.url, '_blank');
      }
    },
    refreshable: true,
  },

  ...overrides,
});

// ================================
// 3. Warehouse Transfer List Widget Configuration
// ================================

export const WarehouseTransferListConfig: CreateListConfigFunction<TransferItem> = (overrides = {}) => ({
  // 數據源配置
  dataSource: {
    graphqlQuery: GetWarehouseTransferListDocument,
    serverAction: async (variables: any) => {
      const api = createDashboardAPIClient();
      return api.getWarehouseTransferList(variables);
    },
    variables: { limit: 20, offset: 0 },
    extractFromContext: (ctx) => ctx?.getWidgetData?.('warehouse-transfer-list'),
  },

  // 顯示配置
  display: {
    title: 'Warehouse Transfer List',
    icon: ArrowsRightLeftIcon,
    iconColor: 'from-purple-500 to-pink-500',
    keyField: 'id',
    emptyMessage: 'No transfers found',
    emptyIcon: ArrowsRightLeftIcon,
    columns: [
      {
        key: 'transferNumber',
        header: 'Transfer #',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-sm font-mono text-purple-300' 
          }, value)
        ),
      },
      {
        key: 'fromLocation',
        header: 'From',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, value)
        ),
      },
      {
        key: 'toLocation',
        header: 'To',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, value)
        ),
      },
      {
        key: 'quantity',
        header: 'Qty',
        align: 'center',
        render: (value: number) => (
          React.createElement('span', { 
            className: 'text-sm font-semibold text-blue-300' 
          }, value?.toLocaleString() || '0')
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', {
            className: cn(
              'px-2 py-1 text-xs rounded-full font-medium',
              value === 'completed' ? 'bg-green-500/20 text-green-400' :
              value === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              value === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            )
          }, value?.replace('_', ' ').toUpperCase() || 'UNKNOWN')
        ),
      },
      {
        key: 'date',
        header: 'Date',
        align: 'right',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, formatTime(value))
        ),
      },
    ] as DataTableColumn<TransferItem>[],
  },

  pagination: { type: 'infinite', pageSize: 20 },
  realtime: { enabled: true, pollInterval: 30000 },
  interaction: { refreshable: true },

  ...overrides,
});

// ================================
// 4. Order State List Widget Configuration
// ================================

export const OrderStateListConfig: CreateListConfigFunction<OrderItem> = (overrides = {}) => ({
  // 數據源配置
  dataSource: {
    graphqlQuery: GetOrderStateListDocument,
    serverAction: async (variables: any) => {
      const api = createDashboardAPIClient();
      return api.getOrderStateList(variables);
    },
    variables: { limit: 20, offset: 0 },
    extractFromContext: (ctx) => ctx?.getWidgetData?.('order-state-list'),
  },

  // 顯示配置
  display: {
    title: 'Order State List',
    icon: ClipboardDocumentListIcon,
    iconColor: 'from-orange-500 to-red-500',
    keyField: 'id',
    emptyMessage: 'No orders found',
    emptyIcon: ClipboardDocumentListIcon,
    columns: [
      {
        key: 'orderNumber',
        header: 'Order #',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-sm font-mono text-orange-300' 
          }, value)
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-sm text-white truncate' 
          }, value || 'Unknown')
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', {
            className: cn(
              'px-2 py-1 text-xs rounded-full font-medium',
              value === 'completed' ? 'bg-green-500/20 text-green-400' :
              value === 'processing' ? 'bg-blue-500/20 text-blue-400' :
              value === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              value === 'cancelled' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            )
          }, value?.toUpperCase() || 'UNKNOWN')
        ),
      },
      {
        key: 'progress',
        header: 'Progress',
        align: 'center',
        render: (value: number) => (
          React.createElement('div', { className: 'flex items-center gap-2' }, [
            React.createElement('div', {
              key: 'bar',
              className: 'w-16 h-2 bg-gray-700 rounded-full overflow-hidden'
            }, React.createElement('div', {
              className: 'h-full bg-blue-500 transition-all duration-300',
              style: { width: `${value || 0}%` }
            })),
            React.createElement('span', {
              key: 'text',
              className: 'text-xs text-gray-300'
            }, `${value || 0}%`)
          ])
        ),
      },
      {
        key: 'date',
        header: 'Created',
        align: 'right',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, formatTime(value))
        ),
      },
    ] as DataTableColumn<OrderItem>[],
  },

  pagination: { type: 'infinite', pageSize: 20 },
  realtime: { enabled: true, pollInterval: 30000 },
  interaction: { refreshable: true },

  ...overrides,
});

// ================================
// 5. Production Details Widget Configuration
// ================================

export const ProductionDetailsConfig: CreateListConfigFunction<ProductionItem> = (overrides = {}) => ({
  // 數據源配置
  dataSource: {
    graphqlQuery: GetProductionDetailsDocument,
    serverAction: async (variables: any) => {
      const api = createDashboardAPIClient();
      return api.getProductionDetails(variables);
    },
    variables: { limit: 20, offset: 0 },
    extractFromContext: (ctx) => ctx?.getWidgetData?.('production-details'),
  },

  // 顯示配置
  display: {
    title: 'Production Details',
    icon: CogIcon,
    iconColor: 'from-indigo-500 to-purple-500',
    keyField: 'id',
    emptyMessage: 'No production data',
    emptyIcon: CogIcon,
    columns: [
      {
        key: 'productCode',
        header: 'Product Code',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-sm font-mono text-indigo-300' 
          }, value)
        ),
      },
      {
        key: 'productName',
        header: 'Product Name',
        align: 'left',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-sm text-white truncate' 
          }, value)
        ),
      },
      {
        key: 'quantity',
        header: 'Quantity',
        align: 'center',
        render: (value: number) => (
          React.createElement('span', { 
            className: 'text-sm font-semibold text-green-300' 
          }, value?.toLocaleString() || '0')
        ),
      },
      {
        key: 'department',
        header: 'Department',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, value || 'Unknown')
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (value: string) => (
          React.createElement('span', {
            className: cn(
              'px-2 py-1 text-xs rounded-full font-medium',
              value === 'active' ? 'bg-green-500/20 text-green-400' :
              value === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
              value === 'maintenance' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            )
          }, value?.toUpperCase() || 'UNKNOWN')
        ),
      },
      {
        key: 'date',
        header: 'Date',
        align: 'right',
        render: (value: string) => (
          React.createElement('span', { 
            className: 'text-xs text-gray-300' 
          }, formatTime(value))
        ),
      },
    ] as DataTableColumn<ProductionItem>[],
  },

  pagination: { type: 'infinite', pageSize: 20 },
  realtime: { enabled: true, pollInterval: 15000 },
  interaction: { refreshable: true },

  ...overrides,
});

// ================================
// Configuration Registry
// ================================

/**
 * 配置註冊表 - 映射 widget ID 到配置函數
 */
export const LIST_WIDGET_CONFIGS = {
  OrdersListWidgetV2: OrdersListConfig,
  OtherFilesListWidgetV2: OtherFilesListConfig,
  WarehouseTransferListWidget: WarehouseTransferListConfig,
  OrderStateListWidgetV2: OrderStateListConfig,
  ProductionDetailsWidget: ProductionDetailsConfig,
} as const;

/**
 * 獲取 List Widget 配置
 */
export function getListWidgetConfig<T = any>(
  widgetId: keyof typeof LIST_WIDGET_CONFIGS,
  overrides?: Partial<UniversalListWidgetConfig<T>>
): UniversalListWidgetConfig<T> {
  const configFn = LIST_WIDGET_CONFIGS[widgetId];
  if (!configFn) {
    throw new Error(`Unknown list widget configuration: ${widgetId}`);
  }
  return configFn(overrides) as UniversalListWidgetConfig<T>;
}

/**
 * 驗證配置完整性
 */
export function validateListConfig<T>(config: UniversalListWidgetConfig<T>): boolean {
  return !!(
    config.dataSource?.serverAction &&
    config.display?.title &&
    config.display?.icon &&
    config.display?.columns?.length &&
    config.display?.keyField
  );
}

/**
 * 獲取所有可用的 List Widget IDs
 */
export function getAvailableListWidgetIds(): string[] {
  return Object.keys(LIST_WIDGET_CONFIGS);
}

/**
 * 創建默認配置的輔助函數
 */
export function createDefaultListConfig<T>(
  baseConfig: Partial<UniversalListWidgetConfig<T>>
): UniversalListWidgetConfig<T> {
  return {
    // 必需的默認配置
    dataSource: {
      serverAction: async () => [],
      ...baseConfig.dataSource,
    },
    display: {
      title: 'List Widget',
      icon: ClipboardDocumentListIcon,
      keyField: 'id' as keyof T,
      columns: [],
      ...baseConfig.display,
    },
    pagination: {
      type: 'infinite',
      pageSize: 20,
      ...baseConfig.pagination,
    },
    realtime: {
      enabled: true,
      pollInterval: 30000,
      ...baseConfig.realtime,
    },
    interaction: {
      refreshable: true,
      ...baseConfig.interaction,
    },
    performance: {
      progressiveLoading: true,
      memoization: true,
      caching: { enabled: true, duration: 5 * 60 * 1000 },
      ...baseConfig.performance,
    },
    ...baseConfig,
  } as UniversalListWidgetConfig<T>;
}