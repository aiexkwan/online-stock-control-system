---
argument-hint: [planning_doc_path] [phase]
description: 讀取 Markdown 格式的開發計劃文檔，並由總指揮代理循序執行其中定義的任務。
---

# 計劃文檔執行指令

此指令旨在忠實地執行一份詳細的 Markdown 格式開發計劃（如 `MAIN_LOGIN_IMPROVEMENT_PLAN.md`）。它通過解析文檔、提取任務列表，並由一個總指揮代理循序調度專家來完成每個步驟，確保開發過程高度聚焦且與計劃一致。

## 代理目錄

- [代理目錄](/Users/chun/Documents/PennineWMS/online-stock-control-system/.claude/agents)

## 變數

- **PLANNING_DOC_PATH**: $ARGUMENTS[0] - 要執行的 Markdown 計劃文檔路徑。
- **PHASE**: $ARGUMENTS[1] - 計劃文檔中要執行的具體階段標題，例如 "階段一：架構簡化"（如沒有指定，則假設第一階段）

## 核心原則

- **忠於原文**: 嚴格按照 Markdown 文檔中指定 `PHASE` 下的「階段任務分解」列表和順序執行。
- **循序執行**: 一次只專注於一項任務，完成並驗證後再進行下一項，確保流程清晰。
- **智能調度**: 由總指揮代理分析每項任務的自然語言描述，並指派最合適的單一專家代理執行。
- **即時驗證與修復**: 每個任務完成後立即進行自動化驗證，失敗則觸發修復重試循環。
- **Console安全**：所有console必須使用LoggerSanitizer保護
- **嚴格遵守**：`KISS`，`DRY`，`YAGNI`同`SOLID`四大原則

## 執行流程

0. 完整閱讀 @CLAUDE.md [系統規範](../../CLAUDE.local.md)及文檔中的連結文案，以獲取全局設定及系統資訊

1. 建立計劃執行紀錄文檔

- `/Users/chun/Documents/PennineWMS/online-stock-control-system/docs/PlanningDocument/[planning_doc]/[phase]`

2.  **解析計劃文檔 (由 [context-fetcher](../agents/context-fetcher.md) 執行)**
    - 讀取指定的 `$PLANNING_DOC_PATH`。
    - 定位到用戶指定的 `$PHASE` 標題。
    - 從該階段下的「階段任務分解」章節中，提取所有編號的任務項，生成一個內部執行的任務清單。

3.  **循序執行任務 (由 [architect-review](../agents/architect-review.md) 作為總指揮)**
    - 總指揮從解析出的任務清單頂部開始，逐一處理。
    - **對於清單中的每一項任務**:
      1.  **分析與調度**: 總指揮分析任務的文本內容（例如：「移除前端密碼驗證複雜性」），並從代理目錄中選擇最合適的專家代理（例如 `[frontend-developer](../agents/frontend-developer.md)`）。
      2.  **執行任務**: 專家代理接收到具體的指令後，執行相應的代碼修改或檔案操作。
      3.  **即時驗證**: 任務交付物（修改的檔案）產生後，立即執行相關的自動化驗證（如 Linter, Type-check, Unit Tests）。
      4.  **修復與重試循環**:
          - 如果驗證失敗，剛才的專家代理將立即嘗試修復。
          - 此修復-重試循環最多進行 **5** 次。如果問題仍然存在，整個流程將中止並報告錯誤。
      5.  **標記完成並繼續**: 當前任務成功通過驗證後，總指揮將其標記為完成，並開始執行清單中的下一個任務。

4.  **生成最終報告 (由 [docs-architect](../agents/docs-architect.md) 執行)**
    - 當指定階段的所有任務成功完成後，遵從`最終報告模版`，生成一份完整詳盡的執行摘要報告。

5.  **文檔審核**：[文檔規範員](../agents/documentation-normalizer.md)對所生成文檔作最終審核

## 輸入格式：Markdown 計劃文檔 (示例)

指令的輸入是一個結構化的 Markdown 檔案，類似於 `MAIN_LOGIN_IMPROVEMENT_PLAN.md`。指令會尋找如下的結構來解析任務：

```markdown
# main-login 模組系統改進計劃

...

## 階段一：架構簡化 (第1週)

...

### 階段任務分解 (🚨 嚴格遵循 UI 不變原則)

1.  **移除前端密碼驗證複雜性** (2天)
    - 保留 `PasswordValidator.tsx` 組件結構和外觀，但移除內部複雜邏輯...
    - 簡化 `useLogin.ts` 只保留基本格式檢查...

2.  **簡化會話管理** (1天)
    - 移除3秒重試機制的複雜邏輯...

3.  **移除重複驗證邏輯** (2天)
    ...

...
```

## 輸出

指令的最終輸出應遵循以下格式，由 [docs-architect](../agents/docs-architect.md) 生成報告，

### 最終報告模版 (`[phase]-report.md`)

```markdown
# 計劃執行報告

- **計劃文檔**: `[Path to PLANNING_DOC_PATH]`
- **執行階段**: `[PHASE]`
- **最終狀態**: `[成功 | 失敗]`
- **執行時間**: `[YYYY-MM-DD HH:MM:SS]`
- **總耗時**: `[Total Duration, e.g., 15.7 minutes]`

---

## 執行摘要

- **總任務數**: `[Total number of tasks]`
- **成功任務**: `[Number of successful tasks]`
- **失敗任務**: `[Number of failed tasks]`

---

## 任務執行詳情

| #   | 任務描述                             | 指派代理       | 狀態    | 重試次數    | 產出檔案          |
| --- | ------------------------------------ | -------------- | ------- | ----------- | ----------------- |
| 1   | `[Task 1 Description from Markdown]` | `[Agent Name]` | ✅ 成功 | `[Retries]` | `[List of files]` |
| 2   | `[Task 2 Description from Markdown]` | `[Agent Name]` | ✅ 成功 | `[Retries]` | `[List of files]` |
| 3   | `[Task 3 Description from Markdown]` | `[Agent Name]` | ❌ 失敗 | 5           | `N/A`             |

---

## 失敗詳情 (僅在失敗時提供)

- **失敗任務**: `[#3: Task 3 Description from Markdown]`
- **負責代理**: `[Agent Name]`
- **最終錯誤訊息**:
```

[Final error message after 5 retries]

```

## 最終交付物清單 (僅在成功時提供)

- `path/to/file1.ts`
- `path/to/component.tsx`
- `...`
```
