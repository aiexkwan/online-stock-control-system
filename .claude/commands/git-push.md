---
argument-hint: [commit_message] [branch_target] [push_options]
description: 由專業代理自動修復阻礙 Git 推送的錯誤和安全問題，並在失敗時重試，確保成功推送。
---

# Git 推送助手 (自動修復版)

此指令採用「驗證-修復-重試」循環，自動解決阻礙 `git push --verify` 的常見問題。當驗證失敗時，對應的專業代理會嘗試修復問題並重試，最多 5 次，以最大限度地確保推送成功。

## 代理目錄

- [代理目錄](/Users/chun/Documents/PennineWMS/online-stock-control-system/.claude/agents)

## 變數

- **COMMIT_MESSAGE**: $ARGUMENTS[0] 或預設為自動生成的訊息。
- **BRANCH_TARGET**: $ARGUMENTS[1] 或預設為當前分支。
- **PUSH_OPTIONS**: $ARGUMENTS[2] 或預設為 "--verify"。

## 執行流程

流程是一個包含自動修復機制的驗證循環。當驗證失敗時，系統會自動調用`代理目錄`內相應的代理進行修復，並重試該步驟。如果連續 5 次修復失敗，流程才會中止。

0. 完整閱讀 @CLAUDE.md [系統規範](../../CLAUDE.local.md)及文檔中的連結文案，以獲取全局設定及系統資訊

1. **檢查敏感資訊 (由 [security-auditor](../agents/security-auditor.md) 執行)**
   - **驗證**: 掃描暫存區檔案中是否有寫死的秘密。
   - **修復與重試**: 若檢測到問題，代理會嘗試自動修復。修復後重新驗證。此循環最多重複 5 次。若問題持續存在，則中止。

2. **執行 Linter 和 Formatter (由 [eslint-fixer](../agents/eslint-fixer.md) 執行)**
   - **驗證**: 檢查是否存在 Linter 或格式問題。
   - **修復與重試**: 若存在問題，代理會執行 `eslint --fix` 等修復工具。修復後重新驗證。此循環最多重複 5 次。

3. **執行構建驗證 (由 [build-error-resolver](../agents/build-error-resolver.md) 執行)**
   - **驗證**: 執行專案的構建指令（例如 `npm run build`）。
   - **修復與重試**: 若構建失敗，代理將分析錯誤並嘗試應用修復方案。修復後重新構建。此循環最多重複 5 次。

4. **執行測試 (由 [test-automator](../agents/test-automator.md) 執行)**
   - **驗證**: 執行測試套件（例如 `npm test`）。
   - **修復與重試**: 若測試失敗，代理會嘗試自動修復（如更新快照、修復簡單斷言）。修復後重新執行測試。此循環最多重複 5 次。

5. **執行 Git 推送 (由 [legacy-modernizer](../agents/legacy-modernizer.md) 執行)**
   - 如果前面所有步驟最終都成功通過，執行 Git 推送操作：
     - `git add .`
     - `git commit -m "$COMMIT_MESSAGE"`
     - `git push origin $BRANCH_TARGET $PUSH_OPTIONS`

## 輸出

- **成功**：一個簡單的確認訊息。
  ```
  所有檢查均已通過（部分問題已自動修復）。正在推送到 origin/<branch_target>...
  推送成功。
  ```
- **失敗**：清晰地指出在哪個環節、經過多次嘗試後仍然失敗。

  ```
  [推送已中止] [test-automator](../agents/test-automator.md) 在嘗試 5 次自動修復後，仍無法解決測試失敗問題。

  最終錯誤摘要：
  - 2 個測試持續失敗
  - 15 個測試通過

  請手動修復問題後再試一次。
  ```

**指導原則**：此工具的角色是一個專業且執著的修復團隊。每個代理不僅負責發現問題，更會主動嘗試修復，直到成功或達到重試上限為止。
