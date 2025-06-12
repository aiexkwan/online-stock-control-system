# 產品規格文檔向量化功能實現方案

## 功能概述

在 `/admin` 頁面的 `open-product-spec-dialog` 對話框中實現產品規格文檔的向量化功能，主要處理：
- 產品規格文檔（包含產品規格、BOM、組裝步驟）
- 將文檔內容轉換為向量並存儲到 Supabase 向量數據庫
- 支持大型文件（包含大量圖片，可能達到 200KB+ 大小）
- 主要處理 .doc/.docx 格式文件

## 技術架構

### 1. 數據庫結構設計

在 Supabase 中需要創建以下表：

#### 1.1 `product_documents` 表
```sql
CREATE TABLE product_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'specification', 'bom', 'assembly'
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  version TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_product_documents_product_code ON product_documents(product_code);
```

#### 1.2 `product_document_chunks` 表
```sql
CREATE TABLE product_document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES product_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536) -- 使用 OpenAI 的嵌入維度
);

CREATE INDEX idx_product_document_chunks_document_id ON product_document_chunks(document_id);
```

#### 1.3 啟用向量搜索擴展
```sql
-- 啟用向量擴展
CREATE EXTENSION IF NOT EXISTS vector;

-- 創建向量搜索函數
CREATE OR REPLACE FUNCTION match_product_document_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_document_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_index INTEGER,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pdc.id,
    pdc.document_id,
    pdc.chunk_index,
    pdc.chunk_text,
    pdc.metadata,
    1 - (pdc.embedding <=> query_embedding) AS similarity
  FROM product_document_chunks pdc
  WHERE
    (filter_document_id IS NULL OR pdc.document_id = filter_document_id)
    AND 1 - (pdc.embedding <=> query_embedding) > match_threshold
  ORDER BY pdc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 2. 文件處理流程

#### 2.1 前端組件設計

改進現有的 ProductSpecDialog 組件，添加以下功能：

1. **文件上傳區域**
   - 支持拖放和點擊上傳
   - 支持 .doc/.docx 格式
   - 顯示文件大小限制和支持的格式

2. **產品信息表單**
   - 產品代碼輸入（必填）
   - 產品名稱輸入（必填）
   - 文檔類型選擇（規格/BOM/組裝步驟）
   - 版本號輸入

3. **處理狀態顯示**
   - 上傳進度條
   - 文檔處理進度（解析、分塊、向量化）
   - 完成狀態和錯誤信息

4. **文檔管理功能**
   - 已上傳文檔列表
   - 搜索和過濾功能
   - 版本管理

#### 2.2 後端處理流程

1. **文件上傳處理**
   - 接收前端上傳的文件
   - 驗證文件格式和大小
   - 存儲到 Supabase Storage

2. **文檔解析**
   - 使用適當的庫解析 .doc/.docx 文件（如 mammoth.js 或 docx）
   - 提取純文本內容
   - 提取文檔結構和元數據

3. **文本分塊**
   - 將文檔分割為適當大小的塊（考慮語義完整性）
   - 處理特殊格式（如表格、列表）
   - 為每個塊添加元數據（位置、類型等）

4. **向量化處理**
   - 使用 OpenAI 的嵌入 API 生成文本塊的向量表示
   - 批量處理以優化 API 調用
   - 錯誤處理和重試機制

5. **數據存儲**
   - 將文檔信息存儲到 `product_documents` 表
   - 將分塊和向量存儲到 `product_document_chunks` 表
   - 事務處理確保數據一致性

### 3. API 設計

#### 3.1 文件上傳 API
```
POST /api/product-spec/upload
```
- 接收文件和元數據
- 驗證和存儲文件
- 返回文件 ID 和存儲 URL

#### 3.2 文檔處理 API
```
POST /api/product-spec/process
```
- 接收文件 ID 和處理參數
- 執行文檔解析、分塊和向量化
- 返回處理狀態和結果

#### 3.3 向量搜索 API
```
POST /api/product-spec/search
```
- 接收查詢文本和搜索參數
- 將查詢轉換為向量
- 執行向量相似度搜索
- 返回相關文檔塊和元數據

### 4. 優化策略

#### 4.1 大文件處理
- 使用流式處理減少內存消耗
- 實現分塊上傳機制
- 設置適當的超時和重試機制

#### 4.2 圖片處理
- 提取和存儲文檔中的圖片
- 使用圖像壓縮減小存儲空間
- 考慮使用圖像識別提取圖片中的文本（可選）

#### 4.3 性能優化
- 實現後台處理隊列（使用 Next.js API Routes 或獨立服務）
- 使用緩存減少重複處理
- 批量處理向量化請求減少 API 調用

#### 4.4 用戶體驗
- 實時處理狀態更新
- 預覽功能
- 漸進式加載大型文檔

## 實施計劃

### 階段一：基礎設施搭建
1. 在 Supabase 中創建所需的表和函數
2. 設置文件存儲和訪問權限
3. 實現基本的文件上傳和存儲功能

### 階段二：文檔處理核心功能
1. 實現 .doc/.docx 文件解析
2. 開發文本分塊算法
3. 集成 OpenAI 嵌入 API
4. 實現向量存儲和檢索功能

### 階段三：前端界面開發
1. 改進 ProductSpecDialog 組件
2. 實現文件上傳和處理狀態顯示
3. 開發文檔管理界面
4. 添加搜索和過濾功能

### 階段四：測試和優化
1. 進行性能和可靠性測試
2. 優化大文件處理
3. 改進錯誤處理和用戶反饋
4. 實施安全性增強措施

### 階段五：集成到 ask-database 功能
1. 擴展現有的 ask-database API 以包含向量搜索
2. 實現混合搜索策略（結合向量搜索和結構化查詢）
3. 優化搜索結果呈現
4. 添加用戶反饋機制改進搜索質量

## 技術選型

1. **文件解析**：
   - mammoth.js 或 docx（用於 .doc/.docx 文件解析）
   - pdf.js（用於可能的 PDF 支持）

2. **向量化**：
   - OpenAI Embeddings API (text-embedding-3-large)

3. **數據庫**：
   - Supabase PostgreSQL 與 pgvector 擴展

4. **前端**：
   - React 與 Next.js
   - Tailwind CSS 用於樣式
   - React Dropzone 用於文件上傳
   - Framer Motion 用於動畫效果

5. **後端處理**：
   - Next.js API Routes
   - 可選：獨立的處理服務（用於長時間運行的任務）

## 注意事項和挑戰

1. **文件大小限制**：
   - Next.js 默認的 API 路由有請求體大小限制
   - 需要配置適當的中間件處理大型文件
   - 考慮分塊上傳和處理策略

2. **處理時間**：
   - 大型文檔處理可能需要較長時間
   - 實現異步處理和狀態通知機制
   - 考慮使用 WebSockets 提供實時更新

3. **成本控制**：
   - OpenAI API 調用成本
   - 實現批處理和緩存策略
   - 監控和限制 API 使用量

4. **數據安全**：
   - 確保敏感產品信息的安全
   - 實現適當的訪問控制
   - 考慮數據加密需求

## 後續擴展

1. **多模態支持**：
   - 添加圖像理解和處理
   - 支持更多文件格式（PDF、Excel 等）

2. **高級搜索功能**：
   - 語義搜索增強
   - 過濾和分面搜索
   - 相關性調整

3. **自動化提取**：
   - 自動識別和提取產品屬性
   - 結構化 BOM 信息
   - 組裝步驟序列化

4. **協作功能**：
   - 文檔版本控制
   - 評論和註釋
   - 變更追蹤
