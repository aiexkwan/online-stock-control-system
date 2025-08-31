'use client';

import * as React from 'react';

export interface ResourceLeakReport {
  componentName: string;
  leakType: 'memory' | 'event_listener' | 'timeout' | 'interval' | 'abort_controller';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: {
    activeCount: number;
    totalCreated: number;
    cleanedCount: number;
    oldestResource?: {
      name?: string;
      age: number; // milliseconds
    };
    recommendations: string[];
  };
  timestamp: number;
}

export interface GlobalResourceMetrics {
  components: Record<
    string,
    {
      timeouts: number;
      intervals: number;
      eventListeners: number;
      abortControllers: number;
      lastActivity: number;
    }
  >;
  totalResources: {
    timeouts: number;
    intervals: number;
    eventListeners: number;
    abortControllers: number;
  };
  leakRisk: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Global resource leak detector for monitoring memory leaks across components
 */
class ResourceLeakDetector {
  private static instance: ResourceLeakDetector | null = null;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private componentRegistry = new Map<
    string,
    {
      timeouts: Set<{ resource: NodeJS.Timeout; name?: string; created: number }>;
      intervals: Set<{ resource: NodeJS.Timeout; name?: string; created: number }>;
      eventListeners: Set<{
        resource: { target: EventTarget; type: string; listener: EventListener };
        name?: string;
        created: number;
      }>;
      abortControllers: Set<{ resource: AbortController; name?: string; created: number }>;
      lastActivity: number;
      metrics: {
        timeoutsCreated: number;
        intervalsCreated: number;
        eventListenersCreated: number;
        abortControllersCreated: number;
      };
    }
  >();
  private leakReports: ResourceLeakReport[] = [];
  private onLeakDetected?: (report: ResourceLeakReport) => void;

  // Thresholds for leak detection
  private readonly THRESHOLDS = {
    timeouts: { medium: 20, high: 50, critical: 100 },
    intervals: { medium: 10, high: 25, critical: 50 },
    eventListeners: { medium: 30, high: 75, critical: 150 },
    abortControllers: { medium: 15, high: 40, critical: 80 },
  };

  private readonly MONITORING_INTERVAL = 15000; // 15 seconds
  private readonly MAX_REPORTS_HISTORY = 100;

  static getInstance(): ResourceLeakDetector {
    if (!ResourceLeakDetector.instance) {
      ResourceLeakDetector.instance = new ResourceLeakDetector();
    }
    return ResourceLeakDetector.instance;
  }

  /**
   * Start monitoring for resource leaks
   */
  startMonitoring(onLeakDetected?: (report: ResourceLeakReport) => void) {
    if (this.isMonitoring) return;

    this.onLeakDetected = onLeakDetected;
    this.isMonitoring = true;

    // Only run in browser environment
    if (typeof window !== 'undefined') {
      this.monitoringInterval = setInterval(() => {
        this.performLeakDetection();
      }, this.MONITORING_INTERVAL);

      console.log('[ResourceLeakDetector] Started monitoring for resource leaks');
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[ResourceLeakDetector] Stopped monitoring');
  }

  /**
   * Register a component for monitoring
   */
  registerComponent(componentName: string) {
    if (!this.componentRegistry.has(componentName)) {
      this.componentRegistry.set(componentName, {
        timeouts: new Set(),
        intervals: new Set(),
        eventListeners: new Set(),
        abortControllers: new Set(),
        lastActivity: Date.now(),
        metrics: {
          timeoutsCreated: 0,
          intervalsCreated: 0,
          eventListenersCreated: 0,
          abortControllersCreated: 0,
        },
      });
    }
  }

  /**
   * Unregister a component (when it unmounts)
   */
  unregisterComponent(componentName: string) {
    this.componentRegistry.delete(componentName);
  }

  /**
   * Track resource creation
   */
  trackResource(
    componentName: string,
    resourceType: 'timeout' | 'interval' | 'eventListener' | 'abortController',
    resource: unknown,
    name?: string
  ) {
    const component = this.componentRegistry.get(componentName);
    if (!component) return;

    component.lastActivity = Date.now();

    switch (resourceType) {
      case 'timeout':
        component.timeouts.add({ resource: resource as NodeJS.Timeout, name, created: Date.now() });
        component.metrics.timeoutsCreated++;
        break;
      case 'interval':
        component.intervals.add({
          resource: resource as NodeJS.Timeout,
          name,
          created: Date.now(),
        });
        component.metrics.intervalsCreated++;
        break;
      case 'eventListener':
        component.eventListeners.add({
          resource: resource as { target: EventTarget; type: string; listener: EventListener },
          name,
          created: Date.now(),
        });
        component.metrics.eventListenersCreated++;
        break;
      case 'abortController':
        component.abortControllers.add({
          resource: resource as AbortController,
          name,
          created: Date.now(),
        });
        component.metrics.abortControllersCreated++;
        break;
    }
  }

  /**
   * Track resource cleanup
   */
  cleanupResource(
    componentName: string,
    resourceType: 'timeout' | 'interval' | 'eventListener' | 'abortController',
    resource: NodeJS.Timeout | EventListener | AbortController | unknown
  ) {
    const component = this.componentRegistry.get(componentName);
    if (!component) return;

    component.lastActivity = Date.now();

    switch (resourceType) {
      case 'timeout':
        // Find and remove the resource
        for (const item of component.timeouts) {
          if (item.resource === resource) {
            component.timeouts.delete(item);
            break;
          }
        }
        break;
      case 'interval':
        for (const item of component.intervals) {
          if (item.resource === resource) {
            component.intervals.delete(item);
            break;
          }
        }
        break;
      case 'eventListener':
        for (const item of component.eventListeners) {
          if (item.resource === resource) {
            component.eventListeners.delete(item);
            break;
          }
        }
        break;
      case 'abortController':
        for (const item of component.abortControllers) {
          if (item.resource === resource) {
            component.abortControllers.delete(item);
            break;
          }
        }
        break;
    }
  }

  /**
   * Release resource - alias for cleanupResource for consistency with hook API
   */
  releaseResource(
    componentName: string,
    resourceType: 'timeout' | 'interval' | 'eventListener' | 'abortController',
    resource: NodeJS.Timeout | EventListener | AbortController | unknown
  ) {
    this.cleanupResource(componentName, resourceType, resource);
  }

  /**
   * Get current metrics for all components
   */
  getGlobalMetrics(): GlobalResourceMetrics {
    const totalResources = {
      timeouts: 0,
      intervals: 0,
      eventListeners: 0,
      abortControllers: 0,
    };

    const components: Record<
      string,
      {
        timeouts: number;
        intervals: number;
        eventListeners: number;
        abortControllers: number;
        lastActivity: number;
      }
    > = {};

    this.componentRegistry.forEach((data, componentName) => {
      const componentMetrics = {
        timeouts: data.timeouts.size,
        intervals: data.intervals.size,
        eventListeners: data.eventListeners.size,
        abortControllers: data.abortControllers.size,
        lastActivity: data.lastActivity,
      };

      components[componentName] = componentMetrics;

      totalResources.timeouts += componentMetrics.timeouts;
      totalResources.intervals += componentMetrics.intervals;
      totalResources.eventListeners += componentMetrics.eventListeners;
      totalResources.abortControllers += componentMetrics.abortControllers;
    });

    // Calculate overall leak risk
    let leakRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const totalActiveResources = Object.values(totalResources).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalActiveResources > 200) {
      leakRisk = 'critical';
    } else if (totalActiveResources > 100) {
      leakRisk = 'high';
    } else if (totalActiveResources > 50) {
      leakRisk = 'medium';
    }

    return {
      components,
      totalResources,
      leakRisk,
    };
  }

  /**
   * Get all leak reports
   */
  getLeakReports(): ResourceLeakReport[] {
    return [...this.leakReports];
  }

  /**
   * Clear leak reports history
   */
  clearReports() {
    this.leakReports = [];
  }

  /**
   * Perform leak detection analysis
   */
  private performLeakDetection() {
    this.componentRegistry.forEach((data, componentName) => {
      // Check timeouts
      if (data.timeouts.size > this.THRESHOLDS.timeouts.medium) {
        this.generateLeakReport(
          componentName,
          'timeout',
          data.timeouts,
          data.metrics.timeoutsCreated
        );
      }

      // Check intervals
      if (data.intervals.size > this.THRESHOLDS.intervals.medium) {
        this.generateLeakReport(
          componentName,
          'interval',
          data.intervals,
          data.metrics.intervalsCreated
        );
      }

      // Check event listeners
      if (data.eventListeners.size > this.THRESHOLDS.eventListeners.medium) {
        this.generateLeakReport(
          componentName,
          'eventListener',
          data.eventListeners,
          data.metrics.eventListenersCreated
        );
      }

      // Check abort controllers
      if (data.abortControllers.size > this.THRESHOLDS.abortControllers.medium) {
        this.generateLeakReport(
          componentName,
          'abortController',
          data.abortControllers,
          data.metrics.abortControllersCreated
        );
      }
    });
  }

  private generateLeakReport(
    componentName: string,
    resourceType: 'timeout' | 'interval' | 'eventListener' | 'abortController',
    resources: Set<{ name?: string; created: number }>,
    totalCreated: number
  ) {
    const activeCount = resources.size;
    const cleanedCount = totalCreated - activeCount;

    // Find oldest resource
    let oldestResource;
    let oldestAge = 0;

    resources.forEach((item: { name?: string; created: number }) => {
      const age = Date.now() - item.created;
      if (age > oldestAge) {
        oldestAge = age;
        oldestResource = { name: item.name, age };
      }
    });

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const thresholds =
      this.THRESHOLDS[
        resourceType === 'eventListener'
          ? 'eventListeners'
          : resourceType === 'abortController'
            ? 'abortControllers'
            : (`${resourceType}s` as keyof typeof this.THRESHOLDS)
      ];

    if (activeCount >= thresholds.critical) {
      severity = 'critical';
    } else if (activeCount >= thresholds.high) {
      severity = 'high';
    } else if (activeCount >= thresholds.medium) {
      severity = 'medium';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(resourceType, severity, activeCount);

    const report: ResourceLeakReport = {
      componentName,
      leakType:
        resourceType === 'eventListener'
          ? 'event_listener'
          : resourceType === 'abortController'
            ? 'abort_controller'
            : resourceType,
      severity,
      details: {
        activeCount,
        totalCreated,
        cleanedCount,
        oldestResource,
        recommendations,
      },
      timestamp: Date.now(),
    };

    // Add to reports history
    this.leakReports.push(report);
    if (this.leakReports.length > this.MAX_REPORTS_HISTORY) {
      this.leakReports.shift();
    }

    // Notify callback
    if (this.onLeakDetected) {
      this.onLeakDetected(report);
    }

    // Log warning
    console.warn(`[ResourceLeakDetector] ${severity.toUpperCase()} leak detected:`, {
      component: componentName,
      type: resourceType,
      active: activeCount,
      recommendations: recommendations.slice(0, 2), // Show first 2 recommendations
    });
  }

  private generateRecommendations(
    resourceType: string,
    severity: string,
    activeCount: number
  ): string[] {
    const recommendations: string[] = [];

    switch (resourceType) {
      case 'timeout':
        recommendations.push('Clear timeouts in useEffect cleanup functions');
        recommendations.push('Use useResourceCleanup hook for automatic timeout management');
        if (severity === 'critical') {
          recommendations.push('Consider debouncing frequent timeout creation');
        }
        break;
      case 'interval':
        recommendations.push('Clear intervals in useEffect cleanup functions');
        recommendations.push('Verify intervals are actually needed vs useTimeout');
        if (severity === 'critical') {
          recommendations.push('Consider using a single global interval for multiple operations');
        }
        break;
      case 'eventListener':
        recommendations.push('Remove event listeners in useEffect cleanup functions');
        recommendations.push('Use AbortController for fetch-related events');
        if (activeCount > 50) {
          recommendations.push('Consider event delegation for similar event types');
        }
        break;
      case 'abortController':
        recommendations.push('Abort controllers when components unmount');
        recommendations.push('Reuse controllers for related operations');
        break;
    }

    if (severity === 'critical') {
      recommendations.push('Consider component restructuring to reduce resource usage');
      recommendations.push('Implement resource pooling for frequently created/destroyed resources');
    }

    return recommendations;
  }
}

// Export singleton instance
export const resourceLeakDetector = ResourceLeakDetector.getInstance();

// React hook for using the leak detector
export function useResourceLeakDetector(componentName?: string): {
  startMonitoring: (callback?: (report: ResourceLeakReport) => void) => void;
  stopMonitoring: () => void;
  getMetrics: () => GlobalResourceMetrics;
  getReports: () => ResourceLeakReport[];
  clearReports: () => void;
  trackResource: (type: string, resource: unknown, name?: string) => void;
  releaseResource: (type: string, resource: unknown) => void;
} {
  const detector = ResourceLeakDetector.getInstance();

  // Register component on mount if name provided
  React.useEffect(() => {
    if (componentName) {
      detector.registerComponent(componentName);
      return () => {
        detector.unregisterComponent(componentName);
      };
    }
    return undefined;
  }, [componentName, detector]);

  return {
    startMonitoring: (callback?: (report: ResourceLeakReport) => void) =>
      detector.startMonitoring(callback),
    stopMonitoring: () => detector.stopMonitoring(),
    getMetrics: () => detector.getGlobalMetrics(),
    getReports: () => detector.getLeakReports(),
    clearReports: () => detector.clearReports(),
    trackResource: (
      type: 'timeout' | 'interval' | 'eventListener' | 'abortController',
      resource: unknown,
      name?: string
    ) => (componentName ? detector.trackResource(componentName, type, resource, name) : undefined),
    releaseResource: (
      type: 'timeout' | 'interval' | 'eventListener' | 'abortController',
      resource: unknown
    ) => (componentName ? detector.releaseResource(componentName, type, resource) : undefined),
  };
}

export default resourceLeakDetector;
