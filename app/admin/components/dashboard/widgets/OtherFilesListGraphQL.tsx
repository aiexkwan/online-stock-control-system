/**
 * Other Files List Widget - GraphQL Version
 * 篩選條件：doc_type != 'order'
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentIcon, CloudIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { useGraphQLQuery } from '@/lib/graphql-client';
import { GET_OTHER_UPLOADS, GET_USERS_BY_IDS } from '@/lib/graphql/queries';

interface FileRecord {
  uuid: string;
  doc_name: string;
  upload_by: string | number;
  created_at: string;
  doc_type?: string;
  uploader_name?: string;
}

export const OtherFilesListGraphQL = React.memo(function OtherFilesListGraphQL({ widget, isEditMode }: WidgetComponentProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const size = widget.config.size || WidgetSize.MEDIUM;
  const itemsPerPage = size === WidgetSize.LARGE ? 15 : size === WidgetSize.MEDIUM ? 10 : 5;

  // 初始載入
  const { data: initialData, loading: initialLoading, error, refetch } = useGraphQLQuery(
    GET_OTHER_UPLOADS,
    {
      offset: 0,
      limit: itemsPerPage
    }
  );

  // 處理初始數據和用戶名稱查詢
  useEffect(() => {
    const processInitialData = async () => {
      if (!initialData?.doc_uploadCollection) return;

      const edges = initialData.doc_uploadCollection.edges || [];
      const pageInfo = initialData.doc_uploadCollection.pageInfo;
      
      setHasMore(pageInfo?.hasNextPage || false);

      if (edges.length === 0) {
        setFiles([]);
        return;
      }

      // 獲取唯一的用戶 ID
      const userIds = [...new Set(edges.map((edge: any) => edge.node.upload_by))]
        .filter(id => id)
        .map(id => Number(id));

      // 批量查詢用戶名稱
      let userMap = new Map<number, string>();
      if (userIds.length > 0) {
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/graphql/v1', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            },
            body: JSON.stringify({
              query: GET_USERS_BY_IDS,
              variables: { userIds }
            })
          });

          const userData = await response.json();
          if (userData?.data?.data_idCollection?.edges) {
            userData.data.data_idCollection.edges.forEach((edge: any) => {
              userMap.set(edge.node.id, edge.node.name);
            });
          }
        } catch (err) {
          console.error('[OtherFilesListGraphQL] Error fetching user names:', err);
        }
      }

      // 組合數據
      const processedData = edges.map((edge: any) => ({
        ...edge.node,
        uploader_name: userMap.get(Number(edge.node.upload_by)) || `User ${edge.node.upload_by}`
      }));

      setFiles(processedData);
      setPage(1);
    };

    processInitialData();
  }, [initialData]);

  // 載入更多
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/graphql/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({
          query: GET_OTHER_UPLOADS,
          variables: {
            offset: page * itemsPerPage,
            limit: itemsPerPage
          }
        })
      });

      const result = await response.json();
      
      if (result?.data?.doc_uploadCollection) {
        const edges = result.data.doc_uploadCollection.edges || [];
        const pageInfo = result.data.doc_uploadCollection.pageInfo;
        
        setHasMore(pageInfo?.hasNextPage || false);

        if (edges.length > 0) {
          // 獲取用戶名稱
          const userIds = [...new Set(edges.map((edge: any) => edge.node.upload_by))]
            .filter(id => id)
            .map(id => Number(id));

          let userMap = new Map<number, string>();
          if (userIds.length > 0) {
            const userResponse = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/graphql/v1', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              },
              body: JSON.stringify({
                query: GET_USERS_BY_IDS,
                variables: { userIds }
              })
            });

            const userData = await userResponse.json();
            if (userData?.data?.data_idCollection?.edges) {
              userData.data.data_idCollection.edges.forEach((edge: any) => {
                userMap.set(edge.node.id, edge.node.name);
              });
            }
          }

          const processedData = edges.map((edge: any) => ({
            ...edge.node,
            uploader_name: userMap.get(Number(edge.node.upload_by)) || `User ${edge.node.upload_by}`
          }));

          setFiles(prev => [...prev, ...processedData]);
          setPage(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('[OtherFilesListGraphQL] Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, itemsPerPage, hasMore, loadingMore]);

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

  const loading = initialLoading;

  // Small size - 簡化顯示
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard size={widget.config.size} widgetType="CUSTOM" isEditMode={isEditMode}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CloudIcon className="w-4 h-4 text-purple-400" />
              <span>Other Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-purple-400">
              {loading ? '...' : files.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Documents & images</p>
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  // Medium & Large sizes
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard size={widget.config.size} widgetType="CUSTOM" isEditMode={isEditMode} className="flex flex-col">
        {/* GraphQL 標識 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white text-xs rounded-full shadow-lg backdrop-blur-sm z-10">
          GraphQL
        </div>
        
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CloudIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-medium text-slate-200">Other File Upload History</span>
            </div>
            <button
              onClick={() => !isEditMode && refetch()}
              disabled={isEditMode || loading}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col overflow-hidden">
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
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 text-sm">Error loading files</p>
              </div>
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
                  onClick={() => loadMore()}
                  className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  disabled={isEditMode || loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more...'}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});