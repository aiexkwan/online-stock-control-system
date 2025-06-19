/**
 * 統一的 Widget 尺寸配置控制中心
 * 集中管理所有 widget 的尺寸設定
 * 
 * 這是系統中唯一的 Widget 尺寸設定來源
 * 所有組件都必須使用這裡的設定，包括：
 * - Widget 組件內的尺寸選擇
 * - Add Widget Dialog
 * - Widget Size Selector
 * - Default layouts
 */

import { WidgetType, WidgetSize } from '@/app/types/dashboard';

// 從統一的 WidgetSizeConfig 導入
import { WidgetSizeConfig } from '@/app/types/dashboard';

// 基礎尺寸映射 - 使用統一的配置
export const SIZE_MAPPING = WidgetSizeConfig;

// 輔助函數：根據寬度計算對應的高度（保持正方形比例）
function getProportionalHeight(width: number): number {
  // 現在所有 widget 都是正方形 (1:1 比例)
  return width;
}

// Widget 特定尺寸配置
export const WIDGET_SIZE_CONFIGS = {
  // Statistics 類 - 主要支援 1x1 和 3x3
  [WidgetType.OUTPUT_STATS]: {
    default: { w: 2, h: 1.8 },
    min: { w: 1, h: 0.8 },
    max: { w: 3, h: 2.8 }
  },
  [WidgetType.BOOKED_OUT_STATS]: {
    default: { w: 2, h: getProportionalHeight(2) },
    min: { w: 1, h: getProportionalHeight(1) },
    max: { w: 3, h: getProportionalHeight(3) }
  },
  [WidgetType.VOID_STATS]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 4, h: getProportionalHeight(4) }
  },

  // Charts & Analytics 類 - 需要較大空間
  [WidgetType.PRODUCT_MIX_CHART]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 3, h: getProportionalHeight(3) },
    max: { w: 5, h: getProportionalHeight(5) }
  },

  // Operations 類
  [WidgetType.RECENT_ACTIVITY]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 5, h: getProportionalHeight(5) }
  },
  [WidgetType.ACO_ORDER_PROGRESS]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 5, h: getProportionalHeight(5) }
  },
  [WidgetType.INVENTORY_SEARCH]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 5, h: getProportionalHeight(5) }
  },
  [WidgetType.FINISHED_PRODUCT]: {
    default: { w: 5, h: getProportionalHeight(5) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 6, h: getProportionalHeight(6) }
  },
  [WidgetType.MATERIAL_RECEIVED]: {
    default: { w: 5, h: getProportionalHeight(5) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 6, h: getProportionalHeight(6) }
  },

  // Tools 類
  [WidgetType.ASK_DATABASE]: {
    default: { w: 6, h: getProportionalHeight(6) },
    min: { w: 6, h: getProportionalHeight(6) },
    max: { w: 6, h: getProportionalHeight(6) }
  },

  // System Tools 類
  [WidgetType.VOID_PALLET]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 5, h: getProportionalHeight(5) }
  },
  [WidgetType.VIEW_HISTORY]: {
    default: { w: 5, h: getProportionalHeight(5) },
    min: { w: 5, h: getProportionalHeight(5) },
    max: { w: 5, h: getProportionalHeight(5) }
  },
  [WidgetType.DATABASE_UPDATE]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 3, h: getProportionalHeight(3) },
    max: { w: 3, h: getProportionalHeight(3) }
  },

  // Document Management 類
  [WidgetType.UPLOAD_FILES]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 3, h: getProportionalHeight(3) },
    max: { w: 5, h: getProportionalHeight(5) }
  },
  [WidgetType.REPORTS]: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 2, h: getProportionalHeight(2) },
    max: { w: 5, h: getProportionalHeight(5) }
  },

  // 預設配置（如果上面沒有定義）
  DEFAULT: {
    default: { w: 3, h: getProportionalHeight(3) },
    min: { w: 1, h: getProportionalHeight(1) },
    max: { w: 5, h: getProportionalHeight(5) }
  }
} as const;

// Helper functions
export function getWidgetSizeConfig(widgetType: WidgetType) {
  return WIDGET_SIZE_CONFIGS[widgetType as keyof typeof WIDGET_SIZE_CONFIGS] || WIDGET_SIZE_CONFIGS.DEFAULT;
}

export function getDefaultSize(widgetType: WidgetType) {
  const config = getWidgetSizeConfig(widgetType);
  return {
    w: config.default.w,
    h: config.default.h,
    minW: config.min.w,
    minH: config.min.h,
    maxW: config.max.w,
    maxH: config.max.h
  };
}

// 根據 WidgetSize 枚舉獲取實際尺寸
export function getSizeByEnum(size: WidgetSize) {
  return SIZE_MAPPING[size];
}

// 類型保護函數 - 確保正確的尺寸比較
export function isSizeAtLeast(currentSize: WidgetSize, targetSize: WidgetSize): boolean {
  const sizeOrder = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE, WidgetSize.XLARGE];
  const currentIndex = sizeOrder.indexOf(currentSize);
  const targetIndex = sizeOrder.indexOf(targetSize);
  return currentIndex >= targetIndex;
}

export function isSizeExactly(currentSize: WidgetSize, ...targetSizes: WidgetSize[]): boolean {
  return targetSizes.includes(currentSize);
}

// 檢查 widget 是否支援特定尺寸
export function isWidgetSizeSupported(widgetType: WidgetType, size: WidgetSize): boolean {
  switch (widgetType) {
    // Ask Database - 現在強制只支援 6x6 (XLarge)
    case WidgetType.ASK_DATABASE:
      return size === WidgetSize.XLARGE;
    
    // View History - 只支援 Large (5x5)
    case WidgetType.VIEW_HISTORY:
      return size === WidgetSize.LARGE;
    
    // Database Update (System Update) - 只支援 Medium (3x3)
    case WidgetType.DATABASE_UPDATE:
      return size === WidgetSize.MEDIUM;
    
    // 以下 widgets 不支援 Small (1x1) 和 XLarge (6x6)
    case WidgetType.INVENTORY_SEARCH:
    case WidgetType.RECENT_ACTIVITY:
    case WidgetType.PRODUCT_MIX_CHART:
    case WidgetType.UPLOAD_FILES:
    case WidgetType.REPORTS:
      return size !== WidgetSize.SMALL && size !== WidgetSize.XLARGE;
    
    // Output Stats, Booked Out Stats, Void Stats - 支援 Small, Medium, Large (不支援 XLarge)
    case WidgetType.OUTPUT_STATS:
    case WidgetType.BOOKED_OUT_STATS:
    case WidgetType.VOID_STATS:
      return size !== WidgetSize.XLARGE;
    
    // Finished Product, Material Received - 支援 Medium 和 Large
    case WidgetType.FINISHED_PRODUCT:
    case WidgetType.MATERIAL_RECEIVED:
      return size === WidgetSize.MEDIUM || size === WidgetSize.LARGE;
    
    // ACO Order Progress - 支援 Medium 和 Large
    case WidgetType.ACO_ORDER_PROGRESS:
      return size === WidgetSize.MEDIUM || size === WidgetSize.LARGE;
    
    // Void Pallet - 支援 Medium 和 Large
    case WidgetType.VOID_PALLET:
      return size === WidgetSize.MEDIUM || size === WidgetSize.LARGE;
    
    // 預設：支援 Small, Medium, Large，不支援 XLarge（除非特別指定）
    default:
      return size !== WidgetSize.XLARGE;
  }
}

// 獲取 widget 支援的所有尺寸
export function getSupportedSizes(widgetType: WidgetType): WidgetSize[] {
  return Object.values(WidgetSize).filter(size => 
    isWidgetSizeSupported(widgetType, size)
  );
}

// 獲取 widget 的預設尺寸（第一個支援的尺寸）
export function getDefaultWidgetSize(widgetType: WidgetType): WidgetSize {
  const supportedSizes = getSupportedSizes(widgetType);
  if (supportedSizes.length === 0) {
    return WidgetSize.MEDIUM; // 緊急後備
  }
  
  // 特殊情況：某些 widget 有特定的預設尺寸
  switch (widgetType) {
    case WidgetType.ASK_DATABASE:
      return WidgetSize.XLARGE;
    case WidgetType.VIEW_HISTORY:
      return WidgetSize.LARGE;
    case WidgetType.DATABASE_UPDATE:
      return WidgetSize.MEDIUM;
    case WidgetType.FINISHED_PRODUCT:
    case WidgetType.MATERIAL_RECEIVED:
      return WidgetSize.LARGE;
    default:
      // 優先返回 Medium，如果不支援則返回第一個支援的尺寸
      return supportedSizes.includes(WidgetSize.MEDIUM) 
        ? WidgetSize.MEDIUM 
        : supportedSizes[0];
  }
}

// 驗證並修正 widget 尺寸
export function validateAndFixWidgetSize(widgetType: WidgetType, size: WidgetSize): WidgetSize {
  if (isWidgetSizeSupported(widgetType, size)) {
    return size;
  }
  return getDefaultWidgetSize(widgetType);
}