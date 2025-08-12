/**
 * React Hook for Unified Printing Service
 * Updated to work with new unified print service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUnifiedPrintService } from '../unified-print-service';
import type { PrintRequest, PrintResult } from '../unified-print-service';
import { adaptPrintRequest, isOldPrintRequest, isNewPrintRequest } from '../adapters/print-request-adapter';
import type { PrintRequest as OldPrintRequest } from '../types';

// Keep compatibility types
export interface PrintJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  progress?: number;
  createdAt?: string;
  completedAt?: string;
}

export interface BatchPrintRequest {
  requests: (PrintRequest | OldPrintRequest)[];
  options?: {
    parallel?: boolean;
    stopOnError?: boolean;
    groupByType?: boolean;
  };
}

export interface BatchPrintResult {
  totalJobs: number;
  successful: number;
  failed: number;
  results: PrintResult[];
  duration: number;
}

export interface UsePrintingOptions {
  autoInitialize?: boolean;
  onStatusUpdate?: (status: PrintJobStatus) => void;
  onError?: (error: Error) => void;
}

export interface UsePrintingReturn {
  // Print operations - accepts both old and new formats
  print: (request: PrintRequest | OldPrintRequest) => Promise<PrintResult>;
  batchPrint: (batch: BatchPrintRequest) => Promise<BatchPrintResult>;
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
    completed: number;
    failed: number;
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

  const serviceRef = useRef<ReturnType<typeof getUnifiedPrintService> | null>(null);
  const initRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lazy initialization for service
  const getService = () => {
    if (!serviceRef.current && typeof window !== 'undefined') {
      serviceRef.current = getUnifiedPrintService();
    }
    return serviceRef.current;
  };

  // Initialize service
  useEffect(() => {
    if (!autoInitialize || initRef.current) return;

    const initialize = async () => {
      try {
        const service = getService();
        if (!service) return;
        await service.initialize();
        initRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    };

    initialize();
  }, [autoInitialize, onError]);

  // Subscribe to status updates from service
  useEffect(() => {
    const service = getService();
    if (!service) return;

    const handleJobQueued = ({ jobId, request }: { jobId: string; request?: unknown }) => {
      const job: PrintJobStatus = {
        jobId,
        status: 'queued',
        createdAt: new Date().toISOString(),
      };
      setActiveJobs(prev => [...prev, job]);
      onStatusUpdate?.(job);
    };

    const handleJobProcessing = ({ jobId }: { jobId: string }) => {
      setActiveJobs(prev => 
        prev.map(job => 
          job.jobId === jobId ? { ...job, status: 'processing' as const } : job
        )
      );
    };

    const handleJobCompleted = ({ jobId }: { jobId: string }) => {
      setActiveJobs(prev => 
        prev.map(job => 
          job.jobId === jobId 
            ? { ...job, status: 'completed' as const, completedAt: new Date().toISOString() } 
            : job
        )
      );
      // Remove completed job after 5 seconds
      setTimeout(() => {
        setActiveJobs(prev => prev.filter(job => job.jobId !== jobId));
      }, 5000);
    };

    const handleJobFailed = ({ jobId, error }: { jobId: string; error?: Error }) => {
      setActiveJobs(prev => 
        prev.map(job => 
          job.jobId === jobId 
            ? { ...job, status: 'failed' as const, message: error?.message } 
            : job
        )
      );
    };

    service.on('job.queued', handleJobQueued);
    service.on('job.processing', handleJobProcessing);
    service.on('job.completed', handleJobCompleted);
    service.on('job.failed', handleJobFailed);

    return () => {
      service.off('job.queued', handleJobQueued);
      service.off('job.processing', handleJobProcessing);
      service.off('job.completed', handleJobCompleted);
      service.off('job.failed', handleJobFailed);
    };
  }, [onStatusUpdate]);

  // Update queue status periodically
  useEffect(() => {
    // Wait for initialization before starting queue status updates
    if (!initRef.current && autoInitialize) return;

    const updateQueueStatus = async () => {
      try {
        const service = getService();
        if (!service) return;
        
        // Check if service is initialized
        if (!service.isInitialized()) {
          console.log('[usePrinting] Service not initialized yet, skipping queue status update');
          return;
        }

        const status = await service.getQueueStatus();
        setQueueStatus(status);
      } catch (err) {
        console.warn('[usePrinting] Failed to get queue status:', err);
      }
    };

    // Delay initial update to allow initialization
    const startTimeout = setTimeout(() => {
      updateQueueStatus();

      // 🛑 完全禁用自動更新：按用戶要求，不使用任何定時器
      // const interval = setInterval(updateQueueStatus, 2000); // 完全禁用
      // 只在初始載入時檢查一次，不再定時更新

      // 無需存儲 interval，因為已完全禁用定時器
      intervalRef.current = null;
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoInitialize]);

  // Print function - handles both old and new formats
  const print = useCallback(
    async (request: PrintRequest | OldPrintRequest): Promise<PrintResult> => {
      try {
        setPrinting(true);
        setProgress(0);
        setStatus('Preparing print job...');
        setError(null);

        // Convert old format to new format if needed
        let printRequest: PrintRequest;
        if (isOldPrintRequest(request)) {
          printRequest = adaptPrintRequest(request);
        } else if (isNewPrintRequest(request)) {
          printRequest = request;
        } else {
          throw new Error('Invalid print request format');
        }

        const service = getService();
        if (!service) throw new Error('Printing service not available');
        const result = await service.print(printRequest);

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

  // Batch print function - simulate for compatibility
  const batchPrint = useCallback(
    async (batch: BatchPrintRequest): Promise<BatchPrintResult> => {
      const startTime = Date.now();
      const results: PrintResult[] = [];
      let successful = 0;
      let failed = 0;

      try {
        setPrinting(true);
        setProgress(0);
        setStatus(`Preparing ${batch.requests.length} print jobs...`);
        setError(null);

        // Process each request
        for (let i = 0; i < batch.requests.length; i++) {
          const request = batch.requests[i];
          
          try {
            const result = await print(request);
            results.push(result);
            if (result.success) successful++;
            else failed++;
            
            setProgress(((i + 1) / batch.requests.length) * 100);
            
            if (!result.success && batch.options?.stopOnError) {
              break;
            }
          } catch (error) {
            failed++;
            results.push({
              success: false,
              jobId: `batch-${Date.now()}-${i}`,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            if (batch.options?.stopOnError) break;
          }
        }

        const batchResult: BatchPrintResult = {
          totalJobs: batch.requests.length,
          successful,
          failed,
          results,
          duration: Date.now() - startTime
        };

        if (failed > 0) {
          setStatus(`Completed with ${failed} failures`);
        } else {
          setStatus('All jobs completed successfully');
        }

        return batchResult;
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
    [print, onError]
  );


  // Cancel job function
  const cancelJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      try {
        const service = getService();
        if (!service) return false;
        return await service.cancelJob(jobId);
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
    cancelJob,
    printing,
    progress,
    status,
    activeJobs,
    queueStatus,
    error,
  };
}
