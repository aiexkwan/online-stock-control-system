/**
 * 註冊所有 Admin Dashboard Widgets
 */

import { WidgetRegistry } from './WidgetRegistry';
import { WidgetType, WidgetSize } from '@/app/types/dashboard';
import { getDefaultSize, getDefaultWidgetSize } from './WidgetSizeConfig';

// Import all widget components
import { OutputStatsWidget } from './widgets/OutputStatsWidget';
import { BookedOutStatsWidget } from './widgets/BookedOutStatsWidget';
// import { VoidStatsWidget } from './widgets/VoidStatsWidget'; // Removed as requested
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

// Helper function to register widget with default settings
function registerWidget(
  type: WidgetType,
  name: string,
  description: string,
  icon: string,
  component: any,
  additionalConfig: any = {}
) {
  WidgetRegistry.register({
    type,
    name,
    description,
    icon,
    component,
    defaultSize: getDefaultSize(type),
    defaultConfig: {
      refreshInterval: 60000,
      size: getDefaultWidgetSize(type),
      ...additionalConfig
    }
  });
}

// Register all widgets
export function registerAdminWidgets() {
  // Statistics widgets
  registerWidget(
    WidgetType.OUTPUT_STATS,
    'Production Statistics',
    'Display production statistics',
    '📊',
    OutputStatsWidget,
    { timeRange: 'Today' }
  );

  registerWidget(
    WidgetType.BOOKED_OUT_STATS,
    'Transfer Statistics',
    'Display transfer statistics',
    '📦',
    BookedOutStatsWidget,
    { timeRange: 'Today' }
  );

  // Removed VOID_STATS widget as requested

  // Operations widgets
  registerWidget(
    WidgetType.ACO_ORDER_PROGRESS,
    'ACO Order Progress',
    'Track ACO order progress',
    '📋',
    AcoOrderProgressWidget
  );

  registerWidget(
    WidgetType.FINISHED_PRODUCT,
    'Production History',
    'Production history tracking',
    '✅',
    FinishedProductWidget
  );

  registerWidget(
    WidgetType.MATERIAL_RECEIVED,
    'GRN Received',
    'Track GRN received',
    '📥',
    MaterialReceivedWidget
  );

  registerWidget(
    WidgetType.INVENTORY_SEARCH,
    'Product Code Search',
    'Search by product code',
    '🔍',
    InventorySearchWidget,
    { refreshInterval: 0 }
  );

  registerWidget(
    WidgetType.RECENT_ACTIVITY,
    'Operation History',
    'View operation history',
    '⚡',
    RecentActivityWidget,
    { refreshInterval: 30000 }
  );

  // Charts & Analytics
  registerWidget(
    WidgetType.PRODUCT_MIX_CHART,
    'Inventory Statistics',
    'Inventory statistics by type',
    '📈',
    ProductMixChartWidget,
    { refreshInterval: 300000, timeRange: 'today' }
  );

  // AI & Tools
  registerWidget(
    WidgetType.ASK_DATABASE,
    'Ask Database',
    'AI-powered database queries',
    '🤖',
    AskDatabaseWidget,
    { refreshInterval: 0 }
  );

  // System Tools
  registerWidget(
    WidgetType.VIEW_HISTORY,
    'Search By Pallet',
    'Search by pallet number',
    '🕐',
    ViewHistoryWidget,
    { refreshInterval: 0 }
  );

  registerWidget(
    WidgetType.VOID_PALLET,
    'Damage Statistics',
    'Damage statistics management',
    '❌',
    VoidPalletWidget
  );

  registerWidget(
    WidgetType.DATABASE_UPDATE,
    'Data Update',
    'Data update tools',
    '🔧',
    DatabaseUpdateWidget
  );

  // Document Management
  registerWidget(
    WidgetType.UPLOAD_FILES,
    'Document Upload',
    'Upload documents',
    '📄',
    DocumentUploadWidget
  );

  registerWidget(
    WidgetType.REPORTS,
    'Export Report',
    'Export system reports',
    '📊',
    ReportsWidget,
    { refreshInterval: 0 }
  );
}

// Auto-register on import
registerAdminWidgets();