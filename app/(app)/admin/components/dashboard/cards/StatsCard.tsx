/**
 * StatsCard Component
 * 統一的統計卡片組件，取代原有的10個獨立統計widgets
 * 使用 GraphQL 批量查詢優化性能
 */

'use client';

import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TruckIcon, 
  CubeIcon, 
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { MetricCard } from '../widgets/common/data-display/MetricCard';
import { cn } from '@/lib/utils';
import type { 
  StatsType, 
  StatsData, 
  StatsCardData,
  StatsQueryInput 
} from '@/types/generated/graphql';

// GraphQL 查詢
const STATS_CARD_QUERY = gql`
  query StatsCardQuery($input: StatsQueryInput!) {
    statsCardData(input: $input) {
      stats {
        type
        value
        label
        unit
        trend {
          direction
          value
          percentage
          label
        }
        comparison {
          previousValue
          previousLabel
          change
          changePercentage
        }
        lastUpdated
        dataSource
        optimized
      }
      configs {
        type
        title
        description
        icon
        color
      }
      performance {
        totalQueries
        cachedQueries
        averageResponseTime
        dataAge
      }
      lastUpdated
      refreshInterval
    }
  }
`;

// 圖標映射
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'truck': TruckIcon,
  'cube': CubeIcon,
  'clock': ClockIcon,
  'chart-bar': ChartBarIcon,
  'user-group': UserGroupIcon,
  'beaker': BeakerIcon,
  'building-office': BuildingOfficeIcon,
  'arrow-trending-up': ArrowTrendingUpIcon,
};

// 顏色映射
const COLOR_MAP: Record<string, { from: string; to: string }> = {
  'blue': { from: 'from-blue-500', to: 'to-cyan-500' },
  'green': { from: 'from-green-500', to: 'to-emerald-500' },
  'purple': { from: 'from-purple-500', to: 'to-pink-500' },
  'orange': { from: 'from-orange-500', to: 'to-red-500' },
  'indigo': { from: 'from-indigo-500', to: 'to-purple-500' },
};

export interface StatsCardProps {
  // 要顯示的統計類型
  statTypes: StatsType[];
  
  // 佈局配置
  columns?: 1 | 2 | 3 | 4;
  
  // 時間範圍
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // 篩選條件
  locationIds?: string[];
  departmentIds?: string[];
  
  // 顯示選項
  showTrend?: boolean;
  showComparison?: boolean;
  showPerformance?: boolean;
  
  // 樣式
  className?: string;
  
  // 編輯模式
  isEditMode?: boolean;
  
  // 回調
  onStatClick?: (type: StatsType) => void;
  onRefresh?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  statTypes,
  columns = 3,
  dateRange,
  locationIds,
  departmentIds,
  showTrend = true,
  showComparison = true,
  showPerformance = false,
  className,
  isEditMode = false,
  onStatClick,
  onRefresh,
}) => {
  // 準備查詢輸入
  const queryInput: StatsQueryInput = useMemo(() => ({
    types: statTypes,
    dateRange: dateRange ? {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    } : undefined,
    locationIds,
    departmentIds,
    includeComparison: showComparison,
  }), [statTypes, dateRange, locationIds, departmentIds, showComparison]);

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ statsCardData: StatsCardData }>(
    STATS_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      pollInterval: 60000, // 每分鐘輪詢
    }
  );

  // 處理刷新
  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  // 獲取網格類名
  const getGridClassName = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  // 渲染單個統計卡片
  const renderStatCard = (stat: StatsData, index: number) => {
    const config = data?.statsCardData.configs.find(c => c.type === stat.type);
    if (!config) return null;

    const Icon = config.icon ? ICON_MAP[config.icon] || CubeIcon : CubeIcon;
    // 安全地獲取顏色，確保總有默認值
    const defaultColor = { from: 'from-blue-500', to: 'to-cyan-500' };
    const color = config.color && COLOR_MAP[config.color] ? COLOR_MAP[config.color] : defaultColor;

    return (
      <motion.div
        key={stat.type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <MetricCard
          title={config.title}
          value={stat.value}
          label={stat.label || stat.unit}
          icon={Icon}
          iconColor={`${color.from} ${color.to}`}
          gradientFrom={color.from}
          gradientTo={color.to}
          
          // 趨勢數據
          trend={showTrend && stat.trend ? stat.trend.direction.toLowerCase() as 'up' | 'down' | 'neutral' : undefined}
          trendValue={showTrend && stat.trend ? stat.trend.percentage : undefined}
          trendLabel={showTrend && stat.trend ? stat.trend.label : undefined}
          
          // 描述和額外信息
          description={config.description}
          subtitle={showComparison && stat.comparison ? 
            `vs ${stat.comparison.previousLabel}: ${stat.comparison.changePercentage > 0 ? '+' : ''}${stat.comparison.changePercentage.toFixed(1)}%` 
            : undefined
          }
          
          // 性能指標
          performanceMetrics={stat.optimized ? {
            source: stat.dataSource,
            optimized: stat.optimized,
          } : undefined}
          
          // 狀態
          loading={loading}
          error={error || undefined}
          isEditMode={isEditMode}
          
          // 動畫
          animateOnMount={true}
          animationDelay={index * 100}
          
          // 點擊處理
          onClick={() => onStatClick?.(stat.type)}
        />
      </motion.div>
    );
  };

  // 錯誤狀態
  if (error && !data) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-lg",
        className
      )}>
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700 dark:text-red-300">
          Failed to load statistics: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 性能指標（可選） */}
      {showPerformance && data?.statsCardData.performance && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
          <span>
            Response: {data.statsCardData.performance.averageResponseTime.toFixed(0)}ms
          </span>
          <span>
            Cache Hit: {((data.statsCardData.performance.cachedQueries / data.statsCardData.performance.totalQueries) * 100).toFixed(0)}%
          </span>
          <span>
            Data Age: {data.statsCardData.performance.dataAge}s
          </span>
        </div>
      )}

      {/* 統計卡片網格 */}
      <div className={cn("grid gap-4", getGridClassName())}>
        <AnimatePresence mode="popLayout">
          {data?.statsCardData.stats.map((stat, index) => 
            renderStatCard(stat, index)
          )}
        </AnimatePresence>
      </div>

      {/* 刷新按鈕（編輯模式） */}
      {isEditMode && (
        <div className="flex justify-end mt-2">
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Refresh All Stats
          </button>
        </div>
      )}
    </div>
  );
};

// 導出類型，方便其他組件使用
export type { StatsType, StatsData } from '@/types/generated/graphql';