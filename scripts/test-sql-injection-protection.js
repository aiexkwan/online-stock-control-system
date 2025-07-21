#!/usr/bin/env node

/**
 * SQL Injection Protection Test Script
 * 測試 execute_sql_query RPC 函數的 SQL 注入保護機制
 *
 * 這個腳本會測試多種 SQL 注入攻擊向量來確保安全措施有效
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 加載環境變量
dotenv.config({ path: '.env.local' });

console.log('Environment check:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

// 初始化 Supabase 客戶端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 測試用例類型
const TEST_CATEGORIES = {
  DML_INJECTION: 'DML Statement Injection',
  DDL_INJECTION: 'DDL Statement Injection',
  SYSTEM_ACCESS: 'System Table Access',
  MULTIPLE_STATEMENTS: 'Multiple Statement Execution',
  COMMENT_BYPASS: 'Comment Bypass Attempts',
  UNION_INJECTION: 'UNION-based Injection',
  BOOLEAN_INJECTION: 'Boolean-based Injection',
  TIME_BASED: 'Time-based Injection'
};

// 惡意 SQL 注入測試案例
const MALICIOUS_TEST_CASES = [
  // DML 注入測試
  {
    category: TEST_CATEGORIES.DML_INJECTION,
    name: 'DELETE 語句注入',
    query: "SELECT * FROM data_code; DELETE FROM data_code WHERE id = 1",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },
  {
    category: TEST_CATEGORIES.DML_INJECTION,
    name: 'UPDATE 語句注入',
    query: "SELECT 1; UPDATE data_supplier SET name = 'hacked'",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },
  {
    category: TEST_CATEGORIES.DML_INJECTION,
    name: 'INSERT 語句注入',
    query: "SELECT * FROM data_code UNION ALL SELECT NULL; INSERT INTO data_code VALUES ('hack', 'hacked')",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },

  // DDL 注入測試
  {
    category: TEST_CATEGORIES.DDL_INJECTION,
    name: 'DROP TABLE 注入',
    query: "SELECT 1; DROP TABLE record_history",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },
  {
    category: TEST_CATEGORIES.DDL_INJECTION,
    name: 'CREATE TABLE 注入',
    query: "SELECT 1; CREATE TABLE evil_table (id INT)",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },
  {
    category: TEST_CATEGORIES.DDL_INJECTION,
    name: 'ALTER TABLE 注入',
    query: "SELECT * FROM data_code; ALTER TABLE data_code ADD COLUMN evil TEXT",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },
  {
    category: TEST_CATEGORIES.DDL_INJECTION,
    name: 'TRUNCATE 注入',
    query: "SELECT 1; TRUNCATE TABLE record_palletinfo",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },

  // 系統表存取測試
  {
    category: TEST_CATEGORIES.SYSTEM_ACCESS,
    name: 'PostgreSQL 系統表存取',
    query: "SELECT * FROM pg_stat_activity",
    expectedBlocked: false, // 這個可能會被允許但沒有權限
    expectedError: null
  },
  {
    category: TEST_CATEGORIES.SYSTEM_ACCESS,
    name: '用戶表存取嘗試',
    query: "SELECT usename, passwd FROM pg_shadow",
    expectedBlocked: false, // 權限控制會阻止這個
    expectedError: null
  },
  {
    category: TEST_CATEGORIES.SYSTEM_ACCESS,
    name: '數據庫配置存取',
    query: "SELECT name, setting FROM pg_settings WHERE name LIKE '%password%'",
    expectedBlocked: false,
    expectedError: null
  },

  // 多語句執行測試
  {
    category: TEST_CATEGORIES.MULTIPLE_STATEMENTS,
    name: '分號分隔多語句',
    query: "SELECT 1; SELECT 2; SELECT 3",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },
  {
    category: TEST_CATEGORIES.MULTIPLE_STATEMENTS,
    name: '嵌套查詢與分號',
    query: "SELECT (SELECT 1); SELECT user",
    expectedBlocked: true,
    expectedError: 'Dangerous SQL keywords detected'
  },

  // 註釋繞過測試
  {
    category: TEST_CATEGORIES.COMMENT_BYPASS,
    name: '單行註釋繞過',
    query: "SELECT * FROM data_code -- AND 1=1; DELETE FROM data_code",
    expectedBlocked: false, // 註釋應該使後面的內容無效
    expectedError: null
  },
  {
    category: TEST_CATEGORIES.COMMENT_BYPASS,
    name: '多行註釋繞過',
    query: "SELECT * FROM data_code /* malicious comment */ UNION SELECT NULL",
    expectedBlocked: false,
    expectedError: null
  },

  // UNION 注入測試
  {
    category: TEST_CATEGORIES.UNION_INJECTION,
    name: 'UNION 注入嘗試',
    query: "SELECT id FROM data_code WHERE 1=1 UNION SELECT password FROM auth.users",
    expectedBlocked: false, // 權限控制會處理這個
    expectedError: null
  },
  {
    category: TEST_CATEGORIES.UNION_INJECTION,
    name: 'UNION ALL 注入',
    query: "SELECT code FROM data_code UNION ALL SELECT table_name FROM information_schema.tables",
    expectedBlocked: false,
    expectedError: null
  },

  // 布林注入測試
  {
    category: TEST_CATEGORIES.BOOLEAN_INJECTION,
    name: '布林盲注測試',
    query: "SELECT * FROM data_code WHERE 1=1 AND (SELECT COUNT(*) FROM data_supplier) > 0",
    expectedBlocked: false, // 這是合法的 SELECT
    expectedError: null
  },
  {
    category: TEST_CATEGORIES.BOOLEAN_INJECTION,
    name: '子查詢布林測試',
    query: "SELECT * FROM data_code WHERE EXISTS (SELECT 1 FROM record_palletinfo WHERE plt_num LIKE '%test%')",
    expectedBlocked: false,
    expectedError: null
  },

  // 時間盲注測試
  {
    category: TEST_CATEGORIES.TIME_BASED,
    name: 'pg_sleep 時間延遲',
    query: "SELECT * FROM data_code WHERE pg_sleep(5) IS NULL",
    expectedBlocked: false, // 可能會被超時限制阻止
    expectedError: null
  },
  {
    category: TEST_CATEGORIES.TIME_BASED,
    name: '複雜時間延遲',
    query: "SELECT * FROM data_code WHERE (SELECT COUNT(*) FROM generate_series(1,1000000)) > 0",
    expectedBlocked: false, // 可能因成本太高被阻止
    expectedError: null
  }
];

// 合法查詢測試（確保不會誤判）
const LEGITIMATE_TEST_CASES = [
  {
    name: '基本 SELECT 查詢',
    query: 'SELECT COUNT(*) FROM data_code',
    shouldPass: true
  },
  {
    name: 'WITH 子句查詢',
    query: 'WITH summary AS (SELECT COUNT(*) as total FROM data_code) SELECT * FROM summary',
    shouldPass: true
  },
  {
    name: '複雜 JOIN 查詢',
    query: `
      SELECT dc.code, dc.name_chi, COUNT(rp.id) as pallet_count
      FROM data_code dc
      LEFT JOIN record_palletinfo rp ON dc.code = rp.product_code
      GROUP BY dc.code, dc.name_chi
      LIMIT 10
    `,
    shouldPass: true
  },
  {
    name: '窗口函數查詢',
    query: `
      SELECT
        plt_num,
        product_code,
        ROW_NUMBER() OVER (PARTITION BY product_code ORDER BY latest_update DESC) as rn
      FROM record_palletinfo
      LIMIT 5
    `,
    shouldPass: true
  }
];

/**
 * 執行單個測試案例
 */
async function runTestCase(testCase, isLegitimate = false) {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: testCase.query
    });

    const executionTime = Date.now() - startTime;

    if (isLegitimate) {
      // 合法查詢測試
      return {
        ...testCase,
        passed: !error && testCase.shouldPass,
        error: error?.message || null,
        data: data ? (Array.isArray(data.data) ? data.data.length : 'N/A') : null,
        executionTime
      };
    } else {
      // 惡意查詢測試
      const blocked = !!error;
      const correctlyBlocked = testCase.expectedBlocked ? blocked : !blocked;

      return {
        ...testCase,
        blocked,
        correctlyBlocked,
        actualError: error?.message || null,
        expectedError: testCase.expectedError,
        errorMatch: testCase.expectedError ?
          (error?.message?.includes(testCase.expectedError) || false) : true,
        executionTime,
        securityStatus: correctlyBlocked ? '✅ SECURE' : '❌ VULNERABLE'
      };
    }
  } catch (err) {
    return {
      ...testCase,
      blocked: true,
      correctlyBlocked: testCase.expectedBlocked || false,
      actualError: err.message,
      executionTime: Date.now() - startTime,
      securityStatus: testCase.expectedBlocked ? '✅ SECURE' : '⚠️ UNEXPECTED'
    };
  }
}

/**
 * 運行所有惡意注入測試
 */
async function runMaliciousTests() {
  console.log('🔒 開始 SQL 注入保護測試...\n');

  const results = {};
  let totalTests = 0;
  let passedTests = 0;
  let vulnerabilities = [];

  // 按類別分組測試
  for (const category of Object.values(TEST_CATEGORIES)) {
    const categoryTests = MALICIOUS_TEST_CASES.filter(test => test.category === category);
    results[category] = [];

    console.log(`📂 ${category}:`);
    console.log('─'.repeat(60));

    for (const testCase of categoryTests) {
      const result = await runTestCase(testCase);
      results[category].push(result);
      totalTests++;

      if (result.correctlyBlocked) {
        passedTests++;
        console.log(`  ✅ ${result.name}: ${result.securityStatus}`);
      } else {
        console.log(`  ❌ ${result.name}: ${result.securityStatus}`);
        console.log(`     Expected: ${result.expectedBlocked ? 'BLOCKED' : 'ALLOWED'}`);
        console.log(`     Actual: ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
        if (result.actualError) {
          console.log(`     Error: ${result.actualError}`);
        }
        vulnerabilities.push(result);
      }

      // 延遲避免過於頻繁的請求
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
  }

  return { results, totalTests, passedTests, vulnerabilities };
}

/**
 * 運行合法查詢測試
 */
async function runLegitimateTests() {
  console.log('✅ 測試合法查詢（確保不會誤判）...\n');

  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of LEGITIMATE_TEST_CASES) {
    const result = await runTestCase(testCase, true);
    results.push(result);
    totalTests++;

    if (result.passed) {
      passedTests++;
      console.log(`  ✅ ${result.name}: 通過 (${result.executionTime}ms)`);
      if (result.data !== null) {
        console.log(`     返回 ${result.data} 行數據`);
      }
    } else {
      console.log(`  ❌ ${result.name}: 失敗`);
      if (result.error) {
        console.log(`     錯誤: ${result.error}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  return { results, totalTests, passedTests };
}

/**
 * 生成測試報告
 */
function generateReport(maliciousResults, legitimateResults) {
  console.log('📊 SQL 注入保護測試報告');
  console.log('='.repeat(80));

  // 總體安全分數
  const totalSecurityTests = maliciousResults.totalTests;
  const passedSecurityTests = maliciousResults.passedTests;
  const securityScore = ((passedSecurityTests / totalSecurityTests) * 100).toFixed(1);

  const totalLegitimateTests = legitimateResults.totalTests;
  const passedLegitimateTests = legitimateResults.passedTests;
  const functionalityScore = ((passedLegitimateTests / totalLegitimateTests) * 100).toFixed(1);

  console.log(`\n🛡️ 安全性評分: ${securityScore}% (${passedSecurityTests}/${totalSecurityTests} 通過)`);
  console.log(`⚡ 功能性評分: ${functionalityScore}% (${passedLegitimateTests}/${totalLegitimateTests} 通過)`);

  // 漏洞詳情
  if (maliciousResults.vulnerabilities.length > 0) {
    console.log('\n❌ 發現的安全漏洞:');
    console.log('─'.repeat(40));
    maliciousResults.vulnerabilities.forEach((vuln, index) => {
      console.log(`${index + 1}. ${vuln.category} - ${vuln.name}`);
      console.log(`   查詢: ${vuln.query.substring(0, 100)}...`);
      console.log(`   風險: ${vuln.expectedBlocked ? '高' : '中'}`);
      console.log('');
    });
  } else {
    console.log('\n🎉 未發現安全漏洞！');
  }

  // 建議
  console.log('\n💡 安全建議:');
  console.log('─'.repeat(40));

  if (securityScore < 100) {
    console.log('⚠️ 建議加強以下安全措施:');
    console.log('   1. 檢查 execute_sql_query 函數的關鍵字過濾');
    console.log('   2. 增加更嚴格的語句解析');
    console.log('   3. 考慮實施查詢白名單機制');
  } else {
    console.log('✅ SQL 注入保護機制運作良好');
  }

  if (functionalityScore < 100) {
    console.log('⚠️ 某些合法查詢被誤判，建議:');
    console.log('   1. 檢查安全規則是否過於嚴格');
    console.log('   2. 優化關鍵字檢測邏輯');
  }

  console.log('\n📋 測試完成時間:', new Date().toISOString());
}

/**
 * 主測試函數
 */
async function main() {
  console.log('🚀 NewPennine WMS - SQL 注入保護測試');
  console.log('=' .repeat(80));
  console.log('測試目標: execute_sql_query RPC 函數');
  console.log('測試時間:', new Date().toISOString());
  console.log('');

  try {
    // 運行惡意查詢測試
    const maliciousResults = await runMaliciousTests();

    // 運行合法查詢測試
    const legitimateResults = await runLegitimateTests();

    // 生成報告
    generateReport(maliciousResults, legitimateResults);

  } catch (error) {
    console.error('❌ 測試執行失敗:', error.message);
    console.error('請檢查:');
    console.error('1. Supabase 連接設定');
    console.error('2. 環境變量配置');
    console.error('3. execute_sql_query 函數是否存在');
    process.exit(1);
  }
}

// 運行測試
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runSQLInjectionTests: main };
