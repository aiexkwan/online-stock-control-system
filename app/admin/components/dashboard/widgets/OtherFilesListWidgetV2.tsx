/**
 * Other Files List Widget V2 - Enhanced Version with useGraphQLFallback
 * 顯示非訂單文件上傳列表
 * 
 * Features:
 * - 使用 useGraphQLFallback hook 統一數據獲取
 * - Progressive Loading with useInViewport
 * - 使用 DataTable 組件統一列表顯示
 * - 支援分頁查詢
 * - 保留 Upload Refresh Context 整合
 */

'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { DocumentIcon, CloudIcon, PhotoIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { GetOtherFilesListDocument } from '@/lib/graphql/generated/apollo-hooks';
import { useGraphQLFallback, GraphQLFallbackPresets } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport, InViewportPresets } from '@/app/admin/hooks/useInViewport';
import { DataTable, DataTableColumn } from './common/data-display/DataTable';
import { cn } from '@/lib/utils';

interface FileRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  doc_type?: string;
  uploader_name?: string;
  uploader_id?: number;
}

export const OtherFilesListWidgetV2 = React.memo(function OtherFilesListWidgetV2({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const { otherFilesVersion } = useUploadRefresh();
  const itemsPerPage = 10;
  
  // Progressive Loading - 檢測 widget 是否在視窗內
  const { isInViewport, hasBeenInViewport } = useInViewport(widgetRef, InViewportPresets.chart);

  // Server Action fallback - 使用 RPC 查詢
  async function fetchFilesServerAction(variables?: { limit: number; offset: number }) {
    const api = createDashboardAPI();
    const result = await api.fetch({
      widgetIds: ['otherFilesList'],
      params: {
        dataSource: 'rpc_get_other_files',
        limit: variables?.limit || 10,
        offset: variables?.offset || 0,
      },
    });

    const widgetData = result.widgets?.find(w => w.widgetId === 'otherFilesList');
    
    if (!widgetData || widgetData.data.error) {
      throw new Error(widgetData?.data.error || 'Failed to load files');
    }

    return widgetData.data.value || [];
  }

  // 使用 useGraphQLFallback hook 統一數據獲取
  const { 
    data: rawData, 
    loading, 
    error,
    refetch,
    mode,
    performanceMetrics,
  } = useGraphQLFallback({
    graphqlQuery: GetOtherFilesListDocument,
    serverAction: fetchFilesServerAction,
    variables: {
      limit: itemsPerPage,
      offset: page * itemsPerPage,
    },
    skip: isEditMode || !hasBeenInViewport, // Progressive Loading
    widgetId: 'other-files-list',
    ...GraphQLFallbackPresets.cached,
  });

  // 處理數據
  const data = useMemo<FileRecord[]>(() => {
    if (!rawData) return [];
    
    if (rawData?.doc_uploadCollection?.edges) {
      // 注意：GraphQL 無法 JOIN data_id table，需要依賴 server action
      return rawData.doc_uploadCollection.edges.map((edge: any) => ({
        uuid: edge.node.uuid,
        doc_name: edge.node.doc_name,
        doc_type: edge.node.doc_type,
        upload_by: edge.node.upload_by,
        created_at: edge.node.created_at,
        uploader_name: `User ${edge.node.upload_by}`, // Placeholder
      }));
    }
    
    // Server Action data is already processed
    return rawData || [];
  }, [rawData]);

  // 監聽 upload refresh
  useEffect(() => {
    if (otherFilesVersion > 0 && hasBeenInViewport) {
      refetch();
    }
  }, [otherFilesVersion, refetch, hasBeenInViewport]);

  // 處理分頁
  const handleLoadMore = useCallback(async () => {
    setPage(prev => prev + 1);
    // When using pagination, the refetch will be triggered by the page state change
  }, []);

  // 根據檔案類型選擇圖標
  const getFileIcon = (docType?: string, docName?: string) => {
    if (docType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(docName || '')) {
      return PhotoIcon;
    }
    if (docType === 'cloud' || /\.(zip|rar|7z)$/i.test(docName || '')) {
      return CloudIcon;
    }
    return DocumentIcon;
  };

  // 定義 DataTable columns
  const columns = useMemo<DataTableColumn<FileRecord>[]>(() => [
    {
      key: 'created_at',
      header: 'Date',
      icon: CalendarIcon,
      width: '20%',
      render: (value) => format(fromDbTime(value), 'MMM d, HH:mm'),
      className: 'text-slate-300',
    },
    {
      key: 'doc_name',
      header: 'File Name',
      icon: DocumentIcon,
      width: '50%',
      render: (value, item) => {
        const FileIcon = getFileIcon(item.doc_type, value);
        return (
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="font-medium text-white truncate">{value}</span>
          </div>
        );
      },
    },
    {
      key: 'uploader_name',
      header: 'Uploaded By',
      icon: UserIcon,
      width: '30%',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="text-slate-300">{value || `User ${item.upload_by}`}</span>
        </div>
      ),
    },
  ], []);

  // 計算 metadata
  const metadata = useMemo(() => {
    const files = data || [];
    return {
      fileCount: files.length,
      hasMore: rawData?.doc_uploadCollection?.pageInfo?.hasNextPage || false,
    };
  }, [data, rawData]);

  // Edit mode - 顯示空白狀態
  if (isEditMode) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title="Other Files"
          icon={DocumentIcon}
          iconColor="from-purple-500 to-pink-500"
          data={[]}
          columns={columns}
          empty={true}
          emptyMessage="Other Files List Widget V2"
          emptyIcon={DocumentIcon}
        />
      </div>
    );
  }

  // Progressive Loading - 如果還未進入視窗，顯示 skeleton
  if (!hasBeenInViewport) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title="Other Files"
          icon={DocumentIcon}
          iconColor="from-purple-500 to-pink-500"
          data={[]}
          columns={columns}
          loading={true}
        />
      </div>
    );
  }

  return (
    <div ref={widgetRef}>
      <DataTable
        title="Other Files"
        subtitle={`${metadata.fileCount} files uploaded`}
        icon={DocumentIcon}
        iconColor="from-purple-500 to-pink-500"
        data={data || []}
        columns={columns}
        keyField="uuid"
        loading={loading}
        error={error}
        empty={(data || []).length === 0}
        emptyMessage="No files uploaded yet"
        emptyIcon={DocumentIcon}
        pagination={{
          enabled: true,
          pageSize: itemsPerPage,
          loadMore: true,
          hasMore: metadata.hasMore,
          onLoadMore: handleLoadMore,
          loadingMore: loading && page > 0,
        }}
        performanceMetrics={{
          source: mode,
          fetchTime: performanceMetrics?.queryTime,
          optimized: true,
        }}
        connectionStatus={
          mode === 'graphql' 
            ? { type: 'graphql', label: '⚡ GraphQL' }
            : mode === 'context'
            ? { type: 'polling', label: '🚀 Batch Query' }
            : undefined
        }
        onRefresh={refetch}
        showRefreshButton={true}
        animate={true}
        rowClassName="transition-colors hover:bg-slate-700/50"
      />
    </div>
  );
});

export default OtherFilesListWidgetV2;

/**
 * Other Files List Widget V2 - Enhanced Version
 * 
 * Features:
 * - ✅ useGraphQLFallback hook 統一數據獲取
 * - ✅ Progressive Loading with useInViewport
 * - ✅ DataTable 統一列表顯示
 * - ✅ 支援分頁查詢和 Load More
 * - ✅ Upload Refresh Context 整合
 * - ✅ 根據檔案類型顯示不同圖標
 * - ✅ 自動 GraphQL → Server Action fallback
 * 
 * Updates (2025-01-10):
 * - 使用 useGraphQLFallback 替換自定義 GraphQL/Server Actions 切換邏輯
 * - 使用 DataTable 組件替換自定義列表渲染
 * - 實施 Progressive Loading 優化首屏加載
 * - 保留分頁功能和 Upload Refresh 整合
 */