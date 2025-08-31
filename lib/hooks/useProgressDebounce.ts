'use client';

import { useCallback, useRef, useMemo, useEffect } from 'react';
import { debounceWithCancel } from '../../app/utils/debounce';
import { useResourceCleanup } from './useResourceCleanup';

export interface ProgressUpdate {
  current?: number;
  total?: number;
  status?: Array<'Pending' | 'Processing' | 'Success' | 'Failed'>;
  statusUpdate?: {
    index: number;
    status: 'Pending' | 'Processing' | 'Success' | 'Failed';
  };
}

export interface ProgressDebounceOptions {
  /** Progress update delay in milliseconds (default: 100ms) */
  progressDelay?: number;
  /** Status update delay in milliseconds (default: 50ms) */
  statusDelay?: number;
  /** Disable debouncing for critical updates */
  skipDebounceForCritical?: boolean;
  /** Enable smart batching to reduce update frequency */
  enableSmartBatching?: boolean;
  /** Maximum batch size for progress updates */
  maxBatchSize?: number;
}

interface ProgressBatch {
  updates: ProgressUpdate[];
  timestamp: number;
}

/**
 * Hook for managing debounced progress updates to reduce rendering overhead
 * Optimizes frequent progress updates by batching and debouncing them
 */
export function useProgressDebounce(
  onProgressChange: (update: ProgressUpdate) => void,
  options: ProgressDebounceOptions = {}
) {
  const {
    progressDelay = 100,
    statusDelay = 50,
    skipDebounceForCritical = true,
    enableSmartBatching = true,
    maxBatchSize = 5,
  } = options;

  // Resource cleanup hook for managing debounced functions
  const resourceCleanup = useResourceCleanup('useProgressDebounce', false);

  // Refs for managing batches and timeouts
  const batchRef = useRef<ProgressBatch>({ updates: [], timestamp: Date.now() });
  const lastUpdateRef = useRef<ProgressUpdate | null>(null);
  const criticalUpdateRef = useRef<boolean>(false);

  // Performance tracking
  const metricsRef = useRef({
    totalUpdates: 0,
    batchedUpdates: 0,
    skippedUpdates: 0,
    averageDelay: 0,
    lastMeasurement: Date.now(),
  });

  // Immediate update function for critical updates
  const immediateUpdate = useCallback(
    (update: ProgressUpdate) => {
      onProgressChange(update);
      lastUpdateRef.current = update;
      metricsRef.current.totalUpdates++;
    },
    [onProgressChange]
  );

  // Batch processing function
  const processBatch = useCallback(() => {
    const batch = batchRef.current;
    if (batch.updates.length === 0) return;

    // Merge all updates in the batch intelligently
    let mergedUpdate: ProgressUpdate = {};

    for (const update of batch.updates) {
      if (update.current !== undefined) mergedUpdate.current = update.current;
      if (update.total !== undefined) mergedUpdate.total = update.total;
      if (update.status) mergedUpdate.status = update.status;

      // Handle individual status updates - apply the latest one for each index
      if (update.statusUpdate) {
        if (!mergedUpdate.status) {
          mergedUpdate.status = lastUpdateRef.current?.status || [];
        }

        // Ensure status array is large enough
        const { index, status } = update.statusUpdate;
        if (index >= 0 && index < (mergedUpdate.status?.length || 0)) {
          mergedUpdate.status[index] = status;
        }
      }
    }

    // Apply the merged update
    onProgressChange(mergedUpdate);
    lastUpdateRef.current = mergedUpdate;

    // Update metrics
    metricsRef.current.totalUpdates++;
    metricsRef.current.batchedUpdates += batch.updates.length;

    // Clear the batch
    batchRef.current = { updates: [], timestamp: Date.now() };
  }, [onProgressChange]);

  // Debounced update functions with proper cleanup
  const debouncedProgressUpdate = useMemo(() => {
    const { debounced, cancel } = debounceWithCancel(processBatch, progressDelay);
    return { debounced, cancel };
  }, [processBatch, progressDelay]);

  const debouncedStatusUpdate = useMemo(() => {
    const { debounced, cancel } = debounceWithCancel(processBatch, statusDelay);
    return { debounced, cancel };
  }, [processBatch, statusDelay]);

  // Cleanup debounced functions and pending batches
  useEffect(() => {
    return () => {
      // Cancel any pending debounced calls
      debouncedProgressUpdate.cancel();
      debouncedStatusUpdate.cancel();

      // Clear any pending batch
      batchRef.current = { updates: [], timestamp: Date.now() };
    };
  }, [debouncedProgressUpdate, debouncedStatusUpdate]);

  // Smart update function that chooses the appropriate strategy
  const updateProgress = useCallback(
    (update: ProgressUpdate, isCritical = false) => {
      const now = Date.now();

      // Determine if this is a critical update that should skip debouncing
      const shouldSkipDebounce =
        (skipDebounceForCritical && isCritical) ||
        !enableSmartBatching ||
        // Skip debouncing for completion states
        update.status?.every(s => s === 'Success' || s === 'Failed');

      if (shouldSkipDebounce) {
        // Process any pending batch first
        if (batchRef.current.updates.length > 0) {
          processBatch();
        }

        immediateUpdate(update);
        criticalUpdateRef.current = true;
        return;
      }

      // Add to batch
      batchRef.current.updates.push(update);
      batchRef.current.timestamp = now;

      // Process batch immediately if it reaches max size
      if (batchRef.current.updates.length >= maxBatchSize) {
        processBatch();
        return;
      }

      // Choose appropriate debouncing strategy based on update type
      if (update.statusUpdate || update.status) {
        // Status updates are more frequent, use shorter delay
        debouncedStatusUpdate.debounced();
      } else {
        // Progress count updates use longer delay
        debouncedProgressUpdate.debounced();
      }

      // Update metrics
      metricsRef.current.averageDelay =
        (metricsRef.current.averageDelay + (now - metricsRef.current.lastMeasurement)) / 2;
      metricsRef.current.lastMeasurement = now;
    },
    [
      skipDebounceForCritical,
      enableSmartBatching,
      maxBatchSize,
      processBatch,
      immediateUpdate,
      debouncedStatusUpdate,
      debouncedProgressUpdate,
    ]
  );

  // Convenience methods for specific update types
  const updateProgressCount = useCallback(
    (current: number, total?: number) => {
      updateProgress({ current, total });
    },
    [updateProgress]
  );

  const updateProgressStatus = useCallback(
    (
      index: number,
      status: 'Pending' | 'Processing' | 'Success' | 'Failed',
      isCritical = false
    ) => {
      updateProgress({ statusUpdate: { index, status } }, isCritical);
    },
    [updateProgress]
  );

  const setProgressStatus = useCallback(
    (status: Array<'Pending' | 'Processing' | 'Success' | 'Failed'>, isCritical = false) => {
      updateProgress({ status }, isCritical);
    },
    [updateProgress]
  );

  // Force flush pending updates with safety check
  const flushUpdates = useCallback(() => {
    if (!resourceCleanup.isMounted()) {
      // Component unmounted, clear the batch without processing
      batchRef.current = { updates: [], timestamp: Date.now() };
      return;
    }

    if (batchRef.current.updates.length > 0) {
      processBatch();
    }
  }, [processBatch, resourceCleanup]);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    const metrics = metricsRef.current;
    return {
      ...metrics,
      batchEfficiency:
        metrics.batchedUpdates > 0
          ? (metrics.batchedUpdates - metrics.totalUpdates) / metrics.batchedUpdates
          : 0,
      updatesPerSecond: metrics.totalUpdates / ((Date.now() - metrics.lastMeasurement) / 1000),
    };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      totalUpdates: 0,
      batchedUpdates: 0,
      skippedUpdates: 0,
      averageDelay: 0,
      lastMeasurement: Date.now(),
    };
  }, []);

  // Enhanced cleanup method
  const cleanup = useCallback(() => {
    // Cancel debounced functions
    debouncedProgressUpdate.cancel();
    debouncedStatusUpdate.cancel();

    // Clear pending batch
    batchRef.current = { updates: [], timestamp: Date.now() };

    // Reset metrics
    metricsRef.current = {
      totalUpdates: 0,
      batchedUpdates: 0,
      skippedUpdates: 0,
      averageDelay: 0,
      lastMeasurement: Date.now(),
    };
  }, [debouncedProgressUpdate, debouncedStatusUpdate]);

  return {
    updateProgress,
    updateProgressCount,
    updateProgressStatus,
    setProgressStatus,
    flushUpdates,
    getMetrics,
    resetMetrics,
    cleanup,
    // Resource cleanup utilities
    resourceCleanup,
  };
}

export default useProgressDebounce;
