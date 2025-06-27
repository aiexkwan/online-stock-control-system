/**
 * Production Stats Widget - GraphQL Version
 * 用於 Admin Dashboard 的生產統計組件
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGraphQLQuery, gql } from '@/lib/graphql-client-stable';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CubeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

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


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`h-full flex flex-col relative ${className}`}
    >
      
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <CubeIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          From {format(new Date(timeFrame.start), 'MMM d')} to {format(new Date(timeFrame.end), 'MMM d')}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex items-center justify-center">
        {loading && !data ? (
          <div className="space-y-2 w-full">
            <div className="h-8 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-4 bg-slate-700/30 rounded animate-pulse w-2/3" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center">
            Error loading data
          </div>
        ) : (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {statValue.toLocaleString()}
            </motion.div>
            <p className="text-xs text-slate-400">
              {metric === 'pallet_count' ? 'Pallets produced' : 'Total quantity'}
            </p>
          </div>
        )}
      </CardContent>
    </motion.div>
  );
};