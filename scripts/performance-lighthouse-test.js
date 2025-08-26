/**
 * Lighthouse Performance Test Script
 * 測試首屏加載性能指標
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 測試配置
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Admin Dashboard - Injection', path: '/admin/injection' },
  { name: 'Admin Dashboard - Pipeline', path: '/admin/pipeline' },
  { name: 'Admin Dashboard - Warehouse', path: '/admin/warehouse' },
  { name: 'Print Label', path: '/print-label' },
  { name: 'Stock Transfer', path: '/stock-transfer' },
];

// 性能指標目標 (毫秒)
const PERFORMANCE_TARGETS = {
  FCP: 1500, // First Contentful Paint < 1.5s
  LCP: 2500, // Largest Contentful Paint < 2.5s
  TTI: 3800, // Time to Interactive < 3.8s
  TBT: 200, // Total Blocking Time < 200ms
  CLS: 0.1, // Cumulative Layout Shift < 0.1
};

// 測量 Web Vitals
async function measureWebVitals(page, url) {
  console.log(`\n📊 測量 ${url} 的性能指標...`);

  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      const metrics = {
        navigationStart: 0,
        FCP: 0,
        LCP: 0,
        FID: 0,
        CLS: 0,
        TTI: 0,
        TBT: 0,
        resourceTimings: [],
        memoryUsage: null,
      };

      // 記錄導航開始時間
      metrics.navigationStart = performance.timeOrigin;

      // 觀察 FCP
      const fcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          metrics.FCP = fcp.startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // 觀察 LCP
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // 觀察 CLS
      let clsScore = 0;
      const clsObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        metrics.CLS = clsScore;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // 記錄資源加載時間
      const resourceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('.js') || entry.name.includes('.css')) {
            metrics.resourceTimings.push({
              name: entry.name.split('/').pop(),
              duration: entry.duration,
              size: entry.transferSize || 0,
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // 獲取記憶體使用情況
      if (performance.memory) {
        metrics.memoryUsage = {
          usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        };
      }

      // 等待頁面穩定
      setTimeout(() => {
        // 計算 TTI (簡化版本)
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
          metrics.TTI = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
        }

        resolve(metrics);
      }, 5000);
    });
  });

  return metrics;
}

// 運行單個頁面測試
async function testPage(browser, pageConfig) {
  const page = await browser.newPage();

  // 設置視口大小
  await page.setViewport({ width: 1920, height: 1080 });

  // 啟用 CPU 和網絡節流
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 40,
  });

  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const url = `${TEST_URL}${pageConfig.path}`;

  try {
    // 導航到頁面
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // 測量性能指標
    const metrics = await measureWebVitals(page, url);

    // 獲取導航時間
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
        loadComplete: timing.loadEventEnd - timing.fetchStart,
      };
    });

    // 計算 bundle 大小
    const coverage = await page.coverage.startJSCoverage();
    await page.reload({ waitUntil: 'networkidle0' });
    const jsCoverage = await page.coverage.stopJSCoverage();

    const totalBundleSize = jsCoverage.reduce((acc, entry) => acc + entry.text.length, 0);
    const usedBundleSize = jsCoverage.reduce((acc, entry) => {
      const usedLength = entry.ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
      return acc + usedLength;
    }, 0);

    await page.close();

    return {
      name: pageConfig.name,
      path: pageConfig.path,
      metrics: {
        ...metrics,
        domContentLoaded: navigationTiming.domContentLoaded,
        loadComplete: navigationTiming.loadComplete,
        bundleStats: {
          total: (totalBundleSize / 1024).toFixed(2) + ' KB',
          used: (usedBundleSize / 1024).toFixed(2) + ' KB',
          coverage: ((usedBundleSize / totalBundleSize) * 100).toFixed(2) + '%',
        },
      },
    };
  } catch (error) {
    console.error(`❌ 測試 ${pageConfig.name} 時發生錯誤:`, error.message);
    await page.close();
    return {
      name: pageConfig.name,
      path: pageConfig.path,
      error: error.message,
    };
  }
}

// 評估性能分數
function calculateScore(value, target, inverse = false) {
  if (inverse) {
    return value <= target ? 100 : Math.max(0, 100 - ((value - target) / target) * 100);
  }
  return value <= target ? 100 : Math.max(0, 100 - ((value - target) / target) * 100);
}

// 生成報告
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    url: TEST_URL,
    results: results.map(result => {
      if (result.error) {
        return result;
      }

      const { metrics } = result;
      const scores = {
        FCP: calculateScore(metrics.FCP, PERFORMANCE_TARGETS.FCP),
        LCP: calculateScore(metrics.LCP, PERFORMANCE_TARGETS.LCP),
        TTI: calculateScore(metrics.TTI, PERFORMANCE_TARGETS.TTI),
        CLS: calculateScore(metrics.CLS, PERFORMANCE_TARGETS.CLS, true),
      };

      const overallScore = (scores.FCP + scores.LCP + scores.TTI + scores.CLS) / 4;

      return {
        ...result,
        scores,
        overallScore: overallScore.toFixed(1),
        status: overallScore >= 90 ? '✅ 優秀' : overallScore >= 70 ? '⚠️ 需要改進' : '❌ 較差',
      };
    }),
    summary: {
      totalPages: results.length,
      averageScores: {},
      recommendations: [],
    },
  };

  // 計算平均分數
  const validResults = results.filter(r => !r.error);
  if (validResults.length > 0) {
    report.summary.averageScores = {
      FCP: (validResults.reduce((sum, r) => sum + r.scores.FCP, 0) / validResults.length).toFixed(
        1
      ),
      LCP: (validResults.reduce((sum, r) => sum + r.scores.LCP, 0) / validResults.length).toFixed(
        1
      ),
      TTI: (validResults.reduce((sum, r) => sum + r.scores.TTI, 0) / validResults.length).toFixed(
        1
      ),
      CLS: (validResults.reduce((sum, r) => sum + r.scores.CLS, 0) / validResults.length).toFixed(
        1
      ),
      overall: (
        validResults.reduce((sum, r) => sum + parseFloat(r.overallScore), 0) / validResults.length
      ).toFixed(1),
    };

    // 生成建議
    if (report.summary.averageScores.FCP < 70) {
      report.summary.recommendations.push(
        '🎯 First Contentful Paint 需要優化，考慮減少初始 bundle 大小'
      );
    }
    if (report.summary.averageScores.LCP < 70) {
      report.summary.recommendations.push(
        '🖼️ Largest Contentful Paint 需要優化，檢查大型圖片或組件的加載'
      );
    }
    if (report.summary.averageScores.TTI < 70) {
      report.summary.recommendations.push('⚡ Time to Interactive 需要優化，減少主線程阻塞時間');
    }
    if (report.summary.averageScores.CLS < 70) {
      report.summary.recommendations.push(
        '📐 Cumulative Layout Shift 需要優化，確保元素有固定尺寸'
      );
    }
  }

  return report;
}

// 主函數
async function main() {
  console.log('🚀 開始 Lighthouse 性能測試...');
  console.log(`📍 測試 URL: ${TEST_URL}`);
  console.log(`📝 測試頁面數: ${TEST_PAGES.length}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];

  for (const pageConfig of TEST_PAGES) {
    const result = await testPage(browser, pageConfig);
    results.push(result);

    if (!result.error) {
      console.log(`✓ ${result.name}: 總分 ${result.overallScore} ${result.status}`);
    }
  }

  await browser.close();

  // 生成報告
  const report = generateReport(results);

  // 保存 JSON 報告
  const reportDir = path.join(__dirname, '..', 'performance-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const jsonPath = path.join(reportDir, `lighthouse-report-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // 打印摘要
  console.log('\n📊 性能測試摘要');
  console.log('================');
  console.log(
    `總體評分: ${report.summary.averageScores.overall}/100 ${
      report.summary.averageScores.overall >= 90
        ? '✅ 優秀'
        : report.summary.averageScores.overall >= 70
          ? '⚠️ 需要改進'
          : '❌ 較差'
    }`
  );
  console.log(`\n各項指標平均分:`);
  console.log(`- FCP: ${report.summary.averageScores.FCP}/100`);
  console.log(`- LCP: ${report.summary.averageScores.LCP}/100`);
  console.log(`- TTI: ${report.summary.averageScores.TTI}/100`);
  console.log(`- CLS: ${report.summary.averageScores.CLS}/100`);

  if (report.summary.recommendations.length > 0) {
    console.log(`\n優化建議:`);
    report.summary.recommendations.forEach(rec => console.log(rec));
  }

  console.log(`\n📄 詳細報告已保存到: ${jsonPath}`);

  // 更新性能基準文檔
  updatePerformanceDoc(report);
}

// 更新性能文檔
function updatePerformanceDoc(report) {
  const docPath = path.join(__dirname, '..', 'docs', 'performance-test-results.md');

  const content = `# Lighthouse 性能測試結果

## 測試時間: ${report.timestamp}

### 總體評分: ${report.summary.averageScores.overall}/100

### 各頁面詳細結果

| 頁面 | FCP | LCP | TTI | CLS | 總分 | 狀態 |
|------|-----|-----|-----|-----|------|------|
${report.results
  .map(r => {
    if (r.error) {
      return `| ${r.name} | - | - | - | - | - | ❌ 錯誤 |`;
    }
    return `| ${r.name} | ${r.scores.FCP.toFixed(0)} | ${r.scores.LCP.toFixed(0)} | ${r.scores.TTI.toFixed(0)} | ${r.scores.CLS.toFixed(0)} | ${r.overallScore} | ${r.status} |`;
  })
  .join('\n')}

### 性能指標詳情

${report.results
  .map(r => {
    if (r.error) {
      return `#### ${r.name}
- 錯誤: ${r.error}`;
    }
    return `#### ${r.name}
- FCP: ${r.metrics.FCP.toFixed(0)}ms (目標: <${PERFORMANCE_TARGETS.FCP}ms)
- LCP: ${r.metrics.LCP.toFixed(0)}ms (目標: <${PERFORMANCE_TARGETS.LCP}ms)
- TTI: ${r.metrics.TTI.toFixed(0)}ms (目標: <${PERFORMANCE_TARGETS.TTI}ms)
- CLS: ${r.metrics.CLS.toFixed(3)} (目標: <${PERFORMANCE_TARGETS.CLS})
- Bundle Coverage: ${r.metrics.bundleStats.coverage}`;
  })
  .join('\n\n')}

### 優化建議

${report.summary.recommendations.length > 0 ? report.summary.recommendations.join('\n') : '✅ 所有指標都在目標範圍內！'}

### 測試配置
- URL: ${report.url}
- 網絡: Fast 3G (1.5 Mbps)
- CPU: 4x 節流
- 視口: 1920x1080
`;

  fs.writeFileSync(docPath, content);
  console.log(`\n📝 性能文檔已更新: ${docPath}`);
}

// 執行測試
main().catch(console.error);
