/**
 * System Update Widget
 * 1x1: 不支援
 * 3x3: Quick access 按鈕 + 最近更新記錄
 * 5x5: 不支援
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, DocumentTextIcon, UserGroupIcon, ExclamationCircleIcon, ServerIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
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

export const DatabaseUpdateWidget = React.memo(function DatabaseUpdateWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [recentUpdates, setRecentUpdates] = useState<UpdateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { openDialog } = useDialog();
  
  // Get widget size
  const size = widget.size || WidgetSize.MEDIUM;
  

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
    loadRecentUpdates();
  }, [loadRecentUpdates]);

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
      <WidgetCard widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <ServerIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Not supported</p>
            <p className="text-xs text-slate-500">Min size: 3×3</p>
          </div>
        </CardContent>
      </WidgetCard>
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
        <WidgetCard widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
          <CardHeader className="pb-3">
            <CardTitle className="widget-title flex items-center gap-2">
              <ServerIcon className="w-5 h-5" />
              System Update
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleOpenProductUpdate}
                disabled={isEditMode}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
              >
                <CubeIcon className="w-8 h-8" />
                <span className="text-sm font-medium">Update Product</span>
              </Button>
              <Button
                onClick={handleOpenSupplierUpdate}
                disabled={isEditMode}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
              >
                <UserGroupIcon className="w-8 h-8" />
                <span className="text-sm font-medium">Update Supplier</span>
              </Button>
            </div>

            {/* Recent Updates */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Recent Updates</h4>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-700/30 rounded-lg"></div>
                  ))}
                </div>
              ) : recentUpdates.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentUpdates.slice(0, 5).map((record) => (
                    <div
                      key={record.uuid}
                      className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                    >
                      {getActionIcon(record.action)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{record.action}</p>
                        <p className="text-xs text-slate-400">{record.id}</p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTime(record.time)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent updates</p>
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
    <WidgetCard widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
      <CardHeader className="pb-3">
        <CardTitle className="widget-title flex items-center gap-2">
          <ServerIcon className="w-5 h-5" />
          System Update
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-lg text-slate-400">Not supported at this size</p>
          <p className="text-sm text-slate-500 mt-2">Available in 3×3 size only</p>
        </div>
      </CardContent>
    </WidgetCard>
  );
});