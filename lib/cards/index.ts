/**
 * Card 系統主入口
 * 導出所有 Card 相關的模塊和工具
 * 
 * @module cards
 * @version 1.0.0
 */

// 核心類型
export * from './types';

// 註冊系統
export { 
  CardRegistry, 
  registerCard, 
  registerCards,
  registerCardIf,
  getCard,
  getAllCards,
  hasCard,
  searchCards
} from './CardRegistry';

// 載入系統
export { 
  CardLoader,
  loadCard,
  loadForRoute,
  prefetchCards
} from './CardLoader';

// Import 管理系統
export {
  CARD_IMPORTS,
  getCardImport,
  hasCardImport,
  getAvailableCardTypes,
  preloadCards,
  registerThirdPartyCard,
  unregisterThirdPartyCard,
  getImportStats,
  CardImportOptimizer
} from './imports';

// Dashboard 容器
export { DashboardContainer } from './DashboardContainer';
export type { DashboardContainerProps } from './DashboardContainer';

// 版本信息
export const CARD_SYSTEM_VERSION = '1.0.0';