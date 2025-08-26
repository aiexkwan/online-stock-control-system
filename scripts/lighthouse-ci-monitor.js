#!/usr/bin/env node

/**
 * Lighthouse CI Monitoring Script
 * Continuous performance monitoring with alerts and reporting
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baselineMetrics: {
    'first-contentful-paint': 2000,
    'largest-contentful-paint': 4000,
    'total-blocking-time': 600,
    'cumulative-layout-shift': 0.1,
    'speed-index': 4000,
  },

  alertThresholds: {
    critical: 1.5, // 50% worse than baseline
    warning: 1.2, // 20% worse than baseline
  },

  reportPath: './lighthouse-ci-reports',
  historyPath: './lighthouse-ci-history.json',

  slackWebhook: process.env.LIGHTHOUSE_SLACK_WEBHOOK,
  emailRecipients: process.env.LIGHTHOUSE_EMAIL_RECIPIENTS?.split(',') || [],
};

/**
 * Run Lighthouse CI
 */
async function runLighthouseCI() {
  console.log('🚀 Starting Lighthouse CI performance monitoring...\n');

  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const lhci = spawn('npx', ['lhci', 'autorun'], {
      stdio: 'pipe',
      env: { ...process.env, CI: 'true' },
    });

    let output = '';
    let errorOutput = '';

    lhci.stdout.on('data', data => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    lhci.stderr.on('data', data => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    lhci.on('close', code => {
      const duration = performance.now() - startTime;

      if (code === 0) {
        resolve({ output, duration });
      } else {
        reject(new Error(`Lighthouse CI failed with code ${code}\n${errorOutput}`));
      }
    });
  });
}

/**
 * Parse Lighthouse CI results
 */
async function parseResults() {
  const reportDir = path.join(process.cwd(), CONFIG.reportPath);

  try {
    const files = await fs.readdir(reportDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('manifest'));

    const results = [];

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(reportDir, file), 'utf-8');
      const data = JSON.parse(content);

      if (data.categories && data.audits) {
        results.push({
          url: data.finalUrl || data.requestedUrl,
          timestamp: data.fetchTime,
          scores: {
            performance: data.categories.performance?.score,
            accessibility: data.categories.accessibility?.score,
            'best-practices': data.categories['best-practices']?.score,
            seo: data.categories.seo?.score,
          },
          metrics: {
            'first-contentful-paint': data.audits['first-contentful-paint']?.numericValue,
            'largest-contentful-paint': data.audits['largest-contentful-paint']?.numericValue,
            'total-blocking-time': data.audits['total-blocking-time']?.numericValue,
            'cumulative-layout-shift': data.audits['cumulative-layout-shift']?.numericValue,
            'speed-index': data.audits['speed-index']?.numericValue,
            interactive: data.audits['interactive']?.numericValue,
            'total-byte-weight': data.audits['total-byte-weight']?.numericValue,
          },
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to parse results:', error);
    return [];
  }
}

/**
 * Compare with baseline metrics
 */
function compareWithBaseline(results) {
  const comparisons = [];

  for (const result of results) {
    const urlComparison = {
      url: result.url,
      timestamp: result.timestamp,
      alerts: [],
      improvements: [],
      stable: [],
    };

    for (const [metric, baseline] of Object.entries(CONFIG.baselineMetrics)) {
      const current = result.metrics[metric];

      if (current !== undefined && baseline !== undefined) {
        const ratio = current / baseline;

        if (ratio > CONFIG.alertThresholds.critical) {
          urlComparison.alerts.push({
            level: 'critical',
            metric,
            baseline,
            current,
            change: `+${Math.round((ratio - 1) * 100)}%`,
          });
        } else if (ratio > CONFIG.alertThresholds.warning) {
          urlComparison.alerts.push({
            level: 'warning',
            metric,
            baseline,
            current,
            change: `+${Math.round((ratio - 1) * 100)}%`,
          });
        } else if (ratio < 0.9) {
          urlComparison.improvements.push({
            metric,
            baseline,
            current,
            change: `-${Math.round((1 - ratio) * 100)}%`,
          });
        } else {
          urlComparison.stable.push({ metric, current });
        }
      }
    }

    comparisons.push(urlComparison);
  }

  return comparisons;
}

/**
 * Update performance history
 */
async function updateHistory(results) {
  let history = [];

  try {
    const historyContent = await fs.readFile(CONFIG.historyPath, 'utf-8');
    history = JSON.parse(historyContent);
  } catch (error) {
    // History file doesn't exist yet
  }

  history.push({
    timestamp: new Date().toISOString(),
    results,
  });

  // Keep only last 30 days of history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  history = history.filter(entry => new Date(entry.timestamp) > thirtyDaysAgo);

  await fs.writeFile(CONFIG.historyPath, JSON.stringify(history, null, 2));

  return history;
}

/**
 * Generate performance report
 */
async function generateReport(results, comparisons, duration) {
  const report = {
    timestamp: new Date().toISOString(),
    duration: Math.round(duration / 1000) + 's',
    summary: {
      totalUrls: results.length,
      criticalAlerts: comparisons.reduce(
        (sum, c) => sum + c.alerts.filter(a => a.level === 'critical').length,
        0
      ),
      warnings: comparisons.reduce(
        (sum, c) => sum + c.alerts.filter(a => a.level === 'warning').length,
        0
      ),
      improvements: comparisons.reduce((sum, c) => sum + c.improvements.length, 0),
    },
    details: comparisons,
    averageScores: calculateAverageScores(results),
    recommendations: generateRecommendations(comparisons),
  };

  const reportPath = path.join(CONFIG.reportPath, `performance-report-${Date.now()}.json`);

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  return report;
}

/**
 * Calculate average scores across all URLs
 */
function calculateAverageScores(results) {
  const scores = {
    performance: [],
    accessibility: [],
    'best-practices': [],
    seo: [],
  };

  for (const result of results) {
    for (const [key, value] of Object.entries(result.scores)) {
      if (value !== null && value !== undefined) {
        scores[key].push(value);
      }
    }
  }

  const averages = {};
  for (const [key, values] of Object.entries(scores)) {
    if (values.length > 0) {
      averages[key] = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100);
    }
  }

  return averages;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(comparisons) {
  const recommendations = [];
  const metricCounts = {};

  // Count metric violations
  for (const comparison of comparisons) {
    for (const alert of comparison.alerts) {
      metricCounts[alert.metric] = (metricCounts[alert.metric] || 0) + 1;
    }
  }

  // Generate recommendations based on common issues
  for (const [metric, count] of Object.entries(metricCounts)) {
    if (count >= 2) {
      // Multiple URLs affected
      recommendations.push(generateRecommendation(metric, count));
    }
  }

  return recommendations;
}

/**
 * Generate specific recommendation for a metric
 */
function generateRecommendation(metric, affectedCount) {
  const recommendations = {
    'first-contentful-paint': {
      title: 'Optimize First Contentful Paint',
      description: `${affectedCount} pages have slow FCP`,
      actions: [
        'Reduce server response time',
        'Eliminate render-blocking resources',
        'Optimize critical rendering path',
        'Use resource hints (preconnect, dns-prefetch)',
      ],
    },
    'largest-contentful-paint': {
      title: 'Improve Largest Contentful Paint',
      description: `${affectedCount} pages have slow LCP`,
      actions: [
        'Optimize and compress images',
        'Use responsive images with srcset',
        'Preload critical resources',
        'Minimize render-blocking JavaScript',
      ],
    },
    'total-blocking-time': {
      title: 'Reduce Total Blocking Time',
      description: `${affectedCount} pages have high TBT`,
      actions: [
        'Split long tasks into smaller chunks',
        'Optimize JavaScript execution',
        'Use web workers for heavy computations',
        'Defer non-critical JavaScript',
      ],
    },
    'cumulative-layout-shift': {
      title: 'Fix Cumulative Layout Shift',
      description: `${affectedCount} pages have layout stability issues`,
      actions: [
        'Set dimensions for images and videos',
        'Avoid inserting content above existing content',
        'Use CSS transform instead of position changes',
        'Preload fonts to avoid FOUT/FOIT',
      ],
    },
    'speed-index': {
      title: 'Improve Speed Index',
      description: `${affectedCount} pages have slow visual progress`,
      actions: [
        'Optimize critical rendering path',
        'Minimize main thread work',
        'Reduce JavaScript execution time',
        'Implement progressive rendering',
      ],
    },
  };

  return (
    recommendations[metric] || {
      title: `Optimize ${metric}`,
      description: `${affectedCount} pages need improvement`,
      actions: ['Review performance metrics', 'Run detailed analysis'],
    }
  );
}

/**
 * Send alerts for critical issues
 */
async function sendAlerts(report) {
  if (report.summary.criticalAlerts === 0) {
    console.log('✅ No critical performance issues detected');
    return;
  }

  console.log(`⚠️ ${report.summary.criticalAlerts} critical performance issues detected`);

  // Log critical alerts to console
  for (const comparison of report.details) {
    const criticalAlerts = comparison.alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length > 0) {
      console.log(`\n🔴 ${comparison.url}:`);
      for (const alert of criticalAlerts) {
        console.log(
          `   - ${alert.metric}: ${alert.current}ms (baseline: ${alert.baseline}ms) ${alert.change}`
        );
      }
    }
  }

  // Send Slack notification if configured
  if (CONFIG.slackWebhook) {
    await sendSlackNotification(report);
  }

  // Log recommendations
  if (report.recommendations.length > 0) {
    console.log('\n📋 Recommendations:');
    for (const rec of report.recommendations) {
      console.log(`\n${rec.title} - ${rec.description}`);
      for (const action of rec.actions) {
        console.log(`   • ${action}`);
      }
    }
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(report) {
  // Implementation would send to Slack webhook
  console.log('📬 Slack notification would be sent (webhook not configured)');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Run Lighthouse CI
    const { duration } = await runLighthouseCI();

    // Parse results
    const results = await parseResults();

    if (results.length === 0) {
      console.error('❌ No results found');
      process.exit(1);
    }

    // Compare with baseline
    const comparisons = compareWithBaseline(results);

    // Update history
    await updateHistory(results);

    // Generate report
    const report = await generateReport(results, comparisons, duration);

    // Send alerts
    await sendAlerts(report);

    // Print summary
    console.log('\n📊 Performance Monitoring Complete');
    console.log('================================');
    console.log(`Duration: ${report.duration}`);
    console.log(`URLs tested: ${report.summary.totalUrls}`);
    console.log(`Average Performance Score: ${report.averageScores.performance || 'N/A'}%`);
    console.log(`Critical Alerts: ${report.summary.criticalAlerts}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Improvements: ${report.summary.improvements}`);

    // Exit with error code if critical alerts
    if (report.summary.criticalAlerts > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Lighthouse CI monitoring failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { runLighthouseCI, parseResults, compareWithBaseline };
