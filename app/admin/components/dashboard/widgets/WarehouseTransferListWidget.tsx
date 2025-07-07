/**
 * Warehouse Transfer List Widget
 * 列表形式顯示 record_transfer 內容
 * 只需顯示 "time", "pallet number", "operator"
 * 只顯示 operator department = "Warehouse" 的記錄
 * 
 * 已遷移至統一架構：
 * - 使用 DashboardAPI 統一數據訪問
 * - 服務器端 JOIN 和過濾
 * - 優化性能和代碼結構
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { DocumentTextIcon, UserIcon, ClockIcon, CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
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
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

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
        // 使用統一的 DashboardAPI 獲取數據
        const result = await dashboardAPI.fetch({
          widgetIds: ['statsCard'],
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          params: {
            dataSource: 'warehouse_transfer_list',
            limit: 50,
            offset: 0
          }
        }, {
          strategy: 'server',
          cache: { ttl: 60 } // 1分鐘緩存
        });

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];
          
          if (widgetData.data.error) {
            console.error('[WarehouseTransferListWidget] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setTransfers([]);
            return;
          }

          const transferList = widgetData.data.value || [];
          console.log('[WarehouseTransferListWidget] API returned', transferList.length, 'transfers');
          console.log('[WarehouseTransferListWidget] Metadata:', widgetData.data.metadata);

          // 直接使用 API 返回的數據，已經經過優化處理
          setTransfers(transferList);
          
          console.log('[WarehouseTransferListWidget] Data processed successfully using optimized API');
        } else {
          console.warn('[WarehouseTransferListWidget] No widget data returned from API');
          setTransfers([]);
        }
      } catch (err) {
        console.error('[WarehouseTransferListWidget] Error fetching transfers from API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, dashboardAPI]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 font-medium">Warehouse Transfer List</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5" />
            Warehouse Transfers
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
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
            <div className="text-center text-slate-400 font-medium py-8">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No warehouse transfers found</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-slate-600/50 widget-text-sm uppercase">
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
                    <div className="col-span-4 text-slate-300 font-medium">
                      {format(parseISO(transfer.tran_date), 'HH:mm:ss')}
                    </div>
                    <div className="col-span-4 text-white font-medium truncate">
                      {transfer.plt_num}
                    </div>
                    <div className="col-span-4 text-slate-300 font-medium truncate">
                      {transfer.operator_name}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Footer with count */}
              <div className="pt-2 mt-2 border-t border-slate-600/50 widget-text-sm text-center">
                {transfers.length} transfers shown
              </div>
            </div>
          )}
        </CardContent>
    </WidgetCard>
  );
});

export default WarehouseTransferListWidget;