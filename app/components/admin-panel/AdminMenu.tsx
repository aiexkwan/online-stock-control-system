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