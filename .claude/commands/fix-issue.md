### 必須優先閱讀
- `CLAUDE.md`

### 思考模式
- Sequential-thinking

### 專家小組
- ID：1, 2, 3, 8
- ID說明文檔：`docs\role_play\README.md`

### 任務
- 專注解決用戶問題
- 如沒有提供，則必須詢問

### 處理方式
- 使用Sub-Agent及Sub-Task，同步進行troubleshooting

### 建議策略
- 先定位次序: 頁面 > 組件
- Typo > 語法錯誤 > 其他

### 修復原則

- 奧卡姆剃刀 (Occam's Razor)
  - **核心原則**: 簡單問題應該用簡單解決方案
  - **由簡至繁**: 先檢查最明顯既可能性，然後才考慮複雜架構問題
  - **避免誤導**: 錯誤指向邊一行就先檢查嗰一行，唔好被堆疊避免訊息誤導
  - **逐步診斷**: 語法 → 類型 → 邏輯 → 架構

### 可使用診斷MCP工具
- Puppeteer MCP: 自動化測試
- Supabase MCP: 資料庫查詢
- Brave Search MCP: 搜尋BUG資料

### 修復後測試
- 必需建立一次性的測試文件證實修復工作
- 避免技術債: 必須通過 TypeScript/EsLint
- 事後必須需刪除一次性的測試文件

### 相關文檔記錄
- 修復記錄庫：`docs\issue-library`
- 修復記錄文檔規範：`docs\issue-library\README.md`
- 工作記錄庫：`docs\Today_Todo`
- 工作記錄文檔規範：`docs\Today_Todo\README.md`