#!/usr/bin/env node

/**
 * Master Deployment Script for StockTransfer Stability Fixes
 * Orchestrates the complete deployment process with checks and rollback capabilities
 */

const { execSync } = require('child_process');
const { rollbackToLastWorking } = require('./rollback-plan.js');
const readline = require('readline');

// Configuration
const DEPLOYMENT_CONFIG = {
  projectName: 'pennine-stock',
  healthCheckUrl: process.env.DEPLOYMENT_URL || 'https://pennine-stock.vercel.app',
  maxWaitTime: 300000, // 5 minutes
  healthCheckRetries: 3,
  preDeployTimeout: 120000, // 2 minutes
  postDeployTimeout: 180000, // 3 minutes
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  try {
    log(`🔄 ${description}...`, colors.blue);
    const output = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      timeout: options.timeout || 60000,
    });
    log(`✅ ${description} - Success`, colors.green);
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - Failed: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${colors.yellow}${question}${colors.reset}`, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function preDeploymentChecks() {
  log('🔍 Running Pre-Deployment Checks...', colors.bold + colors.blue);
  log('='.repeat(60), colors.blue);

  const result = runCommand(
    'node scripts/deployment/pre-deploy-check.js',
    'Pre-Deployment Verification',
    { timeout: DEPLOYMENT_CONFIG.preDeployTimeout }
  );

  if (!result.success) {
    log('❌ Pre-deployment checks failed!', colors.bold + colors.red);
    log('\\n💡 Please fix the issues and try again:', colors.yellow);
    log('  1. Review the error messages above', colors.yellow);
    log('  2. Fix any missing files or configuration issues', colors.yellow);
    log('  3. Ensure all stability fixes are properly implemented', colors.yellow);
    log('  4. Re-run this deployment script', colors.yellow);
    return false;
  }

  log('\\n✅ All pre-deployment checks passed!', colors.bold + colors.green);
  return true;
}

async function deployToVercel() {
  log('\\n🚀 Deploying to Vercel...', colors.bold + colors.blue);
  log('='.repeat(60), colors.blue);

  // Save current commit for potential rollback
  const currentCommit = runCommand('git rev-parse HEAD', 'Get current commit hash', {
    silent: true,
  });
  if (currentCommit.success) {
    const commitHash = currentCommit.output.trim().substring(0, 8);
    log(`📍 Current commit: ${commitHash}`, colors.dim);
  }

  // Ensure we're on the main branch with latest changes
  log('🔄 Preparing deployment...', colors.blue);

  const gitStatus = runCommand('git status --porcelain', 'Check git status', { silent: true });
  if (gitStatus.success && gitStatus.output.trim()) {
    log('⚠️  Uncommitted changes detected:', colors.yellow);
    log(gitStatus.output, colors.dim);

    const proceed = await askQuestion('Continue with deployment? (y/n): ');
    if (proceed !== 'y' && proceed !== 'yes') {
      log('🚫 Deployment cancelled by user', colors.yellow);
      return false;
    }
  }

  // Deploy to production
  log('🚀 Starting Vercel deployment...', colors.blue);
  const deployResult = runCommand(
    'vercel --prod --yes',
    'Deploy to Vercel Production',
    { timeout: 180000 } // 3 minutes timeout
  );

  if (!deployResult.success) {
    log('❌ Vercel deployment failed!', colors.bold + colors.red);
    log('\\n🔍 Common deployment failure reasons:', colors.yellow);
    log('  1. Build errors or TypeScript issues', colors.yellow);
    log('  2. Environment variables not set in Vercel', colors.yellow);
    log('  3. Dependency installation failures', colors.yellow);
    log('  4. API route configuration issues', colors.yellow);
    return false;
  }

  log('\\n✅ Vercel deployment completed!', colors.bold + colors.green);
  return true;
}

async function postDeploymentVerification() {
  log('\\n🏥 Running Post-Deployment Verification...', colors.bold + colors.blue);
  log('='.repeat(60), colors.blue);

  // Wait for deployment to be ready
  log('⏳ Waiting for deployment to be ready...', colors.blue);
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

  const healthResult = runCommand(
    'node scripts/deployment/deploy-health-check.js',
    'Post-Deployment Health Check',
    { timeout: DEPLOYMENT_CONFIG.postDeployTimeout }
  );

  if (!healthResult.success) {
    log('❌ Post-deployment verification failed!', colors.bold + colors.red);
    log('\\n🚨 Critical issues detected in deployed system:', colors.red);
    log('  1. API endpoints may be failing', colors.red);
    log('  2. StockTransfer component may not be working', colors.red);
    log('  3. Database connectivity issues possible', colors.red);
    return false;
  }

  log('\\n✅ Post-deployment verification passed!', colors.bold + colors.green);
  return true;
}

async function handleDeploymentFailure() {
  log('\\n🚨 DEPLOYMENT FAILURE DETECTED', colors.bold + colors.red);
  log('='.repeat(60), colors.red);

  log('The deployment has failed verification. Options:', colors.yellow);
  log('1. Automatic rollback to previous working deployment', colors.yellow);
  log('2. Manual investigation (not recommended for production)', colors.yellow);
  log('3. Exit and handle manually', colors.yellow);

  const choice = await askQuestion('\\nSelect option (1-3): ');

  switch (choice) {
    case '1':
      log('\\n🔄 Initiating automatic rollback...', colors.blue);
      const rollbackSuccess = await rollbackToLastWorking();

      if (rollbackSuccess) {
        log('\\n✅ Rollback completed successfully', colors.green);
        log('\\n📋 Next steps:', colors.blue);
        log('  1. Investigate the deployment failure cause', colors.blue);
        log('  2. Fix StockTransfer stability issues locally', colors.blue);
        log('  3. Run thorough testing before next deployment', colors.blue);
        log('  4. Consider using a staging environment', colors.blue);
      } else {
        log('\\n❌ Rollback failed - MANUAL INTERVENTION REQUIRED', colors.bold + colors.red);
        log('\\n🆘 Immediate actions needed:', colors.red);
        log('  1. Check Vercel dashboard for deployment status', colors.red);
        log('  2. Verify database connectivity and health', colors.red);
        log('  3. Contact system administrator if issues persist', colors.red);
      }
      break;

    case '2':
      log('\\n⚠️  Manual investigation mode selected', colors.yellow);
      log('\\n🔍 Investigation checklist:', colors.blue);
      log('  1. Check Vercel function logs', colors.blue);
      log('  2. Test StockTransfer component manually', colors.blue);
      log('  3. Verify API endpoints are responding', colors.blue);
      log('  4. Check database queries and performance', colors.blue);
      break;

    case '3':
      log('\\n👋 Exiting for manual handling', colors.blue);
      break;

    default:
      log('\\n❌ Invalid option - exiting', colors.red);
  }
}

async function main() {
  console.clear();
  log('🚀 StockTransfer Stability Fixes Deployment', colors.bold + colors.blue);
  log(`📦 Project: ${DEPLOYMENT_CONFIG.projectName}`, colors.blue);
  log(`🎯 Target: ${DEPLOYMENT_CONFIG.healthCheckUrl}`, colors.blue);
  log('='.repeat(60), colors.blue);

  const startTime = Date.now();
  let deploymentSuccess = false;

  try {
    // Phase 1: Pre-deployment checks
    log('\\n🔍 PHASE 1: Pre-Deployment Verification', colors.bold);
    const preChecksPass = await preDeploymentChecks();

    if (!preChecksPass) {
      log('\\n🚫 Deployment aborted due to failed pre-checks', colors.red);
      process.exit(1);
    }

    // Confirm deployment
    log('\\n🚀 Ready to deploy StockTransfer stability fixes', colors.green);
    log('\\nThis will deploy:', colors.blue);
    log('  ✅ StockTransferErrorBoundary component', colors.blue);
    log('  ✅ Memory leak fixes and cleanup logic', colors.blue);
    log('  ✅ Enhanced API error handling', colors.blue);
    log('  ✅ Improved Vercel configuration', colors.blue);

    const confirmDeploy = await askQuestion('\\nProceed with deployment? (y/n): ');
    if (confirmDeploy !== 'y' && confirmDeploy !== 'yes') {
      log('🚫 Deployment cancelled by user', colors.yellow);
      process.exit(0);
    }

    // Phase 2: Deployment
    log('\\n🚀 PHASE 2: Vercel Deployment', colors.bold);
    const deploySuccess = await deployToVercel();

    if (!deploySuccess) {
      await handleDeploymentFailure();
      process.exit(1);
    }

    // Phase 3: Verification
    log('\\n🏥 PHASE 3: Post-Deployment Verification', colors.bold);
    const verificationSuccess = await postDeploymentVerification();

    if (!verificationSuccess) {
      await handleDeploymentFailure();
      process.exit(1);
    }

    // Success!
    deploymentSuccess = true;
    const endTime = Date.now();
    const deploymentTime = Math.round((endTime - startTime) / 1000);

    log('\\n' + '='.repeat(60), colors.green);
    log('🎉 DEPLOYMENT SUCCESSFUL!', colors.bold + colors.green);
    log('='.repeat(60), colors.green);

    log(`\\n📊 Deployment Summary:`, colors.bold);
    log(`  ⏱️  Total time: ${deploymentTime} seconds`, colors.blue);
    log(`  🎯 Target URL: ${DEPLOYMENT_CONFIG.healthCheckUrl}`, colors.blue);
    log(`  ✅ StockTransfer stability fixes deployed`, colors.green);
    log(`  ✅ All health checks passed`, colors.green);

    log(`\\n🎯 Deployed Features:`, colors.bold);
    log(`  🛡️  StockTransferErrorBoundary with comprehensive error handling`, colors.green);
    log(`  🧹 Memory leak fixes and proper cleanup logic`, colors.green);
    log(`  🔧 Enhanced API error handling and recovery`, colors.green);
    log(`  ⚙️  Optimized Vercel configuration for better performance`, colors.green);

    log(`\\n📋 Post-Deployment Actions:`, colors.blue);
    log(`  1. Monitor system for any issues over next 24 hours`, colors.blue);
    log(`  2. Run additional StockTransfer tests if needed`, colors.blue);
    log(`  3. Update team on deployment completion`, colors.blue);
    log(`  4. Document lessons learned for future deployments`, colors.blue);
  } catch (error) {
    log(`\\n💥 Deployment process failed: ${error.message}`, colors.red);
    log('\\n🔍 Error details:', colors.dim);
    console.error(error);

    if (!deploymentSuccess) {
      log('\\n🔄 Consider running rollback if system is unstable', colors.yellow);
    }

    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\\n🛑 Deployment process interrupted by user', colors.yellow);
  log('⚠️  If deployment was in progress, check Vercel dashboard', colors.yellow);
  process.exit(130);
});

process.on('uncaughtException', error => {
  log(`\\n💥 Uncaught exception during deployment: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

// Run the deployment
main();
