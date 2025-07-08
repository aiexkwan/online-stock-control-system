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

## ⚙️ SaaS 架構檢查

- [ ] 資料層/邏輯層/UI 層是否分離
- [ ] 是否支援多租戶 / 可擴展架構
- [ ] 是否具備良好模組劃分與共用設計

---

## 📚 文件與交接性

- [ ] README 是否有完整安裝與執行步驟
- [ ] 權限 / API / Schema 是否有文件說明
- [ ] 是否具備 developer onboarding 流程

---

## 🧠 優化建議整理（Output）

- [ ] 將審核結果彙整至 `audit-System.md`
- [ ] 每項問題提出具體優化或重構建議
- [ ] 產出 Task List 並移交執行