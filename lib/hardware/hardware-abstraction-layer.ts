/**
 * Hardware Abstraction Layer (HAL)
 * Central interface for all hardware operations
 */

import { DefaultPrinterService, PrinterService } from './services/printer-service';
import { HardwareMonitoringService } from './services/monitoring-service';
import { PrintQueueManager } from './services/print-queue-manager';
import { 
  DeviceStatus, 
  HealthStatus, 
  HardwareEvent,
  PrintJob,
  PrintResult
} from './types';

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
      queue: new PrintQueueManager()
    };
  }

  /**
   * Initialize the hardware abstraction layer
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[HAL] Starting initialization...');
      
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
      
      console.log('[HAL] Hardware Abstraction Layer initialized successfully');
    } catch (error) {
      console.error('[HAL] Failed to initialize:', error);
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
    devices.forEach((device, deviceId) => {
      if (device.status === 'error' || device.status === 'offline') {
        healthy = false;
        errors.push(`Device ${deviceId} is ${device.status}`);
      }
    });

    return {
      healthy,
      devices,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
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
      
      console.log(`Recovery completed for ${deviceType}`);
    } catch (error) {
      console.error(`Recovery failed for ${deviceType}:`, error);
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
      data: { jobType: job.type }
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
          duration: Date.now() - startTime
        }
      });
      
      return result;
    } catch (error) {
      // Record failure event
      this.recordEvent({
        type: 'job.failed',
        deviceId,
        timestamp: new Date().toISOString(),
        data: { 
          jobType: job.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
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
      
      // Stop scanning if active
      if (this.services.scanner.isScanning()) {
        await this.services.scanner.stopScanning();
      }
      
      // Clear print queue
      await this.services.queue.clearQueue();
      
      this.initialized = false;
      
      console.log('Hardware Abstraction Layer shut down successfully');
    } catch (error) {
      console.error('Error during HAL shutdown:', error);
    }
  }

  // Private methods
  private async registerDevices(): Promise<void> {
    // Register printer
    const printers = await this.services.printer.listPrinters();
    printers.forEach(printer => {
      const device: DeviceStatus = {
        deviceId: `printer-${printer.id}`,
        deviceType: 'printer',
        status: printer.isOnline ? 'online' : 'offline',
        lastSeen: new Date().toISOString()
      };
      this.services.monitoring.registerDevice(device);
    });

  }

  private setupEventListeners(): void {
    // Monitor printer status changes
    this.services.printer.onStatusChange((status) => {
      const device = this.services.monitoring.getDeviceStatus(`printer-${status.id}`);
      if (device) {
        device.status = status.isOnline ? 'online' : 'offline';
      }
    });

    // Monitor queue events
    this.services.queue.on('job.added', (job) => {
      console.log('Print job added to queue:', job.id);
    });

    this.services.queue.on('job.completed', (job) => {
      console.log('Print job completed:', job.id);
    });

    this.services.queue.on('job.failed', (job, error) => {
      console.error('Print job failed:', job.id, error);
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