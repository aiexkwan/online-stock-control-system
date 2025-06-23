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
  
  // Note: ASK_DATABASE is not in WidgetType enum - this needs to be reviewed
  // [WidgetType.ASK_DATABASE]: {
  //   recommended: RECOMMENDED_SIZES.SQUARE_LARGE,
  //   minimum: { w: 6, h: 6 },
  //   description: "Database Query Interface",
  //   features: [
  //     { size: { w: 6, h: 6 }, available: ['Query Input', 'Results Display', 'History'] }
  //   ]
  // },
  
  [WidgetType.DATABASE_UPDATE]: {
    recommended: RECOMMENDED_SIZES.SQUARE_LARGE,
    minimum: { w: 6, h: 6 },
    description: "Database Update Interface",
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
  
  // Stats and Analytics
  [WidgetType.STATS_CARD]: {
    recommended: RECOMMENDED_SIZES.COMPACT,
    minimum: { w: 3, h: 2 },
    description: "Statistics Card",
    features: [
      { size: { w: 3, h: 2 }, available: ['Main Stat', 'Trend'] },
      { size: { w: 5, h: 3 }, available: ['Main Stat', 'Trend', 'Mini Chart'] }
    ]
  },
  
  [WidgetType.ANALYTICS_CHART]: {
    recommended: RECOMMENDED_SIZES.DETAILED,
    minimum: { w: 5, h: 4 },
    description: "Analytics Chart",
    features: [
      { size: { w: 5, h: 4 }, available: ['Basic Chart'] },
      { size: { w: 8, h: 5 }, available: ['Detailed Chart', 'Legend', 'Controls'] },
      { size: { w: 10, h: 6 }, available: ['Interactive Chart', 'Legend', 'Controls', 'Data Table'] }
    ]
  },
  
  [WidgetType.ANALYTICS_DASHBOARD]: {
    recommended: RECOMMENDED_SIZES.FULL,
    minimum: { w: 8, h: 6 },
    description: "Analytics Dashboard",
    features: [
      { size: { w: 8, h: 6 }, available: ['Multiple Charts', 'Summary Stats'] },
      { size: { w: 10, h: 6 }, available: ['Multiple Charts', 'Summary Stats', 'Filters'] },
      { size: { w: 12, h: 8 }, available: ['Full Dashboard', 'All Features'] }
    ]
  },
  
  // Quick Actions and Controls
  [WidgetType.QUICK_ACTIONS]: {
    recommended: RECOMMENDED_SIZES.SQUARE_SMALL,
    minimum: { w: 3, h: 3 },
    description: "Quick Actions",
    features: [
      { size: { w: 3, h: 3 }, available: ['4 Actions'] },
      { size: { w: 5, h: 3 }, available: ['6 Actions'] },
      { size: { w: 5, h: 5 }, available: ['9 Actions', 'Descriptions'] }
    ]
  },
  
  // Inventory and Stock
  [WidgetType.STOCK_SUMMARY]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 4, h: 3 },
    description: "Stock Summary",
    features: [
      { size: { w: 4, h: 3 }, available: ['Stock Levels'] },
      { size: { w: 5, h: 3 }, available: ['Stock Levels', 'Categories'] },
      { size: { w: 8, h: 5 }, available: ['Stock Levels', 'Categories', 'Trend Chart'] }
    ]
  },
  
  [WidgetType.PALLET_OVERVIEW]: {
    recommended: RECOMMENDED_SIZES.DETAILED,
    minimum: { w: 5, h: 4 },
    description: "Pallet Overview",
    features: [
      { size: { w: 5, h: 4 }, available: ['Pallet Count', 'Status'] },
      { size: { w: 8, h: 5 }, available: ['Pallet Count', 'Status', 'Location Map'] },
      { size: { w: 10, h: 6 }, available: ['Pallet Count', 'Status', 'Location Map', 'Details'] }
    ]
  },
  
  // Alerts and Monitoring
  [WidgetType.ALERTS]: {
    recommended: RECOMMENDED_SIZES.TALL,
    minimum: { w: 3, h: 4 },
    description: "System Alerts",
    features: [
      { size: { w: 3, h: 4 }, available: ['5 Alerts'] },
      { size: { w: 4, h: 6 }, available: ['10 Alerts', 'Priority'] },
      { size: { w: 4, h: 8 }, available: ['15 Alerts', 'Priority', 'Actions'] }
    ]
  },
  
  // Void Operations
  [WidgetType.VOID_STATS]: {
    recommended: RECOMMENDED_SIZES.COMPACT,
    minimum: { w: 3, h: 2 },
    description: "Void Statistics",
    features: [
      { size: { w: 3, h: 2 }, available: ['Void Count'] },
      { size: { w: 5, h: 3 }, available: ['Void Count', 'Reasons'] },
      { size: { w: 8, h: 5 }, available: ['Void Count', 'Reasons', 'Trend Chart'] }
    ]
  },
  
  // History and Records
  [WidgetType.VIEW_HISTORY]: {
    recommended: RECOMMENDED_SIZES.WIDE,
    minimum: { w: 6, h: 4 },
    description: "History Viewer",
    features: [
      { size: { w: 6, h: 4 }, available: ['Recent History'] },
      { size: { w: 10, h: 4 }, available: ['Extended History', 'Filters'] },
      { size: { w: 12, h: 6 }, available: ['Full History', 'Filters', 'Export'] }
    ]
  },
  
  // File Operations
  [WidgetType.UPLOAD_FILES]: {
    recommended: RECOMMENDED_SIZES.SQUARE_MEDIUM,
    minimum: { w: 4, h: 4 },
    description: "File Upload",
    features: [
      { size: { w: 4, h: 4 }, available: ['Upload Area'] },
      { size: { w: 5, h: 5 }, available: ['Upload Area', 'Recent Files'] },
      { size: { w: 6, h: 6 }, available: ['Upload Area', 'Recent Files', 'Progress'] }
    ]
  },
  
  [WidgetType.UPLOAD_ORDER_PDF]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 4, h: 3 },
    description: "Order PDF Upload",
    features: [
      { size: { w: 4, h: 3 }, available: ['PDF Upload'] },
      { size: { w: 5, h: 3 }, available: ['PDF Upload', 'Preview'] },
      { size: { w: 8, h: 5 }, available: ['PDF Upload', 'Preview', 'Order Details'] }
    ]
  },
  
  // Product Information
  [WidgetType.PRODUCT_SPEC]: {
    recommended: RECOMMENDED_SIZES.DETAILED,
    minimum: { w: 5, h: 4 },
    description: "Product Specifications",
    features: [
      { size: { w: 5, h: 4 }, available: ['Basic Specs'] },
      { size: { w: 8, h: 5 }, available: ['Detailed Specs', 'Images'] },
      { size: { w: 10, h: 6 }, available: ['Full Specs', 'Images', 'Documents'] }
    ]
  },
  
  // Production Monitoring
  [WidgetType.TODAY_PRODUCTION]: {
    recommended: RECOMMENDED_SIZES.STANDARD,
    minimum: { w: 4, h: 3 },
    description: "Today's Production",
    features: [
      { size: { w: 4, h: 3 }, available: ['Production Count'] },
      { size: { w: 5, h: 3 }, available: ['Production Count', 'Efficiency'] },
      { size: { w: 8, h: 5 }, available: ['Production Count', 'Efficiency', 'Hourly Chart'] }
    ]
  },
  
  [WidgetType.MACHINE_EFFICIENCY]: {
    recommended: RECOMMENDED_SIZES.DETAILED,
    minimum: { w: 5, h: 4 },
    description: "Machine Efficiency",
    features: [
      { size: { w: 5, h: 4 }, available: ['Efficiency Metrics'] },
      { size: { w: 8, h: 5 }, available: ['Efficiency Metrics', 'Machine Status'] },
      { size: { w: 10, h: 6 }, available: ['Efficiency Metrics', 'Machine Status', 'Performance Chart'] }
    ]
  },
  
  [WidgetType.TARGET_HIT_RATE]: {
    recommended: RECOMMENDED_SIZES.SQUARE_MEDIUM,
    minimum: { w: 4, h: 4 },
    description: "Target Hit Rate",
    features: [
      { size: { w: 4, h: 4 }, available: ['Hit Rate %', 'Progress'] },
      { size: { w: 5, h: 5 }, available: ['Hit Rate %', 'Progress', 'Target Details'] },
      { size: { w: 6, h: 6 }, available: ['Hit Rate %', 'Progress', 'Target Details', 'History'] }
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