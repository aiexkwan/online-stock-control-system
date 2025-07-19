import { NextRequest, NextResponse } from 'next/server';
import { DatabaseRecord } from '@/lib/types/database';
import { getErrorMessage } from '@/lib/types/error-handling';
import { safeGet, safeNumber } from '@/lib/types/supabase-helpers';
import { createClient } from '@/app/utils/supabase/server';
import { LRUCache } from 'lru-cache';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Type definitions for better type safety

// Error classification types (Strategy 4: unknown + type narrowing)
interface ClassifiedError extends Error {
  errorType: string;
  originalError?: Error;
  sql?: string;
  severity?: 'low' | 'medium' | 'high';
  recoverable?: boolean;
}

// Type guard for classified errors
function isClassifiedError(error: unknown): error is ClassifiedError {
  return error instanceof Error && 
         typeof error === 'object' && 
         'errorType' in error && 
         typeof (error as Record<string, unknown>).errorType === 'string';
}

// SQL execution result types
interface SqlExecutionResult {
  data?: unknown[];
  error?: string;
  count?: number;
}
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SupabaseQueryResult {
  data: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

interface CacheEntry {
  question: string;
  sql: string;
  result: SupabaseQueryResult;
  answer: string;
  complexity: 'simple' | 'medium' | 'complex';
  tokensUsed: number;
  cached: boolean;
  timestamp: string;
  resolvedQuestion?: string;
  references?: Record<string, unknown>[];
  performanceAnalysis?: string;
}

interface QueryRecordData {
  query: string;
  answer: string;
  user: string;
  token: number;
  sql_query: string;
  result_json: SupabaseQueryResult | null;
  query_hash: string;
  fuzzy_hash: string;
  execution_time: number;
  row_count: number;
  complexity: string;
  session_id?: string;
  created_at?: string;
  expired_at?: string | null;
}
import { enhanceQueryWithTemplate } from '@/lib/query-templates';
import { optimizeSQL, analyzeQueryWithPlan, generatePerformanceReport } from '@/lib/sql-optimizer';
import { DatabaseConversationContextManager } from '@/lib/conversation-context-db';
import { 
  classifyError, 
  getRecoveryStrategy, 
  enhanceErrorMessage, 
  ErrorType,
  logErrorPattern,
  attemptErrorRecovery,
  generateUserMessage
} from '@/lib/unified-error-handler';
import { isDevelopment, isNotProduction } from '@/lib/utils/env';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// 不允許使用 Ask Database 功能的用戶（黑名單）
const BLOCKED_USERS = ['warehouse@pennineindustries.com', 'production@pennineindustries.com'];

// 初始化 OpenAI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 初始化緩存
const queryCache = new LRUCache<string, CacheEntry>({
  max: 1000,
  ttl: 2 * 3600 * 1000, // 2小時
});

// 緩存版本號 - 更改此值以強制清除所有緩存
const CACHE_VERSION = 'v2.1'; // Changed from v2.0 to force cache refresh

// 會話歷史已經移到數據庫，不再使用內存緩存

// 使用數據庫存儲對話上下文，不需要內存緩存

// 用戶名稱緩存
const userNameCache = new LRUCache<string, string>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000, // 24小時
});

interface QueryResult {
  question: string;
  sql: string;
  result: {
    data: Record<string, unknown>[];
    rowCount: number;
    executionTime: number;
  };
  answer: string;
  complexity: 'simple' | 'medium' | 'complex';
  tokensUsed: number;
  cached: boolean;
  timestamp: string;
  resolvedQuestion?: string;
  references?: Record<string, unknown>[];
  performanceAnalysis?: string;
}

// DTO interface for cache results (Strategy 2: DTO pattern)
interface CacheResult extends QueryResult {
  cacheLevel?: string;
  similarity?: number;
  responseTime?: number;
}

isNotProduction() &&
  console.log('[Ask Database] 🚀 OpenAI SQL Generation Mode - Build 2025-01-03');
isNotProduction() &&
  console.log('[Ask Database] ✅ Using OpenAI for SQL generation and natural language responses');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  let userEmail: string | null = null;
  let userName: string | null = null;
  let question: string = '';

  try {
    isNotProduction() &&
      console.log('[Ask Database] 🚀 OpenAI Mode - Request received');

    const body = await request.json();
    question = body.question;
    // 如果沒有提供 sessionId，生成一個新的
    const sessionId =
      body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    isNotProduction() && console.log('[Ask Database] Question:', question);
    isNotProduction() && console.log('[Ask Database] Session ID:', sessionId);

    // 獲取用戶信息（先獲取用戶信息，用於創建上下文管理器）
    const userInfo = await getUserInfo();
    userEmail = userInfo.email;
    userName = userInfo.name;

    // 創建數據庫上下文管理器
    const contextManager = new DatabaseConversationContextManager(sessionId, userEmail);

    // 檢查是否是詢問對話歷史的問題
    const conversationHistoryPatterns = [
      /what.*ask.*before/i,
      /what.*previous.*conversation/i,
      /what.*our.*conversation/i,
      /where.*are.*we/i, // "Where are we?" - 對話進展
      /what.*we.*discuss/i,
      /what.*talk.*about/i,
      /previous.*question/i,
      /previous.*conversation/i,
      /history.*conversation/i,
      /conversation.*history/i,
      /forget.*what.*ask/i,
      /show.*chat.*history/i,
      /show.*conversation/i,
      /past.*conversation/i,
      /earlier.*question/i,
      /recap.*conversation/i,
      /summarize.*discussion/i,
      /之前.*問.*什麼/i,
      /忘記.*問/i,
      /對話.*紀錄/i,
      /之前.*對話/i,
      /傾到邊/i,
      /討論.*邊度/i,
    ];

    const isAskingForHistory = conversationHistoryPatterns.some(pattern => pattern.test(question));

    if (isAskingForHistory) {
      isNotProduction() &&
        console.log('[Ask Database] User asking for conversation history');

      // 先嘗試獲取當前 session 的對話記錄
      let recentHistory = await contextManager.getSessionHistory(10);

      // 如果當前 session 沒有記錄，從數據庫獲取該用戶最近的對話
      if (recentHistory.length === 0 && userName) {
        isNotProduction() &&
          console.log('[Ask Database] No session history, fetching user history from database');

        const supabase = await createClient();
        const { data: userHistory, error } = await supabase
          .from('query_record')
          .select('query, sql_query, answer, created_at')
          .eq('user', userName) // 使用 userName 而不是 userEmail
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && userHistory && userHistory.length > 0) {
          // 轉換格式以匹配 recentHistory 的結構
          recentHistory = userHistory.reverse().map((record: DatabaseRecord) => ({
            question: record.query as string,
            sql: record.sql_query as string,
            answer: record.answer as string,
          }));
        }
      }

      if (recentHistory.length === 0) {
        const answer = "You haven't asked any questions yet.";

        // 保存查詢記錄
        saveQueryRecordEnhanced(
          question,
          answer,
          userName,
          0,
          '',
          { data: [], rowCount: 0, executionTime: 0 },
          0,
          0,
          'simple',
          sessionId
        );

        return NextResponse.json({
          question,
          sql: '',
          result: { data: [], rowCount: 0, executionTime: 0 },
          answer,
          complexity: 'simple',
          tokensUsed: 0,
          cached: false,
          timestamp: new Date().toISOString(),
        });
      }

      // 檢查是否值得使用 AI 生成（節省 token）
      let shouldUseAI = recentHistory.length >= 3; // 只有超過 3 條記錄先用 AI

      let historyResponse = '';
      let tokensUsed = 0;

      if (shouldUseAI) {
        try {
          const result = await generateConversationSummary(recentHistory.slice(-5), userName); // 最多只傳 5 條
          historyResponse = result.summary;
          tokensUsed = result.tokensUsed;
        } catch (error) {
          console.error('[Ask Database] AI summary generation failed:', error);
          shouldUseAI = false; // 失敗就用簡單方案
        }
      }

      // 簡單方案（少於 3 條或 AI 失敗）
      if (!shouldUseAI || !historyResponse) {
        historyResponse = "Here's what we've discussed:\n\n";
        recentHistory.forEach((entry, index) => {
          historyResponse += `${index + 1}. "${entry.question}"\n`;
          const shortAnswer = entry.answer.split('\n')[0].substring(0, 80);
          historyResponse += `   → ${shortAnswer}${entry.answer.length > 80 ? '...' : ''}\n\n`;
        });
      }

      // 保存查詢記錄
      saveQueryRecordEnhanced(
        question,
        historyResponse,
        userName,
        tokensUsed,
        '',
        { data: recentHistory, rowCount: recentHistory.length, executionTime: 0 },
        0,
        recentHistory.length,
        'simple',
        sessionId
      );

      return NextResponse.json({
        question,
        sql: '',
        result: { data: recentHistory, rowCount: recentHistory.length, executionTime: 0 },
        answer: historyResponse,
        complexity: 'simple',
        tokensUsed: 0,
        cached: false,
        timestamp: new Date().toISOString(),
      });
    }

    // 解析引用（使用數據庫中的歷史記錄）
    const { resolved: resolvedQuestion, references } =
      await contextManager.resolveReferences(question);
    if (references.length > 0) {
      isNotProduction() &&
        console.log('[Ask Database] Resolved references:', references);
    }

    // 1. 並行執行權限檢查和會話歷史獲取
    isNotProduction() &&
      console.log('[Ask Database] Starting parallel operations...');
    const [hasPermission, conversationHistory] = await Promise.all([
      checkUserPermission(),
      contextManager.getSessionHistory(5), // 獲取最近5條對話記錄
    ]);

    if (!hasPermission) {
      isNotProduction() && console.log('[Ask Database] Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to use the database query feature' },
        { status: 403 }
      );
    }
    isNotProduction() &&
      console.log('[Ask Database] User info:', { email: userEmail, name: userName });
    isNotProduction() &&
      console.log(
        '[Ask Database] Permission granted, conversation history length:',
        conversationHistory.length
      );

    // 2. 檢查智能緩存（多層）
    isNotProduction() &&
      console.log('[Ask Database] 🔍 Checking intelligent cache system...');
    const cachedResult = await checkIntelligentCache(question, userEmail);
    if (cachedResult) {
      const cacheLevel = cachedResult.cacheLevel || 'L1';
      isNotProduction() &&
        console.log(`[Ask Database] 🎯 ${cacheLevel} Cache hit - returning cached result`);

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
        'cached',
        sessionId
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
      isNotProduction() &&
        console.log('[Ask Database] 🎯 LRU Cache hit - returning cached result');

      saveQueryRecordAsync(
        question,
        lruCachedResult.answer,
        userName,
        lruCachedResult.tokensUsed,
        lruCachedResult.sql
      );

      return NextResponse.json({
        ...lruCachedResult,
        cached: true,
        cacheLevel: 'LRU',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      });
    }
    isNotProduction() && console.log('[Ask Database] All cache layers missed');

    // 3. 使用 OpenAI 生成 SQL 查詢（使用解析後的問題）
    isNotProduction() &&
      console.log('[Ask Database] 🧠 Generating SQL with OpenAI...');
    const sqlResult = await generateSQLWithOpenAI(
      resolvedQuestion,
      conversationHistory,
      userName, // 使用 userName 而不是 userEmail
      contextManager
    );

    // 檢查是否需要澄清
    if (sqlResult.clarification) {
      isNotProduction() &&
        console.log('[Ask Database] Clarification needed:', sqlResult.clarification);

      // 保存澄清問題到記錄
      saveQueryRecordEnhanced(
        question,
        sqlResult.clarification,
        userName,
        sqlResult.tokensUsed,
        '',
        { data: [], rowCount: 0, executionTime: 0 },
        0,
        0,
        'clarification',
        sessionId
      );

      return NextResponse.json({
        question,
        sql: '',
        result: { data: [], rowCount: 0, executionTime: 0 },
        answer: sqlResult.clarification,
        complexity: 'simple',
        tokensUsed: sqlResult.tokensUsed,
        cached: false,
        timestamp: new Date().toISOString(),
        needsClarification: true,
      });
    }

    const { sql: rawSQL, tokensUsed } = sqlResult;

    // 優化 SQL 查詢
    let sql = optimizeSQL(rawSQL, question);

    isNotProduction() && console.log('[Ask Database] Generated SQL:', rawSQL);
    isNotProduction() && console.log('[Ask Database] Optimized SQL:', sql);
    isNotProduction() && console.log('[Ask Database] Tokens used:', tokensUsed);

    // 檢查查詢成本
    const queryCost = await checkQueryCost(sql);
    if (queryCost.blocked) {
      isNotProduction() && 
        console.log('[Ask Database] Query blocked due to high cost:', queryCost.estimatedCost);
      
      return NextResponse.json({
        question,
        sql: '',
        result: { data: [], rowCount: 0, executionTime: 0 },
        answer: `I notice this query might be too expensive to run (estimated cost: ${queryCost.estimatedCost}). ${queryCost.suggestion}`,
        complexity: 'complex',
        tokensUsed,
        cached: false,
        timestamp: new Date().toISOString(),
        blockedReason: 'high_cost'
      });
    }

    // 4. 檢查 SQL 結果緩存 (L3)
    isNotProduction() &&
      console.log('[Ask Database] 🔍 Checking SQL cache (L3)...');
    const sqlCacheResult = await checkSQLCache(sql);
    let queryResult: { data: Record<string, unknown>[]; rowCount: number; executionTime: number } | undefined = undefined;

    if (sqlCacheResult) {
      isNotProduction() && console.log('[Ask Database] 🎯 L3 SQL cache hit');
      queryResult = {
        data: safeGet(sqlCacheResult, 'result.data', []),
        rowCount: safeNumber(safeGet(sqlCacheResult, 'result.rowCount', 0)),
        executionTime: safeNumber(safeGet(sqlCacheResult, 'executionTime', 0)),
      };
    } else {
      // 5. 執行 SQL 查詢（帶自動錯誤修復）
      isNotProduction() &&
        console.log('[Ask Database] 🚀 Executing SQL query...');
      
      let sqlExecutionAttempts = 0;
      const maxAttempts = 3;
      
      while (sqlExecutionAttempts < maxAttempts) {
        try {
          sqlExecutionAttempts++;
          queryResult = await executeSQLQuery(sql);
          isNotProduction() &&
            console.log('[Ask Database] SQL result:', {
              rowCount: queryResult.data.length,
              executionTime: queryResult.executionTime,
            });
          break; // 成功則跳出循環
        } catch (execError: unknown) {
          console.log(`[SQL Execution] Attempt ${sqlExecutionAttempts} failed:`, getErrorMessage(execError));
          
          // 如果已經是最後一次嘗試，拋出錯誤
          if (sqlExecutionAttempts >= maxAttempts) {
            throw execError;
          }
          
          // 嘗試自動修復
          const error = execError as Error;
          const classificationResult = isClassifiedError(error) ? 
            { errorType: error.errorType } : 
            classifyError(error, sql);
          const errorType = classificationResult.errorType;
          const recoveryStrategy = getRecoveryStrategy(errorType as any);
          
          if (recoveryStrategy.canAutoRecover) {
            try {
              console.log(`[SQL Recovery] Attempting ${recoveryStrategy.strategy}...`);
              const recoveryResult = await attemptErrorRecovery(errorType as any, sql, error);
              
              if (recoveryResult.fixedSQL) {
                sql = recoveryResult.fixedSQL;
                console.log('[SQL Recovery] SQL has been fixed, retrying...');
                
                // 記錄成功的恢復
                await logErrorPattern(errorType as any, error, { 
                  success: true, 
                  fixedSQL: sql 
                });
                
                // 如果有建議，記錄在日誌
                if (recoveryResult.suggestion) {
                  console.log('[SQL Recovery] Suggestion:', recoveryResult.suggestion);
                }
              } else {
                throw new Error('Recovery failed');
              }
            } catch (recoveryError) {
              console.error('[SQL Recovery] Recovery failed:', recoveryError);
              throw execError; // 拋出原始錯誤
            }
          } else {
            // 無法自動恢復，直接拋出
            throw execError;
          }
        }
      }
    }

    // 上下文已經通過 saveQueryRecordEnhanced 保存到數據庫

    // 4.5 分析查詢計劃（新增）
    let performanceAnalysis = null;
    if (isNotProduction() && queryResult) {
      try {
        isNotProduction() &&
          console.log('[Ask Database] 📊 Analyzing query performance...');
        const analysis = await analyzeQueryWithPlan(sql, question);
        
        if ((analysis.performanceScore && analysis.performanceScore < 70) || 
            (analysis.bottlenecks && analysis.bottlenecks.length > 0)) {
          performanceAnalysis = generatePerformanceReport(analysis);
          isNotProduction() &&
            console.log('[Ask Database] Performance issues detected:', {
              score: analysis.performanceScore,
              bottlenecks: analysis.bottlenecks?.length || 0,
              recommendations: analysis.recommendations?.length || 0
            });
        }
      } catch (error) {
        console.error('[Ask Database] Query plan analysis failed:', error);
        // 不影響主流程
      }
    }

    // 5. 使用 OpenAI 生成自然語言回應
    isNotProduction() &&
      console.log('[Ask Database] 📝 Generating natural language response with OpenAI...');
    const { answer, additionalTokens } = await generateAnswerWithOpenAI(question, sql, queryResult!);
    isNotProduction() &&
      console.log('[Ask Database] Natural language response generated');

    const totalTokens = tokensUsed + additionalTokens;
    const complexity = determineComplexity(sql, queryResult?.data.length || 0);

    const result: QueryResult = {
      question,
      sql,
      result: queryResult || { data: [], rowCount: 0, executionTime: 0 },
      answer,
      complexity,
      tokensUsed: totalTokens,
      cached: false,
      timestamp: new Date().toISOString(),
      resolvedQuestion: resolvedQuestion !== question ? resolvedQuestion : undefined,
      references: references.length > 0 ? references : undefined,
      performanceAnalysis: performanceAnalysis || undefined,
    };

    // 6. 並行執行緩存保存、會話歷史保存和聊天記錄保存
    isNotProduction() && console.log('[Ask Database] 💾 Saving results...');
    const finalCacheKey = generateCacheKey(question, conversationHistory);
    const saveOperations = [
      Promise.resolve(queryCache.set(finalCacheKey, result)),
      // 會話歷史已經通過 saveQueryRecordEnhanced 保存到數據庫
      Promise.resolve(),
      saveQueryRecordEnhanced(
        question,
        answer,
        userName,
        totalTokens,
        sql,
        queryResult,
        queryResult && queryResult.executionTime ? queryResult.executionTime : 0,
        queryResult && queryResult.data ? queryResult.data.length : 0,
        complexity,
        sessionId
      ),
    ];

    // 不等待保存操作完成，直接返回結果
    Promise.all(saveOperations).catch(error => {
      console.error('[Ask Database] Save operations failed:', error);
    });

    isNotProduction() &&
      console.log(
        '[Ask Database] 🎉 OpenAI request completed successfully in',
        Date.now() - startTime,
        'ms'
      );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorObj = error as Error & { errorType?: string; cause?: unknown };
    const classificationResult = errorObj.errorType ? 
      { errorType: errorObj.errorType } : 
      classifyError(errorObj);
    const errorType = classificationResult.errorType;
    
    console.error('[Ask Database] Error details:', {
      message: getErrorMessage(error),
      errorType: errorType,
      stack: errorObj.stack,
      name: errorObj.name,
      cause: errorObj.cause,
      responseTime: Date.now() - startTime,
    });

    // Type guard for ErrorType (Strategy 4: unknown + type narrowing)
    const safeErrorType = (typeof errorType === 'string' ? errorType : 'UNKNOWN_ERROR') as ErrorType;
    
    // 記錄錯誤模式（用於改進系統）
    await logErrorPattern(safeErrorType, errorObj, { 
      question, 
      success: false 
    });

    // 獲取恢復策略建議
    const recoveryStrategy = getRecoveryStrategy(safeErrorType);

    // 使用增強的錯誤訊息
    let errorMessage = enhanceErrorMessage(safeErrorType, getErrorMessage(error));
    
    // 如果有恢復建議，添加到錯誤訊息
    if (recoveryStrategy.suggestion) {
      errorMessage += `. Suggestion: ${recoveryStrategy.suggestion}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: isDevelopment() ? getErrorMessage(error) : undefined,
        responseTime: Date.now() - startTime,
        mode: 'OPENAI_SQL_GENERATION',
      },
      { status: 500 }
    );
  }
}

// 使用 OpenAI 生成 SQL 查詢
async function generateSQLWithOpenAI(
  question: string,
  conversationHistory: Array<{ question: string; sql: string; answer: string }>,
  userName: string | null,
  contextManager?: DatabaseConversationContextManager
): Promise<{ sql: string; tokensUsed: number; clarification?: string }> {
  try {
    // 讀取 OpenAI prompt
    const promptPath = path.join(process.cwd(), 'docs', 'openAIprompt');
    const promptContent = fs.readFileSync(promptPath, 'utf8');

    // 嘗試使用查詢模板系統
    const templateResult = enhanceQueryWithTemplate(question);

    // 獲取同日對話歷史
    const dailyHistory = await getDailyQueryHistory(userName);

    // 構建包含同日歷史的 prompt
    let enhancedPrompt = promptContent;

    // 添加上下文信息（使用數據庫中的上下文）
    if (contextManager) {
      const contextPrompt = await contextManager.generateContextPrompt();
      if (contextPrompt) {
        enhancedPrompt += '\n' + contextPrompt;
      }
    }

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
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: enhancedPrompt,
      },
    ];

    // 添加會話歷史（最近3次對話）
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3);
      for (const entry of recentHistory) {
        messages.push({
          role: 'user',
          content: entry.question,
        });
        messages.push({
          role: 'assistant',
          content: `\`\`\`sql\n${entry.sql}\n\`\`\``,
        });
      }
    }

    // 添加當前問題
    messages.push({
      role: 'user',
      content: question,
    });

    isNotProduction() &&
      console.log('[OpenAI SQL] Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as ChatCompletionMessageParam[],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // 檢查是否是澄清問題
    const isClarificationNeeded =
      content.toLowerCase().includes('clarify') ||
      content.toLowerCase().includes('please specify') ||
      content.toLowerCase().includes('could you') ||
      content.toLowerCase().includes('what do you mean') ||
      content.toLowerCase().includes('are you asking');

    if (isClarificationNeeded) {
      // 返回澄清問題作為特殊結果
      return {
        sql: '',
        tokensUsed,
        clarification: content,
      };
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

    // 驗證 SQL 是否為 SELECT 查詢（支援 WITH 語句）
    const normalizedSql = sql.toLowerCase().trim();
    const isSelectQuery =
      normalizedSql.startsWith('select') ||
      normalizedSql.startsWith('with') ||
      normalizedSql.startsWith('-- '); // Allow comments before SELECT

    if (!isSelectQuery) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Additional safety check - ensure no dangerous keywords
    const dangerousKeywords = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
    const sqlLower = sql.toLowerCase();
    for (const keyword of dangerousKeywords) {
      // Check if keyword appears at word boundaries
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(sqlLower)) {
        throw new Error(`Dangerous keyword "${keyword}" detected in query`);
      }
    }

    isNotProduction() && console.log('[OpenAI SQL] SQL generated successfully');
    return { sql, tokensUsed };
  } catch (error: unknown) {
    console.error('[OpenAI SQL] Error:', error);
    
    // 分類錯誤
    const classificationResult = classifyError(error);
    const errorType = classificationResult.errorType;
    
    // 錯誤恢復已經在主要錯誤處理系統中處理
    // 這裡只需要拋出增強的錯誤訊息
    
    // 增強錯誤訊息
    const enhancedMessage = enhanceErrorMessage(errorType, getErrorMessage(error));
    throw new Error(enhancedMessage);
  }
}

// 檢查查詢成本
async function checkQueryCost(sql: string): Promise<{
  estimatedCost: number;
  blocked: boolean;
  suggestion?: string;
}> {
  const MAX_ALLOWED_COST = 10000; // 最大允許成本
  
  try {
    // 使用 optimizeSQL 中的 estimateQueryCost 函數
    const { estimateQueryCost } = await import('@/lib/sql-optimizer');
    const estimatedCost = estimateQueryCost(sql);
    
    if (estimatedCost > MAX_ALLOWED_COST) {
      // 分析原因並提供建議
      const suggestions = [];
      const sqlLower = sql.toLowerCase();
      
      if (!sqlLower.includes('limit')) {
        suggestions.push('Try adding a LIMIT clause to reduce the result set');
      }
      
      if (!sqlLower.includes('where')) {
        suggestions.push('Add a WHERE clause to filter the data');
      }
      
      if (sqlLower.includes('record_history')) {
        suggestions.push('Consider adding a date range filter for the history table');
      }
      
      if ((sqlLower.match(/join/g) || []).length > 3) {
        suggestions.push('Try to reduce the number of JOINs or break the query into smaller parts');
      }
      
      return {
        estimatedCost,
        blocked: true,
        suggestion: suggestions.join('. ')
      };
    }
    
    return {
      estimatedCost,
      blocked: false
    };
  } catch (error) {
    console.error('[checkQueryCost as string] Error:', error);
    // 如果出錯，允許查詢繼續執行
    return {
      estimatedCost: 0,
      blocked: false
    };
  }
}

// 執行 SQL 查詢（增加超時控制）
async function executeSQLQuery(
  sql: string
): Promise<SupabaseQueryResult> {
  const supabase = await createClient();
  const startTime = Date.now();
  const QUERY_TIMEOUT = 30000; // 30秒超時

  try {
    isNotProduction() && console.log('[SQL Execution] Executing query:', sql);

    // 使用 Promise.race 實現超時控制
    const queryPromise = supabase.rpc('execute_sql_query', { query_text: sql });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 30 seconds')), QUERY_TIMEOUT)
    );

    const queryResponse = await Promise.race([queryPromise, timeoutPromise]) as { data: Record<string, unknown>[] | null; error: string | null };
    const { data, error } = queryResponse;

    const executionTime = Date.now() - startTime;

    if (error) {
      console.error('[SQL Execution] Error:', error);
      throw new Error(`SQL execution failed: ${getErrorMessage(error)}`);
    }

    const resultData = Array.isArray(data) ? data : [];
    isNotProduction() &&
      console.log('[SQL Execution] Query executed successfully, rows:', resultData.length);

    // 如果返回太多行，發出警告
    if (resultData.length > 1000) {
      console.warn('[SQL Execution] Large result set returned:', resultData.length, 'rows');
    }

    return {
      data: resultData,
      rowCount: resultData.length,
      executionTime,
    };
  } catch (error: unknown) {
    console.error('[SQL Execution] Error:', error);
    
    // 分類錯誤
    const classificationResult = classifyError(error, sql);
    const errorType = classificationResult.errorType;
    
    // 記錄錯誤模式
    const safeErrorTypeForSQL = (typeof errorType === 'string' ? errorType : 'SQL_EXECUTION_ERROR') as ErrorType;
    await logErrorPattern(
      safeErrorTypeForSQL,
      error as Error,
      { sql, success: false }
    );
    
    // 增強錯誤訊息  
    const enhancedMessage = enhanceErrorMessage(safeErrorTypeForSQL, getErrorMessage(error));
    
    // 為了向上層傳遞錯誤類型，創建新錯誤
    const enhancedError: ClassifiedError = Object.assign(new Error(enhancedMessage), {
      errorType: safeErrorTypeForSQL,
      originalError: error instanceof Error ? error : new Error(String(error)),
      sql
    });
    
    throw enhancedError;
  }
}

// 使用 OpenAI 生成自然語言回應
async function generateAnswerWithOpenAI(
  question: string,
  sql: string,
  queryResult: SupabaseQueryResult
): Promise<{ answer: string; additionalTokens: number }> {
  try {
    const messages: OpenAIMessage[] = [
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
        - Don't mention technical details like SQL or database tables`,
      },
      {
        role: 'user',
        content: `User question: ${question}

SQL query executed: ${sql}

Query results: ${JSON.stringify(queryResult.data, null, 2)}

Number of rows returned: ${queryResult.rowCount}

Please provide a natural English response to the user's question based on these results.`,
      },
    ];

    isNotProduction() &&
      console.log('[OpenAI Answer] Generating natural language response...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as ChatCompletionMessageParam[],
      temperature: 0.3,
      max_tokens: 800,
    });

    const answer = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!answer) {
      throw new Error('OpenAI returned empty answer');
    }

    isNotProduction() &&
      console.log('[OpenAI Answer] Natural language response generated successfully');
    return { answer: answer.trim(), additionalTokens: tokensUsed };
  } catch (error: unknown) {
    console.error('[OpenAI Answer] Error:', error);
    // 如果 OpenAI 回應生成失敗，提供基本回應
    return {
      answer: `Query executed successfully. Found ${queryResult.rowCount} result${queryResult.rowCount !== 1 ? 's' : ''}.`,
      additionalTokens: 0,
    };
  }
}

// 判斷查詢複雜度
function determineComplexity(sql: string, resultCount: number): 'simple' | 'medium' | 'complex' {
  const lowerSql = sql.toLowerCase();

  if (lowerSql.includes('join') || lowerSql.includes('subquery') || lowerSql.includes('union')) {
    return 'complex';
  }

  if (
    lowerSql.includes('group by') ||
    lowerSql.includes('order by') ||
    lowerSql.includes('having')
  ) {
    return 'medium';
  }

  return 'simple';
}

// 使用 AI 生成自然嘅對話總結
async function generateConversationSummary(
  history: Array<{ question: string; sql: string; answer: string }>,
  userName: string | null
): Promise<{ summary: string; tokensUsed: number }> {
  try {
    const messages: Pick<OpenAIMessage, 'role' | 'content'>[] = [
      {
        role: 'system',
        content: `You are a helpful assistant summarizing a database conversation. 
        Your task is to create a natural, conversational summary of what the user has been asking about.
        
        Guidelines:
        - Write in a friendly, conversational tone
        - Highlight key insights and findings
        - Group related queries naturally
        - Use "we" and "you" to make it personal
        - Keep it concise but informative
        - End with a helpful suggestion or question
        - Do NOT use bullet points or numbered lists
        - Write in flowing paragraphs
        
        The user's name is ${userName || 'there'}.`,
      },
      {
        role: 'user',
        content: `Summarize:\n${history
          .map((h, i) => {
            // 縮短答案以節省 token
            let shortAnswer = h.answer;
            if (h.answer.includes('**')) {
              // 提取粗體內容（通常是重要信息）
              const boldContent =
                h.answer
                  .match(/\*\*([^*]+)\*\*/g)
                  ?.slice(0, 3)
                  .join(', ') || '';
              shortAnswer = boldContent || h.answer.substring(0, 100);
            } else {
              shortAnswer = h.answer.substring(0, 100);
            }
            return `Q: ${h.question}\nA: ${shortAnswer}`;
          })
          .join('\n')}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 使用較快嘅 model
      messages: messages as ChatCompletionMessageParam[],
      temperature: 0.7, // 較高溫度令輸出更自然
      max_tokens: 300,
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error('AI returned empty summary');
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    return { summary: summary.trim(), tokensUsed };
  } catch (error) {
    console.error('[generateConversationSummary as string] Error:', error);
    throw error;
  }
}

// 獲取同日查詢歷史
async function getDailyQueryHistory(
  userName: string | null
): Promise<Array<{ question: string; answer: string }>> {
  if (!userName) return [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('query_record')
      .select('query, answer')
      .eq('user', userName) // 使用 userName 而不是 userEmail
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: true })
      .limit(10); // 限制最多10條歷史記錄

    if (error) {
      console.error('[getDailyQueryHistory as string] Error:', error);
      return [];
    }

    return (data || []).map((record: DatabaseRecord) => ({
      question: record.query as string,
      answer: record.answer as string,
    }));
  } catch (error) {
    console.error('[getDailyQueryHistory as string] Error:', error);
    return [];
  }
}

// 獲取用戶信息
async function getUserInfo(): Promise<{ email: string | null; name: string | null }> {
  const supabase = await createClient();

  try {
    // 在開發環境中，如果沒有認證用戶，使用測試用戶
    if (isDevelopment()) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        isNotProduction() &&
          console.log('[getUserInfo as string] Development mode: No authenticated user, using test user');
        const { data: testUser, error } = await supabase
          .from('data_id')
          .select('name, email')
          .limit(1)
          .single();

        if (testUser) {
          const testEmail =
            testUser.email || `test-user-${testUser.name.toLowerCase()}@pennineindustries.com`;
          isNotProduction() &&
            console.log('[getUserInfo as string] Using test user:', testUser.name, 'with email:', testEmail);
          return { email: testEmail, name: testUser.name };
        }
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      isNotProduction() &&
        console.log('[getUserInfo as string] No authenticated user found');
      return { email: null, name: null };
    }

    // 檢查緩存
    const cachedName = userNameCache.get(user.email);
    if (cachedName) {
      isNotProduction() &&
        console.log('[getUserInfo as string] Using cached user name for:', user.email);
      return { email: user.email, name: cachedName };
    }

    // 從 data_id 表獲取用戶名
    isNotProduction() &&
      console.log('[getUserInfo as string] Fetching user name from database for:', user.email);
    const { data: userData, error } = await supabase
      .from('data_id')
      .select('name')
      .eq('email', user.email)
      .single();

    if (error || !userData) {
      isNotProduction() &&
        console.log(
          '[getUserInfo as string] User not found in data_id table:',
          user.email,
          'Error:',
          error?.message
        );
      return { email: user.email, name: user.email };
    }

    // 緩存用戶名
    userNameCache.set(user.email, userData.name);
    isNotProduction() &&
      console.log('[getUserInfo as string] User name cached:', userData.name);

    return { email: user.email, name: userData.name };
  } catch (error) {
    console.error('[getUserInfo as string] Error:', error);
    return { email: null, name: null };
  }
}

// 生成查詢雜湊值（改進版本）
function generateQueryHash(query: string): string {
  // 標準化查詢
  const normalizedQuery = query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // 多個空格變成一個
    .replace(/[^a-z0-9 ]/g, ''); // 移除特殊字符
  
  // 使用真正嘅 SHA256 hash
  return crypto
    .createHash('sha256')
    .update(normalizedQuery)
    .digest('hex')
    .substring(0, 32);
}

// 生成模糊匹配 hash（用於語義相似查詢）
function generateFuzzyHash(query: string): string {
  // 提取關鍵詞
  const keywords = extractKeywords(query);
  const sorted = keywords.sort().join(' ');
  
  return crypto
    .createHash('sha256')
    .update(sorted)
    .digest('hex')
    .substring(0, 16);  // 更短嘅 hash 用於模糊匹配
}

// 提取查詢關鍵詞
function extractKeywords(query: string): string[] {
  // 停用詞列表
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were',
    'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'of', 'to', 'in', 'for', 'with', 'by', 'from', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out',
    'off', 'over', 'under', 'again', 'further', 'then', 'once', 'show', 'list', 'get', 'find'
  ]);
  
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return words;
}

// 檢查智能緩存系統（多層）
async function checkIntelligentCache(
  question: string,
  userEmail: string | null
): Promise<CacheResult | null> {
  const supabase = await createClient();

  try {
    // 檢查緩存是否過期
    const checkExpired = (record: DatabaseRecord) => {
      return !record.expired_at; // 沒有 expired_at 表示未過期
    };
    // L1: 精確匹配緩存（最近24小時）
    const queryHash = generateQueryHash(question);
    const fuzzyHash = generateFuzzyHash(question); // 新增模糊 hash
    
    const exactMatch = await supabase
      .from('query_record')
      .select('*')
      .eq('query_hash', queryHash)
      .is('expired_at', null) // 檢查緩存是否過期
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (exactMatch.data && exactMatch.data.length > 0) {
      const record = exactMatch.data[0];
      isNotProduction() &&
        console.log('[checkIntelligentCache as string] L1 exact match found');

      // 安全處理 result_json，確保有正確結構
      const safeResult = record.result_json || {
        data: [],
        rowCount: 0,
        executionTime: record.execution_time || 0,
      };

      return {
        question: record.query as string,
        sql: record.sql_query as string,
        result: safeResult,
        answer: record.answer as string,
        complexity: (record.complexity as 'simple' | 'medium' | 'complex') || 'simple',
        tokensUsed: 0,
        cached: true,
        cacheLevel: 'L1-exact',
        responseTime: 50,
        timestamp: record.created_at as string,
      };
    }

    // L2: 模糊 hash 匹配（最近7天）
    // 新增：先查模糊 hash，如果有匹配再做語義相似度計算
    const fuzzyMatches = await supabase
      .from('query_record')
      .select('*')
      .eq('fuzzy_hash', fuzzyHash) // 需要在 query_record 表加入 fuzzy_hash 欄位
      .is('expired_at', null) // 檢查緩存是否過期
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (fuzzyMatches.data && fuzzyMatches.data.length > 0) {
      // 在模糊匹配中找最佳匹配
      const questionWords = extractKeywords(question);
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const record of fuzzyMatches.data) {
        const recordWords = extractKeywords(record.query);
        const similarity = calculateSimilarity(questionWords, recordWords);

        if (similarity > 0.8 && similarity > bestSimilarity) {
          bestMatch = record;
          bestSimilarity = similarity;
        }
      }
      
      if (bestMatch) {
        isNotProduction() &&
          console.log(
            `[checkIntelligentCache as string] L2 fuzzy match found (${Math.round(bestSimilarity * 100)}% similarity)`
          );

        const safeResult = bestMatch.result_json || {
          data: [],
          rowCount: 0,
          executionTime: bestMatch.execution_time || 0,
        };

        return {
          question: bestMatch.query as string,
          sql: bestMatch.sql_query as string,
          result: safeResult,
          answer: bestMatch.answer as string,
          complexity: (bestMatch.complexity as 'simple' | 'medium' | 'complex') || 'simple',
          tokensUsed: 0,
          cached: true,
          cacheLevel: 'L2-fuzzy',
          similarity: bestSimilarity,
          responseTime: 80,
          timestamp: bestMatch.created_at as string,
        };
      }
    }
    
    // L3: 語義相似度緩存（最近7天，相似度 > 85%）
    const similarQueries = await supabase
      .from('query_record')
      .select('*')
      .is('expired_at', null) // 檢查緩存是否過期
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50); // 取最近50條記錄進行相似度比較

    if (similarQueries.data && similarQueries.data.length > 0) {
      // 改進的相似度計算
      const questionWords = extractKeywords(question);
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const record of similarQueries.data) {
        const recordWords = extractKeywords(record.query);
        const similarity = calculateSimilarity(questionWords, recordWords);

        if (similarity > 0.85 && similarity > bestSimilarity) {
          bestMatch = record;
          bestSimilarity = similarity;
        }
      }

      if (bestMatch) {
        isNotProduction() &&
          console.log(
            `[checkIntelligentCache as string] L2 similar match found (${Math.round(bestSimilarity * 100)}% similarity)`
          );

        // 安全處理 result_json
        const safeResult = bestMatch.result_json || {
          data: [],
          rowCount: 0,
          executionTime: bestMatch.execution_time || 0,
        };

        return {
          question: bestMatch.query as string,
          sql: bestMatch.sql_query as string,
          result: safeResult,
          answer: bestMatch.answer as string,
          complexity: (bestMatch.complexity as 'simple' | 'medium' | 'complex') || 'simple',
          tokensUsed: 0,
          cached: true,
          cacheLevel: 'L3-semantic',
          similarity: bestSimilarity,
          responseTime: 100,
          timestamp: bestMatch.created_at as string,
        };
      }
    }

    // L4: SQL 結果緩存（當有相同SQL時，最近1小時）
    // 這個會在SQL生成後檢查

    return null;
  } catch (error) {
    console.error('[checkIntelligentCache as string] Error:', error);
    return null;
  }
}

// 改進的相似度計算函數
function calculateSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // 計算交集
  const intersectionArray = Array.from(set1).filter((x: string) => set2.has(x));
  const intersection = new Set(intersectionArray);

  // 計算聯集
  const unionArray = Array.from(set1).concat(Array.from(set2));
  const union = new Set(unionArray);

  // Jaccard 相似度
  const jaccard = intersection.size / union.size;
  
  // 加權重：如果關鍵詞完全相同，給予更高分數
  if (intersection.size === set1.size && intersection.size === set2.size) {
    return 1.0; // 完全匹配
  }
  
  return jaccard;
}

// 檢查 SQL 結果緩存
async function checkSQLCache(sql: string): Promise<DatabaseRecord | null> {
  const supabase = await createClient();

  try {
    const sqlMatch = await supabase
      .from('query_record')
      .select('*')
      .eq('sql_query', sql)
      .is('expired_at', null) // 檢查緩存是否過期
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 最近1小時
      .order('created_at', { ascending: false })
      .limit(1);

    if (sqlMatch.data && sqlMatch.data.length > 0) {
      const record = sqlMatch.data[0];
      isNotProduction() && console.log('[checkSQLCache as string] L3 SQL cache hit');
      return {
        result: record.result_json,
        executionTime: record.execution_time || 0,
        cached: true,
        cacheLevel: 'L3-sql',
      };
    }

    return null;
  } catch (error) {
    console.error('[checkSQLCache as string] Error:', error);
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
  resultJson: SupabaseQueryResult | null = null,
  executionTime: number = 0,
  rowCount: number = 0,
  complexity: string = 'simple',
  sessionId?: string
): Promise<void> {
  setImmediate(async () => {
    try {
      const supabase = await createClient();
      const queryHash = generateQueryHash(query);
      const fuzzyHash = generateFuzzyHash(query); // 新增模糊 hash

      // 安全處理數值，確保不會有 null 值
      const safeExecutionTime = typeof executionTime === 'number' ? executionTime : 0;
      const safeRowCount = typeof rowCount === 'number' ? rowCount : 0;
      const safeTokenUsage = typeof tokenUsage === 'number' ? tokenUsage : 0;

      const { error } = await supabase.from('query_record').insert({
        query: query,
        answer: answer,
        user: user || 'Unknown User',
        token: safeTokenUsage,
        sql_query: sqlQuery,
        result_json: resultJson,
        query_hash: queryHash,
        fuzzy_hash: fuzzyHash, // 新增 fuzzy_hash
        execution_time: safeExecutionTime,
        row_count: safeRowCount,
        complexity: complexity,
        session_id: sessionId,
      });

      if (error) {
        console.error('[saveQueryRecordEnhanced as string] Failed to save query record:', error);
      } else {
        isNotProduction() &&
          console.log('[saveQueryRecordEnhanced as string] Enhanced query record saved successfully');
      }
    } catch (error) {
      console.error('[saveQueryRecordEnhanced as string] Error saving query record:', error);
    }
  });
}

// 舊版本保持兼容性
async function saveQueryRecordAsync(
  query: string,
  answer: string,
  user: string | null,
  tokenUsage: number = 0,
  sqlQuery: string = ''
): Promise<void> {
  return saveQueryRecordEnhanced(query, answer, user, tokenUsage, sqlQuery);
}

// 用戶權限檢查
async function checkUserPermission(): Promise<boolean> {
  // 開發環境下跳過權限檢查
  if (isDevelopment()) {
    isNotProduction() &&
      console.log('[checkUserPermission as string] Development mode: skipping auth check for debugging');
    return true;
  }

  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
function generateCacheKey(
  question: string,
  conversationHistory?: Array<{ question: string; sql: string }>
): string {
  const historyKey =
    conversationHistory && conversationHistory.length > 0
      ? conversationHistory
          .slice(-2)
          .map((entry: { question: string; sql: string }) => `${entry.question}:${entry.sql}`)
          .join('|')
      : '';

  const fullKey = `${CACHE_VERSION}|${question}|${historyKey}`;
  return `openai:${Buffer.from(fullKey).toString('base64')}`;
}

// 會話歷史現在已經由 DatabaseConversationContextManager 處理，直接從數據庫讀取

// 緩存預熱功能（整合在現有檔案中）
async function warmFrequentQueries(): Promise<void> {
  try {
    const supabase = await createClient();
    
    // 1. 獲取最常見的查詢（基於 fuzzy_hash）
    const { data: frequentPatterns } = await supabase
      .rpc('get_top_query_patterns', {
        days_back: 30,
        p_limit: 20
      });
      
    if (!frequentPatterns || frequentPatterns.length === 0) {
      console.log('[CacheWarmer as string] No frequent patterns found');
      return;
    }
    
    console.log(`[CacheWarmer as string] Found ${frequentPatterns.length} frequent query patterns`);
    
    // 2. 預熱每個查詢模式的最新結果
    for (const pattern of frequentPatterns) {
      const { data } = await supabase
        .from('query_record')
        .select('*')
        .or(`fuzzy_hash.eq.${pattern.pattern},query_hash.like.${pattern.pattern}%`)
        .not('sql_query', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (data && data.length > 0) {
        console.log(`[CacheWarmer as string] Warmed pattern: ${pattern.pattern} (${pattern.count} uses)`);
      }
    }
    
    // 3. 預熱今日查詢
    const today = new Date().toISOString().split('T')[0];
    const { data: todayQueries } = await supabase
      .from('query_record')
      .select('*')
      .gte('created_at', today + 'T00:00:00')
      .not('sql_query', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (todayQueries && todayQueries.length > 0) {
      console.log(`[CacheWarmer as string] Warmed ${todayQueries.length} queries from today`);
    }
    
  } catch (error) {
    console.error('[CacheWarmer as string] Error during cache warming:', error);
  }
}

// 緩存失效策略（整合在現有檔案中）
async function invalidateCacheByTable(tableName: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // 定義表與查詢關鍵字的映射
    const tableKeywordMap: Record<string, string[]> = {
      'record_palletinfo': ['pallet', 'stock', 'inventory', 'product', 'await'],
      'record_inventory': ['inventory', 'stock', 'location', 'await', 'warehouse'],
      'record_history': ['history', 'movement', 'alex', 'staff', 'move'],
      'record_transfer': ['transfer', 'movement', 'warehouse'],
      'record_aco': ['order', 'aco', 'purchase'],
      'record_grn': ['grn', 'goods', 'receipt', 'receiving'],
      'data_code': ['product', 'material', 'code', 'description'],
      'data_supplier': ['supplier', 'vendor'],
      'data_id': ['staff', 'user', 'employee', 'alex']
    };
    
    const keywords = tableKeywordMap[tableName as string] || [];
    if (keywords.length === 0) {
      console.log(`[CacheInvalidator as string] No keywords mapped for table: ${tableName}`);
      return;
    }
    
    // 標記相關緩存為過期
    const now = new Date().toISOString();
    
    for (const keyword of keywords) {
      const { error } = await supabase
        .from('query_record')
        .update({ 
          expired_at: now,
          expired_reason: `Table ${tableName} updated`
        })
        .ilike('query', `%${keyword}%`)
        .is('expired_at', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
      if (!error) {
        console.log(`[CacheInvalidator as string] Invalidated cache entries containing: ${keyword}`);
      }
    }
  } catch (error) {
    console.error('[CacheInvalidator as string] Error:', error);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    // 檢查URL參數
    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === 'true';
    const action = url.searchParams.get('action');

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
      hasPermission: false,
    };
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        userCheck = {
          authenticated: true,
          email: user.email,
          hasPermission: !BLOCKED_USERS.includes(user.email),
        };
      }
    } catch (authError) {
      isNotProduction() &&
        console.log('[Ask Database Status] Auth check failed:', authError);
    }

    // 檢查數據庫連接
    let dbCheck = { connected: false, tablesAccessible: false };
    try {
      const { data, error } = await supabase.from('data_code').select('code').limit(1);

      dbCheck = {
        connected: !error,
        tablesAccessible: !!data,
      };
    } catch (dbError) {
      isNotProduction() &&
        console.log('[Ask Database Status] DB check failed:', dbError);
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
        promptSource: 'docs/openAIprompt',
      },
      answerGeneration: {
        type: 'openai_natural_language',
        model: 'gpt-4o',
        style: 'british_professional',
      },
      cache: {
        lru: {
          size: queryCache.size,
          maxSize: 1000,
          ttl: '2 hours',
        },
        intelligent: {
          source: 'query_record table',
          layers: {
            L1: 'Exact match (24h)',
            L2: 'Semantic similarity (7d, >85%)',
            L3: 'SQL result cache (1h)',
          },
        },
      },
      features: {
        openaiIntegration: true,
        sqlGeneration: true,
        naturalLanguageResponse: true,
        conversationHistory: true,
        caching: true,
      },
    };
    
    // 如果請求緩存統計
    if (action === 'cache-stats') {
      const cacheStats = await analyzeCachePerformance();
      return NextResponse.json({
        ...status,
        cacheStats
      });
    }
    
    // 如果請求預熱緩存
    if (action === 'warm-cache') {
      // 檢查權限
      if (!userCheck.authenticated || userCheck.email?.includes('warehouse@') || userCheck.email?.includes('production@')) {
        return NextResponse.json(
          { error: 'Unauthorized to perform cache warming' },
          { status: 401 }
        );
      }
      
      // 異步執行預熱
      setImmediate(async () => {
        console.log('[Ask Database] Starting cache warming...');
        await warmFrequentQueries();
        console.log('[Ask Database] Cache warming completed');
      });
      
      return NextResponse.json({
        success: true,
        message: 'Cache warming started',
        timestamp: new Date().toISOString()
      });
    }
    
    // 如果請求分析查詢計劃
    if (action === 'analyze-query') {
      const sql = url.searchParams.get('sql');
      if (!sql) {
        return NextResponse.json(
          { error: 'SQL query parameter is required' },
          { status: 400 }
        );
      }
      
      try {
        const analysis = await analyzeQueryWithPlan(sql);
        const report = generatePerformanceReport(analysis);
        
        return NextResponse.json({
          success: true,
          analysis: {
            performanceScore: analysis.performanceScore,
            bottlenecks: analysis.bottlenecks,
            recommendations: analysis.recommendations,
            estimatedImprovement: analysis.estimatedImprovement,
            optimizedQuery: analysis.optimizedQuery
          },
          report,
          timestamp: new Date().toISOString()
        });
      } catch (error: unknown) {
        return NextResponse.json(
          { error: 'Query analysis failed', details: getErrorMessage(error) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(status);
  } catch (error: unknown) {
    console.error('[Ask Database Status] Error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: getErrorMessage(error), mode: 'OPENAI_SQL_GENERATION' },
      { status: 500 }
    );
  }
}

// 分析緩存效能
async function analyzeCachePerformance(): Promise<{
  hitRate: number;
  totalQueries: number;
  cacheHits: number;
  avgResponseTime: number;
  topPatterns: Array<{ pattern: string; count: number }>;
}> {
  try {
    const supabase = await createClient();
    
    // 獲取最近7天的查詢統計
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // 總查詢數
    const { count: totalQueries } = await supabase
      .from('query_record')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);
      
    // 緩存命中數（基於重複的 query_hash 或 fuzzy_hash）
    const { data: hashes } = await supabase
      .from('query_record')
      .select('query_hash, fuzzy_hash')
      .gte('created_at', sevenDaysAgo)
      .not('query_hash', 'is', null);
      
    const hashCounts = new Map<string, number>();
    hashes?.forEach(record => {
      if (record.query_hash) {
        hashCounts.set(record.query_hash, (hashCounts.get(record.query_hash) || 0) + 1);
      }
      if (record.fuzzy_hash) {
        hashCounts.set(record.fuzzy_hash, (hashCounts.get(record.fuzzy_hash) || 0) + 1);
      }
    });
    
    // 計算緩存命中（重複次數 > 1）
    let cacheHits = 0;
    hashCounts.forEach(count => {
      if (count > 1) {
        cacheHits += count - 1; // 第一次不算命中
      }
    });
    
    // 平均響應時間
    const { data: timings } = await supabase
      .from('query_record')
      .select('execution_time')
      .gte('created_at', sevenDaysAgo)
      .not('execution_time', 'is', null);
      
    const avgResponseTime = timings?.length 
      ? timings.reduce((sum, record) => sum + (record.execution_time || 0), 0) / timings.length
      : 0;
      
    // 熱門查詢模式
    const { data: patterns } = await supabase
      .rpc('get_top_query_patterns', {
        days_back: 7,
        p_limit: 10
      });
      
    return {
      hitRate: totalQueries ? (cacheHits / totalQueries) * 100 : 0,
      totalQueries: totalQueries || 0,
      cacheHits,
      avgResponseTime: Math.round(avgResponseTime),
      topPatterns: patterns || []
    };
    
  } catch (error) {
    console.error('[analyzeCachePerformance as string] Error:', error);
    return {
      hitRate: 0,
      totalQueries: 0,
      cacheHits: 0,
      avgResponseTime: 0,
      topPatterns: []
    };
  }
}
