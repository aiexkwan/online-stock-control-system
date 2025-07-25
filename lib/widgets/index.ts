/**
 * Widget Registry System - Main Entry Point
 * 版本 2.0 - 無破壞性升級
 *
 * 策略 4: unknown + type narrowing - 類型安全的統計數據處理
 */

import { safeGet, safeNumber, safeString } from '@/types/database/helpers';

// 導出所有類型
export * from './types';

// 導出核心功能
export { widgetRegistry } from './unified-registry';
export { layoutCompatibilityManager } from './layout-compatibility';

// 導出工具函數
export {
  getWidgetCategory,
  getPreloadPriority,
  getRoutePreloadWidgets,
  ROUTE_PRELOAD_MAP as routePreloadMap,
} from './unified-widget-config';

// 導出布局快照工具
export {
  captureThemeLayout,
  captureAllLayouts,
  validateLayoutSnapshot,
  generateLayoutReport,
  saveLayoutSnapshot,
  loadLayoutSnapshot,
} from './layout-snapshot';

// 初始化函數
export async function initializeWidgetRegistry(): Promise<void> {
  console.log('[WidgetRegistry] Initializing Widget Registry System v2.0...');

  try {
    // 1. 確保 widget registry 初始化
    const { widgetRegistry } = await import('./unified-registry');
    // autoRegisterWidgets 已移除 - 系統自動從配置初始化

    // 2. 載入布局基準（如果存在）
    if (typeof window !== 'undefined') {
      const baselineStr = localStorage.getItem('widget_layout_baseline');
      if (baselineStr) {
        const { loadLayoutSnapshot } = await import('./layout-snapshot');
        const baseline = loadLayoutSnapshot(baselineStr);
        if (baseline) {
          console.log('[WidgetRegistry] Loaded layout baseline');
        }
      }
    }

    // 3. 配置雙重加載已移除

    console.log('[WidgetRegistry] Initialization completed successfully');
  } catch (error) {
    console.error('[WidgetRegistry] Initialization failed:', error);
    throw error;
  }
}

// 便捷的 React Hook
import { useEffect, useState } from 'react';

export function useWidgetRegistry() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeWidgetRegistry()
      .then(() => setIsReady(true))
      .catch(setError);
  }, []);

  return { isReady, error };
}

// 性能監控 Hook
interface WidgetStats {
  totalWidgets?: number;
  loadedWidgets?: number;
  avgLoadTime?: number;
  loadStatus?: string;
  loadTime?: number;
}

export function useWidgetPerformance(widgetId?: string) {
  const [stats, setStats] = useState<WidgetStats | null>(null);

  useEffect(() => {
    import('./unified-registry').then(({ widgetRegistry }) => {
      const updateStats = () => {
        if (widgetId) {
          const allStats = widgetRegistry.getLoadStatistics();
          const widgetStat = allStats.get(widgetId);
          // 策略 4: 類型安全轉換 - 將 WidgetRegistryItem 轉換為 WidgetStats
          if (widgetStat) {
            setStats({
              loadStatus: safeString(safeGet(widgetStat, 'loadStatus')),
              loadTime: safeNumber(safeGet(widgetStat, 'loadTime')),
            });
          } else {
            setStats(null);
          }
        } else {
          const allStats = widgetRegistry.getLoadStatistics();
          const statsArray = Array.from(allStats.values());
          const summary = {
            totalWidgets: allStats.size,
            loadedWidgets: statsArray.filter(s => safeString(safeGet(s, 'loadStatus')) === 'loaded')
              .length,
            avgLoadTime:
              statsArray
                .filter(s => safeNumber(safeGet(s, 'loadTime')) > 0)
                .reduce((sum, s) => sum + safeNumber(safeGet(s, 'loadTime')), 0) /
              Math.max(statsArray.length, 1),
          };
          setStats(summary);
        }
      };

      updateStats(); // 只執行一次初始更新
      // 🛑 完全禁用自動更新：按用戶要求，只在頁面載入和手動刷新時更新
      // const interval = setInterval(updateStats, 5000); // 已禁用

      return () => {}; // 無需清理
    });
  }, [widgetId]);

  return stats;
}
