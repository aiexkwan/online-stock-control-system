/**
 * React Hook for Unified Printing Service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUnifiedPrintingService } from '../services/unified-printing-service';
import { getPrintStatusMonitor } from '../services/print-status-monitor';
import {
  PrintRequest,
  PrintResult,
  PrintType,
  BatchPrintRequest,
  BatchPrintResult,
  PrintJobStatus,
} from '../types';

export interface UsePrintingOptions {
  autoInitialize?: boolean;
  onStatusUpdate?: (status: PrintJobStatus) => void;
  onError?: (error: Error) => void;
}

export interface UsePrintingReturn {
  // Print operations
  print: (request: PrintRequest) => Promise<PrintResult>;
  batchPrint: (batch: BatchPrintRequest) => Promise<BatchPrintResult>;
  reprint: (historyId: string) => Promise<PrintResult>;
  cancelJob: (jobId: string) => Promise<boolean>;

  // Status
  printing: boolean;
  progress: number;
  status: string;
  activeJobs: PrintJobStatus[];

  // Queue info
  queueStatus: {
    pending: number;
    processing: number;
  } | null;

  // Error
  error: Error | null;
}

export function usePrinting(options: UsePrintingOptions = {}): UsePrintingReturn {
  const { autoInitialize = true, onStatusUpdate, onError } = options;

  const [printing, setPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [activeJobs, setActiveJobs] = useState<PrintJobStatus[]>([]);
  const [queueStatus, setQueueStatus] = useState<UsePrintingReturn['queueStatus']>(null);
  const [error, setError] = useState<Error | null>(null);

  const serviceRef = useRef(getUnifiedPrintingService());
  const monitorRef = useRef(getPrintStatusMonitor());
  const initRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize service
  useEffect(() => {
    if (!autoInitialize || initRef.current) return;

    const initialize = async () => {
      try {
        await serviceRef.current.initialize();
        initRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    };

    initialize();
  }, [autoInitialize, onError]);

  // Subscribe to status updates
  useEffect(() => {
    const monitor = monitorRef.current;

    const handleStatusUpdate = (status: PrintJobStatus) => {
      // Update active jobs
      setActiveJobs(monitor.getActiveStatuses());

      // Update progress if this is the current job
      if (status.progress !== undefined) {
        setProgress(status.progress);
      }

      // Update status message
      if (status.message) {
        setStatus(status.message);
      }

      // Call custom handler
      onStatusUpdate?.(status);
    };

    monitor.on('statusUpdate', handleStatusUpdate);

    return () => {
      monitor.off('statusUpdate', handleStatusUpdate);
    };
  }, [onStatusUpdate]);

  // Update queue status periodically
  useEffect(() => {
    // Wait for initialization before starting queue status updates
    if (!initRef.current && autoInitialize) return;

    const updateQueueStatus = async () => {
      try {
        // Check if service is initialized
        if (!serviceRef.current.isInitialized()) {
          console.log('[usePrinting] Service not initialized yet, skipping queue status update');
          return;
        }

        const status = await serviceRef.current.getQueueStatus();
        setQueueStatus(status);
      } catch (err) {
        console.warn('[usePrinting] Failed to get queue status:', err);
      }
    };

    // Delay initial update to allow initialization
    const startTimeout = setTimeout(() => {
      updateQueueStatus();

      // Update every 2 seconds
      const interval = setInterval(updateQueueStatus, 2000);

      // Store interval in ref for cleanup
      intervalRef.current = interval;
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoInitialize]);

  // Print function
  const print = useCallback(
    async (request: PrintRequest): Promise<PrintResult> => {
      try {
        setPrinting(true);
        setProgress(0);
        setStatus('Preparing print job...');
        setError(null);

        const result = await serviceRef.current.print(request);

        if (!result.success) {
          throw new Error(result.error || 'Print failed');
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setPrinting(false);
        setProgress(100);
      }
    },
    [onError]
  );

  // Batch print function
  const batchPrint = useCallback(
    async (batch: BatchPrintRequest): Promise<BatchPrintResult> => {
      try {
        setPrinting(true);
        setProgress(0);
        setStatus(`Preparing ${batch.requests.length} print jobs...`);
        setError(null);

        // Subscribe to batch progress
        const unsubscribe = serviceRef.current.on('progress', ({ percentage, current }) => {
          setProgress(percentage);
          setStatus(current);
        });

        const result = await serviceRef.current.batchPrint(batch);

        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }

        if (result.failed > 0) {
          setStatus(`Completed with ${result.failed} failures`);
        } else {
          setStatus('All jobs completed successfully');
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setPrinting(false);
        setProgress(100);
      }
    },
    [onError]
  );

  // Reprint function
  const reprint = useCallback(
    async (historyId: string): Promise<PrintResult> => {
      try {
        setPrinting(true);
        setProgress(0);
        setStatus('Reprinting...');
        setError(null);

        const result = await serviceRef.current.reprint(historyId);

        if (!result.success) {
          throw new Error(result.error || 'Reprint failed');
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setPrinting(false);
        setProgress(100);
      }
    },
    [onError]
  );

  // Cancel job function
  const cancelJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      try {
        return await serviceRef.current.cancelJob(jobId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return false;
      }
    },
    [onError]
  );

  return {
    print,
    batchPrint,
    reprint,
    cancelJob,
    printing,
    progress,
    status,
    activeJobs,
    queueStatus,
    error,
  };
}
