/**
 * Staff Workload Widget - Apollo GraphQL Version
 * 顯示員工工作量折線圖
 * 
 * GraphQL Migration:
 * - 遷移至 Apollo Client
 * - 支援實時數據更新
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGetStaffWorkloadQuery } from '@/lib/graphql/generated/apollo-hooks';
import { WidgetSkeleton } from './common/WidgetStates';

interface StaffWorkloadWidgetProps extends WidgetComponentProps {
  title: string;
  department?: string;
  useGraphQL?: boolean;
}

// 顏色配置
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green  
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#64748B', // gray
  '#EC4899', // pink
  '#6366F1'  // indigo
];

export const StaffWorkloadWidget: React.FC<StaffWorkloadWidgetProps> = ({ 
  title, 
  timeFrame,
  isEditMode,
  department = 'Injection',
  useGraphQL,
  widget
}) => {
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 默認使用過去7天
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      return {
        start: startDate,
        end: endDate,
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

  // 使用環境變量控制是否使用 GraphQL
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION === 'true' || 
                          (useGraphQL ?? widget?.config?.useGraphQL ?? false);

  // Apollo GraphQL 查詢 - 使用生成嘅 hook
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetStaffWorkloadQuery({
    skip: !shouldUseGraphQL || isEditMode,
    variables: {
      startDate: startOfDay(dateRange.start).toISOString(),
      endDate: endOfDay(dateRange.end).toISOString(),
    },
    pollInterval: 300000, // 5分鐘輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<any[]>([]);
  const [serverActionsLoading, setServerActionsLoading] = useState(!shouldUseGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);
  const [serverActionsMetadata, setServerActionsMetadata] = useState<any>({});

  // 處理 GraphQL 數據
  const graphqlChartData = useMemo(() => {
    if (!graphqlData?.record_historyCollection?.edges) {
      return [];
    }

    const edges = graphqlData.record_historyCollection.edges;
    
    // 統計每個員工每天的工作量
    const workloadMap = new Map<string, Map<string, number>>();
    
    edges.forEach((edge: any) => {
      const date = format(new Date(edge.node.time), 'yyyy-MM-dd');
      // 從 data_id 獲取員工名稱，如果沒有則使用操作者 ID
      const staffName = edge.node.data_id?.name || `Operator ${edge.node.id}` || 'Unknown';
      
      // 如果有部門過濾，檢查部門
      if (department && edge.node.data_id?.department !== department) {
        return;
      }
      
      if (!workloadMap.has(date)) {
        workloadMap.set(date, new Map());
      }
      
      const dayMap = workloadMap.get(date)!;
      dayMap.set(staffName, (dayMap.get(staffName) || 0) + 1);
    });
    
    // 轉換為圖表數據格式
    const processedData = Array.from(workloadMap.entries())
      .map(([date, staffMap]) => {
        const dayData: any = { date: format(new Date(date), 'MMM d') };
        staffMap.forEach((count, staffName) => {
          dayData[staffName] = count;
        });
        return dayData;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + ', 2025');
        const dateB = new Date(b.date + ', 2025');
        return dateA.getTime() - dateB.getTime();
      });
    
    return processedData;
  }, [graphqlData, department]);

  // 計算 GraphQL metadata
  const graphqlMetadata = useMemo(() => {
    const edges = graphqlData?.record_historyCollection?.edges || [];
    return {
      totalActions: edges.length,
      useGraphQL: true,
    };
  }, [graphqlData]);

  useEffect(() => {
    if (isEditMode || shouldUseGraphQL) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);

      try {
        setServerActionsLoading(true);
        setServerActionsError(null);
        
        // 使用統一的 DashboardAPI 獲取數據
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
            params: {
              dataSource: 'staff_workload',
              staticValue: department,
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 300 }, // 5分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[StaffWorkloadWidget] API error:', widgetData.data.error);
            setServerActionsError(widgetData.data.error);
            setServerActionsData([]);
            return;
          }

          const workloadData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[StaffWorkloadWidget] API returned data:', workloadData);
          console.log('[StaffWorkloadWidget] Metadata:', widgetMetadata);

          // 處理數據格式 - 轉換為 Recharts 需要的格式
          const processedData = processWorkloadData(workloadData);
          setServerActionsData(processedData);
          setServerActionsMetadata({ ...widgetMetadata, useGraphQL: false });

        } else {
          console.warn('[StaffWorkloadWidget] No widget data returned from API');
          setServerActionsData([]);
        }
      } catch (err) {
        console.error('[StaffWorkloadWidget] Error fetching data from API:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
        setServerActionsData([]);
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, department, isEditMode, shouldUseGraphQL]);

  // 合併數據源
  const chartData = shouldUseGraphQL ? graphqlChartData : serverActionsData;
  const loading = shouldUseGraphQL ? graphqlLoading : serverActionsLoading;
  const error = shouldUseGraphQL ? graphqlError?.message : serverActionsError;
  const metadata = shouldUseGraphQL ? graphqlMetadata : serverActionsMetadata;

  // 處理工作量數據
  const processWorkloadData = (rawData: any[]) => {
    if (!rawData || rawData.length === 0) return [];

    // 按日期分組
    const dateGroups = new Map<string, any>();
    const staffNames = new Set<string>();

    rawData.forEach(item => {
      const dateKey = format(new Date(item.work_date), 'MMM d');
      staffNames.add(item.staff_name);
      
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, { date: dateKey });
      }
      
      dateGroups.get(dateKey)![item.staff_name] = item.action_count;
    });

    // 轉換為數組並補充缺失的員工數據
    const processedData = Array.from(dateGroups.values()).map(dayData => {
      const completeData = { ...dayData };
      staffNames.forEach(name => {
        if (!(name in completeData)) {
          completeData[name] = 0;
        }
      });
      return completeData;
    });

    // 按日期排序
    return processedData.sort((a, b) => {
      const dateA = new Date(a.date + ', 2025');
      const dateB = new Date(b.date + ', 2025');
      return dateA.getTime() - dateB.getTime();
    });
  };

  // 獲取員工名單
  const staffNames = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const names = new Set<string>();
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          names.add(key);
        }
      });
    });
    
    return Array.from(names).sort();
  }, [chartData]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.dataKey}: <span className="font-semibold">{item.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full flex flex-col relative"
    >
      
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          {department} Department - From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
          {metadata?.useGraphQL ? (
            <span className="text-blue-400/70 ml-2">
              ⚡ GraphQL optimized
            </span>
          ) : metadata?.rpcFunction ? (
            <span className="text-green-400/70 ml-2">
              ✓ Server optimized
            </span>
          ) : null}
        </p>
      </CardHeader>
      
      <div className="flex-1 p-4">
        {loading ? (
          <WidgetSkeleton type="chart-bar" height={150} />
        ) : error ? (
          <div className="text-red-400 text-sm text-center h-full flex items-center justify-center">
            Error loading data: {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-slate-400 text-sm text-center h-full flex items-center justify-center">
            No workload data available for {department} department
          </div>
        ) : (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {staffNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            {metadata?.rpcFunction && (
              <p className="text-xs text-green-400/70 mt-2 text-center">
                ✓ Server optimized ({metadata.rpcFunction})
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StaffWorkloadWidget;