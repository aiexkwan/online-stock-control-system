/**
 * Tab Selector Card Constants
 * Centralized configuration for available cards, categories, and operations menu
 */

import {
  CubeIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
// Removed unused icon imports: ChartBarIcon, ClipboardDocumentListIcon, EyeIcon, CheckIcon, CloudArrowUpIcon, UserCircleIcon, ArrowRightOnRectangleIcon

// Removed unused type import: HeroIcon
import type { CardConfig, CardCategory, OperationMenuItem } from '../types/ui-navigation';

// 所有可用的 Cards 配置
export const AVAILABLE_CARDS: CardConfig[] = [
  // Stock 類別
  { component: 'StockLevelListAndChartCard', displayName: 'Stock Level', category: 'stock' },
  { component: 'StockHistoryCard', displayName: 'Stock History', category: 'stock' },
  { component: 'VoidPalletCard', displayName: 'Void Pallet', category: 'stock' },

  // Operations 類別
  { component: 'VerticalTimelineCard', displayName: 'Transfer History', category: 'operations' },
  { component: 'WorkLevelCard', displayName: 'Work Level', category: 'operations' },

  // Department 類別
  { component: 'DepartInjCard', displayName: 'Injection', category: 'department' },
  { component: 'DepartPipeCard', displayName: 'Pipe Line', category: 'department' },
  { component: 'DepartWareCard', displayName: 'Warehouse', category: 'department' },

  // Document Management 類別
  { component: 'UploadCenterCard', displayName: 'Upload', category: 'document-management' },
  { component: 'DownloadCenterCard', displayName: 'Download', category: 'document-management' },

  // System 類別
  { component: 'PerformanceDashboard', displayName: 'System Performance', category: 'system' },
  { component: 'DataUpdateCard', displayName: 'Data Update', category: 'system' },

  // Chat 類別
  { component: 'ChatbotCard', displayName: 'Chat with Database', category: 'chat-database' },
];

// 類別定義
export const CARD_CATEGORIES: CardCategory[] = [
  { id: 'stock', label: 'Stock', icon: CubeIcon, color: 'text-green-400' },
  { id: 'operations', label: 'Operations', icon: WrenchScrewdriverIcon, color: 'text-purple-400' },
  { id: 'department', label: 'Department', icon: BuildingOfficeIcon, color: 'text-orange-400' },
  {
    id: 'document-management',
    label: 'Document Management',
    icon: DocumentTextIcon,
    color: 'text-cyan-400',
  },
  { id: 'system', label: 'System', icon: ChartPieIcon, color: 'text-amber-400' },
  {
    id: 'chat-database',
    label: 'Chat with database',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'text-purple-400',
  },
];

// Operation menu configuration
export const OPERATION_MENU: OperationMenuItem[] = [
  {
    id: 'print-label',
    label: 'Print Label',
    subItems: [
      { id: 'qc-label', label: 'QC Label' },
      { id: 'grn-label', label: 'GRN Label' },
    ],
  },
  { id: 'stock-transfer', label: 'Stock Transfer' },
  { id: 'order-loading', label: 'Order Loading' },
  { id: 'stock-count', label: 'Stock Count' },
];

// 預設選中的 card (單選模式)
export const DEFAULT_SELECTED_CARD = 'StockLevelListAndChartCard';
