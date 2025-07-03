#!/usr/bin/env tsx
/**
 * GraphQL Schema Validation Script
 * Week 1.2: Schema Design Principles Enhancement
 * Date: 2025-07-03
 * 
 * This script validates our unified GraphQL schema against design principles.
 * Usage: npm run validate-schema
 */

import fs from 'fs';
import path from 'path';
import SchemaValidator from '../lib/graphql/schema-validator';

const SCHEMA_PATH = path.join(process.cwd(), 'lib/graphql/schema.graphql');
const OUTPUT_DIR = path.join(process.cwd(), 'docs/schema-validation');

async function main() {
  console.log('🔍 GraphQL Schema Validation Started');
  console.log('='.repeat(50));
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Read schema file
    if (!fs.existsSync(SCHEMA_PATH)) {
      console.error(`❌ Schema file not found: ${SCHEMA_PATH}`);
      process.exit(1);
    }

    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    console.log(`📁 Reading schema from: ${SCHEMA_PATH}`);
    console.log(`📊 Schema size: ${(schemaContent.length / 1024).toFixed(2)} KB`);
    console.log('');

    // Create validator and run validation
    const validator = new SchemaValidator();
    console.log('🚀 Running validation...');
    
    const startTime = Date.now();
    const result = validator.validateSchema(schemaContent);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Validation completed in ${duration}ms`);
    console.log('');

    // Display results
    displayResults(result);

    // Generate detailed report
    const report = validator.generateReport(result);
    const reportPath = path.join(OUTPUT_DIR, `validation-report-${new Date().toISOString().split('T')[0]}.txt`);
    fs.writeFileSync(reportPath, report);
    console.log(`📝 Detailed report saved to: ${reportPath}`);

    // Generate JSON output for CI/CD
    const jsonOutput = {
      timestamp: new Date().toISOString(),
      isValid: result.isValid,
      summary: {
        errors: result.errors.filter(e => e.severity === 'ERROR').length,
        warnings: result.warnings.length,
        suggestions: result.suggestions.length
      },
      errors: result.errors,
      warnings: result.warnings,
      suggestions: result.suggestions
    };

    const jsonPath = path.join(OUTPUT_DIR, 'validation-result.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`📋 JSON output saved to: ${jsonPath}`);

    // Exit with appropriate code
    const hasErrors = result.errors.some(e => e.severity === 'ERROR');
    if (hasErrors) {
      console.log('');
      console.log('❌ Schema validation failed with errors');
      process.exit(1);
    } else {
      console.log('');
      console.log('✅ Schema validation passed!');
      
      if (result.warnings.length > 0) {
        console.log(`⚠️  Note: ${result.warnings.length} warnings found`);
      }
      
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Validation failed with exception:', error.message);
    process.exit(1);
  }
}

function displayResults(result: any) {
  console.log('📊 VALIDATION RESULTS');
  console.log('-'.repeat(30));
  
  // Summary
  console.log(`✅ Valid: ${result.isValid ? 'YES' : 'NO'}`);
  console.log(`❌ Errors: ${result.errors.filter((e: any) => e.severity === 'ERROR').length}`);
  console.log(`⚠️  Warnings: ${result.warnings.length}`);
  console.log(`💡 Suggestions: ${result.suggestions.length}`);
  console.log('');

  // Show critical errors
  const criticalErrors = result.errors.filter((e: any) => e.severity === 'ERROR');
  if (criticalErrors.length > 0) {
    console.log('🚨 CRITICAL ERRORS:');
    criticalErrors.slice(0, 5).forEach((error: any) => {
      console.log(`   ❌ [${error.type}] ${error.path}: ${error.message}`);
    });
    
    if (criticalErrors.length > 5) {
      console.log(`   ... and ${criticalErrors.length - 5} more errors`);
    }
    console.log('');
  }

  // Show top warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  TOP WARNINGS:');
    result.warnings.slice(0, 3).forEach((warning: any) => {
      console.log(`   ⚠️  [${warning.type}] ${warning.path}: ${warning.message}`);
    });
    
    if (result.warnings.length > 3) {
      console.log(`   ... and ${result.warnings.length - 3} more warnings`);
    }
    console.log('');
  }

  // Show some suggestions
  if (result.suggestions.length > 0) {
    console.log('💡 KEY SUGGESTIONS:');
    result.suggestions.slice(0, 3).forEach((suggestion: any) => {
      console.log(`   💡 ${suggestion}`);
    });
    
    if (result.suggestions.length > 3) {
      console.log(`   ... and ${result.suggestions.length - 3} more suggestions`);
    }
    console.log('');
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run the validation
if (require.main === module) {
  main();
} 