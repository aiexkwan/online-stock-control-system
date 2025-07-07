/**
 * Hardware Monitoring Service
 * Monitors and tracks hardware device status and usage
 */

import { 
  DeviceStatus, 
  DeviceMetrics, 
  HardwareAlert, 
  AlertCallback, 
  AlertThresholds,
  Unsubscribe,
  HardwareEvent,
  HardwareEventType
} from '../types';
import { EventEmitter } from 'events';

interface UsageStats {
  totalUsage: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastUsed: string;
}

export class HardwareMonitoringService extends EventEmitter {
  private devices: Map<string, DeviceStatus> = new Map();
  private metrics: Map<string, DeviceMetrics> = new Map();
  private usageHistory: Map<string, HardwareEvent[]> = new Map();
  private alertThresholds: AlertThresholds = {
    errorRate: 10, // 10%
    responseTime: 5000, // 5 seconds
    queueSize: 50 // 50 jobs
  };
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    super();
  }

  // Start monitoring all registered devices
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
    
    // Perform initial check
    this.performHealthCheck();
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Register a device for monitoring
  registerDevice(device: DeviceStatus): void {
    this.devices.set(device.deviceId, device);
    this.metrics.set(device.deviceId, {
      usageCount: 0,
      errorCount: 0,
      successCount: 0,
      successRate: 100,
      averageResponseTime: 0
    });
    this.usageHistory.set(device.deviceId, []);
    
    this.emit('device.registered', device);
  }

  // Unregister a device
  unregisterDevice(deviceId: string): void {
    this.devices.delete(deviceId);
    this.metrics.delete(deviceId);
    this.usageHistory.delete(deviceId);
    
    this.emit('device.unregistered', { deviceId });
  }

  // Get device status
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    return this.devices.get(deviceId);
  }

  // Get all devices status
  getAllDevicesStatus(): Map<string, DeviceStatus> {
    return new Map(this.devices);
  }

  // Get usage statistics for a device
  getUsageStats(deviceId: string, period?: { start: Date; end: Date }): UsageStats | null {
    const history = this.usageHistory.get(deviceId);
    if (!history) return null;

    let relevantEvents = history;
    if (period) {
      relevantEvents = history.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= period.start && eventTime <= period.end;
      });
    }

    const metrics = this.calculateMetrics(relevantEvents);
    return {
      totalUsage: metrics.usageCount,
      successCount: metrics.successCount,
      errorCount: metrics.errorCount,
      averageResponseTime: metrics.averageResponseTime,
      lastUsed: relevantEvents[relevantEvents.length - 1]?.timestamp || 'Never'
    };
  }

  // Record a hardware event
  recordEvent(event: HardwareEvent): void {
    const history = this.usageHistory.get(event.deviceId);
    if (!history) return;

    // Add event to history
    history.push(event);
    
    // Keep only last 1000 events per device
    if (history.length > 1000) {
      history.shift();
    }

    // Update metrics
    this.updateMetrics(event.deviceId);
    
    // Check for alerts
    this.checkAlerts(event.deviceId);
    
    // Emit the event
    this.emit(event.type, event);
  }

  // Set alert thresholds
  setAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  // Subscribe to alerts
  onAlert(callback: AlertCallback): Unsubscribe {
    const listener = (alert: HardwareAlert) => callback(alert);
    this.on('alert', listener);
    return () => this.off('alert', listener);
  }

  // Private methods
  private performHealthCheck(): void {
    this.devices.forEach((device, deviceId) => {
      // Update device last seen
      device.lastSeen = new Date().toISOString();
      
      // Check device health based on last activity
      const lastEvent = this.getLastEvent(deviceId);
      if (lastEvent) {
        const timeSinceLastEvent = Date.now() - new Date(lastEvent.timestamp).getTime();
        
        // Mark as offline if no activity for 5 minutes
        if (timeSinceLastEvent > 300000) {
          if (device.status !== 'offline') {
            device.status = 'offline';
            this.emitAlert('warning', deviceId, 'Device appears to be offline');
          }
        }
      }
    });
  }

  private updateMetrics(deviceId: string): void {
    const history = this.usageHistory.get(deviceId);
    if (!history || history.length === 0) return;

    const metrics = this.calculateMetrics(history.slice(-100)); // Last 100 events
    this.metrics.set(deviceId, metrics);
    
    // Update device metrics
    const device = this.devices.get(deviceId);
    if (device) {
      device.metrics = metrics;
    }
  }

  private calculateMetrics(events: HardwareEvent[]): DeviceMetrics {
    const usageCount = events.length;
    const successCount = events.filter(e => 
      e.type === 'job.completed' || e.type === 'scan.success'
    ).length;
    const errorCount = events.filter(e => 
      e.type === 'job.failed' || e.type === 'scan.failed'
    ).length;
    
    const successRate = usageCount > 0 ? (successCount / usageCount) * 100 : 100;
    
    // Calculate average response time from job events
    const responseTimes: number[] = [];
    events.forEach((event, index) => {
      if (event.type === 'job.started' && index < events.length - 1) {
        const nextEvent = events[index + 1];
        if (nextEvent && (nextEvent.type === 'job.completed' || nextEvent.type === 'job.failed')) {
          const responseTime = new Date(nextEvent.timestamp).getTime() - 
                              new Date(event.timestamp).getTime();
          responseTimes.push(responseTime);
        }
      }
    });
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    return {
      usageCount,
      errorCount,
      successCount,
      successRate,
      averageResponseTime
    };
  }

  private checkAlerts(deviceId: string): void {
    const metrics = this.metrics.get(deviceId);
    if (!metrics) return;

    // Check error rate
    const errorRate = (metrics.errorCount / metrics.usageCount) * 100;
    if (errorRate > this.alertThresholds.errorRate) {
      this.emitAlert('error', deviceId, 
        `High error rate detected: ${errorRate.toFixed(1)}%`);
    }

    // Check response time
    if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
      this.emitAlert('warning', deviceId, 
        `Slow response time: ${(metrics.averageResponseTime / 1000).toFixed(1)}s`);
    }
  }

  private emitAlert(level: 'info' | 'warning' | 'error', deviceId: string, message: string): void {
    const alert: HardwareAlert = {
      level,
      deviceId,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.emit('alert', alert);
  }

  private getLastEvent(deviceId: string): HardwareEvent | null {
    const history = this.usageHistory.get(deviceId);
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }

  // Get monitoring dashboard data
  getDashboardData() {
    const devices = Array.from(this.devices.values());
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const errorDevices = devices.filter(d => d.status === 'error').length;
    
    const overallMetrics = {
      totalUsage: 0,
      totalErrors: 0,
      averageSuccessRate: 0
    };
    
    this.metrics.forEach(metric => {
      overallMetrics.totalUsage += metric.usageCount;
      overallMetrics.totalErrors += metric.errorCount;
      overallMetrics.averageSuccessRate += metric.successRate;
    });
    
    if (this.metrics.size > 0) {
      overallMetrics.averageSuccessRate /= this.metrics.size;
    }
    
    return {
      totalDevices,
      onlineDevices,
      errorDevices,
      overallMetrics,
      devices: devices.map(device => ({
        ...device,
        metrics: this.metrics.get(device.deviceId)
      }))
    };
  }
}