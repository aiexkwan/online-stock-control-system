---
allowed-tools: Bash(date:*), Bash(mkdir:*), Task, Write
argument-hint: [target_path]
description: Execute comprehensive file analysis and safe cleanup through multi-agent workflow
---

# 系統檔案清理執行指令

深度思考並執行全面的檔案分析與安全清理，通過並行調用所有相關分析代理，直接清理冗餘檔案和優化專案結構。

## 上下文記憶系統

- 任務開始：執行[尋找相關對話紀錄](scripts/hooks/find_relevant_context_hook.py)
- 任務完畢、代理執行完成：執行[保存對話紀錄](scripts/hooks/context_summary_hook.py)

## 變數

- **TARGET_PATH**: $ARGUMENTS[0] 或必需參數
  - 要分析的檔案、資料夾或模式 (例如：src/legacy/_、_.bak、**tests**/old-\*)
  - 支援 glob patterns
  - 使用者：所有分析代理

## 執行代理群組

### 依賴分析代理群組

- [frontend-developer](../agents/frontend-developer.md)：追蹤 import/export、React 組件依賴
- [backend-architect](../agents/backend-architect.md)：檢查 API routes、middleware 依賴
- [data-architect](../agents/data-architect.md)：驗證 Supabase schema、Prisma 模型依賴
- [api-documenter](../agents/api-documenter.md)：檢查 GraphQL 查詢和 mutations 依賴
- **→ 執行完畢後立即調用 @progress-auditor 審查依賴分析結果**

### 影響評估代理群組

- [code-reviewer](../agents/code-reviewer.md)：識別技術債務、重複代碼模式
- [deployment-engineer](../agents/deployment-engineer.md)：檢查 git 歷史、部署相關檔案
- [performance-engineer](../agents/performance-engineer.md)：分析 bundle 大小、代碼分割影響
- [security-auditor](../agents/security-auditor.md)：識別安全功能依賴、認證授權影響
- **→ 執行完畢後立即調用 @progress-auditor 審查影響評估結果**

### 架構驗證代理群組

- [architect-reviewer](../agents/architect-reviewer.md)：評估整體架構影響、設計模式一致性
- [test-automator](../agents/test-automator.md)：檢查測試檔案依賴、覆蓋率影響
- [error-detective](../agents/error-detective.md)：搜尋錯誤日誌中的檔案引用
- **→ 執行完畢後立即調用 @progress-auditor 審查架構驗證結果**

### 清理執行代理群組

- [legacy-modernizer](../agents/legacy-modernizer.md)：執行實際檔案刪除/移動/重構操作
- [docs-architect](../agents/docs-architect.md)：更新清理記錄和歷史文檔
- **→ 執行完畢後立即調用 @progress-auditor 驗證清理完成狀態**

## 🚨 清理執行規則

### 安全清理原則

1. **預覽優先**：所有操作均為預覽模式
2. **用戶確認**：明確用戶確認前絕不執行刪除
3. **備份建議**：刪除前建議創建備份
4. **分級清理**：按影響等級分批處理
5. **技術安全**：
   - 保護 Next.js 核心配置
   - 保護 TypeScript 配置檔案
   - 保護 Supabase schema 和 migrations
   - 保護環境變數檔案
6. **測試驗證**：清理後建議執行全面測試

## 🎯 清理對象識別標準

在分析階段，代理應根據以下一個或多個標準，將檔案或組件標記為潛在的清理對象：

- **零引用 (Zero-Reference)**: 檔案在專案中沒有任何有效的 import 或引用。
- **命名約定 (Naming Convention)**: 檔案或目錄名稱包含 `_legacy`, `_bak`, `_old`, `v1`, `archive` 等關鍵字。
- **過時技術 (Outdated Technology)**:
  - 使用了已被官方棄用的函式庫或 API。
  - 使用了舊的寫法，例如 React Class Components 而非 Hooks。
- **長期未變更 (Long-Term Inactivity)**:
  - 根據 Git 歷史，檔案在過去 18-24 個月內無任何修改。
  - 相關功能的主要貢獻者已非活躍開發者。
- **關聯的功能已下線 (Disabled Feature Association)**:
  - 代碼僅被一個已經下線或永久停用的功能標記 (Feature Flag) 所使用。
- **低測試覆蓋率 (Low Test Coverage)**:
  - 關鍵邏輯缺乏單元測試或整合測試，暗示其重要性可能較低或已被遺忘。

## 上下文記憶系統

- 每次用戶對話開始：執行[尋找相關對話紀錄](scripts/hooks/find_relevant_context_hook.py)
- 每次任務執行完畢、代理執行完成：執行[保存對話紀錄](scripts/hooks/context_summary_hook.py)

## 執行指令

0. 讀取[通用規則](../../CLAUDE.local.md)
1. 建立分析記錄目錄：`docs/System-Cleanup/`
2. **解析目標路徑和選項參數**

### 階段一：依賴分析執行

4. **並行調用依賴分析代理群組**
   - [frontend-developer](../agents/frontend-developer.md)
   - [backend-architect](../agents/backend-architect.md)
   - [data-architect](../agents/data-architect.md)
   - [api-documenter](../agents/api-documenter.md)
   - **掃描所有 import/export 關係和依賴鏈**
5. **立即調用 @progress-auditor 審查依賴分析結果**
   - 驗證依賴關係完整性、引用計數準確性
   - **分析記錄寫入 docs/System-Cleanup/.../dependency-analysis/**
   - 未通過 ≥95% 準確性則重新分析

### 階段二：影響評估執行

6. **並行調用影響評估代理群組**
   - [code-reviewer](../agents/code-reviewer.md)
   - [deployment-engineer](../agents/deployment-engineer.md)
   - [performance-engineer](../agents/performance-engineer.md)
   - [security-auditor](../agents/security-auditor.md)
   - **評估檔案刪除對系統各層面的影響**
7. **立即調用 @progress-auditor 審查影響評估結果**
   - 驗證影響評估完整性、風險等級準確性
   - **分析記錄寫入 docs/System-Cleanup/.../impact-assessment/**
   - 未通過 ≥90% 標準則重新評估

### 階段三：架構驗證執行

8. **並行調用架構驗證代理群組**
   - [architect-reviewer](../agents/architect-reviewer.md)
   - [test-automator](../agents/test-automator.md)
   - [error-detective](../agents/error-detective.md)
   - **驗證整體架構完整性和測試覆蓋影響**
9. **立即調用 @progress-auditor 審查架構驗證結果**
   - 驗證架構一致性、測試完整性
   - **分析記錄寫入 docs/System-Cleanup/.../architecture-verification/**
   - 未通過 ≥85% 標準則重新驗證

### 階段四：清理執行 (必需用戶確認)

10. **用戶確認後調用清理執行代理群組**
    - [legacy-modernizer](../agents/legacy-modernizer.md)：執行實際檔案刪除/移動/重構操作
    - [docs-architect](../agents/docs-architect.md)：更新記錄和文檔
    - **實際檔案刪除/移動操作**

11. **記錄任務摘要**
    - [context-manager](../agents/context-manager.md)：執行[任務摘要](context_summary.md)指令

## 分階段影響等級矩陣

| 影響等級      | 特徵描述                       | 處理策略    | 確認要求     |
| ------------- | ------------------------------ | ----------- | ------------ |
| **🔴 高影響** | Next.js 核心配置、5+ 組件引用  | ❌ 禁止刪除 | 需架構師確認 |
| **🟠 中影響** | 2-4 組件使用、部分 legacy 代碼 | ⚠️ 謹慎審查 | 需詳細評估   |
| **🟢 低影響** | 零引用、備份檔案、空資料夾     | ✅ 安全刪除 | 批量確認即可 |

## 分階段清理標準

### 依賴分析階段標準

```yaml
依賴完整性: ≥95% (所有引用關係完整追蹤)
引用計數準確性: ≥95% (import/export 計數正確)
動態引用檢測: ≥85% (lazy loading、動態 import)
```

### 影響評估階段標準

```yaml
風險評估完整性: ≥90% (所有影響層面覆蓋)
等級分類準確性: ≥90% (高/中/低影響正確分類)
技術棧特殊性: ≥85% (Next.js、Supabase 特殊考量)
```

### 架構驗證階段標準

```yaml
架構一致性: ≥85% (整體設計模式保持)
測試覆蓋維護: ≥85% (測試功能不受影響)
錯誤處理完整: ≥90% (無遺留錯誤引用)
```

## 輸出格式

### 分析記錄位置

```
docs/System-Cleanup/
└── <target>/
      ├── dependency-analysis/
      │   ├── frontend-developer.md
      │   ├── backend-architect.md
      │   ├── data-architect.md
      │   └── progress-audit-dependency.md
      ├── impact-assessment/
      │   ├── code-reviewer.md
      │   ├── deployment-engineer.md
      │   ├── performance-engineer.md
      │   ├── security-auditor.md
      │   └── progress-audit-impact.md
      ├── architecture-verification/
      │   ├── architect-reviewer.md
      │   ├── test-automator.md
      │   ├── error-detective.md
      │   └── progress-audit-architecture.md
      └── cleanup-execution/
            ├── legacy-modernizer.md      # 實際清理操作記錄
            ├── docs-architect.md         # 文檔更新記錄
            └── cleanup-report.md         # 最終清理報告

```

### 實際清理操作

```
專案根目錄/
├── backups/                  # 清理前備份檔案
├── src/                      # 清理後的源代碼
├── docs/System-Cleanup/      # 清理記錄和分析
```

## 受保護檔案清單

```yaml
永久保護:
  - package.json, package-lock.json
  - tsconfig.json, next.config.js
  - .env.*, .env.example
  - app/layout.tsx, middleware.ts
  - supabase/, prisma/
  - src/lib/supabase/*
  - src/lib/auth/*

條件保護:
  - node_modules/ (除非明確要求)
  - .next/, .vercel/ (構建產物)
  - public/ (靜態資源)
```

## 清理完成報告

當所有分析階段完成並由 [legacy-modernizer](../agents/legacy-modernizer.md) 執行清理後，提供：

- **已清理檔案清單**：具體的檔案路徑和刪除原因
- **空間節省統計**：釋放的磁碟空間和檔案數量
- **依賴關係變更**：受影響的 import/export 關係
- **架構完整性確認**：系統架構保持完整
- **測試覆蓋狀態**：測試功能維持正常
- **建議後續行動**：進一步優化建議

---

**記住**：此指令專注於**安全且高效的檔案清理**。目標是通過 [legacy-modernizer](../agents/legacy-modernizer.md) 等代理在保證系統功能完整的前提下，清理冗餘檔案並優化專案結構。疑慮時優先保留檔案，確保系統穩定性。
