/**
 * Other Files List Widget V2
 * 使用 DashboardAPI + 服務器端 JOIN 和篩選
 * 遷移自原 OtherFilesListWidget
 * 
 * Re-Structure-6 Update: Added GraphQL support for data-intensive queries
 * - 200+ records benefit from GraphQL field selection
 * - Hybrid architecture: Server Actions + GraphQL
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DocumentIcon, CloudIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { gql } from 'graphql-tag';
import { print } from 'graphql';

// GraphQL query for other files list
const GET_OTHER_FILES_LIST = gql`
  query GetOtherFilesList($limit: Int!, $offset: Int!) {
    doc_uploadCollection(
      filter: { doc_type: { neq: "order" } }
      orderBy: [{ created_at: DescNullsLast }]
      first: $limit
      offset: $offset
    ) {
      edges {
        node {
          uuid
          doc_name
          upload_by
          created_at
          doc_type
          data_id {
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

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
  // 決定是否使用 GraphQL - 可以通過 widget config 或 props 控制
  const shouldUseGraphQL = useGraphQL ?? (widget as any)?.useGraphQL ?? false;
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
  const [graphqlPage, setGraphqlPage] = useState(0);
  const [graphqlFiles, setGraphqlFiles] = useState<FileRecord[]>([]);

  const itemsPerPage = 10; // 固定佈局系統，使用預設值

  // GraphQL query
  const {
    data: graphqlData,
    loading: graphqlLoading,
    error: graphqlError,
    refetch: refetchGraphQL,
  } = useGraphQLQuery(
    print(GET_OTHER_FILES_LIST),
    {
      limit: itemsPerPage,
      offset: graphqlPage * itemsPerPage,
    },
    {
      enabled: shouldUseGraphQL && !isEditMode,
      refetchInterval: 30000, // 30秒刷新一次
      cacheTime: 300000, // 5分鐘快取
    }
  );

  // Process GraphQL data
  useEffect(() => {
    if (shouldUseGraphQL && graphqlData?.doc_uploadCollection) {
      const edges = graphqlData.doc_uploadCollection.edges || [];
      const newFiles: FileRecord[] = edges.map((edge: any) => ({
        uuid: edge.node.uuid,
        doc_name: edge.node.doc_name,
        upload_by: edge.node.upload_by,
        created_at: edge.node.created_at,
        doc_type: edge.node.doc_type,
        uploader_name: edge.node.data_id?.name || 
          (edge.node.upload_by ? `User ${edge.node.upload_by}` : 'Unknown'),
        uploader_id: edge.node.upload_by,
      }));

      if (graphqlPage === 0) {
        setGraphqlFiles(newFiles);
      } else {
        // Append for pagination
        setGraphqlFiles(prev => [...prev, ...newFiles]);
      }

      setMetadata({
        totalCount: graphqlData.doc_uploadCollection.totalCount,
        hasMore: graphqlData.doc_uploadCollection.pageInfo.hasNextPage,
        optimized: true,
      });
    }
  }, [shouldUseGraphQL, graphqlData, graphqlPage]);

  // GraphQL load more function
  const loadMoreGraphQL = useCallback(() => {
    if (shouldUseGraphQL && !graphqlLoading && 
        graphqlData?.doc_uploadCollection?.pageInfo?.hasNextPage) {
      setGraphqlPage(prev => prev + 1);
    }
  }, [shouldUseGraphQL, graphqlLoading, graphqlData]);

  // GraphQL refresh function
  const refreshGraphQL = useCallback(async () => {
    if (shouldUseGraphQL) {
      setGraphqlPage(0);
      setGraphqlFiles([]);
      await refetchGraphQL();
    }
  }, [shouldUseGraphQL, refetchGraphQL]);

  // 載入文件列表
  const loadFiles = useCallback(
    async (loadMore = false) => {
      if (shouldUseGraphQL) return; // Skip when using GraphQL
      
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
    [page, itemsPerPage, shouldUseGraphQL]
  );

  useEffect(() => {
    if (!isEditMode) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // 訂閱上傳更新事件
  useEffect(() => {
    if (otherFilesVersion > 0 && !isEditMode) {
      loadFiles(false); // 重新載入第一頁
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherFilesVersion]);

  // Unified data source
  const displayFiles = shouldUseGraphQL ? graphqlFiles : files;
  const isLoading = shouldUseGraphQL 
    ? (graphqlLoading && graphqlPage === 0) 
    : loading;
  const isLoadingMore = shouldUseGraphQL 
    ? (graphqlLoading && graphqlPage > 0) 
    : (loading && page > 0);
  const displayError = shouldUseGraphQL 
    ? (graphqlError ? graphqlError.message : null) 
    : error;
  const displayHasMore = shouldUseGraphQL 
    ? (graphqlData?.doc_uploadCollection?.pageInfo?.hasNextPage || false)
    : hasMore;
  const displayTotalCount = shouldUseGraphQL 
    ? (graphqlData?.doc_uploadCollection?.totalCount || 0)
    : (metadata.totalCount || 0);
  const handleLoadMore = shouldUseGraphQL ? loadMoreGraphQL : () => loadFiles(true);
  const handleRefresh = shouldUseGraphQL ? refreshGraphQL : () => loadFiles(false);

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
            {shouldUseGraphQL && !isEditMode && (
              <span className='text-xs text-blue-400'>⚡ GraphQL</span>
            )}
            {!shouldUseGraphQL && !isEditMode && performanceMetrics.apiResponseTime && (
              <span className='text-xs text-slate-400'>
                {performanceMetrics.apiResponseTime}ms
                {performanceMetrics.optimized && ' (optimized)'}
              </span>
            )}
            <button
              onClick={() => !isEditMode && handleRefresh()}
              disabled={isEditMode || isLoading}
              className='rounded-lg p-1.5 transition-colors hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-50'
              title='Refresh'
            >
              <ArrowPathIcon
                className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`}
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
        {isLoading && displayFiles.length === 0 ? (
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
            {displayFiles.map(file => (
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
            {displayHasMore && !isLoading && (
              <button
                onClick={handleLoadMore}
                className='w-full py-2 text-sm text-purple-400 transition-colors hover:text-purple-300'
                disabled={isEditMode}
              >
                Load more...
              </button>
            )}
          </div>
        )}

        {/* Performance indicator */}
        {!shouldUseGraphQL && metadata.performanceMs && (
          <div className='mt-2 text-center text-[10px] text-green-400'>
            ✓ Server-side optimized ({metadata.performanceMs}ms query)
          </div>
        )}
      </CardContent>
    </motion.div>
  );
});

export default OtherFilesListWidgetV2;
