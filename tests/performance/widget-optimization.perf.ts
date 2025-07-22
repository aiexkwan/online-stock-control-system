/**
 * Widget Performance Optimization Tests
 * 測試 widget 系統優化前後嘅性能差異
 */

import { test, expect, Page, chromium, Browser } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

// Browser-compatible performance utilities (修復 Performance API 問題)
const getPerformanceNow = (): number => {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
};

// 性能測試配置
const PERFORMANCE_CONFIG = {
  iterations: 5, // 每個測試運行次數
  warmupRuns: 2, // 預熱運行次數
  networkThrottle: {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 40, // 40ms 延遲
  },
  cpuThrottle: 4, // CPU 減速倍數
  viewport: { width: 1920, height: 1080 },
  reportPath: 'test-results/performance-report.json',
};

// 性能指標接口
interface PerformanceMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTI: number; // Time to Interactive
  TBT: number; // Total Blocking Time
  CLS: number; // Cumulative Layout Shift
  networkRequests: number;
  totalTransferSize: number;
  domContentLoaded: number;
  loadComplete: number;
  jsHeapUsed: number;
  widgetRenderTime: number;
}

// 測試結果接口
interface TestResult {
  scenario: string;
  metrics: PerformanceMetrics[];
  averageMetrics: PerformanceMetrics;
  bundleSize?: number;
  improvements?: {
    [key: string]: number; // 改進百分比
  };
}

// 性能測試基類
class PerformanceTester {
  private browser: Browser | null = null;
  private results: TestResult[] = [];

  async setup() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // 修復認證問題 - 設置測試用戶登入
  async setupAuthentication(page: Page): Promise<boolean> {
    try {
      console.log('[PerformanceTester] Setting up test authentication...');

      // 導航到登入頁面
      await page.goto('http://localhost:3000/access');

      // 等待登入表單出現
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });

      // 使用環境變量中的認證資料 (如果可用)
      const testEmail = process.env.SYS_LOGIN || 'test@newpennine.com';
      const testPassword = process.env.SYS_PASSWORD || 'test123';

      // 填寫登入表單
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);

      // 提交表單
      await page.click('button[type="submit"]');

      // 等待登入成功，檢查是否重定向到 dashboard
      await page.waitForURL('**/admin/**', { timeout: 10000 });

      console.log('[PerformanceTester] Authentication successful');
      return true;
    } catch (error) {
      console.warn('[PerformanceTester] Authentication failed:', error);
      // 認證失敗不阻塞測試，但會影響需要認證的功能
      return false;
    }
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.saveResults();
  }

  async measurePerformance(
    url: string,
    scenario: string,
    setupFn?: (page: Page) => Promise<void>
  ): Promise<TestResult> {
    const metrics: PerformanceMetrics[] = [];

    for (let i = 0; i < PERFORMANCE_CONFIG.iterations + PERFORMANCE_CONFIG.warmupRuns; i++) {
      const context = await this.browser!.newContext({
        viewport: PERFORMANCE_CONFIG.viewport,
        // 模擬較慢嘅網絡
        offline: PERFORMANCE_CONFIG.networkThrottle.offline,
        // Note: Playwright 不直接支持網絡限速，需要通過 CDP
      });

      const page = await context.newPage();

      // 設置認證 (修復認證問題)
      await this.setupAuthentication(page);

      // 啟用 CDP 進行更詳細嘅性能監控
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Performance.enable');

      // 設置網絡限速
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: PERFORMANCE_CONFIG.networkThrottle.downloadThroughput,
        uploadThroughput: PERFORMANCE_CONFIG.networkThrottle.uploadThroughput,
        latency: PERFORMANCE_CONFIG.networkThrottle.latency,
      });

      // 設置 CPU 限速
      await client.send('Emulation.setCPUThrottlingRate', {
        rate: PERFORMANCE_CONFIG.cpuThrottle,
      });

      // 收集網絡請求
      let networkRequests = 0;
      let totalTransferSize = 0;

      page.on('request', () => {
        networkRequests++;
      });

      page.on('response', response => {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          totalTransferSize += parseInt(contentLength, 10);
        }
      });

      // 執行設置函數（如果有）
      if (setupFn) {
        await setupFn(page);
      }

      // 開始性能測量 (使用兼容的 performance API)
      const startTime = getPerformanceNow();

      // 導航到頁面
      await page.goto(url, { waitUntil: 'networkidle' });

      // 等待 widgets 加載完成
      await page.waitForSelector('[data-widget-loaded="true"]', {
        timeout: 30000,
      });

      // 獲取性能指標
      const performanceMetrics = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const navigationEntries = performance.getEntriesByType(
          'navigation'
        ) as PerformanceNavigationTiming[];
        const layoutShifts = performance.getEntriesByType('layout-shift') as any[];

        // 計算 TTI (簡化版本)
        const tti = navigationEntries[0]?.loadEventEnd || 0;

        // 計算 TBT (簡化版本)
        const longTasks = performance.getEntriesByType('longtask') as any[];
        const tbt = longTasks.reduce((total, task) => {
          const blockingTime = Math.max(0, task.duration - 50);
          return total + blockingTime;
        }, 0);

        // 計算 CLS
        const cls = layoutShifts.reduce((total, shift) => {
          if (!shift.hadRecentInput) {
            return total + shift.value;
          }
          return total;
        }, 0);

        // 獲取 memory 使用情況
        const jsHeapUsed = (performance as any).memory?.usedJSHeapSize || 0;

        return {
          FCP: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
          TTI: tti,
          TBT: tbt,
          CLS: cls,
          domContentLoaded: navigationEntries[0]?.domContentLoadedEventEnd || 0,
          loadComplete: navigationEntries[0]?.loadEventEnd || 0,
          jsHeapUsed: jsHeapUsed,
        };
      });

      // 測量 widget 渲染時間
      const widgetRenderTime = await page.evaluate(() => {
        return window.performance.getEntriesByName('widget-render-complete')[0]?.duration || 0;
      });

      const endTime = getPerformanceNow();

      // 收集完整指標（跳過預熱運行）
      if (i >= PERFORMANCE_CONFIG.warmupRuns) {
        metrics.push({
          ...performanceMetrics,
          networkRequests,
          totalTransferSize,
          widgetRenderTime,
        });
      }

      await context.close();
    }

    // 計算平均值
    const averageMetrics = this.calculateAverageMetrics(metrics);

    const result: TestResult = {
      scenario,
      metrics,
      averageMetrics,
    };

    this.results.push(result);
    return result;
  }

  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    const sum = metrics.reduce((acc, metric) => {
      Object.keys(metric).forEach(key => {
        acc[key] = (acc[key] || 0) + metric[key as keyof PerformanceMetrics];
      });
      return acc;
    }, {} as any);

    const average = {} as PerformanceMetrics;
    Object.keys(sum).forEach(key => {
      average[key as keyof PerformanceMetrics] = sum[key] / metrics.length;
    });

    return average;
  }

  calculateImprovements(baseline: TestResult, optimized: TestResult): TestResult {
    const improvements: { [key: string]: number } = {};

    Object.keys(baseline.averageMetrics).forEach(key => {
      const baselineValue = baseline.averageMetrics[key as keyof PerformanceMetrics];
      const optimizedValue = optimized.averageMetrics[key as keyof PerformanceMetrics];

      if (typeof baselineValue === 'number' && typeof optimizedValue === 'number') {
        // 對於時間相關指標，減少係改進
        if (
          [
            'FCP',
            'LCP',
            'TTI',
            'TBT',
            'domContentLoaded',
            'loadComplete',
            'widgetRenderTime',
          ].includes(key)
        ) {
          improvements[key] = ((baselineValue - optimizedValue) / baselineValue) * 100;
        }
        // 對於資源使用指標，減少係改進
        else if (['networkRequests', 'totalTransferSize', 'jsHeapUsed'].includes(key)) {
          improvements[key] = ((baselineValue - optimizedValue) / baselineValue) * 100;
        }
        // CLS 越低越好
        else if (key === 'CLS') {
          improvements[key] = ((baselineValue - optimizedValue) / baselineValue) * 100;
        }
      }
    });

    return {
      ...optimized,
      improvements,
    };
  }

  async saveResults() {
    const reportDir = path.dirname(PERFORMANCE_CONFIG.reportPath);
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      config: PERFORMANCE_CONFIG,
      results: this.results,
      summary: this.generateSummary(),
    };

    await fs.writeFile(PERFORMANCE_CONFIG.reportPath, JSON.stringify(report, null, 2));

    // 同時生成可讀嘅 Markdown 報告
    await this.generateMarkdownReport();
  }

  private generateSummary() {
    // 搵到 baseline 同 optimized 結果
    const baseline = this.results.find(r => r.scenario === 'baseline');
    const optimized = this.results.find(r => r.scenario === 'optimized');

    if (!baseline || !optimized) {
      return null;
    }

    return {
      improvements: optimized.improvements,
      keyMetrics: {
        fcpImprovement: optimized.improvements?.FCP || 0,
        lcpImprovement: optimized.improvements?.LCP || 0,
        ttiImprovement: optimized.improvements?.TTI || 0,
        networkRequestsReduction: optimized.improvements?.networkRequests || 0,
        transferSizeReduction: optimized.improvements?.totalTransferSize || 0,
        widgetRenderImprovement: optimized.improvements?.widgetRenderTime || 0,
      },
    };
  }

  private async generateMarkdownReport() {
    const baseline = this.results.find(r => r.scenario === 'baseline');
    const optimized = this.results.find(r => r.scenario === 'optimized');

    if (!baseline || !optimized) {
      return;
    }

    const report = `# Widget Performance Optimization Report

## Test Configuration
- Iterations: ${PERFORMANCE_CONFIG.iterations}
- Network: ${(PERFORMANCE_CONFIG.networkThrottle.downloadThroughput / 1024 / 1024) * 8} Mbps
- CPU Throttle: ${PERFORMANCE_CONFIG.cpuThrottle}x slowdown
- Date: ${new Date().toISOString()}

## Results Summary

### Key Performance Improvements
| Metric | Baseline | Optimized | Improvement |
|--------|----------|-----------|-------------|
| First Contentful Paint (FCP) | ${baseline.averageMetrics.FCP.toFixed(2)}ms | ${optimized.averageMetrics.FCP.toFixed(2)}ms | ${optimized.improvements?.FCP?.toFixed(1) || 0}% |
| Largest Contentful Paint (LCP) | ${baseline.averageMetrics.LCP.toFixed(2)}ms | ${optimized.averageMetrics.LCP.toFixed(2)}ms | ${optimized.improvements?.LCP?.toFixed(1) || 0}% |
| Time to Interactive (TTI) | ${baseline.averageMetrics.TTI.toFixed(2)}ms | ${optimized.averageMetrics.TTI.toFixed(2)}ms | ${optimized.improvements?.TTI?.toFixed(1) || 0}% |
| Total Blocking Time (TBT) | ${baseline.averageMetrics.TBT.toFixed(2)}ms | ${optimized.averageMetrics.TBT.toFixed(2)}ms | ${optimized.improvements?.TBT?.toFixed(1) || 0}% |
| Cumulative Layout Shift (CLS) | ${baseline.averageMetrics.CLS.toFixed(4)} | ${optimized.averageMetrics.CLS.toFixed(4)} | ${optimized.improvements?.CLS?.toFixed(1) || 0}% |

### Resource Usage
| Metric | Baseline | Optimized | Reduction |
|--------|----------|-----------|-----------|
| Network Requests | ${baseline.averageMetrics.networkRequests.toFixed(0)} | ${optimized.averageMetrics.networkRequests.toFixed(0)} | ${optimized.improvements?.networkRequests?.toFixed(1) || 0}% |
| Transfer Size | ${(baseline.averageMetrics.totalTransferSize / 1024).toFixed(2)}KB | ${(optimized.averageMetrics.totalTransferSize / 1024).toFixed(2)}KB | ${optimized.improvements?.totalTransferSize?.toFixed(1) || 0}% |
| JS Heap Used | ${(baseline.averageMetrics.jsHeapUsed / 1024 / 1024).toFixed(2)}MB | ${(optimized.averageMetrics.jsHeapUsed / 1024 / 1024).toFixed(2)}MB | ${optimized.improvements?.jsHeapUsed?.toFixed(1) || 0}% |

### Widget-Specific Metrics
| Metric | Baseline | Optimized | Improvement |
|--------|----------|-----------|-------------|
| Widget Render Time | ${baseline.averageMetrics.widgetRenderTime.toFixed(2)}ms | ${optimized.averageMetrics.widgetRenderTime.toFixed(2)}ms | ${optimized.improvements?.widgetRenderTime?.toFixed(1) || 0}% |
| DOM Content Loaded | ${baseline.averageMetrics.domContentLoaded.toFixed(2)}ms | ${optimized.averageMetrics.domContentLoaded.toFixed(2)}ms | ${optimized.improvements?.domContentLoaded?.toFixed(1) || 0}% |
| Load Complete | ${baseline.averageMetrics.loadComplete.toFixed(2)}ms | ${optimized.averageMetrics.loadComplete.toFixed(2)}ms | ${optimized.improvements?.loadComplete?.toFixed(1) || 0}% |

## Optimization Techniques Applied
1. **Batch GraphQL Queries**: Reduced multiple independent queries to single batch query
2. **Server-Side Rendering**: Pre-rendered widget data on server
3. **Lazy Loading**: Implemented dynamic imports for widget components
4. **Memoization**: Added React.memo and useMemo for expensive computations
5. **Virtual Scrolling**: Used @tanstack/react-virtual for large lists
6. **Bundle Optimization**: Tree-shaking and code splitting

## Recommendations
- Continue monitoring performance metrics in production
- Consider implementing edge caching for frequently accessed data
- Explore WebAssembly for compute-intensive widgets
- Add performance budgets to CI/CD pipeline
`;

    await fs.writeFile(
      path.join(path.dirname(PERFORMANCE_CONFIG.reportPath), 'performance-report.md'),
      report
    );
  }
}

// 主測試套件
test.describe('Widget Performance Optimization', () => {
  let tester: PerformanceTester;

  test.beforeAll(async () => {
    tester = new PerformanceTester();
    await tester.setup();
  });

  test.afterAll(async () => {
    await tester.teardown();
  });

  test('Baseline: Multiple Independent GraphQL Queries', async () => {
    const result = await tester.measurePerformance(
      'http://localhost:3000/admin/dashboard?mode=baseline',
      'baseline',
      async page => {
        // 設置測試環境為 baseline 模式 (修復 localStorage 跨域問題)
        await page.evaluate(() => {
          try {
            if (typeof Storage !== 'undefined' && window.localStorage) {
              localStorage.setItem('widget-mode', 'baseline');
            } else {
              console.warn('localStorage not available, using fallback');
              (window as any).widgetMode = 'baseline';
            }
            // 標記 widget 渲染開始
            if (performance && performance.mark) {
              performance.mark('widget-render-start');
            }
          } catch (error) {
            console.warn('localStorage access failed, using fallback:', error);
            (window as any).widgetMode = 'baseline';
          }
        });
      }
    );

    expect(result.averageMetrics.FCP).toBeGreaterThan(0);
    expect(result.averageMetrics.networkRequests).toBeGreaterThan(10); // 預期多個獨立請求
  });

  test('Optimized: Batch Query + SSR + Lazy Loading', async () => {
    const baselineResult = tester['results'].find(r => r.scenario === 'baseline');

    const result = await tester.measurePerformance(
      'http://localhost:3000/admin/dashboard?mode=optimized',
      'optimized',
      async page => {
        // 設置測試環境為優化模式 (修復 localStorage 跨域問題)
        await page.evaluate(() => {
          try {
            if (typeof Storage !== 'undefined' && window.localStorage) {
              localStorage.setItem('widget-mode', 'optimized');
            } else {
              console.warn('localStorage not available, using fallback');
              (window as any).widgetMode = 'optimized';
            }
            // 標記 widget 渲染開始
            if (performance && performance.mark) {
              performance.mark('widget-render-start');
            }
          } catch (error) {
            console.warn('localStorage access failed, using fallback:', error);
            (window as any).widgetMode = 'optimized';
          }
        });
      }
    );

    // 計算改進
    if (baselineResult) {
      const improvedResult = tester.calculateImprovements(baselineResult, result);
      tester['results'][tester['results'].length - 1] = improvedResult;

      // 驗證性能改進
      expect(improvedResult.improvements?.FCP).toBeGreaterThan(15); // 預期 FCP 改進 >15%
      expect(improvedResult.improvements?.networkRequests).toBeGreaterThan(50); // 預期請求減少 >50%
      expect(improvedResult.improvements?.widgetRenderTime).toBeGreaterThan(20); // 預期渲染時間改進 >20%
    }
  });

  test('Bundle Size Analysis', async ({ page }) => {
    // 運行 bundle 分析
    const { stdout } = await import('child_process').then(
      cp =>
        new Promise<{ stdout: string }>((resolve, reject) => {
          cp.exec('npm run analyze', (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout });
          });
        })
    );

    // 解析 bundle size 結果
    const bundleSizeMatch = stdout.match(/Total size:\s*(\d+\.?\d*)\s*(KB|MB)/);
    if (bundleSizeMatch) {
      const size = parseFloat(bundleSizeMatch[1]);
      const unit = bundleSizeMatch[2];
      const sizeInKB = unit === 'MB' ? size * 1024 : size;

      console.log(`Bundle size: ${sizeInKB.toFixed(2)} KB`);

      // 確保 bundle size 在合理範圍內
      expect(sizeInKB).toBeLessThan(5000); // 5MB 上限
    }
  });

  test('Memory Leak Detection', async () => {
    const page = await chromium.launch().then(b => b.newPage());

    // 導航到 dashboard
    await page.goto('http://localhost:3000/admin/dashboard');

    // 初始內存快照 (修復 Performance API 記憶體檢測)
    const initialHeap = await page.evaluate(() => {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize || 0;
      }
      console.warn('Performance memory API not available');
      return 0;
    });

    // 模擬用戶操作 - 多次切換 widgets
    for (let i = 0; i < 10; i++) {
      await page.click('[data-widget-toggle]');
      await page.waitForTimeout(500);
    }

    // 觸發垃圾回收
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(2000);

    // 最終內存快照 (修復 Performance API 記憶體檢測)
    const finalHeap = await page.evaluate(() => {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize || 0;
      }
      console.warn('Performance memory API not available');
      return 0;
    });

    // 檢查內存洩漏
    const heapGrowth = ((finalHeap - initialHeap) / initialHeap) * 100;
    expect(heapGrowth).toBeLessThan(50); // 內存增長不應超過 50%

    await page.close();
  });

  test('Critical Path CSS Coverage', async ({ page }) => {
    // 啟用 CSS coverage
    await page.coverage.startCSSCoverage();

    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const coverage = await page.coverage.stopCSSCoverage();

    // 分析 CSS 使用率
    let totalBytes = 0;
    let usedBytes = 0;

    for (const entry of coverage) {
      totalBytes += entry.text?.length || 0;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start;
      }
    }

    const cssUsage = (usedBytes / totalBytes) * 100;
    console.log(`CSS Usage: ${cssUsage.toFixed(2)}%`);

    // 確保 CSS 使用率合理
    expect(cssUsage).toBeGreaterThan(60); // 至少 60% 嘅 CSS 被使用
  });
});

// 輔助測試：GraphQL 查詢性能對比
test.describe('GraphQL Query Performance', () => {
  test('Independent Queries vs Batch Query', async ({ request }) => {
    // 測試獨立查詢 (使用兼容的 performance API)
    const independentStart = getPerformanceNow();

    const queries = [
      request.post('/api/graphql', {
        data: { query: '{ todayOrders { totalOrders } }' },
      }),
      request.post('/api/graphql', {
        data: { query: '{ inventoryStatus { totalValue } }' },
      }),
      request.post('/api/graphql', {
        data: { query: '{ monthlyPerformance { revenue } }' },
      }),
      request.post('/api/graphql', {
        data: { query: '{ userActivity { activeUsers } }' },
      }),
    ];

    await Promise.all(queries);
    const independentTime = getPerformanceNow() - independentStart;

    // 測試批量查詢 (使用兼容的 performance API)
    const batchStart = getPerformanceNow();

    await request.post('/api/graphql', {
      data: {
        query: `{
          todayOrders { totalOrders }
          inventoryStatus { totalValue }
          monthlyPerformance { revenue }
          userActivity { activeUsers }
        }`,
      },
    });

    const batchTime = getPerformanceNow() - batchStart;

    const improvement = ((independentTime - batchTime) / independentTime) * 100;
    console.log(`Batch query improvement: ${improvement.toFixed(2)}%`);

    expect(batchTime).toBeLessThan(independentTime);
    expect(improvement).toBeGreaterThan(40); // 預期至少 40% 改進
  });
});

// 輔助測試：Server Actions 性能
test.describe('Server Actions Performance', () => {
  test('Data Fetching Performance', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dashboard');

    // 測量 Server Action 執行時間 (修復 Performance API)
    const actionTime = await page.evaluate(async () => {
      const getTime = () => {
        if (typeof performance !== 'undefined' && performance.now) {
          return performance.now();
        }
        return Date.now();
      };

      const start = getTime();

      // 模擬調用 Server Action
      const response = await fetch('/api/server-action/getDashboardData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: ['orders', 'inventory', 'performance'] }),
      });

      await response.json();
      return getTime() - start;
    });

    console.log(`Server Action execution time: ${actionTime.toFixed(2)}ms`);
    expect(actionTime).toBeLessThan(1000); // 應該在 1 秒內完成
  });
});

// 導出測試結果類型
export type { PerformanceMetrics, TestResult };
