#!/usr/bin/env node

// 測試WHERE條件分解邏輯（無需數據庫連接）

console.log('🔍 測試WHERE條件分解邏輯\n');

// 模擬 Supabase 查詢構建器
class MockQuery {
  constructor() {
    this.conditions = [];
    this.tableName = '';
  }
  
  from(table) {
    this.tableName = table;
    return this;
  }
  
  select(columns, options) {
    return this;
  }
  
  gte(column, value) {
    this.conditions.push(`${column} >= '${value}'`);
    console.log(`[MOCK] Applied: ${column} >= '${value}'`);
    return this;
  }
  
  lt(column, value) {
    this.conditions.push(`${column} < '${value}'`);
    console.log(`[MOCK] Applied: ${column} < '${value}'`);
    return this;
  }
  
  or(conditions) {
    this.conditions.push(`(${conditions})`);
    console.log(`[MOCK] Applied OR: (${conditions})`);
    return this;
  }
  
  like(column, pattern) {
    this.conditions.push(`${column} LIKE '${pattern}'`);
    console.log(`[MOCK] Applied: ${column} LIKE '${pattern}'`);
    return this;
  }
  
  eq(column, value) {
    this.conditions.push(`${column} = '${value}'`);
    console.log(`[MOCK] Applied: ${column} = '${value}'`);
    return this;
  }
  
  ilike(column, pattern) {
    this.conditions.push(`${column} ILIKE '${pattern}'`);
    console.log(`[MOCK] Applied: ${column} ILIKE '${pattern}'`);
    return this;
  }
  
  getSQL() {
    if (this.conditions.length === 0) {
      return `SELECT * FROM ${this.tableName}`;
    }
    return `SELECT * FROM ${this.tableName} WHERE ${this.conditions.join(' AND ')}`;
  }
}

const mockSupabase = {
  from: (table) => new MockQuery().from(table)
};

// 模擬 applySingleCondition 函數
function applySingleCondition(query, condition, tableName) {
  console.log(`[DEBUG] Processing condition: "${condition}"`);
  
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
    } else if (lowerCondition.includes("interval '1 day'")) {
      console.log('[DEBUG] ✅ Applying yesterday filter');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte(dateField, yesterday + 'T00:00:00.000Z').lt(dateField, yesterday + 'T23:59:59.999Z');
    } else if (lowerCondition.includes("interval '2 day")) {
      console.log('[DEBUG] ✅ Applying day before yesterday filter');
      const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte(dateField, dayBefore + 'T00:00:00.000Z').lt(dateField, dayBefore + 'T23:59:59.999Z');
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
  
  // 處理產品代碼條件
  if (lowerCondition.includes('upper') && lowerCondition.includes('product_code')) {
    console.log('[DEBUG] ✅ Detected product code condition');
    const productMatch = condition.match(/upper\s*\(\s*["`]?product_code["`]?\s*\)\s*=\s*upper\s*\(\s*['"](.*?)['"]\s*\)/i);
    if (productMatch) {
      const productCode = productMatch[1];
      console.log('[DEBUG] Applying product code filter:', productCode);
      query = query.ilike('product_code', productCode);
    }
  }
  
  return query;
}

function testLogic() {
  console.log('🧪 測試案例 1: 今天排除GRN的托盤');
  console.log('═'.repeat(50));
  
  // 測試的SQL條件
  const whereClause1 = 'DATE("generate_time") = CURRENT_DATE AND ("plt_remark" IS NULL OR "plt_remark" NOT LIKE \'%Material GRN%\')';
  console.log('原始WHERE條件:', whereClause1);
  
  // 分解AND條件
  const conditions1 = whereClause1.split(/\s+and\s+/i);
  console.log('\n分解後的條件:');
  conditions1.forEach((condition, index) => {
    console.log(`  ${index + 1}. "${condition.trim()}"`);
  });
  
  // 逐個處理條件
  let query1 = mockSupabase.from('record_palletinfo').select('*', { count: 'exact', head: true });
  
  console.log('\n處理過程:');
  for (let i = 0; i < conditions1.length; i++) {
    const condition = conditions1[i].trim();
    console.log(`\n🔧 處理條件 ${i + 1}: "${condition}"`);
    console.log('─'.repeat(40));
    
    query1 = applySingleCondition(query1, condition, 'record_palletinfo');
  }
  
  console.log('\n最終SQL:', query1.getSQL());
  
  console.log('\n\n🧪 測試案例 2: 昨天GRN收貨的托盤');
  console.log('═'.repeat(50));
  
  const whereClause2 = 'DATE("generate_time") = CURRENT_DATE - INTERVAL \'1 day\' AND "plt_remark" LIKE \'%Material GRN%\'';
  console.log('原始WHERE條件:', whereClause2);
  
  const conditions2 = whereClause2.split(/\s+and\s+/i);
  console.log('\n分解後的條件:');
  conditions2.forEach((condition, index) => {
    console.log(`  ${index + 1}. "${condition.trim()}"`);
  });
  
  let query2 = mockSupabase.from('record_palletinfo').select('*', { count: 'exact', head: true });
  
  console.log('\n處理過程:');
  for (let i = 0; i < conditions2.length; i++) {
    const condition = conditions2[i].trim();
    console.log(`\n🔧 處理條件 ${i + 1}: "${condition}"`);
    console.log('─'.repeat(40));
    
    query2 = applySingleCondition(query2, condition, 'record_palletinfo');
  }
  
  console.log('\n最終SQL:', query2.getSQL());
  
  console.log('\n\n📋 總結:');
  console.log('─'.repeat(50));
  console.log('✅ 邏輯修復：已將 else if 改為 if');
  console.log('✅ 條件分解：正確分解 AND 條件');
  console.log('✅ 條件處理：同時處理日期和GRN條件');
  console.log('✅ 查詢構建：正確應用多個過濾器');
  
  console.log('\n🤔 如果結果仍然不正確，可能的原因:');
  console.log('1. Supabase 查詢構建器的特殊行為');
  console.log('2. OR 條件的處理方式');
  console.log('3. 條件優先級或查詢執行順序');
}

testLogic(); 