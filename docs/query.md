import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/app/utils/supabase/server';
import { encoding_for_model } from 'tiktoken';
import { LRUCache } from 'lru-cache';

// 初始化 OpenAI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 檢查 API 密鑰是否存在
if (!process.env.OPENAI_API_KEY) {
  console.error('[Ask Database] OPENAI_API_KEY environment variable is not set');
}

// 允許使用 Ask Database 功能的用戶
const ALLOWED_USERS = [
  'gtatlock@pennineindustries.com',
  'akwan@pennineindustries.com'
];

// 初始化緩存
const queryCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 3600 * 1000, // 1小時
});

// 會話歷史緩存 (sessionId -> conversation history)
const conversationCache = new LRUCache<string, ConversationEntry[]>({
  max: 100,
  ttl: 24 * 60 * 60 * 1000, // 24小時
});

// 對話記錄類型
interface ConversationEntry {
  timestamp: string;
  question: string;
  sql: string;
  answer: string;
  result: any;
  complexity: string;
}

// 數據庫結構緩存
let databaseSchema: string | null = null;
let schemaLastUpdated: number = 0;

// 清除緩存以應用新的提示邏輯和修復邏輯問題
console.log('[Ask Database] 🔥 CRITICAL FIX APPLIED: else-if logic corrected - Build 2025-06-02-23:45');
databaseSchema = null;
schemaLastUpdated = 0;
queryCache.clear();
conversationCache.clear();
console.log('[Ask Database] All caches cleared - Critical else-if fix applied');

export async function POST(request: NextRequest) {
  try {
    console.log('[Ask Database] Request received');
    
    const { question, sessionId } = await request.json();
    console.log('[Ask Database] Question:', question);
    console.log('[Ask Database] Session ID:', sessionId);

    // 1. 用戶權限檢查
    console.log('[Ask Database] Checking user permission...');
    const hasPermission = await checkUserPermission();
    if (!hasPermission) {
      console.log('[Ask Database] Permission denied');
      return NextResponse.json(
        { error: '您沒有權限使用數據庫查詢功能' },
        { status: 403 }
      );
    }
    console.log('[Ask Database] Permission granted');

    // 2. 獲取會話歷史
    console.log('[Ask Database] Getting conversation history...');
    const conversationHistory = getConversationHistory(sessionId);
    console.log('[Ask Database] Conversation history length:', conversationHistory.length);

    // 3. 檢查緩存 (包含會話上下文的緩存鍵)
    const cacheKey = generateCacheKey(question, conversationHistory);
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) {
      console.log('[Ask Database] Cache hit');
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }
    console.log('[Ask Database] Cache miss');

    // 4. 分析查詢複雜度
    console.log('[Ask Database] Analyzing query complexity...');
    const complexity = analyzeQueryComplexity(question);
    console.log('[Ask Database] Complexity:', complexity);

    // 5. 獲取數據庫結構
    console.log('[Ask Database] Getting database schema...');
    const schema = await getDatabaseSchema();
    console.log('[Ask Database] Schema length:', schema.length);

    // 6. 生成 SQL (包含對話上下文)
    console.log('[Ask Database] Generating SQL with conversation context...');
    const sqlResult = await generateSQLWithContext(question, schema, complexity, conversationHistory);
    console.log('[Ask Database] Generated SQL:', sqlResult.sql);

    // 7. 執行查詢
    console.log('[Ask Database] Executing query...');
    const queryResult = await executeQuery(sqlResult.sql);
    console.log('[Ask Database] Query result:', {
      rowCount: queryResult.rowCount,
      executionTime: queryResult.executionTime
    });

    // 8. 生成自然語言回應 (包含對話上下文)
    console.log('[Ask Database] Generating natural language response...');
    const naturalLanguageResponse = await generateNaturalLanguageResponseWithContext(
      question,
      queryResult,
      sqlResult.sql,
      conversationHistory
    );
    console.log('[Ask Database] Response generated');

    const result = {
      question,
      sql: sqlResult.sql,
      result: queryResult,
      answer: naturalLanguageResponse,
      complexity: complexity.level,
      tokensUsed: sqlResult.tokensUsed,
      executionTime: queryResult.executionTime,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // 9. 緩存結果
    queryCache.set(cacheKey, result);

    // 10. 保存會話歷史
    console.log('[Ask Database] Saving conversation history...');
    saveConversationHistory(sessionId, {
      timestamp: result.timestamp,
      question,
      sql: sqlResult.sql,
      answer: naturalLanguageResponse,
      result: queryResult,
      complexity: complexity.level
    });

    console.log('[Ask Database] Request completed successfully');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Ask Database] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // 根據錯誤類型提供更具體的錯誤訊息
    let errorMessage = '查詢處理失敗，請稍後再試';
    
    if (error.message?.includes('OpenAI')) {
      errorMessage = 'AI 服務暫時不可用，請稍後再試';
    } else if (error.message?.includes('Supabase') || error.message?.includes('database')) {
      errorMessage = '數據庫連接失敗，請稍後再試';
    } else if (error.message?.includes('permission') || error.message?.includes('auth')) {
      errorMessage = '權限驗證失敗，請重新登入';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '查詢超時，請嘗試簡化您的問題';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// 用戶權限檢查
async function checkUserPermission(): Promise<boolean> {
  // 開發環境下跳過權限檢查（用於深度調試）
  if (process.env.NODE_ENV === 'development') {
    console.log('[checkUserPermission] Development mode: skipping auth check for debugging');
    return true;
  }
  
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return false;
    }

    // 檢查是否為允許的用戶
    return ALLOWED_USERS.includes(user.email);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// 查詢複雜度分析
function analyzeQueryComplexity(question: string): ComplexityAnalysis {
  const indicators = {
    multiTable: /join|關聯|連接|合併|供應商|歷史/.test(question.toLowerCase()),
    aggregation: /總計|平均|最大|最小|統計|計算|總數|總重|sum|avg|max|min|count|有幾多|幾多個|多少|數量/.test(question.toLowerCase()),
    subquery: /子查詢|嵌套|分組|group|having/.test(question.toLowerCase()),
    timeRange: /時間範圍|期間|趨勢|日期|昨天|今天|本週|本月|今日|尋日|前日|yesterday|today/.test(question.toLowerCase()),
    sorting: /排序|最高|最低|前|後|top|order/.test(question.toLowerCase()),
    grn: /grn|收貨|排除|只要|material grn/.test(question.toLowerCase()),
    productCode: /mep|code|產品代碼|product/.test(question.toLowerCase()),
  };

  const score = Object.values(indicators).filter(Boolean).length;

  return {
    level: score >= 4 ? 'complex' : score >= 2 ? 'medium' : 'simple',
    indicators,
    score,
  };
}

// 獲取數據庫結構
async function getDatabaseSchema(): Promise<string> {
  const now = Date.now();
  
  // 檢查緩存（24小時）
  if (databaseSchema && (now - schemaLastUpdated) < 24 * 60 * 60 * 1000) {
    return databaseSchema;
  }

  const supabase = createClient();

  try {
    // 獲取所有表格的結構資訊
    const tables = [
      'data_code', 'data_id', 'data_slateinfo', 'data_supplier',
      'record_aco', 'record_grn', 'record_history', 'record_inventory',
      'record_palletinfo', 'record_slate', 'record_transfer', 'report_log'
    ];

    let schemaDescription = '數據庫結構說明：\n\n';

    for (const table of tables) {
      schemaDescription += `表格: ${table}\n`;
      schemaDescription += getTableDescription(table);
      schemaDescription += '\n';
    }

    databaseSchema = schemaDescription;
    schemaLastUpdated = now;

    return databaseSchema;
  } catch (error) {
    console.error('Schema fetch error:', error);
    return '無法獲取數據庫結構';
  }
}

// 表格描述
function getTableDescription(tableName: string): string {
  const descriptions: Record<string, string> = {
    'data_code': '產品代碼表 - 欄位: code(主鍵), description, colour, type, standard_qty\n',
    'data_id': '用戶資訊表 - 欄位: id(主鍵), name, department, uuid, email, report, view, qc, receive, void, first_login, resume, password\n',
    'data_slateinfo': '石板產品詳細資訊表 - 欄位: product_code(主鍵), description, colour, length, width, thickness_top, thickness_bottom, weight, shapes, hole_to_bottom, tool_num\n',
    'data_supplier': '供應商資訊表 - 欄位: supplier_code(主鍵), supplier_name\n',
    'record_aco': 'ACO訂單記錄表 - 欄位: uuid(主鍵), order_ref, code, required_qty, remain_qty, latest_update\n',
    'record_grn': 'GRN收貨記錄表 - 欄位: uuid(主鍵), grn_ref, material_code, sup_code, gross_weight, net_weight, package, package_count, pallet, pallet_count, plt_num\n',
    'record_history': '操作歷史記錄表 - 欄位: uuid(主鍵), id, action, plt_num, remark, time, loc\n',
    'record_inventory': '庫存記錄表 - 欄位: uuid, pallet_num(主鍵), product_code, injection, pipeline, await, fold, bulk, backcarpark, prebook, latest_update\n',
    'record_palletinfo': '托盤資訊表 - 欄位: plt_num(主鍵), product_code, product_qty, series, generate_time, plt_remark\n' +
                        '重要業務規則: 如果 plt_remark 包含 "Material GRN" 字眼，表示這是 GRN 收貨的托盤\n',
    'record_slate': '石板生產記錄表 - 欄位: uuid(主鍵), plt_num, code, batch_num, mach_num, setter, material, colour, shape, length, width, t_thick, b_thick, weight, centre_hole, flame_test, first_off, remark\n',
    'record_transfer': '轉移記錄表 - 欄位: uuid(主鍵), plt_num, f_loc, t_loc, tran_date, operator_id\n',
    'report_log': '報告日誌表 - 欄位: uuid(主鍵), context, error, state\n',
  };

  return descriptions[tableName] || '表格描述不可用\n';
}

// 生成 SQL
async function generateSQL(
  question: string,
  schema: string,
  complexity: ComplexityAnalysis
): Promise<{ sql: string; tokensUsed: number }> {
  try {
    console.log('[generateSQL] Building prompt...');
    const prompt = buildPrompt(question, schema, complexity);
    
    // 計算 tokens
    console.log('[generateSQL] Calculating input tokens...');
    const encoding = encoding_for_model('gpt-4o');
    const inputTokens = encoding.encode(prompt).length;
    console.log('[generateSQL] Input tokens:', inputTokens);

    console.log('[generateSQL] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('OpenAI API 沒有返回有效回應');
    }

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('OpenAI API 返回空回應');
    }

    console.log('[generateSQL] OpenAI response received, length:', responseContent.length);
    
    const outputTokens = encoding.encode(responseContent).length;
    console.log('[generateSQL] Output tokens:', outputTokens);
    
    const sql = extractSQLFromResponse(responseContent);
    console.log('[generateSQL] Extracted SQL length:', sql.length);

    if (!sql || sql.trim().length === 0) {
      throw new Error('無法從 AI 回應中提取有效的 SQL 查詢');
    }

    return {
      sql,
      tokensUsed: inputTokens + outputTokens,
    };
  } catch (error: any) {
    console.error('[generateSQL] Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.message?.includes('API key')) {
      throw new Error('OpenAI API 密鑰配置錯誤');
    } else if (error.message?.includes('rate limit')) {
      throw new Error('OpenAI API 調用頻率超限，請稍後再試');
    } else if (error.message?.includes('timeout')) {
      throw new Error('OpenAI API 調用超時，請稍後再試');
    } else if (error.message?.includes('OpenAI')) {
      throw new Error(`OpenAI API 錯誤: ${error.message}`);
    }
    
    throw error;
  }
}

// 構建提示
function buildPrompt(
  question: string,
  schema: string,
  complexity: ComplexityAnalysis
): string {
  const complexityInstructions = {
    simple: '這是一個簡單查詢，請生成直接的 SELECT 語句。',
    medium: '這是一個中等複雜度查詢，可能需要聚合函數或特定條件。',
    complex: '這是一個複雜查詢，可能需要 JOIN、子查詢或複雜的聚合邏輯。',
  };

  return `
你是一個專業的 PostgreSQL 數據庫專家。請根據用戶的自然語言問題生成準確的 SQL 查詢。

${complexityInstructions[complexity.level]}

數據庫結構：
${schema}

用戶問題：${question}

重要規則：
1. 只生成 SELECT 查詢，不允許 INSERT、UPDATE、DELETE
2. 使用正確的表格和欄位名稱
3. 考慮數據類型和約束條件
4. 限制結果數量（使用 LIMIT 100），除非用戶要求計數
5. 處理可能的 NULL 值
6. 使用適當的 JOIN 類型
7. 對於日期查詢，使用 PostgreSQL 日期函數
8. 欄位名稱請使用雙引號包圍，如 "plt_num"

中文時間表達理解：
- "今日"、"今天"、"today" = CURRENT_DATE
- "尋日"、"昨天"、"yesterday" = CURRENT_DATE - INTERVAL '1 day'  
- "前日"、"前天" = CURRENT_DATE - INTERVAL '2 days'
- "上週" = 過去7天範圍
- "本月" = 當月範圍

特別注意：
- 對於 record_palletinfo 表，日期欄位是 "generate_time"
- 對於 record_grn 表，重量欄位是 "net_weight"（淨重）和 "gross_weight"（毛重）
- 對於產品查詢，主要使用 record_palletinfo 和 data_code 表

GRN 相關業務規則：
- 如果用戶明確要求"排除 GRN"或"排除grn收貨"，使用：AND ("plt_remark" IS NULL OR "plt_remark" NOT LIKE '%Material GRN%')
- 如果用戶明確要求"只要 GRN"或"只要grn收貨"，使用：AND "plt_remark" LIKE '%Material GRN%'
- 如果用戶沒有特別提到 GRN，就查詢所有記錄，不要自動添加 GRN 相關的過濾條件

產品查詢規則：
- 產品代碼查詢時使用 UPPER() 函數進行大小寫不敏感匹配
- 使用 record_palletinfo 表查詢托盤數量，使用 "product_qty" 查詢總數量

聚合查詢範例：
- 今天生成的托盤總數：SELECT COUNT(*) FROM "record_palletinfo" WHERE "generate_time"::date = CURRENT_DATE
- 今天排除GRN的托盤：SELECT COUNT(*) FROM "record_palletinfo" WHERE "generate_time"::date = CURRENT_DATE AND ("plt_remark" IS NULL OR "plt_remark" NOT LIKE '%Material GRN%')
- 今天GRN收貨的托盤和重量：
  SELECT COUNT(*) as pallet_count, SUM("net_weight") as total_net_weight, SUM("gross_weight") as total_gross_weight
  FROM record_grn WHERE "grn_ref" IN (
    SELECT DISTINCT "grn_ref" FROM record_grn 
    WHERE DATE("created_at") = CURRENT_DATE
  )
- 特定產品的托盤數和總數量：
  SELECT COUNT(*) as pallet_count, SUM("product_qty") as total_quantity
  FROM "record_palletinfo" WHERE UPPER("product_code") = UPPER('產品代碼')

請按以下格式回應：

推理過程：
[解釋你的思考過程，特別說明日期理解、是否需要添加 GRN 相關條件、使用的聚合函數]

SQL查詢：
\`\`\`sql
-- 你的 SQL 查詢
\`\`\`
`;
}

// 從回應中提取 SQL
function extractSQLFromResponse(response: string): string {
  const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/);
  if (sqlMatch) {
    return sqlMatch[1].trim();
  }
  
  // 備用提取方法
  const lines = response.split('\n');
  const sqlLines = lines.filter(line => 
    line.toLowerCase().includes('select') ||
    line.toLowerCase().includes('from') ||
    line.toLowerCase().includes('where') ||
    line.toLowerCase().includes('join')
  );
  
  return sqlLines.join('\n').trim();
}

// 執行查詢
async function executeQuery(sql: string): Promise<any> {
  const supabase = createClient();
  const startTime = Date.now();

  try {
    console.log('[executeQuery] Starting query execution:', sql);
    
    // 安全檢查
    if (!isSafeQuery(sql)) {
      throw new Error('不安全的查詢語句');
    }

    // 嘗試使用 RPC 函數執行查詢
    try {
      console.log('[executeQuery] Trying RPC function...');
      const { data, error } = await supabase.rpc('execute_query', {
        query_text: sql
      });

      if (error) {
        console.log('[executeQuery] RPC error:', error);
        throw error;
      }

      const executionTime = Date.now() - startTime;
      console.log('[executeQuery] RPC success, execution time:', executionTime);

      return {
        data: data || [],
        rowCount: data?.length || 0,
        executionTime,
      };
    } catch (rpcError: any) {
      console.log('[executeQuery] RPC function failed:', rpcError.message);
      console.log('[executeQuery] Trying direct query method...');
      
      // 如果 RPC 函數不存在，嘗試直接查詢
      const result = await executeDirectQuery(sql, supabase);
      
      const executionTime = Date.now() - startTime;
      console.log('[executeQuery] Direct query success, execution time:', executionTime);

      return {
        data: result.data || [],
        rowCount: result.data?.length || 0,
        executionTime,
      };
    }
  } catch (error: any) {
    console.error('[executeQuery] Query execution error:', {
      message: error.message,
      sql: sql,
      stack: error.stack
    });
    throw new Error(`查詢執行失敗: ${error.message || '未知錯誤'}`);
  }
}

// 直接執行查詢的備用方法 - 現在優先使用 RPC 函數
async function executeDirectQuery(sql: string, supabase: any): Promise<any> {
  console.log('[executeDirectQuery] Processing SQL:', sql);
  
  try {
    const cleanSQL = sql.trim();
    console.log('[executeDirectQuery] Clean SQL:', cleanSQL);
    
    // 優先檢查是否可以使用專用的 RPC 函數
    const rpcResult = await tryRpcFunctions(cleanSQL, supabase);
    if (rpcResult) {
      console.log('[executeDirectQuery] 🚀 Using RPC function');
      return rpcResult;
    }
    
    // 如果 RPC 函數不適用，使用通用 RPC 查詢執行
    if (cleanSQL.toLowerCase().includes('select')) {
      console.log('[executeDirectQuery] 🔄 Trying generic RPC execution');
      try {
        const { data, error } = await supabase.rpc('execute_query', {
          query_text: cleanSQL
        });

        if (!error && data) {
          console.log('[executeDirectQuery] ✅ Generic RPC success, rows:', data.length);
          // 轉換 JSONB 結果格式
          const convertedData = data.map((row: any) => row.result || row);
          return { data: convertedData, error: null };
        } else {
          console.log('[executeDirectQuery] ⚠️ Generic RPC failed:', error?.message);
        }
      } catch (rpcError: any) {
        console.log('[executeDirectQuery] ⚠️ Generic RPC error:', rpcError.message);
      }
    }
    
    // 最後回退到查詢構建器邏輯
    console.log('[executeDirectQuery] 📦 Falling back to query builder');
    return await executeWithQueryBuilder(cleanSQL, supabase);
    
  } catch (error: any) {
    console.error('[executeDirectQuery] Error:', error);
    throw new Error(`直接查詢失敗: ${error.message}`);
  }
}

// 嘗試使用專用 RPC 函數處理常見查詢模式
async function tryRpcFunctions(sql: string, supabase: any): Promise<any | null> {
  const lowerSQL = sql.toLowerCase();
  
  // 檢查是否為計數查詢
  if (lowerSQL.includes('count(*)') && lowerSQL.includes('record_palletinfo')) {
    console.log('[tryRpcFunctions] 🎯 Detected pallet count query');
    
    // 提取日期條件
    let dateCondition = '';
    if (lowerSQL.includes('date(') && lowerSQL.includes('generate_time')) {
      const today = new Date().toISOString().split('T')[0];
      
      if (lowerSQL.includes('current_date') && !lowerSQL.includes('interval')) {
        dateCondition = `DATE(generate_time) = '${today}'`;
      } else if (lowerSQL.includes("interval '1 day'")) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateCondition = `DATE(generate_time) = '${yesterday}'`;
      } else if (lowerSQL.includes("interval '2 day")) {
        const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateCondition = `DATE(generate_time) = '${dayBefore}'`;
      }
    }
    
    // 提取 GRN 條件
    let grnCondition = '';
    if (lowerSQL.includes('plt_remark')) {
      if (lowerSQL.includes('not like') && lowerSQL.includes('material grn')) {
        grnCondition = '(plt_remark IS NULL OR plt_remark NOT LIKE \'%Material GRN%\')';
      } else if (lowerSQL.includes('like') && lowerSQL.includes('material grn')) {
        grnCondition = 'plt_remark LIKE \'%Material GRN%\'';
      }
    }
    
    // 提取產品條件
    let productCondition = '';
    const productMatch = sql.match(/upper\s*\(\s*["`]?product_code["`]?\s*\)\s*=\s*upper\s*\(\s*['"](.*?)['"]\s*\)/i);
    if (productMatch) {
      const productCode = productMatch[1];
      productCondition = `UPPER(product_code) = UPPER('${productCode}')`;
    }
    
    console.log('[tryRpcFunctions] Conditions - Date:', dateCondition, 'GRN:', grnCondition, 'Product:', productCondition);
    
    try {
      const { data, error } = await supabase.rpc('get_pallet_count_complex', {
        date_condition: dateCondition,
        grn_condition: grnCondition,
        product_condition: productCondition
      });

      if (!error && data) {
        console.log('[tryRpcFunctions] ✅ Complex count RPC success:', data[0]?.count);
        return { 
          data: [{ count: data[0]?.count || 0 }], 
          error: null 
        };
      } else {
        console.log('[tryRpcFunctions] ❌ Complex count RPC failed:', error?.message);
      }
    } catch (rpcError: any) {
      console.log('[tryRpcFunctions] ❌ Complex count RPC error:', rpcError.message);
    }
  }
  
  // 檢查是否為 GRN 重量查詢
  if (lowerSQL.includes('record_grn') && lowerSQL.includes('net_weight') && lowerSQL.includes('gross_weight')) {
    console.log('[tryRpcFunctions] 🎯 Detected GRN weight query');
    
    let dateFilter = '';
    if (lowerSQL.includes('current_date')) {
      const today = new Date().toISOString().split('T')[0];
      dateFilter = `DATE(rp.generate_time) = '${today}'`;
    }
    
    try {
      const { data, error } = await supabase.rpc('get_grn_weight_stats', {
        date_filter: dateFilter
      });

      if (!error && data) {
        console.log('[tryRpcFunctions] ✅ GRN weight RPC success');
        return { data, error: null };
      } else {
        console.log('[tryRpcFunctions] ❌ GRN weight RPC failed:', error?.message);
      }
    } catch (rpcError: any) {
      console.log('[tryRpcFunctions] ❌ GRN weight RPC error:', rpcError.message);
    }
  }
  
  // 檢查是否為產品聚合查詢
  if (lowerSQL.includes('sum') && lowerSQL.includes('product_qty')) {
    console.log('[tryRpcFunctions] 🎯 Detected product aggregation query');
    
    const productMatch = sql.match(/upper\s*\(\s*["`]?product_code["`]?\s*\)\s*=\s*upper\s*\(\s*['"](.*?)['"]\s*\)/i);
    if (productMatch) {
      const productCode = productMatch[1];
      
      try {
        const { data, error } = await supabase.rpc('get_product_stats', {
          product_code_param: productCode
        });

        if (!error && data) {
          console.log('[tryRpcFunctions] ✅ Product stats RPC success');
          return { data, error: null };
        } else {
          console.log('[tryRpcFunctions] ❌ Product stats RPC failed:', error?.message);
        }
      } catch (rpcError: any) {
        console.log('[tryRpcFunctions] ❌ Product stats RPC error:', rpcError.message);
      }
    }
  }
  
  return null;
}

// 使用查詢構建器的備用實現
async function executeWithQueryBuilder(sql: string, supabase: any): Promise<any> {
  console.log('[executeWithQueryBuilder] Using query builder as fallback');
  
  // 檢查是否為 JOIN 查詢
  if (sql.toLowerCase().includes('join')) {
    console.log('[executeWithQueryBuilder] Detected JOIN query, using legacy JOIN handler');
    return await executeJoinQuery(sql, supabase);
  }
  
  // 檢查是否為產品查詢（包含 SUM 和 product_qty）
  if (sql.toLowerCase().includes('sum') && sql.toLowerCase().includes('product_qty')) {
    console.log('[executeWithQueryBuilder] Detected product aggregation query, using legacy handler');
    return await executeProductAggregationQuery(sql, supabase);
  }
  
  // 提取表名
  const tableMatch = sql.match(/from\s+["`]?(\w+)["`]?/i);
  if (!tableMatch) {
    throw new Error('無法解析查詢表格');
  }
  
  const tableName = tableMatch[1];
  console.log('[executeWithQueryBuilder] Extracted table name:', tableName);
  
  // 檢查是否為有效的表名
  const validTables = [
    'data_code', 'data_id', 'data_slateinfo', 'data_supplier',
    'record_aco', 'record_grn', 'record_history', 'record_inventory',
    'record_palletinfo', 'record_slate', 'record_transfer', 'report_log'
  ];
  
  if (!validTables.includes(tableName)) {
    throw new Error(`無效的表格名稱: ${tableName}`);
  }
  
  // 解析 WHERE 條件
  const whereMatch = sql.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|\s+group\s+by|$)/i);
  const whereClause = whereMatch ? whereMatch[1].trim() : '';
  console.log('[executeWithQueryBuilder] WHERE clause:', whereClause);
  
  // 檢查是否為 COUNT 查詢
  if (sql.toLowerCase().includes('count(*)')) {
    console.log('[executeWithQueryBuilder] Detected COUNT query, using legacy count handler');
    return await executeCountQueryWithComplexWhere(tableName, whereClause, supabase);
  }
  
  // 對於其他查詢，使用基本的 select
  let query = supabase.from(tableName).select('*');
  query = applyWhereConditions(query, whereClause, tableName);
  query = query.limit(100);
  
  console.log('[executeWithQueryBuilder] Executing Supabase query...');
  const { data, error } = await query;
  
  if (error) {
    console.error('[executeWithQueryBuilder] Supabase query error:', error);
    throw error;
  }
  
  console.log('[executeWithQueryBuilder] Query successful, rows:', data?.length || 0);
  return { data, error: null };
}

// 執行複雜WHERE條件的COUNT查詢
async function executeCountQueryWithComplexWhere(tableName: string, whereClause: string, supabase: any): Promise<any> {
  console.log('[executeCountQueryWithComplexWhere] Table:', tableName, 'WHERE:', whereClause);
  console.log('[executeCountQueryWithComplexWhere] WHERE clause length:', whereClause.length);
  console.log('[executeCountQueryWithComplexWhere] WHERE clause contains AND:', whereClause.toLowerCase().includes(' and '));
  
  // 對於複雜的AND+OR條件，直接使用RPC執行原生SQL
  if (whereClause.toLowerCase().includes(' and ') && 
      whereClause.toLowerCase().includes('plt_remark')) {
    console.log('[executeCountQueryWithComplexWhere] 🔧 Using RPC for complex AND+OR query');
    
    // 構建完整的SQL查詢
    const sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`;
    console.log('[executeCountQueryWithComplexWhere] SQL:', sql);
    
    try {
      // 使用RPC函數執行原生SQL
      const { data, error } = await supabase.rpc('execute_query', {
        query_text: sql
      });

      if (error) {
        console.error('[executeCountQueryWithComplexWhere] RPC error:', error);
        throw error;
      }

      const count = data && data.length > 0 ? data[0].count : 0;
      console.log('[executeCountQueryWithComplexWhere] RPC Count result:', count);
      
      return { 
        data: [{ count: count || 0 }], 
        error: null 
      };
    } catch (rpcError: any) {
      console.error('[executeCountQueryWithComplexWhere] RPC failed:', rpcError.message);
      console.log('[executeCountQueryWithComplexWhere] Falling back to query builder...');
      // 如果RPC失敗，回退到原來的邏輯
    }
  }
  
  // 原有的查詢構建器邏輯作為後備
  let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
  
  // 分解複雜的WHERE條件
  if (whereClause.toLowerCase().includes(' and ')) {
    console.log('[executeCountQueryWithComplexWhere] Processing complex AND conditions with query builder');
    
    // 分解AND條件
    const conditions = whereClause.split(/\s+and\s+/i);
    console.log('[executeCountQueryWithComplexWhere] Split conditions:', conditions.length);
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i].trim();
      console.log(`[executeCountQueryWithComplexWhere] Processing condition ${i + 1}:`, condition);
      
      // 應用每個條件
      query = applySingleCondition(query, condition, tableName);
    }
  } else {
    console.log('[executeCountQueryWithComplexWhere] Processing single condition');
    query = applySingleCondition(query, whereClause, tableName);
  }
  
  console.log('[executeCountQueryWithComplexWhere] Executing query...');
  const { count, error } = await query;
  
  if (error) {
    console.error('[executeCountQueryWithComplexWhere] Count query error:', error);
    throw error;
  }
  
  console.log('[executeCountQueryWithComplexWhere] Count result:', count);
  return { 
    data: [{ count: count || 0 }], 
    error: null 
  };
}

// 應用單個條件
function applySingleCondition(query: any, condition: string, tableName: string): any {
  console.log('[applySingleCondition] Processing condition:', condition);
  
  const lowerCondition = condition.toLowerCase();
  
  // 處理日期條件
  if (lowerCondition.includes('date(') && lowerCondition.includes('current_date')) {
    console.log('[applySingleCondition] Processing date condition');
    
    let dateField = 'created_at';
    if (tableName === 'record_palletinfo') {
      dateField = 'generate_time';
    } else if (tableName === 'record_slate') {
      dateField = 'first_off';
    } else if (tableName === 'record_history') {
      dateField = 'time';
    } else if (tableName === 'record_transfer') {
      dateField = 'tran_date';
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    if (lowerCondition.includes('= current_date') && !lowerCondition.includes('interval')) {
      console.log('[applySingleCondition] Applying today filter');
      query = query.gte(dateField, today + 'T00:00:00.000Z').lt(dateField, today + 'T23:59:59.999Z');
    } else if (lowerCondition.includes("interval '1 day'")) {
      console.log('[applySingleCondition] Applying yesterday filter');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte(dateField, yesterday + 'T00:00:00.000Z').lt(dateField, yesterday + 'T23:59:59.999Z');
    } else if (lowerCondition.includes("interval '2 day")) {
      console.log('[applySingleCondition] Applying day before yesterday filter');
      const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte(dateField, dayBefore + 'T00:00:00.000Z').lt(dateField, dayBefore + 'T23:59:59.999Z');
    }
  }
  
  // 處理GRN條件 - 修復：改為if而不是else if，確保能與日期條件同時應用
  if (lowerCondition.includes('plt_remark')) {
    console.log('[applySingleCondition] Processing GRN condition');
    
    if (lowerCondition.includes('not like') && lowerCondition.includes('material grn')) {
      console.log('[applySingleCondition] Applying GRN exclusion filter');
      query = query.or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');
    } else if (lowerCondition.includes('like') && lowerCondition.includes('material grn')) {
      console.log('[applySingleCondition] Applying GRN inclusion filter');
      query = query.like('plt_remark', '%Material GRN%');
    }
  }
  
  // 處理產品代碼條件 - 修復：改為if而不是else if
  if (lowerCondition.includes('upper') && lowerCondition.includes('product_code')) {
    console.log('[applySingleCondition] Processing product code condition');
    const productMatch = condition.match(/upper\s*\(\s*["`]?product_code["`]?\s*\)\s*=\s*upper\s*\(\s*['"](.*?)['"]\s*\)/i);
    if (productMatch) {
      const productCode = productMatch[1];
      console.log('[applySingleCondition] Applying product code filter:', productCode);
      query = query.ilike('product_code', productCode);
    }
  }
  
  // 處理簡單等號條件 - 修復：改為if而不是else if
  if (condition.includes('=') && !lowerCondition.includes('date(') && 
      !lowerCondition.includes('current_date') && !lowerCondition.includes('upper')) {
    console.log('[applySingleCondition] Processing simple equality condition');
    const [column, value] = condition.split('=').map(s => s.trim());
    const cleanColumn = column.replace(/["`]/g, '');
    const cleanValue = value.replace(/['"]/g, '');
    console.log('[applySingleCondition] Applying equality filter:', cleanColumn, '=', cleanValue);
    query = query.eq(cleanColumn, cleanValue);
  }
  
  return query;
}

// 執行 JOIN 查詢
async function executeJoinQuery(sql: string, supabase: any): Promise<any> {
  console.log('[executeJoinQuery] Processing JOIN query');
  
  // 檢查是否為 GRN 重量查詢
  if (sql.toLowerCase().includes('record_grn') && sql.toLowerCase().includes('net_weight')) {
    console.log('[executeJoinQuery] Detected GRN weight query');
    return await executeGrnWeightQuery(sql, supabase);
  }
  
  // 其他 JOIN 查詢暫時不支持
  throw new Error('複雜的 JOIN 查詢暫時不支持，請簡化查詢條件');
}

// 執行 GRN 重量查詢
async function executeGrnWeightQuery(sql: string, supabase: any): Promise<any> {
  console.log('[executeGrnWeightQuery] Processing GRN weight query');
  
  // 解析日期條件
  let dateCondition = null;
  if (sql.toLowerCase().includes('current_date')) {
    const today = new Date().toISOString().split('T')[0];
    dateCondition = { 
      field: 'generate_time',
      start: today + 'T00:00:00',
      end: today + 'T23:59:59'
    };
    console.log('[executeGrnWeightQuery] Date condition:', dateCondition);
  }
  
  // 查詢 GRN 托盤
  let palletQuery = supabase
    .from('record_palletinfo')
    .select('plt_num')
    .like('plt_remark', '%Material GRN%');
  
  if (dateCondition) {
    palletQuery = palletQuery
      .gte(dateCondition.field, dateCondition.start)
      .lt(dateCondition.field, dateCondition.end);
  }
  
  const { data: palletData, error: palletError } = await palletQuery;
  
  if (palletError) {
    console.error('[executeGrnWeightQuery] Pallet query error:', palletError);
    throw palletError;
  }
  
  console.log('[executeGrnWeightQuery] Found GRN pallets:', palletData?.length || 0);
  
  if (!palletData || palletData.length === 0) {
    return {
      data: [{ pallet_count: 0, total_net_weight: 0, total_gross_weight: 0 }],
      error: null
    };
  }
  
  // 查詢 GRN 重量數據
  const pltNums = palletData.map((p: any) => p.plt_num);
  const { data: grnData, error: grnError } = await supabase
    .from('record_grn')
    .select('plt_num, net_weight, gross_weight')
    .in('plt_num', pltNums);
  
  if (grnError) {
    console.error('[executeGrnWeightQuery] GRN query error:', grnError);
    throw grnError;
  }
  
  console.log('[executeGrnWeightQuery] Found GRN records:', grnData?.length || 0);
  
  const palletCount = grnData?.length || 0;
  const totalNetWeight = grnData?.reduce((sum: number, item: any) => sum + (item.net_weight || 0), 0) || 0;
  const totalGrossWeight = grnData?.reduce((sum: number, item: any) => sum + (item.gross_weight || 0), 0) || 0;
  
  console.log('[executeGrnWeightQuery] Result - Pallets:', palletCount, 'Net:', totalNetWeight, 'Gross:', totalGrossWeight);
  
  return {
    data: [{ 
      pallet_count: palletCount, 
      total_net_weight: totalNetWeight, 
      total_gross_weight: totalGrossWeight 
    }],
    error: null
  };
}

// 應用 WHERE 條件
function applyWhereConditions(query: any, whereClause: string, tableName: string): any {
  if (!whereClause) return query;
  
  console.log('[applyWhereConditions] Processing WHERE clause:', whereClause);
  console.log('[applyWhereConditions] Table name:', tableName);
  console.log('[applyWhereConditions] WHERE clause length:', whereClause.length);
  
  // 處理日期條件 - 修復：正確匹配 DATE() 函數和各種日期格式
  const hasDateCondition = whereClause.toLowerCase().includes('date(') || 
                          whereClause.toLowerCase().includes('current_date') ||
                          whereClause.toLowerCase().includes('interval');
  
  console.log('[applyWhereConditions] Has date condition:', hasDateCondition);
  
  if (hasDateCondition) {
    console.log('[applyWhereConditions] Processing date conditions');
    
    let dateField = 'created_at';
    if (tableName === 'record_palletinfo') {
      dateField = 'generate_time';
    } else if (tableName === 'record_slate') {
      dateField = 'first_off';
    } else if (tableName === 'record_history') {
      dateField = 'time';
    } else if (tableName === 'record_transfer') {
      dateField = 'tran_date';
    }
    
    console.log('[applyWhereConditions] Date field:', dateField);
    
    const today = new Date().toISOString().split('T')[0];
    console.log('[applyWhereConditions] Today date:', today);
    
    if (whereClause.toLowerCase().includes('= current_date') && !whereClause.toLowerCase().includes('interval')) {
      console.log('[applyWhereConditions] Today filter - using date range');
      query = query.gte(dateField, today + 'T00:00:00.000Z').lt(dateField, today + 'T23:59:59.999Z');
      console.log('[applyWhereConditions] Applied today date filter');
    } else if (whereClause.toLowerCase().includes("interval '1 day'")) {
      console.log('[applyWhereConditions] Yesterday filter - using date range');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte(dateField, yesterday + 'T00:00:00.000Z').lt(dateField, yesterday + 'T23:59:59.999Z');
      console.log('[applyWhereConditions] Applied yesterday date filter');
    } else if (whereClause.toLowerCase().includes("interval '2 day")) {
      console.log('[applyWhereConditions] Day before yesterday filter - using date range');
      const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte(dateField, dayBefore + 'T00:00:00.000Z').lt(dateField, dayBefore + 'T23:59:59.999Z');
      console.log('[applyWhereConditions] Applied day before yesterday date filter');
    }
  }
  
  // 處理 GRN 條件 - 確保與前面的條件組合而不是覆蓋
  const hasGrnCondition = whereClause.toLowerCase().includes('plt_remark');
  console.log('[applyWhereConditions] Has GRN condition:', hasGrnCondition);
  
  if (hasGrnCondition) {
    console.log('[applyWhereConditions] Processing GRN conditions');
    
    if (whereClause.toLowerCase().includes('not like') && whereClause.toLowerCase().includes('material grn')) {
      console.log('[applyWhereConditions] GRN exclusion filter');
      // 修復：正確處理 NULL 值和 NOT LIKE 的組合條件
      // 原始SQL: ("plt_remark" IS NULL OR "plt_remark" NOT LIKE '%Material GRN%')
      query = query.or('plt_remark.is.null,plt_remark.not.like.%Material GRN%');
      console.log('[applyWhereConditions] Applied GRN exclusion filter');
    } else if (whereClause.toLowerCase().includes('like') && whereClause.toLowerCase().includes('material grn')) {
      console.log('[applyWhereConditions] GRN inclusion filter');
      query = query.like('plt_remark', '%Material GRN%');
      console.log('[applyWhereConditions] Applied GRN inclusion filter');
    }
  }
  
  // 處理產品代碼條件
  const hasProductCondition = whereClause.toLowerCase().includes('upper') && whereClause.toLowerCase().includes('product_code');
  console.log('[applyWhereConditions] Has product condition:', hasProductCondition);
  
  if (hasProductCondition) {
    console.log('[applyWhereConditions] Processing product code conditions');
    const productMatch = whereClause.match(/upper\s*\(\s*["`]?product_code["`]?\s*\)\s*=\s*upper\s*\(\s*['"](.*?)['"]\s*\)/i);
    if (productMatch) {
      const productCode = productMatch[1];
      console.log('[applyWhereConditions] Product code filter:', productCode);
      query = query.ilike('product_code', productCode);
      console.log('[applyWhereConditions] Applied product code filter');
    }
  }
  
  // 處理簡單的等號條件（非日期、非產品代碼相關）
  const hasSimpleCondition = whereClause.includes('=') && !whereClause.toLowerCase().includes('date(') && 
      !whereClause.toLowerCase().includes('current_date') && !whereClause.toLowerCase().includes('upper');
  console.log('[applyWhereConditions] Has simple condition:', hasSimpleCondition);
  
  if (hasSimpleCondition) {
    console.log('[applyWhereConditions] Processing equality conditions');
    const [column, value] = whereClause.split('=').map(s => s.trim());
    const cleanColumn = column.replace(/["`]/g, '');
    const cleanValue = value.replace(/['"]/g, '');
    console.log('[applyWhereConditions] Equality filter:', cleanColumn, '=', cleanValue);
    query = query.eq(cleanColumn, cleanValue);
    console.log('[applyWhereConditions] Applied equality filter');
  }
  
  console.log('[applyWhereConditions] Completed processing all conditions');
  return query;
}

// 查詢安全檢查
function isSafeQuery(sql: string): boolean {
  const dangerousKeywords = [
    'insert', 'update', 'delete', 'drop', 'create', 'alter',
    'truncate', 'grant', 'revoke', 'exec', 'execute'
  ];

  const lowerSQL = sql.toLowerCase();
  return !dangerousKeywords.some(keyword => lowerSQL.includes(keyword));
}

// 生成自然語言回應
async function generateNaturalLanguageResponse(
  question: string,
  queryResult: any,
  sql: string
): Promise<string> {
  try {
    console.log('[generateNaturalLanguageResponse] Building prompt...');
    const prompt = `
根據以下資訊，用繁體中文生成一個清晰、簡潔的回答：

用戶問題：${question}
執行的SQL：${sql}
查詢結果：${JSON.stringify(queryResult.data?.slice(0, 5) || [], null, 2)}
總記錄數：${queryResult.rowCount}

請提供：
1. 直接回答用戶的問題
2. 簡要說明查詢結果
3. 如果有多筆記錄，提供摘要統計

回答要求：
- 根據用戶的問題，使用繁體中文或英文回答，如果用戶問題是英文，請使用英文回答，如果用戶問題是繁體中文，請使用繁體中文回答
- 簡潔明瞭
- 突出重要數據
- 如果沒有結果，說明可能的原因
`;

    console.log('[generateNaturalLanguageResponse] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    if (!response.choices || response.choices.length === 0) {
      console.warn('[generateNaturalLanguageResponse] No response from OpenAI, using fallback');
      return generateFallbackResponse(question, queryResult);
    }

    const responseContent = response.choices[0].message.content;
    if (!responseContent || responseContent.trim().length === 0) {
      console.warn('[generateNaturalLanguageResponse] Empty response from OpenAI, using fallback');
      return generateFallbackResponse(question, queryResult);
    }

    console.log('[generateNaturalLanguageResponse] Response generated successfully');
    return responseContent;
    
  } catch (error: any) {
    console.error('[generateNaturalLanguageResponse] Error:', error);
    console.log('[generateNaturalLanguageResponse] Using fallback response');
    return generateFallbackResponse(question, queryResult);
  }
}

// 備用回應生成函數
function generateFallbackResponse(question: string, queryResult: any): string {
  const rowCount = queryResult.rowCount || 0;
  
  if (rowCount === 0) {
    return `根據您的查詢「${question}」，沒有找到相關的數據記錄。這可能是因為：
1. 查詢條件過於嚴格
2. 數據庫中暫時沒有符合條件的記錄
3. 查詢的時間範圍內沒有相關數據

建議您嘗試調整查詢條件或擴大查詢範圍。`;
  }
  
  if (rowCount === 1) {
    return `根據您的查詢「${question}」，找到了 1 筆相關記錄。查詢已成功執行，您可以在下方的表格中查看詳細結果。`;
  }
  
  return `根據您的查詢「${question}」，找到了 ${rowCount} 筆相關記錄。查詢已成功執行，結果顯示在下方的表格中。如果記錄數量較多，系統會顯示前 10 筆記錄供您參考。`;
}

// 生成緩存鍵
function generateCacheKey(question: string, conversationHistory?: ConversationEntry[]): string {
  // 將會話歷史的關鍵信息納入緩存鍵
  const historyKey = conversationHistory && conversationHistory.length > 0 
    ? conversationHistory.slice(-2).map(entry => `${entry.question}:${entry.sql}`).join('|')
    : '';
  
  const fullKey = `${question}|${historyKey}`;
  return `query:${Buffer.from(fullKey).toString('base64')}`;
}

// 類型定義
interface ComplexityAnalysis {
  level: 'simple' | 'medium' | 'complex';
  indicators: Record<string, boolean>;
  score: number;
}

// 獲取會話歷史
function getConversationHistory(sessionId: string): ConversationEntry[] {
  if (!sessionId) return [];
  return conversationCache.get(sessionId) || [];
}

// 保存會話歷史
function saveConversationHistory(sessionId: string, entry: ConversationEntry): void {
  if (!sessionId) return;
  
  const history = getConversationHistory(sessionId);
  history.push(entry);
  
  // 只保留最近10次對話
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
  
  conversationCache.set(sessionId, history);
}

// 生成帶上下文的 SQL
async function generateSQLWithContext(
  question: string,
  schema: string,
  complexity: ComplexityAnalysis,
  conversationHistory: ConversationEntry[]
): Promise<{ sql: string; tokensUsed: number }> {
  try {
    console.log('[generateSQLWithContext] Building prompt with context...');
    const prompt = buildPromptWithContext(question, schema, complexity, conversationHistory);
    
    // 計算 tokens
    console.log('[generateSQLWithContext] Calculating input tokens...');
    const encoding = encoding_for_model('gpt-4o');
    const inputTokens = encoding.encode(prompt).length;
    console.log('[generateSQLWithContext] Input tokens:', inputTokens);

    console.log('[generateSQLWithContext] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('OpenAI API 沒有返回有效回應');
    }

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('OpenAI API 返回空回應');
    }

    console.log('[generateSQLWithContext] OpenAI response received, length:', responseContent.length);
    
    const outputTokens = encoding.encode(responseContent).length;
    console.log('[generateSQLWithContext] Output tokens:', outputTokens);
    
    const sql = extractSQLFromResponse(responseContent);
    console.log('[generateSQLWithContext] Extracted SQL length:', sql.length);

    if (!sql || sql.trim().length === 0) {
      throw new Error('無法從 AI 回應中提取有效的 SQL 查詢');
    }

    return {
      sql,
      tokensUsed: inputTokens + outputTokens,
    };
  } catch (error: any) {
    console.error('[generateSQLWithContext] Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.message?.includes('API key')) {
      throw new Error('OpenAI API 密鑰配置錯誤');
    } else if (error.message?.includes('rate limit')) {
      throw new Error('OpenAI API 調用頻率超限，請稍後再試');
    } else if (error.message?.includes('timeout')) {
      throw new Error('OpenAI API 調用超時，請稍後再試');
    } else if (error.message?.includes('OpenAI')) {
      throw new Error(`OpenAI API 錯誤: ${error.message}`);
    }
    
    throw error;
  }
}

// 生成帶上下文的自然語言回應
async function generateNaturalLanguageResponseWithContext(
  question: string,
  queryResult: any,
  sql: string,
  conversationHistory: ConversationEntry[]
): Promise<string> {
  try {
    console.log('[generateNaturalLanguageResponseWithContext] Building prompt...');
    const prompt = `
根據以下資訊，用繁體中文生成一個清晰、簡潔的回答：

用戶問題：${question}
執行的SQL：${sql}
查詢結果：${JSON.stringify(queryResult.data?.slice(0, 5) || [], null, 2)}
總記錄數：${queryResult.rowCount}

對話歷史：
${conversationHistory.slice(-3).map((entry, index) => `
${index + 1}. 問題：${entry.question}
   回答：${entry.answer}
`).join('')}

請提供：
1. 直接回答用戶的問題
2. 簡要說明查詢結果
3. 如果有多筆記錄，提供摘要統計
4. 如果用戶的問題涉及對話上下文（如"那昨天呢？"、"再排除GRN"等），請結合歷史對話理解用戶意圖

回答要求：
- 根據用戶的問題，使用英文回答，如果用戶問題是繁體中文，亦請使用英文回答
- 簡潔明瞭
- 突出重要數據
- 如果沒有結果，說明可能的原因
- 如果是基於對話上下文的問題，要明確說明與之前查詢的關聯
`;

    console.log('[generateNaturalLanguageResponseWithContext] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    if (!response.choices || response.choices.length === 0) {
      console.warn('[generateNaturalLanguageResponseWithContext] No response from OpenAI, using fallback');
      return generateFallbackResponse(question, queryResult);
    }

    const responseContent = response.choices[0].message.content;
    if (!responseContent || responseContent.trim().length === 0) {
      console.warn('[generateNaturalLanguageResponseWithContext] Empty response from OpenAI, using fallback');
      return generateFallbackResponse(question, queryResult);
    }

    console.log('[generateNaturalLanguageResponseWithContext] Response generated successfully');
    return responseContent;
    
  } catch (error: any) {
    console.error('[generateNaturalLanguageResponseWithContext] Error:', error);
    console.log('[generateNaturalLanguageResponseWithContext] Using fallback response');
    return generateFallbackResponse(question, queryResult);
  }
}

// 構建帶上下文的提示
function buildPromptWithContext(
  question: string,
  schema: string,
  complexity: ComplexityAnalysis,
  conversationHistory: ConversationEntry[]
): string {
  const complexityInstructions = {
    simple: '這是一個簡單查詢，請生成直接的 SELECT 語句。',
    medium: '這是一個中等複雜度查詢，可能需要 JOIN 或聚合函數。',
    complex: '這是一個複雜查詢，可能需要多表聯接、子查詢或複雜的聚合邏輯。',
  };

  // 準備對話歷史上下文
  const contextHistory = conversationHistory.slice(-3).map((entry, index) => `
${index + 1}. 用戶問題：${entry.question}
   生成的SQL：${entry.sql}
   查詢結果摘要：${typeof entry.result === 'object' ? `${entry.result.rowCount || 0} 筆記錄` : entry.result}
`).join('');

  return `
你是一個專業的 PostgreSQL 數據庫專家，專門為 NewPennine 托盤管理系統生成 SQL 查詢。

## 🏭 NewPennine 專案業務流程概述

NewPennine 是一個托盤生產和庫存管理系統，主要業務流程包括：

### 1. 🏷️ QC 標籤生產流程（正常生產）
- **流程**：操作員輸入產品代碼和數量 → 生成托盤號(ddMMyy/N)和系列號(ddMMyy-XXXXXX) → 列印QC標籤
- **數據記錄**：
  - record_palletinfo: 記錄托盤基本信息，plt_remark = "Finished In Production"
  - record_history: action = "QC Label", loc = "Await"
  - record_inventory: 在對應位置增加庫存

### 2. 📦 GRN 收貨流程（Material GRN）
- **流程**：收到供應商物料 → 輸入GRN號、供應商、重量 → 生成收貨標籤
- **數據記錄**：
  - record_palletinfo: plt_remark = "Material GRN- [GRN Number]"
  - record_grn: 記錄詳細重量信息（net_weight淨重, gross_weight毛重）
  - record_history: action = "GRN Receiving", loc = "Await"

### 3. 🚚 庫存轉移流程
- **路徑**：Await → Production → Fold Mill → Production（循環）
- **數據記錄**：
  - record_history: action = "Stock Transfer", 更新loc位置
  - record_inventory: 調整各位置庫存數量

### 4. ❌ 作廢托盤流程
- **情況**：損壞、錯誤數量、錯誤產品代碼等
- **數據記錄**：
  - record_history: action = "Void Pallet", loc = "Voided"
  - record_inventory: 從原位置扣減庫存
  - 特殊處理：ACO托盤退回remain_qty，GRN托盤刪除record_grn記錄

## 📊 核心數據表關係

### record_palletinfo（托盤主表）
- plt_num: 托盤號（主鍵）
- product_code: 產品代碼
- product_qty: 產品數量
- series: 系列號
- plt_remark: 托盤備註（業務類型標識）
- generate_time: 生成時間

### record_history（操作歷史表）
- 記錄所有操作歷史
- 托盤當前位置 = 該托盤號最新記錄的loc字段
- time: 操作時間
- action: 操作類型
- loc: 位置
- plt_num: 托盤號

### record_grn（GRN收貨詳情表）
- plt_num: 關聯托盤號
- net_weight: 淨重
- gross_weight: 毛重
- grn_ref: GRN參考號

### record_inventory（庫存表）
- 按位置分列存儲庫存：injection(Production), await(Await), fold(Fold Mill)等
- plt_num: 托盤號（主鍵）
- product_code: 產品代碼

## 🔍 關鍵業務邏輯規則

### GRN 托盤識別規則
- **GRN 托盤**：record_palletinfo.plt_remark LIKE '%Material GRN%'
- **非GRN 托盤**：plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%'

### 日期查詢規則
- **今天**：DATE(generate_time) = CURRENT_DATE
- **昨天**：DATE(generate_time) = CURRENT_DATE - INTERVAL '1 day'
- **前天**：DATE(generate_time) = CURRENT_DATE - INTERVAL '2 days'

### 位置查詢規則
- 托盤當前位置 = record_history 表中該 plt_num 最新記錄的 loc 字段
- 常見位置：Await, Production, Fold Mill, PipeLine, Bulk Room, Voided

數據庫結構：
${schema}

對話歷史：${contextHistory || '（無歷史記錄）'}

當前用戶問題：${question}

${complexityInstructions[complexity.level]}

## 📝 SQL 生成規則

### 基本規則
1. 只生成 SELECT 查詢，不允許 INSERT、UPDATE、DELETE
2. 使用正確的表格和欄位名稱，欄位名稱用雙引號包圍
3. 限制結果數量（LIMIT 100）
4. 處理 NULL 值

### 常用查詢模式

#### 今天托盤總數
\`\`\`sql
SELECT COUNT(*) 
FROM "record_palletinfo" 
WHERE DATE("generate_time") = CURRENT_DATE;
\`\`\`

#### 今天GRN收貨托盤數量
\`\`\`sql
SELECT COUNT(*) 
FROM "record_palletinfo" 
WHERE DATE("generate_time") = CURRENT_DATE 
AND "plt_remark" LIKE '%Material GRN%';
\`\`\`

#### 今天非GRN托盤數量
\`\`\`sql
SELECT COUNT(*) 
FROM "record_palletinfo" 
WHERE DATE("generate_time") = CURRENT_DATE 
AND ("plt_remark" IS NULL OR "plt_remark" NOT LIKE '%Material GRN%');
\`\`\`

#### 今天GRN重量統計
\`\`\`sql
SELECT 
    COUNT(DISTINCT rp."plt_num") as pallet_count,
    COALESCE(SUM(rg."net_weight"), 0) as total_net_weight,
    COALESCE(SUM(rg."gross_weight"), 0) as total_gross_weight
FROM "record_palletinfo" rp
JOIN "record_grn" rg ON rp."plt_num" = rg."plt_num"
WHERE DATE(rp."generate_time") = CURRENT_DATE
AND rp."plt_remark" LIKE '%Material GRN%';
\`\`\`

#### 產品查詢（托盤數和總數量）
\`\`\`sql
SELECT 
    COUNT(*) as pallet_count,
    COALESCE(SUM("product_qty"), 0) as total_quantity
FROM "record_palletinfo" 
WHERE UPPER("product_code") = UPPER('產品代碼');
\`\`\`

#### 托盤當前位置查詢
\`\`\`sql
SELECT DISTINCT ON (rh."plt_num") 
    rh."plt_num", rh."loc" as current_location
FROM "record_history" rh
WHERE rh."plt_num" IN (選定的托盤號列表)
ORDER BY rh."plt_num", rh."time" DESC;
\`\`\`

### 上下文理解規則
- 如果用戶提到「GRN」、「收貨」：查詢包含 '%Material GRN%' 的托盤
- 如果用戶提到「排除GRN」、「不包括收貨」：排除包含 'Material GRN' 的托盤
- 如果用戶提到「生產」、「正常」：查詢不包含 'Material GRN' 的托盤
- 如果用戶提到重量：需要 JOIN record_grn 表
- 如果用戶提到位置：需要查詢 record_history 表

請按以下格式回應：

推理過程：
[解釋你的思考過程，說明識別了哪種業務場景，如何處理日期和GRN條件]

SQL查詢：
\`\`\`sql
-- 你的 SQL 查詢
\`\`\`
`;
}

// 執行產品聚合查詢
async function executeProductAggregationQuery(sql: string, supabase: any): Promise<any> {
  console.log('[executeProductAggregationQuery] Processing product aggregation');
  
  // 提取產品代碼
  const productMatch = sql.match(/upper\s*\(\s*["`]?product_code["`]?\s*\)\s*=\s*upper\s*\(\s*['"](.*?)['"]\s*\)/i);
  if (!productMatch) {
    throw new Error('無法提取產品代碼');
  }
  
  const productCode = productMatch[1].toUpperCase();
  console.log('[executeProductAggregationQuery] Product code:', productCode);
  
  // 執行聚合查詢
  const { data, error } = await supabase
    .from('record_palletinfo')
    .select('product_qty')
    .ilike('product_code', productCode);
  
  if (error) {
    console.error('[executeProductAggregationQuery] Query error:', error);
    throw error;
  }
  
  const palletCount = data?.length || 0;
  const totalQuantity = data?.reduce((sum: number, item: any) => sum + (item.product_qty || 0), 0) || 0;
  
  console.log('[executeProductAggregationQuery] Result - Pallets:', palletCount, 'Total Qty:', totalQuantity);
  
  return {
    data: [{ pallet_count: palletCount, total_quantity: totalQuantity }],
    error: null
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 檢查URL參數，如果包含debug=true，提供詳細的數據分析
    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === 'true';
    
    // 檢查環境變數
    const envCheck = {
      openaiApiKey: !!process.env.OPENAI_API_KEY,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
    
    // 檢查用戶認證
    let userCheck: { authenticated: boolean; email: string | null; hasPermission: boolean } = { 
      authenticated: false, 
      email: null, 
      hasPermission: false 
    };
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userCheck = {
          authenticated: true,
          email: user.email,
          hasPermission: ALLOWED_USERS.includes(user.email)
        };
      }
    } catch (authError) {
      console.log('[Ask Database Status] Auth check failed:', authError);
    }
    
    // 檢查數據庫連接
    let dbCheck = { connected: false, tablesAccessible: false };
    try {
      const { data, error } = await supabase
        .from('data_code')
        .select('code')
        .limit(1);
      
      dbCheck = {
        connected: !error,
        tablesAccessible: !!data
      };
    } catch (dbError) {
      console.log('[Ask Database Status] DB check failed:', dbError);
    }
    
    // 檢查 OpenAI 連接（簡單測試）
    let openaiCheck = { configured: false, accessible: false };
    if (process.env.OPENAI_API_KEY) {
      openaiCheck.configured = true;
      try {
        // 簡單的 API 測試
        const testResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        });
        openaiCheck.accessible = !!testResponse.choices?.[0]?.message?.content;
      } catch (openaiError) {
        console.log('[Ask Database Status] OpenAI check failed:', openaiError);
      }
    }
    
    let dataAnalysis = null;
    
    // 如果debug=true，提供詳細的數據分析
    if (debug && userCheck.hasPermission) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 查詢今天的托盤總數
        const { data: allPallets, error: allError } = await supabase
          .from('record_palletinfo')
          .select('plt_num, plt_remark, generate_time')
          .gte('generate_time', today + 'T00:00:00')
          .lt('generate_time', today + 'T23:59:59');
          
        if (!allError) {
          // 分析GRN相關數據
          const grnPallets = allPallets?.filter(p => 
            p.plt_remark && p.plt_remark.includes('Material GRN')
          ) || [];
          
          const nonGrnPallets = allPallets?.filter(p => 
            !p.plt_remark || !p.plt_remark.includes('Material GRN')
          ) || [];
          
          dataAnalysis = {
            today: today,
            totalPallets: allPallets?.length || 0,
            grnPallets: grnPallets.length,
            nonGrnPallets: nonGrnPallets.length,
            sampleData: {
              allPallets: allPallets?.slice(0, 5).map(p => ({
                plt_num: p.plt_num,
                plt_remark: p.plt_remark,
                generate_time: p.generate_time,
                isGrn: p.plt_remark?.includes('Material GRN') || false
              })) || [],
              grnSample: grnPallets.slice(0, 3).map(p => ({
                plt_num: p.plt_num,
                plt_remark: p.plt_remark
              })),
              nonGrnSample: nonGrnPallets.slice(0, 3).map(p => ({
                plt_num: p.plt_num,
                plt_remark: p.plt_remark
              }))
            }
          };
        }
      } catch (dataError: any) {
        console.log('[Ask Database Status] Data analysis failed:', dataError);
        dataAnalysis = { error: dataError.message };
      }
    }
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      user: userCheck,
      database: dbCheck,
      openai: openaiCheck,
      cache: {
        size: queryCache.size,
        schemaLastUpdated: schemaLastUpdated ? new Date(schemaLastUpdated).toISOString() : null
      },
      dataAnalysis: dataAnalysis
    };
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    console.error('[Ask Database Status] Error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error.message },
      { status: 500 }
    );
  }
}