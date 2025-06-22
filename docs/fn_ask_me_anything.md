# Ask Me Anything - AI驅動嘅智能資料庫查詢系統

## 概述

Ask Me Anything係一個AI驅動嘅智能資料庫查詢系統，使用OpenAI嘅GPT-4o模型嚟處理自然語言問題並生成精確嘅SQL查詢。系統為用戶提供咗一個對話式介面嚟查詢倉庫資料庫，唔需要SQL知識，支援英文同中文。

## 系統架構

### 核心組件

1. **API路由** (`app/api/ask-database/route.ts`)
   - 處理用戶查詢請求
   - 管理OpenAI API調用
   - 通過Supabase執行SQL查詢
   - 生成自然語言回應
   - 實現緩存同會話管理

2. **前端組件**
   - `app/components/AskDatabaseInlineCard.tsx`: 主聊天介面
   - `app/components/admin-panel-menu/AskDatabaseDialog.tsx`: 管理面板嘅對話框版本
   - `app/components/admin-panel/AskDatabaseWidget.tsx`: 儀表板小工具實現
   - `app/components/admin-panel/EnhancedAskDatabaseWidget.tsx`: 增強小工具，帶額外功能

3. **系統提示** (`docs/openAIprompt`)
   - 詳細嘅系統指示
   - 資料庫模式映射
   - 查詢生成規則
   - 回應格式指南

4. **記憶服務** (`app/services/memoryService.ts`)
   - 可選嘅mem0ai整合，用於持久記憶
   - 跨會話存儲對話上下文
   - 通過歷史上下文增強回應相關性

## 工作流程

### 1. 用戶輸入處理
- 用戶輸入自然語言問題（支援英文同中文）
- 系統檢查用戶權限同封鎖名單
- 檢查LRU緩存以獲取相同查詢結果
- 驗證輸入長度同格式

### 2. OpenAI SQL生成
- 從`docs/openAIprompt`讀取系統提示
- 包括對話歷史（最後3次交流）
- 使用GPT-4o生成SQL查詢
- 驗證生成嘅SQL係安全嘅（僅SELECT）

### 3. SQL執行
- 通過Supabase RPC函數`execute_sql_query`執行SQL
- 追蹤執行時間同性能指標
- 優雅地處理錯誤
- 限制結果大小以保證性能

### 4. 自然語言回應
- 使用OpenAI分析查詢結果
- 生成專業嘅英式英語回應
- 提供清晰嘅數據解釋
- 適當地格式化數字同日期

### 5. 結果緩存同記錄
- 在LRU緩存中緩存結果（2小時TTL）
- 保存到`query_record`表用於分析
- 更新會話歷史
- 追蹤token使用以監控成本

## 安全功能

### SQL注入保護
- 僅允許SELECT查詢
- 阻止危險關鍵字（DROP、DELETE、UPDATE等）
- 防止多語句執行
- 使用參數化RPC函數

### 訪問控制
- 基於電郵嘅權限檢查
- 封鎖用戶名單管理
- 測試嘅開發模式
- 基於角色嘅訪問限制

### 數據保護
- 唔暴露敏感嘅資料庫結構
- 清理錯誤消息
- 完整嘅審計軌跡
- 會話隔離

## 性能優化

### 緩存策略
- **LRU緩存**: 查詢結果緩存2小時
- **會話緩存**: 對話歷史24小時
- **用戶緩存**: 用戶名同權限
- **智能鍵生成**: 一致嘅緩存鍵

### 並行處理
- 並發權限同歷史檢查
- 異步保存操作
- 非阻塞回應生成
- 高效嘅資料庫查詢

### Token管理
- 追蹤每個請求嘅OpenAI API使用
- 監控總token消耗
- 實施查詢複雜度追蹤
- 成本優化策略

## 支援嘅查詢類型

### 基本統計查詢
- 棧板計數（今日、昨日、本週等）
- 產品庫存統計
- GRN收貨記錄
- 轉移記錄統計
- 基於位置嘅庫存

### 複雜分析查詢
- 庫存排名（最高/最低）
- 產品過濾（按顏色、類型等）
- 重量統計同分析
- 員工活動追蹤
- 基於時間嘅比較

### 歷史查詢
- 棧板歷史記錄
- 操作歷史
- 作廢記錄
- ACO訂單狀態
- 趨勢分析

### 專門查詢
- 低庫存警報
- 生產效率
- 供應商性能
- 質量控制指標

## 使用示例

### 中文查詢
```
今日生成咗幾多個棧板？
顯示庫存最高嘅前5個產品
MHCOL2產品嘅總庫存係幾多？
本週有咩轉移記錄？
邊啲產品庫存低於100個單位？
```

### 英文查詢
```
How many pallets were generated today?
Show top 5 products with highest inventory
What is the total inventory for MHCOL2?
What transfer records were made this week?
Which products have less than 100 units in stock?
```

## 配置要求

### 環境變數
```env
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
MEM0_API_KEY=optional-mem0-api-key
```

### 資料庫要求
- `execute_sql_query` RPC函數用於安全查詢執行
- `query_record`表用於查詢歷史
- 適當嘅表權限
- 讀取所有相關表嘅訪問權限

### API限制
- 適用OpenAI API速率限制
- 查詢結果大小限制為10,000行
- 會話歷史限制為最後10次交流
- 緩存大小受內存限制

## 記憶整合（可選）

### Mem0ai功能
- 持久用戶偏好
- 跨會話上下文保留
- 從過去嘅互動中學習
- 改善回應相關性

### 配置
```typescript
// 在memoryService.ts中啟用
const MEM0_CONFIG = {
  api_key: process.env.MEM0_API_KEY,
  org_id: process.env.MEM0_ORG_ID,
  project_id: process.env.MEM0_PROJECT_ID
}
```

## 監控同調試

### 日誌系統
- 詳細嘅請求/回應日誌
- OpenAI API調用追蹤
- SQL執行監控
- 錯誤同異常日誌
- 性能指標

### 健康檢查端點
- GET `/api/ask-database`提供系統狀態
- 環境配置檢查
- 資料庫連接驗證
- 用戶權限狀態
- 緩存統計

### 分析儀表板
- 查詢頻率分析
- 熱門查詢模式
- 錯誤率監控
- Token使用追蹤
- 回應時間指標

## 錯誤處理

### 用戶友好消息
- 清晰嘅錯誤解釋
- 建議嘅操作
- 後備回應
- 重試機制

### 常見錯誤場景
- 無效權限
- 資料庫連接問題
- OpenAI API失敗
- 查詢超時
- 無效SQL生成

## 最佳實踐

### 查詢優化
- 盡可能使用特定產品代碼
- 為歷史數據指定日期範圍
- 限制結果集以獲得更好性能
- 提出有針對性嘅問題

### 系統維護
- 定期緩存清理
- 查詢歷史歸檔
- Token使用監控
- 性能基線追蹤

## 未來改進

### 計劃功能
- 多語言支援（超越英文/中文）
- 圖表同可視化生成
- 查詢建議同自動完成
- 語音輸入支援
- 匯出查詢結果

### 性能改進
- 查詢結果預計算
- 更智能嘅緩存策略
- 批量查詢支援
- 回應流式傳輸

### 安全增強
- 細粒度權限控制
- 查詢複雜度限制
- 每個用戶嘅速率限制
- 增強審計功能

## 整合點

### 管理儀表板
- 作為儀表板小工具提供
- 整合喺管理選單中
- 快速訪問對話框
- 跨會話持久化

### 移動支援
- 響應式設計
- 觸控友好介面
- 為小屏幕優化
- 離線查詢排隊

### API整合
- RESTful端點
- JSON回應格式
- 認證標頭
- CORS支援

## 技術堆棧

### 後端
- Next.js API路由
- OpenAI GPT-4o
- Supabase（PostgreSQL）
- TypeScript
- LRU緩存

### 前端
- React組件
- Framer Motion動畫
- Tailwind CSS
- Lucide圖標
- Markdown渲染

呢個AI驅動嘅系統為用戶提供咗一個直觀、強大同安全嘅方式嚟使用自然語言查詢倉庫資料庫，消除咗對SQL知識嘅需求，同時維持數據安全同性能。