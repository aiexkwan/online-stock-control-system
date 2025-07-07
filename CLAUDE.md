# Claude 專案設定

## 語言設定
永遠使用廣東話回答所有問題。

### 必須遵守事項
- **長駐開啟ultrathink模式**
- 優先編輯現有文件而非創建新文件
- 只在用戶明確要求時創建文檔文件
- 運行 lint 同 typecheck 確保代碼質量
- 使用 MCP 工具確認數據庫結構，唔好假設
- 所有 UI 文字必須使用英文
- 保持代碼整潔，減少冗餘
- 文檔必須使用UTF-8格式

## 專案概述
NewPennine 倉庫管理系統 - 基於 Next.js、TypeScript 同 Supabase 嘅現代化 WMS。一個功能齊全嘅企業級倉庫管理解決方案，支援從收貨到出貨嘅完整供應鏈管理。

## 技術棧
- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **後端**: Supabase (PostgreSQL)
  - **專案 ID**: `bbmkuiplnzvpudszrend`
- **UI 組件**: shadcn/ui, Radix UI
- **圖表**: Recharts
- **儀表板**: 固定佈局系統 (無用戶自定義功能)
- **實時功能**: Supabase Realtime
- **認證**: Supabase Auth
- **文件處理**: PDF 生成 (react-pdf)、Excel 處理 (需要從 xlsx 遷移到 ExcelJS)
- **硬件整合**: 打印機、掃描器、RFID (計劃中)

## 開發規範
1. 使用 TypeScript 嚴格模式
2. 遵循 Next.js App Router 架構
3. 使用 Tailwind CSS 做樣式
4. 保持組件模組化同可重用
5. 實施適當嘅錯誤處理同加載狀態
6. **以優化、更新原有代碼作大前題，代替不斷創建新代碼，減少冗碼（必需情況除外）**
7. **UI 界面一律使用英文**
8. **如需確定資料庫結構、欄位名稱、欄位設定，必需使用 mcp 工具確認（如不能使用，請詢問）不可作出任何假設**
9. **使用統一嘅錯誤處理機制 (ErrorHandler service)**
10. **遵循 atomic operation 原則，使用 RPC 處理複雜事務**
11. **實施完整嘅事務日誌追蹤 (TransactionLogService)**

## 注意事項

### 安全考慮
- 唔好 commit 任何 API key 或敏感資料
- 使用環境變量管理配置
- 實施適當嘅權限控制
- 定期更新依賴解決安全漏洞

### 性能考慮
- 優先使用 RPC 函數處理複雜操作
- 實施適當嘅緩存策略
- 使用虛擬化處理大數據列表
- 監控 bundle size，避免過大

## 聯絡同支援
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- 項目文檔: /docs 目錄
- 內部知識庫: 使用 Ask Database 功能查詢