/**
 * 註冊所有 Admin Dashboard Widgets
 */

import { WidgetRegistry } from './WidgetRegistry';
import { WidgetType, WidgetSize } from '@/app/types/dashboard';

// Import all widget components
import { OutputStatsWidget } from './widgets/OutputStatsWidget';
import { BookedOutStatsWidget } from './widgets/BookedOutStatsWidget';
import { VoidStatsWidget } from './widgets/VoidStatsWidget';
import { AcoOrderProgressWidget } from './widgets/AcoOrderProgressWidget';
import { FinishedProductWidget } from './widgets/FinishedProductWidget';
import { MaterialReceivedWidget } from './widgets/MaterialReceivedWidget';
import { InventorySearchWidget } from './widgets/InventorySearchWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { ProductMixChartWidget } from './widgets/ProductMixChartWidget';
import { AskDatabaseWidget } from './widgets/AskDatabaseWidget';
import { ViewHistoryWidget } from './widgets/ViewHistoryWidget';
import { VoidPalletWidget } from './widgets/VoidPalletWidget';
import { DatabaseUpdateWidget } from './widgets/DatabaseUpdateWidget';
import { DocumentUploadWidget } from './widgets/DocumentUploadWidget';
import { ReportsWidget } from './widgets/ReportsWidget';

// Register all widgets
export function registerAdminWidgets() {
  // Statistics widgets
  WidgetRegistry.register({
    type: WidgetType.OUTPUT_STATS,
    name: 'Output Statistics',
    description: 'Display output statistics',
    icon: '📊',
    component: OutputStatsWidget,
    defaultSize: { w: 1, h: 1 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.SMALL
    }
  });

  WidgetRegistry.register({
    type: WidgetType.BOOKED_OUT_STATS,
    name: 'Booked Out Statistics',
    description: 'Display booked out statistics',
    icon: '📦',
    component: BookedOutStatsWidget,
    defaultSize: { w: 1, h: 1 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.SMALL
    }
  });

  WidgetRegistry.register({
    type: WidgetType.VOID_STATS,
    name: 'Void Statistics',
    description: 'Display void pallet statistics',
    icon: '🚫',
    component: VoidStatsWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  // Operations widgets
  WidgetRegistry.register({
    type: WidgetType.ACO_ORDER_PROGRESS,
    name: 'ACO Order Progress',
    description: 'Track ACO order progress',
    icon: '📋',
    component: AcoOrderProgressWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  WidgetRegistry.register({
    type: WidgetType.FINISHED_PRODUCT,
    name: 'Finished Product',
    description: 'Finished product tracking',
    icon: '✅',
    component: FinishedProductWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  WidgetRegistry.register({
    type: WidgetType.MATERIAL_RECEIVED,
    name: 'Material Received',
    description: 'Track received materials',
    icon: '📥',
    component: MaterialReceivedWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  WidgetRegistry.register({
    type: WidgetType.INVENTORY_SEARCH,
    name: 'Inventory Search',
    description: 'Quick inventory search',
    icon: '🔍',
    component: InventorySearchWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 0,
      size: WidgetSize.MEDIUM
    }
  });

  WidgetRegistry.register({
    type: WidgetType.RECENT_ACTIVITY,
    name: 'Recent Activity',
    description: 'View recent system activity',
    icon: '⚡',
    component: RecentActivityWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 30000,
      size: WidgetSize.MEDIUM
    }
  });

  // Charts & Analytics
  WidgetRegistry.register({
    type: WidgetType.PRODUCT_MIX_CHART,
    name: 'Product Mix Chart',
    description: 'Product distribution overview',
    icon: '📈',
    component: ProductMixChartWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 300000,
      size: WidgetSize.MEDIUM
    }
  });

  // AI & Tools
  WidgetRegistry.register({
    type: WidgetType.ASK_DATABASE,
    name: 'Ask Database',
    description: 'AI-powered database queries',
    icon: '🤖',
    component: AskDatabaseWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 0,
      size: WidgetSize.MEDIUM
    }
  });

  // System Tools
  WidgetRegistry.register({
    type: WidgetType.VIEW_HISTORY,
    name: 'View History',
    description: 'View pallet history',
    icon: '🕐',
    component: ViewHistoryWidget,
    defaultSize: { w: 5, h: 5 },
    defaultConfig: {
      refreshInterval: 0,
      size: WidgetSize.LARGE
    }
  });

  WidgetRegistry.register({
    type: WidgetType.VOID_PALLET,
    name: 'Void Pallet',
    description: 'Void pallet management',
    icon: '❌',
    component: VoidPalletWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  WidgetRegistry.register({
    type: WidgetType.DATABASE_UPDATE,
    name: 'System Update',
    description: 'Database update tools',
    icon: '🔧',
    component: DatabaseUpdateWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  // Document Management
  WidgetRegistry.register({
    type: WidgetType.UPLOAD_FILES,
    name: 'Document Management',
    description: 'Upload and manage documents',
    icon: '📄',
    component: DocumentUploadWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 60000,
      size: WidgetSize.MEDIUM
    }
  });

  WidgetRegistry.register({
    type: WidgetType.REPORTS,
    name: 'Report Center',
    description: 'Access system reports',
    icon: '📊',
    component: ReportsWidget,
    defaultSize: { w: 3, h: 3 },
    defaultConfig: {
      refreshInterval: 0,
      size: WidgetSize.MEDIUM
    }
  });
}

// Auto-register on import
registerAdminWidgets();