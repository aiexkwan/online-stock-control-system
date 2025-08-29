---
allowed-tools: Bash(date:*), Bash(mkdir:*), Task, Write
description: 根據最新的系統狀況，更新 docs/TechStack/ 中的技術棧文檔
---

# 系統技術棧更新指令

掃描當前系統狀態，透過並行調用所有相關的資料收集模組，更新 `docs/TechStack/` 目錄下對應的技術棧文檔，以確保資訊的即時性與準確性。

## 資料收集模組

### 核心技術棧掃描模組

- [code-reviewer](../agents/code-reviewer.md)：掃描 package.json、tsconfig.json、配置文件版本
- [frontend-developer](../agents/frontend-developer.md)：掃描 React、Next.js、TypeScript 實作狀態與配置
- [backend-architect](../agents/backend-architect.md)：掃描 API 架構和中間件配置
- [data-architect](../agents/data-architect.md)：掃描 Supabase、GraphQL 配置

### 系統架構掃描模組

- [security-auditor](../agents/security-auditor.md)：檢查安全配置和 RLS 策略

### 工具鏈掃描模組

- [test-automator](../agents/test-automator.md)：掃描 Playwright、Vitest、Jest 配置
- [ui-ux-designer](../agents/ui-ux-designer.md)：掃描設計系統和 Tailwind 配置
- [dx-optimizer](../agents/dx-optimizer.md)：掃描開發工具和工作流程配置
- [ai-engineer](../agents/ai-engineer.md)：掃描 AI SDK 和 LLM 整合狀態

### 文檔整合模組

- [docs-architect](../agents/docs-architect.md)：整合所有掃描結果並更新 `docs/TechStack/` 相關文檔

## 🚨 更新執行規則

### 必須遵循

1.  **文檔即模板 (Doc as Template)**: 每個代理在執行掃描前，**必須**先讀取其負責的 `TechStack` 文檔。該文檔的現有結構即為唯一的更新模板。
2.  **事實導向**：只記錄實際的系統狀態，不提供意見或建議。
3.  **版本精確**：所有技術版本號必須精確到小數點。
4.  **配置真實**：基於實際檔案內容，不推測或假設。
5.  **結構不變**：嚴禁新增或刪除 `TechStack` 文檔中的任何章節，只可更新現有章節的內容。

## 執行指令

0. 完整閱讀 @CLAUDE.md [系統規範](../../CLAUDE.local.md)及文檔中的連結文案，以獲取全局設定及現時系統資訊
1. 執行 `date +"%Y-%m-%d_%H-%M-%S"` 取得時間戳。
2. 建立掃描記錄目錄：`docs/System-Updates/<timestamp>/`。
3. **並行啟動各負責代理** (根據下方矩陣)。每個代理執行以下步驟：
   a. **讀取目標文檔**: 讀取自己負責的 `docs/TechStack/` 文檔，分析其現有結構和需要更新的數據點（例如版本號、文件計數等）。
   b. **執行掃描**: 根據文檔結構的指引，掃描代碼庫以獲取最新的數據。
   c. **生成更新報告**: 將掃描結果寫入 `docs/System-Updates/<timestamp>/.../` 對應的驗證文件中。
4. **驗證掃描結果**: `@progress-auditor` 驗證所有代理提交的報告的準確性。
5. **整合更新**: `@docs-architect` 讀取所有驗證後的報告，並將更新應用到對應的 `docs/TechStack/` 文檔中，同時更新 "最後更新日期"。
6. **任務總結**: `@context-manager` 執行任務摘要。
7. **文檔審核**：[文檔規範員](../agents/documentation-normalizer.md)對所生成文檔作最終審核

## 更新範圍矩陣

| 掃描重點           | 更新檔案            | 負責代理 (Responsible Agent)      |
| ------------------ | ------------------- | --------------------------------- |
| 前端依賴、框架配置 | `FrontEnd.md`       | `@frontend-developer`             |
| 後端框架、API      | `BackEnd.md`        | `@backend-architect`              |
| 資料庫配置         | `DataBase.md`       | `@data-architect`                 |
| 測試工具版本       | `Testing.md`        | `@test-automator`                 |
| 開發工具版本       | `DevTools.md`       | `@dx-optimizer`, `@code-reviewer` |
| 安全相關配置       | `Secutiry.md`       | `@security-auditor`               |
| AI SDK 整合狀態    | `AI-Integration.md` | `@ai-engineer`                    |
| UI/UX 組件與配置   | `UI-UX.md`          | `@ui-ux-designer`                 |

## 掃描記錄位置

```
docs/System-Updates/
└── 2025-01-08_14-30-45/          # 時間戳
    ├── tech-stack-verification/
    │   ├── code-reviewer.md
    │   ├── frontend-developer.md
    │   ├── backend-architect.md
    │   └── data-architect.md
    ├── toolchain-verification/
    │   ├── test-automator.md
    │   ├── ui-ux-designer.md
    │   ├── dx-optimizer.md
    │   └── ai-engineer.md
    └── docs-techstack-updates.md
```

## 更新完成報告

當所有模組完成掃描並更新 `docs/TechStack/` 後，提供：

- **已更新檔案清單**：具體的檔案和變更內容摘要
- **版本變更摘要**：依賴版本升級、配置變更記錄
- **配置差異**：與上次更新的主要差異
- **驗證狀態**：所有資訊經過驗證確認

---

**記住**：此指令專注於**準確記錄當前系統的技術棧狀態**。目標是確保 `docs/TechStack/` 目錄下的文檔完全反映實際的專案配置和技術狀態。
