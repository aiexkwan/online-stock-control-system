/**
 * Production Stats Widget - GraphQL Version
 * 用於 Admin Dashboard 的生產統計組件
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { useGraphQLQuery, gql } from '@/lib/graphql-client-stable';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';

interface ProductionStatsGraphQLProps {
  title: string;
  metric: 'pallet_count' | 'quantity_sum';
  timeFrame: TimeFrame;
  className?: string;
}

// GraphQL 查詢
const GET_PRODUCTION_STATS_SIMPLE = gql`
  query GetProductionStatsSimple($startDate: Datetime!, $endDate: Datetime!) {
    record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
    ) {
      edges {
        node {
          plt_num
          product_qty
        }
      }
    }
  }
`;

export const ProductionStatsGraphQL: React.FC<ProductionStatsGraphQLProps> = ({ 
  title, 
  metric,
  timeFrame,
  className 
}) => {
  // 使用 GraphQL 查詢
  const { data, loading, error, isRefetching } = useGraphQLQuery(
    GET_PRODUCTION_STATS_SIMPLE,
    {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString()
    }
  );

  // 計算統計值
  const statValue = React.useMemo(() => {
    if (!data?.record_palletinfoCollection) return 0;

    if (metric === 'pallet_count') {
      const edges = data.record_palletinfoCollection.edges || [];
      return edges.length;
    } else {
      // quantity_sum
      const edges = data.record_palletinfoCollection.edges || [];
      
      return edges.reduce((sum: number, edge: any) => {
        // GraphQL 返回的 product_qty 是字符串，需要轉換
        const qty = Number(edge.node.product_qty) || 0;
        return sum + qty;
      }, 0);
    }
  }, [data, metric]);

  // 假設的變化百分比（實際應該與昨天比較）
  const changePercentage = 12.5;
  const isPositive = changePercentage > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`h-full ${className}`}
    >
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 h-full border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group relative overflow-hidden">
        {/* GraphQL 標識 */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white text-xs rounded-full shadow-lg backdrop-blur-sm">
          GraphQL
        </div>

        {/* 背景裝飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <div className={`flex items-center text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              <span>{Math.abs(changePercentage)}%</span>
            </div>
          </div>
          
          {loading && !data ? (
            <div className="space-y-2">
              <div className="h-8 bg-slate-700/50 rounded animate-pulse" />
              <div className="h-4 bg-slate-700/30 rounded animate-pulse w-2/3" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">
              Error loading data
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white mb-2">
                {statValue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500">
                {metric === 'pallet_count' ? 'Pallets produced' : 'Total quantity'}
              </p>
            </>
          )}
        </div>
        
        {/* 底部漸變 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};