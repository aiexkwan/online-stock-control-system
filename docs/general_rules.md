##### 必須遵守規則
- 資料庫欄位名稱或設定：優先使用Supabase MCP 工具確定，次選閱讀 docs\databaseScheme\databaseStructure.md
- 不可作出任何假設行為：如沒有所需資料，必須提問
- 不可自作主張：如有疑問必須提問
- 更新後測試：更新後必須使用工具進行測試，不可跳過
- 測驗時會用的系統登入email：.env.local.SYS_LOGIN
- 測驗時會用的系統登入password ：.env.local.SYS_PASSWORD
- 所有一次性的測試程序都必須在使用後刪除
- 服務器啟動時間超時 : 再次重試，不可以此為理由跳過
- *必須完整閱讀整份守則*

## 身份配置
- 問用戶是否需要特定身份，並按用戶指示閱讀身分定位

## 系統資訊
- Widget系統：REST API
- 預計使用人數：30-40人
- 同時在線：4-5人
- 在線方式：移動裝置及電腦端
- 運作時間：24/7

## 工作執行方式
- 根據用戶指示，判斷需要的文檔及整個專案（如有需要）
- 必須建立todolist
- 基於證據的推理 ：所有聲明都必須透過測試、指標或文件進行驗證

## 使用模式
- 深層思考 : Ultrathink
- Task : 工具－同步平行執行任務

## 編碼核心原則
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- Open/Closed Principle
- SOLID Principles
- 減少冗碼

## 編碼技巧
- 優先使用 React Query ，取代 useEffect + useState 組合

## 可使用工具
- 思維模式 : Sequential-thinking MCP
- 搜尋資料：Brave Search MCP
- Headless：puppeteer MCP
- DATABASE 查詢：Supabase MCP
- Web 前端測試 : Playwright
- 快速測試工具 : Vitest
- 前端元件開發、測試 : Storybook

***系統文檔有關***
## 文檔儲存格式
UTF-8

## 文檔用途分類
- 計劃文檔：只用於寫入已擬定／未來計劃，不牽涉任何完成度紀錄
- todolist文檔：只用於規劃每天TodoList（根據 計劃文檔 內編定及執行），不牽涉任何未來計劃丶進度檢查
- 進度檢查報告文檔：根據 計劃文檔 及 todolist文檔庫 內的文檔，檢查及追蹤進度，不牽涉任何未來計劃
- 評核紀錄庫：當 進度檢查報告文檔 評定為［完成］後，交由審判員寫入

## 文檔儲存方式
- 必須放入相對應的文檔庫
- 不可任意位置儲存
- 如無法歸類，一律存入無法歸類文檔

## 文檔庫
錯誤記錄庫：docs\issue-library
評核紀錄庫：docs\audit
計劃文檔庫：docs\planning
todolist記憶庫：docs\Today_Todo
RPC 文檔庫：docs\rpc-functions
SQL 文檔庫：docs\SQL-Library
無法歸類文檔庫：docs\Others
進度檢查報告庫：docs\progress-check
資料庫結構：docs\databaseSchema

## 文檔儲存命名格式
評核紀錄：docs\audit\{相關審查工作}.md
錯誤記錄：docs\issue-library\{問題類型}.md
計劃文檔：docs\planning\{相關計劃}.md
todolist文檔：docs\Today_Todo\{當天日期}.md
進度報告：docs/progress-check\{進度檢查報告}.md

## 更新文檔方式
- TodoList 只用於記錄 當天工作
- 詳細紀錄應寫入回各自的計劃書
- 計畫書中所有更新，均應在該計劃的計劃書中更新／新增，並非不停新增 
- 進度更新時：直接修改內容，並非在文檔末段加上紀錄
- 有內容添加時：在文檔末段加上

***TodoList相關***
## TodoList 文檔紀錄守則
- 每次執行任務前先檢查 todolist記憶庫 有否當天任務
- 如有當天未完成任務，則詢問用戶是否優先處理新增任務
- 進度一律以版本號(1.1.2, 2.3.4)或 優先級數 作進度單位
- 不使用任日期丶時間丶上下午 作進度單位
- 只可存在一個當天任務文檔，任何新增或更改，均需在 docs\Today_Todo\{當天日期}.md 內進行，不可新增
- 只專汪當天工作，不應包含明天的計劃

## TodoList 文檔範本
- 已經完成的工作 ([x] - 極致簡單描述) 
- 等待開始的工作 ([ ] - 極致簡單描述)
- 其餘關工作的詳細紀錄：應寫入回各自的計劃書
- 文檔末加入有關的計劃/評核/錯誤 等文檔牽引