---
description: 
globs: 
alwaysApply: true
---
# Supabase + Next.js WMS 專案 AI Coding 規則（繁體中文版）

## 記憶系統設定
本項目使用 mem0 作為對話記憶數據庫，儲存所有與 Claude 的對話記錄。

### 記憶功能
- 自動儲存每次對話到 mem0
- 支援搜尋歷史對話內容
- 記憶與用戶 ID 關聯（預設：kwanchuncheong）
- API Key 已設定在 conversation_memory.js

### 相關檔案
- `.claude/conversation_memory.js` - 記憶系統核心功能
- `mem0_client.js` - mem0 客戶端範例

## 專案背景

本系統為現代化倉庫管理系統（WMS），以 Web 應用（Next.js App Router + React）結合 Supabase（PostgreSQL）、Tailwind CSS、Shadcn UI / Radix UI，並於 GitHub + Vercel 部署。主要功能包括：

- 庫存追蹤（支援 QR Code）
- 棧板移動
- 損毀貨物記錄
- 收貨登記（GRN 記錄）
- 報表產生（CSV、XLS、PDF）
- 倉庫轉移管理
- 掃描器、手機、平板多設備支援
- 管理員dashboard及database管理
- 自然語言資料查詢（Ask Me Anything）

---

## 強制規則

1. **Supabase 資料表與欄位**
   - 優先使用mcp工具查看supabase資料及建立
   - 如mcp工具失敗，查看 [databaseStructure.md](mdc:docs/databaseStructure.md) 以獲取資料
   - 不可以自行假設資料表、欄位、型別名稱
   - 如有疑問，必須用 MCP 工具查核
   - 如必須新增資料表或欄位，必須先與用戶確認

2. **回答必須使用廣東話, 代碼註解使用中文, 其餘一律使用英語**
   - 用戶端主要為英語用戶, 所有 UI 或 錯誤解提示必需以英文表示
   - 代碼註解, 文檔 一律用中文書寫

3. **只執行明確指示之任務**
   - 禁止產生未被要求之功能或推測邏輯

4. **Web UI 必須兼容所有主流瀏覽器及移動設備**
   - Chrome、Safari、Edge、Firefox（桌面及手機）

5. **不可隨意建立新文檔, README.md**
   - 只可建立有規定的文檔（見下文文檔分類）

6. **保持Clean Code 原則及測試檔案處理方法**
   - 已確定的廢案, 臨時創建 test／測試 用檔案（例如：unit test、debug script、check-**.js）
   - 必須於用完或測試結束後及時刪除
   - 嚴禁殘留於正式 repo、主分支或上 production
   - 禁止將生產資料或敏感 key 寫入 test 檔
   - 可能會經常調用的功能, 一律主動建議用戶作成獨立元件/components, 避免大量重覆性代碼

---

## 專案結構與命名

- 資料夾採 kebab-case（例：`components/stock-summary`）
- 每個模組包含：
  - Main component（命名匯出）
  - Subcomponents
  - Helpers
  - Constants
  - Types（只用 interface）

## 文檔歸類及說明(一律放進 /docs 內保存)

### 主要功能說明文檔

- `fn_admin_panel.md` ：admin_panel 頁面功能說明
- `fn_print_GRN_Label.md` ：print_GRN_Label 頁面功能說明
- `fn_print_QC_Label.md` ：print_QC_Label 頁面功能說明
- `fn_stock_transfer.md` ：stock_transfer 頁面功能說明
- `fn_ask_me_anything.md` ：ask-me-anything 卡片功能說明

### 改進記錄文檔

- `history_admin_panel.md` ：admin_panel 頁面改進記錄
- `history_print_GRN_Label.md` ：print_GRN_Label 頁面改進記錄
- `history_print_QC_Label.md` ：print_QC_Label 頁面改進記錄
- `history_stock_transfer.md` ：stock_transfer 頁面改進記錄
- `history_ask_me_anything.md` ：ask-me-anything 卡片改進記錄
- `todoList.md` ：專案待改進紀錄
- `planning.md` ：專案現正進行的改進紀錄, 全數完成後需清除內容,循環再用

### SQL 函數記錄

- `sql_library.md` ：所有 SQL 函數統一記錄與說明，方便後續查詢和維護

### RPC 統一記錄

- `rpc_library.md` ：所有 RPC 函數統一記錄與說明，方便後續查詢和維護

---

## TypeScript 樣式規範

- 全部檔案用 TypeScript
- 優先用 interface，不用 enum（用 map 取代）
- 變數需具描述性（如 isLoading, palletInfo）
- 只用函數式元件，不用 class

---

## React / Next.js 規則

- 只用 App Router（不用 Page Router）
- 優先用 Server Components / Server Actions
- 非必要禁止 `use client`
- Client component 必須用 `<Suspense fallback={...} />` 包裹
- URL 狀態管理用 @`nuqs`

---

## UI 與樣式規範

- 全面用 Shadcn UI 組件
- Tailwind CSS（Mobile-first 響應式）
- 行為元件（dropdown, dialog）用 Radix UI
- 表單驗證用 zod
- 動畫用 tailwindcss-animate 或 framer-motion

---

## 效能優化建議

- 減少 useEffect、useState、use client 用量
- 非關鍵元件用 dynamic() lazy import
- 圖片只用 WebP，設寬高、lazy load
- 資料量大必須用 Server Component

---

## 自然語言查詢 / AI 查詢規則

- Ask Me Anything（AMA）查詢系統接 GPT-4o
- SQL 僅允許 SELECT，RPC `execute_query` 執行
- 查詢記錄於 query_record（內容：查詢、結果、user、token 數、SQL）
- 權限控管依 data_id/email、資料表權限、操作日誌

---

## 現有業務模組總覽

- **管理面板**：系統監控、權限、報表、檔案上傳、作廢、查詢等
- **GRN/QC 標籤列印**：自動生成/合併/上傳 PDF，資料來源 record_grn/record_palletinfo
- **庫存轉移**：一鍵搜尋/自動判斷/即時操作
- **所有流程、查詢、列印、權限管理皆嚴格依現有資料表，不可更改結構**

---

## 開發部署注意

- 正確設定 `.env`（專案預設值，通常已存在且無需重複創建）
  - `.env` 用於共用、不敏感的設定（如 NEXT_PUBLIC_SUPABASE_URL），一律保證已存在，無需嘗試自動或重複建立
- **敏感或本機開發專用設定請寫於 `.env.local`**
  - `.env.local` 只用作你本機測試，永遠不會 commit 或同步到 Git
  - 例如：`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **嚴禁將 Supabase Anon Key、Service Role Key 或任何敏感 KEY/Token 硬編碼於代碼內**
  - 所有 API KEY 必須只可經 `.env` 或 `.env.local` 引用，**任何形式（如直接寫在程式、config、repo）都不允許**
  - 程式只可用 `process.env.XXX` 調用
- **線上正式環境請直接在 Vercel（或 Supabase）Dashboard 設定環境變數**
  - Vercel 及所有遠端部署，不會讀取你本機的 `.env.local`
  - 必須在 Dashboard 內手動補齊所有必要 KEY
- **Cursor、CI/CD、雲端開發空間等協作工具預設查詢唔到 `.env.local`，只會依賴 repo 內 `.env` 或 dashboard 上環境變數設定**
- 切勿將敏感 KEY commit 上 repo

## .env／.env.local 實際操作建議

- **`.env`：** 只需保證存在及正確設定，無需自動生成或覆蓋
- **`.env.local`：** 個人開發機本地編輯，不上傳
- **Vercel/Supabase dashboard：** 每次有新 KEY，必須手動同步
- **所有敏感 KEY 只可存在 `.env/.env.local`，嚴禁直接出現在任何 .ts, .js, .tsx, .json 或 config 代碼**

---

## 版本控制與 Git 操作規範

- **嚴禁在未經明確用戶或管理員指示下，自行 push 任何代碼到 GitHub 或其他遠端代碼倉庫**
  - 包括所有自動化腳本、AI 生成、plugin、extension 觸發的 git push 行為
  - 只可於用戶/專案負責人明確同意下，手動進行 push、merge、release 等操作
  - 任何自動 push 功能必須事前取得書面批准及安全審核
- 所有敏感變更、重大新功能或設定變動，須事前通報相關人員、確認無誤才可推送

---

## 最後提醒

> 本專案為企業級 WMS 系統，所有代碼、流程、UI、查詢等必須嚴格依本規則，不可自行臆測資料結構或新增欄位。所有 TypeScript 代碼需確保清晰、效能、跨瀏覽器兼容、模組化。