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
      // v2.0.3: 只保留 Analytics & Stock Count
      {
        id: 'analytics',
        label: 'Analytics & Reports',
        href: '/admin/analytics',
        description: 'Comprehensive analytics, insights, and performance metrics',
      },
      {
        id: 'stock-count',
        label: 'Stock Count',
        href: '/admin/stock-count',
        description: 'Inventory cycle counting',
      },
    ],
  },
];
