# AI Order Analysis 功能使用指南

## 概述

AI Order Analysis 是一個強大的功能，使用 OpenAI 的 GPT-4o 模型來自動分析 PDF 訂單文檔並提取結構化數據。該功能可以自動識別和提取訂單信息，並將其保存到 `data_order` 數據庫表中。

## 功能特點

- 🤖 **AI 驅動**: 使用 OpenAI GPT-4o 模型進行智能文檔分析
- 📄 **PDF 支持**: 直接處理 PDF 格式的訂單文檔
- 🎯 **精確提取**: 自動識別和提取關鍵訂單信息
- 💾 **自動保存**: 提取的數據自動保存到數據庫
- 👀 **預覽功能**: 在保存前預覽提取的數據
- 🔄 **批量處理**: 支持包含多個產品的訂單

## 支持的文檔類型

- 採購訂單 (Purchase Orders)
- 銷售訂單 (Sales Orders)
- 發票 (Invoices)
- 訂單確認書 (Order Confirmations)
- 報價單 (Quotations)

## 提取的數據欄位

系統會提取以下欄位並保存到 `data_order` 表：

| 欄位名稱 | 類型 | 描述 | 查找關鍵詞 |
|---------|------|------|-----------|
| `account_num` | bigint | 客戶帳號 | Account, Customer ID, Account No, Acc No |
| `order_ref` | bigint | 訂單參考號 | Order No, Order Ref, PO Number, Order ID |
| `customer_ref` | bigint | 客戶參考號 | Customer Ref, Your Ref, Customer PO, Ref No |
| `invoice_to` | text | 發票地址 | Bill To, Invoice Address, Customer Name |
| `delivery_add` | text | 送貨地址 | Ship To, Delivery Address, Delivery To |
| `product_code` | text | 產品代碼 | Code, SKU, Item No, Product Code, Part No |
| `product_desc` | text | 產品描述 | Description, Item, Product, Details |
| `product_qty` | bigint | 產品數量 | Qty, Quantity, Units, Amount |
| `unit_price` | bigint | 單價 (以最小貨幣單位) | Price, Unit Price, Rate, Cost |

## 使用步驟

### 1. 訪問功能
1. 登入系統並進入 Admin 面板
2. 點擊 "Upload Documents" 按鈕
3. 選擇 "AI Order Analysis" 分頁

### 2. 上傳 PDF
1. 拖拽 PDF 文件到上傳區域，或點擊選擇文件
2. 確保文件是 PDF 格式且小於 10MB
3. 系統會顯示文件信息

### 3. 開始分析
1. 點擊 "Analyze with AI" 按鈕
2. 系統會顯示分析進度
3. 等待 AI 完成文檔分析

### 4. 預覽結果
1. 分析完成後，系統會顯示提取的數據
2. 檢查提取的訂單信息是否正確
3. 每個產品行項目會顯示為單獨的記錄

### 5. 數據保存
- 提取的數據會自動保存到數據庫
- 系統會顯示成功保存的記錄數量
- 可以關閉對話框完成操作

## 數據處理規則

### 數字欄位處理
- 自動移除格式化字符（逗號、貨幣符號等）
- 價格自動轉換為最小貨幣單位（如：£12.50 → 1250）
- 無效數字會設為 0

### 文字欄位處理
- 自動清理多餘空白字符
- 保留重要的地址和描述信息
- 找不到的欄位會標記為 "NOT_FOUND"

### 多產品處理
- 如果訂單包含多個產品，每個產品會創建單獨的記錄
- 共同信息（如客戶信息）會複製到每個記錄

## 最佳實踐

### PDF 文檔準備
1. **清晰度**: 確保 PDF 文字清晰可讀
2. **結構化**: 使用表格或清晰的標籤組織信息
3. **完整性**: 包含所有必要的訂單信息
4. **標準格式**: 使用標準的商業文檔格式

### 提高準確性
1. **標準術語**: 使用標準的商業術語和標籤
2. **清晰標題**: 確保欄位標題清晰明確
3. **數據格式**: 使用一致的數據格式（日期、貨幣等）

## 故障排除

### 常見問題

**Q: AI 無法提取某些欄位怎麼辦？**
A: 檢查 PDF 中是否包含相關信息，確保使用標準的商業術語。如果信息確實不存在，系統會使用預設值。

**Q: 價格轉換不正確怎麼辦？**
A: 確保 PDF 中的價格格式清晰，包含正確的貨幣符號。系統會自動轉換為最小貨幣單位。

**Q: 多產品訂單處理不正確怎麼辦？**
A: 確保產品信息以表格或清晰的列表形式組織，每個產品的信息要完整。

**Q: 分析失敗怎麼辦？**
A: 檢查網絡連接、PDF 文件大小（<10MB）和格式。如果問題持續，請聯繫系統管理員。

### 錯誤代碼

- `No file provided`: 沒有選擇 PDF 文件
- `No uploadedBy provided`: 用戶身份驗證失敗
- `Failed to parse extracted data`: AI 回應格式錯誤
- `Missing required field`: 提取的數據缺少必要欄位

## 技術細節

### API 端點
- **路徑**: `/api/analyze-order-pdf`
- **方法**: POST
- **格式**: multipart/form-data

### 請求參數
- `file`: PDF 文件
- `uploadedBy`: 上傳者 ID

### 回應格式
```json
{
  "success": true,
  "extractedData": [...],
  "insertedRecords": [...],
  "recordCount": 3,
  "message": "Successfully extracted and saved 3 order records"
}
```

## 安全性

- 所有 PDF 文件在處理後不會永久存儲
- 只有授權用戶可以訪問此功能
- 提取的數據會記錄上傳者信息
- 支持完整的審計追蹤

## 限制

- 文件大小限制：10MB
- 支持格式：僅 PDF
- 語言支持：主要支持英文文檔
- 處理時間：取決於文檔複雜度，通常 10-30 秒

## 更新日誌

### v1.0.0 (2025-01-24)
- 初始版本發布
- 支持基本的 PDF 訂單分析
- 集成 OpenAI GPT-4o 模型
- 自動數據庫保存功能 