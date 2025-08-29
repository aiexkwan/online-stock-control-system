---
argument-hint: []
description: 採用「掃描-分析-報告」的循序模型，對整個專案進行掃描，以主動識別並報告潛在的技術債務。
---

# 技術債務掃描指令

此指令通過一個清晰的兩階段循序模型，對整個專案進行系統性的掃描和分析。首先，它會快速篩選出所有潛在的技術債務候選者；然後，再對每個候選者進行循序的深度分析；最終，生成一份統一的、聚合的綜合報告。

## 代理目錄

- [代理目錄](/Users/chun/Documents/PennineWMS/online-stock-control-system/.clade/agents)

## 核心原則

- **深度思考和分析**
- **唯讀掃描**: 整個過程不對任何專案檔案進行修改或刪除。
- **先廣後深**: 先進行廣泛掃描以確定分析範圍，再對重點目標進行深度分析，提升效率。
- **循序深入**: 對每個候選目標的深度分析都遵循邏輯順序，確保評估的全面性。
- **報告導向**: 指令的唯一目標是生成一份高質量的、可供決策的技術債務報告。

## 執行流程

**總指揮**: [architect-review](../agents/architect-review.md)

0. 完整閱讀 @CLAUDE.md [系統規範](../../CLAUDE.local.md)及文檔中的連結文案，以獲取全局設定及系統資訊

1. Run `date +"%Y-%m-%d"` to get a human-readable timestamp (e.g., 2025-01-08)

- 建立`docs/PlanningDocument/Tech-Debt-Reports/Comprehensive-Tech-Debt-Report-$Timestamp.md`

2.  **階段一：候選目標掃描 (由 [code-reviewer](../agents/code-reviewer.md) 執行)**
    - **目標**: 對專案根目錄 (`.`) 進行一次全面的靜態掃描。
    - **任務**: 找出所有符合一項或多項「技術債務識別標準」的檔案或代碼片段。
    - **產出**: 一份結構化的「潛在技術債務候選清單」。

3.  **階段二：候選目標深度分析 (由總指揮循環調度)**
    - **目標**: 遍歷第一階段產出的「候選清單」，對其中的**每一個候選者**進行循序的深度分析。
    - **對於每一個候選者，總指揮將按順序調用以下專家**:
      1.  **依賴分析**: 由 [frontend-developer](../agents/frontend-developer.md) 或 [backend-architect](../agents/backend-architect.md) 執行，檢查其引用關係。
      2.  **運行時分析**: 由 [test-automator](../agents/test-automator.md) 執行，評估其對測試覆蓋率的影響。
      3.  **影響評估**: 由 [security-auditor](../agents/security-auditor.md) 和 [performance-engineer](../agents/performance-engineer.md) 執行，評估其對安全和性能的潛在影響。
    - **產出**: 為每個候選者附加一份包含上述所有分析結果的詳細元數據。

4.  **階段三：生成綜合報告 (由 [docs-architect](../agents/docs-architect.md) 執行)**
    - **目標**: 整合第二階段產出的所有分析數據。
    - **任務**:
      - 根據「影響等級矩陣」對所有已驗證的技術債務進行分類。
      - **聚合相似的低影響問題** (例如，將所有「使用了同一個棄用 API」的問題合併為一項)。
      - 嚴格遵循「報告輸出格式」和「附錄：報告生成模板」，生成最終的 Markdown 報告。
    - **產出**: `Comprehensive-Tech-Debt-Report-$Timestamp.md`

## 🎯 技術債務識別標準

在分析階段，代理應根據以下一個或多個標準，將檔案或組件標記為潛在的技術債務：

- **零引用 (Zero-Reference)**: 檔案在專案中沒有任何有效的 import 或引用。
- **命名約定 (Naming Convention)**: 檔案或目錄名稱包含 `_legacy`, `_bak`, `_old`, `v1`, `archive` 等關鍵字。
- **過時技術 (Outdated Technology)**: 使用了已被官方棄用的函式庫或 API。
- **長期未變更 (Long-Term Inactivity)**: 根據 Git 歷史，檔案在過去 18-24 個月內無任何修改。
- **關聯的功能已下線 (Disabled Feature Association)**: 代碼僅被一個已經下線或永久停用的功能標記 (Feature Flag) 所使用。
- **低測試覆蓋率 (Low Test Coverage)**: 關鍵邏輯缺乏單元測試或整合測試。

## 影響等級矩陣

| 影響等級      | 特徵描述                     | 處理建議                 |
| ------------- | ---------------------------- | ------------------------ |
| **🔴 高影響** | 影響核心功能、違反架構原則   | 應在下個 Sprint 優先處理 |
| **🟠 中影響** | 存在潛在 Bug、代碼可讀性差   | 建議納入近期重構計畫     |
| **🟢 低影響** | 零引用、命名不規範、文檔缺失 | 可在有空閒時或順手修復   |

## 報告輸出格式

### `Comprehensive-Tech-Debt-Report-$Timestamp.md` 結構

```
# 技術債務掃描報告 - [YYYY-MM-DD]

## 📈 技術債務熱力圖 (Heatmap)
...
## 摘要
...
## 🔴 高影響問題清單
...
## 🟠 中影響問題清單
...
## 🟢 低影響問題清單
...
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

...

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
