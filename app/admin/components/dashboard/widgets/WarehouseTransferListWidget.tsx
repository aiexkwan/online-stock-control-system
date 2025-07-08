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
import { WidgetStyles } from '@/app/utils/widgetStyles';

interface TransferRecord {
  tran_date: string;
  plt_num: string;
  operator_name: string;
}

export const WarehouseTransferListWidget = React.memo(function WarehouseTransferListWidget({
  widget,
  isEditMode,
  timeFrame,
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
        end: new Date(range.end),
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 使用統一的 DashboardAPI 獲取數據
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
            params: {
              dataSource: 'warehouse_transfer_list',
              limit: 50,
              offset: 0,
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 60 }, // 1分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[WarehouseTransferListWidget] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setTransfers([]);
            return;
          }

          const transferList = widgetData.data.value || [];
          console.log(
            '[WarehouseTransferListWidget] API returned',
            transferList.length,
            'transfers'
          );
          console.log('[WarehouseTransferListWidget] Metadata:', widgetData.data.metadata);

          // 直接使用 API 返回的數據，已經經過優化處理
          setTransfers(transferList);

          console.log(
            '[WarehouseTransferListWidget] Data processed successfully using optimized API'
          );
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
      <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders} isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Warehouse Transfer List</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType={widget.type.toUpperCase() as keyof typeof WidgetStyles.borders}>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <DocumentTextIcon className='h-5 w-5' />
          Warehouse Transfers
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
        </p>
      </CardHeader>
      <CardContent className='flex-1 overflow-hidden'>
        {loading ? (
          <div className='space-y-2'>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className='h-12 animate-pulse rounded bg-slate-700/50' />
            ))}
          </div>
        ) : error ? (
          <div className='text-center text-sm text-red-400'>
            <p>Error loading transfers</p>
            <p className='mt-1 text-xs'>{error}</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className='py-8 text-center font-medium text-slate-400'>
            <DocumentTextIcon className='mx-auto mb-2 h-12 w-12 opacity-50' />
            <p>No warehouse transfers found</p>
          </div>
        ) : (
          <div className='flex h-full flex-col'>
            {/* Column Headers */}
            <div className='widget-text-sm mb-2 grid grid-cols-12 gap-2 border-b border-slate-600/50 pb-2 uppercase'>
              <div className='col-span-4 flex items-center gap-1'>
                <ClockIcon className='h-3 w-3' />
                Time
              </div>
              <div className='col-span-4 flex items-center gap-1'>
                <CubeIcon className='h-3 w-3' />
                Pallet Number
              </div>
              <div className='col-span-4 flex items-center gap-1'>
                <UserIcon className='h-3 w-3' />
                Operator
              </div>
            </div>

            {/* Transfer Records */}
            <div className='flex-1 space-y-1 overflow-y-auto'>
              {transfers.map((transfer, index) => (
                <motion.div
                  key={`${transfer.plt_num}-${transfer.tran_date}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className='grid grid-cols-12 gap-2 rounded bg-slate-700/20 px-2 py-2 text-sm transition-colors hover:bg-slate-700/40'
                >
                  <div className='col-span-4 font-medium text-slate-300'>
                    {format(parseISO(transfer.tran_date), 'HH:mm:ss')}
                  </div>
                  <div className='col-span-4 truncate font-medium text-white'>
                    {transfer.plt_num}
                  </div>
                  <div className='col-span-4 truncate font-medium text-slate-300'>
                    {transfer.operator_name}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer with count */}
            <div className='widget-text-sm mt-2 border-t border-slate-600/50 pt-2 text-center'>
              {transfers.length} transfers shown
            </div>
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default WarehouseTransferListWidget;
