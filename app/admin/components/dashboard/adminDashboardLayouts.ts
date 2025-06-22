/**
 * Admin Dashboard Layouts
 * 定義每個主題的固定佈局和 widget 配置
 */

export interface AdminWidgetConfig {
  type: string;
  title: string;
  gridArea: string;
  dataSource?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  metrics?: string[];
  component?: string; // 特殊組件名稱
}

export interface AdminDashboardLayout {
  theme: string;
  gridTemplate: string;
  widgets: AdminWidgetConfig[];
}

export const adminDashboardLayouts: Record<string, AdminDashboardLayout> = {
  overview: {
    theme: 'overview',
    gridTemplate: `"widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8" "widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget10"`,
    widgets: [
      {
        type: 'stats',
        title: 'Widget 2',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        metrics: ['total_count', 'trend']
      },
      {
        type: 'stats',
        title: 'Widget 3',
        gridArea: 'widget3',
        dataSource: 'data_customerorder',
        metrics: ['active_count']
      },
      {
        type: 'stats',
        title: 'Widget 4',
        gridArea: 'widget4',
        dataSource: 'stock_level',
        metrics: ['total_value']
      },
      {
        type: 'stats',
        title: 'Widget 5',
        gridArea: 'widget5',
        dataSource: 'system_status',
        metrics: ['health_score']
      },
      {
        type: 'chart',
        title: 'Widget 6',
        gridArea: 'widget6',
        dataSource: 'record_palletinfo',
        chartType: 'area'
      },
      {
        type: 'chart',
        title: 'Widget 7',
        gridArea: 'widget7',
        dataSource: 'record_inventory',
        chartType: 'donut'
      },
      {
        type: 'list',
        title: 'Widget 8',
        gridArea: 'widget8',
        dataSource: 'record_history'
      },
      {
        type: 'table',
        title: 'Widget 9',
        gridArea: 'widget9',
        dataSource: 'production_summary'
      },
      {
        type: 'chart',
        title: 'Widget 10',
        gridArea: 'widget10',
        dataSource: 'record_transfer',
        chartType: 'bar'
      }
    ]
  },

  injection: {
    theme: 'injection',
    gridTemplate: `"widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'stats',
        title: 'Total Production',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        metrics: ['count', 'trend']
      },
      {
        type: 'stats',
        title: 'Active Machines',
        gridArea: 'widget3',
        dataSource: 'production_status',
        metrics: ['active_count']
      },
      {
        type: 'stats',
        title: 'Efficiency Rate',
        gridArea: 'widget4',
        dataSource: 'production_metrics',
        metrics: ['efficiency']
      },
      {
        type: 'stats',
        title: 'Defect Rate',
        gridArea: 'widget5',
        dataSource: 'quality_control',
        metrics: ['defect_rate']
      },
      {
        type: 'chart',
        title: 'Hourly Production Trend',
        gridArea: 'widget6',
        dataSource: 'record_palletinfo',
        chartType: 'line'
      },
      {
        type: 'chart',
        title: 'Machine Status',
        gridArea: 'widget7',
        dataSource: 'machine_status',
        chartType: 'donut'
      },
      {
        type: 'stats',
        title: 'Quality Score',
        gridArea: 'widget8',
        dataSource: 'quality_metrics',
        metrics: ['quality_score']
      },
      {
        type: 'table',
        title: 'Production Summary',
        gridArea: 'widget9',
        dataSource: 'production_summary'
      },
      {
        type: 'chart',
        title: 'Quality Metrics',
        gridArea: 'widget10',
        dataSource: 'quality_control',
        chartType: 'bar'
      }
    ]
  },

  pipeline: {
    theme: 'pipeline',
    gridTemplate: `"widget2 widget2 widget2 widget2 widget3 widget3 widget4 widget4 widget1 widget1" "widget2 widget2 widget2 widget2 widget5 widget5 widget6 widget6 widget1 widget1" "widget7 widget7 widget7 widget7 widget7 widget8 widget8 widget8 widget1 widget1" "widget7 widget7 widget7 widget7 widget7 widget8 widget8 widget8 widget1 widget1" "widget7 widget7 widget7 widget7 widget7 widget9 widget9 widget9 widget1 widget1" "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget1 widget1" "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'flow-diagram',
        title: 'Pipeline Flow',
        gridArea: 'widget2',
        dataSource: 'record_inventory',
        component: 'PipelineFlowDiagram'
      },
      {
        type: 'stats',
        title: 'Throughput',
        gridArea: 'widget3',
        dataSource: 'pipeline_metrics',
        metrics: ['throughput']
      },
      {
        type: 'stats',
        title: 'Bottlenecks',
        gridArea: 'widget4',
        dataSource: 'pipeline_metrics',
        metrics: ['bottlenecks']
      },
      {
        type: 'stats',
        title: 'Wait Time',
        gridArea: 'widget5',
        dataSource: 'pipeline_metrics',
        metrics: ['wait_time']
      },
      {
        type: 'stats',
        title: 'Capacity',
        gridArea: 'widget6',
        dataSource: 'pipeline_metrics',
        metrics: ['capacity']
      },
      {
        type: 'monitor',
        title: 'Real-time Monitor',
        gridArea: 'widget7',
        dataSource: 'record_history'
      },
      {
        type: 'chart',
        title: 'Flow Rate Analysis',
        gridArea: 'widget8',
        dataSource: 'pipeline_flow',
        chartType: 'area'
      },
      {
        type: 'alerts',
        title: 'Pipeline Alerts',
        gridArea: 'widget9',
        dataSource: 'system_alerts'
      },
      {
        type: 'table',
        title: 'Pipeline Status',
        gridArea: 'widget10',
        dataSource: 'pipeline_status'
      }
    ]
  },

  warehouse: {
    theme: 'warehouse',
    gridTemplate: `"widget2 widget2 widget2 widget2 widget2 widget3 widget3 widget4 widget1 widget1" "widget2 widget2 widget2 widget2 widget2 widget5 widget5 widget6 widget1 widget1" "widget2 widget2 widget2 widget2 widget2 widget7 widget7 widget7 widget1 widget1" "widget2 widget2 widget2 widget2 widget2 widget8 widget8 widget8 widget1 widget1" "widget7 widget7 widget8 widget8 widget8 widget9 widget9 widget9 widget1 widget1" "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget1 widget1" "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'heatmap',
        title: 'Warehouse Location Map',
        gridArea: 'widget2',
        dataSource: 'record_inventory',
        component: 'WarehouseHeatmap'
      },
      {
        type: 'stats',
        title: 'Total Stock',
        gridArea: 'widget3',
        dataSource: 'stock_level',
        metrics: ['total_quantity']
      },
      {
        type: 'stats',
        title: 'Locations Used',
        gridArea: 'widget4',
        dataSource: 'record_inventory',
        metrics: ['location_count']
      },
      {
        type: 'stats',
        title: 'In Transit',
        gridArea: 'widget5',
        dataSource: 'record_transfer',
        metrics: ['active_transfers']
      },
      {
        type: 'stats',
        title: 'Capacity',
        gridArea: 'widget6',
        dataSource: 'warehouse_capacity',
        metrics: ['usage_percentage']
      },
      {
        type: 'chart',
        title: 'Inventory Levels',
        gridArea: 'widget7',
        dataSource: 'record_inventory',
        chartType: 'bar'
      },
      {
        type: 'chart',
        title: 'Location Utilization',
        gridArea: 'widget8',
        dataSource: 'location_usage',
        chartType: 'donut'
      },
      {
        type: 'alerts',
        title: 'Warehouse Alerts',
        gridArea: 'widget9',
        dataSource: 'warehouse_alerts'
      },
      {
        type: 'table',
        title: 'Recent Movements',
        gridArea: 'widget10',
        dataSource: 'record_transfer'
      }
    ]
  },

  upload: {
    theme: 'upload',
    gridTemplate: `
      "widget2 widget2 widget2 widget3 widget3 widget3 widget4 widget4 widget1 widget1" 
      "widget2 widget2 widget2 widget3 widget3 widget3 widget5 widget5 widget1 widget1" 
      "widget2 widget2 widget2 widget3 widget3 widget3 widget6 widget6 widget1 widget1" 
      "widget2 widget2 widget2 widget3 widget3 widget3 widget7 widget7 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'upload-zone',
        title: 'Upload Files',
        gridArea: 'widget2',
        dataSource: 'doc_upload',
        component: 'UploadZone'
      },
      {
        type: 'list',
        title: 'Recent Uploads',
        gridArea: 'widget3',
        dataSource: 'doc_upload'
      },
      {
        type: 'stats',
        title: 'Total Files',
        gridArea: 'widget4',
        dataSource: 'upload_stats',
        metrics: ['total_files']
      },
      {
        type: 'stats',
        title: 'Processing',
        gridArea: 'widget5',
        dataSource: 'upload_stats',
        metrics: ['processing']
      },
      {
        type: 'stats',
        title: 'Completed',
        gridArea: 'widget6',
        dataSource: 'upload_stats',
        metrics: ['completed']
      },
      {
        type: 'stats',
        title: 'Failed',
        gridArea: 'widget7',
        dataSource: 'upload_stats',
        metrics: ['failed']
      }
    ]
  },

  update: {
    theme: 'update',
    gridTemplate: `
      "widget2 widget2 widget2 widget3 widget3 widget3 widget4 widget4 widget1 widget1" 
      "widget2 widget2 widget2 widget3 widget3 widget3 widget5 widget5 widget1 widget1" 
      "widget2 widget2 widget2 widget3 widget3 widget3 widget6 widget6 widget1 widget1" 
      "widget2 widget2 widget2 widget3 widget3 widget3 widget7 widget7 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'form',
        title: 'Update Form',
        gridArea: 'widget2',
        dataSource: 'data_forms',
        component: 'UpdateForm'
      },
      {
        type: 'preview',
        title: 'Data Preview',
        gridArea: 'widget3',
        dataSource: 'data_preview'
      },
      {
        type: 'stats',
        title: 'Pending Updates',
        gridArea: 'widget4',
        dataSource: 'update_stats',
        metrics: ['pending_count']
      },
      {
        type: 'stats',
        title: 'Processing',
        gridArea: 'widget5',
        dataSource: 'update_stats',
        metrics: ['processing_count']
      },
      {
        type: 'stats',
        title: 'Completed Today',
        gridArea: 'widget6',
        dataSource: 'update_stats',
        metrics: ['completed_today']
      },
      {
        type: 'stats',
        title: 'Failed',
        gridArea: 'widget7',
        dataSource: 'update_stats',
        metrics: ['failed_count']
      }
    ]
  },

  'stock-management': {
    theme: 'stock-management',
    gridTemplate: `
      "widget2 widget2 widget2 widget2 widget2 widget3 widget3 widget3 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget4 widget4 widget4 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget5 widget5 widget5 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'table',
        title: 'Stock Inventory',
        gridArea: 'widget2',
        dataSource: 'stock_level',
        component: 'StockInventoryTable'
      },
      {
        type: 'stats',
        title: 'Total Stock Value',
        gridArea: 'widget3',
        dataSource: 'stock_level',
        metrics: ['total_value']
      },
      {
        type: 'chart',
        title: 'Stock Distribution',
        gridArea: 'widget4',
        dataSource: 'stock_level',
        chartType: 'donut'
      },
      {
        type: 'alerts',
        title: 'Stock Alerts',
        gridArea: 'widget5',
        dataSource: 'stock_alerts'
      }
    ]
  },

  system: {
    theme: 'system',
    gridTemplate: `
      "widget2 widget2 widget2 widget5 widget5 widget5 widget1 widget1"
      "widget3 widget3 widget3 widget6 widget6 widget6 widget1 widget1"
      "widget4 widget4 widget4 widget7 widget7 widget7 widget1 widget1"
      "widget8 widget8 widget8 widget9 widget9 widget9 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'stats',
        title: 'System Health',
        gridArea: 'widget2',
        dataSource: 'system_status',
        metrics: ['health_score']
      },
      {
        type: 'stats',
        title: 'Active Users',
        gridArea: 'widget3',
        dataSource: 'data_id',
        metrics: ['active_count']
      },
      {
        type: 'stats',
        title: 'CPU Usage',
        gridArea: 'widget4',
        dataSource: 'system_metrics',
        metrics: ['cpu_usage']
      },
      {
        type: 'chart',
        title: 'Performance Metrics',
        gridArea: 'widget5',
        dataSource: 'system_performance',
        chartType: 'line'
      },
      {
        type: 'chart',
        title: 'Memory Usage',
        gridArea: 'widget6',
        dataSource: 'system_metrics',
        chartType: 'area'
      },
      {
        type: 'alerts',
        title: 'System Alerts',
        gridArea: 'widget7',
        dataSource: 'system_alerts'
      },
      {
        type: 'list',
        title: 'Recent Logs',
        gridArea: 'widget8',
        dataSource: 'system_logs'
      },
      {
        type: 'table',
        title: 'Background Jobs',
        gridArea: 'widget9',
        dataSource: 'cron_jobs'
      }
    ]
  },

  analysis: {
    theme: 'analysis',
    gridTemplate: `
      "widget2 widget2 widget2 widget2 widget3 widget3 widget3 widget3 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget3 widget3 widget3 widget3 widget1 widget1"
      "widget4 widget4 widget4 widget4 widget5 widget5 widget5 widget5 widget1 widget1"
      "widget4 widget4 widget4 widget4 widget5 widget5 widget5 widget5 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: 'History Tree',
        gridArea: 'widget1',
        component: 'HistoryTree'
      },
      {
        type: 'chart',
        title: 'Production Trend Analysis',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        chartType: 'line'
      },
      {
        type: 'chart',
        title: 'Product Mix Distribution',
        gridArea: 'widget3',
        dataSource: 'product_mix',
        chartType: 'pie'
      },
      {
        type: 'table',
        title: 'Performance Metrics',
        gridArea: 'widget4',
        dataSource: 'analysis_details'
      },
      {
        type: 'chart',
        title: 'Comparative Analysis',
        gridArea: 'widget5',
        dataSource: 'period_comparison',
        chartType: 'bar'
      }
    ]
  }
};