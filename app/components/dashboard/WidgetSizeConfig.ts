/**
 * 統一的 Widget 尺寸配置
 * 集中管理所有 widget 的尺寸設定
 */

import { WidgetType, WidgetSize } from '@/app/types/dashboard';

// 基礎尺寸映射
export const SIZE_MAPPING = {
  [WidgetSize.SMALL]: { w: 1, h: 1 },   // 1x1
  [WidgetSize.MEDIUM]: { w: 3, h: 3 },  // 3x3
  [WidgetSize.LARGE]: { w: 5, h: 5 },   // 5x5
  [WidgetSize.XLARGE]: { w: 6, h: 6 }   // 6x6
} as const;

// Widget 特定尺寸配置
export const WIDGET_SIZE_CONFIGS = {
  // Statistics 類 - 主要支援 1x1 和 3x3
  [WidgetType.OUTPUT_STATS]: {
    default: { w: 2, h: 2 },
    min: { w: 1, h: 1 },
    max: { w: 3, h: 3 }
  },
  [WidgetType.BOOKED_OUT_STATS]: {
    default: { w: 2, h: 2 },
    min: { w: 1, h: 1 },
    max: { w: 3, h: 3 }
  },
  [WidgetType.VOID_STATS]: {
    default: { w: 3, h: 3 },
    min: { w: 2, h: 2 },
    max: { w: 4, h: 4 }
  },

  // Charts & Analytics 類 - 需要較大空間
  [WidgetType.PRODUCT_MIX_CHART]: {
    default: { w: 3, h: 4 },
    min: { w: 3, h: 3 },
    max: { w: 5, h: 6 }
  },

  // Operations 類
  [WidgetType.RECENT_ACTIVITY]: {
    default: { w: 3, h: 5 },
    min: { w: 2, h: 3 },
    max: { w: 5, h: 8 }
  },
  [WidgetType.ACO_ORDER_PROGRESS]: {
    default: { w: 3, h: 4 },
    min: { w: 2, h: 2 },
    max: { w: 5, h: 6 }
  },
  [WidgetType.INVENTORY_SEARCH]: {
    default: { w: 3, h: 4 },
    min: { w: 2, h: 2 },
    max: { w: 5, h: 6 }
  },
  [WidgetType.FINISHED_PRODUCT]: {
    default: { w: 5, h: 5 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 8 }
  },
  [WidgetType.MATERIAL_RECEIVED]: {
    default: { w: 5, h: 5 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 8 }
  },

  // Tools 類
  [WidgetType.ASK_DATABASE]: {
    default: { w: 3, h: 3 },
    min: { w: 3, h: 2 },
    max: { w: 3, h: 3 }
  },

  // System Tools 類
  [WidgetType.VOID_PALLET]: {
    default: { w: 3, h: 3 },
    min: { w: 2, h: 2 },
    max: { w: 5, h: 5 }
  },
  [WidgetType.VIEW_HISTORY]: {
    default: { w: 5, h: 5 },
    min: { w: 5, h: 5 },
    max: { w: 5, h: 5 }
  },
  [WidgetType.DATABASE_UPDATE]: {
    default: { w: 3, h: 3 },
    min: { w: 3, h: 3 },
    max: { w: 3, h: 3 }
  },

  // Document Management 類
  [WidgetType.UPLOAD_FILES]: {
    default: { w: 3, h: 3 },
    min: { w: 3, h: 3 },
    max: { w: 5, h: 5 }
  },
  [WidgetType.REPORTS]: {
    default: { w: 3, h: 3 },
    min: { w: 2, h: 2 },
    max: { w: 5, h: 5 }
  },

  // 預設配置（如果上面沒有定義）
  DEFAULT: {
    default: { w: 3, h: 3 },
    min: { w: 1, h: 1 },
    max: { w: 5, h: 5 }
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
  // Ask Database 只支援 Medium 和 Large
  if (widgetType === WidgetType.ASK_DATABASE && size === WidgetSize.SMALL) {
    return false;
  }
  
  // Inventory Search 不支援 Small
  if (widgetType === WidgetType.INVENTORY_SEARCH && size === WidgetSize.SMALL) {
    return false;
  }
  
  // Recent Activity 不支援 Small
  if (widgetType === WidgetType.RECENT_ACTIVITY && size === WidgetSize.SMALL) {
    return false;
  }
  
  // Database Update 不支援 Small 和 Large
  if (widgetType === WidgetType.DATABASE_UPDATE && (size === WidgetSize.SMALL || size === WidgetSize.LARGE)) {
    return false;
  }
  
  // Stock Level Distribution (Product Mix Chart) 不支援 Small
  if (widgetType === WidgetType.PRODUCT_MIX_CHART && size === WidgetSize.SMALL) {
    return false;
  }
  
  // View History 只支援 Large
  if (widgetType === WidgetType.VIEW_HISTORY && (size === WidgetSize.SMALL || size === WidgetSize.MEDIUM)) {
    return false;
  }
  
  // Document Management (Upload Files) 不支援 Small
  if (widgetType === WidgetType.UPLOAD_FILES && size === WidgetSize.SMALL) {
    return false;
  }
  
  // Report Center (Reports) 不支援 Small
  if (widgetType === WidgetType.REPORTS && size === WidgetSize.SMALL) {
    return false;
  }
  
  return true;
}