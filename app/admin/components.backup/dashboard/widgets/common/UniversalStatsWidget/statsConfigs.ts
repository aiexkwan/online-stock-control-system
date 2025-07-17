/**
 * Stats Widgets 配置映射
 * 將現有的6個 stats widgets 映射到 UniversalStatsWidget 配置
 */

import { 
  ClockIcon, 
  ArrowsRightLeftIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { UniversalStatsWidgetConfig, StatsWidgetTemplate } from './types';
import { createStatsConfig } from './useUniversalStats';

/**
 * AwaitLocationQtyWidget 配置
 */
export const AwaitLocationQtyConfig: UniversalStatsWidgetConfig = {
  id: 'AwaitLocationQtyWidget',
  dataSource: createStatsConfig('await_location_qty', 'await', {
    widgetId: 'await_location_qty',
    enableCache: true,
    cacheTTL: 60000, // 1 minute
  }),
  display: {
    type: 'metric',
    title: 'Await Location',
    icon: ClockIcon,
    iconColor: 'from-yellow-500 to-orange-500',
    format: 'number',
    theme: 'default',
    size: 'md',
    animateOnMount: true,
    showDateRange: false,
  },
  interaction: {
    refreshInterval: 60000,
    showRefreshButton: false,
    tooltip: 'Total quantity waiting for location assignment',
    editMode: {
      mockData: { value: '--', label: 'Await Qty' },
      placeholder: 'Loading await quantity...',
    },
  },
  performance: {
    enableFallback: true,
    fallbackData: { value: 0, label: 'Await Location' },
    enableProgressiveLoading: true,
    enableMetrics: true,
    metricsId: 'await-location-qty',
  },
};

/**
 * YesterdayTransferCountWidget 配置
 */
export const YesterdayTransferCountConfig: UniversalStatsWidgetConfig = {
  id: 'YesterdayTransferCountWidget',
  dataSource: createStatsConfig('yesterday_transfer_count', 'transfer', {
    widgetId: 'yesterday_transfer_count',
    enableCache: true,
    cacheTTL: 300000, // 5 minutes
  }),
  display: {
    type: 'trend',
    title: 'Yesterday Transfers',
    icon: ArrowsRightLeftIcon,
    iconColor: 'from-blue-500 to-cyan-500',
    format: 'number',
    theme: 'default',
    size: 'md',
    animateOnMount: true,
    showDateRange: true,
    dateRangeFormat: 'MMM d',
  },
  interaction: {
    refreshInterval: 300000, // 5 minutes
    showRefreshButton: false,
    tooltip: 'Number of transfers completed yesterday with trend comparison',
    editMode: {
      mockData: { 
        value: '--', 
        label: 'Transfers',
        trend: { value: 0, direction: 'stable' as const }
      },
      placeholder: 'Loading transfer count...',
    },
  },
  performance: {
    enableFallback: true,
    fallbackData: { 
      value: 0, 
      label: 'Transfers',
      trend: { value: 0, direction: 'stable' as const }
    },
    enableProgressiveLoading: true,
    enableMetrics: true,
    metricsId: 'yesterday-transfer-count',
  },
};

/**
 * StillInAwaitWidget 配置
 */
export const StillInAwaitConfig: UniversalStatsWidgetConfig = {
  id: 'StillInAwaitWidget',
  dataSource: {
    type: 'graphql',
    query: `
      query GetStillInAwait($startDate: timestamptz!, $endDate: timestamptz!) {
        record_palletinfoCollection(
          filter: { generated_datetime: { gte: $startDate, lte: $endDate } }
          orderBy: [{ generated_datetime: DESC }]
        ) {
          edges {
            node {
              pallet_id
              generated_datetime
              record_inventoryCollection(
                filter: { await: { gt: 0 } }
                orderBy: [{ datetime_in: DESC }]
                first: 1
              ) {
                edges {
                  node {
                    await
                    location
                    datetime_in
                  }
                }
              }
            }
          }
        }
      }
    `,
    enableCache: true,
    cacheTTL: 120000, // 2 minutes
    transform: (data: any) => {
      if (!data?.record_palletinfoCollection?.edges) {
        return { value: 0, label: 'Still in Await' };
      }

      const edges = data.record_palletinfoCollection.edges;
      let awaitCount = 0;
      
      edges.forEach((edge: any) => {
        const inventoryEdges = edge.node.record_inventoryCollection?.edges || [];
        inventoryEdges.forEach((invEdge: any) => {
          if (invEdge.node.await > 0) {
            awaitCount += invEdge.node.await;
          }
        });
      });
      
      return { 
        value: awaitCount, 
        label: `of ${edges.length.toLocaleString()} total pallets`
      };
    },
  },
  display: {
    type: 'metric',
    title: 'Still In Await',
    icon: ClockIcon,
    iconColor: 'from-yellow-500 to-orange-500',
    format: 'number',
    theme: 'default',
    size: 'md',
    animateOnMount: true,
    showDateRange: true,
  },
  interaction: {
    refreshInterval: 60000,
    showRefreshButton: false,
    tooltip: 'Pallets still waiting for location assignment',
    editMode: {
      mockData: { value: '--', label: 'Pallets' },
      placeholder: 'Loading await status...',
    },
  },
  performance: {
    enableFallback: true,
    fallbackData: { value: 0, label: 'Pallets' },
    enableProgressiveLoading: true,
    enableMetrics: true,
    metricsId: 'still-in-await',
  },
};

/**
 * StillInAwaitPercentageWidget 配置
 */
export const StillInAwaitPercentageConfig: UniversalStatsWidgetConfig = {
  id: 'StillInAwaitPercentageWidget',
  dataSource: createStatsConfig('still_in_await_percentage', 'percentage', {
    enableCache: true,
    cacheTTL: 120000, // 2 minutes
  }),
  display: {
    type: 'progress',
    title: 'Still In Await %',
    icon: ChartPieIcon,
    iconColor: 'from-yellow-500 to-orange-500',
    format: 'percentage',
    precision: 1,
    theme: 'default',
    size: 'md',
    animateOnMount: true,
    showDateRange: true,
  },
  interaction: {
    refreshInterval: 60000,
    showRefreshButton: false,
    tooltip: 'Percentage of pallets still waiting for location assignment',
    editMode: {
      mockData: { 
        value: '--',
        label: 'Still in Await',
        progress: { current: 0, total: 0, percentage: 0 }
      },
      placeholder: 'Loading percentage...',
    },
  },
  performance: {
    enableFallback: true,
    fallbackData: { 
      value: 0,
      label: 'Still in Await',
      progress: { current: 0, total: 0, percentage: 0 }
    },
    enableProgressiveLoading: true,
    enableMetrics: true,
    metricsId: 'still-in-await-percentage',
  },
};

/**
 * StatsCardWidget 配置 (通用)
 */
export const StatsCardConfig: UniversalStatsWidgetConfig = {
  id: 'StatsCardWidget',
  dataSource: {
    type: 'batch',
    widgetId: 'stats_card',
    enableCache: true,
    cacheTTL: 60000,
    transform: (data: any) => ({
      value: data?.value || '--',
      label: data?.label || 'Metric',
      trend: data?.trend,
    }),
  },
  display: {
    type: 'metric',
    title: 'Stats Card',
    icon: ChartBarIcon,
    iconColor: 'from-blue-500 to-purple-500',
    format: 'number',
    theme: 'default',
    size: 'md',
    animateOnMount: true,
    showDateRange: false,
  },
  interaction: {
    refreshInterval: 60000,
    showRefreshButton: false,
    tooltip: 'Generic statistics card',
    editMode: {
      mockData: { value: '--', label: 'Metric' },
      placeholder: 'Loading metric...',
    },
  },
  performance: {
    enableFallback: true,
    fallbackData: { value: '--', label: 'Metric' },
    enableProgressiveLoading: false, // 通用卡片不需要漸進加載
    enableMetrics: true,
    metricsId: 'stats-card',
  },
};

/**
 * InjectionProductionStatsWidget 配置
 */
export const InjectionProductionStatsConfig: UniversalStatsWidgetConfig = {
  id: 'InjectionProductionStatsWidget',
  dataSource: createStatsConfig('injection_production_stats', 'production', {
    enableCache: true,
    cacheTTL: 30000, // 30 seconds for production data
  }),
  display: {
    type: 'trend',
    title: 'Production Stats',
    icon: BuildingOfficeIcon,
    iconColor: 'from-green-500 to-emerald-500',
    format: 'number',
    theme: 'default',
    size: 'md',
    animateOnMount: true,
    showDateRange: true,
  },
  interaction: {
    refreshInterval: 30000, // 30 seconds
    showRefreshButton: true,
    tooltip: 'Injection production statistics with real-time updates',
    editMode: {
      mockData: { 
        value: '--', 
        label: 'Production Pallets',
        trend: { value: 0, direction: 'stable' as const }
      },
      placeholder: 'Loading production stats...',
    },
  },
  performance: {
    enableFallback: true,
    fallbackData: { 
      value: 0, 
      label: 'Production Pallets',
      trend: { value: 0, direction: 'stable' as const }
    },
    enableProgressiveLoading: true,
    enableMetrics: true,
    metricsId: 'injection-production-stats',
  },
};

/**
 * 所有配置的映射
 */
export const STATS_CONFIGS: Record<string, UniversalStatsWidgetConfig> = {
  AwaitLocationQtyWidget: AwaitLocationQtyConfig,
  YesterdayTransferCountWidget: YesterdayTransferCountConfig,
  StillInAwaitWidget: StillInAwaitConfig,
  StillInAwaitPercentageWidget: StillInAwaitPercentageConfig,
  StatsCardWidget: StatsCardConfig,
  InjectionProductionStatsWidget: InjectionProductionStatsConfig,
};

/**
 * Widget 模板庫
 */
export const STATS_WIDGET_TEMPLATES: StatsWidgetTemplate[] = [
  {
    id: 'await-location-template',
    name: 'Await Location Counter',
    description: 'Display quantity waiting for location assignment',
    config: AwaitLocationQtyConfig,
    category: 'inventory',
    tags: ['await', 'location', 'inventory'],
  },
  {
    id: 'transfer-count-template',
    name: 'Transfer Counter with Trend',
    description: 'Show transfer counts with trend analysis',
    config: YesterdayTransferCountConfig,
    category: 'transfer',
    tags: ['transfer', 'trend', 'analytics'],
  },
  {
    id: 'await-status-template',
    name: 'Await Status Overview',
    description: 'Current await status across all pallets',
    config: StillInAwaitConfig,
    category: 'inventory',
    tags: ['await', 'status', 'overview'],
  },
  {
    id: 'await-percentage-template',
    name: 'Await Progress Indicator',
    description: 'Percentage view of await completion',
    config: StillInAwaitPercentageConfig,
    category: 'inventory',
    tags: ['await', 'percentage', 'progress'],
  },
  {
    id: 'production-stats-template',
    name: 'Production Statistics',
    description: 'Real-time production metrics and trends',
    config: InjectionProductionStatsConfig,
    category: 'production',
    tags: ['production', 'real-time', 'statistics'],
  },
  {
    id: 'generic-stats-template',
    name: 'Generic Stats Card',
    description: 'Configurable statistics display',
    config: StatsCardConfig,
    category: 'general',
    tags: ['generic', 'configurable', 'stats'],
  },
];

/**
 * 根據 widget ID 獲取配置
 */
export function getStatsConfig(widgetId: string): UniversalStatsWidgetConfig | null {
  return STATS_CONFIGS[widgetId] || null;
}

/**
 * 獲取所有 stats 配置
 */
export function getAllStatsConfigs(): UniversalStatsWidgetConfig[] {
  return Object.values(STATS_CONFIGS);
}

/**
 * 根據分類獲取模板
 */
export function getTemplatesByCategory(category: string): StatsWidgetTemplate[] {
  return STATS_WIDGET_TEMPLATES.filter(template => template.category === category);
}