/**
 * System Update Widget
 * 1x1: 不支援
 * 3x3: Quick access 按鈕 + 最近更新記錄
 * 5x5: 不支援
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, DocumentTextIcon, UserGroupIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';
import { Button } from "@/components/ui/button";
import { useDialog } from '@/app/contexts/DialogContext';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import { WidgetStyles } from '@/app/utils/widgetStyles';

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
  const loadRecentUpdates = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    if (size === WidgetSize.MEDIUM) {
      loadRecentUpdates();
      
      // 設置自動刷新
      const interval = setInterval(loadRecentUpdates, widget.config.refreshInterval || 60000);
      return () => clearInterval(interval);
    }
  }, [size, widget.config.refreshInterval, loadRecentUpdates]);

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

  // 1x1 - 不支援
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard size={widget.config.size} widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
          <CardContent className="p-2 h-full flex flex-col items-center justify-center">
            <h3 className="text-xs text-slate-400 mb-1">System Update</h3>
            <div className="text-lg font-medium text-slate-500">(N/A)</div>
            <p className="text-xs text-slate-500 mt-1">1×1</p>
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  // 3x3 - Quick access + 最近更新記錄
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <WidgetCard size={widget.config.size} widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
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
                className={`h-16 ${WidgetStyles.quickAccess.systemUpdate['Update Product Info']} text-white flex flex-col items-center justify-center gap-1 transition-all`}
                onClick={handleOpenProductUpdate}
                disabled={isEditMode}
              >
                <CubeIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Update Product Info</span>
              </Button>
              <Button
                size="sm"
                className={`h-16 ${WidgetStyles.quickAccess.systemUpdate['Update Supplier Info']} text-white flex flex-col items-center justify-center gap-1 transition-all`}
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
                    <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
                  ))}
                </div>
              ) : recentUpdates.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">No recent updates</div>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {recentUpdates.map((update) => (
                    <div key={update.uuid} className="bg-black/20 rounded-lg p-2 hover:bg-white/10 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(update.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-purple-400 truncate">{update.action}</span>
                            <span className="text-xs text-purple-300 flex-shrink-0">{formatTime(update.time)}</span>
                          </div>
                          <div className="text-xs text-purple-300">
                            by {update.operator_id}
                            {update.remark && (
                              <span className="ml-1 text-purple-200">• {update.remark}</span>
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
        </WidgetCard>
      </motion.div>
    );
  }

  // 5x5 - 不支援
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard size={widget.config.size} widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col items-center justify-center">
          <h3 className="text-xs text-slate-400 mb-1">System Update</h3>
          <div className="text-lg font-medium text-slate-500">(N/A)</div>
          <p className="text-xs text-slate-500 mt-1">5×5</p>
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
}