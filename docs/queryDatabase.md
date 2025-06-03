# Ask Database 功能可行性研究

## 概述

本文檔記錄了在 `/admin` 頁面中實現 "Ask Database" 功能的可行性研究，該功能允許用戶使用自然語言與數據庫進行交互，通過 OpenAI API 將自然語言轉換為 SQL 查詢。

## 目標功能

- 用戶可以在卡片內使用自然語言提問
- OpenAI 理解用戶問題並轉換為 SQL 語言
- 查詢 Supabase 內所有表格
- 返回查詢結果並由 OpenAI 轉換回自然語言回答

## 技術可行性分析

### 1. OpenAI Text-to-SQL 能力

根據研究，OpenAI 的 GPT-4 和 GPT-4o 在 Text-to-SQL 任務上表現良好：

**優勢：**
- GPT-4o 在零樣本 Text-to-SQL 基準測試中達到 51.23% 的準確率
- 支持複雜的多表聯接查詢
- 能夠理解自然語言的語義和意圖

**挑戰：**
- 需要詳細的數據庫結構描述
- 對於複雜查詢可能產生錯誤的 SQL
- 需要適當的提示工程來提高準確性

### 2. Supabase 數據庫結構獲取

**可用方法：**

1. **PostgREST API 發現機制**
   ```javascript
   // 通過 PostgREST 的內建發現 API
   const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
     headers: { 'apikey': SUPABASE_ANON_KEY }
   });
   ```

2. **Supabase CLI 類型生成**
   ```bash
   npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public
   ```

3. **GraphQL 內省查詢**
   ```graphql
   query IntrospectionQuery {
     __schema {
       types {
         name
         fields {
           name
           type {
             name
           }
         }
       }
     }
   }
   ```

4. **直接 SQL 查詢**
   ```sql
   SELECT 
     table_name, 
     column_name, 
     data_type,
     is_nullable
   FROM information_schema.columns 
   WHERE table_schema = 'public'
   ORDER BY table_name, ordinal_position;
   ```

### 3. 現有項目架構分析

**當前技術棧：**
- Next.js 14 (App Router)
- Supabase (PostgreSQL + PostgREST)
- TypeScript
- Tailwind CSS

**缺少的依賴：**
- OpenAI SDK (`openai` 套件)
- 環境變數配置 (OPENAI_API_KEY)

## 技術實現方案

### 方案一：簡單實現 (推薦用於 MVP)

**架構：**
```
用戶輸入 → 前端處理 → API Route → OpenAI API → SQL 生成 → Supabase 執行 → 結果處理 → 自然語言回應
```

**實現步驟：**

1. **安裝依賴**
   ```bash
   npm install openai
   ```

2. **環境變數配置**
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **創建 API Route** (`app/api/ask-database/route.ts`)
   ```typescript
   import OpenAI from 'openai';
   import { createClient } from '@/app/utils/supabase/server';

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });

   export async function POST(request: Request) {
     const { question } = await request.json();
     
     // 1. 獲取數據庫結構
     const schema = await getDatabaseSchema();
     
     // 2. 生成 SQL
     const sql = await generateSQL(question, schema);
     
     // 3. 執行查詢
     const result = await executeQuery(sql);
     
     // 4. 生成自然語言回應
     const answer = await generateAnswer(question, result);
     
     return Response.json({ answer, sql, result });
   }
   ```

4. **數據庫結構獲取函數**
   ```typescript
   async function getDatabaseSchema() {
     const supabase = createClient();
     
     const { data, error } = await supabase
       .from('information_schema.columns')
       .select('table_name, column_name, data_type, is_nullable')
       .eq('table_schema', 'public');
     
     return formatSchemaForPrompt(data);
   }
   ```

5. **OpenAI 提示工程**
   ```typescript
   async function generateSQL(question: string, schema: string) {
     const prompt = `
   你是一個 PostgreSQL 專家。根據以下數據庫結構，將用戶的自然語言問題轉換為 SQL 查詢。

   數據庫結構：
   ${schema}

   用戶問題：${question}

   請生成一個安全的 SQL 查詢，只使用 SELECT 語句。回應格式：
   \`\`\`sql
   -- 你的 SQL 查詢
   \`\`\`
   `;

     const response = await openai.chat.completions.create({
       model: "gpt-4o",
       messages: [{ role: "user", content: prompt }],
       temperature: 0.1,
     });

     return extractSQLFromResponse(response.choices[0].message.content);
   }
   ```

### 方案二：進階實現 (生產環境)

**增強功能：**

1. **多輪對話支持**
   - 維護對話歷史
   - 上下文理解

2. **查詢優化**
   - SQL 驗證和清理
   - 查詢性能限制
   - 結果集大小限制

3. **安全性增強**
   - SQL 注入防護
   - 權限檢查
   - 查詢白名單

4. **緩存機制**
   - 相似問題緩存
   - 數據庫結構緩存

## 前端 UI 實現

### 卡片組件設計

```typescript
// components/admin-panel-menu/AskDatabaseDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AskDatabaseDialog({ isOpen, onClose }: Props) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ask Database</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="請用自然語言描述您想查詢的數據..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '查詢中...' : '提交查詢'}
          </Button>
          
          {response && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>回答</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{response.answer}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>生成的 SQL</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                    <code>{response.sql}</code>
                  </pre>
                </CardContent>
              </Card>
              
              {response.result && (
                <Card>
                  <CardHeader>
                    <CardTitle>查詢結果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border">
                        {/* 渲染查詢結果表格 */}
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 風險與挑戰

### 1. 技術風險

**SQL 生成準確性：**
- OpenAI 可能生成錯誤的 SQL
- 複雜查詢的準確率較低
- 需要大量測試和優化

**性能問題：**
- 大型數據庫結構描述可能超過 token 限制
- 複雜查詢可能導致數據庫性能問題
- OpenAI API 調用延遲

### 2. 安全風險

**SQL 注入：**
- 需要嚴格的 SQL 驗證
- 限制只能執行 SELECT 語句
- 實施查詢白名單

**數據洩露：**
- 需要適當的權限控制
- 敏感數據保護
- 查詢日誌記錄

### 3. 成本考量

**OpenAI API 成本：**
- 每次查詢需要消耗 tokens
- 大型數據庫結構描述成本較高
- 需要實施使用限制

## 實施建議

### 階段一：MVP 實現 (2-3 週)

1. **基礎功能開發**
   - 簡單的自然語言到 SQL 轉換
   - 基本的查詢執行
   - 簡單的結果展示

2. **安全性基礎**
   - SQL 注入防護
   - 查詢類型限制 (只允許 SELECT)
   - 基本錯誤處理

### 階段二：功能增強 (3-4 週)

1. **用戶體驗改善**
   - 更好的 UI/UX 設計
   - 查詢歷史記錄
   - 結果可視化

2. **性能優化**
   - 查詢緩存
   - 結果分頁
   - 查詢超時處理

### 階段三：生產就緒 (2-3 週)

1. **高級功能**
   - 多輪對話支持
   - 查詢建議
   - 數據洞察生成

2. **監控和分析**
   - 使用情況分析
   - 錯誤監控
   - 性能指標

## 替代方案

### 1. 使用現有的 Text-to-SQL 服務

**優勢：**
- 專業的 Text-to-SQL 解決方案
- 更高的準確率
- 減少開發時間

**劣勢：**
- 額外的服務依賴
- 可能的供應商鎖定
- 成本考量

### 2. 預定義查詢模板

**優勢：**
- 高準確率
- 快速響應
- 低成本

**劣勢：**
- 靈活性有限
- 需要預先定義所有可能的查詢
- 用戶體驗較差

## 結論

**可行性評估：高**

Ask Database 功能在技術上是可行的，但需要仔細的設計和實施：

1. **技術可行性：** OpenAI 的 Text-to-SQL 能力已經相當成熟，結合 Supabase 的 API 可以實現基本功能。

2. **實施複雜度：** 中等到高，需要處理多個技術挑戰，包括提示工程、安全性和性能優化。

3. **建議實施方式：** 採用分階段實施，從 MVP 開始，逐步增加功能和優化。

4. **關鍵成功因素：**
   - 良好的提示工程
   - 嚴格的安全控制
   - 充分的測試和驗證
   - 用戶反饋驅動的迭代改進

**下一步行動：**
1. 設置 OpenAI API 密鑰
2. 創建基本的 API Route
3. 實現簡單的前端界面
4. 進行初步測試和驗證

---

## 進階研究：成本控制與用戶管理

### 1. Token 消耗量限制策略

基於研究發現，OpenAI API 的成本控制是實施 Ask Database 功能的關鍵考量。以下是有效的 token 優化策略：

#### 1.1 提示工程優化

**精簡數據庫結構描述：**
```typescript
// 優化前：完整的數據庫結構
const fullSchema = `
Table: data_id
- id: integer (primary key, not null)
- name: varchar(255) (not null)
- email: varchar(255) (unique, not null)
- department: varchar(100) (not null)
- created_at: timestamp with time zone (default: current_timestamp)
...
`;

// 優化後：精簡的結構描述
const optimizedSchema = `
data_id: id(int), name, email, department
data_code: code(pk), description, type, colour
record_palletinfo: plt_num(pk), product_code, product_qty
record_history: id, action, plt_num, remark, time
`;
```

**動態結構選擇：**
```typescript
async function getRelevantSchema(question: string): Promise<string> {
  // 使用關鍵字匹配來選擇相關表格
  const keywords = extractKeywords(question);
  const relevantTables = await identifyRelevantTables(keywords);
  
  return buildMinimalSchema(relevantTables);
}
```

#### 1.2 緩存機制

**查詢結果緩存：**
```typescript
// 使用 Redis 或內存緩存相似查詢
const cacheKey = `query:${hashQuestion(question)}`;
const cachedResult = await redis.get(cacheKey);

if (cachedResult) {
  return JSON.parse(cachedResult);
}

// 執行新查詢並緩存結果
const result = await executeQuery(sql);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1小時緩存
```

**數據庫結構緩存：**
```typescript
// 緩存數據庫結構，避免重複獲取
const SCHEMA_CACHE_KEY = 'db_schema';
let cachedSchema = await redis.get(SCHEMA_CACHE_KEY);

if (!cachedSchema) {
  cachedSchema = await getDatabaseSchema();
  await redis.setex(SCHEMA_CACHE_KEY, 86400, cachedSchema); // 24小時緩存
}
```

#### 1.3 批量處理

**使用 OpenAI Batch API：**
```typescript
// 批量處理多個查詢，節省50%成本
async function processBatchQueries(questions: string[]) {
  const batchRequests = questions.map((question, index) => ({
    custom_id: `request-${index}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4o",
      messages: [{ role: "user", content: buildPrompt(question) }],
      temperature: 0.1
    }
  }));

  const batchResponse = await openai.batches.create({
    input_file_id: await uploadBatchFile(batchRequests),
    endpoint: "/v1/chat/completions",
    completion_window: "24h"
  });

  return batchResponse;
}
```

#### 1.4 使用量監控

**實時 Token 計算：**
```typescript
import { encoding_for_model } from 'tiktoken';

function calculateTokens(text: string, model: string = 'gpt-4o'): number {
  const encoding = encoding_for_model(model);
  return encoding.encode(text).length;
}

// 在 API 調用前預估成本
const inputTokens = calculateTokens(prompt);
const estimatedCost = (inputTokens * 0.005) / 1000; // GPT-4o 輸入價格

if (estimatedCost > MAX_COST_PER_QUERY) {
  throw new Error('查詢成本超過限制');
}
```

### 2. 基於 Email 的用戶權限控制

利用現有的 `data_id` 表結構和認證系統，實現細粒度的功能訪問控制：

#### 2.1 權限檢查機制

**基於 Email 的權限驗證：**
```typescript
// app/api/ask-database/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { getUserRole } from '@/app/hooks/useAuth';

async function checkDatabaseQueryPermission(userEmail: string): Promise<boolean> {
  const supabase = createClient();
  
  // 從 data_id 表獲取用戶權限
  const { data: userData, error } = await supabase
    .from('data_id')
    .select('report, view, qc, receive, void')
    .eq('email', userEmail)
    .single();

  if (error || !userData) {
    return false;
  }

  // 檢查用戶是否有報告查看權限（Ask Database 功能需要）
  return userData.report === true;
}

export async function POST(request: Request) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) {
    return Response.json({ error: '未授權訪問' }, { status: 401 });
  }

  const hasPermission = await checkDatabaseQueryPermission(user.email);
  if (!hasPermission) {
    return Response.json({ 
      error: '您沒有權限使用數據庫查詢功能' 
    }, { status: 403 });
  }

  // 繼續處理查詢...
}
```

#### 2.2 分級權限控制

**基於用戶角色的查詢限制：**
```typescript
interface QueryPermissions {
  allowedTables: string[];
  maxResultRows: number;
  dailyQueryLimit: number;
  allowedOperations: string[];
}

function getQueryPermissions(userEmail: string): QueryPermissions {
  const userRole = getUserRole(userEmail);
  
  switch (userRole.type) {
    case 'admin':
      return {
        allowedTables: ['*'], // 所有表格
        maxResultRows: 1000,
        dailyQueryLimit: 100,
        allowedOperations: ['SELECT', 'COUNT', 'SUM', 'AVG']
      };
    
    case 'warehouse':
      return {
        allowedTables: [
          'record_palletinfo', 
          'record_inventory', 
          'record_transfer',
          'data_code'
        ],
        maxResultRows: 500,
        dailyQueryLimit: 50,
        allowedOperations: ['SELECT', 'COUNT']
      };
    
    case 'production':
      return {
        allowedTables: [
          'record_palletinfo', 
          'data_code',
          'record_slate'
        ],
        maxResultRows: 200,
        dailyQueryLimit: 30,
        allowedOperations: ['SELECT']
      };
    
    default:
      return {
        allowedTables: [],
        maxResultRows: 0,
        dailyQueryLimit: 0,
        allowedOperations: []
      };
  }
}
```

#### 2.3 使用量追蹤

**每日查詢限制：**
```typescript
// 使用 Redis 追蹤每日查詢次數
async function checkDailyLimit(userEmail: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const key = `query_count:${userEmail}:${today}`;
  
  const currentCount = await redis.get(key) || 0;
  const permissions = getQueryPermissions(userEmail);
  
  if (parseInt(currentCount) >= permissions.dailyQueryLimit) {
    return false;
  }
  
  // 增加計數器
  await redis.incr(key);
  await redis.expire(key, 86400); // 24小時過期
  
  return true;
}
```

### 3. 用戶問題記憶儲存方案

實現智能的對話記憶系統，提升用戶體驗並減少重複查詢：

#### 3.1 會話管理架構

**數據庫表設計：**
```sql
-- 用戶會話表
CREATE TABLE user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- 對話記錄表
CREATE TABLE conversation_history (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES user_sessions(session_id),
  user_question TEXT NOT NULL,
  generated_sql TEXT,
  ai_response TEXT NOT NULL,
  query_result JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用戶偏好表
CREATE TABLE user_preferences (
  user_email VARCHAR(255) PRIMARY KEY,
  preferred_tables JSONB,
  common_queries JSONB,
  query_patterns JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2 智能上下文管理

**會話上下文維護：**
```typescript
class ConversationManager {
  private sessionId: string;
  private userEmail: string;
  
  constructor(sessionId: string, userEmail: string) {
    this.sessionId = sessionId;
    this.userEmail = userEmail;
  }

  async getRecentContext(limit: number = 5): Promise<ConversationContext> {
    const supabase = createClient();
    
    const { data: recentQueries } = await supabase
      .from('conversation_history')
      .select('user_question, ai_response, generated_sql')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return {
      recentQueries: recentQueries || [],
      sessionId: this.sessionId,
      userEmail: this.userEmail
    };
  }

  async saveConversation(
    question: string, 
    sql: string, 
    response: string, 
    result: any,
    tokensUsed: number
  ): Promise<void> {
    const supabase = createClient();
    
    await supabase
      .from('conversation_history')
      .insert({
        session_id: this.sessionId,
        user_question: question,
        generated_sql: sql,
        ai_response: response,
        query_result: result,
        tokens_used: tokensUsed
      });

    // 更新會話活動時間
    await supabase
      .from('user_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('session_id', this.sessionId);
  }
}
```

#### 3.3 智能提示增強

**基於歷史的提示優化：**
```typescript
async function buildContextualPrompt(
  question: string, 
  schema: string, 
  context: ConversationContext
): Promise<string> {
  const recentContext = context.recentQueries
    .map(q => `Q: ${q.user_question}\nSQL: ${q.generated_sql}`)
    .join('\n\n');

  return `
你是一個 PostgreSQL 專家。根據以下信息回答用戶問題：

數據庫結構：
${schema}

最近的對話記錄：
${recentContext}

當前用戶問題：${question}

請考慮對話上下文，如果用戶提到"之前的查詢"、"那個表格"等，請參考上述對話記錄。
生成安全的 SELECT 查詢，格式如下：
\`\`\`sql
-- 你的 SQL 查詢
\`\`\`
`;
}
```

#### 3.4 個人化學習

**用戶偏好學習：**
```typescript
async function updateUserPreferences(
  userEmail: string, 
  question: string, 
  sql: string
): Promise<void> {
  const supabase = createClient();
  
  // 提取查詢中的表格
  const tablesUsed = extractTablesFromSQL(sql);
  
  // 獲取現有偏好
  const { data: currentPrefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_email', userEmail)
    .single();

  const updatedPrefs = {
    preferred_tables: updateTableFrequency(currentPrefs?.preferred_tables, tablesUsed),
    common_queries: addToCommonQueries(currentPrefs?.common_queries, question),
    query_patterns: analyzeQueryPattern(currentPrefs?.query_patterns, question, sql),
    updated_at: new Date().toISOString()
  };

  await supabase
    .from('user_preferences')
    .upsert({
      user_email: userEmail,
      ...updatedPrefs
    });
}
```

#### 3.5 會話生命週期管理

**自動會話清理：**
```typescript
// 定期清理過期會話（可以設置為 cron job）
async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createClient();
  
  // 標記30天未活動的會話為非活動
  await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // 刪除90天前的對話記錄（保留統計數據）
  await supabase
    .from('conversation_history')
    .delete()
    .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
}
```

### 實施優先級建議

**第一階段（MVP）：**
1. 基本的 token 限制和緩存
2. 簡單的 email 權限檢查
3. 基礎會話儲存

**第二階段（增強）：**
1. 智能上下文管理
2. 分級權限控制
3. 使用量追蹤和限制

**第三階段（優化）：**
1. 個人化學習系統
2. 高級緩存策略
3. 成本優化算法

這些策略將確保 Ask Database 功能既強大又經濟高效，同時提供安全的用戶體驗。

---

## GPT-4o 方案實裝步驟評估

基於對現有項目架構的分析，以下是採用 **精準度與成本平衡模式（GPT-4o）** 的詳細實裝步驟。

### 階段一：環境準備與基礎設置（1-2 週）

#### 1.1 依賴套件安裝

**新增必要的 NPM 套件：**
```bash
npm install openai tiktoken lru-cache
npm install --save-dev @types/lru-cache
```

**更新 package.json：**
```json
{
  "dependencies": {
    "openai": "^4.28.0",
    "tiktoken": "^1.0.10",
    "lru-cache": "^10.1.0"
  },
  "devDependencies": {
    "@types/lru-cache": "^10.0.0"
  }
}
```

#### 1.2 環境變數配置

**更新 .env.local：**
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.1

# Ask Database Configuration
ASK_DB_ENABLED=true
ASK_DB_MAX_QUERIES_PER_DAY=50
ASK_DB_CACHE_TTL=3600
ASK_DB_MAX_RESULT_ROWS=1000
```

#### 1.3 數據庫結構分析

**現有表格清單（基於 database.types.ts）：**
- `data_code` - 產品代碼資訊
- `data_id` - 用戶資訊和權限
- `data_slateinfo` - 石板產品詳細資訊
- `data_supplier` - 供應商資訊
- `record_aco` - ACO 訂單記錄
- `record_grn` - GRN 收貨記錄
- `record_history` - 操作歷史記錄
- `record_inventory` - 庫存記錄
- `record_palletinfo` - 托盤資訊
- `record_slate` - 石板生產記錄
- `record_transfer` - 轉移記錄
- `report_log` - 報告日誌

### 階段二：核心功能開發（2-3 週）

#### 2.1 創建 API 路由

**創建 `app/api/ask-database/route.ts`：**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/app/utils/supabase/server';
import { encoding_for_model } from 'tiktoken';
import { LRUCache } from 'lru-cache';

// 初始化 OpenAI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 初始化緩存
const queryCache = new LRUCache<string, any>({
  max: 1000,
  ttl: parseInt(process.env.ASK_DB_CACHE_TTL || '3600') * 1000,
});

// 數據庫結構緩存
let databaseSchema: string | null = null;
let schemaLastUpdated: number = 0;

export async function POST(request: NextRequest) {
  try {
    const { question, sessionId } = await request.json();

    // 1. 用戶權限檢查
    const hasPermission = await checkUserPermission();
    if (!hasPermission) {
      return NextResponse.json(
        { error: '您沒有權限使用數據庫查詢功能' },
        { status: 403 }
      );
    }

    // 2. 檢查緩存
    const cacheKey = generateCacheKey(question);
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. 分析查詢複雜度
    const complexity = analyzeQueryComplexity(question);

    // 4. 獲取數據庫結構
    const schema = await getDatabaseSchema();

    // 5. 生成 SQL
    const sqlResult = await generateSQL(question, schema, complexity);

    // 6. 執行查詢
    const queryResult = await executeQuery(sqlResult.sql);

    // 7. 生成自然語言回應
    const naturalLanguageResponse = await generateNaturalLanguageResponse(
      question,
      queryResult,
      sqlResult.sql
    );

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

    // 8. 緩存結果
    queryCache.set(cacheKey, result);

    // 9. 記錄會話
    await saveConversationHistory(sessionId, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Ask Database Error:', error);
    return NextResponse.json(
      { error: '查詢處理失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

// 用戶權限檢查
async function checkUserPermission(): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return false;
    }

    const { data: userData } = await supabase
      .from('data_id')
      .select('report')
      .eq('uuid', user.id)
      .single();

    return userData?.report === true;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// 查詢複雜度分析
function analyzeQueryComplexity(question: string): ComplexityAnalysis {
  const indicators = {
    multiTable: /join|關聯|連接|合併/.test(question.toLowerCase()),
    aggregation: /總計|平均|最大|最小|統計|計算|sum|avg|max|min|count/.test(question.toLowerCase()),
    subquery: /子查詢|嵌套|分組|group|having/.test(question.toLowerCase()),
    timeRange: /時間範圍|期間|趨勢|日期|昨天|今天|本週|本月/.test(question.toLowerCase()),
    sorting: /排序|最高|最低|前|後|top|order/.test(question.toLowerCase()),
  };

  const score = Object.values(indicators).filter(Boolean).length;

  return {
    level: score >= 3 ? 'complex' : score >= 1 ? 'medium' : 'simple',
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
      // 獲取表格樣本數據以了解數據範圍
      const { data: sampleData } = await supabase
        .from(table)
        .select('*')
        .limit(3);

      schemaDescription += `表格: ${table}\n`;
      schemaDescription += getTableDescription(table);
      
      if (sampleData && sampleData.length > 0) {
        schemaDescription += `樣本數據: ${JSON.stringify(sampleData[0], null, 2)}\n`;
      }
      
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
    'data_code': '產品代碼表 - 包含產品代碼、描述、顏色、類型、標準數量等資訊\n',
    'data_id': '用戶資訊表 - 包含用戶ID、姓名、部門、權限設置等\n',
    'data_slateinfo': '石板產品詳細資訊表 - 包含產品尺寸、重量、形狀等技術參數\n',
    'data_supplier': '供應商資訊表 - 包含供應商代碼和名稱\n',
    'record_aco': 'ACO訂單記錄表 - 包含訂單編號、產品代碼、需求數量、剩餘數量等\n',
    'record_grn': 'GRN收貨記錄表 - 包含收貨參考號、物料代碼、重量、包裝等資訊\n',
    'record_history': '操作歷史記錄表 - 包含操作動作、托盤號、操作員、時間等\n',
    'record_inventory': '庫存記錄表 - 包含托盤號、產品代碼、各區域庫存數量\n',
    'record_palletinfo': '托盤資訊表 - 包含托盤號、產品代碼、數量、生成時間等\n',
    'record_slate': '石板生產記錄表 - 包含生產批次、機器號、設定員、產品規格等\n',
    'record_transfer': '轉移記錄表 - 包含托盤號、起始位置、目標位置、轉移日期等\n',
    'report_log': '報告日誌表 - 包含報告上下文、錯誤資訊、狀態等\n',
  };

  return descriptions[tableName] || '表格描述不可用\n';
}

// 生成 SQL
async function generateSQL(
  question: string,
  schema: string,
  complexity: ComplexityAnalysis
): Promise<{ sql: string; tokensUsed: number }> {
  const prompt = buildPrompt(question, schema, complexity);
  
  // 計算 tokens
  const encoding = encoding_for_model('gpt-4o');
  const inputTokens = encoding.encode(prompt).length;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 1000,
  });

  const outputTokens = encoding.encode(response.choices[0].message.content || '').length;
  const sql = extractSQLFromResponse(response.choices[0].message.content || '');

  return {
    sql,
    tokensUsed: inputTokens + outputTokens,
  };
}

// 構建提示
function buildPrompt(
  question: string,
  schema: string,
  complexity: ComplexityAnalysis
): string {
  const complexityInstructions = {
    simple: '這是一個簡單查詢，請生成直接的 SELECT 語句。',
    medium: '這是一個中等複雜度查詢，可能需要 JOIN 或聚合函數。',
    complex: '這是一個複雜查詢，可能需要多表聯接、子查詢或複雜的聚合邏輯。',
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
4. 限制結果數量（使用 LIMIT）
5. 處理可能的 NULL 值
6. 使用適當的 JOIN 類型
7. 對於日期查詢，使用 PostgreSQL 日期函數

請按以下格式回應：

推理過程：
[解釋你的思考過程]

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
    // 安全檢查
    if (!isSafeQuery(sql)) {
      throw new Error('不安全的查詢語句');
    }

    const { data, error } = await supabase.rpc('execute_safe_query', {
      query_text: sql
    });

    if (error) {
      throw error;
    }

    const executionTime = Date.now() - startTime;

    return {
      data: data || [],
      rowCount: data?.length || 0,
      executionTime,
    };
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(`查詢執行失敗: ${error.message}`);
  }
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
- 使用繁體中文
- 簡潔明瞭
- 突出重要數據
- 如果沒有結果，說明可能的原因
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0].message.content || '無法生成回應';
}

// 生成緩存鍵
function generateCacheKey(question: string): string {
  return `query:${Buffer.from(question).toString('base64')}`;
}

// 保存會話歷史
async function saveConversationHistory(sessionId: string, result: any): Promise<void> {
  // 這裡可以實現會話歷史保存邏輯
  // 暫時省略，可以後續添加
}

// 類型定義
interface ComplexityAnalysis {
  level: 'simple' | 'medium' | 'complex';
  indicators: Record<string, boolean>;
  score: number;
}
```

#### 2.2 創建數據庫安全查詢函數

**在 Supabase 中創建安全查詢函數：**
```sql
CREATE OR REPLACE FUNCTION execute_safe_query(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    query_lower TEXT;
BEGIN
    -- 轉換為小寫進行檢查
    query_lower := LOWER(query_text);
    
    -- 安全檢查：只允許 SELECT 查詢
    IF query_lower NOT LIKE 'select%' THEN
        RAISE EXCEPTION '只允許 SELECT 查詢';
    END IF;
    
    -- 檢查危險關鍵字
    IF query_lower ~ '(insert|update|delete|drop|create|alter|truncate|grant|revoke)' THEN
        RAISE EXCEPTION '包含不允許的操作';
    END IF;
    
    -- 限制查詢結果數量
    IF query_text NOT ILIKE '%limit%' THEN
        query_text := query_text || ' LIMIT 1000';
    END IF;
    
    -- 執行查詢並返回 JSON 結果
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
    
    RETURN COALESCE(result, '[]'::JSON);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '查詢執行失敗: %', SQLERRM;
END;
$$;
```

#### 2.3 創建前端對話組件

**創建 `app/components/admin-panel-menu/AskDatabaseDialog.tsx`：**
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Database, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface AskDatabaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AskDatabaseDialog({ isOpen, onClose }: AskDatabaseDialogProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<QueryResult[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await fetch('/api/ask-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: currentQuestion,
          sessionId 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '查詢失敗');
      }

      const result: QueryResult = await response.json();
      setConversation(prev => [...prev, result]);
    } catch (error) {
      console.error('Query error:', error);
      // 添加錯誤消息到對話中
      const errorResult: QueryResult = {
        question: currentQuestion,
        sql: '',
        result: { data: [], rowCount: 0, executionTime: 0 },
        answer: `查詢失敗：${error.message}`,
        complexity: 'simple',
        tokensUsed: 0,
        cached: false,
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, errorResult]);
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'complex': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exampleQuestions = [
    "今天生成了多少個托盤？",
    "顯示庫存最多的前5個產品",
    "本週的轉移記錄有哪些？",
    "哪些產品的庫存低於100？",
    "最近的GRN收貨記錄",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent flex items-center gap-3">
            <Database className="h-6 w-6 text-purple-400" />
            Ask Database
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* 對話區域 */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">開始與數據庫對話</h3>
                <p className="text-slate-400 mb-6">使用自然語言查詢您的數據庫資訊</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {exampleQuestions.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestion(example)}
                      className="p-3 text-left bg-slate-700/50 hover:bg-slate-700/70 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200 text-slate-300 hover:text-white"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {conversation.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* 用戶問題 */}
                    <div className="flex justify-end">
                      <div className="max-w-2xl bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4">
                        <p className="text-white">{item.question}</p>
                      </div>
                    </div>

                    {/* AI 回應 */}
                    <div className="flex justify-start">
                      <div className="max-w-4xl space-y-4">
                        {/* 自然語言回答 */}
                        <Card className="bg-slate-800/50 border-slate-700/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-slate-200">回答</CardTitle>
                              <div className="flex items-center gap-2">
                                {item.cached && (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    <Zap className="h-3 w-3 mr-1" />
                                    緩存
                                  </Badge>
                                )}
                                <Badge className={getComplexityColor(item.complexity)}>
                                  {item.complexity}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-slate-300 leading-relaxed">{item.answer}</p>
                          </CardContent>
                        </Card>

                        {/* SQL 查詢 */}
                        {item.sql && (
                          <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg text-slate-200">生成的 SQL</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <pre className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 border border-slate-700/50">
                                <code>{item.sql}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        )}

                        {/* 查詢結果 */}
                        {item.result.data.length > 0 && (
                          <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-slate-200">查詢結果</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Database className="h-4 w-4" />
                                    {item.result.rowCount} 筆記錄
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatExecutionTime(item.result.executionTime)}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-700">
                                      {Object.keys(item.result.data[0] || {}).map((key) => (
                                        <th key={key} className="text-left p-2 text-slate-300 font-medium">
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.result.data.slice(0, 10).map((row, rowIndex) => (
                                      <tr key={rowIndex} className="border-b border-slate-800/50">
                                        {Object.values(row).map((value, colIndex) => (
                                          <td key={colIndex} className="p-2 text-slate-400 text-sm">
                                            {String(value)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {item.result.data.length > 10 && (
                                  <p className="text-slate-500 text-sm mt-2 text-center">
                                    顯示前 10 筆，共 {item.result.rowCount} 筆記錄
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* 統計資訊 */}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Tokens: {item.tokensUsed}</span>
                          <span>時間: {new Date(item.timestamp).toLocaleString('zh-TW')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                    <span className="text-slate-300">正在處理您的查詢...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 輸入區域 */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="請用自然語言描述您想查詢的數據..."
                className="flex-1 min-h-[60px] bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!question.trim() || loading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 階段三：整合與測試（1-2 週）

#### 3.1 更新 Admin 頁面

**修改 `app/admin/page.tsx` 中的 Ask Database 卡片：**
```typescript
// 在文件頂部添加 import
import AskDatabaseDialog from '@/app/components/admin-panel-menu/AskDatabaseDialog';

// 在組件中添加狀態
const [askDatabaseOpen, setAskDatabaseOpen] = useState(false);

// 修改 Ask Database 卡片的按鈕
<div className="bg-purple-500/20 border border-purple-400/30 text-purple-200 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-purple-500/30 transition-colors"
     onClick={() => setAskDatabaseOpen(true)}>
  立即體驗
</div>

// 在組件末尾添加對話框
<AskDatabaseDialog 
  isOpen={askDatabaseOpen} 
  onClose={() => setAskDatabaseOpen(false)} 
/>
```

#### 3.2 權限控制實施

**更新用戶權限檢查邏輯：**
```typescript
// 在 useAuth.ts 中添加
export const useAskDatabasePermission = () => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.email) {
        setHasPermission(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('data_id')
        .select('report')
        .eq('uuid', user.id)
        .single();

      setHasPermission(data?.report === true);
    };

    checkPermission();
  }, [user]);

  return hasPermission;
};
```

#### 3.3 錯誤處理與監控

**創建 `app/utils/askDatabase.ts`：**
```typescript
export class AskDatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AskDatabaseError';
  }
}

export const logQueryError = async (error: any, context: any) => {
  console.error('Ask Database Error:', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // 可以添加到 Supabase 日誌表
  const supabase = createClient();
  await supabase.from('report_log').insert({
    context: JSON.stringify(context),
    error: error.message,
    state: false,
  });
};
```

### 階段四：優化與部署（1 週）

#### 4.1 性能優化

**實施查詢優化：**
```typescript
// 查詢結果分頁
const RESULTS_PER_PAGE = 100;

// 查詢超時設置
const QUERY_TIMEOUT = 30000; // 30秒

// 智能緩存策略
const getCacheStrategy = (complexity: string) => {
  switch (complexity) {
    case 'simple': return { ttl: 3600, priority: 'high' }; // 1小時
    case 'medium': return { ttl: 1800, priority: 'medium' }; // 30分鐘
    case 'complex': return { ttl: 900, priority: 'low' }; // 15分鐘
    default: return { ttl: 1800, priority: 'medium' };
  }
};
```

#### 4.2 安全性加固

**實施額外安全措施：**
```typescript
// 查詢頻率限制
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userEmail: string): boolean => {
  const now = Date.now();
  const userLimit = rateLimiter.get(userEmail);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(userEmail, { count: 1, resetTime: now + 60000 }); // 1分鐘重置
    return true;
  }

  if (userLimit.count >= 10) { // 每分鐘最多10次查詢
    return false;
  }

  userLimit.count++;
  return true;
};
```

#### 4.3 測試計劃

**單元測試：**
```typescript
// tests/askDatabase.test.ts
describe('Ask Database API', () => {
  test('should generate valid SQL for simple queries', async () => {
    // 測試簡單查詢
  });

  test('should handle complex queries correctly', async () => {
    // 測試複雜查詢
  });

  test('should reject unsafe queries', async () => {
    // 測試安全性
  });

  test('should respect rate limits', async () => {
    // 測試頻率限制
  });
});
```

**集成測試：**
```typescript
// tests/integration/askDatabase.integration.test.ts
describe('Ask Database Integration', () => {
  test('should complete full query workflow', async () => {
    // 測試完整工作流程
  });

  test('should handle database connection errors', async () => {
    // 測試數據庫連接錯誤
  });
});
```

### 預期成果與指標

#### 功能指標
- **查詢準確率：** 65-75%
- **響應時間：** 3-8秒
- **每日查詢限制：** 50次/用戶
- **支援查詢類型：** 簡單到複雜的 SELECT 查詢

#### 技術指標
- **API 可用性：** 99.5%
- **查詢成功率：** 95%
- **緩存命中率：** 40-60%
- **平均 Token 消耗：** 1000-3000 tokens/查詢

#### 成本估算
- **月度 API 成本：** $50-120（1000次查詢）
- **基礎設施成本：** $100/月
- **開發維護成本：** $200/月
- **總計：** $350-420/月

這個實裝計劃提供了一個完整的、可執行的路徑，將 Ask Database 功能從概念轉化為實際的產品功能。
