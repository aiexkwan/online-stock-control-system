/**
 * Other Files List Widget V2 - Apollo GraphQL Version
 * 顯示非訂單文件上傳列表
 * 
 * GraphQL Migration:
 * - 遷移至 Apollo Client
 * - 查詢 doc_upload 表
 * - 保留 Server Actions + RPC 作為 fallback
 * - 支援分頁查詢
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentIcon, CloudIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { useGetOtherFilesListQuery } from '@/lib/graphql/generated/apollo-hooks';

interface FileRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  doc_type?: string;
  uploader_name?: string;
  uploader_id?: number;
}

interface OtherFilesListWidgetV2Props extends WidgetComponentProps {
  useGraphQL?: boolean;
}

export const OtherFilesListWidgetV2 = React.memo(function OtherFilesListWidgetV2({
  widget,
  isEditMode,
  useGraphQL,
}: OtherFilesListWidgetV2Props) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [metadata, setMetadata] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    apiResponseTime?: number;
    optimized?: boolean;
  }>({});
  const { otherFilesVersion } = useUploadRefresh();

  const itemsPerPage = 10; // 固定佈局系統，使用預設值
  
  // 使用環境變量控制是否使用 GraphQL
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_UPLOAD === 'true' || 
                          (useGraphQL ?? (widget as any)?.useGraphQL ?? false);

  // Apollo GraphQL query - 使用生成嘅 hook
  const {
    data: graphqlData,
    loading: graphqlLoading,
    error: graphqlError,
    refetch: refetchGraphQL,
    fetchMore,
  } = useGetOtherFilesListQuery({
    skip: !shouldUseGraphQL || isEditMode,
    variables: {
      limit: itemsPerPage,
      offset: page * itemsPerPage,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // 處理 GraphQL 數據
  const processGraphQLData = useCallback(() => {
    if (!graphqlData?.doc_uploadCollection) return [];
    
    return graphqlData.doc_uploadCollection.edges.map((edge: any) => ({
      uuid: edge.node.uuid,
      doc_name: edge.node.doc_name,
      doc_type: edge.node.doc_type,
      upload_by: edge.node.upload_by,
      created_at: edge.node.created_at,
      uploader_name: edge.node.data_id?.name || `User ${edge.node.upload_by}`,
      uploader_id: edge.node.data_id?.id || edge.node.upload_by,
    }));
  }, [graphqlData]);

  // 載入文件列表 - Server Actions + RPC 函數 (fallback)
  const loadServerActionsFiles = useCallback(
    async (loadMore = false) => {
      try {
        if (!loadMore) {
          setLoading(true);
          setPage(0);
          setError(null);
        }

        const startTime = performance.now();
        const offset = loadMore ? page * itemsPerPage : 0;

        const api = createDashboardAPI();
        const result = await api.fetch({
          widgetIds: ['statsCard'],
          params: {
            dataSource: 'other_files_list',
            limit: itemsPerPage,
            offset: offset,
          },
        });

        const endTime = performance.now();

        // Extract widget data from dashboard result
        const widgetData = result.widgets?.find(w => w.widgetId === 'statsCard');

        if (!widgetData || widgetData.data.error) {
          throw new Error(widgetData?.data.error || 'Failed to load files data');
        }

        setPerformanceMetrics({
          apiResponseTime: Math.round(endTime - startTime),
          optimized: widgetData.data.metadata?.optimized || false,
        });

        const newFiles = widgetData.data.value || [];

        if (loadMore) {
          setFiles(prev => [...prev, ...newFiles]);
          setPage(prev => prev + 1);
        } else {
          setFiles(newFiles);
          setPage(1);
        }

        setHasMore(widgetData.data.metadata?.hasMore || false);
        setMetadata(widgetData.data.metadata || {});
      } catch (err) {
        console.error('[OtherFilesListWidgetV2] Error loading files:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [page, itemsPerPage]
  );

  // 合併數據源
  const displayFiles = shouldUseGraphQL ? processGraphQLData() : files;
  const displayLoading = shouldUseGraphQL ? graphqlLoading : loading;
  const displayError = shouldUseGraphQL ? graphqlError?.message : error;
  const displayHasMore = shouldUseGraphQL 
    ? (graphqlData?.doc_uploadCollection?.pageInfo?.hasNextPage || false)
    : hasMore;
  const displayTotalCount = shouldUseGraphQL
    ? (graphqlData?.doc_uploadCollection?.totalCount || 0)
    : metadata.totalCount;

  // 處理加載更多
  const handleLoadMore = useCallback(() => {
    if (shouldUseGraphQL) {
      setPage(prev => prev + 1);
    } else {
      loadServerActionsFiles(true);
    }
  }, [shouldUseGraphQL, loadServerActionsFiles]);

  // 處理刷新
  const handleRefresh = useCallback(() => {
    if (shouldUseGraphQL) {
      setPage(0);
      refetchGraphQL();
    } else {
      loadServerActionsFiles(false);
    }
  }, [shouldUseGraphQL, refetchGraphQL, loadServerActionsFiles]);

  useEffect(() => {
    if (!isEditMode && !shouldUseGraphQL) {
      loadServerActionsFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, shouldUseGraphQL]);

  // 訂閱上傳更新事件
  useEffect(() => {
    if (otherFilesVersion > 0 && !isEditMode) {
      handleRefresh(); // 重新載入第一頁
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherFilesVersion]);

  const formatTime = useCallback((timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  }, []);

  const getDocIcon = useCallback((docType?: string) => {
    if (docType === 'image' || docType === 'photo') {
      return <PhotoIcon className='h-4 w-4 text-green-400' />;
    } else if (docType === 'spec') {
      return <DocumentIcon className='h-4 w-4 text-purple-400' />;
    }
    return <CloudIcon className='h-4 w-4 text-slate-400' />;
  }, []);

  // Medium & Large sizes
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex h-full flex-col'
    >
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500'>
              <CloudIcon className='h-5 w-5 text-white' />
            </div>
            <span className='text-base font-medium text-slate-200'>Other File Upload History</span>
          </div>
          <div className='flex items-center gap-2'>
            {shouldUseGraphQL && (
              <span className='text-xs text-blue-400'>
                ⚡ GraphQL
              </span>
            )}
            {!isEditMode && !shouldUseGraphQL && performanceMetrics.apiResponseTime && (
              <span className='text-xs text-slate-400'>
                {performanceMetrics.apiResponseTime}ms
                {performanceMetrics.optimized && ' (optimized)'}
              </span>
            )}
            <button
              onClick={() => !isEditMode && handleRefresh()}
              disabled={isEditMode || displayLoading}
              className='rounded-lg p-1.5 transition-colors hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-50'
              title='Refresh'
            >
              <ArrowPathIcon
                className={`h-4 w-4 text-slate-400 ${displayLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </CardTitle>
        {displayTotalCount > 0 && (
          <p className='text-xs text-slate-400'>
            Total {displayTotalCount} files (non-order documents)
          </p>
        )}
      </CardHeader>

      <CardContent className='flex flex-1 flex-col'>
        {/* Column Headers */}
        <div className='mb-2 border-b border-slate-700 pb-2'>
          <div className='grid grid-cols-3 gap-2 px-2 text-xs font-medium text-slate-400'>
            <span>Date</span>
            <span>File Name</span>
            <span>Upload By</span>
          </div>
        </div>

        {/* Content */}
        {displayLoading && displayFiles.length === 0 ? (
          <div className='animate-pulse space-y-2'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-10 rounded-lg bg-white/10'></div>
            ))}
          </div>
        ) : displayError ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <CloudIcon className='mx-auto mb-2 h-12 w-12 text-red-400' />
              <p className='text-sm text-red-400'>Error loading files</p>
              <p className='mt-1 text-xs text-slate-500'>{displayError}</p>
            </div>
          </div>
        ) : displayFiles.length === 0 ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <CloudIcon className='mx-auto mb-2 h-12 w-12 text-slate-600' />
              <p className='text-sm text-slate-500'>No files uploaded</p>
            </div>
          </div>
        ) : (
          <div className='flex-1 space-y-1 overflow-y-auto'>
            {displayFiles.map((file: FileRecord) => (
              <div
                key={file.uuid}
                className='cursor-pointer rounded-lg bg-black/20 p-2 transition-colors hover:bg-white/10'
              >
                <div className='grid grid-cols-3 items-center gap-2'>
                  <div className='flex items-center gap-2'>
                    {getDocIcon(file.doc_type)}
                    <span className='text-xs text-purple-300'>{formatTime(file.created_at)}</span>
                  </div>
                  <span className='truncate text-xs text-purple-400' title={file.doc_name}>
                    {file.doc_name}
                  </span>
                  <span className='truncate text-right text-xs text-purple-300'>
                    {file.uploader_name || `User ${file.upload_by}`}
                  </span>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {displayHasMore && !displayLoading && (
              <button
                onClick={() => !isEditMode && handleLoadMore()}
                className='w-full py-2 text-sm text-purple-400 transition-colors hover:text-purple-300'
                disabled={isEditMode}
              >
                Load more...
              </button>
            )}
          </div>
        )}

        {/* Performance indicator */}
        {metadata.performanceMs && (
          <div className='mt-2 text-center text-[10px] text-green-400'>
            ✓ Server-side optimized ({metadata.performanceMs}ms query)
          </div>
        )}
      </CardContent>
    </motion.div>
  );
});

export default OtherFilesListWidgetV2;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client query for doc_upload table
 * - Filters out order documents
 * - Pagination support
 * - User name from data_id relationship
 * - Fallback to Server Actions + RPC when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_UPLOAD
 * 
 * Performance considerations:
 * - RPC function (rpc_get_other_files_list) may be more efficient
 * - GraphQL provides field selection benefits for large datasets
 * - Consider keeping RPC as primary method for complex filtering
 */
