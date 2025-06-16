/**
 * Database Update Widget
 * 2x2: 顯示待更新數量
 * 4x4: 顯示最近更新記錄
 * 6x6: 顯示更新統計和操作面板
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';

interface UpdateStats {
  pending_updates: number;
  completed_today: number;
  completed_week: number;
  total_updates: number;
  update_types: Array<{ type: string; count: number }>;
}

interface RecentUpdate {
  id: string;
  type: string;
  description: string;
  updated_at: string;
  updated_by: string;
  status: 'pending' | 'completed' | 'failed';
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function DatabaseUpdateWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [stats, setStats] = useState<UpdateStats>({
    pending_updates: 0,
    completed_today: 0,
    completed_week: 0,
    total_updates: 0,
    update_types: []
  });
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { openDialog } = useDialog();
  
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 載入資料庫更新統計
  const loadUpdateStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);

      // 獲取產品和庫存更新統計
      const [productResult, inventoryResult] = await Promise.all([
        supabase.from('data_product').select('*', { count: 'exact', head: true }),
        supabase.from('record_inventory').select('*', { count: 'exact', head: true })
      ]);

      // 模擬一些統計數據（實際應該從專門的更新記錄表獲取）
      setStats({
        pending_updates: Math.floor(Math.random() * 10) + 5,
        completed_today: Math.floor(Math.random() * 20) + 10,
        completed_week: Math.floor(Math.random() * 100) + 50,
        total_updates: (productResult.count || 0) + (inventoryResult.count || 0),
        update_types: [
          { type: 'Product', count: productResult.count || 0 },
          { type: 'Inventory', count: inventoryResult.count || 0 },
          { type: 'ACO Orders', count: Math.floor(Math.random() * 50) + 20 },
          { type: 'Transfers', count: Math.floor(Math.random() * 30) + 15 }
        ]
      });

      // 如果是 MEDIUM 或 LARGE size，載入最近的更新記錄
      if (size !== WidgetSize.SMALL) {
        // 模擬最近更新記錄
        const mockUpdates: RecentUpdate[] = [
          {
            id: '1',
            type: 'Product',
            description: 'Updated product specifications',
            updated_at: new Date().toISOString(),
            updated_by: 'System',
            status: 'completed'
          },
          {
            id: '2',
            type: 'Inventory',
            description: 'Stock level adjustment',
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            updated_by: 'Admin',
            status: 'completed'
          },
          {
            id: '3',
            type: 'ACO Order',
            description: 'New order import',
            updated_at: new Date(Date.now() - 7200000).toISOString(),
            updated_by: 'System',
            status: 'pending'
          }
        ];
        
        setRecentUpdates(mockUpdates.slice(0, size === WidgetSize.MEDIUM ? 3 : 5));
      }

    } catch (error) {
      console.error('Error loading update statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdateStats();
    
    // 設置自動刷新
    const interval = setInterval(loadUpdateStats, widget.config.refreshInterval || 60000);
    return () => clearInterval(interval);
  }, [size]);

  const handleOpenUpdateDialog = () => {
    openDialog('databaseUpdate');
  };

  // 2x2 - 只顯示數值
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 cursor-pointer" onClick={handleOpenUpdateDialog}>
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <CubeIcon className="w-8 h-8 text-orange-400 mb-2" />
            <div className="text-3xl font-bold text-white">{stats.pending_updates}</div>
            <div className="text-xs text-slate-400 mt-1">Pending Updates</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 4x4 - 顯示資料明細
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-orange-500/30 hover:border-orange-400/50 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CubeIcon className="w-5 h-5 text-orange-400" />
                <span className="text-lg">Database Update</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenUpdateDialog}
                className="text-orange-400 hover:text-orange-300"
              >
                Update
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 統計摘要 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-500/20 rounded-lg p-3 border border-orange-500/30">
                <div className="text-2xl font-bold text-white">{stats.pending_updates}</div>
                <div className="text-xs text-orange-300">Pending</div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{stats.completed_today}</div>
                <div className="text-xs text-slate-400">Today</div>
              </div>
            </div>

            {/* 最近更新記錄 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400">Recent Updates</h4>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-700/30 rounded-lg"></div>
                  ))}
                </div>
              ) : recentUpdates.length === 0 ? (
                <div className="text-center py-4 text-slate-500">No recent updates</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentUpdates.map((update) => (
                    <div key={update.id} className="bg-slate-700/30 rounded-lg p-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{update.type}</span>
                            {update.status === 'completed' ? (
                              <CheckCircleIcon className="w-3 h-3 text-green-400" />
                            ) : update.status === 'pending' ? (
                              <ArrowPathIcon className="w-3 h-3 text-yellow-400 animate-spin" />
                            ) : null}
                          </div>
                          <div className="text-slate-400 truncate">{update.description}</div>
                        </div>
                        <div className="text-slate-500 text-right">
                          <div>{format(new Date(update.updated_at), 'HH:mm')}</div>
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

  // 6x6 - 顯示功能按鈕和歷史操作
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-orange-500/30 hover:border-orange-400/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CubeIcon className="w-6 h-6 text-orange-400" />
              <span className="text-xl">Database Management</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 主要功能按鈕 */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 hover:from-orange-500/30 hover:to-orange-600/30 text-white flex flex-col items-center justify-center gap-2"
              onClick={handleOpenUpdateDialog}
            >
              <CubeIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Update Product Data</span>
            </Button>
            <Button
              className="h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-blue-600/30 text-white flex flex-col items-center justify-center gap-2"
              onClick={handleOpenUpdateDialog}
            >
              <ArrowPathIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Sync Inventory</span>
            </Button>
            <Button
              className="h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 hover:from-green-500/30 hover:to-green-600/30 text-white flex flex-col items-center justify-center gap-2"
              onClick={handleOpenUpdateDialog}
            >
              <CheckCircleIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Import ACO Orders</span>
            </Button>
            <Button
              className="h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-600/30 text-white flex flex-col items-center justify-center gap-2"
              onClick={handleOpenUpdateDialog}
            >
              <CubeIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Batch Operations</span>
            </Button>
          </div>

          {/* 最近操作歷史 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-400">Recent Operations</h4>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-slate-700/30 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{update.type}</span>
                          {update.status === 'completed' ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          ) : update.status === 'pending' ? (
                            <ArrowPathIcon className="w-4 h-4 text-yellow-400 animate-spin" />
                          ) : null}
                        </div>
                        <div className="text-sm text-slate-400">{update.description}</div>
                        <div className="text-xs text-slate-500 mt-1">By: {update.updated_by}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">{format(new Date(update.updated_at), 'MMM dd')}</div>
                        <div className="text-xs text-slate-500">{format(new Date(update.updated_at), 'HH:mm')}</div>
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