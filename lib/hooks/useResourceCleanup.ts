'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface TimeoutHandle {
  id: NodeJS.Timeout;
  name?: string;
  created: number;
}

export interface IntervalHandle {
  id: NodeJS.Timeout;
  name?: string;
  created: number;
}

export interface EventListenerHandle {
  target: EventTarget;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
  name?: string;
  created: number;
}

export interface AbortControllerHandle {
  controller: AbortController;
  name?: string;
  created: number;
}

export interface ResourceCleanupMetrics {
  timeouts: {
    active: number;
    cleaned: number;
    totalCreated: number;
  };
  intervals: {
    active: number;
    cleaned: number;
    totalCreated: number;
  };
  eventListeners: {
    active: number;
    cleaned: number;
    totalCreated: number;
  };
  abortControllers: {
    active: number;
    aborted: number;
    totalCreated: number;
  };
  memoryLeakRisk: 'low' | 'medium' | 'high';
}

/**
 * Advanced resource cleanup hook for preventing memory leaks
 * 
 * Features:
 * - Automatic cleanup of timeouts, intervals, event listeners, and AbortControllers
 * - Resource usage tracking and metrics
 * - Memory leak detection
 * - Debug mode with detailed logging
 * 
 * @param componentName - Name of the component using this hook for debugging
 * @param debug - Enable debug logging and detailed tracking
 */
export function useResourceCleanup(componentName?: string, debug = false) {
  // Resource tracking refs
  const timeoutsRef = useRef<Map<NodeJS.Timeout, TimeoutHandle>>(new Map());
  const intervalsRef = useRef<Map<NodeJS.Timeout, IntervalHandle>>(new Map());
  const eventListenersRef = useRef<Set<EventListenerHandle>>(new Set());
  const abortControllersRef = useRef<Set<AbortControllerHandle>>(new Set());
  
  // Metrics tracking
  const metricsRef = useRef({
    timeouts: { active: 0, cleaned: 0, totalCreated: 0 },
    intervals: { active: 0, cleaned: 0, totalCreated: 0 },
    eventListeners: { active: 0, cleaned: 0, totalCreated: 0 },
    abortControllers: { active: 0, aborted: 0, totalCreated: 0 }
  });

  const isMountedRef = useRef(true);

  // Debug logging helper
  const debugLog = useCallback((message: string, data?: any) => {
    if (debug && componentName) {
      console.log(`[ResourceCleanup:${componentName}] ${message}`, data || '');
    }
  }, [debug, componentName]);

  // Enhanced timeout management
  const createTimeout = useCallback((
    callback: () => void,
    delay: number,
    name?: string
  ): NodeJS.Timeout => {
    if (!isMountedRef.current) {
      debugLog('Attempted to create timeout after component unmount', { name });
      // Return a dummy timeout that won't execute
      return setTimeout(() => {}, 0);
    }

    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
      // Remove from tracking when executed
      timeoutsRef.current.delete(timeoutId);
      metricsRef.current.timeouts.active--;
    }, delay);

    const handle: TimeoutHandle = {
      id: timeoutId,
      name,
      created: Date.now()
    };

    timeoutsRef.current.set(timeoutId, handle);
    metricsRef.current.timeouts.active++;
    metricsRef.current.timeouts.totalCreated++;

    debugLog('Timeout created', { name, delay, totalActive: metricsRef.current.timeouts.active });

    return timeoutId;
  }, [debugLog]);

  const clearTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    const handle = timeoutsRef.current.get(timeoutId);
    if (handle) {
      globalThis.clearTimeout(timeoutId);
      timeoutsRef.current.delete(timeoutId);
      metricsRef.current.timeouts.active--;
      metricsRef.current.timeouts.cleaned++;
      debugLog('Timeout cleared', { name: handle.name });
    }
  }, [debugLog]);

  // Enhanced interval management
  const createInterval = useCallback((
    callback: () => void,
    interval: number,
    name?: string
  ): NodeJS.Timeout => {
    if (!isMountedRef.current) {
      debugLog('Attempted to create interval after component unmount', { name });
      // Return a dummy interval
      return setInterval(() => {}, Number.MAX_SAFE_INTEGER);
    }

    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        callback();
      } else {
        // Auto-cleanup if component unmounted
        globalThis.clearInterval(intervalId);
        intervalsRef.current.delete(intervalId);
      }
    }, interval);

    const handle: IntervalHandle = {
      id: intervalId,
      name,
      created: Date.now()
    };

    intervalsRef.current.set(intervalId, handle);
    metricsRef.current.intervals.active++;
    metricsRef.current.intervals.totalCreated++;

    debugLog('Interval created', { name, interval, totalActive: metricsRef.current.intervals.active });

    return intervalId;
  }, [debugLog]);

  const clearInterval = useCallback((intervalId: NodeJS.Timeout) => {
    const handle = intervalsRef.current.get(intervalId);
    if (handle) {
      globalThis.clearInterval(intervalId);
      intervalsRef.current.delete(intervalId);
      metricsRef.current.intervals.active--;
      metricsRef.current.intervals.cleaned++;
      debugLog('Interval cleared', { name: handle.name });
    }
  }, [debugLog]);

  // Event listener management
  const addEventListener = useCallback((
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
    name?: string
  ) => {
    if (!isMountedRef.current) {
      debugLog('Attempted to add event listener after component unmount', { name, type });
      return;
    }

    target.addEventListener(type, listener, options);

    const handle: EventListenerHandle = {
      target,
      type,
      listener,
      options,
      name,
      created: Date.now()
    };

    eventListenersRef.current.add(handle);
    metricsRef.current.eventListeners.active++;
    metricsRef.current.eventListeners.totalCreated++;

    debugLog('Event listener added', { 
      name, 
      type, 
      target: target.constructor.name,
      totalActive: metricsRef.current.eventListeners.active 
    });
  }, [debugLog]);

  const removeEventListener = useCallback((handle: EventListenerHandle) => {
    handle.target.removeEventListener(handle.type, handle.listener, handle.options);
    eventListenersRef.current.delete(handle);
    metricsRef.current.eventListeners.active--;
    metricsRef.current.eventListeners.cleaned++;
    debugLog('Event listener removed', { name: handle.name, type: handle.type });
  }, [debugLog]);

  // AbortController management
  const createAbortController = useCallback((name?: string): AbortController => {
    if (!isMountedRef.current) {
      debugLog('Attempted to create AbortController after component unmount', { name });
      // Return a pre-aborted controller
      const controller = new AbortController();
      controller.abort();
      return controller;
    }

    const controller = new AbortController();
    const handle: AbortControllerHandle = {
      controller,
      name,
      created: Date.now()
    };

    abortControllersRef.current.add(handle);
    metricsRef.current.abortControllers.active++;
    metricsRef.current.abortControllers.totalCreated++;

    debugLog('AbortController created', { 
      name,
      totalActive: metricsRef.current.abortControllers.active 
    });

    return controller;
  }, [debugLog]);

  const abortController = useCallback((controller: AbortController) => {
    // Find the handle
    const handle = Array.from(abortControllersRef.current).find(h => h.controller === controller);
    if (handle && !controller.signal.aborted) {
      controller.abort();
      abortControllersRef.current.delete(handle);
      metricsRef.current.abortControllers.active--;
      metricsRef.current.abortControllers.aborted++;
      debugLog('AbortController aborted', { name: handle.name });
    }
  }, [debugLog]);

  // Get current metrics
  const getMetrics = useCallback((): ResourceCleanupMetrics => {
    const currentMetrics = metricsRef.current;
    
    // Calculate memory leak risk
    const totalActive = currentMetrics.timeouts.active + 
                       currentMetrics.intervals.active + 
                       currentMetrics.eventListeners.active + 
                       currentMetrics.abortControllers.active;
    
    let memoryLeakRisk: 'low' | 'medium' | 'high' = 'low';
    if (totalActive > 20) {
      memoryLeakRisk = 'high';
    } else if (totalActive > 10) {
      memoryLeakRisk = 'medium';
    }

    return {
      ...currentMetrics,
      memoryLeakRisk
    };
  }, []);

  // Force cleanup of all resources
  const forceCleanup = useCallback(() => {
    debugLog('Force cleanup initiated', getMetrics());

    // Clear all timeouts
    timeoutsRef.current.forEach((handle, timeoutId) => {
      globalThis.clearTimeout(timeoutId);
      metricsRef.current.timeouts.cleaned++;
    });
    timeoutsRef.current.clear();
    metricsRef.current.timeouts.active = 0;

    // Clear all intervals
    intervalsRef.current.forEach((handle, intervalId) => {
      globalThis.clearInterval(intervalId);
      metricsRef.current.intervals.cleaned++;
    });
    intervalsRef.current.clear();
    metricsRef.current.intervals.active = 0;

    // Remove all event listeners
    eventListenersRef.current.forEach((handle) => {
      handle.target.removeEventListener(handle.type, handle.listener, handle.options);
      metricsRef.current.eventListeners.cleaned++;
    });
    eventListenersRef.current.clear();
    metricsRef.current.eventListeners.active = 0;

    // Abort all controllers
    abortControllersRef.current.forEach((handle) => {
      if (!handle.controller.signal.aborted) {
        handle.controller.abort();
        metricsRef.current.abortControllers.aborted++;
      }
    });
    abortControllersRef.current.clear();
    metricsRef.current.abortControllers.active = 0;

    debugLog('Force cleanup completed');
  }, [debugLog, getMetrics]);

  // Memory leak detection
  const checkForLeaks = useCallback(() => {
    const metrics = getMetrics();
    const warnings: string[] = [];

    if (metrics.timeouts.active > 10) {
      warnings.push(`High number of active timeouts: ${metrics.timeouts.active}`);
    }

    if (metrics.intervals.active > 5) {
      warnings.push(`High number of active intervals: ${metrics.intervals.active}`);
    }

    if (metrics.eventListeners.active > 20) {
      warnings.push(`High number of active event listeners: ${metrics.eventListeners.active}`);
    }

    if (metrics.abortControllers.active > 10) {
      warnings.push(`High number of active AbortControllers: ${metrics.abortControllers.active}`);
    }

    if (warnings.length > 0) {
      debugLog('Potential memory leaks detected', warnings);
      if (debug) {
        console.warn(`[ResourceCleanup:${componentName}] Potential memory leaks:`, warnings);
      }
    }

    return {
      hasLeaks: warnings.length > 0,
      warnings,
      metrics
    };
  }, [getMetrics, debug, componentName, debugLog]);

  // Automatic cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      debugLog('Component unmounting, cleaning up resources');
      forceCleanup();
    };
  }, [forceCleanup, debugLog]);

  // Periodic leak detection in debug mode
  useEffect(() => {
    if (!debug) return;

    const checkInterval = setInterval(() => {
      const leakCheck = checkForLeaks();
      if (leakCheck.hasLeaks) {
        console.table(leakCheck.metrics);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(checkInterval);
    };
  }, [debug, checkForLeaks]);

  return {
    // Resource creation methods
    createTimeout,
    clearTimeout,
    createInterval,
    clearInterval,
    addEventListener,
    removeEventListener,
    createAbortController,
    abortController,
    
    // Utility methods
    getMetrics,
    forceCleanup,
    checkForLeaks,
    
    // State
    isMounted: () => isMountedRef.current
  };
}

export default useResourceCleanup;