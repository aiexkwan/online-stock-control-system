/**
 * AdminWidgetRenderer Adapter
 * 將現有的 AdminWidgetRenderer 集成到新的 Widget Registry 系統
 */

import dynamic from 'next/dynamic';
import { WidgetDefinition } from './types';

/**
 * 註冊 AdminWidgetRenderer 為核心組件
 * AdminWidgetRenderer 是一個特殊的 widget，它根據配置動態渲染不同類型的 widgets
 */
export async function registerAdminWidgetRenderer() {
  // Lazy import to avoid circular dependency
  const { widgetRegistry } = await import('./enhanced-registry');
  const definition: WidgetDefinition = {
    id: 'AdminWidgetRenderer',
    name: 'Admin Widget Renderer',
    category: 'core',
    description: 'Core widget renderer that handles all widget types based on configuration',
    lazyLoad: false, // 核心組件不需要懶加載
    preloadPriority: 10, // 最高優先級
    metadata: {
      isSystemComponent: true,
      supportsAllTypes: true,
      configBased: true,
    },
  };

  // 註冊定義
  widgetRegistry.register(definition);

  // 創建一個延遲加載的包裝器
  // 使用靜態導入的 dynamic，避免動態 require 問題
  definition.component = dynamic(
    () => import('@/app/admin/components/dashboard/AdminWidgetRenderer').then(mod => ({
      default: mod.AdminWidgetRenderer,
    })), {
      loading: () => null,
      ssr: false,
    }
  );

  console.log('[AdminRendererAdapter] AdminWidgetRenderer registered successfully');
}

/**
 * Widget 配置映射
 * 將 AdminWidgetRenderer 的配置映射到新系統
 */
export const widgetConfigMapping = {
  // Stats widgets
  stats: {
    widgetIds: [
      'StatsCardWidget',
      'StillInAwaitWidget',
      'YesterdayTransferCountWidget',
      'AwaitLocationQtyWidget',
    ],
    category: 'stats',
  },

  // Chart widgets
  chart: {
    widgetIds: [
      'StockDistributionChart',
      'StockLevelHistoryChart',
      'WarehouseWorkLevelAreaChart',
    ],
    category: 'charts',
  },

  // List widgets
  list: {
    widgetIds: ['OrdersListWidgetV2', 'WarehouseTransferListWidget', 'OrderStateListWidget'],
    category: 'lists',
  },

  // Table widgets
  table: {
    widgetIds: ['TransactionReportWidget', 'GrnReportWidget'],
    category: 'reports',
  },
};

/**
 * 獲取 widget 類型對應的新系統 widget IDs
 */
export function getWidgetIdsByType(type: string): string[] {
  const mapping = widgetConfigMapping[type as keyof typeof widgetConfigMapping];
  return mapping?.widgetIds || [];
}

/**
 * 檢查是否應該使用新系統
 * 根據 feature flag 和 widget 類型決定
 */
export function shouldUseNewRegistry(widgetConfig: any): boolean {
  // 檢查 feature flag
  if (process.env.NEXT_PUBLIC_ENABLE_WIDGET_REGISTRY_V2 !== 'true') {
    return false;
  }

  // 檢查是否是特殊組件
  if (widgetConfig.component) {
    // 特殊組件需要檢查是否已經在新系統中註冊
    return widgetRegistry.getDefinition(widgetConfig.component) !== undefined;
  }

  // 檢查是否是支援的類型
  return widgetConfig.type in widgetConfigMapping;
}

/**
 * 創建遷移後的 AdminWidgetRenderer
 * 這個版本會逐步使用新的 registry 系統
 */
export function createMigratedAdminRenderer() {
  // 這個函數將在後續階段實現
  // 目前保持向後兼容，直接使用原始的 AdminWidgetRenderer
  return null;
}
