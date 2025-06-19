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
    maxCols: 20,
    maxRows: 10,
    gap: 12,
    padding: 16
  },
  // 中螢幕 (1280px - 1919px)
  medium: {
    maxCols: 15,
    maxRows: 10,
    gap: 10,
    padding: 14
  },
  // 小螢幕 (< 1280px)
  small: {
    maxCols: 10,
    maxRows: 10,
    gap: 8,
    padding: 12
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
  
  // 使用較小的值確保是正方形
  const cellSize = Math.min(cellWidthByWidth, cellHeightByHeight);
  
  return { cellWidth: cellSize, cellHeight: cellSize };
}

// Widget 尺寸定義（佔用的格數）
export const WIDGET_GRID_SIZES = {
  '1x1': { cols: 1, rows: 1 },
  '3x3': { cols: 3, rows: 3 },
  '5x5': { cols: 5, rows: 5 },
  '6x6': { cols: 6, rows: 6 } // ASK_DATABASE 專用
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