/**
 * System Update Widget
 * 2x2: 不支援
 * 4x4: Quick access 按鈕 + 最近更新記錄
 * 6x6: 不支援
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, DocumentTextIcon, UserGroupIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';

interface UpdateRecord {
  uuid: string;
  id: string;
  action: string;
  operator_id: string;
  time: string;
  remark?: string;
}

export function DatabaseUpdateWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [recentUpdates, setRecentUpdates] = useState<UpdateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { openDialog } = useDialog();
  
  const size = widget.config.size || WidgetSize.MEDIUM;

  // 載入最近的更新記錄
  const loadRecentUpdates = async () => {
    try {
      setLoading(true);
      
      // 查詢 record_history 表
      const { data, error } = await supabase
        .from('record_history')
        .select('*')
        .in('action', ['Product Added', 'Product Update', 'Supplier Added', 'Supplier Update'])
        .order('time', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setRecentUpdates(data.map(record => ({
          uuid: record.uuid,
          id: record.id,
          action: record.action,
          operator_id: record.operator_id || 'System',
          time: record.time,
          remark: record.remark
        })));
      }

    } catch (error) {
      console.error('Error loading update records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (size === WidgetSize.MEDIUM) {
      loadRecentUpdates();
      
      // 設置自動刷新
      const interval = setInterval(loadRecentUpdates, widget.config.refreshInterval || 60000);
      return () => clearInterval(interval);
    }
  }, [size, widget.config.refreshInterval]);

  const handleOpenProductUpdate = () => {
    if (!isEditMode) {
      openDialog('databaseUpdate', { defaultTab: 'product' });
    }
  };

  const handleOpenSupplierUpdate = () => {
    if (!isEditMode) {
      openDialog('databaseUpdate', { defaultTab: 'supplier' });
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = fromDbTime(timestamp);
      return format(date, 'MMM dd HH:mm');
    } catch {
      return 'Unknown';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Product')) {
      return <CubeIcon className="w-4 h-4 text-blue-400" />;
    } else if (action.includes('Supplier')) {
      return <UserGroupIcon className="w-4 h-4 text-green-400" />;
    }
    return <DocumentTextIcon className="w-4 h-4 text-slate-400" />;
  };

  // 2x2 - 不支援
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <ExclamationCircleIcon className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-sm font-medium text-slate-400 mb-1">Not Supported</h3>
            <p className="text-xs text-slate-500 text-center">
              Please resize to Medium
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 4x4 - Quick access + 最近更新記錄
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-200">System Update</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick Access 按鈕 */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-blue-600/30 text-white flex flex-col items-center justify-center gap-1 transition-all"
                onClick={handleOpenProductUpdate}
                disabled={isEditMode}
              >
                <CubeIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Update Product Info</span>
              </Button>
              <Button
                size="sm"
                className="h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 hover:from-green-500/30 hover:to-green-600/30 text-white flex flex-col items-center justify-center gap-1 transition-all"
                onClick={handleOpenSupplierUpdate}
                disabled={isEditMode}
              >
                <UserGroupIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Update Supplier Info</span>
              </Button>
            </div>

            {/* 最近更新記錄 */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400">Recent Updates</h4>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-slate-700/30 rounded-lg"></div>
                  ))}
                </div>
              ) : recentUpdates.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">No recent updates</div>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {recentUpdates.map((update) => (
                    <div key={update.uuid} className="bg-slate-800/50 rounded-lg p-2 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(update.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-white truncate">{update.action}</span>
                            <span className="text-xs text-slate-500 flex-shrink-0">{formatTime(update.time)}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            by {update.operator_id}
                            {update.remark && (
                              <span className="ml-1 text-slate-500">• {update.remark}</span>
                            )}
                          </div>
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

  // 6x6 - 不支援
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl">
        <CardContent className="p-6 h-full flex flex-col items-center justify-center">
          <ExclamationCircleIcon className="w-16 h-16 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">Not Supported</h3>
          <p className="text-sm text-slate-500 text-center">
            This widget is only available in Medium (4x4) size
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}