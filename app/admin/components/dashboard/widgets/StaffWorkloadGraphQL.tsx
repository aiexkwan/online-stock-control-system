/**
 * Staff Workload Widget - GraphQL Version
 * 顯示員工工作量折線圖
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useGraphQLQuery, gql } from '@/lib/graphql-client-stable';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface StaffWorkloadGraphQLProps {
  title: string;
  timeFrame: TimeFrame;
  className?: string;
  department?: string;
}

// 獲取部門員工的查詢
const GET_DEPARTMENT_STAFF = gql`
  query GetDepartmentStaff($department: String!) {
    data_idCollection(
      filter: { department: { eq: $department } }
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

// 獲取所有員工工作記錄的查詢 - 更高效的批量查詢
const GET_ALL_STAFF_WORKLOAD = gql`
  query GetAllStaffWorkload($staffIds: [Int!]!, $startDate: Datetime!, $endDate: Datetime!) {
    record_historyCollection(
      filter: {
        id: { in: $staffIds }
        time: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ time: AscNullsLast }]
    ) {
      edges {
        node {
          id
          time
          action
        }
      }
    }
  }
`;

// 顏色配置
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green  
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899'  // pink
];

export const StaffWorkloadGraphQL: React.FC<StaffWorkloadGraphQLProps> = ({ 
  title, 
  timeFrame,
  className,
  department = 'Injection'
}) => {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [staffList, setStaffList] = React.useState<any[]>([]);
  const [displayStaffList, setDisplayStaffList] = React.useState<any[]>([]);

  // 獲取部門員工列表
  const { data: staffData, loading: staffLoading, error: staffError } = useGraphQLQuery(
    GET_DEPARTMENT_STAFF,
    { department }
  );

  // 處理員工列表
  React.useEffect(() => {
    if (staffData?.data_idCollection) {
      const edges = staffData.data_idCollection.edges || [];
      setStaffList(edges.map((edge: any) => edge.node));
    }
  }, [staffData]);

  // 獲取所有員工的工作記錄
  const staffIds = React.useMemo(() => {
    return staffList.map(staff => staff.id);
  }, [staffList]);

  // 使用 GraphQL 查詢獲取工作量數據 - 使用新的 stable client
  const { data: workloadData, loading: workloadLoading, isRefetching } = useGraphQLQuery(
    GET_ALL_STAFF_WORKLOAD,
    staffIds.length > 0 ? {
      staffIds,
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString()
    } : {
      staffIds: [],
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString()
    }
  );

  // 處理工作量數據
  React.useEffect(() => {
    if (!workloadData?.record_historyCollection || !staffList.length) {
      setChartData([]);
      setDisplayStaffList([]);
      return;
    }

    // 生成日期範圍
    const days = eachDayOfInterval({ 
      start: timeFrame.start, 
      end: timeFrame.end 
    });

    // 初始化圖表數據
    const dailyData = days.map(day => {
      const dataPoint: any = { 
        date: format(day, 'MMM dd'),
        fullDate: format(day, 'yyyy-MM-dd')
      };
      staffList.forEach(staff => {
        dataPoint[staff.name] = 0;
      });
      return dataPoint;
    });

    // 創建員工 ID 到名稱的映射
    const staffMap = new Map(staffList.map(staff => [staff.id, staff.name]));

    // 統計每個員工每天的操作次數
    const edges = workloadData.record_historyCollection.edges || [];
    const staffWithWork = new Set<string>(); // 記錄有工作的員工名稱
    
    edges.forEach((edge: any) => {
      const record = edge.node;
      const staffName = staffMap.get(record.id);
      if (!staffName) return;

      staffWithWork.add(staffName); // 記錄這個員工有工作
      const recordDate = format(new Date(record.time), 'yyyy-MM-dd');
      const dayData = dailyData.find(d => d.fullDate === recordDate);
      if (dayData) {
        dayData[staffName] = (dayData[staffName] || 0) + 1;
      }
    });

    // 過濾圖表數據，只保留有工作記錄的員工欄位
    const filteredData = dailyData.map(day => {
      const { fullDate, ...dayWithoutFullDate } = day;
      const filteredDay: any = { date: dayWithoutFullDate.date };
      
      // 只保留有工作記錄的員工數據
      Object.keys(dayWithoutFullDate).forEach(key => {
        if (key !== 'date' && staffWithWork.has(key)) {
          filteredDay[key] = dayWithoutFullDate[key];
        }
      });
      
      return filteredDay;
    });
    
    // 更新顯示的員工列表
    const activeStaffList = staffList.filter(staff => staffWithWork.has(staff.name));
    
    if (edges.length === 0) {
      setChartData([]);
      setDisplayStaffList([]);
    } else {
      setChartData(filteredData);
      setDisplayStaffList(activeStaffList);
    }
  }, [workloadData, staffList, timeFrame]);

  const loading = staffLoading || workloadLoading;
  const error = staffError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`h-full flex flex-col relative ${className}`}
    >
      
      <CardHeader className="pb-3">
        <CardTitle className="widget-title flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          From {format(new Date(timeFrame.start), 'MMM d')} to {format(new Date(timeFrame.end), 'MMM d')}
        </p>
      </CardHeader>
      
      {loading && !chartData.length ? (
        <div className="flex-1">
          <div className="h-full bg-slate-700/50 rounded animate-pulse" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-sm">Error loading data</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">No data available</div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    domain={[0, 'dataMax + 1']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#E5E7EB'
                    }}
                  />
              {displayStaffList.slice(0, 8).map((staff, index) => (
                <Line
                  key={staff.id}
                  type="natural"
                  dataKey={staff.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
                </LineChart>
              </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};