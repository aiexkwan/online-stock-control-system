/**
 * Admin Menu Component
 * 簡化的管理菜單組件，使用 Dialog Context
 */

'use client';

import React from 'react';
import { useDialog } from '@/app/contexts/DialogContext';
import { useRouter } from 'next/navigation';
import { 
  NoSymbolIcon, 
  ClockIcon, 
  CubeIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  DocumentArrowDownIcon,
  CircleStackIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export const adminMenuItems = [
  {
    id: 'void',
    title: 'Void Pallet',
    description: 'Cancel records of illegal or damaged pallets',
    icon: NoSymbolIcon,
    action: 'void-pallet',
    color: 'hover:bg-red-900/20 hover:text-red-400',
    category: 'System Tools'
  },
  {
    id: 'history',
    title: 'View History',
    description: 'View pallet full history records',
    icon: ClockIcon,
    action: 'view-history',
    color: 'hover:bg-blue-900/20 hover:text-blue-400',
    category: 'System Tools'
  },
  {
    id: 'database',
    title: 'Database Update',
    description: 'Update database information',
    icon: CubeIcon,
    action: 'database-update',
    color: 'hover:bg-orange-900/20 hover:text-orange-400',
    category: 'System Tools'
  },
  {
    id: 'upload-files-only',
    title: 'Upload Files',
    description: 'Upload documents and images',
    icon: DocumentTextIcon,
    action: 'upload-files-only',
    color: 'hover:bg-purple-900/20 hover:text-purple-400',
    category: 'Document Upload'
  },
  {
    id: 'upload-order-pdf',
    title: 'Upload Order PDF',
    description: 'Upload order PDF',
    icon: DocumentTextIcon,
    action: 'upload-order-pdf',
    color: 'hover:bg-blue-900/20 hover:text-blue-400',
    category: 'Document Upload'
  },
  {
    id: 'product-spec-doc',
    title: 'Product Spec Doc',
    description: 'Upload product specification documents',
    icon: DocumentTextIcon,
    action: 'product-spec',
    color: 'hover:bg-cyan-900/20 hover:text-cyan-400',
    category: 'Document Upload'
  },
  // Reports
  {
    id: 'void-pallet-report',
    title: 'Void Pallet Report',
    description: 'View void pallet records',
    icon: NoSymbolIcon,
    action: 'void-pallet-report',
    color: 'hover:bg-red-900/20 hover:text-red-400',
    category: 'Reports'
  },
  {
    id: 'order-loading-report',
    title: 'Order Loading Report',
    description: 'View order loading records',
    icon: TruckIcon,
    action: 'order-loading-report',
    color: 'hover:bg-blue-900/20 hover:text-blue-400',
    category: 'Reports'
  },
  {
    id: 'stock-take-report',
    title: 'Stock Take Report',
    description: 'View stock take records',
    icon: ClipboardDocumentCheckIcon,
    action: 'stock-take-report',
    color: 'hover:bg-green-900/20 hover:text-green-400',
    category: 'Reports'
  },
  {
    id: 'aco-order-report',
    title: 'ACO Order Report',
    description: 'View ACO order records',
    icon: ClipboardDocumentListIcon,
    action: 'aco-order-report',
    color: 'hover:bg-purple-900/20 hover:text-purple-400',
    category: 'Reports'
  },
  {
    id: 'transaction-report',
    title: 'Transaction Report',
    description: 'View transaction records',
    icon: ArrowsRightLeftIcon,
    action: 'transaction-report',
    color: 'hover:bg-orange-900/20 hover:text-orange-400',
    category: 'Reports'
  },
  {
    id: 'grn-report',
    title: 'GRN Report',
    description: 'View goods received notes',
    icon: DocumentArrowDownIcon,
    action: 'grn-report',
    color: 'hover:bg-teal-900/20 hover:text-teal-400',
    category: 'Reports'
  },
  {
    id: 'export-all-data',
    title: 'Export All Data',
    description: 'Export all system data',
    icon: CircleStackIcon,
    action: 'export-all-data',
    color: 'hover:bg-indigo-900/20 hover:text-indigo-400',
    category: 'Reports'
  },
  // Analytics
  {
    id: 'finished-transfer',
    title: 'Finished Transfer',
    description: 'Output ratio analytics',
    icon: ChartBarIcon,
    action: 'finished-transfer',
    color: 'hover:bg-blue-900/20 hover:text-blue-400',
    category: 'Analytics'
  },
  {
    id: 'order-trend',
    title: 'Order Trend',
    description: 'Product trend analytics',
    icon: ArrowTrendingUpIcon,
    action: 'order-trend',
    color: 'hover:bg-green-900/20 hover:text-green-400',
    category: 'Analytics'
  },
  {
    id: 'staff-workload',
    title: 'Staff Workload',
    description: 'Staff productivity analytics',
    icon: UserGroupIcon,
    action: 'staff-workload',
    color: 'hover:bg-purple-900/20 hover:text-purple-400',
    category: 'Analytics'
  }
];

interface AdminMenuProps {
  className?: string;
}

export function AdminMenu({ className }: AdminMenuProps) {
  const { openDialog } = useDialog();
  const router = useRouter();

  const handleItemClick = (item: typeof adminMenuItems[0]) => {
    switch (item.action) {
      case 'void-pallet':
        openDialog('voidPallet');
        break;
      case 'view-history':
        openDialog('viewHistory');
        break;
      case 'database-update':
        openDialog('databaseUpdate');
        break;
      case 'upload-files-only':
        openDialog('uploadFilesOnly');
        break;
      case 'upload-order-pdf':
        openDialog('uploadOrderPdf');
        break;
      case 'product-spec':
        openDialog('productSpec');
        break;
      // Reports
      case 'void-pallet-report':
        window.dispatchEvent(new CustomEvent('openVoidPalletReport'));
        break;
      case 'order-loading-report':
        window.dispatchEvent(new CustomEvent('openOrderLoadingReport'));
        break;
      case 'stock-take-report':
        window.dispatchEvent(new CustomEvent('openStockTakeReport'));
        break;
      case 'aco-order-report':
        window.dispatchEvent(new CustomEvent('openAcoOrderReport'));
        break;
      case 'transaction-report':
        window.dispatchEvent(new CustomEvent('openTransactionReport'));
        break;
      case 'grn-report':
        window.dispatchEvent(new CustomEvent('openGrnReport'));
        break;
      case 'export-all-data':
        window.dispatchEvent(new CustomEvent('openExportAllData'));
        break;
      // Analytics
      case 'finished-transfer':
        window.dispatchEvent(new CustomEvent('openFinishedTransfer'));
        break;
      case 'order-trend':
        window.dispatchEvent(new CustomEvent('openOrderTrend'));
        break;
      case 'staff-workload':
        window.dispatchEvent(new CustomEvent('openStaffWorkload'));
        break;
      default:
        // No default action
    }
  };

  // 按類別分組
  const groupedItems = adminMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof adminMenuItems>);

  return { groupedItems, handleItemClick };
}