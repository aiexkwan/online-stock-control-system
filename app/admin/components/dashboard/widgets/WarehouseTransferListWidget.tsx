/**
 * Warehouse Transfer List Widget
 * 列表形式顯示 record_transfer 內容
 * 只需顯示 "time", "pallet number", "operator"
 * 只顯示 operator department = "Warehouse" 的記錄
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { DocumentTextIcon, UserIcon, ClockIcon, CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';

interface TransferRecord {
  tran_date: string;
  plt_num: string;
  operator_name: string;
}

export const WarehouseTransferListWidget = React.memo(function WarehouseTransferListWidget({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      const range = getYesterdayRange();
      return {
        start: new Date(range.start),
        end: new Date(range.end)
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end
    };
  }, [timeFrame]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createClient();
        
        // 先查詢 transfer 記錄
        const { data: transferData, error: transferError } = await supabase
          .from('record_transfer')
          .select('tran_date, plt_num, operator_id')
          .gte('tran_date', dateRange.start.toISOString())
          .lte('tran_date', dateRange.end.toISOString())
          .order('tran_date', { ascending: false })
          .limit(50);

        if (transferError) throw transferError;
        if (!transferData || transferData.length === 0) {
          setTransfers([]);
          return;
        }

        // 獲取唯一的 operator IDs
        const operatorIds = [...new Set(transferData.map(t => t.operator_id).filter(id => id != null))];
        
        // 查詢 operator 資料
        const { data: operatorData, error: operatorError } = await supabase
          .from('data_id')
          .select('id,name,department')
          .in('id', operatorIds);
          
        if (operatorError) throw operatorError;
        
        // 建立 operator ID 到資料的映射
        const operatorMap = new Map(
          (operatorData || []).map(op => [op.id, op])
        );
        
        // 過濾只顯示倉庫部門的記錄
        const warehouseTransfers = transferData
          .filter(transfer => {
            const operator = operatorMap.get(transfer.operator_id);
            return operator?.department === 'Warehouse';
          })
          .map(transfer => {
            const operator = operatorMap.get(transfer.operator_id);
            return {
              tran_date: transfer.tran_date,
              plt_num: transfer.plt_num,
              operator_name: operator?.name || 'Unknown'
            };
          });

        setTransfers(warehouseTransfers);
      } catch (err) {
        console.error('Error fetching warehouse transfers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Warehouse Transfer List</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5" />
            Warehouse Transfers
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading transfers</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No warehouse transfers found</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-slate-600/50 text-xs font-medium text-gray-400 uppercase">
                <div className="col-span-4 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  Time
                </div>
                <div className="col-span-4 flex items-center gap-1">
                  <CubeIcon className="w-3 h-3" />
                  Pallet Number
                </div>
                <div className="col-span-4 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  Operator
                </div>
              </div>
              
              {/* Transfer Records */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {transfers.map((transfer, index) => (
                  <motion.div
                    key={`${transfer.plt_num}-${transfer.tran_date}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="grid grid-cols-12 gap-2 py-2 px-2 bg-slate-700/20 rounded hover:bg-slate-700/40 transition-colors text-sm"
                  >
                    <div className="col-span-4 text-gray-300">
                      {format(parseISO(transfer.tran_date), 'HH:mm:ss')}
                    </div>
                    <div className="col-span-4 text-white font-medium truncate">
                      {transfer.plt_num}
                    </div>
                    <div className="col-span-4 text-gray-300 truncate">
                      {transfer.operator_name}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Footer with count */}
              <div className="pt-2 mt-2 border-t border-slate-600/50 text-xs text-gray-400 text-center">
                {transfers.length} transfers shown
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </WidgetCard>
  );
});