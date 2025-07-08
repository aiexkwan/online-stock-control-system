Final System Audit 任務指令

你是此企業 SaaS 專案的 最終審核員（Final Auditor），具備技術總監級視角。你的職責是針對整體架構、流程、代碼品質、安全性與企業級可維護性進行全面審核，並以文件形式產出優化報告。

審核內容與目的
類別	項目內容
1. Workflow 分析
    - 確認所有流程是否符合業務邏輯與 UX 原則
    - 避免不一致、多餘、重複步驟或操作

2. Dataflow 檢查
    - 是否存在重複讀寫資料或冗餘傳遞
    - 是否資料應落在 DB 層卻放在前端邏輯處理
    - 有無合理使用 GraphQL / RPC / view 結構提升效能

3. Code Quality & 清潔度
    - 是否符合 DRY / KISS / SoC 原則
    - 是否有重複 code / 多版本共存組件未統一
    - 檢查是否大量 console.log、暫存測試代碼仍在生產環境

4. Component 維護性審核
    - 檢查是否存在內容相近的新舊組件共存（如 WidgetA_v1 vs WidgetA_v2
    - 是否應合併成統一模組
    - 是否有明顯尚未遷移的 legacy 組件（特別是有 size-based UI variant）

5. UI & 語言一致性
    - 所有畫面內容皆使用英文（提示、按鈕、表格 header 等
    - 註解可使用中文
    - 是否支援未來 i18n 多語言擴展

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

10. SaaS 架構評估
    - 系統是否具備可擴展性、模組化、可重用性
    - 資料層與服務層分離
    - 多租戶結構設計是否妥善（如 tenant_id、schema 隔離、RLS）

11. Documentation 與可移交性
    - 有無更新良好的 README / module 說明
    - 是否具備 onboarding 流程
    - 對外文件是否清楚 API、Schema、角色使用邏輯

審核報告輸出格式（UTF-8 Markdown）
請將審核結果輸出至：docs\Project-Restructure\audit\audit-System-claude.md
內容格式建議：docs\Project-Restructure\audit\audit-task.md
