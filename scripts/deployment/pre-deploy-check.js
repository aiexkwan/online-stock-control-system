#!/usr/bin/env node

/**
 * Pre-deployment Check Script
 * Verifies system readiness before deploying to production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REQUIRED_FILES = [
  'vercel.json',
  'next.config.js',
  'package.json',
  '.env.local.template',
  '.env.production.template',
];

const CRITICAL_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
];

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

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    log(`  ✅ ${filePath}`, colors.green);
    return true;
  } else {
    log(`  ❌ ${filePath} - Missing`, colors.red);
    return false;
  }
}

function runCommand(command, description) {
  try {
    log(`  🔄 ${description}...`, colors.blue);
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 60000,
    });
    log(`  ✅ ${description} - Success`, colors.green);
    return { success: true, output };
  } catch (error) {
    log(`  ❌ ${description} - Failed: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

function checkVercelConfiguration() {
  log('\\n⚙️  Checking Vercel Configuration...', colors.bold);

  if (!fs.existsSync('vercel.json')) {
    log('  ❌ vercel.json not found', colors.red);
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    let issues = [];

    // Check functions configuration
    if (!config.functions) {
      issues.push('No functions configuration found');
    } else {
      // Check if maxDuration is set for API routes
      const apiConfig = config.functions['app/api/**/*.ts'];
      if (!apiConfig || !apiConfig.maxDuration || apiConfig.maxDuration < 15) {
        issues.push('API functions may have insufficient maxDuration');
      }

      if (!apiConfig || !apiConfig.memory || apiConfig.memory < 1024) {
        issues.push('API functions may have insufficient memory allocation');
      }
    }

    // Check security headers
    if (!config.headers || !Array.isArray(config.headers)) {
      issues.push('Security headers not configured');
    } else {
      const securityHeaders = config.headers.find(
        h =>
          h.headers &&
          h.headers.some(
            header => header.key === 'Content-Security-Policy' || header.key === 'X-Frame-Options'
          )
      );

      if (!securityHeaders) {
        issues.push('Security headers missing (CSP, X-Frame-Options)');
      }
    }

    if (issues.length === 0) {
      log('  ✅ Vercel configuration looks good', colors.green);
      return true;
    } else {
      log('  ⚠️  Vercel configuration issues:', colors.yellow);
      issues.forEach(issue => log(`    - ${issue}`, colors.yellow));
      return false;
    }
  } catch (error) {
    log(`  ❌ Failed to parse vercel.json: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  console.clear();
  log('🔍 Pre-Deployment Check', colors.bold + colors.blue);
  log('='.repeat(50), colors.blue);

  let allChecksPass = true;

  // 1. Check required files
  log('\\n📁 Checking Required Files...', colors.bold);
  for (const file of REQUIRED_FILES) {
    if (!checkFileExists(file)) {
      allChecksPass = false;
    }
  }

  // 2. Check environment variables
  log('\\n🔐 Checking Environment Variables...', colors.bold);
  const envPath = '.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const envVar of CRITICAL_ENV_VARS) {
      if (envContent.includes(`${envVar}=`)) {
        log(`  ✅ ${envVar}`, colors.green);
      } else {
        log(`  ❌ ${envVar} - Not found`, colors.red);
        allChecksPass = false;
      }
    }
  } else {
    log('  ❌ .env file not found', colors.red);
    allChecksPass = false;
  }

  // 3. Run build checks
  log('\\n🏗️  Running Build Checks...', colors.bold);

  const typeCheck = runCommand('npm run typecheck', 'TypeScript Type Check');
  if (!typeCheck.success) allChecksPass = false;

  const buildCheck = runCommand('npm run build', 'Next.js Build');
  if (!buildCheck.success) allChecksPass = false;

  // 4. Check Vercel configuration
  const vercelCheck = checkVercelConfiguration();
  if (!vercelCheck) allChecksPass = false;

  // 5. Run security checks
  log('\\n🛡️  Running Security Checks...', colors.bold);

  // Check for exposed secrets
  const envFile = fs.readFileSync('.env', 'utf8');
  if (envFile.includes('sk-') && !envFile.includes('sk-your-')) {
    log('  ⚠️  Potential OpenAI API key exposure in .env file', colors.yellow);
    log('  💡 Recommendation: Use .env.local for secrets', colors.blue);
  } else {
    log('  ✅ No obvious secret exposure detected', colors.green);
  }

  // Summary
  log('\\n' + '='.repeat(50), colors.blue);
  log('📊 Pre-Deployment Summary', colors.bold);
  log('='.repeat(50), colors.blue);

  if (allChecksPass) {
    log('🎉 ALL CHECKS PASSED - Ready for deployment!', colors.bold + colors.green);
    log('\\n🚀 Recommended next steps:', colors.blue);
    log('  1. Deploy to Vercel', colors.blue);
    log('  2. Run post-deployment health check', colors.blue);
    log('  3. Monitor for any issues', colors.blue);
    process.exit(0);
  } else {
    log('🚨 DEPLOYMENT NOT READY - Issues detected!', colors.bold + colors.red);
    log('\\n🔧 Please fix the above issues before deploying:', colors.yellow);
    log('  1. Address all ❌ marked items', colors.yellow);
    log('  2. Re-run this pre-deployment check', colors.yellow);
    log('  3. Proceed with deployment only after all checks pass', colors.yellow);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\\n🛑 Pre-deployment check interrupted', colors.yellow);
  process.exit(130);
});

// Run the pre-deployment check
main().catch(error => {
  log(`\\n💥 Pre-deployment check failed: ${error.message}`, colors.red);
  process.exit(1);
});
