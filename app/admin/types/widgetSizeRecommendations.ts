/**
 * Widget Size Recommendations
 * 智能尺寸建議系統
 */

import { WidgetType } from '@/app/types/dashboard';

// Recommended size presets (used as initial values and suggestions)
export const RECOMMENDED_SIZES = {
  COMPACT: { w: 3, h: 2, name: 'Compact' },      // For simple statistics
  STANDARD: { w: 5, h: 3, name: 'Standard' },    // Balanced info and charts
  DETAILED: { w: 8, h: 5, name: 'Detailed' },    // Full charts and data
  FULL: { w: 10, h: 6, name: 'Full' },           // Complex features like query interface
  WIDE: { w: 12, h: 3, name: 'Wide' },           // For tables or timelines
  TALL: { w: 4, h: 8, name: 'Tall' },            // For lists or activity logs
  SQUARE_SMALL: { w: 3, h: 3, name: 'Small Square' },
  SQUARE_MEDIUM: { w: 5, h: 5, name: 'Medium Square' },
  SQUARE_LARGE: { w: 6, h: 6, name: 'Large Square' }
};

// Widget type to recommended size mapping
export const WIDGET_SIZE_RECOMMENDATIONS: Record<WidgetType, {
  recommended: typeof RECOMMENDED_SIZES[keyof typeof RECOMMENDED_SIZES];
  minimum: { w: number; h: number };
  description: string;
  features: {
    size: { w: number; h: number };
    available: string[];
  }[];
}> = {
  [WidgetType.OUTPUT_STATS]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 3, h: 2 },
    description: "Production Statistics",
    features: [
      { size: { w: 3, h: 2 }, available: ['Today\'s Output', 'Trend Arrow'] },
      { size: { w: 5, h: 3 }, available: ['Today\'s Output', 'Trend Arrow', 'Hourly Chart'] },
      { size: { w: 8, h: 5 }, available: ['Today\'s Output', 'Trend Arrow', 'Detailed Chart', 'Product Categories'] }
    ]
  },
  
  [WidgetType.ASK_DATABASE]: {
    recommended: RECOMMENDED_SIZES.SQUARE_LARGE,
    minimum: { w: 6, h: 6 },
    description: "Database Query Interface",
    features: [
      { size: { w: 6, h: 6 }, available: ['Query Input', 'Results Display', 'History'] }
    ]
  },
  
  [WidgetType.RECENT_ACTIVITY]: {
    recommended: RECOMMENDED_SIZES.TALL,
    minimum: { w: 3, h: 4 },
    description: "Recent Activity Feed",
    features: [
      { size: { w: 3, h: 4 }, available: ['5 records'] },
      { size: { w: 4, h: 6 }, available: ['10 records', 'Timestamps'] },
      { size: { w: 4, h: 8 }, available: ['15 records', 'Timestamps', 'User Avatars'] }
    ]
  },
  
  [WidgetType.BOOKED_OUT_STATS]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 3, h: 2 },
    description: "Booked Out Statistics",
    features: [
      { size: { w: 3, h: 2 }, available: ['Today\'s Count'] },
      { size: { w: 5, h: 3 }, available: ['Today\'s Count', 'Chart'] },
      { size: { w: 8, h: 5 }, available: ['Today\'s Count', 'Detailed Chart', 'Product Breakdown'] }
    ]
  },
  
  [WidgetType.ACO_ORDER_PROGRESS]: {
    recommended: RECOMMENDED_SIZES.WIDE,
    minimum: { w: 6, h: 3 },
    description: "ACO Order Progress",
    features: [
      { size: { w: 6, h: 3 }, available: ['Progress Bar', 'Basic Info'] },
      { size: { w: 10, h: 3 }, available: ['Progress Bar', 'Detailed Status', 'ETA'] },
      { size: { w: 12, h: 4 }, available: ['Progress Bar', 'Detailed Status', 'ETA', 'History'] }
    ]
  },
  
  [WidgetType.INVENTORY_SEARCH]: {
    recommended: RECOMMENDED_SIZES.SQUARE_MEDIUM,
    minimum: { w: 4, h: 4 },
    description: "Inventory Search",
    features: [
      { size: { w: 4, h: 4 }, available: ['Search Box', '5 Results'] },
      { size: { w: 5, h: 5 }, available: ['Search Box', '10 Results', 'Stock Levels'] },
      { size: { w: 6, h: 6 }, available: ['Search Box', '15 Results', 'Stock Levels', 'Location Info'] }
    ]
  },
  
  [WidgetType.FINISHED_PRODUCT]: {
    recommended: RECOMMENDED_SIZES.DETAILED,
    minimum: { w: 4, h: 3 },
    description: "Finished Product Stats",
    features: [
      { size: { w: 4, h: 3 }, available: ['Product List'] },
      { size: { w: 6, h: 4 }, available: ['Product List', 'Stock Levels'] },
      { size: { w: 8, h: 5 }, available: ['Product List', 'Stock Levels', 'Detailed Analysis'] }
    ]
  },
  
  [WidgetType.MATERIAL_RECEIVED]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 3, h: 3 },
    description: "Material Received Records",
    features: [
      { size: { w: 3, h: 3 }, available: ['Today\'s Receipts'] },
      { size: { w: 5, h: 3 }, available: ['Today\'s Receipts', 'Supplier List'] },
      { size: { w: 8, h: 5 }, available: ['Today\'s Receipts', 'Supplier List', 'Trend Chart'] }
    ]
  },
  
  [WidgetType.PRODUCT_MIX_CHART]: {
    recommended: RECOMMENDED_SIZES.DETAILED,
    minimum: { w: 5, h: 4 },
    description: "Product Mix Chart",
    features: [
      { size: { w: 5, h: 4 }, available: ['Basic Pie Chart'] },
      { size: { w: 8, h: 5 }, available: ['Detailed Pie Chart', 'Product Labels'] },
      { size: { w: 10, h: 6 }, available: ['Interactive Pie Chart', 'Product Labels', 'Data Table'] }
    ]
  },
  
  [WidgetType.VOID_PALLET]: {
    recommended: RECOMMENDED_SIZES.SQUARE_MEDIUM,
    minimum: { w: 4, h: 4 },
    description: "Void Pallet Operations",
    features: [
      { size: { w: 4, h: 4 }, available: ['Scan Interface'] },
      { size: { w: 5, h: 5 }, available: ['Scan Interface', 'Recent Records'] },
      { size: { w: 6, h: 6 }, available: ['Scan Interface', 'Recent Records', 'Statistics'] }
    ]
  },
  
  [WidgetType.REPORTS]: {
    recommended: RECOMMENDED_SIZES.WIDE,
    minimum: { w: 6, h: 3 },
    description: "Reports Center",
    features: [
      { size: { w: 6, h: 3 }, available: ['Report List'] },
      { size: { w: 10, h: 4 }, available: ['Report List', 'Quick Preview'] },
      { size: { w: 12, h: 5 }, available: ['Report List', 'Quick Preview', 'Filter Options'] }
    ]
  },
  
  // Default recommendations (if no specific recommendation defined)
  [WidgetType.CUSTOM]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 3, h: 3 },
    description: "Custom Widget",
    features: [
      { size: { w: 3, h: 3 }, available: ['Basic Features'] }
    ]
  }
};

// Helper function: Check what features are available at current size
export function getAvailableFeatures(
  widgetType: WidgetType, 
  currentSize: { w: number; h: number }
): string[] {
  const recommendations = WIDGET_SIZE_RECOMMENDATIONS[widgetType];
  if (!recommendations) return [];
  
  // Find features available at current size
  let availableFeatures: string[] = [];
  
  for (const feature of recommendations.features) {
    if (currentSize.w >= feature.size.w && currentSize.h >= feature.size.h) {
      availableFeatures = feature.available;
    }
  }
  
  return availableFeatures;
}

// Helper function: Get next recommended size
export function getNextRecommendedSize(
  widgetType: WidgetType,
  currentSize: { w: number; h: number }
): { w: number; h: number } | null {
  const recommendations = WIDGET_SIZE_RECOMMENDATIONS[widgetType];
  if (!recommendations) return null;
  
  // Find next size recommendation larger than current
  for (const feature of recommendations.features) {
    if (feature.size.w > currentSize.w || feature.size.h > currentSize.h) {
      return feature.size;
    }
  }
  
  return null;
}