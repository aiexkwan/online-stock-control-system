/**
 * Document Management Widget - 文檔管理功能
 * 2x2: 顯示總文件數量
 * 4x4: 顯示各 bucket 文件數量和快速上傳按鈕
 * 6x6: 顯示訂單數量統計和完整功能
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudArrowUpIcon, DocumentTextIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface DocumentStats {
  total_files: number;
  bucket_counts: {
    orderpdf: number;
    stockpic: number;
    productspec: number;
  };
  order_count: number;
  orders_today: number;
  orders_week: number;
}

interface RecentUpload {
  id: string;
  type: 'file' | 'order' | 'spec';
  filename: string;
  uploaded_at: string;
  uploaded_by: string;
  size: string;
}

export function DocumentUploadWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [stats, setStats] = useState<DocumentStats>({
    total_files: 0,
    bucket_counts: {
      orderpdf: 0,
      stockpic: 0,
      productspec: 0
    },
    order_count: 0,
    orders_today: 0,
    orders_week: 0
  });
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDialog } = useDialog();
  
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 載入文檔統計
  const loadDocumentStats = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 獲取各 bucket 的文件數量
      const [orderPdfResult, stockPicResult, productSpecResult] = await Promise.all([
        supabase.storage.from('orderpdf').list('', { limit: 1000 }),
        supabase.storage.from('stockpic').list('', { limit: 1000 }),
        supabase.storage.from('productspec').list('', { limit: 1000 })
      ]);

      const orderPdfCount = orderPdfResult.data?.length || 0;
      const stockPicCount = stockPicResult.data?.length || 0;
      const productSpecCount = productSpecResult.data?.length || 0;
      const totalFiles = orderPdfCount + stockPicCount + productSpecCount;

      // 獲取訂單數量
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);

      const [ordersResult, ordersTodayResult, ordersWeekResult] = await Promise.all([
        supabase.from('data_order').select('*', { count: 'exact', head: true }),
        supabase.from('data_order').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart),
        supabase.from('data_order').select('*', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
      ]);

      setStats({
        total_files: totalFiles,
        bucket_counts: {
          orderpdf: orderPdfCount,
          stockpic: stockPicCount,
          productspec: productSpecCount
        },
        order_count: ordersResult.count || 0,
        orders_today: ordersTodayResult.count || 0,
        orders_week: ordersWeekResult.count || 0
      });

      // 如果是 MEDIUM 或 LARGE size，載入最近的上傳記錄
      if (size !== WidgetSize.SMALL) {
        // 模擬最近上傳記錄
        const mockUploads: RecentUpload[] = [
          {
            id: '1',
            type: 'order',
            filename: 'PO-2024-001.pdf',
            uploaded_at: new Date().toISOString(),
            uploaded_by: 'Admin',
            size: '2.5 MB'
          },
          {
            id: '2',
            type: 'spec',
            filename: 'Product-Spec-ABC123.pdf',
            uploaded_at: new Date(Date.now() - 3600000).toISOString(),
            uploaded_by: 'User1',
            size: '1.8 MB'
          },
          {
            id: '3',
            type: 'file',
            filename: 'Invoice-INV001.pdf',
            uploaded_at: new Date(Date.now() - 7200000).toISOString(),
            uploaded_by: 'Admin',
            size: '0.5 MB'
          },
          {
            id: '4',
            type: 'order',
            filename: 'PO-2024-002.pdf',
            uploaded_at: new Date(Date.now() - 10800000).toISOString(),
            uploaded_by: 'User2',
            size: '3.2 MB'
          }
        ];
        
        setRecentUploads(mockUploads.slice(0, size === WidgetSize.MEDIUM ? 3 : 5));
      }

      // 如果是 LARGE size，載入圖表資料
      if (size === WidgetSize.LARGE) {
        // 模擬7天上傳趨勢數據
        const chartArray = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          chartArray.push({
            date: format(date, 'MM/dd'),
            uploads: Math.floor(Math.random() * 20) + 10
          });
        }
        setChartData(chartArray);
      }

    } catch (error) {
      console.error('Error loading document statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentStats();
    
    // 設置自動刷新
    const interval = setInterval(loadDocumentStats, widget.config.refreshInterval || 60000);
    return () => clearInterval(interval);
  }, [size]);

  const getUploadTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <DocumentArrowUpIcon className="w-4 h-4" />;
      case 'spec':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return <CloudArrowUpIcon className="w-4 h-4" />;
    }
  };

  const getUploadTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'spec':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default:
        return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  // 2x2 - 只顯示數值
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 cursor-pointer" onClick={() => openDialog('uploadFilesOnly')}>
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <CloudArrowUpIcon className="w-8 h-8 text-purple-400 mb-2" />
            <div className="text-3xl font-bold text-white">{stats.total_files}</div>
            <div className="text-xs text-slate-400 mt-1">Total Files</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 4x4 - 顯示資料明細和快速操作
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5 text-purple-400" />
              <span className="text-lg">Document Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 快速操作按鈕 */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDialog('uploadFilesOnly')}
                className="bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-300 text-xs p-2 h-auto flex flex-col gap-1"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                <span>Files</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDialog('uploadOrderPdf')}
                className="bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30 text-blue-300 text-xs p-2 h-auto flex flex-col gap-1"
              >
                <DocumentArrowUpIcon className="w-4 h-4" />
                <span>Orders</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDialog('productSpec')}
                className="bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30 text-purple-300 text-xs p-2 h-auto flex flex-col gap-1"
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>Specs</span>
              </Button>
            </div>

            {/* 統計摘要 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-white">{stats.bucket_counts.orderpdf}</div>
                <div className="text-xs text-slate-400">Orders</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-white">{stats.bucket_counts.stockpic}</div>
                <div className="text-xs text-slate-400">Pictures</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-white">{stats.bucket_counts.productspec}</div>
                <div className="text-xs text-slate-400">Specs</div>
              </div>
            </div>

            {/* 最近上傳 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400">Recent Uploads</h4>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-12 bg-slate-700/30 rounded-lg"></div>
                  ))}
                </div>
              ) : recentUploads.length === 0 ? (
                <div className="text-center py-4 text-slate-500">No recent uploads</div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentUploads.map((upload) => (
                    <div key={upload.id} className="bg-slate-700/30 rounded-lg p-2 text-xs">
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded ${getUploadTypeColor(upload.type)}`}>
                          {getUploadTypeIcon(upload.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{upload.filename}</div>
                          <div className="text-slate-400">{upload.size} • {format(new Date(upload.uploaded_at), 'HH:mm')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 6x6 - 顯示圖表統計和完整功能
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CloudArrowUpIcon className="w-6 h-6 text-purple-400" />
            <span className="text-xl">Document Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 統計卡片 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-3 border border-purple-500/30">
              <div className="text-2xl font-bold text-white">{stats.total_files}</div>
              <div className="text-xs text-purple-300">Total Files</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
              <div className="text-2xl font-bold text-white">{stats.bucket_counts.orderpdf}</div>
              <div className="text-xs text-blue-300">Order PDFs</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
              <div className="text-2xl font-bold text-white">{stats.bucket_counts.stockpic}</div>
              <div className="text-xs text-green-300">Stock Pictures</div>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-500/30">
              <div className="text-2xl font-bold text-white">{stats.bucket_counts.productspec}</div>
              <div className="text-xs text-purple-300">Product Specs</div>
            </div>
          </div>

          {/* 訂單數量統計 */}
          <div className="bg-slate-700/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Order Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.order_count}</div>
                <div className="text-xs text-slate-400">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.orders_today}</div>
                <div className="text-xs text-slate-400">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.orders_week}</div>
                <div className="text-xs text-slate-400">This Week</div>
              </div>
            </div>
          </div>

          {/* 快速上傳按鈕 */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => openDialog('uploadFilesOnly')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CloudArrowUpIcon className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
            <Button
              onClick={() => openDialog('uploadOrderPdf')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Upload Order
            </Button>
            <Button
              onClick={() => openDialog('productSpec')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Upload Spec
            </Button>
          </div>

          {/* 最近上傳列表 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-400">Recent Uploads</h4>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-700/30 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getUploadTypeColor(upload.type)}`}>
                          {getUploadTypeIcon(upload.type)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{upload.filename}</div>
                          <div className="text-sm text-slate-400">{upload.size} • Uploaded by {upload.uploaded_by}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">{format(new Date(upload.uploaded_at), 'MMM dd')}</div>
                        <div className="text-xs text-slate-500">{format(new Date(upload.uploaded_at), 'HH:mm')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}