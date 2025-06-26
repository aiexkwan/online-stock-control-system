/**
 * Warehouse Transfer List Widget - GraphQL Version
 * 列表形式顯示 record_transfer 內容
 * 只需顯示 "time", "pallet number", "operator"
 * 只顯示 operator department = "Warehouse" 的記錄
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { DocumentTextIcon, UserIcon, ClockIcon, CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { GET_WAREHOUSE_TRANSFERS } from '@/lib/graphql/queries';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';

interface TransferRecord {
  tran_date: string;
  plt_num: string;
  operator_name: string;
}

export const WarehouseTransferListWidgetGraphQL = React.memo(function WarehouseTransferListWidgetGraphQL({ 
  widget, 
  isEditMode,
  timeFrame 
}: WidgetComponentProps) {
  
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

  // 使用 GraphQL 查詢 - 使用新的 stable client
  const { data, loading, error, isRefetching } = useGraphQLQuery(
    GET_WAREHOUSE_TRANSFERS,
    {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      limit: 50
    }
  );

  // 處理數據 - 過濾只顯示倉庫部門的記錄
  const transfers = useMemo<TransferRecord[]>(() => {
    if (!data?.record_transferCollection?.edges) return [];

    return data.record_transferCollection.edges
      .filter((edge: any) => {
        // 只顯示倉庫部門的記錄
        return edge.node.data_id?.department === 'Warehouse';
      })
      .map((edge: any) => ({
        tran_date: edge.node.tran_date,
        plt_num: edge.node.plt_num,
        operator_name: edge.node.data_id?.name || 'Unknown'
      }));
  }, [data]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Warehouse Transfer List (GraphQL)</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <div className="relative h-full flex flex-col">
        {/* GraphQL 標識 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full shadow-lg z-10">
          GraphQL
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5" />
            Warehouse Transfers
            {isRefetching && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="ml-auto"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </motion.div>
            )}
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          {loading && !data ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading transfers</p>
              <p className="text-xs mt-1">{error.message}</p>
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
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
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