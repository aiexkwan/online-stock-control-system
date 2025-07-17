/**
 * Universal Stats Widget - 統一導出
 */

export { UniversalStatsWidget as default } from './UniversalStatsWidget';
export { UniversalStatsWidget } from './UniversalStatsWidget';

// Types
export type {
  StatsDisplayType,
  StatsDataSourceType,
  StatsFormatType,
  StatsData,
  StatsDataSourceConfig,
  StatsDisplayConfig,
  StatsInteractionConfig,
  StatsPerformanceConfig,
  UniversalStatsWidgetConfig,
  UniversalStatsWidgetProps,
  StatsWidgetTemplate,
  UseUniversalStatsResult,
} from './types';

// Hooks
export { useUniversalStats, createStatsConfig } from './useUniversalStats';

// Configurations
export {
  STATS_CONFIGS,
  STATS_WIDGET_TEMPLATES,
  AwaitLocationQtyConfig,
  YesterdayTransferCountConfig,
  StillInAwaitConfig,
  StillInAwaitPercentageConfig,
  StatsCardConfig,
  InjectionProductionStatsConfig,
  getStatsConfig,
  getAllStatsConfigs,
  getTemplatesByCategory,
} from './statsConfigs';

/**
 * 便利函數：創建 stats widget 實例
 */
export function createStatsWidget(widgetId: string, customConfig?: Partial<UniversalStatsWidgetConfig>) {
  const baseConfig = getStatsConfig(widgetId);
  if (!baseConfig) {
    throw new Error(`Unknown stats widget ID: ${widgetId}`);
  }

  return {
    ...baseConfig,
    ...customConfig,
    display: {
      ...baseConfig.display,
      ...customConfig?.display,
    },
    dataSource: {
      ...baseConfig.dataSource,
      ...customConfig?.dataSource,
    },
    interaction: {
      ...baseConfig.interaction,
      ...customConfig?.interaction,
    },
    performance: {
      ...baseConfig.performance,
      ...customConfig?.performance,
    },
  };
}

