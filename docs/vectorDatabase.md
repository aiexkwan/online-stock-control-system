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
  embedding VECTOR(1536) -- 使用 OpenAI text-embedding-3-large 的維度
);

CREATE INDEX idx_product_document_chunks_document_id ON product_document_chunks(document_id);
-- 添加向量索引以加速相似度搜索
CREATE INDEX idx_product_document_chunks_embedding ON product_document_chunks USING ivfflat (embedding vector_cosine_ops);
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
  filter_document_id UUID DEFAULT NULL,
  filter_product_code TEXT DEFAULT NULL
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
  JOIN product_documents pd ON pdc.document_id = pd.id
  WHERE
    (filter_document_id IS NULL OR pdc.document_id = filter_document_id)
    AND (filter_product_code IS NULL OR pd.product_code = filter_product_code)
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
   - 使用 mammoth.js 解析 .doc/.docx 文件
   - 提取純文本內容和結構化資訊
   - 保留文檔層次結構（標題、段落、列表等）

3. **文本分塊**
   - 使用語義感知分塊算法，保持上下文完整性
   - 將文檔分割為最大 8,000 token 的塊（與 OpenAI 嵌入模型限制相容）
   - 使用重疊分塊策略（50-100個token重疊）以保持上下文連續性
   - 為每個塊添加元數據（章節、標題層級、類型等）

4. **向量化處理**
   - 使用 OpenAI text-embedding-3-large 生成嵌入
   - 實現批量處理（每批最多20個塊）以優化API調用
   - 添加重試和錯誤處理機制
   - 存儲向量維度為 1536

5. **數據存儲**
   - 將文檔信息存儲到 `product_documents` 表
   - 將分塊和向量存儲到 `product_document_chunks` 表
   - 使用事務確保數據一致性

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
- 使用 Web Workers 處理前端文檔解析

#### 4.2 向量化優化
- 實現批處理以減少 API 調用
- 使用快取機制避免重複向量化
- 優化 token 使用（預處理文本，移除無意義內容）
- 實現處理隊列系統以管理大批量文檔處理

#### 4.3 查詢優化
- 實現查詢改寫提高搜索質量
- 添加結果再排序以提升準確性
- 結合關鍵詞搜索和向量搜索的混合策略
- 使用產品代碼預過濾縮小搜索範圍

#### 4.4 成本控制
- 實現嵌入快取機制
- 優化分塊策略減少總塊數
- 監控 API 使用量並設置上限
- 定期清理和優化向量數據庫

## 實施計劃

### 階段一：基礎設施搭建（週 1-2）
1. 在 Supabase 中創建所需的表和函數
2. 設置 OpenAI API 和環境變量
3. 實現基本的文件上傳和存儲功能
4. 設計和實現錯誤處理和日誌記錄

### 階段二：文檔處理核心功能（週 3-4）
1. 實現 .doc/.docx 文件解析和文本提取
2. 開發語義感知分塊算法
3. 實現 OpenAI 嵌入生成和存儲
4. 創建處理隊列系統

### 階段三：前端界面開發（週 5-6）
1. 改進 ProductSpecDialog 組件
2. 實現拖放上傳和處理狀態顯示
3. 開發文檔管理界面
4. 添加用戶反饋機制

### 階段四：測試與優化（週 7-8）
1. 創建測試套件和性能基準
2. 進行性能和可靠性測試
3. 優化大文件處理
4. 改進錯誤處理和用戶反饋

### 階段五：完善和部署（週 9-10）
1. 性能和可靠性優化
2. 實施安全性增強措施
3. 完善文檔和使用說明
4. 發布文檔和維護指南

## 技術選型

1. **文件解析**：
   - mammoth.js（用於 .doc/.docx 文件解析）
   - pdf.js（用於可能的 PDF 支持）

2. **向量化**：
   - OpenAI text-embedding-3-large（1536 維向量）
   - 上下文長度：8191 tokens
   - 批處理優化：每批次最多 20 個文本塊

3. **數據庫**：
   - Supabase PostgreSQL 與 pgvector 擴展
   - 向量索引：IVFFLAT 用於高效相似度搜索

4. **前端**：
   - React 與 Next.js
   - Tailwind CSS 用於樣式
   - React Dropzone 用於文件上傳
   - Framer Motion 用於動畫效果

5. **後端處理**：
   - Next.js API Routes 用於標準處理
   - Edge Functions 用於長時間運行任務

## 注意事項和挑戰

1. **API 成本管理**：
   - OpenAI 嵌入 API 成本計算：
     - text-embedding-3-large: $0.13/百萬 tokens (輸入)
     - 估計每 100 頁文檔成本：約 $0.5-1.0
   - 實現批處理和快取策略
   - 設置使用限制和監控

2. **處理大型文檔**：
   - 針對超大文檔（>50MB）實現分段處理
   - 使用異步工作流減少超時風險
   - 提供處理進度實時更新

3. **性能優化**：
   - 優化向量索引以提高搜索速度
   - 實現智能緩存策略
   - 使用批處理減少 API 調用次數

4. **數據隱私與安全**：
   - 實現細粒度訪問控制
   - 敏感信息處理指南
   - 定期安全審計

## 擴展與未來發展

1. **多模態支持**：
   - 添加圖像理解和處理
   - 提取圖表和圖形中的數據
   - 結合文本和圖像信息

2. **高級語義理解**：
   - 實現產品屬性自動提取
   - 創建產品知識圖譜
   - 增強對技術查詢的理解能力

3. **自動文檔更新**：
   - 檢測和處理文檔版本變更
   - 自動識別和更新修改的部分
   - 維護文檔版本歷史

4. **擴展文檔類型支持**：
   - 添加 PDF 文檔處理
   - 支持 Excel 表格處理
   - 處理 CAD 文件元數據
