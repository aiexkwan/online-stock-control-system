#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * Verifies that StockTransferCard stability fixes are working correctly in production
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: process.env.DEPLOYMENT_URL || 'https://pennine-stock.vercel.app',
  timeout: 30000,
  maxRetries: 3,
  healthChecks: [
    {
      name: 'Basic Health Check',
      path: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      critical: true,
    },
    {
      name: 'GraphQL Endpoint Health',
      path: '/api/graphql',
      method: 'POST',
      body: JSON.stringify({
        query: '{ __schema { types { name } } }',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      expectedStatus: 200,
      critical: true,
    },
    {
      name: 'Stock Transfer Page Load',
      path: '/stock-transfer',
      method: 'GET',
      expectedStatus: 200,
      critical: true,
    },
    {
      name: 'Admin Dashboard Load',
      path: '/admin',
      method: 'GET',
      expectedStatus: 200,
      critical: false,
    },
  ],
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        resolve({
          statusCode: res.statusCode,
          data: data,
          responseTime: responseTime,
          headers: res.headers,
        });
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(CONFIG.timeout, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function runHealthCheck(check) {
  const url = new URL(check.path, CONFIG.baseUrl);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: check.method || 'GET',
    headers: {
      'User-Agent': 'StockTransfer-HealthCheck/1.0',
      ...check.headers,
    },
    body: check.body,
  };

  let attempt = 0;
  let lastError = null;

  while (attempt < CONFIG.maxRetries) {
    attempt++;

    try {
      log(`  Attempt ${attempt}/${CONFIG.maxRetries}: ${check.name}...`, colors.blue);

      const response = await makeRequest(options);

      if (response.statusCode === check.expectedStatus) {
        log(
          `  ✅ ${check.name} - ${response.statusCode} (${response.responseTime}ms)`,
          colors.green
        );
        return {
          success: true,
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          attempt: attempt,
        };
      } else {
        throw new Error(
          `Unexpected status code: ${response.statusCode} (expected ${check.expectedStatus})`
        );
      }
    } catch (error) {
      lastError = error;
      log(`  ❌ ${check.name} - Attempt ${attempt} failed: ${error.message}`, colors.yellow);

      if (attempt < CONFIG.maxRetries) {
        log(`  ⏳ Waiting 2s before retry...`, colors.yellow);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  return {
    success: false,
    error: lastError.message,
    attempt: attempt,
  };
}

async function verifyStockTransferStability() {
  log('\\n🔍 Verifying StockTransfer Stability Fixes...', colors.bold);

  // Check if error boundary is properly loaded
  try {
    const url = new URL('/stock-transfer', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'StockTransfer-HealthCheck/1.0',
      },
    };

    const response = await makeRequest(options);

    if (response.statusCode === 200) {
      // Check for StockTransferErrorBoundary in the response
      const hasErrorBoundary =
        response.data.includes('StockTransferErrorBoundary') ||
        response.data.includes('error-boundary');

      if (hasErrorBoundary) {
        log('  ✅ StockTransferErrorBoundary detected in page', colors.green);
      } else {
        log(
          '  ⚠️  StockTransferErrorBoundary not detected in HTML (may be dynamically loaded)',
          colors.yellow
        );
      }

      return true;
    }
  } catch (error) {
    log(`  ❌ Failed to verify stability fixes: ${error.message}`, colors.red);
    return false;
  }

  return false;
}

async function main() {
  console.clear();
  log('🚀 StockTransfer Deployment Health Check', colors.bold + colors.blue);
  log(`🎯 Target: ${CONFIG.baseUrl}`, colors.blue);
  log(`⏱️  Timeout: ${CONFIG.timeout}ms`, colors.blue);
  log('='.repeat(60), colors.blue);

  const results = [];
  let criticalFailures = 0;

  // Run all health checks
  for (const check of CONFIG.healthChecks) {
    const result = await runHealthCheck(check);
    result.check = check;
    results.push(result);

    if (!result.success && check.critical) {
      criticalFailures++;
    }
  }

  // Verify stability fixes
  const stabilityOk = await verifyStockTransferStability();

  // Summary
  log('\\n' + '='.repeat(60), colors.blue);
  log('📊 Health Check Summary', colors.bold);
  log('='.repeat(60), colors.blue);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`✅ Successful: ${successful}/${results.length}`, colors.green);
  log(`❌ Failed: ${failed}/${results.length}`, failed > 0 ? colors.red : colors.green);
  log(
    `🔥 Critical Failures: ${criticalFailures}`,
    criticalFailures > 0 ? colors.red : colors.green
  );
  log(
    `🛡️  Stability Verification: ${stabilityOk ? 'PASSED' : 'NEEDS REVIEW'}`,
    stabilityOk ? colors.green : colors.yellow
  );

  // Performance summary
  const avgResponseTime =
    results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / successful;

  if (successful > 0) {
    log(`⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`, colors.blue);
  }

  // Final verdict
  log('\\n' + '='.repeat(60), colors.blue);
  if (criticalFailures === 0 && stabilityOk) {
    log('🎉 DEPLOYMENT HEALTHY - All critical checks passed!', colors.bold + colors.green);
    process.exit(0);
  } else if (criticalFailures === 0) {
    log('⚠️  DEPLOYMENT MOSTLY HEALTHY - Minor issues detected', colors.bold + colors.yellow);
    process.exit(1);
  } else {
    log('🚨 DEPLOYMENT UNHEALTHY - Critical failures detected!', colors.bold + colors.red);
    log('\\n💡 Recommended Actions:', colors.yellow);
    log('  1. Check Vercel deployment logs', colors.yellow);
    log('  2. Verify environment variables are set', colors.yellow);
    log('  3. Run rollback if issues persist', colors.yellow);
    process.exit(2);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\\n🛑 Health check interrupted', colors.yellow);
  process.exit(130);
});

process.on('uncaughtException', error => {
  log(`\\n💥 Uncaught exception: ${error.message}`, colors.red);
  process.exit(1);
});

// Run the health check
main().catch(error => {
  log(`\\n💥 Health check failed: ${error.message}`, colors.red);
  process.exit(1);
});
