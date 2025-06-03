#!/usr/bin/env node

// 測試 Supabase 查詢構建器在複雜條件下的行為

// 模擬的查詢鏈，模擬實際的Supabase查詢構建過程
class QueryChain {
  constructor() {
    this.conditions = [];
    this.from_table = '';
  }
  
  from(table) {
    this.from_table = table;
    return this;
  }
  
  select(columns, options) {
    this.select_clause = columns;
    this.options = options;
    return this;
  }
  
  gte(column, value) {
    this.conditions.push({ type: 'gte', column, value });
    console.log(`[CHAIN] Added: ${column} >= ${value}`);
    return this;
  }
  
  lt(column, value) {
    this.conditions.push({ type: 'lt', column, value });
    console.log(`[CHAIN] Added: ${column} < ${value}`);
    return this;
  }
  
  or(condition) {
    this.conditions.push({ type: 'or', condition });
    console.log(`[CHAIN] Added OR: ${condition}`);
    return this;
  }
  
  like(column, pattern) {
    this.conditions.push({ type: 'like', column, pattern });
    console.log(`[CHAIN] Added: ${column} LIKE ${pattern}`);
    return this;
  }
  
  getSQL() {
    if (this.conditions.length === 0) {
      return `SELECT * FROM ${this.from_table}`;
    }
    
    const whereParts = this.conditions.map(condition => {
      switch (condition.type) {
        case 'gte':
          return `${condition.column} >= '${condition.value}'`;
        case 'lt':
          return `${condition.column} < '${condition.value}'`;
        case 'like':
          return `${condition.column} LIKE '${condition.pattern}'`;
        case 'or':
          return `(${condition.condition})`;
        default:
          return condition.type;
      }
    });
    
    return `SELECT COUNT(*) FROM ${this.from_table} WHERE ${whereParts.join(' AND ')}`;
  }
  
  // 模擬執行並返回結果
  async execute() {
    const sql = this.getSQL();
    console.log(`[EXECUTE] Final SQL: ${sql}`);
    
    // 模擬不同的數據情況
    const today = new Date().toISOString().split('T')[0];
    
    // 分析條件邏輯
    const hasDateFilter = this.conditions.some(c => 
      (c.type === 'gte' || c.type === 'lt') && c.column === 'generate_time'
    );
    
    const hasGrnExclusion = this.conditions.some(c => 
      c.type === 'or' && c.condition.includes('not.like.%Material GRN%')
    );
    
    const hasGrnInclusion = this.conditions.some(c => 
      c.type === 'like' && c.pattern === '%Material GRN%'
    );
    
    console.log(`[EXECUTE] Analysis - Date: ${hasDateFilter}, GRN Exclusion: ${hasGrnExclusion}, GRN Inclusion: ${hasGrnInclusion}`);
    
    // 模擬數據邏輯
    if (hasDateFilter && hasGrnExclusion) {
      // 這是問題查詢：今天 + 排除GRN
      console.log(`[EXECUTE] ⚠️  Critical Case: Today + Exclude GRN`);
      console.log(`[EXECUTE] Expected: 14 (28 total - 14 GRN)`);
      console.log(`[EXECUTE] Actual: 107 (seems wrong)`);
      return { count: 107 }; // 這是實際返回的錯誤值
    } else if (hasDateFilter && hasGrnInclusion) {
      // 今天 + 只要GRN
      return { count: 14 }; // 正確
    } else if (hasDateFilter && !hasGrnExclusion && !hasGrnInclusion) {
      // 只有日期條件
      return { count: 28 }; // 正確
    } else if (!hasDateFilter && hasGrnExclusion) {
      // 只有GRN排除條件（所有歷史數據）
      return { count: 107 }; // 這可能是所有非GRN的歷史記錄
    } else if (!hasDateFilter && hasGrnInclusion) {
      // 只有GRN包含條件
      return { count: 107 }; // 所有GRN記錄
    }
    
    return { count: 0 };
  }
}

console.log('🧪 測試 Supabase 查詢構建器行為\n');

// 測試案例1：今天排除GRN（問題查詢）
console.log('='.repeat(60));
console.log('📋 測試案例 1: 今天排除GRN（問題查詢）');
console.log('='.repeat(60));

const today = '2025-06-02';

let query1 = new QueryChain()
  .from('record_palletinfo')
  .select('*', { count: 'exact', head: true });

// 應用日期條件
console.log('\n🔧 步驟 1: 應用日期條件');
query1 = query1
  .gte('generate_time', today + 'T00:00:00.000Z')
  .lt('generate_time', today + 'T23:59:59.999Z');

// 應用GRN排除條件
console.log('\n🔧 步驟 2: 應用GRN排除條件');
query1 = query1.or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');

console.log('\n📊 最終查詢構建結果:');
console.log('SQL:', query1.getSQL());

console.log('\n🚀 執行查詢...');
const result1 = await query1.execute();
console.log('結果:', result1.count);

// 測試案例2：分別測試單獨條件
console.log('\n\n='.repeat(60));
console.log('📋 測試案例 2: 分別測試單獨條件');
console.log('='.repeat(60));

console.log('\n📅 2.1 只有日期條件（今天所有託盤）:');
const query2a = new QueryChain()
  .from('record_palletinfo')
  .select('*', { count: 'exact', head: true })
  .gte('generate_time', today + 'T00:00:00.000Z')
  .lt('generate_time', today + 'T23:59:59.999Z');

console.log('SQL:', query2a.getSQL());
const result2a = await query2a.execute();
console.log('結果:', result2a.count);

console.log('\n🚫 2.2 只有GRN排除條件（所有非GRN託盤）:');
const query2b = new QueryChain()
  .from('record_palletinfo')
  .select('*', { count: 'exact', head: true })
  .or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');

console.log('SQL:', query2b.getSQL());
const result2b = await query2b.execute();
console.log('結果:', result2b.count);

// 分析問題
console.log('\n\n='.repeat(60));
console.log('🔍 問題分析');
console.log('='.repeat(60));

console.log('\n📈 數據邏輯分析:');
console.log(`今天總託盤: ${result2a.count}`);
console.log(`所有非GRN託盤: ${result2b.count}`);
console.log(`今天+排除GRN: ${result1.count}`);

console.log('\n❌ 問題發現:');
console.log('當同時應用日期條件和GRN排除條件時:');
console.log(`應該得到: ${result2a.count} 的子集（≤ ${result2a.count}）`);
console.log(`實際得到: ${result1.count}`);
console.log(`數學邏輯: ${result1.count} > ${result2a.count} 不可能成立！`);

console.log('\n💡 可能的原因:');
console.log('1. Supabase OR 查詢構建器被錯誤應用');
console.log('2. 查詢條件沒有被正確組合（AND邏輯失效）');
console.log('3. 查詢被重新構建或覆蓋');
console.log('4. 緩存或資料庫連接問題');

console.log('\n🔧 建議解決方案:');
console.log('1. 使用原生SQL而不是查詢構建器');
console.log('2. 重新檢查 Supabase OR 語法');
console.log('3. 分步驗證每個條件的應用效果');
console.log('4. 使用 RPC 函數執行複雜查詢'); 