import { createClient } from '@supabase/supabase-js';
import { DatabaseRecord } from '@/lib/types/database';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  console.log('🔍 Connecting to Supabase database...');
  console.log(`📍 Project URL: ${supabaseUrl}`);
  console.log(`🆔 Project ID: bbmkuiplnzvpudszrend\n`);

  try {
    // First, let's try to get a list of known tables
    const knownTables = [
      // Record tables (transaction/history)
      'record_palletinfo',
      'record_history',
      'record_transfer',
      'record_inventory',
      'record_aco',
      'record_grn',
      'record_void',
      // Data tables (master data)
      'data_code',
      'data_supplier',
      'data_id',
      'data_location',
      // Other tables
      'query_record',
      'system_logs',
      'audit_logs',
      'warehouse_config',
      'print_queue',
      'report_templates'
    ];

    console.log('📊 Checking tables in the database:\n');

    const tableInfo: Array<{name: string, exists: boolean, count?: number}> = [];

    // Check each table
    for (const tableName of knownTables) {
      try {
        // Try to count rows to verify table exists
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableInfo.push({ name: tableName, exists: true, count: count || 0 });
        } else {
          tableInfo.push({ name: tableName, exists: false });
        }
      } catch (err) {
        tableInfo.push({ name: tableName, exists: false });
      }
    }

    // Display results grouped by category
    console.log('📁 Record Tables (Transaction/History)');
    console.log('─'.repeat(50));
    tableInfo.filter((t: any) => t.name.startsWith('record_')).forEach(table => {
      if (table.exists) {
        console.log(`  ✅ ${table.name}: ${table.count?.toLocaleString()} records`);
      } else {
        console.log(`  ❌ ${table.name}: Not found`);
      }
    });

    console.log('\n📁 Data Tables (Master Data)');
    console.log('─'.repeat(50));
    tableInfo.filter((t: any) => t.name.startsWith('data_')).forEach(table => {
      if (table.exists) {
        console.log(`  ✅ ${table.name}: ${table.count?.toLocaleString()} records`);
      } else {
        console.log(`  ❌ ${table.name}: Not found`);
      }
    });

    console.log('\n📁 Other Tables');
    console.log('─'.repeat(50));
    tableInfo.filter((t: any) => !t.name.startsWith('record_') && !t.name.startsWith('data_')).forEach(table => {
      if (table.exists) {
        console.log(`  ✅ ${table.name}: ${table.count?.toLocaleString()} records`);
      } else {
        console.log(`  ❌ ${table.name}: Not found`);
      }
    });

    // Summary
    const existingTables = tableInfo.filter((t: any) => t.exists);
    const totalRecords = existingTables.reduce((sum, t) => sum + (t.count || 0), 0);
    
    console.log('\n📊 Summary');
    console.log('─'.repeat(50));
    console.log(`  Total tables found: ${existingTables.length}`);
    console.log(`  Total records: ${totalRecords.toLocaleString()}`);

    // Try alternative method using RPC for table list
    console.log('\n🔍 Attempting to get full table list via SQL...');
    try {
      const { data, error } = await supabase.rpc('execute_sql_query', {
        query_text: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      });

      if (!error && data) {
        console.log('\n📋 Complete list of public tables:');
        console.log('─'.repeat(50));
        data.forEach((row: DatabaseRecord) => {
          const isKnown = knownTables.includes(row.table_name);
          const icon = isKnown ? '✅' : '🆕';
          console.log(`  ${icon} ${row.table_name}`);
        });
      }
    } catch (err) {
      console.log('  ⚠️  Unable to query information_schema directly');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
listAllTables().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});