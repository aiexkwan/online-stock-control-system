/**
 * Unified Hardware Service Types
 * Based on existing print-label and print-grnlabel implementations
 */

// Print Job Types based on existing implementations
export type PrintJobType = 'qc-label' | 'grn-label' | 'report' | 'document';

export interface PrintJob {
  id?: string;
  type: PrintJobType;
  data: any; // Will be specific to each job type
  copies: number;
  priority: 'high' | 'normal' | 'low';
  metadata?: {
    operatorClockNum?: string;
    timestamp?: string;
    source?: string;
    [key: string]: any;
  };
}

export interface PrintResult {
  success: boolean;
  jobId: string;
  message?: string;
  error?: string;
  pdfUrl?: string;
  printedAt?: string;
}

export interface PrinterStatus {
  id: string;
  name: string;
  isOnline: boolean;
  isDefault: boolean;
  jobsInQueue: number;
  lastError?: string;
  capabilities?: PrinterCapabilities;
}

export interface PrinterCapabilities {
  supportedFormats: string[];
  maxCopies: number;
  supportsDuplex: boolean;
  supportsColor: boolean;
}

// Scanner Types based on SimpleQRScanner implementation
export type ScanMode = 'single' | 'continuous' | 'batch';

export interface ScanResult {
  data: string;
  format: 'qr' | 'barcode' | 'datamatrix';
  timestamp: string;
  confidence?: number;
}

export interface ScannerStatus {
  id: string;
  name: string;
  isActive: boolean;
  isScanning: boolean;
  lastScan?: string;
  error?: string;
}

// Hardware Monitoring Types
export interface DeviceStatus {
  deviceId: string;
  deviceType: 'printer' | 'scanner' | 'scale' | 'other';
  status: 'online' | 'offline' | 'error' | 'busy';
  lastSeen: string;
  metrics?: DeviceMetrics;
}

export interface DeviceMetrics {
  usageCount: number;
  errorCount: number;
  successCount: number;
  successRate: number;
  averageResponseTime: number;
}

export interface HealthStatus {
  healthy: boolean;
  devices: Map<string, DeviceStatus>;
  timestamp: string;
  errors?: string[];
}

// Queue Management Types
export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

// Event Types
export type HardwareEventType =
  | 'device.connected'
  | 'device.disconnected'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'scan.success'
  | 'scan.failed';

export interface HardwareEvent {
  type: HardwareEventType;
  deviceId: string;
  timestamp: string;
  data?: any;
}

// Callback Types
export type StatusCallback = (status: DeviceStatus) => void;
export type PrinterStatusCallback = (status: PrinterStatus) => void;
export type ScanCallback = (result: ScanResult) => void;
export type AlertCallback = (alert: HardwareAlert) => void;
export type Unsubscribe = () => void;

export interface HardwareAlert {
  level: 'info' | 'warning' | 'error';
  deviceId: string;
  message: string;
  timestamp: string;
  code?: string;
}

// Alert Thresholds
export interface AlertThresholds {
  errorRate: number; // Percentage
  responseTime: number; // Milliseconds
  queueSize: number; // Number of jobs
}
