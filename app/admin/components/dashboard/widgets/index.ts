/**
 * 小部件導出和註冊
 */

import { WidgetType, WidgetSize } from '@/app/types/dashboard';
import { WidgetRegistry } from '../WidgetRegistry';
import { getDefaultSize } from '../WidgetSizeConfig';
// import { EnhancedStatsCardWidget } from './EnhancedStatsCardWidget'; // Removed
import { RecentActivityWidget } from './RecentActivityWidget';
import { OutputStatsWidget } from './OutputStatsWidget';
import { BookedOutStatsWidget } from './BookedOutStatsWidget';
import { EnhancedAskDatabaseWidget } from './EnhancedAskDatabaseWidget';
import { ProductMixChartWidget } from './ProductMixChartWidget';
import { AcoOrderProgressWidget } from './AcoOrderProgressWidget';
import { InventorySearchWidget } from './InventorySearchWidget';
import { FinishedProductWidget } from './FinishedProductWidget';
import { MaterialReceivedWidget } from './MaterialReceivedWidget';
// import { PalletOverviewWidget } from './PalletOverviewWidget'; // Removed
import { VoidStatsWidget } from './VoidStatsWidget';
import { VoidPalletWidget } from './VoidPalletWidget';
import { ViewHistoryWidget } from './ViewHistoryWidget';
import { DatabaseUpdateWidget } from './DatabaseUpdateWidget';
import { DocumentUploadWidget } from './DocumentUploadWidget';
// import { AnalyticsDashboardWidget } from './AnalyticsDashboardWidget'; // Removed
import { ReportsWidget } from './ReportsWidget';
// import { QuickActionsWidget } from './QuickActionsWidget'; // Removed
import { Package, Activity } from 'lucide-react'; // Removed Zap icon
import { CubeIcon, TruckIcon, ChatBubbleLeftRightIcon, ChartPieIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, PrinterIcon, DocumentArrowDownIcon, NoSymbolIcon, ClockIcon, CloudArrowUpIcon, ChartBarIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';

// 註冊所有小部件
export function registerWidgets() {
  // Stats Card Widget - REMOVED
  // WidgetRegistry.register({
  //   type: WidgetType.STATS_CARD,
  //   ...
  // });

  // Recent Activity Widget
  WidgetRegistry.register({
    type: WidgetType.RECENT_ACTIVITY,
    name: 'Recent Activity',
    description: 'Show recent system activities',
    icon: Activity,
    component: RecentActivityWidget,
    defaultConfig: {
      maxItems: 8,
      refreshInterval: 30000 // 30 seconds
    },
    defaultSize: getDefaultSize(WidgetType.RECENT_ACTIVITY)
  });

  // Quick Actions Widget - REMOVED
  // WidgetRegistry.register({
  //   type: WidgetType.QUICK_ACTIONS,
  //   ...
  // });

  // Output Stats Widget
  WidgetRegistry.register({
    type: WidgetType.OUTPUT_STATS,
    name: 'Output Stats',
    description: 'Production output statistics',
    icon: CubeIcon,
    component: OutputStatsWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      timeRange: 'Today',
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.OUTPUT_STATS)
  });

  // Stock Transfer Widget (原 Booked Out Stats)
  WidgetRegistry.register({
    type: WidgetType.BOOKED_OUT_STATS,
    name: 'Stock Transfer',
    description: 'Transfer statistics by operator',
    icon: TruckIcon,
    component: BookedOutStatsWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      timeRange: 'Today',
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.BOOKED_OUT_STATS)
  });

  // Ask Database Widget (只支援 Medium 和 Large size)
  WidgetRegistry.register({
    type: WidgetType.ASK_DATABASE,
    name: 'Ask Database',
    description: 'AI-powered database queries (Medium/Large size only)',
    icon: ChatBubbleLeftRightIcon,
    component: EnhancedAskDatabaseWidget,
    defaultConfig: {
      size: WidgetSize.LARGE,
      refreshInterval: 0
    },
    defaultSize: getDefaultSize(WidgetType.ASK_DATABASE)
  });

  // Stock Level Widget (原 Product Mix Chart)
  WidgetRegistry.register({
    type: WidgetType.PRODUCT_MIX_CHART,
    name: 'Stock Level',
    description: 'Stock level distribution by type',
    icon: ChartPieIcon,
    component: ProductMixChartWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      timeRange: 'today',
      refreshInterval: 300000 // 5 minutes
    },
    defaultSize: getDefaultSize(WidgetType.PRODUCT_MIX_CHART)
  });

  // ACO Order Progress Widget
  WidgetRegistry.register({
    type: WidgetType.ACO_ORDER_PROGRESS,
    name: 'ACO Order Progress',
    description: 'Track ACO order completion status',
    icon: ClipboardDocumentListIcon,
    component: AcoOrderProgressWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.ACO_ORDER_PROGRESS)
  });

  // Inventory Search Widget
  WidgetRegistry.register({
    type: WidgetType.INVENTORY_SEARCH,
    name: 'Inventory Search',
    description: 'Quick search for product inventory',
    icon: MagnifyingGlassIcon,
    component: InventorySearchWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 0
    },
    defaultSize: getDefaultSize(WidgetType.INVENTORY_SEARCH)
  });

  // Finished Product Widget
  WidgetRegistry.register({
    type: WidgetType.FINISHED_PRODUCT,
    name: 'Finished Product',
    description: 'Print history and statistics',
    icon: PrinterIcon,
    component: FinishedProductWidget,
    defaultConfig: {
      size: WidgetSize.LARGE,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.FINISHED_PRODUCT)
  });

  // Material Received Widget
  WidgetRegistry.register({
    type: WidgetType.MATERIAL_RECEIVED,
    name: 'Material Received',
    description: 'GRN history and statistics',
    icon: DocumentArrowDownIcon,
    component: MaterialReceivedWidget,
    defaultConfig: {
      size: WidgetSize.LARGE,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.MATERIAL_RECEIVED)
  });

  // Pallet Overview Widget - REMOVED
  // WidgetRegistry.register({
  //   type: WidgetType.PALLET_OVERVIEW,
  //   ...
  // });

  // Void Statistics Widget
  WidgetRegistry.register({
    type: WidgetType.VOID_STATS,
    name: 'Void Statistics',
    description: 'Void pallet statistics',
    icon: NoSymbolIcon,
    component: VoidStatsWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.VOID_STATS)
  });

  // Void Pallet Widget
  WidgetRegistry.register({
    type: WidgetType.VOID_PALLET,
    name: 'Void Pallet',
    description: 'Cancel records of illegal or damaged pallets',
    icon: NoSymbolIcon,
    component: VoidPalletWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.VOID_PALLET)
  });

  // View History Widget
  WidgetRegistry.register({
    type: WidgetType.VIEW_HISTORY,
    name: 'View History',
    description: 'View pallet full history records',
    icon: ClockIcon,
    component: ViewHistoryWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.VIEW_HISTORY)
  });

  // System Update Widget (原 Database Update)
  WidgetRegistry.register({
    type: WidgetType.DATABASE_UPDATE,
    name: 'System Update',
    description: 'Quick access to update product and supplier information',
    icon: CubeIcon,
    component: DatabaseUpdateWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.DATABASE_UPDATE)
  });

  // Document Upload Widget (統一三個上傳功能)
  WidgetRegistry.register({
    type: WidgetType.UPLOAD_FILES,
    name: 'Document Upload',
    description: 'Upload documents, orders, and specifications',
    icon: CloudArrowUpIcon,
    component: DocumentUploadWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 60000
    },
    defaultSize: getDefaultSize(WidgetType.UPLOAD_FILES)
  });

  // Analytics Dashboard Widget - REMOVED
  // WidgetRegistry.register({
  //   type: WidgetType.ANALYTICS_DASHBOARD,
  //   ...
  // });

  // Reports Widget
  WidgetRegistry.register({
    type: WidgetType.REPORTS,
    name: 'Reports',
    description: 'Generate and view system reports',
    icon: DocumentChartBarIcon,
    component: ReportsWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      refreshInterval: 300000
    },
    defaultSize: getDefaultSize(WidgetType.REPORTS)
  });
}

// 導出所有小部件組件
export { 
  // EnhancedStatsCardWidget, // Removed
  RecentActivityWidget, 
  // QuickActionsWidget, // Removed
  OutputStatsWidget,
  BookedOutStatsWidget,
  EnhancedAskDatabaseWidget,
  ProductMixChartWidget,
  AcoOrderProgressWidget,
  InventorySearchWidget,
  FinishedProductWidget,
  MaterialReceivedWidget,
  // PalletOverviewWidget, // Removed
  VoidStatsWidget,
  VoidPalletWidget,
  ViewHistoryWidget,
  DatabaseUpdateWidget,
  DocumentUploadWidget,
  // AnalyticsDashboardWidget, // Removed
  ReportsWidget
};