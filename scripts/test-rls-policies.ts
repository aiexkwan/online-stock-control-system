#!/usr/bin/env node

/**
 * RLS Policy Testing Script
 * Automated testing of Row-Level Security policies across all tables
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RLSTestResult {
  table: string;
  policy: string;
  operation: string;
  role: string;
  passed: boolean;
  message: string;
}

interface TableRLSStatus {
  table: string;
  rlsEnabled: boolean;
  policies: any[];
}

class RLSPolicyTester {
  private serviceClient;
  private results: RLSTestResult[] = [];

  constructor() {
    this.serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Get all tables with RLS status
   */
  async getAllTablesWithRLS(): Promise<TableRLSStatus[]> {
    const { data, error } = await this.serviceClient.rpc('get_tables_rls_status');

    if (error) {
      // Fallback to direct query
      const query = `
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;

      const { data: tables } = await this.serviceClient.rpc('execute_sql', { query });

      return (
        tables?.map((t: any) => ({
          table: t.tablename,
          rlsEnabled: t.rowsecurity,
          policies: [],
        })) || []
      );
    }

    return data || [];
  }

  /**
   * Get RLS policies for a table
   */
  async getTablePolicies(tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        polname as name,
        polcmd as command,
        polroles::text as roles,
        polqual::text as using_expression,
        polwithcheck::text as check_expression
      FROM pg_policy
      JOIN pg_class ON pg_policy.polrelid = pg_class.oid
      WHERE pg_class.relname = '${tableName}'
        AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `;

    const { data } = await this.serviceClient.rpc('execute_sql', { query });
    return data || [];
  }

  /**
   * Test SELECT operation with RLS
   */
  async testSelectOperation(table: string, role: string): Promise<boolean> {
    try {
      // Create test client with specific role
      const { data: auth } = await this.createTestUser(role);
      if (!auth) return false;

      const testClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${auth.session?.access_token}`,
          },
        },
      });

      const { data, error } = await testClient.from(table).select('*').limit(1);

      // Cleanup test user
      await this.cleanupTestUser(auth.user?.id);

      // Determine if access should be allowed based on role and table
      const shouldHaveAccess = this.shouldHaveReadAccess(table, role);

      if (shouldHaveAccess && !error) {
        return true;
      } else if (!shouldHaveAccess && error) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error testing SELECT on ${table} for ${role}:`, error);
      return false;
    }
  }

  /**
   * Test INSERT operation with RLS
   */
  async testInsertOperation(table: string, role: string): Promise<boolean> {
    try {
      const { data: auth } = await this.createTestUser(role);
      if (!auth) return false;

      const testClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${auth.session?.access_token}`,
          },
        },
      });

      const testData = this.generateTestData(table, auth.user?.id);
      const { error } = await testClient.from(table).insert(testData);

      // Cleanup
      await this.cleanupTestUser(auth.user?.id);
      if (!error) {
        await this.serviceClient.from(table).delete().match(testData);
      }

      const shouldHaveAccess = this.shouldHaveWriteAccess(table, role);
      return shouldHaveAccess ? !error : !!error;
    } catch (error) {
      console.error(`Error testing INSERT on ${table} for ${role}:`, error);
      return false;
    }
  }

  /**
   * Test UPDATE operation with RLS
   */
  async testUpdateOperation(table: string, role: string): Promise<boolean> {
    try {
      // First insert test data as service role
      const testData = this.generateTestData(table, 'test-user-id');
      const { data: inserted } = await this.serviceClient
        .from(table)
        .insert(testData)
        .select()
        .single();

      if (!inserted) return false;

      // Create test user and try to update
      const { data: auth } = await this.createTestUser(role);
      if (!auth) return false;

      const testClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${auth.session?.access_token}`,
          },
        },
      });

      const { error } = await testClient
        .from(table)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', inserted.id);

      // Cleanup
      await this.serviceClient.from(table).delete().eq('id', inserted.id);
      await this.cleanupTestUser(auth.user?.id);

      const shouldHaveAccess = this.shouldHaveUpdateAccess(table, role);
      return shouldHaveAccess ? !error : !!error;
    } catch (error) {
      console.error(`Error testing UPDATE on ${table} for ${role}:`, error);
      return false;
    }
  }

  /**
   * Test DELETE operation with RLS
   */
  async testDeleteOperation(table: string, role: string): Promise<boolean> {
    try {
      // First insert test data
      const testData = this.generateTestData(table, 'test-user-id');
      const { data: inserted } = await this.serviceClient
        .from(table)
        .insert(testData)
        .select()
        .single();

      if (!inserted) return false;

      // Create test user and try to delete
      const { data: auth } = await this.createTestUser(role);
      if (!auth) return false;

      const testClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${auth.session?.access_token}`,
          },
        },
      });

      const { error } = await testClient.from(table).delete().eq('id', inserted.id);

      // Cleanup if delete failed
      if (error) {
        await this.serviceClient.from(table).delete().eq('id', inserted.id);
      }
      await this.cleanupTestUser(auth.user?.id);

      const shouldHaveAccess = this.shouldHaveDeleteAccess(table, role);
      return shouldHaveAccess ? !error : !!error;
    } catch (error) {
      console.error(`Error testing DELETE on ${table} for ${role}:`, error);
      return false;
    }
  }

  /**
   * Run all RLS tests
   */
  async runAllTests() {
    console.log(chalk.blue.bold('\n🔒 RLS Policy Testing Started\n'));

    // Get all tables with RLS status
    const tables = await this.getAllTablesWithRLS();

    console.log(chalk.yellow(`Found ${tables.length} tables to test\n`));

    for (const tableInfo of tables) {
      console.log(chalk.cyan(`\nTesting table: ${tableInfo.table}`));
      console.log(chalk.gray(`RLS Enabled: ${tableInfo.rlsEnabled ? '✅' : '❌'}`));

      if (!tableInfo.rlsEnabled) {
        this.results.push({
          table: tableInfo.table,
          policy: 'N/A',
          operation: 'N/A',
          role: 'N/A',
          passed: false,
          message: 'RLS is not enabled on this table',
        });
        continue;
      }

      // Get policies for this table
      const policies = await this.getTablePolicies(tableInfo.table);
      console.log(chalk.gray(`Policies found: ${policies.length}`));

      // Test different operations for different roles
      const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
      const roles = ['authenticated', 'viewer', 'admin'];

      for (const operation of operations) {
        for (const role of roles) {
          const testMethod = `test${operation.charAt(0) + operation.slice(1).toLowerCase()}Operation`;
          const passed = await (this as any)[testMethod](tableInfo.table, role);

          this.results.push({
            table: tableInfo.table,
            policy: `${operation.toLowerCase()}_policy`,
            operation,
            role,
            passed,
            message: passed ? 'Policy working correctly' : 'Policy may have issues',
          });

          const icon = passed ? '✅' : '❌';
          const color = passed ? chalk.green : chalk.red;
          console.log(color(`  ${icon} ${operation} as ${role}: ${passed ? 'PASS' : 'FAIL'}`));
        }
      }
    }

    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log(chalk.blue.bold('\n📊 Test Summary\n'));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);

    console.log(chalk.white(`Total Tests: ${totalTests}`));
    console.log(chalk.green(`Passed: ${passedTests}`));
    console.log(chalk.red(`Failed: ${failedTests}`));
    console.log(chalk.yellow(`Pass Rate: ${passRate}%`));

    // Group failures by table
    const failuresByTable = this.results
      .filter(r => !r.passed)
      .reduce(
        (acc, r) => {
          if (!acc[r.table]) acc[r.table] = [];
          acc[r.table].push(r);
          return acc;
        },
        {} as Record<string, RLSTestResult[]>
      );

    if (Object.keys(failuresByTable).length > 0) {
      console.log(chalk.red.bold('\n❌ Failed Tests:\n'));

      for (const [table, failures] of Object.entries(failuresByTable)) {
        console.log(chalk.yellow(`Table: ${table}`));
        for (const failure of failures) {
          console.log(chalk.red(`  - ${failure.operation} as ${failure.role}: ${failure.message}`));
        }
      }
    }

    // Security recommendations
    console.log(chalk.blue.bold('\n🔐 Security Recommendations:\n'));

    const tablesWithoutRLS = this.results.filter(r => r.message.includes('RLS is not enabled'));
    if (tablesWithoutRLS.length > 0) {
      console.log(chalk.red('⚠️  Enable RLS on the following tables:'));
      tablesWithoutRLS.forEach(t => console.log(chalk.red(`  - ${t.table}`)));
    }

    const criticalFailures = this.results.filter(
      r => !r.passed && r.role === 'viewer' && ['INSERT', 'UPDATE', 'DELETE'].includes(r.operation)
    );

    if (criticalFailures.length > 0) {
      console.log(chalk.red('\n⚠️  Critical: Viewers have write access to:'));
      const affectedTables = [...new Set(criticalFailures.map(f => f.table))];
      affectedTables.forEach(t => console.log(chalk.red(`  - ${t}`)));
    }

    // Export results
    this.exportResults();
  }

  /**
   * Export test results to file
   */
  exportResults() {
    const fs = require('fs');
    const path = require('path');

    const reportDir = path.join(process.cwd(), 'security-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `rls-test-report-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      results: this.results,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n✅ Report saved to: ${reportPath}`));
  }

  // Helper methods

  private async createTestUser(role: string) {
    const email = `test-${role}-${Date.now()}@test.com`;
    const password = 'TestPassword123!';

    return await this.serviceClient.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });
  }

  private async cleanupTestUser(userId?: string) {
    if (userId) {
      await this.serviceClient.auth.admin.deleteUser(userId);
    }
  }

  private generateTestData(table: string, userId: string) {
    // Generate appropriate test data based on table
    const baseData: any = {
      created_at: new Date().toISOString(),
    };

    // Add table-specific fields
    switch (table) {
      case 'users':
        return { ...baseData, id: userId, email: `test-${Date.now()}@test.com` };
      case 'orders':
        return { ...baseData, user_id: userId, status: 'pending' };
      case 'products':
        return { ...baseData, name: 'Test Product', sku: `TEST-${Date.now()}` };
      default:
        return baseData;
    }
  }

  private shouldHaveReadAccess(table: string, role: string): boolean {
    // Define read access rules
    const publicTables = ['products', 'locations', 'suppliers'];
    if (publicTables.includes(table)) return true;

    if (role === 'admin') return true;
    if (role === 'viewer') return ['products', 'locations'].includes(table);

    return false;
  }

  private shouldHaveWriteAccess(table: string, role: string): boolean {
    if (role === 'admin') return true;
    if (role === 'viewer') return false;

    const userWritableTables = ['orders', 'dashboard_settings'];
    return userWritableTables.includes(table);
  }

  private shouldHaveUpdateAccess(table: string, role: string): boolean {
    return this.shouldHaveWriteAccess(table, role);
  }

  private shouldHaveDeleteAccess(table: string, role: string): boolean {
    if (role === 'admin') return true;
    return false;
  }
}

// Run tests
async function main() {
  try {
    const tester = new RLSPolicyTester();
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('Error running RLS tests:'), error);
    process.exit(1);
  }
}

// Check if required environment variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(chalk.red('Missing required environment variables:'));
  console.error(chalk.red('- NEXT_PUBLIC_SUPABASE_URL'));
  console.error(chalk.red('- SUPABASE_SERVICE_ROLE_KEY'));
  process.exit(1);
}

main();
