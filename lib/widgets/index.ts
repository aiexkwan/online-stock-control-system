/**
 * Widget Registry System - Main Entry Point
 * 版本 2.0 - 無破壞性升級
 */

// 導出所有類型
export * from './types';

// 導出核心功能
export { widgetRegistry } from './enhanced-registry';
export { layoutCompatibilityManager } from './layout-compatibility';

// 導出工具函數
export {
  getWidgetCategory,
  getGraphQLVersion,
  getPreloadPriority,
  getRoutePreloadWidgets,
  widgetMapping,
  routePreloadMap
} from './widget-mappings';

// 導出布局快照工具
export {
  captureThemeLayout,
  captureAllLayouts,
  validateLayoutSnapshot,
  generateLayoutReport,
  saveLayoutSnapshot,
  loadLayoutSnapshot
} from './layout-snapshot';

// 初始化函數
export async function initializeWidgetRegistry(): Promise<void> {
  console.log('[WidgetRegistry] Initializing Widget Registry System v2.0...');
  
  try {
    // 1. 自動註冊所有 widgets
    const { widgetRegistry } = await import('./enhanced-registry');
    await widgetRegistry.autoRegisterWidgets();
    
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
export function useWidgetPerformance(widgetId?: string) {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    import('./enhanced-registry').then(({ widgetRegistry }) => {
      const updateStats = () => {
        if (widgetId) {
          const allStats = widgetRegistry.getLoadStatistics();
          setStats(allStats.get(widgetId));
        } else {
          const allStats = widgetRegistry.getLoadStatistics();
          const summary = {
            totalWidgets: allStats.size,
            loadedWidgets: Array.from(allStats.values()).filter((s: any) => s.loadStatus === 'loaded').length,
            avgLoadTime: Array.from(allStats.values())
              .filter((s: any) => s.loadTime)
              .reduce((sum, s: any) => sum + (s.loadTime || 0), 0) / allStats.size || 0
          };
          setStats(summary);
        }
      };
      
      updateStats();
      const interval = setInterval(updateStats, 5000);
      
      return () => clearInterval(interval);
    });
  }, [widgetId]);
  
  return stats;
}