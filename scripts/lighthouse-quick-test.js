/**
 * 快速 Lighthouse 性能測試
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Admin Dashboard', path: '/admin/injection' },
];

async function measurePerformance(page, url) {
  console.log(`測試 ${url}...`);

  const startTime = Date.now();

  // 開始記錄覆蓋率
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();

  // 導航到頁面
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // 等待一下確保頁面穩定
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 獲取性能指標
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paintMetrics = performance.getEntriesByType('paint');

    const fcp = paintMetrics.find(metric => metric.name === 'first-contentful-paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();

    return {
      // 基本時間指標
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,

      // Web Vitals
      FCP: fcp ? fcp.startTime : 0,
      LCP: lcp ? lcp.startTime : 0,

      // 資源統計
      resourceCount: performance.getEntriesByType('resource').length,

      // 記憶體使用
      memory: performance.memory
        ? {
            usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
            totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
          }
        : null,
    };
  });

  // 停止覆蓋率記錄
  const jsCoverage = await page.coverage.stopJSCoverage();
  const cssCoverage = await page.coverage.stopCSSCoverage();

  // 計算 bundle 大小和使用率
  const jsStats = jsCoverage.reduce(
    (acc, entry) => {
      const total = entry.text.length;
      const used = entry.ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
      return {
        total: acc.total + total,
        used: acc.used + used,
      };
    },
    { total: 0, used: 0 }
  );

  const cssStats = cssCoverage.reduce(
    (acc, entry) => {
      const total = entry.text.length;
      const used = entry.ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
      return {
        total: acc.total + total,
        used: acc.used + used,
      };
    },
    { total: 0, used: 0 }
  );

  const totalTime = Date.now() - startTime;

  return {
    ...metrics,
    totalTestTime: totalTime,
    bundleStats: {
      js: {
        total: Math.round(jsStats.total / 1024) + ' KB',
        used: Math.round(jsStats.used / 1024) + ' KB',
        coverage: jsStats.total > 0 ? Math.round((jsStats.used / jsStats.total) * 100) + '%' : '0%',
      },
      css: {
        total: Math.round(cssStats.total / 1024) + ' KB',
        used: Math.round(cssStats.used / 1024) + ' KB',
        coverage:
          cssStats.total > 0 ? Math.round((cssStats.used / cssStats.total) * 100) + '%' : '0%',
      },
    },
  };
}

async function main() {
  console.log('🚀 開始快速性能測試...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];

  for (const pageConfig of TEST_PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      const url = `${TEST_URL}${pageConfig.path}`;
      const metrics = await measurePerformance(page, url);

      results.push({
        name: pageConfig.name,
        path: pageConfig.path,
        metrics,
        status: 'success',
      });

      console.log(`✅ ${pageConfig.name} 完成`);
      console.log(`   - FCP: ${metrics.FCP.toFixed(0)}ms`);
      console.log(`   - LCP: ${metrics.LCP.toFixed(0)}ms`);
      console.log(`   - Load: ${metrics.loadComplete.toFixed(0)}ms`);
      console.log(`   - JS Coverage: ${metrics.bundleStats.js.coverage}\n`);
    } catch (error) {
      console.error(`❌ ${pageConfig.name} 失敗: ${error.message}\n`);
      results.push({
        name: pageConfig.name,
        path: pageConfig.path,
        error: error.message,
        status: 'error',
      });
    }

    await page.close();
  }

  await browser.close();

  // 生成報告
  const report = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    results,
    summary: generateSummary(results),
  };

  // 保存報告
  const reportDir = path.join(__dirname, '..', 'performance-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `lighthouse-quick-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // 打印摘要
  console.log('\n📊 測試摘要');
  console.log('==========');
  console.log(`測試頁面: ${results.length}`);
  console.log(`成功: ${results.filter(r => r.status === 'success').length}`);
  console.log(`失敗: ${results.filter(r => r.status === 'error').length}`);

  if (report.summary.avgMetrics) {
    console.log(`\n平均性能指標:`);
    console.log(`- FCP: ${report.summary.avgMetrics.FCP}ms`);
    console.log(`- LCP: ${report.summary.avgMetrics.LCP}ms`);
    console.log(`- 完全加載: ${report.summary.avgMetrics.loadComplete}ms`);
    console.log(`- JS 覆蓋率: ${report.summary.avgMetrics.jsCoverage}%`);
  }

  console.log(`\n📄 報告已保存: ${reportPath}`);

  // 更新性能文檔
  updatePerformanceDoc(report);
}

function generateSummary(results) {
  const successResults = results.filter(r => r.status === 'success');

  if (successResults.length === 0) {
    return { error: '所有測試都失敗了' };
  }

  const avgMetrics = {
    FCP: Math.round(
      successResults.reduce((sum, r) => sum + r.metrics.FCP, 0) / successResults.length
    ),
    LCP: Math.round(
      successResults.reduce((sum, r) => sum + r.metrics.LCP, 0) / successResults.length
    ),
    loadComplete: Math.round(
      successResults.reduce((sum, r) => sum + r.metrics.loadComplete, 0) / successResults.length
    ),
    jsCoverage: Math.round(
      successResults.reduce((sum, r) => {
        const coverage = parseInt(r.metrics.bundleStats.js.coverage);
        return sum + coverage;
      }, 0) / successResults.length
    ),
  };

  return {
    totalPages: results.length,
    successCount: successResults.length,
    errorCount: results.length - successResults.length,
    avgMetrics,
  };
}

function updatePerformanceDoc(report) {
  const docPath = path.join(__dirname, '..', 'docs', 'performance-test-results.md');

  let existingContent = '';
  if (fs.existsSync(docPath)) {
    existingContent = fs.readFileSync(docPath, 'utf8');
  }

  const newSection = `
## Lighthouse 快速測試結果 - ${new Date().toLocaleString('zh-TW')}

### 測試摘要
- URL: ${report.url}
- 測試頁面數: ${report.results.length}
- 成功: ${report.summary.successCount || 0}
- 失敗: ${report.summary.errorCount || 0}

### 性能指標

| 頁面 | FCP (ms) | LCP (ms) | 加載時間 (ms) | JS 覆蓋率 | 狀態 |
|------|----------|----------|---------------|-----------|------|
${report.results
  .map(r => {
    if (r.status === 'error') {
      return `| ${r.name} | - | - | - | - | ❌ |`;
    }
    const m = r.metrics;
    return `| ${r.name} | ${m.FCP.toFixed(0)} | ${m.LCP.toFixed(0)} | ${m.loadComplete.toFixed(0)} | ${m.bundleStats.js.coverage} | ✅ |`;
  })
  .join('\n')}

### Bundle 統計

${report.results
  .filter(r => r.status === 'success')
  .map(r => {
    const m = r.metrics;
    return `**${r.name}**
- JS: ${m.bundleStats.js.used} / ${m.bundleStats.js.total} (${m.bundleStats.js.coverage})
- CSS: ${m.bundleStats.css.used} / ${m.bundleStats.css.total} (${m.bundleStats.css.coverage})`;
  })
  .join('\n\n')}

${
  report.summary.avgMetrics
    ? `### 平均指標
- FCP: ${report.summary.avgMetrics.FCP}ms
- LCP: ${report.summary.avgMetrics.LCP}ms
- 完全加載: ${report.summary.avgMetrics.loadComplete}ms
- JS 覆蓋率: ${report.summary.avgMetrics.jsCoverage}%`
    : ''
}

---
`;

  // 添加新結果到文檔開頭
  const updatedContent = `# 性能測試結果\n${newSection}\n${existingContent.replace('# 性能測試結果\n', '')}`;

  fs.writeFileSync(docPath, updatedContent);
  console.log(`\n📝 性能文檔已更新: ${docPath}`);
}

// 執行測試
main().catch(console.error);
