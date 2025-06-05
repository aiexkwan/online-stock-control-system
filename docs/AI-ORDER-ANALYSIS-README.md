# AI Order Analysis Feature

## 🚀 新功能：AI 驅動的訂單分析

我們很高興地宣布推出全新的 **AI Order Analysis** 功能！這個強大的工具使用 OpenAI 的 GPT-4o 模型來自動分析 PDF 訂單文檔並提取結構化數據。

### ✨ 主要特點

- **🤖 AI 驅動**: 使用最先進的 GPT-4o 模型進行智能文檔分析
- **📄 PDF 支持**: 直接處理 PDF 格式的訂單文檔
- **🎯 精確提取**: 自動識別和提取關鍵訂單信息
- **💾 自動保存**: 提取的數據自動保存到 `data_order` 數據庫表
- **👀 預覽功能**: 在保存前預覽提取的數據
- **🔄 批量處理**: 支持包含多個產品的訂單

### 🎯 使用場景

- 自動化訂單數據錄入
- 減少手動數據輸入錯誤
- 提高訂單處理效率
- 支持多種訂單文檔格式

### 📋 支持的文檔類型

- 採購訂單 (Purchase Orders)
- 銷售訂單 (Sales Orders)
- 發票 (Invoices)
- 訂單確認書 (Order Confirmations)
- 報價單 (Quotations)

### 🔧 快速開始

1. **設置 OpenAI API 密鑰**
   ```bash
   # 在 .env.local 文件中添加
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **驗證設置**
   ```bash
   node scripts/test-pdf-analysis.js
   ```

3. **開始使用**
   - 進入 Admin 面板
   - 點擊 "Upload Documents"
   - 選擇 "AI Order Analysis" 分頁
   - 上傳 PDF 並點擊 "Analyze with AI"

### 📊 提取的數據欄位

| 欄位 | 類型 | 描述 |
|------|------|------|
| `account_num` | bigint | 客戶帳號 |
| `order_ref` | bigint | 訂單參考號 |
| `customer_ref` | bigint | 客戶參考號 |
| `invoice_to` | text | 發票地址 |
| `delivery_add` | text | 送貨地址 |
| `product_code` | text | 產品代碼 |
| `product_desc` | text | 產品描述 |
| `product_qty` | bigint | 產品數量 |
| `unit_price` | bigint | 單價（最小貨幣單位）|

### 💰 成本考量

- 使用 OpenAI GPT-4o 模型
- 每次分析約 $0.01-0.05
- 成本取決於文檔複雜度

### 📚 文檔

- [使用指南](./ai-order-analysis-guide.md)
- [設置指南](./setup-ai-order-analysis.md)

### 🔒 安全性

- PDF 文件不會永久存儲
- 所有操作都有審計日誌
- 支持用戶權限控制

### 🐛 故障排除

常見問題和解決方案請參考 [設置指南](./setup-ai-order-analysis.md#故障排除)。

### 🚀 技術實現

- **前端**: React + TypeScript + Tailwind CSS
- **後端**: Next.js API Routes
- **AI**: OpenAI GPT-4o
- **數據庫**: Supabase PostgreSQL
- **文件處理**: 直接 PDF 處理

### 📈 未來計劃

- 支持更多文檔格式
- 增加自定義提取規則
- 批量文檔處理
- 多語言支持

---

**需要幫助？** 請查看我們的文檔或聯繫系統管理員。 