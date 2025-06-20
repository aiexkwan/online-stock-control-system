/**
 * 網格系統配置
 * 定義不同螢幕尺寸下的網格規範
 */

export interface GridConfig {
  maxCols: number;
  maxRows: number;
  gap: number; // 間隔大小 (px)
  padding: number; // 邊距大小 (px)
}

export interface ScreenGridConfig {
  large: GridConfig;
  medium: GridConfig;
  small: GridConfig;
}

// 網格系統配置
export const GRID_CONFIG: ScreenGridConfig = {
  // 大螢幕 (>= 1920px)
  large: {
    maxCols: 10,  // 改為 10 列以匹配 AdminEnhancedDashboard
    maxRows: 10,
    gap: 16,      // 增加間隔以匹配 margin: [16, 16]
    padding: 20   // 增加邊距以匹配 containerPadding: [20, 20]
  },
  // 中螢幕 (1280px - 1919px)
  medium: {
    maxCols: 10,  // 統一為 10 列
    maxRows: 10,
    gap: 16,
    padding: 20
  },
  // 小螢幕 (< 1280px)
  small: {
    maxCols: 10,  // 保持 10 列
    maxRows: 10,
    gap: 16,
    padding: 20
  }
};

// 斷點定義
export const BREAKPOINTS = {
  small: 1280,
  large: 1920
};

// 獲取當前螢幕的網格配置
export function getGridConfig(screenWidth: number): GridConfig {
  if (screenWidth >= BREAKPOINTS.large) {
    return GRID_CONFIG.large;
  } else if (screenWidth >= BREAKPOINTS.small) {
    return GRID_CONFIG.medium;
  }
  return GRID_CONFIG.small;
}

// 計算網格單元大小
export function calculateCellSize(
  containerWidth: number,
  containerHeight: number,
  gridConfig: GridConfig
): { cellWidth: number; cellHeight: number } {
  const { maxCols, maxRows, gap, padding } = gridConfig;
  
  // 扣除邊距和間隔後的可用寬度和高度
  const availableWidth = containerWidth - (padding * 2) - (gap * (maxCols - 1));
  const availableHeight = containerHeight - (padding * 2) - (gap * (maxRows - 1));
  
  // 計算每個方向的單元大小
  const cellWidthByWidth = Math.floor(availableWidth / maxCols);
  const cellHeightByHeight = Math.floor(availableHeight / maxRows);
  
  // 使用寬度計算的值以確保填滿容器寬度
  // 但如果高度受限，則使用較小的值
  const cellSize = Math.min(cellWidthByWidth, cellHeightByHeight, 90); // 最大 90px 以匹配 TARGET_CELL_SIZE
  
  // 確保最小尺寸
  const finalCellSize = Math.max(cellSize, 60); // 最小 60px
  
  return { cellWidth: finalCellSize, cellHeight: finalCellSize };
}

import { WidgetSizeConfig, WidgetSize } from '@/app/types/dashboard';

// Widget 尺寸定義（佔用的格數）- 從統一配置取得
export const WIDGET_GRID_SIZES = {
  '1x1': { cols: WidgetSizeConfig[WidgetSize.SMALL].w, rows: WidgetSizeConfig[WidgetSize.SMALL].h },
  '3x3': { cols: WidgetSizeConfig[WidgetSize.MEDIUM].w, rows: WidgetSizeConfig[WidgetSize.MEDIUM].h },
  '5x5': { cols: WidgetSizeConfig[WidgetSize.LARGE].w, rows: WidgetSizeConfig[WidgetSize.LARGE].h },
  '6x6': { cols: WidgetSizeConfig[WidgetSize.XLARGE].w, rows: WidgetSizeConfig[WidgetSize.XLARGE].h }
} as const;

// 驗證 widget 位置是否有效
export function validateWidgetPosition(
  x: number,
  y: number,
  widgetCols: number,
  widgetRows: number,
  gridConfig: GridConfig
): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    x + widgetCols <= gridConfig.maxCols &&
    y + widgetRows <= gridConfig.maxRows
  );
}