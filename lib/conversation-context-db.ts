// Database-based Conversation Context Manager
// Uses query_record table for persistent conversation tracking

import { createClient } from '@/app/utils/supabase/server';
import { DatabaseRecord } from '@/lib/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Entity {
  type: 'product' | 'order' | 'pallet' | 'location' | 'customer' | 'date';
  value: string;
  displayName?: string;
  mentionedAt: string;
}

export interface ConversationContext {
  sessionId: string;
  entities: Entity[];
  lastQueryType?: string;
  lastQueryTime?: string;
  lastResults?: Record<string, unknown>[];
  queryHistory: {
    question: string;
    sql: string;
    resultCount: number;
    timestamp: string;
  }[];
}

export class DatabaseConversationContextManager {
  private sessionId: string;
  private supabase: SupabaseClient | null = null;
  private userEmail: string | null;

  constructor(sessionId: string, userEmail: string | null) {
    this.sessionId = sessionId;
    this.userEmail = userEmail;
  }

  private async getSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  // 從數據庫加載歷史對話記錄
  async loadContext(): Promise<ConversationContext> {
    try {
      // 獲取最近的對話記錄（最多20條）
      const supabase = await this.getSupabase();
      const { data: records, error } = await supabase
        .from('query_record')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[DatabaseConversationContext] Error loading context:', error);
        return this.getEmptyContext();
      }

      if (!records || records.length === 0) {
        return this.getEmptyContext();
      }

      // 從記錄中提取實體和查詢歷史
      const entities: Entity[] = [];
      const queryHistory: ConversationContext['queryHistory'] = [];

      // 反轉記錄順序（從舊到新）
      const orderedRecords = records.reverse();

      for (const record of orderedRecords) {
        // 添加到查詢歷史
        queryHistory.push({
          question: record.query,
          sql: record.sql_query,
          resultCount: record.row_count || 0,
          timestamp: record.created_at,
        });

        // 從 result_json 提取實體
        if (record.result_json && record.result_json.data) {
          const extractedEntities = this.extractEntitiesFromResults(
            record.result_json.data,
            record.sql_query
          );
          entities.push(...extractedEntities);
        }
      }

      // 獲取最新記錄的信息
      const latestRecord = records[0];

      return {
        sessionId: this.sessionId,
        entities: entities.slice(0, 50), // 只保留最近50個實體
        lastQueryType: this.detectQueryType(latestRecord.sql_query),
        lastQueryTime: latestRecord.created_at,
        lastResults: latestRecord.result_json?.data?.slice(0, 10) || [],
        queryHistory: queryHistory.slice(-10), // 只保留最近10條
      };
    } catch (error) {
      console.error('[DatabaseConversationContext] Error loading context:', error);
      return this.getEmptyContext();
    }
  }

  // 從查詢結果中提取實體
  private extractEntitiesFromResults(results: Record<string, unknown>[], sql: string): Entity[] {
    const entities: Entity[] = [];
    const timestamp = new Date().toISOString();

    // 提取產品代碼
    if (sql.toLowerCase().includes('product_code')) {
      results.forEach(row => {
        if (row.product_code) {
          entities.push({
            type: 'product',
            value: row.product_code,
            displayName: row.product_name || row.description,
            mentionedAt: timestamp,
          });
        }
      });
    }

    // 提取訂單編號
    if (sql.toLowerCase().includes('order_ref')) {
      results.forEach(row => {
        if (row.order_ref) {
          entities.push({
            type: 'order',
            value: row.order_ref,
            mentionedAt: timestamp,
          });
        }
      });
    }

    // 提取棧板號
    if (sql.toLowerCase().includes('plt_num') || sql.toLowerCase().includes('pallet')) {
      results.forEach(row => {
        if (row.plt_num) {
          entities.push({
            type: 'pallet',
            value: row.plt_num,
            mentionedAt: timestamp,
          });
        }
      });
    }

    // 提取位置
    const locationColumns = ['location', 'loc', 'current_location', 'from_location', 'to_location'];
    locationColumns.forEach(col => {
      results.forEach(row => {
        if (row[col]) {
          entities.push({
            type: 'location',
            value: row[col],
            mentionedAt: timestamp,
          });
        }
      });
    });

    return entities;
  }

  // 解析引用（基於數據庫中的歷史）
  async resolveReferences(question: string): Promise<{ resolved: string; references: Record<string, unknown>[] }> {
    // 先加載最新的上下文
    const context = await this.loadContext();

    let resolved = question;
    const references: Record<string, unknown>[] = [];

    // 代詞映射表
    const pronounMappings = [
      // 英文代詞
      { pattern: /\bthis product\b/i, type: 'product', position: 'last' },
      { pattern: /\bthat product\b/i, type: 'product', position: 'last' },
      { pattern: /\bthese products\b/i, type: 'product', position: 'recent' },
      { pattern: /\bthe first one\b/i, type: 'any', position: 'first' },
      { pattern: /\bthe last one\b/i, type: 'any', position: 'last' },
      { pattern: /\bit\b(?!em)/i, type: 'any', position: 'last' },
      { pattern: /\bthem\b/i, type: 'any', position: 'recent' },

      // 中文代詞
      { pattern: /呢個產品/i, type: 'product', position: 'last' },
      { pattern: /嗰個產品/i, type: 'product', position: 'last' },
      { pattern: /呢啲產品/i, type: 'product', position: 'recent' },
      { pattern: /呢個/i, type: 'any', position: 'last' },
      { pattern: /嗰個/i, type: 'any', position: 'last' },
      { pattern: /佢/i, type: 'any', position: 'last' },
      { pattern: /佢哋/i, type: 'any', position: 'recent' },

      // 位置引用
      { pattern: /\bsame location\b/i, type: 'location', position: 'last' },
      { pattern: /\bthere\b/i, type: 'location', position: 'last' },
      { pattern: /同一個位置/i, type: 'location', position: 'last' },

      // 時間引用
      { pattern: /\bsame day\b/i, type: 'date', position: 'last' },
      { pattern: /\bthat day\b/i, type: 'date', position: 'last' },
      { pattern: /同一日/i, type: 'date', position: 'last' },
    ];

    // 處理每個代詞
    pronounMappings.forEach(mapping => {
      if (mapping.pattern.test(resolved)) {
        const entity = this.findEntity(context, mapping.type, mapping.position);
        if (entity) {
          references.push({
            original: resolved.match(mapping.pattern)?.[0],
            resolved: entity.value,
            type: entity.type,
            entity,
          });

          // 替換代詞
          resolved = resolved.replace(mapping.pattern, entity.value);
        }
      }
    });

    // 處理比較詞（如 "bottom 5" 相對於之前的 "top 5"）
    if (/\bbottom\b/i.test(question) && context.lastQueryType === 'product_query') {
      const lastQuery = context.queryHistory[context.queryHistory.length - 1];
      if (lastQuery && /\btop\b/i.test(lastQuery.question)) {
        resolved = resolved.replace(/\bbottom\b/i, 'bottom');
        references.push({
          original: 'bottom',
          resolved: 'ORDER BY ... ASC instead of DESC',
          type: 'query_modifier',
        });
      }
    }

    return { resolved, references };
  }

  // 查找實體
  private findEntity(context: ConversationContext, type: string, position: string): Entity | null {
    let candidates = context.entities;

    // 按類型過濾
    if (type !== 'any') {
      candidates = candidates.filter(e => e.type === type);
    }

    // 按位置返回
    switch (position) {
      case 'first':
        return context.lastResults?.[0]
          ? this.extractEntityFromRow(context.lastResults[0])
          : candidates[0];

      case 'last':
        return candidates[0]; // 最近提及的

      case 'recent':
        return candidates.slice(0, 5) as any; // 返回最近5個

      default:
        return candidates[0];
    }
  }

  // 從結果行提取實體
  private extractEntityFromRow(row: DatabaseRecord): Entity {
    // 優先級：產品 > 訂單 > 棧板
    if (row.product_code) {
      return {
        type: 'product',
        value: row.product_code,
        displayName: row.product_name || row.description,
        mentionedAt: new Date().toISOString(),
      };
    } else if (row.order_ref) {
      return {
        type: 'order',
        value: row.order_ref,
        mentionedAt: new Date().toISOString(),
      };
    } else if (row.plt_num) {
      return {
        type: 'pallet',
        value: row.plt_num,
        mentionedAt: new Date().toISOString(),
      };
    }

    // 返回第一個非空值
    const firstValue = Object.values(row).find(v => v);
    return {
      type: 'any' as any,
      value: String(firstValue),
      mentionedAt: new Date().toISOString(),
    };
  }

  // 生成上下文提示（給 OpenAI）
  async generateContextPrompt(): Promise<string> {
    const context = await this.loadContext();
    let prompt = '';

    // 添加最近的查詢歷史
    if (context.queryHistory.length > 0) {
      prompt += '\n### Recent Query History:\n';
      context.queryHistory.slice(-3).forEach((q, i) => {
        prompt += `${i + 1}. User asked: "${q.question}"\n`;
        prompt += `   Results: ${q.resultCount} records\n`;
        if (
          i === context.queryHistory.length - 1 &&
          context.lastResults &&
          context.lastResults.length > 0
        ) {
          prompt += `   Sample result: ${JSON.stringify(context.lastResults[0])}\n`;
        }
      });
    }

    // 添加最近提及的實體
    if (context.entities.length > 0) {
      prompt += '\n### Recently Mentioned Entities:\n';
      const recentEntities = context.entities.slice(0, 10);
      const grouped = this.groupEntitiesByType(recentEntities);

      Object.entries(grouped).forEach(([type, entities]) => {
        prompt += `- ${type}s: ${entities.map(e => e.value).join(', ')}\n`;
      });
    }

    prompt += '\n### Context Resolution:\n';
    prompt +=
      'When the user uses pronouns like "it", "this", "that", refer to the entities mentioned above.\n';
    prompt += 'When the user asks follow-up questions, consider the previous query context.\n';

    return prompt;
  }

  // 按類型分組實體
  private groupEntitiesByType(entities: Entity[]): Record<string, Entity[]> {
    return entities.reduce(
      (acc, entity) => {
        if (!acc[entity.type]) {
          acc[entity.type] = [];
        }
        acc[entity.type].push(entity);
        return acc;
      },
      {} as Record<string, Entity[]>
    );
  }

  // 檢測查詢類型
  private detectQueryType(sql: string): string {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('product') || sqlLower.includes('stock')) {
      return 'product_query';
    } else if (sqlLower.includes('order')) {
      return 'order_query';
    } else if (sqlLower.includes('pallet') || sqlLower.includes('plt_num')) {
      return 'pallet_query';
    } else if (sqlLower.includes('history') || sqlLower.includes('transfer')) {
      return 'history_query';
    }

    return 'general_query';
  }

  // 獲取空的上下文
  private getEmptyContext(): ConversationContext {
    return {
      sessionId: this.sessionId,
      entities: [],
      queryHistory: [],
    };
  }

  // 獲取同一 session 的歷史查詢（用於對話上下文）
  async getSessionHistory(
    limit: number = 10
  ): Promise<Array<{ question: string; sql: string; answer: string }>> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('query_record')
        .select('query, sql_query, answer')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[getSessionHistory] Error:', error);
        return [];
      }

      // 反轉順序（從舊到新）
      return (data || []).reverse().map(record => ({
        question: record.query,
        sql: record.sql_query,
        answer: record.answer,
      }));
    } catch (error) {
      console.error('[getSessionHistory] Error:', error);
      return [];
    }
  }
}
