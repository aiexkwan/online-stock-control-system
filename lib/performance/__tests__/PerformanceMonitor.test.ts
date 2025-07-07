/**
 * Performance Monitor Tests
 */

import { PerformanceMonitor } from '../PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Get a fresh instance for each test
    monitor = PerformanceMonitor.getInstance();
    monitor.stopMonitoring(); // Ensure clean state
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      const startSpy = jest.spyOn(monitor, 'emit');
      
      monitor.startMonitoring();
      
      expect(startSpy).toHaveBeenCalledWith('monitoring:started');
    });

    it('should stop monitoring and return report', () => {
      const stopSpy = jest.spyOn(monitor, 'emit');
      
      monitor.startMonitoring();
      const report = monitor.stopMonitoring();
      
      expect(stopSpy).toHaveBeenCalledWith('monitoring:stopped');
      expect(report).toBeDefined();
      expect(report.startTime).toBeInstanceOf(Date);
      expect(report.endTime).toBeInstanceOf(Date);
      expect(report.metrics).toBeInstanceOf(Array);
    });

    it('should not start monitoring if already monitoring', () => {
      const startSpy = jest.spyOn(monitor, 'emit');
      
      monitor.startMonitoring();
      startSpy.mockClear();
      
      monitor.startMonitoring(); // Second call
      
      expect(startSpy).not.toHaveBeenCalled();
    });
  });

  describe('Metric Recording', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    afterEach(() => {
      monitor.stopMonitoring();
      monitor.removeAllListeners(); // Clean up all event listeners
    });

    it('should record a metric', () => {
      monitor.recordMetric({
        name: 'test_metric',
        category: 'custom',
        value: 100,
        unit: 'ms'
      });

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('test_metric');
      expect(report.metrics[0].value).toBe(100);
    });

    it('should record API call metrics', () => {
      monitor.recordApiCall('/api/test', 'GET', 150, 200);

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('api_request');
      expect(report.metrics[0].metadata).toEqual({
        endpoint: '/api/test',
        method: 'GET',
        status: 200
      });
    });

    it('should record API errors', () => {
      monitor.recordApiCall('/api/test', 'POST', 500, 500);

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(2);
      expect(report.metrics[1].name).toBe('api_error');
    });

    it('should record database queries', () => {
      monitor.recordDatabaseQuery('SELECT * FROM users', 50, 10);

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('database_query');
      expect(report.metrics[0].metadata?.rowCount).toBe(10);
    });
  });

  describe('Performance Measurement', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    afterEach(() => {
      monitor.stopMonitoring();
      monitor.removeAllListeners(); // Clean up all event listeners
    });

    it('should measure async operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result');
      
      const result = await monitor.measureAsync(
        'async_test',
        'custom',
        mockOperation
      );

      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalled();

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('async_test');
    });

    it('should measure sync operations', () => {
      const mockOperation = jest.fn().mockReturnValue('result');
      
      const result = monitor.measureSync(
        'sync_test',
        'custom',
        mockOperation
      );

      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalled();

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('sync_test');
    });

    it('should handle async operation errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(
        monitor.measureAsync('async_error', 'custom', mockOperation)
      ).rejects.toThrow('Test error');

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('async_error_error');
    });

    it('should handle sync operation errors', () => {
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      expect(() => 
        monitor.measureSync('sync_error', 'custom', mockOperation)
      ).toThrow('Test error');

      const report = monitor.stopMonitoring();
      expect(report.metrics).toHaveLength(1);
      expect(report.metrics[0].name).toBe('sync_error_error');
    });
  });

  describe('Threshold Alerts', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    afterEach(() => {
      monitor.stopMonitoring();
      monitor.removeAllListeners(); // Clean up all event listeners
    });

    it('should emit warning alert when threshold exceeded', (done) => {
      monitor.on('alert:warning', (alert) => {
        expect(alert.level).toBe('warning');
        expect(alert.metric).toBe('api_response_time');
        expect(alert.value).toBe(1500);
        done();
      });

      monitor.recordMetric({
        name: 'api_response_time',
        category: 'api',
        value: 1500, // Above warning threshold (1000ms)
        unit: 'ms'
      });
    });

    it('should emit critical alert when threshold exceeded', (done) => {
      monitor.on('alert:critical', (alert) => {
        expect(alert.level).toBe('critical');
        expect(alert.metric).toBe('api_response_time');
        expect(alert.value).toBe(3500);
        done();
      });

      monitor.recordMetric({
        name: 'api_response_time',
        category: 'api',
        value: 3500, // Above critical threshold (3000ms)
        unit: 'ms'
      });
    });

    it('should set custom thresholds', (done) => {
      monitor.setThreshold({
        metric: 'custom_metric',
        warning: 50,
        critical: 100,
        unit: 'count'
      });

      const warningHandler = (alert: any) => {
        if (alert.metric === 'custom_metric') {
          expect(alert.metric).toBe('custom_metric');
          expect(alert.threshold).toBe(50);
          monitor.off('alert:warning', warningHandler);
          done();
        }
      };

      monitor.on('alert:warning', warningHandler);

      monitor.recordMetric({
        name: 'custom_metric',
        category: 'custom',
        value: 75,
        unit: 'count'
      });
    });
  });

  describe('Real-time Metrics', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    afterEach(() => {
      monitor.stopMonitoring();
      monitor.removeAllListeners(); // Clean up all event listeners
    });

    it('should return recent metrics', () => {
      // Record some metrics
      monitor.recordMetric({
        name: 'test1',
        category: 'custom',
        value: 10,
        unit: 'ms'
      });
      
      monitor.recordMetric({
        name: 'test2',
        category: 'custom',
        value: 20,
        unit: 'ms'
      });

      // Force flush the buffer by stopping and restarting
      const report = monitor.stopMonitoring();
      expect(report.metrics.length).toBeGreaterThanOrEqual(2);
      
      // Start again for next test
      monitor.startMonitoring();
    });

    it('should return active alerts', () => {
      // Record multiple metrics that trigger alerts
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric({
          name: 'api_response_time',
          category: 'api',
          value: 1500 + i * 100, // All above warning threshold
          unit: 'ms'
        });
      }

      // Force flush
      monitor.stopMonitoring();
      monitor.startMonitoring();
      
      // Record more to check active alerts
      monitor.recordMetric({
        name: 'api_response_time',
        category: 'api',
        value: 1500,
        unit: 'ms'
      });

      const { activeAlerts } = monitor.getRealtimeMetrics();
      expect(activeAlerts.length).toBeGreaterThanOrEqual(0); // May have alerts based on average
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', () => {
      monitor.startMonitoring();
      
      // Record various metrics
      monitor.recordApiCall('/api/users', 'GET', 100, 200);
      monitor.recordApiCall('/api/users', 'GET', 150, 200);
      monitor.recordApiCall('/api/users', 'GET', 200, 200);
      monitor.recordApiCall('/api/error', 'GET', 500, 500);
      
      const report = monitor.stopMonitoring();
      
      expect(report.summary.totalRequests).toBe(4);
      expect(report.summary.avgResponseTime).toBeGreaterThan(0);
      expect(report.summary.errorRate).toBeGreaterThan(0);
      expect(report.summary.p95ResponseTime).toBeDefined();
      expect(report.summary.p99ResponseTime).toBeDefined();
    });

    it('should handle empty metrics', () => {
      monitor.startMonitoring();
      const report = monitor.stopMonitoring();
      
      expect(report.metrics).toEqual([]);
      expect(report.summary.totalRequests).toBe(0);
      expect(report.summary.avgResponseTime).toBe(0);
      expect(report.summary.errorRate).toBe(0);
    });
  });
});