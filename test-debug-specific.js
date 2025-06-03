#!/usr/bin/env node

// 測試特定查詢的執行邏輯
const { createClient } = require('@supabase/supabase-js');

// 直接檢查環境變量
console.log('🔍 Environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing');

// 從環境變量讀取配置
try {
  require('dotenv').config({ path: '.env.local' });
  console.log('✅ dotenv loaded');
} catch (err) {
  console.log('⚠️ dotenv not available, using process.env directly');
}

console.log('\n🔍 After dotenv:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase environment variables');
  console.log('Please check your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 模擬 applySingleCondition 函數
function applySingleCondition(query, condition, tableName) {
  console.log('[DEBUG] Processing condition:', condition);
  
  const lowerCondition = condition.toLowerCase();
  
  // 處理日期條件
  if (lowerCondition.includes('date(') && lowerCondition.includes('current_date')) {
    console.log('[DEBUG] ✅ Detected date condition');
    
    let dateField = 'created_at';
    if (tableName === 'record_palletinfo') {
      dateField = 'generate_time';
    }
    
    const today = new Date().toISOString().split('T')[0];
    console.log('[DEBUG] Today date:', today);
    
    if (lowerCondition.includes('= current_date') && !lowerCondition.includes('interval')) {
      console.log('[DEBUG] ✅ Applying today filter');
      query = query.gte(dateField, today + 'T00:00:00.000Z').lt(dateField, today + 'T23:59:59.999Z');
      console.log('[DEBUG] Date filter applied');
    }
  }
  
  // 處理GRN條件
  if (lowerCondition.includes('plt_remark')) {
    console.log('[DEBUG] ✅ Detected plt_remark condition');
    
    if (lowerCondition.includes('not like') && lowerCondition.includes('material grn')) {
      console.log('[DEBUG] ✅ Detected GRN exclusion pattern');
      console.log('[DEBUG] Original condition:', condition);
      query = query.or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');
      console.log('[DEBUG] GRN exclusion filter applied');
    } else if (lowerCondition.includes('like') && lowerCondition.includes('material grn')) {
      console.log('[DEBUG] ✅ Detected GRN inclusion pattern');
      query = query.like('plt_remark', '%Material GRN%');
      console.log('[DEBUG] GRN inclusion filter applied');
    } else {
      console.log('[DEBUG] ❌ No GRN pattern matched for condition:', condition);
    }
  }
  
  return query;
}

async function testSpecificQuery() {
  console.log('\n🔍 測試特定查詢的執行邏輯\n');
  
  // 測試的SQL條件
  const whereClause = 'DATE("generate_time") = CURRENT_DATE AND ("plt_remark" IS NULL OR "plt_remark" NOT LIKE \'%Material GRN%\')';
  console.log('原始WHERE條件:', whereClause);
  console.log('');
  
  // 步驟1：分解AND條件
  const conditions = whereClause.split(/\s+and\s+/i);
  console.log('分解後的條件:');
  conditions.forEach((condition, index) => {
    console.log(`  ${index + 1}. "${condition.trim()}"`);
  });
  console.log('');
  
  // 步驟2：逐個處理條件
  let query = supabase.from('record_palletinfo').select('*', { count: 'exact', head: true });
  
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i].trim();
    console.log(`\n🔧 處理條件 ${i + 1}: "${condition}"`);
    console.log('───────────────────────────────────────');
    
    query = applySingleCondition(query, condition, 'record_palletinfo');
  }
  
  // 步驟3：執行查詢
  console.log('\n🚀 執行最終查詢...');
  try {
    const { count, error } = await query;
    
    if (error) {
      console.error('❌ Query error:', error);
    } else {
      console.log('✅ 查詢成功');
      console.log('📊 結果:', count);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
  
  // 步驟4：驗證單獨的條件
  console.log('\n🧪 驗證單獨條件:');
  console.log('──────────────────────');
  
  // 只有日期條件
  console.log('\n1️⃣ 只有日期條件 (今天所有托盤):');
  const today = new Date().toISOString().split('T')[0];
  const { count: todayCount, error: todayError } = await supabase
    .from('record_palletinfo')
    .select('*', { count: 'exact', head: true })
    .gte('generate_time', today + 'T00:00:00.000Z')
    .lt('generate_time', today + 'T23:59:59.999Z');
  
  if (!todayError) {
    console.log('   今天總托盤:', todayCount);
  }
  
  // 只有GRN排除條件
  console.log('\n2️⃣ 只有GRN排除條件 (所有非GRN托盤):');
  const { count: nonGrnCount, error: nonGrnError } = await supabase
    .from('record_palletinfo')
    .select('*', { count: 'exact', head: true })
    .or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');
  
  if (!nonGrnError) {
    console.log('   所有非GRN托盤:', nonGrnCount);
  }
  
  // 正確的組合條件（使用鏈式調用）
  console.log('\n3️⃣ 正確的組合條件 (今天的非GRN托盤):');
  const { count: correctCount, error: correctError } = await supabase
    .from('record_palletinfo')
    .select('*', { count: 'exact', head: true })
    .gte('generate_time', today + 'T00:00:00.000Z')
    .lt('generate_time', today + 'T23:59:59.999Z')
    .or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');
  
  if (!correctError) {
    console.log('   今天非GRN托盤:', correctCount);
  }
  
  console.log('\n📈 預期結果對比:');
  console.log(`   今天總托盤(${todayCount}) - 今天GRN托盤 = 今天非GRN托盤`);
  console.log(`   應該等於: ${correctCount}`);
}

testSpecificQuery().catch(console.error); 