/**
 * Card System - Unified Export
 * 統一卡片系統 - 純透明毛玻璃設計
 *
 * Created: 2025-08-13
 * Purpose: Central export for the new pure transparent glassmorphic card system
 */

// 核心卡片組件
export {
  EnhancedGlassmorphicCard,
  type EnhancedGlassmorphicCardProps,
  // 預設變體導出
  OperationCard,
  AnalysisCard,
  DataCard,
  ReportCard,
  ChartCard,
  SpecialCard,
} from './EnhancedGlassmorphicCard';

// 右側佈局專用包裝器
export { RightSideCardWrapper, withRightSideCard } from './RightSideCardWrapper';

// 主題和樣式系統
export {
  cardThemes,
  cardTextStyles,
  cardContainerStyles,
  cardAnimations,
  cardStatusColors,
  cardChartColors,
  cardBreakpoints,
  getCardTheme,
  getCardTextStyle,
  getCardContainerStyle,
  getCardStatusStyle,
  type CardTheme,
  type CardBaseProps,
  type CardProps,
} from './theme';

// 純透明玻璃態效果系統
export {
  glassmorphicThemes,
  shadowDepthSystem,
  cornerIndicatorSystem,
  iconStyleSystem,
  glassmorphicVariants,
  dynamicBorderGlow,
  performanceOptimizations,
  getOptimizedGlassmorphicStyle,
  generateGlassmorphicCSSVariables,
} from './glassmorphic-integration';

// 無障礙設計
export { accessibleCardColors, validateTextContrast } from './accessibility-colors';

// 響應式設計
export { responsiveUtils } from './responsive-design';

// 視覺指導原則
export { default as visualGuidelines } from './visual-guidelines';

// 導入類型定義需要的模塊
import { cardThemes } from './theme';
import {
  glassmorphicThemes,
  glassmorphicVariants,
  shadowDepthSystem,
  cornerIndicatorSystem,
  iconStyleSystem,
  performanceOptimizations,
} from './glassmorphic-integration';
import { EnhancedGlassmorphicCard } from './EnhancedGlassmorphicCard';
import { RightSideCardWrapper } from './RightSideCardWrapper';

// 類型定義
export type CardSystemTheme = keyof typeof cardThemes;
export type GlassmorphicVariant = keyof typeof glassmorphicVariants;
export type ShadowDepth = keyof typeof shadowDepthSystem;
export type CornerIndicator = keyof typeof cornerIndicatorSystem;
export type IconStyle = keyof typeof iconStyleSystem;

/**
 * 卡片系統配置常量
 */
export const CARD_SYSTEM_CONFIG = {
  // 支持的卡片類型
  CARD_TYPES: ['operation', 'analysis', 'data', 'report', 'chart', 'special'] as const,

  // 默認配置
  DEFAULT_THEME: 'operation' as const,
  DEFAULT_VARIANT: 'glass' as const,
  DEFAULT_PADDING: 'base' as const,
  DEFAULT_GLASSMORPHIC_VARIANT: 'default' as const,

  // 性能級別
  PERFORMANCE_LEVELS: ['low', 'medium', 'high'] as const,

  // 響應式斷點
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    wide: 1536,
  },
} as const;

/**
 * 實用工具函數
 */
export const cardSystemUtils = {
  /**
   * 檢查是否為有效的卡片主題
   */
  isValidTheme: (theme: string): theme is keyof typeof cardThemes => {
    return CARD_SYSTEM_CONFIG.CARD_TYPES.includes(theme as keyof typeof cardThemes);
  },

  /**
   * 獲取當前性能級別的推薦配置
   */
  getPerformanceConfig: (level: 'low' | 'medium' | 'high') => {
    return performanceOptimizations[`${level}Performance` as keyof typeof performanceOptimizations];
  },

  /**
   * 生成卡片的CSS類名
   */
  generateCardClassName: (theme: keyof typeof cardThemes, variant: string = 'glass') => {
    return `enhanced-glassmorphic-card enhanced-glassmorphic-card--${theme} enhanced-glassmorphic-card--${variant}`;
  },
} as const;

// 默認導出
const cardSystem = {
  // 組件
  EnhancedGlassmorphicCard,
  RightSideCardWrapper,

  // 配置
  themes: cardThemes,
  glassmorphicThemes,
  shadowDepthSystem,
  cornerIndicatorSystem,
  iconStyleSystem,

  // 工具
  utils: cardSystemUtils,
  config: CARD_SYSTEM_CONFIG,
} as const;

export default cardSystem;
