/**
 * Performance Monitor Test Suite
 * 
 * Tests for the GraphQL performance monitoring and alerting system
 */

import { PerformanceMonitor, withPerformanceMonitoring } from '../performance-monitor';

describe('GraphQL Performance Monitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Create a fresh monitor instance for each test
    monitor = new PerformanceMonitor({
      maxExecutionTime: 200,
      maxComplexity: 100,
      minCacheHitRate: 0.7,
      maxErrorRate: 0.05
    });
  });

  afterEach(() => {
    // Clean up event listeners
    monitor.removeAllListeners();
  });

  describe('Metric Recording', () => {
    it('should record performance metrics', () => {
      monitor.recordMetric({
        queryName: 'getProduct',
        operationType: 'query',
        executionTime: 150,
        complexity: 50,
        cacheHit: true,
        errors: []
      });

      const metrics = monitor.exportMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].queryName).toBe('getProduct');
      expect(metrics[0].executionTime).toBe(150);
    });

    it('should emit metric events', (done) => {
      monitor.on('metric', (metric) => {
        expect(metric.queryName).toBe('testQuery');
        done();
      });

      monitor.recordMetric({
        queryName: 'testQuery',
        operationType: 'query',
        executionTime: 100,
        complexity: 30,
        cacheHit: false,
        errors: []
      });
    });
  });

  describe('Threshold Violations', () => {
    it('should generate alert for execution time violation', (done) => {
      monitor.on('alert', (alert) => {
        expect(alert.type).toBe('execution_time');
        expect(alert.severity).toBe('warning');
        expect(alert.message).toContain('exceeded execution time threshold');
        done();
      });

      monitor.recordMetric({
        queryName: 'slowQuery',
        operationType: 'query',
        executionTime: 250, // Exceeds 200ms threshold
        complexity: 50,
        cacheHit: false,
        errors: []
      });
    });

    it('should generate critical alert for severe violations', (done) => {
      monitor.on('alert', (alert) => {
        expect(alert.severity).toBe('critical');
        done();
      });

      monitor.recordMetric({
        queryName: 'verySlowQuery',
        operationType: 'query',
        executionTime: 500, // More than 2x threshold
        complexity: 50,
        cacheHit: false,
        errors: []
      });
    });

    it('should generate alert for complexity violation', (done) => {
      monitor.on('alert', (alert) => {
        expect(alert.type).toBe('complexity');
        expect(alert.message).toContain('exceeded complexity threshold');
        done();
      });

      monitor.recordMetric({
        queryName: 'complexQuery',
        operationType: 'query',
        executionTime: 100,
        complexity: 150, // Exceeds 100 threshold
        cacheHit: true,
        errors: []
      });
    });
  });

  describe('Aggregated Metrics', () => {
    beforeEach(() => {
      // Add multiple metrics
      const metrics = [
        { queryName: 'query1', executionTime: 100, cacheHit: true },
        { queryName: 'query1', executionTime: 150, cacheHit: true },
        { queryName: 'query2', executionTime: 200, cacheHit: false },
        { queryName: 'query2', executionTime: 250, cacheHit: false },
        { queryName: 'query3', executionTime: 50, cacheHit: true }
      ];

      metrics.forEach(m => {
        monitor.recordMetric({
          ...m,
          operationType: 'query',
          complexity: 50,
          errors: []
        });
      });
    });

    it('should calculate aggregated metrics correctly', () => {
      const aggregated = monitor.getAggregatedMetrics(60);
      
      expect(aggregated.totalQueries).toBe(5);
      expect(aggregated.avgExecutionTime).toBeCloseTo(150, 0);
      expect(aggregated.cacheHitRate).toBe(0.6); // 3/5
      expect(aggregated.errorRate).toBe(0);
    });

    it('should calculate percentiles correctly', () => {
      const aggregated = monitor.getAggregatedMetrics(60);
      
      // With 5 metrics, p95 should be the 5th value (250)
      expect(aggregated.p95ExecutionTime).toBe(250);
    });

    it('should identify top slow queries', () => {
      const aggregated = monitor.getAggregatedMetrics(60);
      
      expect(aggregated.topSlowQueries).toHaveLength(3);
      expect(aggregated.topSlowQueries[0].queryName).toBe('query2');
      expect(aggregated.topSlowQueries[0].avgTime).toBe(225);
    });

    it('should generate alert for low cache hit rate', () => {
      // Add more queries with low cache hit rate
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric({
          queryName: `query${i}`,
          operationType: 'query',
          executionTime: 100,
          complexity: 50,
          cacheHit: false, // All cache misses
          errors: []
        });
      }

      const alerts: any[] = [];
      monitor.on('alert', (alert) => {
        alerts.push(alert);
      });

      // Trigger aggregation check
      monitor.getAggregatedMetrics(60);
      
      const cacheAlert = alerts.find(a => a.type === 'cache_hit_rate');
      expect(cacheAlert).toBeDefined();
      expect(cacheAlert.message).toContain('Cache hit rate below threshold');
    });
  });

  describe('Alert Management', () => {
    it('should store and retrieve alerts', () => {
      // Generate some alerts
      monitor.recordMetric({
        queryName: 'slowQuery',
        operationType: 'query',
        executionTime: 300,
        complexity: 50,
        cacheHit: false,
        errors: []
      });

      const alerts = monitor.getRecentAlerts(10);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('execution_time');
    });

    it('should clear specific alerts', () => {
      // Generate an alert
      monitor.recordMetric({
        queryName: 'slowQuery',
        operationType: 'query',
        executionTime: 300,
        complexity: 50,
        cacheHit: false,
        errors: []
      });

      const alerts = monitor.getRecentAlerts(10);
      const alertId = alerts[0].id;
      
      monitor.clearAlert(alertId);
      
      const updatedAlerts = monitor.getRecentAlerts(10);
      expect(updatedAlerts.find(a => a.id === alertId)).toBeUndefined();
    });
  });

  describe('Performance Status', () => {
    it('should report healthy status', () => {
      // Add good metrics with high cache hit rate
      for (let i = 0; i < 20; i++) {
        monitor.recordMetric({
          queryName: 'goodQuery',
          operationType: 'query',
          executionTime: 50,
          complexity: 30,
          cacheHit: i < 16, // 80% cache hit rate
          errors: []
        });
      }

      const status = monitor.getStatus();
      expect(status.healthy).toBe(true);
      expect(status.activeAlerts).toBe(0);
      expect(status.criticalAlerts).toBe(0);
    });

    it('should report unhealthy status with critical alerts', () => {
      // Add bad metrics
      monitor.recordMetric({
        queryName: 'badQuery',
        operationType: 'query',
        executionTime: 500,
        complexity: 50,
        cacheHit: false,
        errors: ['Database error']
      });

      const status = monitor.getStatus();
      expect(status.healthy).toBe(false);
      expect(status.criticalAlerts).toBeGreaterThan(0);
    });
  });

  describe('Threshold Updates', () => {
    it('should update thresholds dynamically', () => {
      // Record some metrics first
      for (let i = 0; i < 20; i++) {
        monitor.recordMetric({
          queryName: 'normalQuery',
          operationType: 'query',
          executionTime: 150,
          complexity: 50,
          cacheHit: true,
          errors: []
        });
      }

      const alertsBefore: any[] = [];
      const alertsAfter: any[] = [];
      
      monitor.on('alert', (alert) => {
        alertsAfter.push(alert);
      });

      // Initially no alerts
      monitor.getAggregatedMetrics(60);
      expect(alertsAfter.length).toBe(0);

      // Update threshold to be more strict
      monitor.updateThresholds({
        maxExecutionTime: 100 // Now 150ms will violate
      });

      // After threshold update, should get alert from re-evaluation
      expect(alertsAfter.length).toBeGreaterThan(0);
    });
  });

  describe('withPerformanceMonitoring wrapper', () => {
    it('should monitor successful query execution', async () => {
      let metricRecorded = false;
      
      monitor.on('metric', (metric) => {
        expect(metric.queryName).toBe('testQuery');
        expect(metric.operationType).toBe('query');
        expect(metric.complexity).toBe(50);
        expect(metric.errors).toHaveLength(0);
        metricRecorded = true;
      });

      const result = await withPerformanceMonitoring(
        'testQuery',
        'query',
        50,
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { data: 'test' };
        },
        monitor
      );

      expect(result).toEqual({ data: 'test' });
      expect(metricRecorded).toBe(true);
    });

    it('should monitor failed query execution', async () => {
      let metricRecorded = false;
      
      monitor.on('metric', (metric) => {
        expect(metric.errors).toHaveLength(1);
        expect(metric.errors[0]).toBe('Test error');
        metricRecorded = true;
      });

      await expect(
        withPerformanceMonitoring(
          'failingQuery',
          'query',
          50,
          async () => {
            throw new Error('Test error');
          },
          monitor
        )
      ).rejects.toThrow('Test error');

      expect(metricRecorded).toBe(true);
    });
  });
});