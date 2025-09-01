---
description: 自動化並行修復 TypeScript 類型錯誤，通過多輪代理協作，系統性地提升代碼庫的類型安全。
---

# TypeScript 自動化修復指令

此指令採用「掃描-分發-修復-驗證」的自動化模型，對整個專案進行 TypeScript 類型問題修復。它首先會生成一份當日的錯誤清單與修復任務記錄，然後透過多輪、並行的代理協作，系統性地清理代碼中的類型錯誤。修復過程以不影響現有業務邏輯為最高原則。

## 代理目錄

- [代理目錄](/Users/chun/Documents/PennineWMS/online-stock-control-system/.claude/agents)

## 核心原則

- **狀態驅動 (State-Driven)**: 整個修復流程由一個修復記錄檔 (`typescript_fix_log_{timestamp}.md`) 驅動，確保進度可追蹤且任務不重複。
- **並行修復 (Parallel Execution)**: 在每一輪修復中，同時調度 5 個 [typescript-pro](../agents/typescript-pro.md) 代理，最大化利用資源以加速修復進程。
- **多輪執行 (Multi-Round Process)**: 預設執行 5 輪修復，以處理可能由修復過程引入的新問題或依賴性問題。
- **最小化產出 (Minimal Artifacts)**: 除必要的日誌與記錄檔外，不產生任何額外的報告或文檔，專注於代碼的直接修正。

## 執行流程

**總指揮**: [architect-review](../agents/architect-review.md)

0.  完整閱讀 @CLAUDE.md [系統規範](../../CLAUDE.local.md)及文檔中的連結文案，以獲取全局設定及系統資訊。

1.  **階段一：初始化與檢查**
    - 執行 `date +"%d-%b-%Y"` 獲取當日時間戳 (格式`29-Aug-2025`)。
    - 定義日誌檔案路徑：
      - 錯誤列表: `docs/Typescript_History/typescript_error_{timestamp}.json`
      - 修復記錄: `docs/Typescript_History/typescript_fix_log_{timestamp}.md`
    - 檢查當日的錯誤列表與修復記錄是否已存在。如果存在，則直接進入階段三。

2.  **階段二：錯誤掃描與任務生成 (僅當日誌不存在時執行)**
    - **執行者**: [typescript-pro](../agents/typescript-pro.md)
    - **任務**:
      1.  執行 `npm run typecheck`，並將其輸出結果解析為 Markdown 格式的錯誤報告，儲存至 `<錯誤列表路徑>`。
      2.  解析生成的 Markdown 報告，提取所有包含錯誤的**唯一**檔案路徑。
      3.  根據提取的檔案路徑，在 `<修復記錄路徑>` 建立一個 Markdown 格式的任務清單，每個檔案為一個待辦事項。

          ```markdown
          # TypeScript 修復記錄 - [YYYY-MMM-DD]

          ## 待修復檔案

          - [ ] path/to/file1.tsx
          - [ ] path/to/file2.ts
          - [ ] ...
          ```

3.  **階段三：並行修復 (共 5 輪)**
    - **協調者**: 總指揮
    - **流程**: 循環執行 5 次以下操作：
      1.  讀取修復記錄檔，找出**前 5 個**尚未完成 (`- [ ]`) 的檔案。
      2.  如果沒有任何未完成的檔案，則提前結束所有輪次，直接跳至階段四。
      3.  **並行調度 5 個 [typescript-pro](../agents/typescript-pro.md) 代理**，每個代理分配一個目標檔案路徑。
      4.  每個 [typescript-pro](../agents/typescript-pro.md) 代理的任務是：
          - 分析並修復指定的單一檔案中的 TypeScript 類型錯誤。
          - 處理該檔案中常見的類型問題模式。
      5.  代理完成修復後，**必須**更新修復記錄檔，將對應的項目標記為已完成 (`- [x]`)。

4.  **階段四：總結與驗證**
    - **執行者**: 總指揮
    - **任務**:
      1.  再次執行 `npm run typecheck` 以獲取修復後的錯誤總數。
      2.  在對話中報告最終結果，包括：
          - 修復前與修復後的錯誤數量對比。
          - 已完成修復的檔案列表。
          - 在 5 輪結束後仍未解決的問題（如有）。
