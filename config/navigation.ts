import {
  PrinterIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  CalculatorIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export interface SubNavigationItem {
  id: string;
  label: string;
  href: string;
  description?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  href?: string;
  onClick?: () => void;
  children?: SubNavigationItem[];
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    id: 'print-label',
    label: 'Print Label',
    icon: PrinterIcon,
    gradient: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%)',
    iconColor: 'text-blue-500',
    children: [
      {
        id: 'qc-label',
        label: 'Q.C. Label',
        href: '/print-label',
        description: 'Quality control labels',
      },
      {
        id: 'grn-label',
        label: 'GRN Label',
        href: '/print-grnlabel',
        description: 'Goods receipt labels',
      },
    ],
  },
  {
    id: 'stock-transfer',
    label: 'Stock Transfer',
    icon: TruckIcon,
    href: '/stock-transfer',
    gradient: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%)',
    iconColor: 'text-green-500',
  },
  {
    id: 'loading-order',
    label: 'Loading Order',
    icon: ClipboardDocumentListIcon,
    href: '/order-loading',
    gradient: 'radial-gradient(circle, rgba(251,146,60,0.15) 0%, rgba(249,115,22,0.06) 50%)',
    iconColor: 'text-orange-500',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: ChartBarIcon,
    gradient: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%)',
    iconColor: 'text-purple-500',
    children: [
      {
        id: 'injection',
        label: 'Injection',
        href: '/admin/injection',
        description: 'Injection production',
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        href: '/admin/pipeline',
        description: 'Pipeline workshop',
      },
      {
        id: 'warehouse',
        label: 'Warehouse',
        href: '/admin/warehouse',
        description: 'Warehouse management',
      },
      {
        id: 'upload',
        label: 'Upload',
        href: '/admin/upload',
        description: 'File upload center',
      },
      {
        id: 'update',
        label: 'Update',
        href: '/admin/update',
        description: 'Data maintenance',
      },
      {
        id: 'stock-mgmt',
        label: 'Stock Mgmt',
        href: '/admin/stock-management',
        description: 'Stock management',
      },
      {
        id: 'stock-count',
        label: 'Stock Count',
        href: '/admin/stock-count',
        description: 'Inventory cycle counting',
      },
      {
        id: 'system',
        label: 'System',
        href: '/admin/system',
        description: 'System reports',
      },
      {
        id: 'analysis',
        label: 'Analysis',
        href: '/admin/analysis',
        description: 'Data analysis',
      },
      {
        id: 'graphql-monitor',
        label: 'GraphQL Monitor',
        href: '/admin/graphql-monitor',
        description: 'GraphQL performance monitoring',
      },
      {
        id: 'performance-dashboard',
        label: 'Performance',
        href: '/admin/performance-dashboard',
        description: 'Widget performance monitoring',
      },
    ],
  },
];
