---
allowed-tools: Bash(date:*), Bash(mkdir:*), Task, Write
description: Automatically performs a full-project scan to proactively identify and report potential technical debt.
---

# 技術債務掃描指令

掃描整個專案，通過並行調用所有相關分析代理，識別潛在的技術債務、冗餘代碼和結構性問題，並生成綜合報告。

## 上下文記憶系統

- 任務開始：執行[尋找相關對話紀錄](scripts/hooks/find_relevant_context_hook.py)
- 任務完畢、代理執行完成：執行[保存對話紀錄](scripts/hooks/context_summary_hook.py)

## 變數

- **TARGET_PATH**: `.` (固定為專案根目錄，代表完整掃描)
- **REPORT_TIMESTAMP**: `date +"%Y-%m-%d"`

## 分析代理群組

### 依賴分析代理群組

- [frontend-developer](../agents/frontend-developer.md)：追蹤 import/export、React 組件依賴
- [backend-architect](../agents/backend-architect.md)：檢查 API routes、middleware 依賴
- [data-architect](../agents/data-architect.md)：驗證 Supabase schema、Prisma 模型依賴
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

### 報告生成代理

- [docs-architect](../agents/docs-architect.md)：整合所有分析發現，生成最終的技術債務報告
- **→ 執行完畢後立即調用 @progress-auditor 驗證報告完整性**

## 🚨 掃描分析規則

### 分析原則

1.  **全面掃描**：分析範圍涵蓋專案所有非 Git-ignore 的原始碼檔案。
2.  **客觀標準**：嚴格依據下述「技術債務識別標準」進行判斷。
3.  **清理任務**：只需集中執行「技術債務識別標準」，無需執行多餘額外分析。
4.  **唯讀操作**：掃描過程不對任何檔案進行修改或刪除。
5.  **分級報告**：根據影響等級對發現的問題進行分類。
6.  **保護核心**：分析時排除 `受保護檔案清單` 中的檔案，避免誤報。

## 🎯 技術債務識別標準

在分析階段，代理應根據以下一個或多個標準，將檔案或組件標記為潛在的技術債務：

- **零引用 (Zero-Reference)**: 檔案在專案中沒有任何有效的 import 或引用。
- **命名約定 (Naming Convention)**: 檔案或目錄名稱包含 `_legacy`, `_bak`, `_old`, `v1`, `archive` 等關鍵字。
- **過時技術 (Outdated Technology)**:
  - 使用了已被官方棄用的函式庫或 API。
  - 使用了舊的寫法，例如 React Class Components 而非 Hooks。
- **長期未變更 (Long-Term Inactivity)**:
  - 根據 Git 歷史，檔案在過去 18-24 個月內無任何修改。
- **關聯的功能已下線 (Disabled Feature Association)**:
  - 代碼僅被一個已經下線或永久停用的功能標記 (Feature Flag) 所使用。
- **低測試覆蓋率 (Low Test Coverage)**:
  - 關鍵邏輯缺乏單元測試或整合測試，暗示其重要性可能較低或已被遺忘。

## 執行指令

1.  建立本次掃描的報告目錄：`docs/Tech-Debt-Reports/<REPORT_TIMESTAMP>/`
2.  **並行啟動依賴分析、影響評估、架構驗證三個階段**

### 階段一：依賴分析

- **調用依賴分析代理群組**
- **任務**：掃描所有 import/export 關係和依賴鏈。
- **產出**：依賴關係圖和引用計數報告，存於 `.../dependency-analysis/`。

### 階段二：影響評估

- **調用影響評估代理群組**
- **任務**：根據「技術債務識別標準」識別潛在問題，並評估其影響。
- **產出**：潛在債務清單及其影響評估報告，存於 `.../impact-assessment/`。

### 階段三：架構驗證

- **調用架構驗證代理群組**
- **任務**：從宏觀角度驗證識別出的問題是否影響架構一致性。
- **產出**：架構一致性驗證報告，存於 `.../architecture-verification/`。

### 階段四：報告生成

- **當所有分析完成後，調用報告生成代理**
- **任務**：
  - [docs-architect](../agents/docs-architect.md) 整合所有階段的發現。
    - **聚合相似問題**：特別是針對「低影響」問題，如果根本原因相同（如：使用了同一個棄用 API），則將它們合併為一項，並列出所有受影響的文件。
    - 根據「影響等級矩陣」對問題進行分類。
    - **嚴格遵循「報告輸出格式」及「附錄：報告生成模板」**，生成一份完整的 Markdown 格式技術債務報告。
- **產出**：`docs/Tech-Debt-Reports/<REPORT_TIMESTAMP>/Comprehensive-Tech-Debt-Report.md`
- [context-manager](../agents/context-manager.md)：執行[任務摘要](context_summary.md)指令

## 影響等級矩陣

| 影響等級      | 特徵描述                     | 處理建議                 |
| ------------- | ---------------------------- | ------------------------ |
| **🔴 高影響** | 影響核心功能、違反架構原則   | 應在下個 Sprint 優先處理 |
| **🟠 中影響** | 存在潛在 Bug、代碼可讀性差   | 建議納入近期重構計畫     |
| **🟢 低影響** | 零引用、命名不規範、文檔缺失 | 可在有空閒時或順手修復   |

## 報告輸出格式

### 最終報告 (`Comprehensive-Tech-Debt-Report.md`) 結構

```
# 技術債務掃描報告 - <REPORT_TIMESTAMP>

## 📈 技術債務熱力圖 (Heatmap)

| 模組/目錄          | 🔴 高影響 | 🟠 中影響 | 🟢 低影響 | 總計 |
| ------------------ | --------- | --------- | --------- | ---- |
| `lib/card-system/` | 2         | 8         | 5         | 15   |
| `app/(app)/admin/` | 1         | 3         | 12        | 16   |
| `components/ui/`   | 0         | 1         | 4         | 5    |
| `app/api/`         | 0         | 0         | 2         | 2    |

## 摘要

- **高影響問題**: 3 個
- **中影響問題**: 12 個
- **低影響問題**: 23 個 (已聚合為 5 個問題類型)

---

## 🔴 高影響問題清單

### 1. [問題標題，例如：核心認證模組存在循環依賴]

- **檔案路徑**: `src/lib/auth/utils.ts`
- **問題描述**: 該檔案與 `src/lib/user/service.ts` 形成循環依賴，可能導致運行時錯誤。
- **識別標準**: 架構驗證
- **建議行動**: 重構 `utils.ts`，將通用函式提取到更高層級。

---

## 🟠 中影響問題清單

...

## 🟢 低影響問題清單

### 1. [聚合] 使用了已棄用的 `moment.js` 函式庫

- **問題描述**: `moment.js` 已進入維護模式且體積龐大，建議遷移至 `date-fns` 或 `day.js`。
- **識別標準**: 過時技術
- **受影響檔案**:
  - `src/utils/formatDate.ts`
  - `components/reports/DateRangePicker.tsx`
  - `... (共 15 個檔案)`
- **建議行動**: 計劃一次性將所有 `moment.js` 的使用替換掉。

```

---

## 附錄：報告生成模板 (Appendix: Report Generation Template)

**`docs-architect` 代理必須嚴格遵循以下 Markdown 結構生成報告。**

---

# 技術債務掃描報告 - [REPORT_TIMESTAMP]

## 📈 技術債務熱力圖 (Heatmap)

| 模組/目錄       | 🔴 高影響      | 🟠 中影響        | 🟢 低影響     | 總計            |
| --------------- | -------------- | ---------------- | ------------- | --------------- |
| `[MODULE_PATH]` | `[HIGH_COUNT]` | `[MEDIUM_COUNT]` | `[LOW_COUNT]` | `[TOTAL_COUNT]` |
| `...`           | `...`          | `...`            | `...`         | `...`           |

## 摘要

- **高影響問題**: [HIGH_IMPACT_COUNT] 個
- **中影響問題**: [MEDIUM_IMPACT_COUNT] 個
- **低影響問題**: [TOTAL_LOW_IMPACT_COUNT] 個 (已聚合為 [AGGREGATED_LOW_IMPACT_COUNT] 個問題類型)

---

## 🔴 高影響問題清單

---

<!-- 對於每一個高影響問題，重複以下塊 -->

### [ISSUE_NUMBER]. [ISSUE_TITLE]

- **檔案路徑**: `[FILE_PATH]`
- **問題描述**: [DETAILED_DESCRIPTION]
- **識別標準**: [CRITERIA] (例如: 過時技術, 零引用)
- **建議行動**: [SUGGESTED_ACTION]

---

<!-- 結束重複塊 -->

## 🟠 中影響問題清單

---

<!-- 對於每一個中影響問題，重複以下塊 -->

### [ISSUE_NUMBER]. [ISSUE_TITLE]

- **檔案路徑**: `[FILE_PATH]`
- **問題描述**: [DETAILED_DESCRIPTION]
- **識別標準**: [CRITERIA]
- **建議行動**: [SUGGESTED_ACTION]

---

<!-- 結束重複塊 -->

## 🟢 低影響問題清單

---

<!-- 對於每一個聚合的低影響問題，使用以下塊 -->

### [ISSUE_NUMBER]. [聚合] [AGGREGATED_ISSUE_TITLE]

- **問題描述**: [DETAILED_DESCRIPTION_OF_AGGREGATED_ISSUE]
- **識別標準**: [CRITERIA]
- **受影響檔案**:
  - `[FILE_PATH_1]`
  - `[FILE_PATH_2]`
  - `... (共 [AFFECTED_FILES_COUNT] 個檔案)`
- **建議行動**: [SUGGESTED_ACTION_FOR_ALL]

---

<!-- 結束重複塊 -->
<!-- 對於每一個獨立的低影響問題，使用以下塊 -->

### [ISSUE_NUMBER]. [ISSUE_TITLE]

- **檔案路徑**: `[FILE_PATH]`
- **問題描述**: [DETAILED_DESCRIPTION]
- **識別標準**: [CRITERIA]
- **建議行動**: [SUGGESTED_ACTION]

---

<!-- 結束重複塊 -->

**記住**：此指令專注於**主動且預防性地發現技術債務**。目標是通過自動化掃描，定期為團隊提供一份清晰、可執行的報告，以持續維護程式碼庫的健康狀況，而非直接進行修改。
