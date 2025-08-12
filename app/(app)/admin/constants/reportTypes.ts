/**
 * Download Center Card Constants
 * Report types configuration for download center
 */

export const REPORT_TYPES = [
  { 
    id: 'stock-take',
    name: 'Stock Take Report',
    description: 'Inventory stock take analysis and discrepancies',
    component: 'ReportCard', // Using generic ReportCard with stock-take type
    available: false // Mark as not available yet
  },
  { 
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Current inventory levels and stock analysis',
    component: 'ReportCard', // Using generic ReportCard with inventory type
    available: false // Mark as not available yet
  },
  { 
    id: 'aco-order',
    name: 'ACO Order Report',
    description: 'ACO order processing and status tracking',
    component: 'AcoOrderReportCard',
    available: true // Has Excel export functionality
  },
  { 
    id: 'grn',
    name: 'GRN Receiving Report',
    description: 'Goods received note and receiving records',
    component: 'GrnReportCard',
    available: true // Implemented with batch generation
  },
  { 
    id: 'transfer',
    name: 'Transfer Report',
    description: 'Stock transfer history and movement tracking',
    component: 'TransferReport', // Integrated directly in DownloadCenterCard
    available: true // Has Excel export functionality with date range picker
  },
  { 
    id: 'order-loading',
    name: 'Order Loading Report',
    description: 'Order loading progress and completion status',
    component: 'UnifiedLoadingReportDialog', // Exists as dialog component
    available: true // Has functionality but as dialog
  }
];