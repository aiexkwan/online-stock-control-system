---
description: Execute comprehensive Playwright tests for the GRNLabelCard component, including complex UI interaction and database validation.
---

# GRN 標籤卡測試執行指令

深度思考並執行全面的 `GRNLabelCard` 組件功能測試，通過並行調用測試代理，自動化執行 UI 互動、複雜數據輸入、資料庫驗證及報告生成。

## 變數

- **TARGET_COMPONENT**: `app/(app)/admin/cards/GRNLabelCard.tsx`
  - 測試的主要目標組件
- **TEST_CASES**: 預定義的四組複雜測試數據
  - 使用者：[test-automator](../agents/test-automator.md)

## 執行代理群組

### 測試規劃與分析代理群組

- [business-analyst](../agents/business-analyst.md) (分析業務需求與測試案例)
- [frontend-developer](../agents/frontend-developer.md) (分析前端組件互動與 UI 流程)
- [backend-architect](../agents/backend-architect.md) (分析後端 RPC 函數與 API 邏輯)
- [graphql-architect](../agents/graphql-architect.md) (分析 GraphQL schema 和數據流)

### 測試執行與驗證代理群組

- [test-automator](../agents/test-automator.md) (撰寫並執行 Playwright 測試腳本)
- [database-admin](../agents/database-admin.md) (執行 Supabase MCP 查詢以驗證資料庫)
- **→ 執行完畢後立即調用 [progress-auditor](../agents/progress-auditor.md) 審查測試覆蓋率與數據準確性**

### 報告與文檔代理群組

- [docs-architect](../agents/docs-architect.md) (撰寫並歸檔測試報告)
- [code-reviewer](../agents/code-reviewer.md) (審查測試腳本的品質)
- [context-manager](../agents/context-manager.md) (更新上下文歷史記錄)
- **→ 執行完畢後立即調用 [progress-auditor](../agents/progress-auditor.md) 審查文檔完整性**

## 🚨 測試執行規則

### 核心原則

1.  **目標導向**: 唯一目標是成功撰寫並執行測試，直到所有測試案例通過。
2.  **零硬編碼**: 嚴格使用環境變量 (`process.env`) 讀取敏感資料，禁止在測試代碼中硬編碼登入憑證等資訊。
3.  **環境模擬**: 測試必須在模擬單一操作員持續操作的 Chrome 瀏覽器環境中執行。
4.  **檔案歸檔**: 所有測試相關的檔案（腳本、報告）必須儲存於指定的目錄結構中。
5.  **虛擬打印**: 涉及打印功能的步驟，只需驗證打印流程被觸發，無需進行物理打印。

### 品質標準

- **測試通過率**: 100%
- **數據一致性**: 數據庫驗證必須 100% 準確。
- **報告完整性**: 測試報告必須遵循指定模板，並包含所有必要部分。

## 執行指令

0. 完整閱讀 @CLAUDE.md s[系統規範](../../CLAUDE.local.md)及文檔中的連結文案，以獲取全局設定及系統資訊
1. 執行 `date +"%Y-%m-%d_%H-%M-%S"` 取得時間戳
2. 建立測試報告目錄：`docs/test/grn-label/<timestamp>/`
3. **檢查 Playwright 環境與 Supabase 連接**

### 階段一：規劃與腳本開發

4.  **並行調用測試規劃與分析代理群組**
    - [business-analyst](../agents/business-analyst.md), [frontend-developer](../agents/frontend-developer.md), [backend-architect](../agents/backend-architect.md), [graphql-architect](../agents/graphql-architect.md)
    - **深度分析 `GRNLabelCard` 組件、相關 RPC 函數及 UI 流程**
5.  **調用 [test-automator](../agents/test-automator.md) 撰寫 Playwright 測試腳本**
    - 腳本儲存於 `__tests__/e2e/grn-label/grn-label-card.spec.ts`
    - 腳本需包含登入、導航、四個複雜測試案例的完整操作流程。
6.  **立即調用 [code-reviewer](../agents/code-reviewer.md) 與 [progress-auditor](../agents/progress-auditor.md) 審查測試腳本**
    - 驗證代碼品質、環境變數使用、流程完整性。
    - 未通過 ≥95% 標準則重新開發。

### 階段二：測試執行

7.  **調用 [test-automator](../agents/test-automator.md) 執行 Playwright 測試**
    - 執行 `npx playwright test __tests__/e2e/grn-label/grn-label-card.spec.ts`
    - **連續執行四次預定義的測試案例**
8.  **立即調用 [progress-auditor](../agents/progress-auditor.md) 審查執行結果**
    - 驗證所有測試案例 100% 通過。
    - 執行記錄寫入 `docs/test/grn-label/<timestamp>/execution-log.md`
    - 若有失敗，返回階段一進行腳本修復。

### 階段三：數據驗證與報告生成

9.  **調用 [database-admin](../agents/database-admin.md) 執行 Supabase MCP 查詢**
    - **驗證四次測試運行後，相關數據庫表格的數據是否準確更新**
10. **立即調用 [progress-auditor](../agents/progress-auditor.md) 審查數據一致性**
    - 驗證數據更新 100% 準確。
    - 驗證記錄寫入 `docs/test/grn-label/<timestamp>/db-validation.md`
11. **並行調用報告與文檔代理群組**
    - [docs-architect](../agents/docs-architect.md) 根據模板生成完整測試報告 `docs/test/grn-label/<timestamp>/Test-Result.md`
12. - [context-manager](../agents/context-manager.md)：執行[任務摘要](context_summary.md)指令

## 分階段品質標準

### 規劃與腳本開發階段標準

```yaml
腳本品質: ≥95% (ESLint 無錯誤, 遵循最佳實踐)
流程完整性: 100% (覆蓋登入、導航、所有測試案例)
環境變數使用: 100% (無硬編碼)
```

### 測試執行階段標準

```yaml
測試通過率: 100% (所有斷言成功)
執行穩定性: ≥90% (無 flakey tests)
```

### 數據驗證與報告階段標準

```yaml
數據準確性: 100% (DB 記錄與測試輸入匹配)
報告完整性: 100% (所有欄位已填寫)
文檔歸檔: 100% (所有產出物在正確位置)
```

## 交付物要求

### 產出檔案結構

```
├── __tests__/
│   └── e2e/
│       └── grn-label/
│           └── grn-label-card.spec.ts      # 測試腳本 ([test-automator](../agents/test-automator.md))
└── docs/
    ├── test/
    │   └── grn-label/
    │       └── <YYYY-MM-DD_HH-MM-SS>/      # 時間戳
    │           ├── Test-Result.md          # 最終測試報告 ([docs-architect](../agents/docs-architect.md))
    │           ├── execution-log.md        # 執行記錄
    │           └── db-validation.md        # 數據庫驗證記錄
    └── Context_History/
        └── <YYYY-MM-DD_HH-MM-SS>/          # 時間戳
            └── context-summary.md          # 工作日誌更新 ([context-manager](../agents/context-manager.md))
```

### 測試案例數據

|  #  | GRN Number | Supplier | Product Code | Count Method | Pallet/Package Types                        | Gross Weights/Qtys (per pallet) | Clock ID |
| :-: | :--------: | :------: | :----------: | :----------: | :------------------------------------------ | :------------------------------ | :------: |
|  1  |  `123456`  |   `AM`   | `MEP9090150` |   `Weight`   | Pallet: White Dry(1),<br/>Package: Still(1) | `1000`, `1100`, `1200`, `1300`  |  `5997`  |
|  2  |  `123456`  |   `AM`   |  `MEL4545A`  |   `Weight`   | Pallet: White Dry(1),<br/>Package: Still(1) | `2000`, `2100`, `2200`, `2300`  |  `5942`  |
|  3  |  `123456`  |   `AM`   | `MEP9090150` |  `Quantity`  | N/A                                         | `1000`, `1100`, `1200`, `1300`  |  `6001`  |
|  4  |  `123456`  |   `AM`   |  `MEL4545A`  |  `Quantity`  | N/A                                         | `2000`, `2100`, `2200`, `2300`  |  `5997`  |

---

## 測試報告模板

**注意**: 此模板應由 [docs-architect](../agents/docs-architect.md) 代理填充並保存為 `docs/test/grn-label/<timestamp>/Test-Result.md`。

```
# GRNLabelCard 測試報告

**測試日期**: `[YYYY-MM-DD]`

---

## 📋 測試概覽

### 測試目標

- **組件名稱**: `GRNLabelCard`
- **測試工具**: `Playwright`
- **測試目的**: 驗證 GRN 標籤卡功能嘅正確性，穩定性及資料庫更新情況

---

## 🔧 測試準備

### 前置檢查清單

- [ ] **RPC 功能檢查** - 確認所有 RPC 函數正常運作
- [ ] **數據庫準備** - 相關表格已更新並準備就緒
- [ ] **UI/UX 流程** - 前端介面流程已驗證
- [ ] **環境變量** - 確認 `.env.local` 配置正確
- [ ] **測試數據** - 準備測試所需嘅產品代碼同操作員資料

### 測試環境配置

```

測試瀏覽器: Chrome
測試模式: 單一操作員連續操作模擬
測試文件路徑: /Users/chun/Documents/PennineWMS/online-stock-control-system/**tests**/
登入憑證:
Email: ${env.local.TEST_SYS_LOGIN}
Password: ${env.local.TEST_SYS_PASSWORD}

```

---

## 🚀 測試執行流程

### Step 1: 系統登入

- **頁面**: `app/(auth)/main-login/page.tsx`
- **操作**: 使用測試憑證登入系統
- **狀態**: `[✅ 成功 / ❌ 失敗]`
- **備註**: `[任何相關記錄]`

### Step 2: 導航到目標卡片

- **選擇器 1**: `app/(app)/admin/cards/AnalysisCardSelector.tsx`
- **選擇器 2**: `app/(app)/admin/cards/TabSelectorCard.tsx`
- **狀態**: `[✅ 成功 / ❌ 失敗]`
- **備註**: `[任何相關記錄]`

---

## 📊 測試案例執行詳情

### 測試案例 #1

| 欄位                  | 輸入值                   | 預期結果          | 實際結果     | 狀態                  |
| --------------------- | ------------------------ | ----------------- | ------------ | --------------------- |
| **GRN Number**        | `123456`                 | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Material Supplier** | `AM`                     | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Product Code**      | `MEP9090150`             | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Count Method**      | `Weight`                 | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Pallet Type**       | `White Dry (1)`          | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Package Type**      | `Still (1)`              | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **GROSS Weight/QTY**  | `1000, 1100, 1200, 1300` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Verified Clock ID** | `5997`                   | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |

**執行耗時**: `[HH:MM:SS]`
**錯誤日誌**:
`[如有錯誤，在此記錄]`

---

## 📈 測試總結

### 執行統計

| 指標             | 數值         |
| ---------------- | ------------ |
| **總測試案例數** | `[測試次數]` |
| **成功案例**     | `[數量]`     |
| **失敗案例**     | `[數量]`     |
| **成功率**       | `[百分比]%`  |
| **總耗時**       | `[HH:MM:SS]` |

### 性能指標

| 操作          | 平均響應時間 | 最長響應時間 | 最短響應時間 |
| ------------- | ------------ | ------------ | ------------ |
| 登入          | `[秒]`       | `[秒]`       | `[秒]`       |
| 頁面加載      | `[秒]`       | `[秒]`       | `[秒]`       |
| 標籤生成      | `[秒]`       | `[秒]`       | `[秒]`       |
| Clock ID 驗證 | `[秒]`       | `[秒]`       | `[秒]`       |

### 數據庫更新情況

| 表格名稱       | 欄位名稱       | 更新狀況              |
| -------------- | -------------- | --------------------- |
| `[相關的表格]` | `[相關的欄位]` | `[✅ 成功 / ❌ 失敗]` |
| `[相關的表格]` | `[相關的欄位]` | `[✅ 成功 / ❌ 失敗]` |

---

## 💡 建議同改進

1.  **高優先級建議**
    - `[建議內容]`
2.  **中優先級建議**
    - `[建議內容]`
3.  **低優先級建議**
    - `[建議內容]`

---

## 📎 附件

- **測試腳本**: `__tests__/e2e/grn-label/grn-label-card.spec.ts`

---

_報告生成時間: [YYYY-MM-DD HH:MM:SS]_
```

---

**記住**：此指令專注於**高品質、可重複的自動化測試**。目標是確保 `GRNLabelCard` 組件在每次變更後都能通過全面的功能和數據驗證，並生成標準化的測試報告。
