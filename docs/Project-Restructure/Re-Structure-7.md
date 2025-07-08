# 項目重構計劃 7: AI Chatbot 功能優化策略

## 現有架構分析

### 核心組件
1. **API Route** (`/app/api/ask-database/route.ts`)
   - 使用 OpenAI GPT-4o 生成 SQL 查詢
   - 多層智能緩存系統 (L1-L3)
   - 對話上下文管理
   - 錯誤處理同重試機制

2. **UI 組件** (`/app/components/admin/UniversalChatbot/`)
   - EnhancedChatInterface - 主要聊天界面
   - ChatMessage - 消息顯示組件
   - QuerySuggestions - 查詢建議
   - DataTable - 數據表格顯示

3. **RPC 函數** (`execute_sql_query`)
   - 安全執行 SQL 查詢
   - 只允許 SELECT 查詢
   - 返回格式化結果

### 現有優勢
- ✅ 完整嘅對話歷史追蹤
- ✅ 多層緩存提升性能
- ✅ 智能上下文理解
- ✅ 安全嘅 SQL 執行
- ✅ 自然語言回應

## 優化建議

### 1. 性能優化

#### A. 查詢優化器增強
```typescript
// 新增智能查詢優化器
class QueryOptimizer {
  // 自動添加必要索引提示
  static optimizeQuery(sql: string, context: QueryContext): string {
    // 檢測常見性能問題
    if (sql.includes('LIKE %')) {
      // 建議使用全文搜索
      context.addSuggestion('Consider using full-text search for better performance');
    }
    
    // 自動添加 LIMIT 避免返回過多數據
    if (!sql.includes('LIMIT')) {
      sql += ' LIMIT 1000';
    }
    
    return sql;
  }
  
  // 查詢成本估算
  static async estimateCost(sql: string): Promise<QueryCost> {
    const explain = await supabase.rpc('explain_query', { query: sql });
    return {
      estimatedRows: explain.rows,
      estimatedTime: explain.cost,
      complexity: this.calculateComplexity(explain)
    };
  }
}
```

#### B. 向量搜索集成
```typescript
// 使用 pgvector 進行語義搜索
interface VectorSearchConfig {
  embeddingModel: 'text-embedding-3-small';
  similarityThreshold: 0.8;
  maxResults: 10;
}

class SemanticQueryCache {
  // 將查詢轉換為向量
  async embedQuery(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    return response.data[0].embedding;
  }
  
  // 查找相似查詢
  async findSimilarQueries(embedding: number[]): Promise<CachedQuery[]> {
    const { data } = await supabase
      .rpc('vector_search_queries', {
        query_embedding: embedding,
        similarity_threshold: 0.8,
        match_count: 5
      });
    return data;
  }
}
```

### 2. 功能增強

#### A. 主動建議系統
```typescript
// 基於用戶行為嘅智能建議
class ProactiveSuggestions {
  // 分析用戶查詢模式
  async analyzeUserPatterns(userId: string): Promise<UserPattern> {
    const history = await this.getUserQueryHistory(userId);
    return {
      commonTopics: this.extractTopics(history),
      queryFrequency: this.calculateFrequency(history),
      preferredMetrics: this.identifyMetrics(history)
    };
  }
  
  // 生成個性化建議
  async generateSuggestions(pattern: UserPattern): Promise<Suggestion[]> {
    const suggestions = [];
    
    // 基於時間嘅建議
    if (pattern.queryFrequency.daily) {
      suggestions.push({
        type: 'scheduled',
        text: 'Set up daily report for your frequent queries?',
        action: 'CREATE_SCHEDULED_REPORT'
      });
    }
    
    // 基於主題嘅建議
    pattern.commonTopics.forEach(topic => {
      suggestions.push({
        type: 'insight',
        text: `New insights available for ${topic}`,
        action: 'VIEW_INSIGHTS'
      });
    });
    
    return suggestions;
  }
}
```

### 3. 用戶體驗優化

#### A. 智能錯誤恢復
```typescript
// 更智能嘅錯誤處理
class SmartErrorRecovery {
  async handleQueryError(error: QueryError, context: QueryContext): Promise<RecoveryAction> {
    // 分析錯誤類型
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'AMBIGUOUS_COLUMN':
        // 自動推斷正確列名
        const suggestions = await this.suggestColumns(error, context);
        return {
          type: 'AUTO_CORRECT',
          suggestion: `Did you mean ${suggestions[0]}?`,
          correctedQuery: this.applyCorrection(context.query, suggestions[0])
        };
        
      case 'MISSING_CONTEXT':
        // 請求更多信息
        return {
          type: 'REQUEST_CLARIFICATION',
          questions: this.generateClarificationQuestions(error, context)
        };
        
      case 'PERFORMANCE_ISSUE':
        // 提供優化建議
        return {
          type: 'OPTIMIZE_QUERY',
          optimization: await this.suggestOptimization(context.query)
        };
    }
  }
}
```

### 4. 整合增強

#### A. 與其他系統深度整合
```typescript
// 整合倉庫管理功能
interface WarehouseIntegration {
  // 自動關聯實時數據
  async enrichWithRealtimeData(query: string): Promise<EnrichedQuery> {
    const entities = this.extractEntities(query);
    
    // 獲取實時庫存
    if (entities.products.length > 0) {
      const inventory = await this.getRealtimeInventory(entities.products);
      return this.addInventoryContext(query, inventory);
    }
    
    // 獲取實時生產數據
    if (entities.orders.length > 0) {
      const production = await this.getProductionStatus(entities.orders);
      return this.addProductionContext(query, production);
    }
  }
  
  // 觸發自動化操作
  async executeActions(queryResult: QueryResult): Promise<ActionResult> {
    const actions = this.identifyActions(queryResult);
    
    for (const action of actions) {
      if (action.type === 'LOW_STOCK_ALERT') {
        await this.createPurchaseRecommendation(action.data);
      }
    }
  }
}
```


### 5. 實施路線圖

#### 第 1-2 週：基礎優化
- [ ] 實施查詢優化器
- [ ] 升級緩存系統
- [ ] 添加查詢成本估算

#### 第 3-4 週：向量搜索
- [ ] 設置 pgvector
- [ ] 實施語義搜索
- [ ] 優化緩存命中率

#### 第 5-6 週：功能增強
- [ ] 實施主動建議
- [ ] 改進錯誤處理

#### 第 7-8 週：深度整合
- [ ] 整合倉庫系統
- [ ] 實施自動化操作

#### 第 9-10 週：測試優化
- [ ] 性能測試
- [ ] 用戶測試
- [ ] 系統優化

## 預期成果

### 性能提升
- 查詢響應時間減少 50%
- 緩存命中率提升至 80%
- 支持複雜查詢並發執行

### 用戶體驗
- 更智能嘅查詢建議
- 自動錯誤修復

### 業務價值
- 減少人工查詢時間 70%
- 提升決策效率
- 自動化常規報告

## 技術要求

### 新增依賴
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "openai": "^4.x",
    "exceljs": "^4.x"
  }
}
```

### 數據庫遷移
```sql
-- 添加向量搜索支持
CREATE EXTENSION IF NOT EXISTS vector;

-- 查詢緩存表
CREATE TABLE query_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_text TEXT NOT NULL,
  embedding vector(1536),
  result_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_count INT DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- 創建向量索引
CREATE INDEX query_embeddings_vector_idx ON query_embeddings 
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- 添加全文搜索
ALTER TABLE query_record ADD COLUMN search_vector tsvector;
CREATE INDEX query_record_search_idx ON query_record USING gin(search_vector);
```

## 結論

透過呢啲優化，我哋可以將 Ask Database 功能提升到新嘅層次，唔單止提供查詢功能，更成為一個智能嘅數據分析助手。重點係要循序漸進，確保每個階段都能為用戶帶來實際價值。