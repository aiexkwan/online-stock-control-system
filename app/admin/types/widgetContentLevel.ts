/**
 * Widget Content Level Types
 * 定義 Widget 根據大小顯示不同內容的級別
 */

export enum ContentLevel {
  MINIMAL = 'minimal',      // 面積 ≤ 2：只顯示計數
  COMPACT = 'compact',      // 面積 ≤ 9 (3x3)：顯示標題 + 基本數據
  STANDARD = 'standard',    // 面積 ≤ 25 (5x5)：顯示數據 + 趨勢 + 圖表
  DETAILED = 'detailed',    // 面積 ≤ 49 (7x7)：顯示詳細資訊 + 搜索
  FULL = 'full'            // 面積 > 49：完整功能
}

/**
 * 根據 Widget 的網格大小計算內容顯示級別
 */
export const getContentLevel = (width: number, height: number): ContentLevel => {
  // 基於面積和最小邊長來判斷內容級別
  const area = width * height;
  const minDimension = Math.min(width, height);
  
  // MINIMAL: 面積 <= 2 或任一邊 <= 1
  if (area <= 2 || minDimension <= 1) {
    return ContentLevel.MINIMAL;
  }
  
  // COMPACT: 面積 <= 9 (3x3) 或寬度 <= 2
  if (area <= 9 || width <= 2) {
    return ContentLevel.COMPACT;
  }
  
  // STANDARD: 面積 <= 25 (5x5) 或寬度 <= 4
  if (area <= 25 || width <= 4) {
    return ContentLevel.STANDARD;
  }
  
  // DETAILED: 面積 <= 49 (7x7) 或寬度 <= 6
  if (area <= 49 || width <= 6) {
    return ContentLevel.DETAILED;
  }
  
  // FULL: 面積 > 49
  return ContentLevel.FULL;
};

/**
 * 內容級別的顯示配置
 */
export const ContentLevelConfig = {
  [ContentLevel.MINIMAL]: {
    fontSize: 'text-sm',
    padding: 'p-2',
    showTitle: false,
    showIcon: false,
    showTrend: false,
    showChart: false,
    showDetails: false,
    maxItems: 0
  },
  [ContentLevel.COMPACT]: {
    fontSize: 'text-base',
    padding: 'p-3',
    showTitle: true,
    showIcon: true,
    showTrend: false,
    showChart: false,
    showDetails: false,
    maxItems: 3
  },
  [ContentLevel.STANDARD]: {
    fontSize: 'text-lg',
    padding: 'p-4',
    showTitle: true,
    showIcon: true,
    showTrend: true,
    showChart: true,  // 5格應該顯示圖表
    showDetails: false,
    maxItems: 5
  },
  [ContentLevel.DETAILED]: {
    fontSize: 'text-xl',
    padding: 'p-5',
    showTitle: true,
    showIcon: true,
    showTrend: true,
    showChart: true,
    showDetails: false,
    maxItems: 10
  },
  [ContentLevel.FULL]: {
    fontSize: 'text-2xl',
    padding: 'p-6',
    showTitle: true,
    showIcon: true,
    showTrend: true,
    showChart: true,
    showDetails: true,
    maxItems: -1 // 無限制
  }
};