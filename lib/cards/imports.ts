/**
 * Card Import Manager - 直接 import 系統
 * 管理所有 Card 組件的導入映射，支持靜態分析和 tree-shaking
 * 
 * @module imports
 * @version 1.0.0
 */

import { ComponentType } from 'react';
import { CardProps } from './types';

/**
 * Card 導入函數類型
 */
export type CardImportFunction = () => Promise<any>;

/**
 * Card 導入映射表
 * 使用動態 import 實現代碼分割，但結構固定以支持靜態分析
 */
export const CARD_IMPORTS: Record<string, CardImportFunction> = {
  // 數據展示類 Cards
  'stats': () => import('@/app/(app)/admin/components/dashboard/cards/StatsCard'),
  'list': () => import('@/app/(app)/admin/components/dashboard/cards/ListCard'),
  
  // 圖表類 Cards
  'chart': () => import('@/app/(app)/admin/components/dashboard/cards/ChartCard'),
  
  // 表格類 Cards
  'table': () => import('@/app/(app)/admin/components/dashboard/cards/TableCard'),
  'other-files': () => import('@/app/(app)/admin/components/dashboard/cards/OtherFilesCard'),
  
  // 上傳類 Cards
  'upload': () => import('@/app/(app)/admin/components/dashboard/cards/UploadCard'),
  
  // 分析類 Cards
  'analysis': () => import('@/app/(app)/admin/components/dashboard/cards/AnalysisCard'),
  
  // 表單類 Cards (待遷移)
  // 'form': () => import('@/app/(app)/admin/components/dashboard/cards/FormCard'),
  
  // 報表類 Cards (待遷移)
  // 'report': () => import('@/app/(app)/admin/components/dashboard/cards/ReportCard'),
  
  // 導航類 Cards (待遷移)
  // 'navigation': () => import('@/app/(app)/admin/components/dashboard/cards/NavigationCard'),
  
  // 通知類 Cards (待遷移)
  // 'notification': () => import('@/app/(app)/admin/components/dashboard/cards/NotificationCard'),
  
  // 搜索類 Cards (待遷移)
  // 'search': () => import('@/app/(app)/admin/components/dashboard/cards/SearchCard'),
  
  // 配置類 Cards (待遷移)
  // 'config': () => import('@/app/(app)/admin/components/dashboard/cards/ConfigCard'),
  
  // 警報類 Cards (待遷移)
  // 'alert': () => import('@/app/(app)/admin/components/dashboard/cards/AlertCard'),
};

/**
 * 獲取 Card 導入函數
 */
export function getCardImport(type: string): CardImportFunction | undefined {
  return CARD_IMPORTS[type];
}

/**
 * 檢查 Card 類型是否有對應的導入
 */
export function hasCardImport(type: string): boolean {
  return type in CARD_IMPORTS;
}

/**
 * 獲取所有可用的 Card 類型
 */
export function getAvailableCardTypes(): string[] {
  return Object.keys(CARD_IMPORTS);
}

/**
 * 批量預載入 Cards
 * 用於優化初始載入性能
 */
export async function preloadCards(types: string[]): Promise<void> {
  const imports = types
    .filter(hasCardImport)
    .map(type => CARD_IMPORTS[type]());
  
  await Promise.all(imports);
}

/**
 * 註冊第三方 Card
 * 允許擴展系統支持外部 Card 組件
 */
export function registerThirdPartyCard(
  type: string,
  importFn: CardImportFunction
): void {
  if (CARD_IMPORTS[type]) {
    console.warn(`[CardImports] Overriding existing card type: ${type}`);
  }
  
  CARD_IMPORTS[type] = importFn;
}

/**
 * 移除第三方 Card 註冊
 */
export function unregisterThirdPartyCard(type: string): boolean {
  // 只允許移除非內建的 Cards
  const builtInTypes = [
    'stats', 'list', 'chart', 'table', 'upload',
    'analysis', 'form', 'report', 'navigation',
    'notification', 'search', 'config', 'alert'
  ];
  
  if (builtInTypes.includes(type)) {
    console.error(`[CardImports] Cannot unregister built-in card type: ${type}`);
    return false;
  }
  
  return delete CARD_IMPORTS[type];
}

/**
 * 獲取 Card 導入統計
 */
export function getImportStats(): {
  total: number;
  available: number;
  pending: number;
  types: {
    available: string[];
    pending: string[];
  };
} {
  const allTypes = Object.keys(CARD_IMPORTS);
  const available = allTypes.filter(type => !CARD_IMPORTS[type].toString().includes('待遷移'));
  const pending = allTypes.filter(type => CARD_IMPORTS[type].toString().includes('待遷移'));
  
  return {
    total: allTypes.length,
    available: available.length,
    pending: pending.length,
    types: {
      available,
      pending,
    },
  };
}

/**
 * Card 導入優化器
 * 根據使用頻率和路由信息優化載入順序
 */
export class CardImportOptimizer {
  private static usageStats = new Map<string, number>();
  private static routeMapping = new Map<string, string[]>();
  
  /**
   * 記錄 Card 使用
   */
  static recordUsage(type: string): void {
    const count = this.usageStats.get(type) || 0;
    this.usageStats.set(type, count + 1);
  }
  
  /**
   * 註冊路由和 Card 的映射關係
   */
  static registerRouteMapping(route: string, cardTypes: string[]): void {
    this.routeMapping.set(route, cardTypes);
  }
  
  /**
   * 獲取建議的預載入順序
   */
  static getSuggestedPreloadOrder(): string[] {
    // 按使用頻率排序
    const sorted = Array.from(this.usageStats.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);
    
    // 確保高優先級的 Cards 在前
    const highPriority = ['stats', 'chart', 'table'];
    const finalOrder = [
      ...highPriority.filter(type => sorted.includes(type)),
      ...sorted.filter(type => !highPriority.includes(type)),
    ];
    
    return finalOrder;
  }
  
  /**
   * 根據路由預載入 Cards
   */
  static async preloadForRoute(route: string): Promise<void> {
    const cardTypes = this.routeMapping.get(route);
    
    if (cardTypes) {
      await preloadCards(cardTypes);
    }
  }
}

// 導出便捷方法
export { preloadCards as preload } from './imports';