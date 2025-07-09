/**
 * Other Files List Widget V2
 * 使用 DashboardAPI + 服務器端 JOIN 和篩選 (rpc_get_other_files_list)
 * 遷移自原 OtherFilesListWidget
 * 
 * 優化更新: 移除 GraphQL 支持，專注使用 Server Actions + RPC 函數
 * - 使用現有的 rpc_get_other_files_list 函數
 * - 包含真實用戶名稱 (uploader_name)
 * - 優化性能監控和分頁
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

  // 載入文件列表 - 使用 Server Actions + RPC 函數
  const loadFiles = useCallback(
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
            {!isEditMode && performanceMetrics.apiResponseTime && (
              <span className='text-xs text-slate-400'>
                {performanceMetrics.apiResponseTime}ms
                {performanceMetrics.optimized && ' (optimized)'}
              </span>
            )}
            <button
              onClick={() => !isEditMode && loadFiles(false)}
              disabled={isEditMode || loading}
              className='rounded-lg p-1.5 transition-colors hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-50'
              title='Refresh'
            >
              <ArrowPathIcon
                className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </CardTitle>
        {metadata.totalCount > 0 && (
          <p className='text-xs text-slate-400'>
            Total {metadata.totalCount} files (non-order documents)
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
        {loading && files.length === 0 ? (
          <div className='animate-pulse space-y-2'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-10 rounded-lg bg-white/10'></div>
            ))}
          </div>
        ) : error ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <CloudIcon className='mx-auto mb-2 h-12 w-12 text-red-400' />
              <p className='text-sm text-red-400'>Error loading files</p>
              <p className='mt-1 text-xs text-slate-500'>{error}</p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center'>
              <CloudIcon className='mx-auto mb-2 h-12 w-12 text-slate-600' />
              <p className='text-sm text-slate-500'>No files uploaded</p>
            </div>
          </div>
        ) : (
          <div className='flex-1 space-y-1 overflow-y-auto'>
            {files.map(file => (
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
            {hasMore && !loading && (
              <button
                onClick={() => !isEditMode && loadFiles(true)}
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
