/**
 * React Hook for Hardware Services
 * Provides easy access to hardware functionality in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getHardwareAbstractionLayer } from '../hardware-abstraction-layer';
import { 
  PrintJob, 
  PrintResult, 
  ScanResult,
  DeviceStatus,
  HardwareAlert,
  QueueStatus
} from '../types';
import { toast } from 'sonner';

interface UseHardwareOptions {
  autoInitialize?: boolean;
  onAlert?: (alert: HardwareAlert) => void;
  onScan?: (result: ScanResult) => void;
}

interface UseHardwareReturn {
  // State
  initialized: boolean;
  isScanning: boolean;
  printers: DeviceStatus[];
  scanners: DeviceStatus[];
  queueStatus: QueueStatus | null;
  
  // Print methods
  print: (job: Omit<PrintJob, 'id'>) => Promise<PrintResult>;
  batchPrint: (jobs: Omit<PrintJob, 'id'>[]) => Promise<PrintResult[]>;
  cancelPrintJob: (jobId: string) => Promise<boolean>;
  
  // Scan methods  
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  
  // Monitoring methods
  getDeviceStatus: (deviceId: string) => DeviceStatus | undefined;
  getDashboardData: () => any;
  
  // Queue methods
  getQueueDetails: () => any[];
  clearPrintQueue: () => Promise<void>;
  retryFailedJobs: () => Promise<{ retried: number; successful: number }>;
}

export function useHardware(options: UseHardwareOptions = {}): UseHardwareReturn {
  const { 
    autoInitialize = true,
    onAlert,
    onScan
  } = options;

  const [initialized, setInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState<DeviceStatus[]>([]);
  const [scanners, setScanners] = useState<DeviceStatus[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  
  const halRef = useRef(getHardwareAbstractionLayer());
  const unsubscribesRef = useRef<Array<() => void>>([]);

  // Initialize HAL
  useEffect(() => {
    if (!autoInitialize) return;

    const initializeHAL = async () => {
      try {
        await halRef.current.initialize();
        setInitialized(true);
        
        // Get initial device list
        updateDeviceList();
        
        // Set up listeners
        setupListeners();
        
        toast.success('Hardware services initialized');
      } catch (error) {
        console.error('Failed to initialize hardware:', error);
        toast.error('Failed to initialize hardware services');
      }
    };

    initializeHAL();

    return () => {
      // Cleanup listeners
      unsubscribesRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribesRef.current = [];
      
      // Shutdown HAL
      halRef.current.shutdown();
    };
  }, [autoInitialize]);

  // Update device list
  const updateDeviceList = useCallback(() => {
    const devices = halRef.current.monitoring.getAllDevicesStatus();
    const printerDevices: DeviceStatus[] = [];
    const scannerDevices: DeviceStatus[] = [];
    
    devices.forEach(device => {
      if (device.deviceType === 'printer') {
        printerDevices.push(device);
      } else if (device.deviceType === 'scanner') {
        scannerDevices.push(device);
      }
    });
    
    setPrinters(printerDevices);
    setScanners(scannerDevices);
  }, []);

  // Set up event listeners
  const setupListeners = useCallback(() => {
    // Alert listener
    if (onAlert) {
      const unsubscribe = halRef.current.monitoring.onAlert(onAlert);
      unsubscribesRef.current.push(unsubscribe);
    }
    
    // Scan listener
    if (onScan) {
      const unsubscribe = halRef.current.scanner.onScan(onScan);
      unsubscribesRef.current.push(unsubscribe);
    }
    
    // Queue status listener
    halRef.current.queue.on('queue.updated', (status: QueueStatus) => {
      setQueueStatus(status);
    });
    
    // Device status listener
    halRef.current.monitoring.on('statusChange', () => {
      updateDeviceList();
    });
  }, [onAlert, onScan, updateDeviceList]);

  // Print a job
  const print = useCallback(async (job: Omit<PrintJob, 'id'>): Promise<PrintResult> => {
    if (!initialized) {
      throw new Error('Hardware not initialized');
    }
    
    try {
      const fullJob: PrintJob = {
        ...job,
        id: undefined // Let the service generate ID
      };
      
      const result = await halRef.current.print(fullJob);
      
      if (result.success) {
        toast.success('Print job completed successfully');
      } else {
        toast.error(`Print failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Print error: ${message}`);
      throw error;
    }
  }, [initialized]);

  // Batch print
  const batchPrint = useCallback(async (jobs: Omit<PrintJob, 'id'>[]): Promise<PrintResult[]> => {
    if (!initialized) {
      throw new Error('Hardware not initialized');
    }
    
    try {
      const fullJobs = jobs.map(job => ({ ...job, id: undefined })) as PrintJob[];
      const { results, failed } = await halRef.current.queue.processBatch(fullJobs);
      
      if (failed.length > 0) {
        toast.warning(`Batch print completed with ${failed.length} failures`);
      } else {
        toast.success('All print jobs completed successfully');
      }
      
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Batch print error: ${message}`);
      throw error;
    }
  }, [initialized]);

  // Cancel print job
  const cancelPrintJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!initialized) return false;
    
    const result = halRef.current.queue.removeFromQueue(jobId);
    if (result) {
      toast.info('Print job cancelled');
    }
    return result;
  }, [initialized]);

  // Start scanning
  const startScanning = useCallback(async (): Promise<void> => {
    if (!initialized) {
      throw new Error('Hardware not initialized');
    }
    
    try {
      await halRef.current.scanner.startScanning();
      setIsScanning(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Scanner error: ${message}`);
      throw error;
    }
  }, [initialized]);

  // Stop scanning
  const stopScanning = useCallback(async (): Promise<void> => {
    if (!initialized) return;
    
    await halRef.current.scanner.stopScanning();
    setIsScanning(false);
  }, [initialized]);

  // Get device status
  const getDeviceStatus = useCallback((deviceId: string): DeviceStatus | undefined => {
    if (!initialized) return undefined;
    return halRef.current.monitoring.getDeviceStatus(deviceId);
  }, [initialized]);

  // Get dashboard data
  const getDashboardData = useCallback(() => {
    if (!initialized) return null;
    return halRef.current.monitoring.getDashboardData();
  }, [initialized]);

  // Get queue details
  const getQueueDetails = useCallback(() => {
    if (!initialized) return [];
    return halRef.current.queue.getQueueDetails();
  }, [initialized]);

  // Clear print queue
  const clearPrintQueue = useCallback(async (): Promise<void> => {
    if (!initialized) return;
    
    await halRef.current.queue.clearQueue();
    toast.info('Print queue cleared');
  }, [initialized]);

  // Retry failed jobs
  const retryFailedJobs = useCallback(async (): Promise<{ retried: number; successful: number }> => {
    if (!initialized) {
      return { retried: 0, successful: 0 };
    }
    
    const result = await halRef.current.queue.retryFailedJobs();
    
    if (result.retried > 0) {
      toast.info(`Retrying ${result.retried} failed jobs`);
    }
    
    return result;
  }, [initialized]);

  return {
    // State
    initialized,
    isScanning,
    printers,
    scanners,
    queueStatus,
    
    // Print methods
    print,
    batchPrint,
    cancelPrintJob,
    
    // Scan methods
    startScanning,
    stopScanning,
    
    // Monitoring methods
    getDeviceStatus,
    getDashboardData,
    
    // Queue methods
    getQueueDetails,
    clearPrintQueue,
    retryFailedJobs
  };
}