## 執行方式
1. 根據用戶指示，判斷需要的文檔及整個專案（如有需要）
2. 建立todolist

## 使用模式
- 深層思考 : Ultrathink
- Task : 工具－同步平行執行任務

## 編碼核心原則
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- Open/Closed Principle
- 減少冗碼

## 必須遵守規則
- 資料庫欄位名稱或設定：優先使用Supabase MCP 工具確定，次選閱讀 docs\databaseStructure.md
- 不可作出任何假設行為：如沒有所需資料，必須提問
- 不可自作主張：如有疑問必須提問
- 更新後測試：更新後必須使用工具進行測試，不可跳過
- 所有一次性的測試程序都必須在使用後刪除
- 服務器啟動時間超時 : 再次重試，不可以此為理由跳過

## 系統資訊
預計使用人數：30-40人
同時在線：4-5人
在線方式：移動裝置及電腦端
運作時間：24/7

## 可使用工具
- 思維模式 : Sequential-thinking MCP
- 搜尋資料：Brave Search MCP
- Headless：puppeteer MCP
- DATABASE 查詢：Supabase MCP
- Web 前端測試 : Playwright
- 快速測試工具 : Vitest
- 前端元件開發、測試 : Storybook

## 系統登入
系統登入email：.env.local.SYS_LOGIN
系統登入password ：.env.local.SYS_PASSWORD

## TodoList
- 每次執行任務前先檢查 todolist記憶庫 有否當天任務
- 如有當天未完成任務，則詢問用戶是否優先處理新增任務
- 進度一律以版本號(1.1.2, 2.3.4)作單位，不使用任日期丶時間
- 只存在一個當天任務文檔，任何新增或更改，均需在 docs\task\{當天日期}.md 內，不可新增

## 文檔儲存格式
UTF-8

## 文檔儲存方式
- 必須放入相對應的文檔庫
- 不可任意位置儲存
- 如無法歸類，一律存入無法歸類文檔

## 文檔庫
issue fixing記錄庫：docs\issue-library
評核紀錄庫：docs\audit
計劃文檔庫：docs\planning
todolist記憶庫：docs\task
RPC 文檔庫：docs\rpc-functions
SQL 文檔庫：docs\SQL-Library
無法歸類文檔庫 : docs\Others


## 文檔儲存命名格式
評核紀錄：docs\audit\{相關審查工作}.md
issue fixing記錄：docs\issue-library\{問題類型}.md
計劃文檔：docs\planning\{相關計劃}.md
todolist記憶庫：docs\task\{當天日期}.md