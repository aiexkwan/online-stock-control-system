/**
 * Other Files List Widget - 顯示非訂單文件列表
 * 篩選條件：doc_type != 'order'
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentIcon, CloudIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useUploadRefresh } from '@/app/admin/contexts/UploadRefreshContext';

interface FileRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  doc_type?: string;
  uploader_name?: string;
}

export const OtherFilesListWidget = React.memo(function OtherFilesListWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { otherFilesVersion } = useUploadRefresh();
  
  // 根據 widget size 設定每頁顯示數量，預設 10
  const itemsPerPage = 10;

  // 載入文件列表
  const loadFiles = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(0);
      }
      
      const supabase = createClient();
      const offset = loadMore ? page * itemsPerPage : 0;
      
      // 查詢 doc_upload 表，篩選 doc_type != 'order'
      const { data, error, count } = await supabase
        .from('doc_upload')
        .select('*', { count: 'exact' })
        .neq('doc_type', 'order')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('[OtherFilesListWidget] Error loading files:', error);
        throw error;
      }

      // 批量查詢用戶名稱
      let processedData = data || [];
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(record => record.upload_by))].filter(id => id);
        
        const { data: users, error: userError } = await supabase
          .from('data_id')
          .select('id, name')
          .in('id', userIds);
        
        if (userError) {
          console.error('[OtherFilesListWidget] Error loading user names:', userError);
        }
        
        const userMap = new Map();
        if (users) {
          users.forEach(user => {
            userMap.set(user.id, user.name);
          });
        }
        
        processedData = data.map(record => ({
          ...record,
          uploader_name: userMap.get(Number(record.upload_by)) || `User ${record.upload_by}`
        }));
      }

      if (processedData.length > 0) {
        if (loadMore) {
          setFiles(prev => [...prev, ...processedData]);
          setPage(prev => prev + 1);
        } else {
          setFiles(processedData);
          setPage(1);
        }
        
        const totalLoaded = loadMore ? files.length + processedData.length : processedData.length;
        setHasMore(count ? totalLoaded < count : false);
      } else {
        setHasMore(false);
      }

    } catch (error) {
      console.error('[OtherFilesListWidget] Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, files.length]);

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 訂閱上傳更新事件
  useEffect(() => {
    if (otherFilesVersion > 0) {
      loadFiles(false); // 重新載入第一頁
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherFilesVersion]);

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  const getDocIcon = (docType?: string) => {
    if (docType === 'image' || docType === 'photo') {
      return <PhotoIcon className="w-4 h-4 text-green-400" />;
    } else if (docType === 'spec') {
      return <DocumentIcon className="w-4 h-4 text-purple-400" />;
    }
    return <CloudIcon className="w-4 h-4 text-slate-400" />;
  };

  // Small size - 簡化顯示

  // Medium & Large sizes
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CloudIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-medium text-slate-200">Other File Upload History</span>
            </div>
            <button
              onClick={() => !isEditMode && loadFiles()}
              disabled={isEditMode || loading}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Column Headers */}
          <div className="border-b border-slate-700 pb-2 mb-2">
            <div className="grid grid-cols-3 gap-2 px-2 text-xs font-medium text-slate-400">
              <span>Date</span>
              <span>File Name</span>
              <span>Upload By</span>
            </div>
          </div>
          
          {/* Content */}
          {loading && files.length === 0 ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CloudIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No files uploaded</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1">
              {files.map((file) => (
                <div 
                  key={file.uuid} 
                  className="bg-black/20 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="flex items-center gap-2">
                      {getDocIcon(file.doc_type)}
                      <span className="text-xs text-purple-300">{formatTime(file.created_at)}</span>
                    </div>
                    <span className="text-xs text-purple-400 truncate" title={file.doc_name}>
                      {file.doc_name}
                    </span>
                    <span className="text-xs text-purple-300 text-right truncate">
                      {file.uploader_name || file.upload_by}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && !loading && (
                <button
                  onClick={() => loadFiles(true)}
                  className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  disabled={isEditMode}
                >
                  Load more...
                </button>
              )}
            </div>
          )}
        </CardContent>
    </motion.div>
  );
});