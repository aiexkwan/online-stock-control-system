// 多輪對話上下文管理系統

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
  lastResults?: any[];
  queryHistory: {
    question: string;
    sql: string;
    resultCount: number;
    timestamp: string;
  }[];
}

export class ConversationContextManager {
  private context: ConversationContext;

  constructor(sessionId: string) {
    this.context = {
      sessionId,
      entities: [],
      queryHistory: []
    };
  }

  // 從查詢結果中提取實體
  extractEntitiesFromResults(results: any[], sql: string): Entity[] {
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
            mentionedAt: timestamp
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
            mentionedAt: timestamp
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
            mentionedAt: timestamp
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
            mentionedAt: timestamp
          });
        }
      });
    });

    return entities;
  }

  // 更新上下文
  updateContext(question: string, sql: string, results: any[]) {
    // 提取新實體
    const newEntities = this.extractEntitiesFromResults(results, sql);
    
    // 添加到上下文（最新的在前）
    this.context.entities = [
      ...newEntities,
      ...this.context.entities
    ].slice(0, 50); // 只保留最近50個實體

    // 更新查詢歷史
    this.context.queryHistory.unshift({
      question,
      sql,
      resultCount: results.length,
      timestamp: new Date().toISOString()
    });

    // 只保留最近10次查詢
    this.context.queryHistory = this.context.queryHistory.slice(0, 10);

    // 更新最後查詢信息
    this.context.lastQueryType = this.detectQueryType(sql);
    this.context.lastQueryTime = new Date().toISOString();
    this.context.lastResults = results.slice(0, 10); // 只保留前10條結果
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

  // 解析引用
  resolveReferences(question: string): { resolved: string; references: any[] } {
    let resolved = question;
    const references: any[] = [];

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
        const entity = this.findEntity(mapping.type, mapping.position);
        if (entity) {
          references.push({
            original: resolved.match(mapping.pattern)?.[0],
            resolved: entity.value,
            type: entity.type,
            entity
          });
          
          // 替換代詞
          resolved = resolved.replace(mapping.pattern, entity.value);
        }
      }
    });

    // 處理比較詞（如 "bottom 5" 相對於之前的 "top 5"）
    if (/\bbottom\b/i.test(question) && this.context.lastQueryType === 'product_query') {
      const lastQuery = this.context.queryHistory[0];
      if (lastQuery && /\btop\b/i.test(lastQuery.question)) {
        resolved = resolved.replace(/\bbottom\b/i, 'bottom');
        references.push({
          original: 'bottom',
          resolved: 'ORDER BY ... ASC instead of DESC',
          type: 'query_modifier'
        });
      }
    }

    return { resolved, references };
  }

  // 查找實體
  private findEntity(type: string, position: string): Entity | null {
    let candidates = this.context.entities;
    
    // 按類型過濾
    if (type !== 'any') {
      candidates = candidates.filter(e => e.type === type);
    }

    // 按位置返回
    switch (position) {
      case 'first':
        return this.context.lastResults?.[0] ? 
          this.extractEntityFromRow(this.context.lastResults[0]) : 
          candidates[0];
      
      case 'last':
        return candidates[0]; // 最近提及的
      
      case 'recent':
        return candidates.slice(0, 5) as any; // 返回最近5個
      
      default:
        return candidates[0];
    }
  }

  // 從結果行提取實體
  private extractEntityFromRow(row: any): Entity {
    // 優先級：產品 > 訂單 > 棧板
    if (row.product_code) {
      return {
        type: 'product',
        value: row.product_code,
        displayName: row.product_name || row.description,
        mentionedAt: new Date().toISOString()
      };
    } else if (row.order_ref) {
      return {
        type: 'order',
        value: row.order_ref,
        mentionedAt: new Date().toISOString()
      };
    } else if (row.plt_num) {
      return {
        type: 'pallet',
        value: row.plt_num,
        mentionedAt: new Date().toISOString()
      };
    }
    
    // 返回第一個非空值
    const firstValue = Object.values(row).find(v => v);
    return {
      type: 'any' as any,
      value: String(firstValue),
      mentionedAt: new Date().toISOString()
    };
  }

  // 生成上下文提示
  generateContextPrompt(): string {
    let prompt = '';

    // 添加最近的查詢歷史
    if (this.context.queryHistory.length > 0) {
      prompt += '\n### Recent Query History:\n';
      this.context.queryHistory.slice(0, 3).forEach((q, i) => {
        prompt += `${i + 1}. User asked: "${q.question}"\n`;
        prompt += `   Results: ${q.resultCount} records\n`;
        if (i === 0 && this.context.lastResults && this.context.lastResults.length > 0) {
          prompt += `   Sample result: ${JSON.stringify(this.context.lastResults[0])}\n`;
        }
      });
    }

    // 添加最近提及的實體
    if (this.context.entities.length > 0) {
      prompt += '\n### Recently Mentioned Entities:\n';
      const recentEntities = this.context.entities.slice(0, 10);
      const grouped = this.groupEntitiesByType(recentEntities);
      
      Object.entries(grouped).forEach(([type, entities]) => {
        prompt += `- ${type}s: ${entities.map(e => e.value).join(', ')}\n`;
      });
    }

    prompt += '\n### Context Resolution:\n';
    prompt += 'When the user uses pronouns like "it", "this", "that", refer to the entities mentioned above.\n';
    prompt += 'When the user asks follow-up questions, consider the previous query context.\n';

    return prompt;
  }

  // 按類型分組實體
  private groupEntitiesByType(entities: Entity[]): Record<string, Entity[]> {
    return entities.reduce((acc, entity) => {
      if (!acc[entity.type]) {
        acc[entity.type] = [];
      }
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, Entity[]>);
  }

  // 獲取當前上下文
  getContext(): ConversationContext {
    return this.context;
  }

  // 清除上下文
  clearContext() {
    this.context.entities = [];
    this.context.queryHistory = [];
    this.context.lastResults = undefined;
    this.context.lastQueryType = undefined;
  }
}