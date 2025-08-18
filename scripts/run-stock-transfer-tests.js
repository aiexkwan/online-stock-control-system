#!/usr/bin/env node

/**
 * Stock Transfer Test Runner
 * 
 * 庫存轉移測試運行器
 * 提供方便的命令行介面來執行不同類型的測試
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configurations
const TEST_CONFIGS = {
  'smoke': {
    description: 'Quick smoke tests for basic functionality',
    command: 'npx playwright test',
    args: [
      '__tests__/e2e/stock-transfer-card.e2e.spec.ts',
      '--grep', '@smoke',
      '--workers', '1',
      '--timeout', '30000'
    ]
  },
  
  'full': {
    description: 'Complete test suite with all scenarios',
    command: 'npx playwright test',
    args: [
      '__tests__/e2e/stock-transfer-card.e2e.spec.ts',
      '__tests__/e2e/stock-transfer-integration.e2e.spec.ts',
      '--workers', '2',
      '--timeout', '90000'
    ]
  },
  
  'integration': {
    description: 'Integration tests with API and database',
    command: 'npx playwright test',
    args: [
      '__tests__/e2e/stock-transfer-integration.e2e.spec.ts',
      '--workers', '1',
      '--timeout', '120000'
    ]
  },
  
  'performance': {
    description: 'Performance and load testing',
    command: 'npx playwright test',
    args: [
      '__tests__/e2e/stock-transfer-card.e2e.spec.ts',
      '__tests__/e2e/stock-transfer-integration.e2e.spec.ts',
      '--grep', '@performance',
      '--workers', '1',
      '--timeout', '180000'
    ]
  },
  
  'error-scenarios': {
    description: 'Error handling and edge cases',
    command: 'npx playwright test',
    args: [
      '__tests__/e2e/stock-transfer-card.e2e.spec.ts',
      '--grep', 'error|Error|edge|Edge',
      '--workers', '1',
      '--timeout', '60000'
    ]
  },
  
  'debug': {
    description: 'Debug mode with headed browser and slow motion',
    command: 'npx playwright test',
    args: [
      '__tests__/e2e/stock-transfer-card.e2e.spec.ts',
      '--headed',
      '--debug',
      '--workers', '1',
      '--timeout', '300000'
    ]
  }
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  const border = '='.repeat(60);
  log(border, 'cyan');
  log(`  ${message}`, 'cyan');
  log(border, 'cyan');
}

function logSection(message) {
  log(`\n📋 ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function checkPrerequisites() {
  logSection('Checking prerequisites...');
  
  // Check if Node.js is available
  try {
    const nodeVersion = process.version;
    logSuccess(`Node.js version: ${nodeVersion}`);
  } catch (error) {
    logError('Node.js is not available');
    return false;
  }
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found');
    logWarning('Please ensure TEST_SYS_LOGIN and TEST_SYS_PASSWORD are set');
    return false;
  }
  
  // Check if test credentials are set
  require('dotenv').config({ path: envPath });
  if (!process.env.TEST_SYS_LOGIN || !process.env.TEST_SYS_PASSWORD) {
    logError('Test credentials not found in .env.local');
    logWarning('Please set TEST_SYS_LOGIN and TEST_SYS_PASSWORD');
    return false;
  }
  
  logSuccess('All prerequisites met');
  return true;
}

function showUsage() {
  logHeader('Stock Transfer Test Runner');
  
  log('\nUsage:', 'bright');
  log('  node scripts/run-stock-transfer-tests.js <test-type> [options]');
  
  log('\nAvailable test types:', 'bright');
  Object.entries(TEST_CONFIGS).forEach(([type, config]) => {
    log(`  ${type.padEnd(15)} - ${config.description}`, 'cyan');
  });
  
  log('\nOptions:', 'bright');
  log('  --help, -h        Show this help message');
  log('  --list, -l        List available test types');
  log('  --headed          Run tests in headed mode (visible browser)');
  log('  --debug           Run tests in debug mode');
  log('  --workers <n>     Number of parallel workers');
  log('  --timeout <ms>    Test timeout in milliseconds');
  log('  --grep <pattern>  Run only tests matching pattern');
  log('  --project <name>  Run tests on specific browser project');
  log('  --reporter <type> Test reporter (html, json, line, etc.)');
  
  log('\nExamples:', 'bright');
  log('  node scripts/run-stock-transfer-tests.js smoke');
  log('  node scripts/run-stock-transfer-tests.js full --headed');
  log('  node scripts/run-stock-transfer-tests.js debug --grep "transfer workflow"');
  log('  node scripts/run-stock-transfer-tests.js performance --workers 1');
}

function parseArgs(args) {
  const parsed = {
    testType: null,
    options: {}
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        parsed.options[key] = nextArg;
        i++; // Skip next argument as it's a value
      } else {
        parsed.options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.substring(1);
      parsed.options[key] = true;
    } else if (!parsed.testType) {
      parsed.testType = arg;
    }
  }
  
  return parsed;
}

function buildTestCommand(testType, options) {
  const config = TEST_CONFIGS[testType];
  if (!config) {
    throw new Error(`Unknown test type: ${testType}`);
  }
  
  let command = config.command;
  let args = [...config.args];
  
  // Apply command line options
  if (options.headed) {
    args.push('--headed');
  }
  
  if (options.debug) {
    args.push('--debug');
  }
  
  if (options.workers) {
    const workerIndex = args.findIndex(arg => arg === '--workers');
    if (workerIndex !== -1) {
      args[workerIndex + 1] = options.workers;
    } else {
      args.push('--workers', options.workers);
    }
  }
  
  if (options.timeout) {
    const timeoutIndex = args.findIndex(arg => arg === '--timeout');
    if (timeoutIndex !== -1) {
      args[timeoutIndex + 1] = options.timeout;
    } else {
      args.push('--timeout', options.timeout);
    }
  }
  
  if (options.grep) {
    const grepIndex = args.findIndex(arg => arg === '--grep');
    if (grepIndex !== -1) {
      args[grepIndex + 1] = options.grep;
    } else {
      args.push('--grep', options.grep);
    }
  }
  
  if (options.project) {
    args.push('--project', options.project);
  }
  
  if (options.reporter) {
    args.push('--reporter', options.reporter);
  }
  
  return { command, args };
}

function runTests(testType, options) {
  logSection(`Running ${testType} tests...`);
  
  const { command, args } = buildTestCommand(testType, options);
  
  log(`Command: ${command} ${args.join(' ')}`, 'cyan');
  
  const startTime = Date.now();
  
  const testProcess = spawn(command.split(' ')[0], [...command.split(' ').slice(1), ...args], {
    stdio: 'inherit',
    shell: true
  });
  
  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        logSuccess(`Tests completed successfully in ${duration}s`);
        resolve(code);
      } else {
        logError(`Tests failed with exit code ${code} after ${duration}s`);
        reject(new Error(`Test execution failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      logError(`Failed to start test process: ${error.message}`);
      reject(error);
    });
  });
}

function generateTestReport() {
  logSection('Generating test report...');
  
  const reportPath = path.join(process.cwd(), 'test-results', 'reports', 'index.html');
  
  if (fs.existsSync(reportPath)) {
    logSuccess(`Test report available at: ${reportPath}`);
    
    // Try to open report in browser (optional)
    if (process.platform === 'darwin') {
      spawn('open', [reportPath]);
    } else if (process.platform === 'win32') {
      spawn('start', [reportPath], { shell: true });
    } else if (process.platform === 'linux') {
      spawn('xdg-open', [reportPath]);
    }
  } else {
    logWarning('Test report not found');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const { testType, options } = parseArgs(args);
  
  // Handle help and list options
  if (options.help || options.h || !testType) {
    showUsage();
    return;
  }
  
  if (options.list || options.l) {
    log('\nAvailable test types:', 'bright');
    Object.entries(TEST_CONFIGS).forEach(([type, config]) => {
      log(`  ${type.padEnd(15)} - ${config.description}`, 'cyan');
    });
    return;
  }
  
  // Validate test type
  if (!TEST_CONFIGS[testType]) {
    logError(`Unknown test type: ${testType}`);
    log('\nUse --list to see available test types', 'yellow');
    process.exit(1);
  }
  
  logHeader(`Stock Transfer Tests - ${testType.toUpperCase()}`);
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  try {
    // Run tests
    await runTests(testType, options);
    
    // Generate report
    generateTestReport();
    
    logSuccess('Test execution completed successfully');
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  TEST_CONFIGS,
  runTests,
  showUsage,
  checkPrerequisites
};