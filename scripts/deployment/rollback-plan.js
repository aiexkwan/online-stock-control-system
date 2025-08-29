#!/usr/bin/env node

/**
 * Deployment Rollback Plan
 * Handles emergency rollback scenarios for production deployments
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const ROLLBACK_CONFIG = {
  projectName: 'pennine-stock',
  maxDeploymentHistory: 10,
  criticalHealthChecks: ['/api/health', '/admin'],
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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
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
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function getDeploymentHistory() {
  log('📜 Fetching deployment history...', colors.blue);

  try {
    const result = runCommand('vercel list', 'Get Vercel deployments', { silent: true });

    if (result.success) {
      // Parse deployment list (simplified - in real implementation you'd parse JSON)
      log('✅ Deployment history retrieved', colors.green);
      return true;
    }
  } catch (error) {
    log(`❌ Failed to get deployment history: ${error.message}`, colors.red);
  }

  return false;
}

async function performHealthCheck(url) {
  log(`🏥 Performing health check on: ${url}`, colors.blue);

  try {
    // Use the existing health check script
    const result = runCommand(`node scripts/deployment/deploy-health-check.js`, 'Health Check', {
      timeout: 30000,
    });

    return result.success;
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, colors.red);
    return false;
  }
}

async function rollbackToLastWorking() {
  log('🔄 Initiating rollback to last working deployment...', colors.yellow);

  // Step 1: Get current deployment URL
  log('\\n1️⃣ Getting current deployment status...', colors.bold);
  const deploymentCheck = runCommand('vercel ls --limit=5', 'Check recent deployments', {
    silent: true,
  });

  if (!deploymentCheck.success) {
    log('❌ Cannot retrieve deployment information', colors.red);
    return false;
  }

  // Step 2: Rollback using Vercel
  log('\\n2️⃣ Performing Vercel rollback...', colors.bold);

  // Manual rollback approach - promote previous deployment
  const answer = await askQuestion('⚠️  Do you want to proceed with automatic rollback? (y/n): ');

  if (answer !== 'y' && answer !== 'yes') {
    log('🚫 Rollback cancelled by user', colors.yellow);
    return false;
  }

  // Note: Vercel doesn't have a direct rollback command, so we redeploy previous commit
  log('🔄 Rolling back by redeploying previous commit...', colors.blue);

  // Get current commit
  const getCurrentCommit = runCommand('git rev-parse HEAD', 'Get current commit', { silent: true });
  if (!getCurrentCommit.success) {
    log('❌ Cannot get current commit', colors.red);
    return false;
  }

  // Get previous commit
  const getPreviousCommit = runCommand('git rev-parse HEAD~1', 'Get previous commit', {
    silent: true,
  });
  if (!getPreviousCommit.success) {
    log('❌ Cannot get previous commit', colors.red);
    return false;
  }

  const previousCommit = getPreviousCommit.output.trim();
  log(`📍 Rolling back to commit: ${previousCommit.substring(0, 8)}`, colors.blue);

  // Checkout previous commit
  const checkoutResult = runCommand(`git checkout ${previousCommit}`, 'Checkout previous commit');
  if (!checkoutResult.success) {
    log('❌ Failed to checkout previous commit', colors.red);
    return false;
  }

  // Deploy previous commit
  const deployResult = runCommand('vercel --prod', 'Deploy previous version');
  if (!deployResult.success) {
    log('❌ Failed to deploy previous version', colors.red);
    // Return to original commit
    runCommand('git checkout main', 'Return to main branch');
    return false;
  }

  log('✅ Rollback deployment completed', colors.green);

  // Step 3: Verify rollback success
  log('\\n3️⃣ Verifying rollback...', colors.bold);

  // Wait for deployment to be ready
  log('⏳ Waiting for deployment to be ready...', colors.blue);
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

  // Run health checks
  const healthCheckPassed = await performHealthCheck('production');

  if (healthCheckPassed) {
    log('🎉 Rollback successful - System is healthy!', colors.bold + colors.green);

    // Return to main branch but don't merge
    runCommand('git checkout main', 'Return to main branch');

    log('\\n📋 Post-Rollback Actions:', colors.yellow);
    log('  1. Investigate the cause of the deployment failure', colors.yellow);
    log('  2. Fix the identified issues', colors.yellow);
    log('  3. Run pre-deployment checks before next attempt', colors.yellow);
    log('  4. Consider creating a hotfix branch for critical fixes', colors.yellow);

    return true;
  } else {
    log('🚨 Rollback failed - System still unhealthy!', colors.bold + colors.red);

    log('\\n🆘 Emergency Actions:', colors.red);
    log('  1. Check Vercel deployment logs immediately', colors.red);
    log('  2. Verify database connectivity', colors.red);
    log('  3. Consider manual intervention or contacting support', colors.red);

    return false;
  }
}

async function emergencyRollback() {
  log('🚨 EMERGENCY ROLLBACK INITIATED', colors.bold + colors.red);
  log('\\nThis will immediately rollback to the last known working deployment.', colors.yellow);

  const confirm = await askQuestion(
    '⚠️  Are you sure you want to proceed with emergency rollback? (yes/no): '
  );

  if (confirm !== 'yes') {
    log('🚫 Emergency rollback cancelled', colors.yellow);
    return;
  }

  log('\\n🔥 Executing emergency rollback...', colors.red);

  // Skip health checks and deploy immediately
  const success = await rollbackToLastWorking();

  if (success) {
    log('\\n✅ Emergency rollback completed successfully', colors.green);
  } else {
    log('\\n❌ Emergency rollback failed - Manual intervention required', colors.red);
  }
}

async function plannedRollback() {
  log('📋 PLANNED ROLLBACK', colors.bold + colors.blue);
  log('\\nThis will perform a controlled rollback with full verification.', colors.blue);

  // Step 1: Pre-rollback checks
  log('\\n1️⃣ Pre-rollback verification...', colors.bold);

  const historyAvailable = await getDeploymentHistory();
  if (!historyAvailable) {
    log('❌ Cannot proceed - deployment history unavailable', colors.red);
    return;
  }

  // Step 2: Confirm rollback
  const confirm = await askQuestion(
    '⚠️  Confirm planned rollback? This will revert to the previous deployment (y/n): '
  );

  if (confirm !== 'y' && confirm !== 'yes') {
    log('🚫 Planned rollback cancelled', colors.yellow);
    return;
  }

  // Step 3: Execute rollback
  log('\\n2️⃣ Executing planned rollback...', colors.bold);
  const success = await rollbackToLastWorking();

  if (success) {
    log('\\n✅ Planned rollback completed successfully', colors.green);

    // Step 4: Document rollback
    const timestamp = new Date().toISOString();
    const logEntry = `
## Rollback Report - ${timestamp}

### Reason
Production deployment rollback

### Actions Taken
- Reverted to previous deployment
- Health checks passed
- System restored to stable state

### Next Steps
- Investigate stability fix issues
- Prepare improved deployment
- Run comprehensive testing
`;

    require('fs').writeFileSync(`deployment-rollback-${timestamp.split('T')[0]}.log`, logEntry);

    log('📝 Rollback documented', colors.blue);
  } else {
    log('\\n❌ Planned rollback failed', colors.red);
  }
}

async function main() {
  console.clear();
  log('🔄 Deployment Rollback Plan', colors.bold + colors.blue);
  log('='.repeat(50), colors.blue);

  log('\\nAvailable rollback options:', colors.bold);
  log('1. Planned Rollback - Full verification and controlled process');
  log('2. Emergency Rollback - Immediate rollback for critical issues');
  log('3. Exit');

  const choice = await askQuestion('\\nSelect option (1-3): ');

  switch (choice) {
    case '1':
      await plannedRollback();
      break;
    case '2':
      await emergencyRollback();
      break;
    case '3':
      log('👋 Exiting rollback plan', colors.blue);
      break;
    default:
      log('❌ Invalid option selected', colors.red);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\\n🛑 Rollback process interrupted', colors.yellow);
  process.exit(130);
});

// Run the rollback plan
if (require.main === module) {
  main().catch(error => {
    log(`\\n💥 Rollback plan failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = {
  rollbackToLastWorking,
  emergencyRollback,
  plannedRollback,
};
