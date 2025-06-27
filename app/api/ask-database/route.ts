import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { LRUCache } from 'lru-cache';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { enhanceQueryWithTemplate } from '@/lib/query-templates';

// 不允許使用 Ask Database 功能的用戶（黑名單）
const BLOCKED_USERS = [
  'warehouse@pennineindustries.com',
  'production@pennineindustries.com'
];

// 初始化 OpenAI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 初始化緩存
const queryCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 2 * 3600 * 1000, // 2小時
});

// 會話歷史緩存
const conversationCache = new LRUCache<string, ConversationEntry[]>({
  max: 300,
  ttl: 24 * 60 * 60 * 1000, // 24小時
});

// 用戶名稱緩存
const userNameCache = new LRUCache<string, string>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000, // 24小時
});

// 對話記錄類型
interface ConversationEntry {
  timestamp: string;
  question: string;
  sql: string;
  answer: string;
  result: any;
}

interface QueryResult {
  question: string;
  sql: string;
  result: {
    data: any[];
    rowCount: number;
    executionTime: number;
  };
  answer: string;
  complexity: 'simple' | 'medium' | 'complex';
  tokensUsed: number;
  cached: boolean;
  timestamp: string;
}

process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🚀 OpenAI SQL Generation Mode - Build 2025-01-03');
process.env.NODE_ENV !== "production" && console.log('[Ask Database] ✅ Using OpenAI for SQL generation and natural language responses');

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userEmail: string | null = null;
  let userName: string | null = null;
  
  try {
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🚀 OpenAI Mode - Request received');
    
    const { question, sessionId } = await request.json();
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Question:', question);
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Session ID:', sessionId);

    // 1. 並行執行權限檢查和會話歷史獲取
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Starting parallel operations...');
    const [hasPermission, conversationHistory, userInfo] = await Promise.all([
      checkUserPermission(),
      Promise.resolve(getConversationHistory(sessionId)),
      getUserInfo()
    ]);

    if (!hasPermission) {
      process.env.NODE_ENV !== "production" && console.log('[Ask Database] Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to use the database query feature' },
        { status: 403 }
      );
    }
    
    userEmail = userInfo.email;
    userName = userInfo.name;
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] User info:', { email: userEmail, name: userName });
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Permission granted, conversation history length:', conversationHistory.length);

    // 2. 檢查智能緩存（多層）
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🔍 Checking intelligent cache system...');
    const cachedResult = await checkIntelligentCache(question, userEmail);
    if (cachedResult) {
      const cacheLevel = cachedResult.cacheLevel || 'L1';
      process.env.NODE_ENV !== "production" && console.log(`[Ask Database] 🎯 ${cacheLevel} Cache hit - returning cached result`);
      
      // 異步保存聊天記錄（記錄緩存命中）
      const safeResult = cachedResult.result || {};
      const safeData = safeResult.data || [];
      const safeExecutionTime = cachedResult.responseTime || safeResult.executionTime || 0;
      
      saveQueryRecordEnhanced(
        question, 
        cachedResult.answer, 
        userName, 
        0, // 緩存命中不耗費 token
        cachedResult.sql || '',
        cachedResult.result || null,
        safeExecutionTime,
        safeData.length,
        'cached'
      );
      
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        cacheLevel,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      });
    }
    
    // 3. 檢查舊版 LRU 緩存（向後兼容）
    const lruCacheKey = generateCacheKey(question, conversationHistory);
    const lruCachedResult = queryCache.get(lruCacheKey);
    if (lruCachedResult) {
      process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🎯 LRU Cache hit - returning cached result');
      
      saveQueryRecordAsync(question, lruCachedResult.answer, userName, lruCachedResult.tokensUsed, lruCachedResult.sql);
      
      return NextResponse.json({
        ...lruCachedResult,
        cached: true,
        cacheLevel: 'LRU',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      });
    }
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] All cache layers missed');

    // 3. 使用 OpenAI 生成 SQL 查詢
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🧠 Generating SQL with OpenAI...');
    const { sql, tokensUsed } = await generateSQLWithOpenAI(question, conversationHistory, userEmail);
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Generated SQL:', sql);
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Tokens used:', tokensUsed);

    // 4. 檢查 SQL 結果緩存 (L3)
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🔍 Checking SQL cache (L3)...');
    const sqlCacheResult = await checkSQLCache(sql);
    let queryResult;
    
    if (sqlCacheResult) {
      process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🎯 L3 SQL cache hit');
      queryResult = {
        data: sqlCacheResult.result?.data || [],
        rowCount: sqlCacheResult.result?.rowCount || 0,
        executionTime: sqlCacheResult.executionTime || 0
      };
    } else {
      // 5. 執行 SQL 查詢
      process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🚀 Executing SQL query...');
      queryResult = await executeSQLQuery(sql);
      process.env.NODE_ENV !== "production" && console.log('[Ask Database] SQL result:', {
        rowCount: queryResult.data.length,
        executionTime: queryResult.executionTime
      });
    }

    // 5. 使用 OpenAI 生成自然語言回應
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 📝 Generating natural language response with OpenAI...');
    const { answer, additionalTokens } = await generateAnswerWithOpenAI(question, sql, queryResult);
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] Natural language response generated');

    const totalTokens = tokensUsed + additionalTokens;
    const complexity = determineComplexity(sql, queryResult.data.length);

    const result: QueryResult = {
      question,
      sql,
      result: queryResult,
      answer,
      complexity,
      tokensUsed: totalTokens,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // 6. 並行執行緩存保存、會話歷史保存和聊天記錄保存
    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 💾 Saving results...');
    const finalCacheKey = generateCacheKey(question, conversationHistory);
    const saveOperations = [
      Promise.resolve(queryCache.set(finalCacheKey, result)),
      Promise.resolve(saveConversationHistory(sessionId, {
      timestamp: result.timestamp,
      question,
        sql,
        answer,
      result: queryResult,
      })),
      saveQueryRecordEnhanced(
        question,
        answer,
        userName,
        totalTokens,
        sql,
        queryResult,
        (queryResult && queryResult.executionTime ? queryResult.executionTime : 0),
        (queryResult && queryResult.data ? queryResult.data.length : 0),
        complexity
      )
    ];

    // 不等待保存操作完成，直接返回結果
    Promise.all(saveOperations).catch(error => {
      console.error('[Ask Database] Save operations failed:', error);
    });

    process.env.NODE_ENV !== "production" && console.log('[Ask Database] 🎉 OpenAI request completed successfully in', Date.now() - startTime, 'ms');
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
    
    if (error.message?.includes('SQL')) {
      errorMessage = 'SQL query generation failed, please try to rephrase your question';
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = 'AI service temporarily unavailable, please try again later';
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
        mode: 'OPENAI_SQL_GENERATION'
      },
      { status: 500 }
    );
  }
}

// 使用 OpenAI 生成 SQL 查詢
async function generateSQLWithOpenAI(question: string, conversationHistory: ConversationEntry[], userEmail: string | null): Promise<{ sql: string; tokensUsed: number }> {
  try {
    // 讀取 OpenAI prompt
    const fs = require('fs');
    const path = require('path');
    const promptPath = path.join(process.cwd(), 'docs', 'openAIprompt');
    const promptContent = fs.readFileSync(promptPath, 'utf8');

    // 嘗試使用查詢模板系統
    const templateResult = enhanceQueryWithTemplate(question);
    
    // 獲取同日對話歷史
    const dailyHistory = await getDailyQueryHistory(userEmail);
    
    // 構建包含同日歷史的 prompt
    let enhancedPrompt = promptContent;
    
    // 如果有匹配的模板，加入提示
    if (templateResult.enhanced && templateResult.hint) {
      enhancedPrompt += '\n\n### Query Template Suggestion:\n';
      enhancedPrompt += templateResult.hint;
      enhancedPrompt += '\nConsider using this optimized SQL template:\n';
      enhancedPrompt += '```sql\n' + templateResult.template + '\n```\n';
    }
    
    if (dailyHistory.length > 0) {
      enhancedPrompt += '\n\n### Previous Q&A history:\n';
      dailyHistory.forEach((entry: { question: string; answer: string }, index: number) => {
        enhancedPrompt += `User: ${entry.question}\n`;
        enhancedPrompt += `AI: ${entry.answer}\n`;
        if (index < dailyHistory.length - 1) enhancedPrompt += '\n';
      });
      enhancedPrompt += '\n---\n**Current question:**\n';
    }

    // 構建對話上下文
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      {
        role: 'system',
        content: enhancedPrompt
      }
    ];

    // 添加會話歷史（最近3次對話）
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3);
      for (const entry of recentHistory) {
        messages.push({
          role: 'user',
          content: entry.question
        });
        messages.push({
          role: 'assistant',
          content: `\`\`\`sql\n${entry.sql}\n\`\`\``
        });
      }
    }

    // 添加當前問題
    messages.push({
      role: 'user',
      content: question
    });

    process.env.NODE_ENV !== "production" && console.log('[OpenAI SQL] Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // 提取 SQL 查詢 - 支援多種格式
    let sql = '';
    
    // 嘗試匹配 ```sql 格式
    let sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/);
    if (sqlMatch) {
      sql = sqlMatch[1].trim();
    } else {
      // 嘗試匹配 ``` 格式
      sqlMatch = content.match(/```\n([\s\S]*?)\n```/);
      if (sqlMatch) {
        sql = sqlMatch[1].trim();
      } else {
        // 嘗試匹配單行 SQL
        sqlMatch = content.match(/SELECT[\s\S]*?;?$/i);
        if (sqlMatch) {
          sql = sqlMatch[0].trim();
        } else {
          console.error('[OpenAI SQL] Raw OpenAI response:', content);
          throw new Error('No SQL query found in OpenAI response');
        }
      }
    }

    if (!sql) {
      throw new Error('Empty SQL query extracted from OpenAI response');
    }
    
    // 驗證 SQL 是否為 SELECT 查詢
    if (!sql.toLowerCase().trim().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    process.env.NODE_ENV !== "production" && console.log('[OpenAI SQL] SQL generated successfully');
    return { sql, tokensUsed };

  } catch (error: any) {
    console.error('[OpenAI SQL] Error:', error);
    throw new Error(`SQL generation failed: ${error.message}`);
  }
}

// 執行 SQL 查詢
async function executeSQLQuery(sql: string): Promise<{ data: any[]; rowCount: number; executionTime: number }> {
  const supabase = createClient();
  const startTime = Date.now();

  try {
    process.env.NODE_ENV !== "production" && console.log('[SQL Execution] Executing query:', sql);
    
    const { data, error } = await supabase.rpc('execute_sql_query', { query_text: sql });
    
    const executionTime = Date.now() - startTime;

    if (error) {
      console.error('[SQL Execution] Error:', error);
      throw new Error(`SQL execution failed: ${error.message}`);
    }

    const resultData = Array.isArray(data) ? data : [];
    process.env.NODE_ENV !== "production" && console.log('[SQL Execution] Query executed successfully, rows:', resultData.length);

    return {
      data: resultData,
      rowCount: resultData.length,
      executionTime
    };

  } catch (error: any) {
    console.error('[SQL Execution] Error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

// 使用 OpenAI 生成自然語言回應
async function generateAnswerWithOpenAI(question: string, sql: string, queryResult: any): Promise<{ answer: string; additionalTokens: number }> {
  try {
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      {
        role: 'system',
        content: `You are a helpful database assistant for Pennine Manufacturing Industries. 
        Your task is to analyze SQL query results and provide clear, natural English responses.
        
        Guidelines:
        - Always respond in English only, regardless of the user's question language
        - Use a friendly, professional tone with slight British style
        - Be concise but informative
        - If no data is found, say "No matching record found."
        - For numerical results, present them clearly
        - For lists, format them nicely with bullet points or numbered lists
        - Don't mention technical details like SQL or database tables`
      },
      {
        role: 'user',
        content: `User question: ${question}

SQL query executed: ${sql}

Query results: ${JSON.stringify(queryResult.data, null, 2)}

Number of rows returned: ${queryResult.rowCount}

Please provide a natural English response to the user's question based on these results.`
      }
    ];

    process.env.NODE_ENV !== "production" && console.log('[OpenAI Answer] Generating natural language response...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      temperature: 0.3,
      max_tokens: 800,
    });

    const answer = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!answer) {
      throw new Error('OpenAI returned empty answer');
    }

    process.env.NODE_ENV !== "production" && console.log('[OpenAI Answer] Natural language response generated successfully');
    return { answer: answer.trim(), additionalTokens: tokensUsed };

  } catch (error: any) {
    console.error('[OpenAI Answer] Error:', error);
    // 如果 OpenAI 回應生成失敗，提供基本回應
    return { 
      answer: `Query executed successfully. Found ${queryResult.rowCount} result${queryResult.rowCount !== 1 ? 's' : ''}.`,
      additionalTokens: 0
    };
  }
}

// 判斷查詢複雜度
function determineComplexity(sql: string, resultCount: number): 'simple' | 'medium' | 'complex' {
  const lowerSql = sql.toLowerCase();
  
  if (lowerSql.includes('join') || lowerSql.includes('subquery') || lowerSql.includes('union')) {
    return 'complex';
  }
  
  if (lowerSql.includes('group by') || lowerSql.includes('order by') || lowerSql.includes('having')) {
    return 'medium';
  }
  
  return 'simple';
}

// 獲取同日查詢歷史
async function getDailyQueryHistory(userEmail: string | null): Promise<Array<{ question: string; answer: string }>> {
  if (!userEmail) return [];
  
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('query_record')
      .select('query, answer')
      .eq('user', userEmail)
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: true })
      .limit(10); // 限制最多10條歷史記錄
    
    if (error) {
      console.error('[getDailyQueryHistory] Error:', error);
      return [];
    }
    
    return (data || []).map(record => ({
      question: record.query,
      answer: record.answer
    }));
  } catch (error) {
    console.error('[getDailyQueryHistory] Error:', error);
    return [];
  }
}

// 獲取用戶信息
async function getUserInfo(): Promise<{ email: string | null; name: string | null }> {
  const supabase = createClient();
  
  try {
    // 在開發環境中，如果沒有認證用戶，使用測試用戶
    if (process.env.NODE_ENV === 'development') {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        process.env.NODE_ENV !== "production" && console.log('[getUserInfo] Development mode: No authenticated user, using test user');
        const { data: testUser, error } = await supabase
          .from('data_id')
          .select('name, email')
          .limit(1)
          .single();
        
        if (testUser) {
          const testEmail = testUser.email || `test-user-${testUser.name.toLowerCase()}@pennineindustries.com`;
          process.env.NODE_ENV !== "production" && console.log('[getUserInfo] Using test user:', testUser.name, 'with email:', testEmail);
          return { email: testEmail, name: testUser.name };
        }
      }
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      process.env.NODE_ENV !== "production" && console.log('[getUserInfo] No authenticated user found');
      return { email: null, name: null };
    }

    // 檢查緩存
    const cachedName = userNameCache.get(user.email);
    if (cachedName) {
      process.env.NODE_ENV !== "production" && console.log('[getUserInfo] Using cached user name for:', user.email);
      return { email: user.email, name: cachedName };
    }

    // 從 data_id 表獲取用戶名
    process.env.NODE_ENV !== "production" && console.log('[getUserInfo] Fetching user name from database for:', user.email);
    const { data: userData, error } = await supabase
      .from('data_id')
      .select('name')
      .eq('email', user.email)
      .single();

    if (error || !userData) {
      process.env.NODE_ENV !== "production" && console.log('[getUserInfo] User not found in data_id table:', user.email, 'Error:', error?.message);
      return { email: user.email, name: user.email };
    }

    // 緩存用戶名
    userNameCache.set(user.email, userData.name);
    process.env.NODE_ENV !== "production" && console.log('[getUserInfo] User name cached:', userData.name);
    
    return { email: user.email, name: userData.name };
  } catch (error) {
    console.error('[getUserInfo] Error:', error);
    return { email: null, name: null };
  }
}

// 生成查詢雜湊值
function generateQueryHash(query: string): string {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return Buffer.from(normalizedQuery).toString('base64').slice(0, 32);
}

// 檢查智能緩存系統（多層）
async function checkIntelligentCache(question: string, userEmail: string | null): Promise<any | null> {
  const supabase = createClient();
  
  try {
    // L1: 精確匹配緩存（最近24小時）
    const queryHash = generateQueryHash(question);
    const exactMatch = await supabase
      .from('query_record')
      .select('*')
      .eq('query_hash', queryHash)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (exactMatch.data && exactMatch.data.length > 0) {
      const record = exactMatch.data[0];
      process.env.NODE_ENV !== "production" && console.log('[checkIntelligentCache] L1 exact match found');
      
      // 安全處理 result_json，確保有正確結構
      const safeResult = record.result_json || {
        data: [],
        rowCount: 0,
        executionTime: record.execution_time || 0
      };
      
      return {
        question: record.query,
        sql: record.sql_query,
        result: safeResult,
        answer: record.answer,
        complexity: record.complexity || 'simple',
        tokensUsed: 0,
        cached: true,
        cacheLevel: 'L1-exact',
        responseTime: 50,
        timestamp: record.created_at
      };
    }

    // L2: 語義相似度緩存（最近7天，相似度 > 85%）
    const similarQueries = await supabase
      .from('query_record')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50); // 取最近50條記錄進行相似度比較

    if (similarQueries.data && similarQueries.data.length > 0) {
      // 簡單的相似度計算
      const questionWords = question.toLowerCase().split(/\s+/);
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const record of similarQueries.data) {
        const recordWords = record.query.toLowerCase().split(/\s+/);
        const similarity = calculateSimilarity(questionWords, recordWords);
        
        if (similarity > 0.85 && similarity > bestSimilarity) {
          bestMatch = record;
          bestSimilarity = similarity;
        }
      }

      if (bestMatch) {
        process.env.NODE_ENV !== "production" && console.log(`[checkIntelligentCache] L2 similar match found (${Math.round(bestSimilarity * 100)}% similarity)`);
        
        // 安全處理 result_json
        const safeResult = bestMatch.result_json || {
          data: [],
          rowCount: 0,
          executionTime: bestMatch.execution_time || 0
        };
        
        return {
          question: bestMatch.query,
          sql: bestMatch.sql_query,
          result: safeResult,
          answer: bestMatch.answer,
          complexity: bestMatch.complexity || 'simple',
          tokensUsed: 0,
          cached: true,
          cacheLevel: 'L2-semantic',
          similarity: bestSimilarity,
          responseTime: 100,
          timestamp: bestMatch.created_at
        };
      }
    }

    // L3: SQL 結果緩存（當有相同SQL時，最近1小時）
    // 這個會在SQL生成後檢查

    return null;
  } catch (error) {
    console.error('[checkIntelligentCache] Error:', error);
    return null;
  }
}

// 簡單相似度計算函數
function calculateSimilarity(words1: string[], words2: string[]): number {
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // 計算交集
  const intersectionArray = Array.from(set1).filter(x => set2.has(x));
  const intersection = new Set(intersectionArray);
  
  // 計算聯集
  const unionArray = Array.from(set1).concat(Array.from(set2));
  const union = new Set(unionArray);
  
  // Jaccard 相似度
  return intersection.size / union.size;
}

// 檢查 SQL 結果緩存
async function checkSQLCache(sql: string): Promise<any | null> {
  const supabase = createClient();
  
  try {
    const sqlMatch = await supabase
      .from('query_record')
      .select('*')
      .eq('sql_query', sql)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 最近1小時
      .order('created_at', { ascending: false })
      .limit(1);

    if (sqlMatch.data && sqlMatch.data.length > 0) {
      const record = sqlMatch.data[0];
      process.env.NODE_ENV !== "production" && console.log('[checkSQLCache] L3 SQL cache hit');
      return {
        result: record.result_json,
        executionTime: record.execution_time || 0,
        cached: true,
        cacheLevel: 'L3-sql'
      };
    }

    return null;
  } catch (error) {
    console.error('[checkSQLCache] Error:', error);
    return null;
  }
}

// 異步保存增強版聊天記錄
async function saveQueryRecordEnhanced(
  query: string, 
  answer: string, 
  user: string | null, 
  tokenUsage: number = 0, 
  sqlQuery: string = '',
  resultJson: any = null,
  executionTime: number = 0,
  rowCount: number = 0,
  complexity: string = 'simple'
): Promise<void> {
  setImmediate(async () => {
    try {
      const supabase = createClient();
      const queryHash = generateQueryHash(query);
      
      // 安全處理數值，確保不會有 null 值
      const safeExecutionTime = typeof executionTime === 'number' ? executionTime : 0;
      const safeRowCount = typeof rowCount === 'number' ? rowCount : 0;
      const safeTokenUsage = typeof tokenUsage === 'number' ? tokenUsage : 0;
      
      const { error } = await supabase
        .from('query_record')
        .insert({
          query: query,
          answer: answer,
          user: user || 'Unknown User',
          token: safeTokenUsage,
          sql_query: sqlQuery,
          result_json: resultJson,
          query_hash: queryHash,
          execution_time: safeExecutionTime,
          row_count: safeRowCount,
          complexity: complexity
        });

      if (error) {
        console.error('[saveQueryRecordEnhanced] Failed to save query record:', error);
      } else {
        process.env.NODE_ENV !== "production" && console.log('[saveQueryRecordEnhanced] Enhanced query record saved successfully');
      }
    } catch (error) {
      console.error('[saveQueryRecordEnhanced] Error saving query record:', error);
    }
  });
}

// 舊版本保持兼容性
async function saveQueryRecordAsync(query: string, answer: string, user: string | null, tokenUsage: number = 0, sqlQuery: string = ''): Promise<void> {
  return saveQueryRecordEnhanced(query, answer, user, tokenUsage, sqlQuery);
}

// 用戶權限檢查
async function checkUserPermission(): Promise<boolean> {
  // 開發環境下跳過權限檢查
  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_ENV !== "production" && console.log('[checkUserPermission] Development mode: skipping auth check for debugging');
    return true;
  }
  
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return false;
    }

    return !BLOCKED_USERS.includes(user.email);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// 生成緩存鍵
function generateCacheKey(question: string, conversationHistory?: ConversationEntry[]): string {
  const historyKey = conversationHistory && conversationHistory.length > 0 
    ? conversationHistory.slice(-2).map(entry => `${entry.question}:${entry.sql}`).join('|')
    : '';
  
  const fullKey = `${question}|${historyKey}`;
  return `openai:${Buffer.from(fullKey).toString('base64')}`;
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
    
    // 檢查URL參數
    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === 'true';
    
    // 檢查環境變數
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      openaiApiKey: !!process.env.OPENAI_API_KEY,
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
          hasPermission: !BLOCKED_USERS.includes(user.email)
        };
      }
    } catch (authError) {
      process.env.NODE_ENV !== "production" && console.log('[Ask Database Status] Auth check failed:', authError);
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
      process.env.NODE_ENV !== "production" && console.log('[Ask Database Status] DB check failed:', dbError);
    }
    
    const status = {
      timestamp: new Date().toISOString(),
      mode: 'OPENAI_SQL_GENERATION',
      version: '2025-01-03-OPENAI',
      environment: envCheck,
      user: userCheck,
      database: dbCheck,
      sqlGeneration: {
        type: 'openai_gpt4o',
        model: 'gpt-4o',
        promptSource: 'docs/openAIprompt'
      },
      answerGeneration: {
        type: 'openai_natural_language',
        model: 'gpt-4o',
        style: 'british_professional'
      },
      cache: {
        lru: {
          size: queryCache.size,
          maxSize: 1000,
          ttl: '2 hours'
        },
        intelligent: {
          source: 'query_record table',
          layers: {
            L1: 'Exact match (24h)',
            L2: 'Semantic similarity (7d, >85%)',
            L3: 'SQL result cache (1h)'
          }
        }
      },
      features: {
        openaiIntegration: true,
        sqlGeneration: true,
        naturalLanguageResponse: true,
        conversationHistory: true,
        caching: true
      }
    };
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    console.error('[Ask Database Status] Error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error.message, mode: 'OPENAI_SQL_GENERATION' },
      { status: 500 }
    );
  }
}