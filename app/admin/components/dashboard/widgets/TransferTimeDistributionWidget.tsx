/**
 * Transfer Time Distribution Widget
 * 以 no dot 線形圖顯示 transfer done 的時間分布
 * 支援頁面的 time frame selector
 * 自動將 time frame 分成 12 節顯示
 */

'use client';

import React, { useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { gql } from '@/lib/graphql-client-stable';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, endOfDay, addHours, differenceInHours } from 'date-fns';
import { getYesterdayRange } from '@/app/utils/timezone';

// GraphQL 查詢 - 獲取轉移時間分布
const GET_TRANSFER_TIME_DISTRIBUTION = gql`
  query GetTransferTimeDistribution($startDate: Datetime!, $endDate: Datetime!) {
    record_transferCollection(
      filter: {
        tran_date: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ tran_date: AscNullsLast }]
    ) {
      edges {
        node {
          tran_date
        }
      }
    }
  }
`;

export const TransferTimeDistributionWidget = React.memo(function TransferTimeDistributionWidget({ 
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

  // 使用 GraphQL 查詢獲取數據
  const { data, loading, error } = useGraphQLQuery(GET_TRANSFER_TIME_DISTRIBUTION, {
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString()
  });

  // 處理時間分布數據
  const chartData = useMemo(() => {
    if (!data?.record_transferCollection?.edges) return [];

    const transfers = data.record_transferCollection.edges.map((edge: any) => ({
      time: parseISO(edge.node.tran_date)
    }));

    // 計算時間範圍的總小時數
    const totalHours = differenceInHours(dateRange.end, dateRange.start);
    const intervalHours = Math.max(1, Math.floor(totalHours / 12)); // 分成12節

    // 創建12個時間段
    const timeSlots = [];
    for (let i = 0; i < 12; i++) {
      const slotStart = addHours(dateRange.start, i * intervalHours);
      const slotEnd = addHours(slotStart, intervalHours);
      
      // 計算這個時間段內的轉移次數
      const count = transfers.filter(transfer => 
        transfer.time >= slotStart && transfer.time < slotEnd
      ).length;

      timeSlots.push({
        time: format(slotStart, totalHours <= 24 ? 'HH:mm' : 'MMM d HH:mm'),
        value: count,
        fullTime: slotStart
      });
    }

    return timeSlots;
  }, [data, dateRange]);

  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 font-medium">Transfer Time Distribution</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Transfer Time Distribution
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            From {format(dateRange.start, 'MMM d')} to {format(dateRange.end, 'MMM d')}
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse h-32 w-full bg-slate-700/50 rounded" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">
              <p>Error loading data</p>
              <p className="text-xs mt-1">{error.message}</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                    formatter={(value: any) => [value, 'Transfers']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false} // No dots as requested
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </CardContent>
    </WidgetCard>
  );
});