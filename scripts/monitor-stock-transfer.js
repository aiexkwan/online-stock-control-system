#!/usr/bin/env node

/**
 * Stock Transfer 監控腳本
 * 實時監控 stock transfer 操作同 record_history
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 顏色代碼
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function formatLog(log) {
  const icon = '✅'; // record_history 只記錄成功的操作
  const color = colors.green;
  const time = new Date(log.time).toLocaleString('en-US', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log(`${color}${icon} [${time}] User ${log.id}: ${log.action}${colors.reset}`);
  console.log(`   ${colors.cyan}Pallet ${log.plt_num} → ${log.loc}: ${log.remark}${colors.reset}`);
  console.log('');
}

async function getRecentLogs() {
  const { data, error } = await supabase
    .from('record_history')
    .select('*')
    .eq('action', 'Stock Transfer')
    .order('time', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching logs:', error);
    return [];
  }

  return data || [];
}

async function getTransferStats() {
  const { data, error } = await supabase
    .from('record_transfer')
    .select('*')
    .gte('tran_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('tran_date', { ascending: false });

  if (error) {
    console.error('❌ Error fetching transfers:', error);
    return null;
  }

  const stats = {
    total: data.length,
    byLocation: {},
    byOperator: {}
  };

  data.forEach(transfer => {
    // Count by location
    const route = `${transfer.f_loc} → ${transfer.t_loc}`;
    stats.byLocation[route] = (stats.byLocation[route] || 0) + 1;

    // Count by operator
    stats.byOperator[transfer.operator_id] = (stats.byOperator[transfer.operator_id] || 0) + 1;
  });

  return stats;
}

async function displayDashboard() {
  console.clear();
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}      Stock Transfer Monitoring Dashboard          ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log('');

  // Get stats
  const stats = await getTransferStats();
  if (stats) {
    console.log(`${colors.yellow}📊 Last 24 Hours Statistics:${colors.reset}`);
    console.log(`   Total Transfers: ${colors.bright}${stats.total}${colors.reset}`);
    console.log('');

    console.log(`${colors.yellow}📍 By Route:${colors.reset}`);
    Object.entries(stats.byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([route, count]) => {
        console.log(`   ${route}: ${colors.bright}${count}${colors.reset}`);
      });
    console.log('');

    console.log(`${colors.yellow}👤 By Operator:${colors.reset}`);
    Object.entries(stats.byOperator)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([operator, count]) => {
        console.log(`   Operator ${operator}: ${colors.bright}${count}${colors.reset}`);
      });
    console.log('');
  }

  // Get recent logs
  console.log(`${colors.yellow}📋 Recent Transfer Logs:${colors.reset}`);
  console.log('');

  const logs = await getRecentLogs();
  logs.forEach(formatLog);

  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`Press Ctrl+C to exit | Refreshing every 5 seconds...`);
}

// Initial display
displayDashboard();

// Refresh every 5 seconds
setInterval(displayDashboard, 5000);

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoring stopped');
  process.exit(0);
});
