/**
 * Hardware Simulator for Testing
 * Provides mock implementations of hardware services for testing purposes
 */

import { EventEmitter } from 'events';
import { 
  PrintJob, 
  PrintResult, 
  ScanResult, 
  DeviceStatus,
  PrinterStatus,
  ScannerStatus 
} from '../types';

export class HardwareSimulator extends EventEmitter {
  private printQueue: PrintJob[] = [];
  private deviceStatuses: Map<string, DeviceStatus> = new Map();
  private simulateFailures = false;
  private simulateDelays = true;
  private printDelay = 1000; // 1 second
  private scanDelay = 500; // 0.5 seconds

  constructor() {
    super();
    this.initializeDevices();
  }

  private initializeDevices() {
    // Mock printer
    this.deviceStatuses.set('printer-mock', {
      deviceId: 'printer-mock',
      deviceType: 'printer',
      status: 'online',
      lastSeen: new Date().toISOString()
    });

    // Mock scanner
    this.deviceStatuses.set('scanner-mock', {
      deviceId: 'scanner-mock',
      deviceType: 'scanner',
      status: 'online',
      lastSeen: new Date().toISOString()
    });
  }

  // Configuration methods
  setSimulateFailures(enabled: boolean) {
    this.simulateFailures = enabled;
  }

  setSimulateDelays(enabled: boolean) {
    this.simulateDelays = enabled;
  }

  setPrintDelay(ms: number) {
    this.printDelay = ms;
  }

  setScanDelay(ms: number) {
    this.scanDelay = ms;
  }

  // Printer simulation
  async simulatePrint(job: PrintJob): Promise<PrintResult> {
    if (this.simulateDelays) {
      await this.delay(this.printDelay);
    }

    if (this.simulateFailures && Math.random() < 0.1) {
      // 10% chance of failure
      return {
        success: false,
        jobId: job.id!,
        error: 'Simulated print failure: Paper jam'
      };
    }

    // Simulate successful print
    console.log(`[Simulator] Printing ${job.type} - ${job.data.fileName || 'document'}`);
    
    return {
      success: true,
      jobId: job.id!,
      pdfUrl: 'blob:mock-pdf-url',
      printedAt: new Date().toISOString(),
      message: 'Print simulated successfully'
    };
  }

  // Scanner simulation
  async simulateScan(): Promise<ScanResult> {
    if (this.simulateDelays) {
      await this.delay(this.scanDelay);
    }

    if (this.simulateFailures && Math.random() < 0.05) {
      // 5% chance of failure
      throw new Error('Simulated scan failure: Unable to decode');
    }

    // Generate mock scan data
    const mockData = this.generateMockScanData();
    
    return {
      data: mockData,
      format: 'qr',
      timestamp: new Date().toISOString(),
      confidence: 0.95
    };
  }

  // Device status simulation
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    return this.deviceStatuses.get(deviceId);
  }

  getAllDevices(): DeviceStatus[] {
    return Array.from(this.deviceStatuses.values());
  }

  // Simulate device events
  simulateDeviceOffline(deviceId: string) {
    const device = this.deviceStatuses.get(deviceId);
    if (device) {
      device.status = 'offline';
      this.emit('device.disconnected', { deviceId, timestamp: new Date().toISOString() });
    }
  }

  simulateDeviceOnline(deviceId: string) {
    const device = this.deviceStatuses.get(deviceId);
    if (device) {
      device.status = 'online';
      this.emit('device.connected', { deviceId, timestamp: new Date().toISOString() });
    }
  }

  // Queue simulation
  addToQueue(job: PrintJob) {
    this.printQueue.push(job);
    this.emit('queue.updated', { pending: this.printQueue.length });
  }

  getQueueLength(): number {
    return this.printQueue.length;
  }

  clearQueue() {
    this.printQueue = [];
    this.emit('queue.cleared');
  }

  // Helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockScanData(): string {
    const types = ['pallet', 'product', 'location'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch (type) {
      case 'pallet':
        return `PAL${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
      case 'product':
        return `PRD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
      case 'location':
        return `LOC-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 100)}`;
      default:
        return 'MOCK-SCAN-DATA';
    }
  }

  // Test scenarios
  async runTestScenario(scenario: 'success' | 'failure' | 'mixed') {
    console.log(`[Simulator] Running test scenario: ${scenario}`);
    
    switch (scenario) {
      case 'success':
        this.setSimulateFailures(false);
        break;
      case 'failure':
        this.setSimulateFailures(true);
        break;
      case 'mixed':
        // Randomly switch between success and failure
        setInterval(() => {
          this.setSimulateFailures(Math.random() < 0.3);
        }, 5000);
        break;
    }
  }
}

// Export singleton instance
export const hardwareSimulator = new HardwareSimulator();