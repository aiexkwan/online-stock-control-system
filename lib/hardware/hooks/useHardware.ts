/**
 * React Hook for Hardware Services
 * Provides easy access to hardware functionality in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getHardwareAbstractionLayer } from '../hardware-abstraction-layer';
import {
  PrintJob,
  PrintResult,
  ScanResult,
  DeviceStatus,
  DeviceMetrics,
  HardwareAlert,
  QueueStatus,
} from '../types';

// Simple logger for hardware hook
const logger = {
  info: (message: string, data?: any) => console.info(`[hardware-hook] ${message}`, data),
  error: (data: { err?: any }, message: string) =>
    console.error(`[hardware-hook] ${message}`, data.err),
  debug: (data: any, message: string) => console.debug(`[hardware-hook] ${message}`, data),
};

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
  getDashboardData: () => {
    totalDevices: number;
    onlineDevices: number;
    errorDevices: number;
    overallMetrics: {
      totalUsage: number;
      totalErrors: number;
      averageSuccessRate: number;
    };
    devices: Array<DeviceStatus & { metrics?: DeviceMetrics }>;
  } | null;

  // Queue methods
  getQueueDetails: () => Array<{
    jobId: string | undefined;
    type: PrintJob['type'];
    priority: PrintJob['priority'];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    addedAt: string;
    attempts: number;
    error?: string;
  }>;
  clearPrintQueue: () => Promise<void>;
  retryFailedJobs: () => Promise<{ retried: number; successful: number }>;
}

export function useHardware(options: UseHardwareOptions = {}): UseHardwareReturn {
  const { autoInitialize = true, onAlert, onScan } = options;

  const [initialized, setInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState<DeviceStatus[]>([]);
  const [scanners, setScanners] = useState<DeviceStatus[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  const halRef = useRef(getHardwareAbstractionLayer());
  const unsubscribesRef = useRef<Array<() => void>>([]);

  // Initialize hardware when component mounts
  useEffect(() => {
    if (!autoInitialize) return;

    // Copy ref to local variable at the beginning to avoid stale closure warnings
    const hal = halRef.current;
    if (!hal) return;

    const updateDeviceList = () => {
      // Get all device statuses and filter by type
      const allDevices = Array.from(hal.monitoring.getAllDevicesStatus().entries());
      const printerDevices = allDevices
        .map(([, device]) => device)
        .filter(device => device.deviceType === 'printer');
      const scannerDevices = allDevices
        .map(([, device]) => device)
        .filter(device => device.deviceType === 'scanner');

      setPrinters(printerDevices);
      setScanners(scannerDevices);
    };

    const setupListeners = () => {
      // Queue status listener using direct method call
      const pollQueueStatus = () => {
        try {
          const status = hal.queue.getQueueStatus();
          setQueueStatus(status);
        } catch (error) {
          logger.error({ err: error }, 'Failed to get queue status');
        }
      };

      // Set up event listeners for queue updates
      const handleQueueUpdated = (status: QueueStatus) => {
        setQueueStatus(status);
      };

      hal.queue.on('queue.updated', handleQueueUpdated);
      unsubscribesRef.current.push(() => hal.queue.off('queue.updated', handleQueueUpdated));

      // Alert handling - if needed in future
      if (onAlert) {
        const handleAlert = (alert: HardwareAlert) => {
          onAlert(alert);
        };
        // This would be implemented when alert system is added to HAL
        // For now, we'll just set up a placeholder
      }

      // Initial queue status
      pollQueueStatus();

      // Monitor device status changes
      const deviceStatusInterval = setInterval(updateDeviceList, 10000);
      unsubscribesRef.current.push(() => clearInterval(deviceStatusInterval));
    };

    const initializeHAL = async () => {
      try {
        await hal.initialize();
        setInitialized(true);

        // Get initial device list
        updateDeviceList();

        // Set up listeners
        setupListeners();

        toast.success('Hardware services initialized');
      } catch (error) {
        logger.error({ err: error }, 'Failed to initialize hardware services');
        toast.error('Failed to initialize hardware services');
      }
    };

    initializeHAL();

    return () => {
      // Cleanup listeners
      unsubscribesRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribesRef.current = [];

      // Use the same hal reference for cleanup
      if (hal) {
        hal.shutdown();
      }
    };
  }, [autoInitialize, onAlert, onScan]);

  // Print a job
  const print = useCallback(
    async (job: Omit<PrintJob, 'id'>): Promise<PrintResult> => {
      if (!initialized) {
        throw new Error('Hardware not initialized');
      }

      try {
        const fullJob: PrintJob = {
          ...job,
          id: undefined, // Let the service generate ID
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
    },
    [initialized]
  );

  // Batch print
  const batchPrint = useCallback(
    async (jobs: Omit<PrintJob, 'id'>[]): Promise<PrintResult[]> => {
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
    },
    [initialized]
  );

  // Cancel print job
  const cancelPrintJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      if (!initialized) return false;

      const result = halRef.current.queue.removeFromQueue(jobId);
      if (result) {
        toast.info('Print job cancelled');
      }
      return result;
    },
    [initialized]
  );

  // Start scanning
  const startScanning = useCallback(async (): Promise<void> => {
    if (!initialized) {
      throw new Error('Hardware not initialized');
    }

    try {
      // TODO: Implement scanner service in HAL
      logger.info('Start scanning requested - scanner service not yet integrated');
      toast.info('Scanner service not yet integrated with HAL');
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

    // TODO: Implement scanner service in HAL
    logger.info('Stop scanning requested - scanner service not yet integrated');
    setIsScanning(false);
  }, [initialized]);

  // Get device status
  const getDeviceStatus = useCallback(
    (deviceId: string): DeviceStatus | undefined => {
      if (!initialized) return undefined;
      return halRef.current.monitoring.getDeviceStatus(deviceId);
    },
    [initialized]
  );

  // Get dashboard data
  const getDashboardData = useCallback(() => {
    if (!initialized) return null;
    return halRef.current.monitoring.getDashboardData();
  }, [initialized]);

  // Get queue details
  const getQueueDetails = useCallback((): Array<{
    jobId: string | undefined;
    type: PrintJob['type'];
    priority: PrintJob['priority'];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    addedAt: string;
    attempts: number;
    error?: string;
  }> => {
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
  const retryFailedJobs = useCallback(async (): Promise<{
    retried: number;
    successful: number;
  }> => {
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
    retryFailedJobs,
  };
}
