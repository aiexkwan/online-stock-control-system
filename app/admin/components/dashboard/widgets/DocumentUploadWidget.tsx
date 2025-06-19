/**
 * Document Management Widget - 文檔管理功能
 * 1x1: 不支援
 * 3x3: Quick access 按鈕 + 上傳歷史（最近 6 條）
 * 5x5: Quick access 按鈕 + 上傳歷史（最近 10 條）
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CloudArrowUpIcon, DocumentTextIcon, DocumentArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { WidgetStyles } from '@/app/utils/widgetStyles';

interface UploadRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  doc_type?: string;
  file_size?: number;
  folder?: string;
  data_id?: { name: string }; // 關聯的用戶資料
  uploader_name?: string; // 處理後的用戶名稱
}

export function DocumentUploadWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { openDialog } = useDialog();
  
  const size = widget.config.size || WidgetSize.MEDIUM;
  const itemsPerPage = size === WidgetSize.LARGE ? 10 : 6;

  // 載入上傳歷史
  const loadUploadHistory = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(0);
      }
      
      const supabase = createClient();
      const offset = loadMore ? page * itemsPerPage : 0;
      
      // 查詢 doc_upload 表
      const { data, error, count } = await supabase
        .from('doc_upload')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('[DocumentUploadWidget] Error loading upload history:', error);
        throw error;
      }

      // 如果有數據，批量查詢用戶名稱
      let processedData = data || [];
      if (data && data.length > 0) {
        // 獲取所有唯一的 upload_by ID
        const userIds = [...new Set(data.map(record => record.upload_by))].filter(id => id);
        
        // 批量查詢用戶名稱
        const { data: users, error: userError } = await supabase
          .from('data_id')
          .select('id, name')
          .in('id', userIds);
        
        if (userError) {
          console.error('[DocumentUploadWidget] Error loading user names:', userError);
        }
        
        // 建立用戶 ID 到名稱的映射
        const userMap = new Map();
        if (users) {
          users.forEach(user => {
            userMap.set(user.id, user.name);
          });
        }
        
        // 將用戶名稱添加到記錄中
        processedData = data.map(record => ({
          ...record,
          uploader_name: userMap.get(Number(record.upload_by)) || `User ${record.upload_by}`
        }));
      }

      if (processedData.length > 0) {
        if (loadMore) {
          setUploadHistory(prev => [...prev, ...processedData]);
          setPage(prev => prev + 1);
        } else {
          setUploadHistory(processedData);
          setPage(1);
        }
        
        // 檢查是否還有更多數據
        const totalLoaded = loadMore ? uploadHistory.length + processedData.length : processedData.length;
        setHasMore(count ? totalLoaded < count : false);
      }

    } catch (error) {
      console.error('[DocumentUploadWidget] Error loading upload history:', error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, uploadHistory.length]);

  useEffect(() => {
    if (size !== WidgetSize.SMALL) {
      loadUploadHistory();
      
      // 設置自動刷新
      const interval = setInterval(() => loadUploadHistory(false), widget.config.refreshInterval || 60000);
      return () => clearInterval(interval);
    }
  }, [size, widget.config.refreshInterval, loadUploadHistory]);

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'MMM dd HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  const getDocIcon = (docType?: string) => {
    if (docType === 'order') {
      return <DocumentArrowUpIcon className="w-4 h-4 text-blue-400" />;
    } else if (docType === 'spec') {
      return <DocumentTextIcon className="w-4 h-4 text-purple-400" />;
    }
    return <CloudArrowUpIcon className="w-4 h-4 text-green-400" />;
  };

  // 1x1 - 不支援
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard size={widget.config.size} widgetType="UPLOAD_FILES" isEditMode={isEditMode}>
          <CardContent className="p-2 h-full flex flex-col items-center justify-center">
            <h3 className="text-xs text-slate-400 mb-1">Document Management</h3>
            <div className="text-lg font-medium text-slate-500">(N/A)</div>
            <p className="text-xs text-slate-500 mt-1">1×1</p>
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  // 3x3 & 5x5 共用的內容
  const content = (size: WidgetSize) => (
    <>
      {/* Quick Access 按鈕 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          size="sm"
          onClick={() => !isEditMode && openDialog('uploadFilesOnly')}
          disabled={isEditMode}
          className={`h-[4.8rem] ${WidgetStyles.quickAccess.documentUpload['Upload Files']} text-white flex flex-col items-center justify-center gap-2 transition-all`}
        >
          <CloudArrowUpIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Upload Files</span>
        </Button>
        <Button
          size="sm"
          onClick={() => !isEditMode && openDialog('uploadOrderPdf')}
          disabled={isEditMode}
          className={`h-[4.8rem] ${WidgetStyles.quickAccess.documentUpload['Upload Order PDF']} text-white flex flex-col items-center justify-center gap-2 transition-all`}
        >
          <DocumentArrowUpIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Upload Order</span>
        </Button>
        <Button
          size="sm"
          onClick={() => !isEditMode && openDialog('productSpec')}
          disabled={isEditMode}
          className={`h-[4.8rem] ${WidgetStyles.quickAccess.documentUpload['Upload Spec']} text-white flex flex-col items-center justify-center gap-2 transition-all`}
        >
          <DocumentTextIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Upload Spec</span>
        </Button>
      </div>

      {/* 上傳歷史 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Column Headers */}
        <div className="border-b border-slate-700 pb-2 mb-2">
          <div className={`grid ${size === WidgetSize.LARGE ? 'grid-cols-3' : 'grid-cols-3'} gap-2 px-2 text-xs font-medium text-slate-400`}>
            <span>Date/Time</span>
            <span className="col-span-1">Document Name</span>
            <span>Uploaded By</span>
          </div>
        </div>
        
        {loading && uploadHistory.length === 0 ? (
          <div className="animate-pulse space-y-2">
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        ) : uploadHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No upload history</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            {uploadHistory.map((record) => (
              <div 
                key={record.uuid} 
                className="bg-black/20 rounded-lg p-2 hover:bg-white/10 transition-colors"
              >
                <div className={`grid ${size === WidgetSize.LARGE ? 'grid-cols-3' : 'grid-cols-3'} gap-2 items-center`}>
                  <div className="flex items-center gap-2">
                    {getDocIcon(record.doc_type)}
                    <span className="text-xs text-purple-300">{formatTime(record.created_at)}</span>
                  </div>
                  <div className="col-span-1 min-w-0">
                    <span className="text-xs text-purple-400 block truncate" title={record.doc_name}>
                      {record.doc_name}
                    </span>
                  </div>
                  <span className="text-xs text-purple-300 text-right">{record.uploader_name || record.upload_by}</span>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMore && !loading && (
              <button
                onClick={() => loadUploadHistory(true)}
                className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                disabled={isEditMode}
              >
                Load more...
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  // 3x3 - Medium size
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard size={widget.config.size} widgetType="UPLOAD_FILES" isEditMode={isEditMode} className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <CloudArrowUpIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-200">Document Management</span>
              </div>
              {/* 手動刷新按鈕 */}
              <button
                onClick={() => !isEditMode && loadUploadHistory()}
                disabled={isEditMode || loading}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {content(WidgetSize.MEDIUM)}
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  // 5x5 - Large size
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard size={widget.config.size} widgetType="UPLOAD_FILES" isEditMode={isEditMode} className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CloudArrowUpIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-medium bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200 bg-clip-text text-transparent">
                Document Management
              </span>
            </div>
            {/* 手動刷新按鈕 */}
            <button
              onClick={() => !isEditMode && loadUploadHistory()}
              disabled={isEditMode || loading}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {content(WidgetSize.LARGE)}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
}