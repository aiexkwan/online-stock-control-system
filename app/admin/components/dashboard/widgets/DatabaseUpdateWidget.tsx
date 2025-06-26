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
import { WidgetComponentProps } from '@/app/types/dashboard';
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

  // 3x3 - Quick access + 最近更新記錄

  // 5x5 - 不支援
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="DATABASE_UPDATE" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col items-center justify-center">
          <h3 className="text-xs text-slate-400 mb-1">System Update</h3>
          <div className="text-lg font-medium text-slate-500">(N/A)</div>
          <p className="text-xs text-slate-500 mt-1">5×5</p>
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});