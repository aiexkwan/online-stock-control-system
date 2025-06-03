import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { LRUCache } from 'lru-cache';
import { classifyUserIntent, executeRpcQuery, QueryIntent } from './intent-classifier';
import { generateAnswer } from './answer-generator';

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

// 🚀 完全本地化模式啟用 - 零外部API依賴
console.log('[Ask Database] 🚀 FULL LOCAL MODE ENABLED - Build 2025-01-03-ZERO-API');
console.log('[Ask Database] ✅ Zero external API dependencies - Fully local processing');
console.log('[Ask Database] ✅ Local English answer generator with British style');
queryCache.clear();
conversationCache.clear();
userNameCache.clear();
console.log('[Ask Database] All caches cleared - Full local optimization applied');

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
      saveQueryRecordAsync(question, cachedResult.answer, userName, 0);
      
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

    // 5. 生成自然語言回應 (使用本地英式回答生成器)
    console.log('[Ask Database] 📝 Generating English response with local generator...');
    const response = generateAnswer(intent, queryResult, question);
    console.log('[Ask Database] English response generated locally');

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
      mode: 'FULL_LOCAL_ZERO_API', // 標識使用完全本地化零API依賴模式
      tokenUsage: 0 // 不再使用OpenAI，所以token為0
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
      saveQueryRecordAsync(question, response, userName, 0) // 0 tokens used
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
    } else if (error.message?.includes('answer generation')) {
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
        mode: 'FULL_LOCAL_ZERO_API'
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
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      localMode: true // 完全本地模式
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
      mode: 'FULL_LOCAL_ZERO_API',
      version: '2025-01-03-ZERO-API',
      environment: envCheck,
      user: userCheck,
      database: dbCheck,
      answerGenerator: {
        type: 'local_british_style',
        externalApiDependency: false,
        tokenCost: 0
      },
      cache: {
        size: queryCache.size,
        maxSize: 3000,
        ttl: '4 hours'
      },
      features: {
        rpcOptimization: true,
        sqlGeneration: false,
        intentClassification: true,
        enhancedCaching: true,
        localAnswerGeneration: true,
        zeroApiDependency: true
      },
      dataAnalysis: dataAnalysis
    };
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    console.error('[Ask Database Status] Error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error.message, mode: 'FULL_LOCAL_ZERO_API' },
      { status: 500 }
    );
  }
}