/**
 * Product Distribution Chart Widget - GraphQL Version
 * 顯示產品分佈圓餅圖
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useGraphQLQuery, gql } from '@/lib/graphql-client-stable';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { format } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPieIcon } from '@heroicons/react/24/outline';

interface ProductDistributionChartGraphQLProps {
  title: string;
  timeFrame: TimeFrame;
  className?: string;
  limit?: number;
}

// GraphQL 查詢 (與 TopProducts 相同)
const GET_PRODUCT_DISTRIBUTION = gql`
  query GetProductDistribution($startDate: Datetime!, $endDate: Datetime!) {
    record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
    ) {
      edges {
        node {
          product_code
          product_qty
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
  '#64748B', // gray
  '#EC4899', // pink
  '#6366F1'  // indigo
];

export const ProductDistributionChartGraphQL: React.FC<ProductDistributionChartGraphQLProps> = ({ 
  title, 
  timeFrame,
  className,
  limit = 10
}) => {
  // 使用 GraphQL 查詢
  const { data, loading, error, isRefetching } = useGraphQLQuery(
    GET_PRODUCT_DISTRIBUTION,
    {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString()
    }
  );

  // 處理數據
  const chartData = React.useMemo(() => {
    if (!data?.record_palletinfoCollection) return [];

    const edges = data.record_palletinfoCollection.edges || [];
    
    // 統計每個產品的總數量
    const productMap = new Map<string, number>();
    
    edges.forEach((edge: any) => {
      const code = edge.node.product_code;
      const qty = Number(edge.node.product_qty) || 0;
      productMap.set(code, (productMap.get(code) || 0) + qty);
    });

    // 轉換為數組並排序，取前 N 個
    return Array.from(productMap.entries())
      .map(([product_code, quantity]) => ({ 
        name: product_code, 
        value: quantity 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }, [data, limit]);

  // 計算總數
  const total = React.useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  // 自定義標籤
  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`h-full flex flex-col relative ${className}`}
    >

      <CardHeader className="pb-3">
        <CardTitle className="widget-title flex items-center gap-2">
          <ChartPieIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          From {format(new Date(timeFrame.start), 'MMM d')} to {format(new Date(timeFrame.end), 'MMM d')}
        </p>
      </CardHeader>
      
      {loading && !data ? (
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
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="70%"
                innerRadius="40%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#E5E7EB'
                }}
                formatter={(value: any) => value.toLocaleString()}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};