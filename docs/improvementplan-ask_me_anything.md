# Ask Me Anything 改進計劃（基於實際代碼分析）

## 概述
基於代碼分析，Ask Me Anything 係一個使用 OpenAI GPT-4o 將自然語言轉換為 SQL 查詢嘅系統。系統已經有完善嘅實現，包括 LRU 緩存、權限控制同查詢歷史記錄。主要問題係安全性（硬編碼 API key）同缺乏高級功能。

## 現有系統實際實現

### 核心架構
```
app/api/ask-database/route.ts     # 主API端點
├── OpenAI GPT-4o 整合
├── LRU 緩存 (2小時 TTL)
├── 權限檢查
└── 查詢歷史保存

app/components/
├── AskDatabaseInlineCard.tsx     # 聊天介面
├── AskDatabaseWidget.tsx         # Dashboard widget
└── AskDatabaseDialog.tsx         # 對話框版本
```

### 主要功能
- **雙語支援**：中英文輸入，英文回應
- **SQL安全**：只允許 SELECT 查詢
- **緩存機制**：LRU 緩存減少 API 調用
- **使用追蹤**：記錄 token 使用量
- **會話管理**：維持對話上下文

### 發現嘅問題

#### 1. 安全問題
```typescript
// app/services/memoryService.ts
const apiKey = 'mem0-...' // 硬編碼 API key！
```

#### 2. 緩存效率
```typescript
// 現有實現：簡單 LRU 緩存
const queryCache = new LRU({ max: 100, ttl: 2 * 60 * 60 * 1000 });
// 無語義相似度匹配
```

#### 3. 錯誤處理
```typescript
// 現有代碼缺乏詳細錯誤分類
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

## 改進方案

### 第一階段：安全性修復（立即）

#### 1.1 移除硬編碼 API Key
```typescript
// app/services/memoryService.ts
import { getEnvVar } from '@/lib/env';

class MemoryService {
  private client: MemoraiClient | null = null;
  
  constructor() {
    const apiKey = getEnvVar('MEM0_API_KEY');
    if (apiKey) {
      this.client = new MemoraiClient({ apiKey });
    }
  }
  
  isEnabled(): boolean {
    return this.client !== null;
  }
}
```

#### 1.2 加強 SQL 驗證
```typescript
// app/lib/sql-validator.ts
import { Parser } from 'node-sql-parser';

export class SQLValidator {
  private parser = new Parser();
  private allowedTables = [
    'record_palletinfo', 'record_grn', 'record_inventory',
    'record_transfer', 'record_stocktake', 'record_history'
  ];
  
  validate(sql: string): ValidationResult {
    try {
      const ast = this.parser.astify(sql);
      
      // 檢查是否只有 SELECT
      if (ast.type !== 'select') {
        return { valid: false, error: '只允許 SELECT 查詢' };
      }
      
      // 檢查表名
      const tables = this.extractTables(ast);
      const invalidTables = tables.filter(t => 
        !this.allowedTables.includes(t.toLowerCase())
      );
      
      if (invalidTables.length > 0) {
        return { 
          valid: false, 
          error: `無效表名: ${invalidTables.join(', ')}`
        };
      }
      
      // 檢查是否有子查詢
      if (this.hasSubquery(ast)) {
        return { valid: false, error: '不允許子查詢' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'SQL 語法錯誤' };
    }
  }
}
```

### 第二階段：性能優化（2週）

#### 2.1 語義緩存實現
```typescript
// app/lib/semantic-cache.ts
import { encode } from 'gpt-3-encoder';
import { cosineSimilarity } from '@/lib/math';

export class SemanticCache {
  private embeddings: Map<string, Float32Array> = new Map();
  private cache: Map<string, CachedResult> = new Map();
  private similarityThreshold = 0.85;
  
  async get(query: string): Promise<CachedResult | null> {
    const queryEmbedding = await this.getEmbedding(query);
    
    for (const [cachedQuery, result] of this.cache.entries()) {
      const cachedEmbedding = this.embeddings.get(cachedQuery);
      if (!cachedEmbedding) continue;
      
      const similarity = cosineSimilarity(queryEmbedding, cachedEmbedding);
      
      if (similarity > this.similarityThreshold) {
        // 檢查是否需要刷新（時效性查詢）
        if (this.isTimeDependent(query) && this.isExpired(result)) {
          this.cache.delete(cachedQuery);
          continue;
        }
        
        return {
          ...result,
          similarity,
          fromCache: true
        };
      }
    }
    
    return null;
  }
  
  private isTimeDependent(query: string): boolean {
    const timeKeywords = ['today', 'yesterday', 'this week', '今日', '昨天', '本週'];
    return timeKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }
}
```

#### 2.2 查詢優化器
```typescript
// app/lib/query-optimizer.ts
export class QueryOptimizer {
  async optimize(sql: string): Promise<string> {
    // 分析查詢計劃
    const plan = await this.getExecutionPlan(sql);
    
    // 建議索引
    const indexSuggestions = this.suggestIndexes(plan);
    
    // 重寫查詢
    let optimizedSQL = sql;
    
    // 自動添加 LIMIT（如果沒有）
    if (!sql.toUpperCase().includes('LIMIT')) {
      optimizedSQL += ' LIMIT 1000';
    }
    
    // 優化 JOIN 順序
    if (plan.hasJoins) {
      optimizedSQL = this.optimizeJoinOrder(optimizedSQL, plan);
    }
    
    return optimizedSQL;
  }
}
```

### 第三階段：功能增強（3週）

#### 3.1 多輪對話優化
```typescript
// app/lib/conversation-manager.ts
export class ConversationManager {
  private context: ConversationContext[] = [];
  
  async processQuery(
    query: string, 
    userId: string
  ): Promise<ProcessedQuery> {
    // 獲取對話上下文
    const relevantContext = this.getRelevantContext(query);
    
    // 解析代詞引用
    const resolvedQuery = await this.resolveReferences(
      query, 
      relevantContext
    );
    
    // 生成增強提示
    const enhancedPrompt = this.buildEnhancedPrompt(
      resolvedQuery,
      relevantContext
    );
    
    return {
      originalQuery: query,
      resolvedQuery,
      prompt: enhancedPrompt,
      context: relevantContext
    };
  }
  
  private resolveReferences(
    query: string, 
    context: ConversationContext[]
  ): string {
    // 處理 "它"、"那個" 等代詞
    const pronouns = {
      '它': this.findLastMentionedEntity,
      '那個': this.findLastMentionedEntity,
      '同樣的': this.findLastCondition,
    };
    
    let resolved = query;
    for (const [pronoun, resolver] of Object.entries(pronouns)) {
      if (query.includes(pronoun)) {
        const replacement = resolver(context);
        resolved = resolved.replace(pronoun, replacement);
      }
    }
    
    return resolved;
  }
}
```

#### 3.2 查詢建議系統
```typescript
// app/components/QuerySuggestions.tsx
export function QuerySuggestions({ onSelect }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { data: recentQueries } = useRecentQueries();
  const { data: popularQueries } = usePopularQueries();
  
  const categories = [
    {
      title: '庫存查詢',
      queries: [
        '今日收咗幾多貨？',
        '邊個產品庫存最多？',
        '顯示所有低庫存產品'
      ]
    },
    {
      title: '訂單分析',
      queries: [
        '本月訂單總數',
        '待處理訂單列表',
        '最近7天嘅出貨量'
      ]
    },
    {
      title: '效率報告',
      queries: [
        '今日嘅工作效率',
        '各區域嘅處理速度',
        '員工績效排名'
      ]
    }
  ];
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {categories.map(category => (
        <div key={category.title}>
          <h3 className="font-semibold mb-2">{category.title}</h3>
          <div className="space-y-1">
            {category.queries.map(query => (
              <button
                key={query}
                onClick={() => onSelect(query)}
                className="w-full text-left p-2 hover:bg-gray-100 rounded"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 3.3 結果可視化
```typescript
// app/components/ResultVisualization.tsx
import { BarChart, LineChart, PieChart } from '@/components/charts';

export function ResultVisualization({ data, query }) {
  const chartType = detectChartType(data, query);
  
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <BarChart data={data} />;
      case 'line':
        return <LineChart data={data} />;
      case 'pie':
        return <PieChart data={data} />;
      default:
        return <DataTable data={data} />;
    }
  };
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">查詢結果</h3>
        <ExportButton data={data} />
      </div>
      {renderChart()}
    </div>
  );
}

function detectChartType(data: any[], query: string): ChartType {
  // 基於查詢類型同數據結構自動選擇圖表
  if (query.includes('趨勢') || query.includes('變化')) {
    return 'line';
  }
  
  if (query.includes('比較') || query.includes('對比')) {
    return 'bar';
  }
  
  if (query.includes('佔比') || query.includes('分佈')) {
    return 'pie';
  }
  
  return 'table';
}
```

### 第四階段：高級功能（4週）

#### 4.1 預測性查詢
```typescript
// app/lib/predictive-queries.ts
export class PredictiveQueryEngine {
  async suggestNextQueries(
    currentQuery: string,
    results: any[]
  ): Promise<string[]> {
    const suggestions = [];
    
    // 基於結果分析
    if (this.hasAnomalies(results)) {
      suggestions.push('顯示異常原因分析');
    }
    
    if (this.hasTrends(results)) {
      suggestions.push('預測未來7天趨勢');
    }
    
    // 基於查詢模式
    const pattern = this.detectQueryPattern(currentQuery);
    suggestions.push(...this.getFollowUpQueries(pattern));
    
    return suggestions;
  }
}
```

#### 4.2 自動報表生成
```typescript
// app/lib/report-generator.ts
export class ReportGenerator {
  async generateReport(queries: SavedQuery[]): Promise<Report> {
    const sections = [];
    
    for (const query of queries) {
      const result = await this.executeQuery(query);
      const visualization = await this.generateVisualization(result);
      const insights = await this.generateInsights(result);
      
      sections.push({
        title: query.title,
        data: result,
        chart: visualization,
        insights
      });
    }
    
    return {
      title: '每日營運報告',
      generatedAt: new Date(),
      sections,
      summary: await this.generateSummary(sections)
    };
  }
}
```

## 實施時間表

### 立即修復（第1天）
- [ ] 移除硬編碼 API key
- [ ] 加強 SQL 驗證

### 第1-2週：性能優化
- [ ] 實施語義緩存
- [ ] 查詢優化器
- [ ] 改進錯誤處理

### 第3-4週：功能增強
- [ ] 多輪對話優化
- [ ] 查詢建議系統
- [ ] 結果可視化

### 第5-6週：高級功能
- [ ] 預測性查詢
- [ ] 自動報表生成
- [ ] 批量查詢支援

## 預期成果

### 性能提升
- API 調用減少：60%（語義緩存）
- 查詢速度：提升 40%（優化器）
- 相似查詢響應：<100ms（緩存命中）

### 功能改進
- 多輪對話準確率：85% → 95%
- 查詢建議採用率：新增功能，目標 70%
- 可視化覆蓋率：30% → 80%

### 安全性
- 消除所有硬編碼敏感信息
- SQL 注入風險：0%
- 完整審計追蹤

## 風險評估

### 技術風險
- OpenAI API 依賴性
- 語義緩存準確性

### 緩解措施
- 實施 fallback 機制
- A/B 測試新功能
- 保留原有簡單緩存

## 相關資源
- 現有 API：`/app/api/ask-database/route.ts`
- UI 組件：`/app/components/AskDatabaseInlineCard.tsx`
- OpenAI 提示：`/docs/openAIprompt`
- 功能文檔：`/docs/fn_ask_me_anything.md`