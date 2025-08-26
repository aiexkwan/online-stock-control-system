/**
 * Service Worker Manager for Pennine WMS
 * Handles SW registration, caching strategies, and performance optimization
 */

export interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  avgResponseTime: number;
  lastUpdated: number;
}

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private metrics: CacheMetrics = {
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    avgResponseTime: 0,
    lastUpdated: Date.now(),
  };
  private performanceObserver: PerformanceObserver | null = null;

  /**
   * Initialize Service Worker with performance monitoring
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[SWManager] Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports',
      });

      console.log('[SWManager] Service Worker registered successfully');

      // Setup event listeners
      this.setupEventListeners();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      // Pre-warm cache for critical resources
      await this.warmCriticalCache();

      return true;
    } catch (error) {
      console.error('[SWManager] Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Check if Service Worker is supported
   */
  private isSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Setup Service Worker event listeners
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Handle updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SWManager] New version available, refresh to update');
            this.notifyUpdate();
          }
        });
      }
    });

    // Listen for messages from Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, data } = event.data;

      switch (type) {
        case 'CACHE_CLEARED':
          console.log('[SWManager] Cache cleared:', data.cacheName);
          break;
        case 'PERFORMANCE_METRICS':
          this.updateMetrics(data);
          break;
        default:
          console.log('[SWManager] Unknown message:', type);
      }
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('[SWManager] PerformanceObserver not supported');
      return;
    }

    try {
      // Monitor LCP, FID, CLS
      this.performanceObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe Web Vitals
      this.performanceObserver.observe({
        type: 'largest-contentful-paint',
        buffered: true,
      });

      this.performanceObserver.observe({
        type: 'first-input',
        buffered: true,
      });

      this.performanceObserver.observe({
        type: 'layout-shift',
        buffered: true,
      });

      // Monitor navigation timing
      this.performanceObserver.observe({
        type: 'navigation',
        buffered: true,
      });
    } catch (error) {
      console.error('[SWManager] Performance monitoring setup failed:', error);
    }
  }

  /**
   * Handle performance entries
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        console.log('[SWManager] LCP:', entry.startTime);
        break;
      case 'first-input':
        console.log('[SWManager] FID:', (entry as any).processingStart - entry.startTime);
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          console.log('[SWManager] CLS:', (entry as any).value);
        }
        break;
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        console.log('[SWManager] TTFB:', navEntry.responseStart - navEntry.requestStart);
        break;
    }
  }

  /**
   * Pre-warm cache with critical resources
   */
  private async warmCriticalCache(): Promise<void> {
    const criticalUrls = ['/main-login', '/_next/static/css', '/api/auth/session'];

    try {
      await this.sendMessage({
        type: 'CACHE_WARM',
        payload: criticalUrls,
      });
      console.log('[SWManager] Critical cache warmed');
    } catch (error) {
      console.error('[SWManager] Cache warming failed:', error);
    }
  }

  /**
   * Send message to Service Worker
   */
  private async sendMessage(message: any): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No active Service Worker');
    }

    navigator.serviceWorker.controller.postMessage(message);
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName?: string): Promise<void> {
    try {
      await this.sendMessage({
        type: 'CACHE_CLEAR',
        payload: cacheName,
      });
      console.log('[SWManager] Cache clear requested');
    } catch (error) {
      console.error('[SWManager] Cache clear failed:', error);
    }
  }

  /**
   * Get current cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(data: Partial<CacheMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...data,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Notify about Service Worker update
   */
  private notifyUpdate(): void {
    // You can integrate this with your notification system
    console.log('[SWManager] App update available - refresh to get latest version');

    // Optional: Show update notification to user
    if (window.confirm('A new version is available. Refresh to update?')) {
      window.location.reload();
    }
  }

  /**
   * Check Service Worker status
   */
  getStatus(): {
    registered: boolean;
    active: boolean;
    scope: string | null;
  } {
    return {
      registered: !!this.registration,
      active: !!navigator.serviceWorker.controller,
      scope: this.registration?.scope || null,
    };
  }

  /**
   * Force Service Worker update
   */
  async forceUpdate(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[SWManager] Force update initiated');
    } catch (error) {
      console.error('[SWManager] Force update failed:', error);
    }
  }

  /**
   * Unregister Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return true;

    try {
      const result = await this.registration.unregister();
      console.log('[SWManager] Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('[SWManager] Unregister failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after page load to avoid blocking critical resources
  window.addEventListener('load', () => {
    serviceWorkerManager.initialize().catch(console.error);
  });
}
