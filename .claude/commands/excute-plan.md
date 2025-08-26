---
argument-hint: [planning_doc_path] [phase] [support_doc] [comment]
description: Execute comprehensive development plan with strict adherence to documentation
---

# 計劃執行指令

深度思考並立即執行已制定的開發計劃，必需通過並行調用所有相關執行代理，直接產出代碼、配置和交付物。

## 上下文記憶系統

- 任務開始：執行[尋找相關對話紀錄](scripts/hooks/find_relevant_context_hook.py)
- 任務完畢、代理執行完成：執行[保存對話紀錄](scripts/hooks/context_summary_hook.py)

## 變數

- **PLANNING_DOC**: $ARGUMENTS[0] 或必需參數
  - 要執行的計劃文檔路徑 `$ARGUMENTS`
  - 使用者：所有執行代理
- **PHASE**: $ARGUMENTS[1] 或未指定時預設為 "phase-1"
  - 計劃文檔中要執行的具體階段
  - 使用者：階段特定代理
- **SUPPORT_DOC**: $ARGUMENTS[2] 或可選的支援文檔
  - 額外的技術參考文檔
- **Comments**: 額外的用戶comments，如留意事項等

## 🚨 執行規則

### 立即執行原則

1. **直接執行**：讀取計劃後立即開始代碼實作
2. **零規劃延遲**：不進行額外分析，直接按文檔執行
3. **實際交付物**：每個代理必須產出具體的檔案、代碼或配置
4. **技術標準遵循**：
   - TypeScript 嚴格模式代碼
   - Supabase 安全配置實作
   - Next.js 最佳實踐代碼
5. **90% 執行完成度**：實際功能必須達到可運行狀態

## 執行指令

0. 讀取[通用規則](../../CLAUDE.local.md)
1. 建立執行記錄目錄：`docs/Planning/<planning_doc>/<phase>/`
2. 讀取計劃文檔及`執行代理群組`，提取執行任務清單

## 執行代理群組

### 核心開發代理群組

- [frontend-developer](../agents/frontend-developer.md) (React、Next.js、TypeScript 代碼實作)
- [backend-architect](../agents/backend-architect.md) (API 端點、Supabase 整合實作)
- [data-architect](../agents/data-architect.md) (資料庫 schema、GraphQL 實作)
- [ui-ux-designer](../agents/ui-ux-designer.md) (組件設計和樣式實作)
- **→ 執行完畢後立即調用 [progress-auditor](../agents/progress-auditor.md) 審查核心開發交付物**

### 品質執行代理群組

- [test-automator](../agents/test-automator.md) (測試代碼撰寫和執行)
- [eslint-fixer](../agents/eslint-fixer.md) (代碼品質修復和優化)
- [security-auditor](../agents/security-auditor.md) (安全配置實作)
- [performance-engineer](../agents/performance-engineer.md) (效能優化實作)
- **→ 執行完畢後立即調用 [progress-auditor](../agents/progress-auditor.md) 審查品質標準**

### 部署執行代理群組

- [deployment-engineer](../agents/deployment-engineer.md) (部署配置和 CI/CD 實作)
- [legacy-modernizer](../agents/legacy-modernizer.md) (代碼現代化實作)
- **→ 執行完畢後立即調用 [progress-auditor](../agents/progress-auditor.md) 審查部署準備狀態**

### 階段一：核心開發執行

4. **並行調用核心開發代理群組**
   - [frontend-developer](../agents/frontend-developer.md), [backend-architect](../agents/backend-architect.md), [data-architect](../agents/data-architect.md), [ui-ux-designer](../agents/ui-ux-designer.md)
   - **直接在專案結構中建立/修改實際代碼檔案**
5. **立即調用 [progress-auditor](../agents/progress-auditor.md) 審查核心開發交付物**
   - 驗證代碼完整性、功能實作、TypeScript 合規性，及有否遵照用戶comment的留意事項
   - **審查記錄寫入 docs/Planning/.../core-development/**
   - 未通過 ≥80% 標準則重新執行核心開發代理

### 階段二：品質執行

6. **並行調用品質執行代理群組**
   - [test-automator](../agents/test-automator.md), [eslint-fixer](../agents/eslint-fixer.md), [security-auditor](../agents/security-auditor.md), [performance-engineer](../agents/performance-engineer.md)
   - **直接在專案結構中建立測試檔案、修改配置檔案**
7. **立即調用 [progress-auditor](../agents/progress-auditor.md) 審查品質標準**
   - 驗證測試覆蓋率、安全配置、效能指標，及有否遵照用戶comment的留意事項
   - **審查記錄寫入 docs/Planning/.../quality-execution/**
   - 未通過 ≥85% 標準則重新執行品質代理

### 階段三：部署執行

8. **並行調用部署執行代理群組**
   - [deployment-engineer](../agents/deployment-engineer.md), [legacy-modernizer](../agents/legacy-modernizer.md)
   - **直接修改專案根目錄配置檔案、清理冗餘檔案**
9. **立即調用 [progress-auditor](../agents/progress-auditor.md) 審查部署準備狀態**
   - 驗證部署配置、檔案清理、系統整合，及有否遵照用戶comment的留意事項
   - **審查記錄寫入 docs/Planning/.../deployment-execution/**
   - 未通過 ≥90% 標準則重新執行部署代理

### 階段四：最終整合

10. **生成完整執行報告寫入 docs/Planning/.../final-report.md**
11. [context-manager](../agents/context-manager.md)：執行[任務摘要](context_summary.md)指令

## 分階段執行與審查矩陣

| 執行階段     | 執行代理                                                              | 交付物類型                                     | 審查標準           |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- | ------------------ |
| **核心開發** | frontend-developer, backend-architect, data-architect, ui-ux-designer | React 組件、API routes、資料庫 schema、UI 樣式 | ≥80% 代碼完整性    |
| **↓ 審查**   | @progress-auditor                                                     | 驗證功能實作、TypeScript 合規、基礎安全        | 通過後進入品質階段 |
| **品質執行** | test-automator, eslint-fixer, security-auditor, performance-engineer  | 測試檔案、代碼優化、安全配置、效能調整         | ≥85% 品質標準      |
| **↓ 審查**   | @progress-auditor                                                     | 驗證測試覆蓋、安全合規、效能指標               | 通過後進入部署階段 |
| **部署執行** | deployment-engineer, legacy-modernizer                                | 部署腳本、重構代碼、檔案清理                   | ≥90% 部署準備      |
| **↓ 審查**   | @progress-auditor                                                     | 驗證部署配置、系統整合、最終清理               | 通過後生成最終報告 |

## 交付物要求

### 必須產出的實際檔案

```yaml
代碼檔案:
  - React 組件 (.tsx)
  - API 端點 (.ts)
  - 資料庫 schema (.sql)
  - 型別定義 (.ts)
  - 測試檔案 (.test.ts)

配置檔案:
  - 部署配置 (vercel.json, next.config.js)
  - 資料庫配置 (supabase configs)
  - 測試配置 (playwright.config.ts)

文檔檔案:
  - API 文檔 (.md)
  - 部署指南 (.md)
  - 使用說明 (.md)
```

## 分階段執行品質標準

### 核心開發階段標準

```yaml
代碼完整性: ≥80% (基礎功能可運行)
TypeScript 合規: ≥75% (主要組件無 any 類型)
功能實作: ≥80% (核心流程完成)
基礎安全: ≥70% (認證流程建立)
```

### 品質執行階段標準

```yaml
測試覆蓋: ≥85% (核心功能測試)
代碼品質: ≥90% (ESLint 規則通過)
安全配置: ≥90% (RLS、認證完整)
效能指標: ≥80% (載入時間可接受)
```

### 部署執行階段標準

```yaml
部署準備: ≥90% (配置檔案完整)
系統整合: ≥85% (所有組件整合)
檔案清理: ≥95% (無冗餘檔案)
最終驗證: ≥90% (整體可部署)
```

## 輸出格式

**重要**：代碼檔案放置在正常專案結構位置，執行記錄放在 docs/ 目錄。

### 實際代碼檔案位置

```
專案根目錄/
├── src/
│   ├── components/             # React 組件 (@frontend-developer, @ui-ux-designer)
│   ├── lib/                   # 工具函數 (@backend-architect)
│   ├── types/                 # TypeScript 類型 (@data-architect)
│   └── hooks/                 # 自定義 hooks (@frontend-developer)
├── app/
│   ├── api/                   # API 端點 (@backend-architect)
│   ├── (pages)/               # Next.js 頁面 (@frontend-developer)
│   └── globals.css            # 全域樣式 (@ui-ux-designer)
├── supabase/
│   ├── migrations/            # 資料庫遷移 (@data-architect)
│   ├── functions/             # Edge Functions (@backend-architect)
│   └── seed.sql              # 種子資料 (@data-architect)
├── __tests__/
│   ├── e2e/                  # E2E 測試 (@test-automator)
│   └── unit/                 # 單元測試 (@test-automator)
├── next.config.js            # Next.js 配置 (@deployment-engineer)
├── tailwind.config.js        # Tailwind 配置 (@ui-ux-designer)
├── vercel.json              # 部署配置 (@deployment-engineer)
└── package.json             # 依賴管理
```

### 執行記錄位置

```
docs/Planning/<planning_doc>/
    └── <phase>        # 時間戳
            ├── core-development/
            │   ├── frontend-developer.md      # 執行記錄
            │   ├── backend-architect.md       # 執行記錄
            │   ├── data-architect.md         # 執行記錄
            │   ├── ui-ux-designer.md         # 執行記錄
            │   └── progress-audit-core.md    # 核心開發審查記錄
            ├── quality-execution/
            │   ├── test-automator.md         # 執行記錄
            │   ├── eslint-fixer.md           # 執行記錄
            │   ├── security-auditor.md       # 執行記錄
            │   ├── performance-engineer.md   # 執行記錄
            │   └── progress-audit-quality.md # 品質執行審查記錄
            ├── deployment-execution/
            │   ├── deployment-engineer.md    # 執行記錄
            │   ├── legacy-modernizer.md      # 執行記錄
            │   └── progress-audit-deploy.md  # 部署執行審查記錄
            └── final-report.md              # 最終整合報告
```

## 分階段執行完成報告

### 核心開發階段報告

- **交付物狀態**：React 組件、API 端點、資料庫 schema 完成情況
- **[progress-auditor](../agents/progress-auditor.md) 審查結果**：代碼完整性 [X]%、功能實作 [X]%
- **通過/重做狀態**：✅ 通過進入品質階段 / ❌ 重新執行核心開發

### 品質執行階段報告

- **交付物狀態**：測試檔案、安全配置、效能優化完成情況
- **[progress-auditor](../agents/progress-auditor.md) 審查結果**：測試覆蓋 [X]%、安全合規 [X]%
- **通過/重做狀態**：✅ 通過進入部署階段 / ❌ 重新執行品質代理

### 部署執行階段報告

- **交付物狀態**：部署配置、系統清理、整合測試完成情況
- **[progress-auditor](../agents/progress-auditor.md) 審查結果**：部署準備 [X]%、系統整合 [X]%
- **通過/重做狀態**：✅ 通過生成最終報告 / ❌ 重新執行部署代理

### 最終整合報告

- **所有階段通過確認**：核心開發 ✅、品質執行 ✅、部署執行 ✅
- **實際代碼檔案位置**：
  - React 組件：`src/components/`
  - API 端點：`app/api/`
  - 資料庫：`supabase/migrations/`
  - 測試檔案：`__tests__/`
  - 配置檔案：專案根目錄
- **執行記錄位置**：`docs/Execution/<planning_doc>/<phase>/<timestamp>/`
- **代碼統計**：各階段新增/修改的實際檔案清單
- **功能完整性**：最終可運行的功能模組列表
- **部署狀態**：是否可直接部署到 Vercel
- **下一步行動**：立即可執行的後續步驟

---

**記住**：此指令專注於**立即執行和交付**。目標是在最短時間內產出可運行的代碼和配置，而非進行更多規劃討論。

**重要**：代碼檔案直接建立在正常專案結構位置，docs/ 目錄僅用於存放執行記錄和文檔。
