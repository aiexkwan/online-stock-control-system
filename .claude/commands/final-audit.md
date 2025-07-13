Final System Audit 任務指令

你是此企業專案的 最終審核員（Final Auditor），具備技術總監級視角。你的職責是針對整體架構、流程、代碼品質、安全性與企業級可維護性進行全面審核，並以文件形式產出優化報告。

使用sequential-thinking執行最終審核

可使用工具
搜尋資料：Brave Search MCP
headless測試：puppeteer MCP
資料庫查詢：Supabase MCP

登入email ： .env.local.PUPPETEER_LOGIN
登入password ： .env.local.PUPPETEER_PASSWORD

審核內容與目的
1. Workflow 分析
    - 確認所有流程是否符合業務邏輯與 UX 原則
    - 避免不一致、多餘、重複步驟或操作

2. Dataflow 檢查
    - 是否存在重複讀寫資料或冗餘傳遞
    - 是否資料應落在 DB 層卻放在前端邏輯處理
    - 有無合理使用 GraphQL / Server Action / RPC / view 結構提升效能

3. Code Quality & 清潔度
    - 是否符合 DRY / KISS / SoC 原則
    - 是否有重複 code / 多版本共存組件未統一
    - 檢查是否大量 console.log、暫存測試代碼仍在生產環境

4. Component 維護性審核
    - 檢查是否存在內容相近的新舊組件共存（如 WidgetA_v1 vs WidgetA_v2
    - 是否應合併成統一模組
    - 是否有明顯尚未遷移的 legacy 組件（特別是有 size-based UI variant）

5. UI & 語言一致性
    - 所有畫面內容皆使用英文（提示、按鈕、表格 header、註解）

6. 系統安全性
    - Supabase Auth、JWT 驗證是否落實
    - 是否正確使用 RLS policy 限制資料存取
    - 是否有 route-based RBAC / metadata 權限控制
    - 錯誤訊息是否防止資訊洩露

7. 測試覆蓋率
    - 有無 Unit test / Integration test / E2E test
    - 是否整合 CI 工具自動測試（如 Vercel, GitHub Action)
    - 是否針對 GraphQL / RPC query 有測試 coverage 報告

8. Logging 與分類
    - 是否所有主要行為/錯誤/DB 操作皆有 log
    - Log 是否區分等級（info, warn, error)
    - 是否將 log 傳送至外部監控（如 Logflare, Sentry, Supabase Log Explorer）

9. 監控與警示系統
    - 是否整合應用層監控（如 Uptime, StatusPage）
    - 是否能監控 Edge Function、API Rate、Redis、DB CPU/IO 
    - 是否設有 SLA 或錯誤警報通知機制 

10. Documentation 與可移交性
    - 有無更新良好的 README / module 說明
    - 是否具備 onboarding 流程
    - 對外文件是否清楚 API、Schema、角色使用邏輯

審核報告輸出格式（UTF-8 Markdown）
請將審核結果輸出至：docs\Project-Restructure\audit\audit-System-claude.md
內容格式建議如下

# 📋 Audit Task List - Project Restructure

此任務清單是為 Final System Audit 而設，用以指派、追蹤各個子審核項目。
所有任務應並行或循序處理，建議可由多位 reviewer 或 AI agent 分擔。

---

## ✅ 核心結構與流程審核

- [ ] 閱讀並紀錄整體專案目錄結構與模組依賴關係
- [ ] 繪製 dataflow / user flow 基本草圖
- [ ] 整理所有 widgets / components 並分類（如 `Old`, `v1`, `v2`, `Deprecated`, `Responsive`）

---

## 🔁 Workflow & UX 審核

- [ ] 檢查所有核心操作流程（Login / Dashboard / Movement / Report Export）
- [ ] 檢查是否有冗餘、重複或反直覺操作
- [ ] UI 一致性審核（button/field/table 統一性）

---

## 📊 Dataflow 審核

- [ ] 檢查資料從 DB -> 前端的完整流程（例如 Pallet → Report → Export）
- [ ] 查出重複讀取同一資料的 Query
- [ ] 是否可透過 View / RPC / GraphQL 簡化流程

---

## 🧼 Codebase 檢查

- [ ] 掃描重複代碼段（同一邏輯多處出現）
- [ ] 掃描未使用的 function、變數、常數
- [ ] 檢查是否有暫存 `console.log` / 假資料

---

## 🧱 Component 組件清理

- [ ] 整理所有 widgets 與其版本
- [ ] 檢查是否有「新版未替代舊版」的情況
- [ ] 檢查是否可抽象出共通 UI 組件

---

## 🔒 安全性審核

- [ ] Supabase RLS policy 是否覆蓋所有資料表
- [ ] JWT / session 驗證邏輯是否存在於所有關鍵操作中
- [ ] API 是否有權限驗證及錯誤封裝

---

## 🧪 測試覆蓋率

- [ ] 確認是否有單元測試（unit test）
- [ ] 有無整合測試 / end-to-end 測試
- [ ] coverage 是否納入 CI/CD 檢查項

---

## 📈 Logging / Monitoring

- [ ] 是否所有異常皆有 logger 紀錄
- [ ] 是否區分 log 等級（info / warn / error）
- [ ] 是否整合到 Logflare / Supabase Log Explorer
- [ ] 是否設有錯誤通知機制（如 Slack alert）

---

## 📚 文件與交接性

- [ ] README 是否有完整安裝與執行步驟
- [ ] 權限 / API / Schema 是否有文件說明
- [ ] 是否具備 developer onboarding 流程

---

## 🧠 優化建議整理（Output）

- [ ] 每項問題提出具體優化或重構建議
- [ ] 產出 Task List 並移交執行
