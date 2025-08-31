/**
 * Hardware Abstraction Layer (HAL)
 * Central interface for all hardware operations
 */

// Simple logger replacement to avoid complex dependencies
const createLogger = (name: string) => ({
  info: (message: string, data?: unknown) => console.info(`[${name}] ${message}`, data),
  error: (data: { err?: unknown }, message: string) =>
    console.error(`[${name}] ${message}`, data.err),
  debug: (data: unknown, message: string) => console.debug(`[${name}] ${message}`, data),
});
import { DefaultPrinterService, PrinterService } from './services/printer-service';
import { HardwareMonitoringService } from './services/monitoring-service';
import { PrintQueueManager } from './services/print-queue-manager';
import { DeviceStatus, HealthStatus, HardwareEvent, PrintJob, PrintResult } from './types';

const logger = createLogger('hardware');

export interface HardwareServices {
  printer: PrinterService;
  monitoring: HardwareMonitoringService;
  queue: PrintQueueManager;
}

export class HardwareAbstractionLayer {
  private services: HardwareServices;
  private initialized = false;

  constructor() {
    // Initialize all services
    this.services = {
      printer: new DefaultPrinterService(),
      monitoring: new HardwareMonitoringService(),
      queue: new PrintQueueManager(),
    };
  }

  /**
   * Initialize the hardware abstraction layer
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('Starting Hardware Abstraction Layer initialization...');

      // Check if running in browser environment
      if (typeof window === 'undefined') {
        throw new Error('HAL requires browser environment');
      }

      // Register devices with monitoring service
      await this.registerDevices();

      // Set up event listeners
      this.setupEventListeners();

      // Start monitoring
      this.services.monitoring.startMonitoring();

      this.initialized = true;

      logger.info('Hardware Abstraction Layer initialized successfully');
    } catch (error: unknown) {
      logger.error({ err: error }, 'Failed to initialize Hardware Abstraction Layer');
      throw error;
    }
  }

  /**
   * Check if HAL is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get printer service
   */
  get printer(): PrinterService {
    this.ensureInitialized();
    return this.services.printer;
  }

  /**
   * Get monitoring service
   */
  get monitoring(): HardwareMonitoringService {
    this.ensureInitialized();
    return this.services.monitoring;
  }

  /**
   * Get print queue manager
   */
  get queue(): PrintQueueManager {
    this.ensureInitialized();
    return this.services.queue;
  }

  /**
   * Perform health check on all devices
   */
  async healthCheck(): Promise<HealthStatus> {
    this.ensureInitialized();

    const devices = this.services.monitoring.getAllDevicesStatus();
    const errors: string[] = [];
    let healthy = true;

    // Check each device
    devices.forEach((device: DeviceStatus, deviceId: string) => {
      if (device.status === 'error' || device.status === 'offline') {
        healthy = false;
        errors.push(`Device ${deviceId} is ${device.status}`);
      }
    });

    return {
      healthy,
      devices,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Attempt to recover a device
   */
  async recover(deviceType: 'printer'): Promise<void> {
    this.ensureInitialized();

    try {
      switch (deviceType) {
        case 'printer':
          // Clear print queue
          await this.services.queue.clearQueue();

          // Re-initialize printer service
          const printers = await this.services.printer.listPrinters();
          if (printers.length > 0) {
            await this.services.printer.selectPrinter(printers[0].id);
          }
          break;
      }

      logger.info(`Device recovery completed successfully for ${deviceType}`);
    } catch (error: unknown) {
      logger.error({ err: error }, 'Device recovery failed');
      throw error;
    }
  }

  /**
   * Print with monitoring
   */
  async print(job: PrintJob): Promise<PrintResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const deviceId = 'printer-default';

    // Record start event
    this.recordEvent({
      type: 'job.started',
      deviceId,
      timestamp: new Date().toISOString(),
      data: { jobType: job.type },
    });

    try {
      // Use queue manager for better control
      const jobId = await this.services.queue.addToQueue(job);
      const result = await this.services.queue.processNext();

      if (!result) {
        throw new Error('Failed to process print job');
      }

      // Record completion event
      this.recordEvent({
        type: 'job.completed',
        deviceId,
        timestamp: new Date().toISOString(),
        data: {
          jobType: job.type,
          duration: Date.now() - startTime,
        },
      });

      return result;
    } catch (error: unknown) {
      // Record failure event
      this.recordEvent({
        type: 'job.failed',
        deviceId,
        timestamp: new Date().toISOString(),
        data: {
          jobType: job.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Shutdown the HAL
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      // Stop monitoring
      this.services.monitoring.stopMonitoring();

      // Clear print queue
      await this.services.queue.clearQueue();

      this.initialized = false;

      logger.info('Hardware Abstraction Layer shut down successfully');
    } catch (error: unknown) {
      logger.error({ err: error }, 'Error during HAL shutdown');
    }
  }

  // Private methods
  private async registerDevices(): Promise<void> {
    try {
      // Register printer
      const printers = await this.services.printer.listPrinters();
      printers.forEach(printer => {
        const device: DeviceStatus = {
          deviceId: `printer-${printer.id}`,
          deviceType: 'printer',
          status: printer.isOnline ? 'online' : 'offline',
          lastSeen: new Date().toISOString(),
        };
        this.services.monitoring.registerDevice(device);
      });

      logger.debug({ printerCount: printers.length }, 'Registered hardware devices');
    } catch (error: unknown) {
      logger.error({ err: error }, 'Failed to register devices');
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Monitor printer status changes
    this.services.printer.onStatusChange(printerStatus => {
      const device = this.services.monitoring.getDeviceStatus(`printer-${printerStatus.id}`);
      if (device) {
        device.status = printerStatus.isOnline ? 'online' : 'offline';
      }
    });

    // Monitor queue events
    this.services.queue.on('job.added', (job: PrintJob) => {
      logger.debug({ jobId: job.id, jobType: job.type }, 'Print job added to queue');
    });

    this.services.queue.on('job.completed', (job: PrintJob) => {
      logger.info('Print job completed successfully', { jobId: job.id, jobType: job.type });
    });

    this.services.queue.on('job.failed', (job: PrintJob, error: unknown) => {
      logger.error({ err: error }, 'Print job failed');
    });
  }

  private recordEvent(event: HardwareEvent): void {
    this.services.monitoring.recordEvent(event);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Hardware Abstraction Layer not initialized. Call initialize() first.');
    }
  }
}

// Singleton instance
let halInstance: HardwareAbstractionLayer | null = null;

/**
 * Get or create HAL instance
 */
export function getHardwareAbstractionLayer(): HardwareAbstractionLayer {
  if (!halInstance) {
    halInstance = new HardwareAbstractionLayer();
  }
  return halInstance;
}
