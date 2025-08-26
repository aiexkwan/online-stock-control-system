---
allowed-tools: Bash(date:*), Bash(mkdir:*), Task, Write
argument-hint: [scope]
description: 根據最新的系統狀況，更新 [系統配置及規則](../../CLAUDE.local.md) 配置文件
---

# 系統配置更新指令

掃描當前系統狀態，透過並行調用所有相關的資料收集模組，更新 [系統配置及規則](../../CLAUDE.local.md) 配置文件，以確保資訊的即時性與準確性。

## 變數

- **SCOPE**: $ARGUMENTS[0] 或預設為 "full-scan"
  - 更新範圍 (例如：tech-stack、architecture、dependencies、api-docs、full-scan)
  - 使用者：所有資料收集模組

## 上下文記憶系統

- 任務開始：執行[尋找相關對話紀錄](scripts/hooks/find_relevant_context_hook.py)
- 任務完畢、代理執行完成：執行[保存對話紀錄](scripts/hooks/context_summary_hook.py)

## 資料收集模組

### 核心技術棧掃描模組

- [code-reviewer](../agents/code-reviewer.md)：掃描 package.json、tsconfig.json、配置文件版本
- [frontend-developer](../agents/frontend-developer.md)：掃描 React、Next.js、TypeScript 實作狀態與配置
- [backend-architect](../agents/backend-architect.md)：掃描 API 架構和中間件配置
- [data-architect](../agents/data-architect.md)：掃描 Supabase、Prisma、GraphQL 配置

### 系統架構掃描模組

- [architect-review](../agents/architect-review.md)：進行架構視覺化並檢查與代碼庫的一致性
- [deployment-engineer](../agents/deployment-engineer.md)：掃描 Vercel 部署和環境配置
- [security-auditor](../agents/security-auditor.md)：檢查安全配置和 RLS 策略
- [performance-engineer](../agents/performance-engineer.md)：掃描效能相關配置

### 工具鏈掃描模組

- [test-automator](../agents/test-automator.md)：掃描 Playwright、Vitest、Jest 配置
- [ui-ux-designer](../agents/ui-ux-designer.md)：掃描設計系統和 Tailwind 配置
- [dx-optimizer](../agents/dx-optimizer.md)：掃描開發工具和工作流程配置
- [ai-engineer](../agents/ai-engineer.md)：掃描 AI SDK 和 LLM 整合狀態

### 文檔整合模組

- [api-documenter](../agents/api-documenter.md)：檢查 API 文檔和 GraphQL 代碼生成狀態
- [docs-architect](../agents/docs-architect.md)：整合所有掃描結果並更新 CLAUDE.local.md

## 🚨 更新執行規則

### 必須遵循

1. **事實導向**：只記錄實際的系統狀態，不提供意見或建議
2. **版本精確**：所有技術版本號必須精確到小數點
3. **配置真實**：基於實際檔案內容，不推測或假設
4. **架構反映**：確保架構圖反映實際代碼結構
5. **完整性要求**：完整列出系統當前最新狀況

## 執行指令

0. 讀取[系統配置及規則](../../CLAUDE.local.md)
1. 執行 `date +"%Y-%m-%d_%H-%M-%S"` 取得時間戳
2. 先建立掃描記錄目錄：`docs/System-Updates/<timestamp>/`
3. **讀取當前 [系統配置及規則](../../CLAUDE.local.md) 作為基線**
4. 並行調用核心技術棧掃描、系統架構掃描及工具鏈掃描三個模組
5. **每個模組的agent完成掄掃後，必需立即調用 @progress-auditor 驗證代理所收集的資訊準確性**
   - 驗證版本號正確、配置資訊真實：驗證記錄寫入 docs/System-Updates/.../tech-stack-verification/
   - 驗證架構圖反映實際結構、配置完整性：驗證記錄寫入 docs/System-Updates/.../architecture-verification/
   - 驗證工具版本、配置設定、整合狀態：驗證記錄寫入 docs/System-Updates/.../toolchain-verification/
6. **調用文檔整合模組**
   - [api-documenter](../agents/api-documenter.md)：檢查 API 文檔狀態
   - [docs-architect](../agents/docs-architect.md)：更新 [系統配置及規則](../../CLAUDE.local.md) 相關章節
7. [context-manager](../agents/context-manager.md)：執行[任務摘要](context_summary.md)指令

## 更新範圍矩陣

| 更新範圍         | 掃描重點                | 更新章節                                        |
| ---------------- | ----------------------- | ----------------------------------------------- |
| **tech-stack**   | 依賴版本、框架配置      | ## 核心框架、## 後端架構、## 測試工具           |
| **architecture** | 系統架構、部署配置      | ## 系統及資料庫架構圖、## 部署平台、## 安全配置 |
| **dependencies** | package.json、yarn.lock | ## 核心框架版本、## 開發工具版本                |
| **api-docs**     | GraphQL、REST API       | ## API 架構、## GraphQL 設計                    |
| **full-scan**    | 所有上述項目            | CLAUDE.md 完整更新                              |

## 輸出格式

### [系統配置及規則](../../CLAUDE.local.md) 更新範疇

```
# 1. 總覽 (Overview)
- **最後更新日期**: YYYY-MM-DD HH:MM:SS
- **系統版本號**: (根據 package.json 或 git tag)
- **整體架構圖**: (Mermaid: 包含前端、後端、資料庫、外部服務的整體流程)

# 2. 技術棧 (Technology Stack)
- **前端 (Frontend)**
  - **框架**: Next.js (版本), React (版本)
  - **語言**: TypeScript (版本)
  - **UI**: Tailwind CSS (版本), shadcn/ui (版本), Headless UI (版本)
  - **狀態管理**: Zustand / React Context (及相關庫版本)
  - **資料請求**: Apollo Client / SWR (版本)
- **後端 (Backend)**
  - **運行環境**: Node.js (版本)
  - **框架**: Next.js API Routes
  - **資料庫 ORM**: Prisma (版本)
  - **API**: GraphQL Yoga / Apollo Server (版本)
- **資料庫 (Database)**
  - **供應商**: Supabase (PostgreSQL)
  - **Schema 定義**: `prisma/schema.prisma` 的關鍵模型關係摘要
- **測試 (Testing)**
  - **E2E 測試**: Playwright (版本)
  - **單元/整合測試**: Vitest (版本), React Testing Library (版本)
- **開發工具 (Dev Tools)**
  - **包管理器**: npm / yarn / pnpm (版本)
  - **代碼檢查與格式化**: ESLint (版本), Prettier (版本)

# 3. 系統架構 (System Architecture)
- **前端架構**
  - **目錄結構**: `app/` 目錄核心結構概述
  - **路由機制**: Next.js App Router 的配置與約定
  - **組件設計**: 原子設計或其他組件化策略
  - **核心通用組件**: `components/` 及 `lib/` 下的核心模組
- **後端架構**
  - **API 類型**: GraphQL (主要), REST (輔助)
  - **GraphQL Schema**: `graphql/` 目錄下的核心類型 (Types), 查詢 (Queries), 變更 (Mutations)
  - **無伺服器函數**: `app/api/` 下的端點列表與職責
  - **中間件**: `middleware.ts` 的核心邏輯
- **數據庫架構**
  - **資料庫關係圖**: (Mermaid: 描繪核心資料表之間的關係)
  - **索引策略**: `schema.prisma` 中定義的關鍵索引 (`@index`, `@@index`)
  - **行級安全策略 (RLS)**: Supabase 中已啟用的主要 RLS 策略摘要

# 4. 部署與維運 (Deployment & DevOps)
- **部署平台**: Vercel
- **環境變數**: `.env.local`, `.env.production` 中定義的變數列表 (僅列出變數名)
- **構建流程**: `package.json` 中的 `build` 相關指令
- **CI/CD**: GitHub Actions / Vercel CI 的工作流程摘要

# 5. 安全性 (Security)
- **認證機制**: Supabase Auth (JWT)
- **授權機制**: RLS, 中間件權限檢查
- **CORS 配置**: `next.config.js` 中的相關設定
- **敏感資訊管理**: Vercel 環境變數管理, `LoggerSanitizer` 使用情況

# 6. AI 整合 (AI Integration)
- **使用模型**: OpenAI GPT-4, etc.
- **SDK**: `openai` npm 套件版本
- **提示詞管理**: `lib/prompts/` 目錄下的提示詞模板結構

# 7. UI/UX 與設計系統
- **組件庫**: `components/ui/` 的使用規範
- **樣式配置**: `tailwind.config.js` 的核心主題 (theme) 配置
- **字體與圖標**: `public/fonts` 及圖標庫的使用

```

### 掃描記錄位置

```
docs/System-Updates/
└── 2025-01-08_14-30-45/          # 時間戳
    ├── tech-stack-verification/
    │   ├── code-reviewer.md
    │   ├── frontend-developer.md
    │   ├── backend-architect.md
    │   └── data-architect.md
    ├── architecture-verification/
    │   ├── architect-reviewer.md
    │   ├── deployment-engineer.md
    │   ├── security-auditor.md
    │   └── performance-engineer.md
    ├── toolchain-verification/
    │   ├── test-automator.md
    │   ├── ui-ux-designer.md
    │   ├── dx-optimizer.md
    │   └── ai-engineer.md
    └── claude-md-updates.md
```

## 更新完成報告

當所有模組完成掃描並更新 [系統配置及規則](../../CLAUDE.local.md) 後，提供：

- **已更新章節清單**：具體的 [系統配置及規則](../../CLAUDE.local.md) 章節和變更內容
- **版本變更摘要**：依賴版本升級、配置變更記錄
- **架構變更**：新增/移除的系統組件
- **配置差異**：與上次更新的主要差異
- **驗證狀態**：所有資訊經過三重驗證確認

---

**記住**：此指令專注於**準確記錄當前系統狀態**。目標是確保 [系統配置及規則](../../CLAUDE.local.md) 完全反映實際的專案配置和技術狀態，而非進行系統改進、建議或評分。
