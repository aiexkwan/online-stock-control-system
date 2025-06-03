import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/app/utils/supabase/server';
import { LRUCache } from 'lru-cache';
import { classifyUserIntent, executeRpcQuery, QueryIntent } from './intent-classifier';

// 初始化 OpenAI 客戶端 (僅用於自然語言回應生成)
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

// 初始化緩存 - 優化緩存策略
const queryCache = new LRUCache<string, any>({
  max: 3000, // 增加緩存容量 (RPC 查詢更標準化，緩存效果更好)
  ttl: 4 * 3600 * 1000, // 延長到4小時 (RPC 結果更穩定)
});

// 會話歷史緩存 (sessionId -> conversation history)
const conversationCache = new LRUCache<string, ConversationEntry[]>({
  max: 300, // 增加會話緩存容量
  ttl: 24 * 60 * 60 * 1000, // 24小時
});

// 用戶名稱緩存 (email -> name)
const userNameCache = new LRUCache<string, string>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000, // 24小時
});

// 對話記錄類型
interface ConversationEntry {
  timestamp: string;
  question: string;
  rpcFunction: string;
  answer: string;
  result: any;
  intent: QueryIntent;
}

// 🚀 RPC 優化模式啟用 - 完全取代 OpenAI SQL 生成
console.log('[Ask Database] 🚀 RPC OPTIMIZATION MODE ENABLED - Build 2025-01-02-RPC');
console.log('[Ask Database] ✅ OpenAI SQL generation DISABLED - Using RPC functions only');
console.log('[Ask Database] ✅ OpenAI used for natural language response generation only');
queryCache.clear();
conversationCache.clear();
userNameCache.clear();
console.log('[Ask Database] All caches cleared - RPC optimization applied');

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userEmail: string | null = null;
  let userName: string | null = null;
  
  try {
    console.log('[Ask Database] 🚀 RPC Mode - Request received');
    
    const { question, sessionId } = await request.json();
    console.log('[Ask Database] Question:', question);
    console.log('[Ask Database] Session ID:', sessionId);

    // 1. 並行執行權限檢查和會話歷史獲取
    console.log('[Ask Database] Starting parallel operations...');
    const [hasPermission, conversationHistory, userInfo] = await Promise.all([
      checkUserPermission(),
      Promise.resolve(getConversationHistory(sessionId)),
      getUserInfo()
    ]);

    if (!hasPermission) {
      console.log('[Ask Database] Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to use the database query feature' },
        { status: 403 }
      );
    }
    
    userEmail = userInfo.email;
    userName = userInfo.name;
    console.log('[Ask Database] User info:', { email: userEmail, name: userName });
    console.log('[Ask Database] Permission granted, conversation history length:', conversationHistory.length);

    // 2. 檢查緩存 (包含會話上下文的緩存鍵)
    const cacheKey = generateCacheKey(question, conversationHistory);
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) {
      console.log('[Ask Database] 🎯 Cache hit - returning cached result');
      
      // 異步保存聊天記錄（不等待完成）
      saveQueryRecordAsync(question, cachedResult.answer, userName, cachedResult.tokenUsage);
      
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      });
    }
    console.log('[Ask Database] Cache miss');

    // 3. 🚀 新流程：智能意圖識別 (取代 OpenAI SQL 生成)
    console.log('[Ask Database] 🧠 Starting intent classification...');
    const intent = classifyUserIntent(question);
    console.log('[Ask Database] Intent classified:', {
      type: intent.type,
      rpcFunction: intent.rpcFunction,
      confidence: intent.confidence,
      description: intent.description
    });

    // 4. 🚀 直接執行 RPC 函數 (取代 SQL 執行)
    console.log('[Ask Database] 🚀 Executing RPC function...');
    const queryResult = await executeRpcQuery(intent, createClient());
    console.log('[Ask Database] RPC result:', {
      rowCount: Array.isArray(queryResult.data) ? queryResult.data.length : 1,
      executionTime: queryResult.executionTime
    });

    // 5. 生成自然語言回應 (保留 OpenAI，但更快)
    console.log('[Ask Database] 📝 Generating natural language response...');
    const { response, tokenUsage } = await generateNaturalLanguageResponseForRpc(
      question,
      queryResult,
      intent,
      conversationHistory
    );
    console.log('[Ask Database] Response generated');

    const result = {
      question,
      intent: {
        type: intent.type,
        rpcFunction: intent.rpcFunction,
        confidence: intent.confidence,
        description: intent.description
      },
      result: queryResult,
      answer: response,
      executionTime: queryResult.executionTime,
      cached: false,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      mode: 'RPC_OPTIMIZED', // 標識使用 RPC 模式
      tokenUsage: tokenUsage
    };

    // 6. 並行執行緩存保存、會話歷史保存和聊天記錄保存
    console.log('[Ask Database] 💾 Saving results...');
    const saveOperations = [
      // 緩存結果
      Promise.resolve(queryCache.set(cacheKey, result)),
      // 保存會話歷史
      Promise.resolve(saveConversationHistory(sessionId, {
      timestamp: result.timestamp,
      question,
        rpcFunction: intent.rpcFunction,
      answer: response,
      result: queryResult,
        intent: intent
      })),
      // 保存聊天記錄到數據庫
      saveQueryRecordAsync(question, response, userName, tokenUsage)
    ];

    // 不等待保存操作完成，直接返回結果以提高響應速度
    Promise.all(saveOperations).catch(error => {
      console.error('[Ask Database] Save operations failed:', error);
    });

    console.log('[Ask Database] 🎉 RPC request completed successfully in', Date.now() - startTime, 'ms');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Ask Database] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      responseTime: Date.now() - startTime
    });
    
    // 根據錯誤類型提供更具體的錯誤訊息
    let errorMessage = 'Query processing failed, please try again later';
    
    if (error.message?.includes('RPC function')) {
      errorMessage = 'Database query failed, please try to rephrase your question';
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = 'Response generation failed, but query was successful';
    } else if (error.message?.includes('permission') || error.message?.includes('auth')) {
      errorMessage = 'Permission verification failed, please log in again';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Query timeout, please try to simplify your question';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        responseTime: Date.now() - startTime,
        mode: 'RPC_OPTIMIZED'
      },
      { status: 500 }
    );
  }
}

// 獲取用戶信息（包括用戶名）
async function getUserInfo(): Promise<{ email: string | null; name: string | null }> {
  const supabase = createClient();
  
  try {
    // 在開發環境中，如果沒有認證用戶，使用一個真實的測試用戶
    if (process.env.NODE_ENV === 'development') {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
        console.log('[getUserInfo] Development mode: No authenticated user, using test user');
        // 使用第一個真實用戶作為測試用戶
        const { data: testUser, error } = await supabase
          .from('data_id')
          .select('name, email')
          .limit(1)
          .single();
        
        if (testUser) {
          const testEmail = testUser.email || `test-user-${testUser.name.toLowerCase()}@pennineindustries.com`;
          console.log('[getUserInfo] Using test user:', testUser.name, 'with email:', testEmail);
          return { email: testEmail, name: testUser.name };
        }
      }
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      console.log('[getUserInfo] No authenticated user found');
      return { email: null, name: null };
    }

    // 檢查緩存
    const cachedName = userNameCache.get(user.email);
    if (cachedName) {
      console.log('[getUserInfo] Using cached user name for:', user.email);
      return { email: user.email, name: cachedName };
    }

    // 從 data_id 表獲取用戶名
    console.log('[getUserInfo] Fetching user name from database for:', user.email);
    const { data: userData, error } = await supabase
      .from('data_id')
      .select('name')
      .eq('email', user.email)
      .single();

    if (error || !userData) {
      console.log('[getUserInfo] User not found in data_id table:', user.email, 'Error:', error?.message);
      // 使用email作為fallback，但仍然是真實用戶
      return { email: user.email, name: user.email };
    }

    // 緩存用戶名
    userNameCache.set(user.email, userData.name);
    console.log('[getUserInfo] User name cached:', userData.name);
    
    return { email: user.email, name: userData.name };
  } catch (error) {
    console.error('[getUserInfo] Error:', error);
    return { email: null, name: null };
  }
}

// 異步保存聊天記錄到 query_record 表
async function saveQueryRecordAsync(query: string, answer: string, user: string | null, tokenUsage: number = 0): Promise<void> {
  // 不阻塞主流程，異步執行
  setImmediate(async () => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('query_record')
        .insert({
          query: query,
          answer: answer,
          user: user || 'Unknown User',
          token: tokenUsage
        });

      if (error) {
        console.error('[saveQueryRecordAsync] Failed to save query record:', error);
      } else {
        console.log('[saveQueryRecordAsync] Query record saved successfully with token usage:', tokenUsage);
      }
    } catch (error) {
      console.error('[saveQueryRecordAsync] Error saving query record:', error);
    }
  });
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

// 🚀 新的自然語言回應生成函數 (針對 RPC 結果優化)
async function generateNaturalLanguageResponseForRpc(
  question: string,
  queryResult: any,
  intent: QueryIntent,
  conversationHistory: ConversationEntry[]
): Promise<{ response: string; tokenUsage: number }> {
  try {
    console.log('[generateNaturalLanguageResponseForRpc] Building optimized prompt...');
    const prompt = buildRpcResponsePrompt(question, queryResult, intent, conversationHistory);
    
    console.log('[generateNaturalLanguageResponseForRpc] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800, // 減少 token 使用
    });

    if (!response.choices || response.choices.length === 0) {
      console.warn('[generateNaturalLanguageResponseForRpc] No response from OpenAI, using fallback');
      return {
        response: generateFallbackResponseForRpc(question, queryResult, intent),
        tokenUsage: 0
      };
    }

    const responseContent = response.choices[0].message.content;
    if (!responseContent || responseContent.trim().length === 0) {
      console.warn('[generateNaturalLanguageResponseForRpc] Empty response from OpenAI, using fallback');
      return {
        response: generateFallbackResponseForRpc(question, queryResult, intent),
        tokenUsage: 0
      };
    }

    // 獲取 token 使用量
    const tokenUsage = response.usage?.total_tokens || 0;
    console.log('[generateNaturalLanguageResponseForRpc] Response generated successfully, tokens used:', tokenUsage);
    
    return {
      response: responseContent,
      tokenUsage: tokenUsage
    };
    
  } catch (error: any) {
    console.error('[generateNaturalLanguageResponseForRpc] Error:', error);
    console.log('[generateNaturalLanguageResponseForRpc] Using fallback response');
    return {
      response: generateFallbackResponseForRpc(question, queryResult, intent),
      tokenUsage: 0
    };
  }
}

// 構建 RPC 結果的回應提示
function buildRpcResponsePrompt(
  question: string,
  queryResult: any,
  intent: QueryIntent,
  conversationHistory: ConversationEntry[]
): string {
  // 準備對話歷史上下文
  const contextHistory = conversationHistory.slice(-2).map((entry, index) => `
${index + 1}. Question: ${entry.question}
   RPC Function: ${entry.rpcFunction}
   Answer: ${entry.answer}
`).join('');

  // 處理不同類型的查詢結果
  let resultDisplay = '';
  let totalRecords = 0;
  
  if (typeof queryResult.data === 'number') {
    // 簡單數值返回 (如計數函數)
    resultDisplay = queryResult.data.toString();
    totalRecords = 1;
  } else if (Array.isArray(queryResult.data)) {
    // 數組返回 (如表格函數)
    resultDisplay = JSON.stringify(queryResult.data.slice(0, 5) || [], null, 2);
    totalRecords = queryResult.data.length;
  } else if (typeof queryResult.data === 'object' && queryResult.data !== null) {
    // 對象返回
    resultDisplay = JSON.stringify(queryResult.data, null, 2);
    totalRecords = 1;
  } else {
    resultDisplay = 'No data returned';
    totalRecords = 0;
  }

  // 生成日期範圍信息
  const dateRangeInfo = generateDateRangeInfo(intent.timeframe);

  return `You are a concise database assistant. Provide brief, direct answers without unnecessary explanations.

IMPORTANT RESPONSE GUIDELINES:
1. Be concise and direct - avoid lengthy explanations
2. Don't mention "NewPennine pallet management system" - user already knows they're in the system
3. Don't explain system operations, efficiency, or supply chain concepts
4. Don't add motivational phrases like "feel free to ask" or "crucial for tracking"
5. Focus only on answering the specific question asked
6. Use simple language: "according to records" instead of "according to the NewPennine pallet management system"
7. For time-range queries (week/month/yesterday), include the specific date range in parentheses

User Question: "${question}"

RPC Function Used: ${intent.rpcFunction}
Query Result: ${resultDisplay}
Total Records: ${totalRecords}
Execution Time: ${queryResult.executionTime}ms
Time Range Info: ${dateRangeInfo}

Previous Conversation Context:${contextHistory}

Provide a brief, direct answer that:
- States the result clearly
- For time-range queries, includes the date range like "This week(01/06/2025 - 07/06/2025)"
- Includes relevant details only if they help answer the question
- Avoids system descriptions and operational explanations
- Uses concise language

Example of good concise answers with date ranges:
- "This week(01/06/2025 - 07/06/2025), 16 transfers were made involving 15 unique pallets according to records."
- "Yesterday(06/06/2025), 15 pallets were generated."
- "This month(June 2025), 245 pallets were generated according to records."
- "Today, 10 pallets were generated according to records." (no date range needed for 'today')

For inventory ranking queries, provide clear product rankings:
- "Top 5 products by inventory: 1. MEP123456: 1,500 units, 2. ABC789012: 1,200 units, 3. XYZ345678: 900 units, 4. DEF901234: 750 units, 5. GHI567890: 600 units according to records."

For inventory threshold queries, list products below the threshold:
- "3 products have inventory below 100: MEP123456 (45 units), ABC789012 (23 units), XYZ345678 (67 units) according to records."

Answer:`;
}

// 生成日期範圍信息的輔助函數
function generateDateRangeInfo(timeframe: QueryIntent['timeframe']): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeframe) {
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return `Yesterday: ${formatDate(yesterday)}`;
    }
    
    case 'week': {
      // 計算本週的開始日期（週一）
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 週日是0，週一是1
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysToMonday);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `This week: ${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }
    
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      return `This month: ${formatDate(monthStart)} - ${formatDate(monthEnd)} (${getMonthName(today.getMonth())} ${today.getFullYear()})`;
    }
    
    case 'day_before_yesterday': {
      const dayBefore = new Date(today);
      dayBefore.setDate(today.getDate() - 2);
      return `Day before yesterday: ${formatDate(dayBefore)}`;
    }
    
    case 'today':
    default:
      return `Today: ${formatDate(today)}`;
  }
}

// 格式化日期的輔助函數
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// 獲取月份名稱的輔助函數
function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
}

// RPC 結果的備用回應生成函數
function generateFallbackResponseForRpc(question: string, queryResult: any, intent: QueryIntent): string {
  const dataCount = Array.isArray(queryResult.data) ? queryResult.data.length : 1;
  const executionTime = queryResult.executionTime || 0;
  
  if (dataCount === 0 || queryResult.data === null || queryResult.data === undefined) {
    return `Based on your query "${question}", no data was found using the ${intent.rpcFunction} function. This could be because:
1. No data exists for the specified criteria
2. The time period you asked about has no records
3. The product code or location might not exist

The query executed successfully in ${executionTime}ms. You might want to try adjusting your search criteria or checking a different time period.`;
  }
  
  // 根據意圖類型生成不同的回應
  switch (intent.type) {
    case 'count':
      // 處理不同類型的計數返回值
      let count = 0;
      
      // 1. 簡單計數函數 (如 get_today_pallet_count) 返回直接的數字
      if (typeof queryResult.data === 'number') {
        count = queryResult.data;
      }
      // 2. 表格函數返回對象數組
      else if (Array.isArray(queryResult.data) && queryResult.data.length > 0) {
        const firstRow = queryResult.data[0];
        count = firstRow?.count || firstRow?.pallet_count || firstRow?.total_quantity || 0;
      }
      // 3. 單個對象
      else if (typeof queryResult.data === 'object' && queryResult.data !== null) {
        count = queryResult.data.count || queryResult.data.pallet_count || queryResult.data.total_quantity || 0;
      }
      
      return `Based on your query "${question}", I found ${count} pallets. The query executed successfully in ${executionTime}ms using the ${intent.rpcFunction} function.`;
      
    case 'transfer':
      // 處理轉移統計返回值
      let transferInfo = '';
      
      if (Array.isArray(queryResult.data) && queryResult.data.length > 0) {
        const transferData = queryResult.data[0];
        const transferCount = transferData?.transfer_count || 0;
        const uniquePallets = transferData?.unique_pallets || 0;
        
        transferInfo = `${transferCount} transfer records involving ${uniquePallets} unique pallets`;
      } else if (typeof queryResult.data === 'object' && queryResult.data !== null) {
        const transferCount = queryResult.data.transfer_count || 0;
        const uniquePallets = queryResult.data.unique_pallets || 0;
        
        transferInfo = `${transferCount} transfer records involving ${uniquePallets} unique pallets`;
      } else {
        transferInfo = 'transfer data';
      }
      
      return `Based on your query "${question}", I found ${transferInfo}. The query executed successfully in ${executionTime}ms.`;
      
    case 'inventory_ranking':
      // 處理庫存排名返回值
      if (Array.isArray(queryResult.data) && queryResult.data.length > 0) {
        const topProducts = queryResult.data.slice(0, 5);
        let rankingInfo = `Top ${topProducts.length} products by inventory:\n`;
        
        topProducts.forEach((product: any, index: number) => {
          const rank = index + 1;
          const productCode = product.product_code || 'Unknown';
          const totalInventory = product.total_inventory || 0;
          rankingInfo += `${rank}. ${productCode}: ${totalInventory} units\n`;
        });
        
        return `Based on your query "${question}", here are the ${rankingInfo}Query executed successfully in ${executionTime}ms.`;
      } else {
        return `Based on your query "${question}", no inventory ranking data was found. Query executed in ${executionTime}ms.`;
      }
      
    case 'inventory_threshold':
      // 處理庫存閾值返回值
      if (Array.isArray(queryResult.data) && queryResult.data.length > 0) {
        const lowInventoryProducts = queryResult.data;
        let thresholdInfo = `${lowInventoryProducts.length} products with low inventory:\n`;
        
        lowInventoryProducts.forEach((product: any, index: number) => {
          const productCode = product.product_code || 'Unknown';
          const totalInventory = product.total_inventory || 0;
          thresholdInfo += `- ${productCode}: ${totalInventory} units\n`;
        });
        
        return `Based on your query "${question}", ${thresholdInfo}Query executed successfully in ${executionTime}ms.`;
      } else {
        return `Based on your query "${question}", no products found below the specified inventory threshold. Query executed in ${executionTime}ms.`;
      }
      
    case 'weight':
      const weightData = Array.isArray(queryResult.data) ? queryResult.data[0] : queryResult.data;
      if (weightData) {
        return `Based on your query "${question}", I found ${weightData.pallet_count || 0} pallets with a total net weight of ${weightData.total_net_weight || 0} and gross weight of ${weightData.total_gross_weight || 0}. Query executed in ${executionTime}ms.`;
      }
      break;
      
    case 'product':
      const productData = Array.isArray(queryResult.data) ? queryResult.data[0] : queryResult.data;
      if (productData) {
        return `Based on your query "${question}", I found ${productData.pallet_count || 0} pallets with a total quantity of ${productData.total_quantity || 0} units. Query executed in ${executionTime}ms.`;
      }
      break;
      
    case 'location':
      if (dataCount > 1) {
        return `Based on your query "${question}", I found inventory data for ${dataCount} different locations. The query executed successfully in ${executionTime}ms. You can see the detailed breakdown in the results below.`;
      }
      break;
  }
  
  return `Based on your query "${question}", I found ${dataCount} record(s). The query executed successfully in ${executionTime}ms using the ${intent.rpcFunction} function. You can view the detailed results below.`;
}

// 生成緩存鍵
function generateCacheKey(question: string, conversationHistory?: ConversationEntry[]): string {
  // 將會話歷史的關鍵信息納入緩存鍵
  const historyKey = conversationHistory && conversationHistory.length > 0 
    ? conversationHistory.slice(-2).map(entry => `${entry.question}:${entry.rpcFunction}`).join('|')
    : '';
  
  const fullKey = `${question}|${historyKey}`;
  return `rpc:${Buffer.from(fullKey).toString('base64')}`;
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
      mode: 'RPC_OPTIMIZED',
      version: '2025-01-02-RPC',
      environment: envCheck,
      user: userCheck,
      database: dbCheck,
      openai: openaiCheck,
      cache: {
        size: queryCache.size,
        maxSize: 3000,
        ttl: '4 hours'
      },
      features: {
        rpcOptimization: true,
        sqlGeneration: false,
        intentClassification: true,
        enhancedCaching: true
      },
      dataAnalysis: dataAnalysis
    };
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    console.error('[Ask Database Status] Error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error.message, mode: 'RPC_OPTIMIZED' },
      { status: 500 }
    );
  }
}