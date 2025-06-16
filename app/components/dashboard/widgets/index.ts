/**
 * 小部件導出和註冊
 */

import { WidgetType, WidgetSize } from '@/app/types/dashboard';
import { WidgetRegistry } from '../WidgetRegistry';
import { StatsCardWidget } from './StatsCardWidget';
import { RecentActivityWidget } from './RecentActivityWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { OutputStatsWidget } from './OutputStatsWidget';
import { BookedOutStatsWidget } from './BookedOutStatsWidget';
import { AskDatabaseWidget } from './AskDatabaseWidget';
import { ProductMixChartWidget } from './ProductMixChartWidget';
import { AcoOrderProgressWidget } from './AcoOrderProgressWidget';
import { InventorySearchWidget } from './InventorySearchWidget';
import { FinishedProductWidget } from './FinishedProductWidget';
import { MaterialReceivedWidget } from './MaterialReceivedWidget';
import { PalletOverviewWidget } from './PalletOverviewWidget';
import { VoidStatsWidget } from './VoidStatsWidget';
import { Package, Activity, Zap } from 'lucide-react';
import { CubeIcon, TruckIcon, ChatBubbleLeftRightIcon, ChartPieIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, PrinterIcon, DocumentArrowDownIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

// 註冊所有小部件
export function registerWidgets() {
  // Stats Card Widget
  WidgetRegistry.register({
    type: WidgetType.STATS_CARD,
    name: 'Stats Card',
    description: 'Display a single statistic with optional trend',
    icon: Package,
    component: StatsCardWidget,
    defaultConfig: {
      dataSource: 'total_pallets',
      icon: 'package',
      refreshInterval: 60000
    },
    defaultSize: {
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      maxW: 6,
      maxH: 4
    }
  });

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
    defaultSize: {
      w: 4,
      h: 6,
      minW: 3,
      minH: 4,
      maxW: 6,
      maxH: 10
    }
  });

  // Quick Actions Widget
  WidgetRegistry.register({
    type: WidgetType.QUICK_ACTIONS,
    name: 'Quick Actions',
    description: 'Quick access to common functions',
    icon: Zap,
    component: QuickActionsWidget,
    defaultConfig: {
      maxActions: 6,
      refreshInterval: 0 // No refresh needed
    },
    defaultSize: {
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 6
    }
  });

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
    defaultSize: {
      w: 3,
      h: 3,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 6
    }
  });

  // Booked Out Stats Widget
  WidgetRegistry.register({
    type: WidgetType.BOOKED_OUT_STATS,
    name: 'Booked Out Stats',
    description: 'Transfer statistics',
    icon: TruckIcon,
    component: BookedOutStatsWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      timeRange: 'Today',
      refreshInterval: 60000
    },
    defaultSize: {
      w: 3,
      h: 3,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 6
    }
  });

  // Ask Database Widget (只支援 Large size)
  WidgetRegistry.register({
    type: WidgetType.ASK_DATABASE,
    name: 'Ask Database',
    description: 'AI-powered database queries (Large size only)',
    icon: ChatBubbleLeftRightIcon,
    component: AskDatabaseWidget,
    defaultConfig: {
      size: WidgetSize.LARGE,
      refreshInterval: 0
    },
    defaultSize: {
      w: 8,
      h: 8,
      minW: 8,
      minH: 6,
      maxW: 12,
      maxH: 12
    }
  });

  // Product Mix Chart Widget
  WidgetRegistry.register({
    type: WidgetType.PRODUCT_MIX_CHART,
    name: 'Product Mix Chart',
    description: 'Product distribution visualization',
    icon: ChartPieIcon,
    component: ProductMixChartWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      timeRange: 'today',
      refreshInterval: 300000 // 5 minutes
    },
    defaultSize: {
      w: 4,
      h: 5,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 8
    }
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
    defaultSize: {
      w: 4,
      h: 5,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 8
    }
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
    defaultSize: {
      w: 4,
      h: 5,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 8
    }
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
    defaultSize: {
      w: 6,
      h: 6,
      minW: 2,
      minH: 2,
      maxW: 8,
      maxH: 10
    }
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
    defaultSize: {
      w: 6,
      h: 6,
      minW: 2,
      minH: 2,
      maxW: 8,
      maxH: 10
    }
  });

  // Pallet Overview Widget
  WidgetRegistry.register({
    type: WidgetType.PALLET_OVERVIEW,
    name: 'Pallet Overview',
    description: 'Production and transfer overview',
    icon: ChartPieIcon,
    component: PalletOverviewWidget,
    defaultConfig: {
      size: WidgetSize.MEDIUM,
      timeRange: 'Past 3 days',
      refreshInterval: 300000 // 5 minutes
    },
    defaultSize: {
      w: 4,
      h: 5,
      minW: 2,
      minH: 3,
      maxW: 6,
      maxH: 7
    }
  });

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
    defaultSize: {
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 6
    }
  });
}

// 導出所有小部件組件
export { 
  StatsCardWidget, 
  RecentActivityWidget, 
  QuickActionsWidget,
  OutputStatsWidget,
  BookedOutStatsWidget,
  AskDatabaseWidget,
  ProductMixChartWidget,
  AcoOrderProgressWidget,
  InventorySearchWidget,
  FinishedProductWidget,
  MaterialReceivedWidget,
  PalletOverviewWidget,
  VoidStatsWidget
};