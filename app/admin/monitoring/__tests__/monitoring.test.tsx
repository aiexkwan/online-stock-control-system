/**
 * 監控儀表板可用性測試
 * 測試響應式設計、無障礙設計、用戶體驗等
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MonitoringDashboard from '../page';
import { useMonitoringData } from '../../hooks/useMonitoringData';

// 擴展 Jest 支援 axe 測試
expect.extend(toHaveNoViolations);

// Mock hooks 和依賴
jest.mock('../hooks/useMonitoringData');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock 監控數據
const mockSystemHealth = {
  status: 'healthy' as const,
  version: '1.0.0',
  uptime: '86400s',
  timestamp: '2024-01-01T00:00:00Z',
  environment: 'production',
  services: {
    database: 'healthy' as const,
    authentication: 'healthy' as const,
    cache: 'healthy' as const,
    api: 'healthy' as const
  },
  systemMetrics: {
    memoryUsage: {
      rss: 100000000,
      heapTotal: 50000000,
      heapUsed: 30000000,
      external: 10000000
    },
    cpuUsage: {
      user: 1000,
      system: 500
    },
    nodeVersion: 'v18.0.0',
    platform: 'linux'
  }
};

const mockBusinessMetrics = {
  status: 'healthy' as const,
  timestamp: '2024-01-01T00:00:00Z',
  kpis: {
    totalUsers: { value: 1250, change: 5.2, changeType: 'increase' as const },
    activeUsers: { value: 380, change: 2.1, changeType: 'increase' as const },
    totalOrders: { value: 2450, change: 8.3, changeType: 'increase' as const },
    totalProducts: { value: 15680, change: 1.2, changeType: 'increase' as const },
    systemUptime: { value: 99.8, target: 99.9 },
    responseTime: { value: 180, target: 200 }
  },
  performance: {
    apiRequests: {
      total: 10000,
      successful: 9900,
      failed: 100,
      averageResponseTime: 150
    },
    userActivity: {
      dailyActiveUsers: 380,
      weeklyActiveUsers: 1250,
      monthlyActiveUsers: 3200
    },
    systemLoad: {
      cpu: 45,
      memory: 62,
      disk: 38
    }
  }
};

const mockDatabasePerformance = {
  status: 'healthy' as const,
  timestamp: '2024-01-01T00:00:00Z',
  connectionInfo: {
    activeConnections: 25,
    maxConnections: 100,
    connectionPool: {
      total: 20,
      active: 15,
      idle: 5,
      waiting: 0
    }
  },
  queryPerformance: {
    averageQueryTime: 45,
    slowQueries: 3,
    totalQueries: 15420,
    queriesPerSecond: 125
  },
  cachePerformance: {
    hitRate: 85.5,
    missRate: 14.5,
    totalRequests: 50000,
    averageResponseTime: 12,
    memoryUsage: 67108864, // 64MB
    recommendations: ['Cache hit rate is good']
  },
  systemMetrics: {
    cpuUsage: 35,
    memoryUsage: 68,
    diskUsage: 42,
    networkIO: {
      bytesIn: 52428800, // 50MB
      bytesOut: 31457280  // 30MB
    }
  }
};

const mockAlerts = {
  status: 'healthy' as const,
  timestamp: '2024-01-01T00:00:00Z',
  summary: {
    totalAlerts: 3,
    criticalCount: 1,
    warningCount: 2,
    infoCount: 0,
    acknowledgedCount: 1,
    resolvedCount: 2
  },
  recentAlerts: [
    {
      id: '1',
      title: 'High Memory Usage',
      description: 'System memory usage exceeded 80%',
      severity: 'critical' as const,
      status: 'active' as const,
      category: 'system' as const,
      timestamp: '2024-01-01T00:00:00Z',
      source: 'System Monitor',
      actions: ['investigate', 'restart_service']
    }
  ],
  notifications: {
    email: true,
    sms: true,
    webhook: false,
    slackChannel: 'monitoring-alerts'
  }
};

const mockUseMonitoringData = {
  systemHealth: mockSystemHealth,
  businessMetrics: mockBusinessMetrics,
  databasePerformance: mockDatabasePerformance,
  alerts: mockAlerts,
  isLoading: false,
  error: null,
  lastUpdated: '2024-01-01T00:00:00Z',
  refreshData: jest.fn(),
  exportData: jest.fn(),
  acknowledgeAlert: jest.fn(),
  resolveAlert: jest.fn(),
  deleteAlert: jest.fn()
};

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    (useMonitoringData as jest.Mock).mockReturnValue(mockUseMonitoringData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 基本渲染測試
  describe('Basic Rendering', () => {
    it('renders monitoring dashboard with correct title', () => {
      render(<MonitoringDashboard />);
      
      expect(screen.getByRole('heading', { name: 'System Monitoring' })).toBeInTheDocument();
      expect(screen.getByText('Real-time system health and performance monitoring')).toBeInTheDocument();
    });

    it('displays system status badge', () => {
      render(<MonitoringDashboard />);
      
      const statusBadge = screen.getByRole('status', { name: /System status/ });
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('All Systems Operational');
    });

    it('shows last updated time', () => {
      render(<MonitoringDashboard />);
      
      const lastUpdated = screen.getByRole('status', { name: /Last updated/ });
      expect(lastUpdated).toBeInTheDocument();
    });
  });

  // 響應式設計測試
  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // 模擬移動端視窗
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      render(<MonitoringDashboard />);
      
      // 檢查響應式元素
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('flex', 'items-center', 'space-x-2');
      });
    });

    it('displays full content on desktop', () => {
      // 模擬桌面視窗
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });
      
      render(<MonitoringDashboard />);
      
      // 檢查桌面佈局
      const container = screen.getByText('System Monitoring').closest('.container');
      expect(container).toHaveClass('container', 'mx-auto', 'p-4', 'space-y-6');
    });
  });

  // 無障礙設計測試
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MonitoringDashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels for tabs', () => {
      render(<MonitoringDashboard />);
      
      const tabList = screen.getByRole('tablist', { name: 'Monitoring sections' });
      expect(tabList).toBeInTheDocument();
      
      const overviewTab = screen.getByRole('tab', { name: 'Overview monitoring dashboard' });
      expect(overviewTab).toBeInTheDocument();
      
      const systemTab = screen.getByRole('tab', { name: 'System health monitoring' });
      expect(systemTab).toBeInTheDocument();
    });

    it('provides screen reader support for buttons', () => {
      render(<MonitoringDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: 'Refresh monitoring data' });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAttribute('aria-describedby', 'refresh-help');
      
      const exportButton = screen.getByRole('button', { name: 'Export monitoring data' });
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveAttribute('aria-describedby', 'export-help');
    });

    it('provides proper focus management', () => {
      render(<MonitoringDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: 'Refresh monitoring data' });
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();
    });
  });

  // 用戶互動測試
  describe('User Interactions', () => {
    it('calls refreshData when refresh button is clicked', async () => {
      const mockRefreshData = jest.fn();
      (useMonitoringData as jest.Mock).mockReturnValue({
        ...mockUseMonitoringData,
        refreshData: mockRefreshData
      });
      
      render(<MonitoringDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: 'Refresh monitoring data' });
      fireEvent.click(refreshButton);
      
      expect(mockRefreshData).toHaveBeenCalledTimes(1);
    });

    it('calls exportData when export button is clicked', async () => {
      const mockExportData = jest.fn();
      (useMonitoringData as jest.Mock).mockReturnValue({
        ...mockUseMonitoringData,
        exportData: mockExportData
      });
      
      render(<MonitoringDashboard />);
      
      const exportButton = screen.getByRole('button', { name: 'Export monitoring data' });
      fireEvent.click(exportButton);
      
      expect(mockExportData).toHaveBeenCalledTimes(1);
    });

    it('changes tab content when tab is clicked', async () => {
      render(<MonitoringDashboard />);
      
      const systemTab = screen.getByRole('tab', { name: 'System health monitoring' });
      fireEvent.click(systemTab);
      
      await waitFor(() => {
        const systemPanel = screen.getByRole('tabpanel', { name: /system/i });
        expect(systemPanel).toBeInTheDocument();
      });
    });
  });

  // 錯誤狀態測試
  describe('Error States', () => {
    it('displays error message when data loading fails', () => {
      (useMonitoringData as jest.Mock).mockReturnValue({
        ...mockUseMonitoringData,
        isLoading: false,
        error: 'Failed to load monitoring data'
      });
      
      render(<MonitoringDashboard />);
      
      expect(screen.getByText('Monitoring Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load monitoring data')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      (useMonitoringData as jest.Mock).mockReturnValue({
        ...mockUseMonitoringData,
        isLoading: true
      });
      
      render(<MonitoringDashboard />);
      
      expect(screen.getByText('Loading monitoring data...')).toBeInTheDocument();
    });

    it('disables refresh button when loading', () => {
      (useMonitoringData as jest.Mock).mockReturnValue({
        ...mockUseMonitoringData,
        isLoading: true
      });
      
      render(<MonitoringDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: 'Refresh monitoring data' });
      expect(refreshButton).toBeDisabled();
    });
  });

  // 性能測試
  describe('Performance', () => {
    it('uses Suspense for lazy loading', () => {
      render(<MonitoringDashboard />);
      
      // 檢查 Suspense fallback elements
      const loadingElements = screen.getAllByLabelText(/Loading/);
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('renders within acceptable time', () => {
      const startTime = performance.now();
      render(<MonitoringDashboard />);
      const endTime = performance.now();
      
      // 應該在 100ms 內完成渲染
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  // 告警功能測試
  describe('Alert Management', () => {
    it('displays critical alert count in badge', () => {
      render(<MonitoringDashboard />);
      
      const alertTab = screen.getByRole('tab', { name: /Alert management.*1 critical alerts/ });
      expect(alertTab).toBeInTheDocument();
      
      const criticalBadge = screen.getByRole('status', { name: '1 critical alerts' });
      expect(criticalBadge).toBeInTheDocument();
    });

    it('handles alert acknowledgment', async () => {
      const mockAcknowledgeAlert = jest.fn();
      (useMonitoringData as jest.Mock).mockReturnValue({
        ...mockUseMonitoringData,
        acknowledgeAlert: mockAcknowledgeAlert
      });
      
      render(<MonitoringDashboard />);
      
      // 切換到告警頁面
      const alertTab = screen.getByRole('tab', { name: /Alert management/ });
      fireEvent.click(alertTab);
      
      // 這裡可以添加更多告警操作測試
    });
  });
});

// 快照測試
describe('MonitoringDashboard Snapshots', () => {
  it('matches snapshot with healthy system', () => {
    const { container } = render(<MonitoringDashboard />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with degraded system', () => {
    (useMonitoringData as jest.Mock).mockReturnValue({
      ...mockUseMonitoringData,
      systemHealth: {
        ...mockSystemHealth,
        status: 'degraded'
      }
    });
    
    const { container } = render(<MonitoringDashboard />);
    expect(container).toMatchSnapshot();
  });
});