/**
 * Universal Layout System - Main Export
 * 統一佈局系統 - 主要匯出
 */

// 核心組件
export {
  default as UniversalContainer,
  ResponsiveLayout,
  ResponsiveContainer,
} from './UniversalContainer';
export { default as UniversalGrid, ResponsiveGrid } from './UniversalGrid';
export { default as UniversalCard, ResponsiveCard } from './UniversalCard';
export { default as UniversalStack, ResponsiveStack } from './UniversalStack';

// 類型定義
export type {
  BreakpointSize,
  SpacingSize,
  MaxWidthSize,
  ResponsiveBreakpoints,
  ResponsiveColumns,
  UniversalTheme,
  LayoutVariant,
  GridConfig,
  CardConfig,
  StackConfig,
  LegacyResponsiveLayoutProps,
  LegacyResponsiveGridProps,
  LegacyResponsiveContainerProps,
  LegacyResponsiveCardProps,
} from './types';

// 常量和預設
export {
  BREAKPOINTS,
  SPACING_MAP,
  SPACING_CLASSES,
  MAX_WIDTH_CLASSES,
  THEMES,
  LAYOUT_VARIANTS,
  GRID_PRESETS,
} from './constants';

// 便利組件和工具
export {
  UniversalProvider,
  useUniversalLayout,
  useResponsive,
  useUniversalTheme,
  useMediaQuery,
} from './UniversalProvider';

// 錯誤處理組件
export { 
  UniversalErrorCard, 
  UniversalSuccessCard, 
  UniversalErrorBoundaryCard,
  UniversalErrorUtils 
} from './UniversalErrorCard';
