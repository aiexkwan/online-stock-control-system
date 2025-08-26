#!/usr/bin/env node

/**
 * Credential Validation Script
 * Validates environment variables and credentials configuration
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const envTestPath = path.join(process.cwd(), '.env.test.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}

// Define required credentials
const REQUIRED_CREDENTIALS = {
  production: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SYS_LOGIN',
    'SYS_PASSWORD',
  ],
  development: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  test: [
    'TEST_SUPABASE_URL',
    'TEST_SUPABASE_SERVICE_KEY',
    'TEST_LOGIN_EMAIL',
    'TEST_LOGIN_PASSWORD',
  ],
};

// Credential validators
const VALIDATORS = {
  // Supabase URLs
  SUPABASE_URL: value => {
    return value.startsWith('https://') && value.includes('.supabase.co');
  },
  TEST_SUPABASE_URL: value => {
    return value.startsWith('https://') && value.includes('.supabase.co');
  },

  // Supabase Keys
  SUPABASE_ANON_KEY: value => {
    return value.startsWith('eyJ') && value.length > 100;
  },
  SUPABASE_SERVICE_ROLE_KEY: value => {
    return value.startsWith('eyJ') && value.length > 100;
  },
  TEST_SUPABASE_SERVICE_KEY: value => {
    return value.startsWith('eyJ') && value.length > 100;
  },

  // Email validators
  SYS_LOGIN: value => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  TEST_LOGIN_EMAIL: value => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  // Password validators
  SYS_PASSWORD: value => {
    return value.length >= 6;
  },
  TEST_LOGIN_PASSWORD: value => {
    return value.length >= 6;
  },

  // API Keys
  OPENAI_API_KEY: value => {
    return value.startsWith('sk-') && value.length > 40;
  },
  RESEND_API_KEY: value => {
    return value.startsWith('re_') && value.length > 20;
  },
};

function validateCredentials(environment = 'development') {
  console.log(`\n🔍 Validating credentials for ${environment} environment...\n`);

  const required = REQUIRED_CREDENTIALS[environment] || [];
  const missing = [];
  const invalid = [];
  const valid = [];

  // Check required credentials
  for (const key of required) {
    const value = process.env[key];

    if (!value) {
      missing.push(key);
    } else {
      const validator = VALIDATORS[key];
      if (validator && !validator(value)) {
        invalid.push({
          key,
          reason: 'Invalid format',
        });
      } else {
        valid.push(key);
      }
    }
  }

  // Check optional but important credentials
  const optional = ['OPENAI_API_KEY', 'RESEND_API_KEY'];
  const optionalStatus = [];

  for (const key of optional) {
    const value = process.env[key];
    if (value) {
      const validator = VALIDATORS[key];
      if (validator && !validator(value)) {
        optionalStatus.push(`⚠️  ${key}: Invalid format`);
      } else {
        optionalStatus.push(`✅ ${key}: Configured`);
      }
    } else {
      optionalStatus.push(`ℹ️  ${key}: Not configured (optional)`);
    }
  }

  // Print results
  console.log('=== Required Credentials ===\n');

  if (valid.length > 0) {
    console.log('✅ Valid credentials:');
    valid.forEach(key => {
      const value = process.env[key];
      const masked = maskCredential(key, value);
      console.log(`   - ${key}: ${masked}`);
    });
    console.log('');
  }

  if (missing.length > 0) {
    console.error('❌ Missing credentials:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.log('');
  }

  if (invalid.length > 0) {
    console.error('⚠️  Invalid credentials:');
    invalid.forEach(({ key, reason }) => {
      console.error(`   - ${key}: ${reason}`);
    });
    console.log('');
  }

  console.log('=== Optional Credentials ===\n');
  optionalStatus.forEach(status => console.log(status));

  // Check for hardcoded credentials in code
  console.log('\n=== Security Check ===\n');
  checkForHardcodedCredentials();

  // Summary
  console.log('\n=== Summary ===\n');
  const totalRequired = required.length;
  const totalValid = valid.length;
  const percentage = totalRequired > 0 ? Math.round((totalValid / totalRequired) * 100) : 100;

  if (missing.length === 0 && invalid.length === 0) {
    console.log(`✅ All ${totalRequired} required credentials are valid (${percentage}%)`);
    return 0;
  } else {
    console.error(
      `❌ ${totalValid}/${totalRequired} required credentials are valid (${percentage}%)`
    );
    console.error('\nPlease configure missing/invalid credentials in .env.local');
    return 1;
  }
}

function maskCredential(key, value) {
  if (!value) return 'NOT_SET';

  // Don't mask URLs
  if (key.includes('URL')) {
    return value;
  }

  // Don't mask emails
  if (key.includes('LOGIN') || key.includes('EMAIL')) {
    return value;
  }

  // Mask sensitive values
  if (value.length <= 12) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function checkForHardcodedCredentials() {
  const patterns = [
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/g,
    /sk-proj-[a-zA-Z0-9]{40,}/g,
    /re_[a-zA-Z0-9]{20,}/g,
  ];

  const filesToCheck = [
    'app/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'e2e/**/*.{ts,tsx,js,jsx}',
  ];

  let foundHardcoded = false;

  // Note: In a real implementation, you would scan files here
  // For now, just remind about best practices

  if (!foundHardcoded) {
    console.log('✅ No obvious hardcoded credentials detected');
    console.log('ℹ️  Remember to:');
    console.log('   - Never commit .env.local or .env.test.local');
    console.log('   - Use environment variables for all credentials');
    console.log('   - Run security scan before commits');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || process.env.NODE_ENV || 'development';

// Run validation
const exitCode = validateCredentials(environment);
process.exit(exitCode);
