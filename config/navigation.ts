import { 
  PrinterIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  CalculatorIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Brain } from 'lucide-react';

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

// Function to open Ask Database modal (will be implemented)
const openAskDatabaseModal = () => {
  // This will be connected to the modal state management
  const event = new CustomEvent('openAskDatabase');
  window.dispatchEvent(event);
};

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    id: 'print-label',
    label: 'Print Label',
    icon: PrinterIcon,
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%)",
    iconColor: "text-blue-500",
    children: [
      {
        id: 'qc-label',
        label: 'Q.C. Label',
        href: '/print-label',
        description: 'Quality control labels'
      },
      {
        id: 'grn-label',
        label: 'GRN Label', 
        href: '/print-grnlabel',
        description: 'Goods receipt labels'
      }
    ]
  },
  {
    id: 'stock-transfer',
    label: 'Stock Transfer',
    icon: TruckIcon,
    href: '/stock-transfer',
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%)",
    iconColor: "text-green-500"
  },
  {
    id: 'loading-order',
    label: 'Loading Order',
    icon: ClipboardDocumentListIcon,
    href: '/order-loading',
    gradient: "radial-gradient(circle, rgba(251,146,60,0.15) 0%, rgba(249,115,22,0.06) 50%)",
    iconColor: "text-orange-500"
  },
  {
    id: 'stock-take',
    label: 'Stock Take',
    icon: CalculatorIcon,
    gradient: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%)",
    iconColor: "text-pink-500",
    children: [
      {
        id: 'cycle-count',
        label: 'Cycle Count',
        href: '/stock-take/cycle-count',
        description: 'Periodic inventory count'
      },
      {
        id: 'stock-report',
        label: 'Stock Count Report',
        href: '/stock-take/report',
        description: 'Inventory reports'
      }
    ]
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: ChartBarIcon,
    gradient: "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%)",
    iconColor: "text-purple-500",
    children: [
      {
        id: 'injection',
        label: 'Injection',
        href: '/admin/injection',
        description: 'Injection production'
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        href: '/admin/pipeline',
        description: 'Pipeline workshop'
      },
      {
        id: 'warehouse',
        label: 'Warehouse',
        href: '/admin/warehouse',
        description: 'Warehouse management'
      },
      {
        id: 'upload',
        label: 'Upload',
        href: '/admin/upload',
        description: 'File upload center'
      },
      {
        id: 'update',
        label: 'Update',
        href: '/admin/update',
        description: 'Data maintenance'
      },
      {
        id: 'stock-mgmt',
        label: 'Stock Mgmt',
        href: '/admin/stock-management',
        description: 'Stock management'
      },
      {
        id: 'system',
        label: 'System',
        href: '/admin/system',
        description: 'System reports'
      },
      {
        id: 'analysis',
        label: 'Analysis',
        href: '/admin/analysis',
        description: 'Data analysis'
      }
    ]
  },
  {
    id: 'ask-database',
    label: 'Ask Database',
    icon: Brain,
    onClick: openAskDatabaseModal,
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%)",
    iconColor: "text-purple-500"
  }
];