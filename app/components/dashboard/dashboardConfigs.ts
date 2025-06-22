/**
 * Dashboard Configurations
 * 定義每個儀表板頁面的內容配置
 */

export interface WidgetConfig {
  type: string;
  title: string;
  gridArea: string;
  dataSource: string;
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  metrics?: string[];
}

export interface DashboardConfig {
  theme: string;
  title: string;
  description: string;
  widgets: WidgetConfig[];
}

export const dashboardConfigs: Record<string, DashboardConfig> = {
  injection: {
    theme: 'injection',
    title: 'Injection Production Dashboard',
    description: 'Real-time injection molding production monitoring',
    widgets: [
      {
        type: 'stats',
        title: 'Total Production',
        gridArea: 'stats1',
        dataSource: 'record_palletinfo',
        metrics: ['count', 'trend']
      },
      {
        type: 'stats',
        title: 'Active Machines',
        gridArea: 'stats2',
        dataSource: 'production_status',
        metrics: ['active_count']
      },
      {
        type: 'stats',
        title: 'Efficiency Rate',
        gridArea: 'stats3',
        dataSource: 'production_metrics',
        metrics: ['efficiency']
      },
      {
        type: 'stats',
        title: 'Defect Rate',
        gridArea: 'stats4',
        dataSource: 'quality_control',
        metrics: ['defect_rate']
      },
      {
        type: 'chart',
        title: 'Hourly Production Trend',
        gridArea: 'chart',
        dataSource: 'record_palletinfo',
        chartType: 'line'
      },
      {
        type: 'chart',
        title: 'Machine Status',
        gridArea: 'status',
        dataSource: 'machine_status',
        chartType: 'donut'
      },
      {
        type: 'list',
        title: 'Recent Production',
        gridArea: 'list',
        dataSource: 'record_palletinfo'
      },
      {
        type: 'table',
        title: 'Production Summary',
        gridArea: 'table',
        dataSource: 'production_summary'
      }
    ]
  },

  pipeline: {
    theme: 'pipeline',
    title: 'Pipeline Flow Dashboard',
    description: 'Monitor material flow through production pipeline',
    widgets: [
      {
        type: 'flow',
        title: 'Pipeline Flow Diagram',
        gridArea: 'flow',
        dataSource: 'record_inventory'
      },
      {
        type: 'stats-grid',
        title: 'Pipeline Statistics',
        gridArea: 'stats',
        dataSource: 'pipeline_metrics',
        metrics: ['throughput', 'bottlenecks', 'wait_time', 'capacity']
      },
      {
        type: 'monitor',
        title: 'Real-time Monitor',
        gridArea: 'monitor',
        dataSource: 'record_history'
      },
      {
        type: 'chart',
        title: 'Flow Rate Analysis',
        gridArea: 'chart',
        dataSource: 'pipeline_flow',
        chartType: 'area'
      },
      {
        type: 'alerts',
        title: 'Pipeline Alerts',
        gridArea: 'alerts',
        dataSource: 'system_alerts'
      }
    ]
  },

  warehouse: {
    theme: 'warehouse',
    title: 'Warehouse Management Dashboard',
    description: 'Inventory tracking and warehouse operations',
    widgets: [
      {
        type: 'heatmap',
        title: 'Warehouse Location Map',
        gridArea: 'map',
        dataSource: 'record_inventory'
      },
      {
        type: 'summary',
        title: 'Inventory Summary',
        gridArea: 'summary',
        dataSource: 'stock_level'
      },
      {
        type: 'stats',
        title: 'Total Stock',
        gridArea: 'stats1',
        dataSource: 'stock_level',
        metrics: ['total_quantity']
      },
      {
        type: 'stats',
        title: 'Locations Used',
        gridArea: 'stats2',
        dataSource: 'record_inventory',
        metrics: ['location_count']
      },
      {
        type: 'stats',
        title: 'In Transit',
        gridArea: 'stats3',
        dataSource: 'record_transfer',
        metrics: ['active_transfers']
      },
      {
        type: 'stats',
        title: 'Capacity',
        gridArea: 'stats4',
        dataSource: 'warehouse_capacity',
        metrics: ['usage_percentage']
      },
      {
        type: 'chart',
        title: 'Inventory Levels',
        gridArea: 'inventory',
        dataSource: 'record_inventory',
        chartType: 'bar'
      },
      {
        type: 'table',
        title: 'Recent Movements',
        gridArea: 'movement',
        dataSource: 'record_transfer'
      }
    ]
  },

  upload: {
    theme: 'upload',
    title: 'Document Upload Dashboard',
    description: 'File upload and document management',
    widgets: [
      {
        type: 'upload-zone',
        title: 'Upload Files',
        gridArea: 'upload',
        dataSource: 'doc_upload'
      },
      {
        type: 'list',
        title: 'Recent Uploads',
        gridArea: 'recent',
        dataSource: 'doc_upload'
      },
      {
        type: 'queue',
        title: 'Upload Queue',
        gridArea: 'queue',
        dataSource: 'upload_queue'
      },
      {
        type: 'stats-group',
        title: 'Upload Statistics',
        gridArea: 'stats',
        dataSource: 'upload_stats'
      },
      {
        type: 'progress',
        title: 'Processing Status',
        gridArea: 'process',
        dataSource: 'upload_process'
      },
      {
        type: 'errors',
        title: 'Upload Errors',
        gridArea: 'errors',
        dataSource: 'upload_errors'
      }
    ]
  },

  update: {
    theme: 'update',
    title: 'Data Update Dashboard',
    description: 'Database updates and data maintenance',
    widgets: [
      {
        type: 'pending-list',
        title: 'Pending Updates',
        gridArea: 'pending',
        dataSource: 'update_queue'
      },
      {
        type: 'summary',
        title: 'Update Summary',
        gridArea: 'summary',
        dataSource: 'update_stats'
      },
      {
        type: 'form',
        title: 'Update Form',
        gridArea: 'form',
        dataSource: 'data_forms'
      },
      {
        type: 'preview',
        title: 'Data Preview',
        gridArea: 'preview',
        dataSource: 'data_preview'
      },
      {
        type: 'log',
        title: 'Update Log',
        gridArea: 'log',
        dataSource: 'update_history'
      },
      {
        type: 'stats-grid',
        title: 'Update Statistics',
        gridArea: 'stats',
        dataSource: 'update_metrics'
      }
    ]
  },

  'stock-management': {
    theme: 'stock-management',
    title: 'Stock Management Dashboard',
    description: 'Comprehensive stock control and analysis',
    widgets: [
      {
        type: 'overview',
        title: 'Stock Overview',
        gridArea: 'overview',
        dataSource: 'stock_level'
      },
      {
        type: 'alerts',
        title: 'Stock Alerts',
        gridArea: 'alerts',
        dataSource: 'stock_alerts'
      },
      {
        type: 'chart',
        title: 'Stock Distribution',
        gridArea: 'donut',
        dataSource: 'stock_level',
        chartType: 'donut'
      },
      {
        type: 'levels',
        title: 'Stock Levels by Product',
        gridArea: 'levels',
        dataSource: 'stock_level'
      },
      {
        type: 'table',
        title: 'Stock Transfers',
        gridArea: 'transfer',
        dataSource: 'record_transfer'
      },
      {
        type: 'chart',
        title: 'In/Out Movement',
        gridArea: 'inout',
        dataSource: 'stock_movement',
        chartType: 'bar'
      }
    ]
  },

  system: {
    theme: 'system',
    title: 'System Monitoring Dashboard',
    description: 'System health and performance monitoring',
    widgets: [
      {
        type: 'health',
        title: 'System Health',
        gridArea: 'health',
        dataSource: 'system_health'
      },
      {
        type: 'performance',
        title: 'Performance Metrics',
        gridArea: 'performance',
        dataSource: 'system_performance'
      },
      {
        type: 'chart',
        title: 'Resource Usage',
        gridArea: 'metrics',
        dataSource: 'system_metrics',
        chartType: 'area'
      },
      {
        type: 'table',
        title: 'Active Users',
        gridArea: 'users',
        dataSource: 'data_id'
      },
      {
        type: 'log',
        title: 'System Logs',
        gridArea: 'logs',
        dataSource: 'system_logs'
      },
      {
        type: 'jobs',
        title: 'Background Jobs',
        gridArea: 'jobs',
        dataSource: 'cron_jobs'
      }
    ]
  },

  analysis: {
    theme: 'analysis',
    title: 'Business Analysis Dashboard',
    description: 'Data analysis and business intelligence',
    widgets: [
      {
        type: 'kpi',
        title: 'Production KPI',
        gridArea: 'kpi1',
        dataSource: 'kpi_production',
        metrics: ['output', 'efficiency']
      },
      {
        type: 'kpi',
        title: 'Quality KPI',
        gridArea: 'kpi2',
        dataSource: 'kpi_quality',
        metrics: ['pass_rate', 'defects']
      },
      {
        type: 'kpi',
        title: 'Inventory KPI',
        gridArea: 'kpi3',
        dataSource: 'kpi_inventory',
        metrics: ['turnover', 'accuracy']
      },
      {
        type: 'kpi',
        title: 'Delivery KPI',
        gridArea: 'kpi4',
        dataSource: 'kpi_delivery',
        metrics: ['on_time', 'fulfillment']
      },
      {
        type: 'chart',
        title: 'Trend Analysis',
        gridArea: 'trend',
        dataSource: 'trend_data',
        chartType: 'line'
      },
      {
        type: 'chart',
        title: 'Product Mix',
        gridArea: 'pie',
        dataSource: 'product_mix',
        chartType: 'pie'
      },
      {
        type: 'comparison',
        title: 'Period Comparison',
        gridArea: 'comparison',
        dataSource: 'period_comparison'
      },
      {
        type: 'table',
        title: 'Detailed Analysis',
        gridArea: 'table',
        dataSource: 'analysis_details'
      }
    ]
  }
};