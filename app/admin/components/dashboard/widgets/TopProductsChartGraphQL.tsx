/**
 * Top Products Chart Widget - GraphQL Version
 * 顯示產品數量排名圖表
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useGraphQLQuery, gql } from '@/lib/graphql-client-stable';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { format } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface TopProductsChartGraphQLProps {
  title: string;
  timeFrame: TimeFrame;
  className?: string;
  limit?: number;
}

// GraphQL 查詢
const GET_TOP_PRODUCTS = gql`
  query GetTopProducts($startDate: Datetime!, $endDate: Datetime!) {
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

export const TopProductsChartGraphQL: React.FC<TopProductsChartGraphQLProps> = ({ 
  title, 
  timeFrame,
  className,
  limit = 10
}) => {
  // 使用 GraphQL 查詢
  const { data, loading, error, isRefetching } = useGraphQLQuery(
    GET_TOP_PRODUCTS,
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
      .map(([product_code, quantity]) => ({ product_code, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
      .map(item => ({
        name: item.product_code,
        value: item.quantity
      }));
  }, [data, limit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`h-full flex flex-col relative ${className}`}
    >
      
      <CardHeader className="pb-3">
        <CardTitle className="widget-title flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
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
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                stroke="#9CA3AF" 
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#E5E7EB'
                }}
                formatter={(value: any) => value.toLocaleString()}
              />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};