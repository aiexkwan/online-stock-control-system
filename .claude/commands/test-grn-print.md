# Run Testing For GRN Card Label

## Target
- Using Playwright MCP to run test for [GRNLabelCard](../../app/(app)/admin/cards/GRNLabelCard.tsx)

## Revoke Multi-agents
- [Backend-Arc](../../.claude/agents/backend-architect.md)
- [Test-automator](../../.claude/agents/test-automator.md)
- [Code-Reviewer](../agents/code-reviewer.md)
- [Database-Admin](../agents/database-admin.md)
- [Graphql-Arc](../agents/graphql-architect.md)

## Tools Required
- Supabase MCP
- Native Playwright testing framework (instead of through MCP)

## Reminder Before Start
- Your goal is only write test and run til success.
- All test relate file/doc must save into [Testfolder](/Users/chun/Documents/PennineWMS/online-stock-control-system/__tests__)
- You can also check within [Testfolder] if any previous test file
- Simuilate single worker operating continously on Chrome browser
- Always use environment setting, never hard coding $.env.local or sensitive date within test file
- If any print function involved, no need for physical print

## Testflow
0. Invoke aganets to thought codebase and related to have a fully understand of target components working logic
    - RPC function (need to state out within report docuement)
    - Related table update (need to state out within report docuement)
    - UI/UX flow at frontend
    - etc

1. Login system thought [Main Login Page](app/(auth)/main-login/page.tsx)
    - Login email: `${env.local.TEST_SYS_LOGIN}`
    - Login password: `${env.local.TEST_SYS_PASSWORD}`

2. Choose target cards thought navigation cards
    - [Cards-Selector](../../app/(app)/admin/cards/AnalysisCardSelector.tsx)
    - [Tab-Selector](../../app/(app)/admin/cards/TabSelectorCard.tsx)

3. Run test for 4 times

- 1st time
    - `GRN Number` field : `123456`
    - `Material Supplier` field : `AM`
    - `Product Code` field : `MEP9090150`
    - `Count Method` section : Select `Weight`
    - `Pallet Type` selector
        - Choose `Pallet Type`=`White Dry`, `Quantity`=1
    - `Package Type` selector
        - Choose `Package Type`=`Still`, `Quantity`=1
    - `Weight/Quantity Input` section
        - `GROSS Weight/QTY` field
        - 1st pallet : `1000`
        - 2nd pallet : `1100`
        - 3rd pallet : `1200`
        - 4th pallet : `1300`
    - `Verified Clock ID` field : `5997`

- 2nd time
    - `GRN Number` field : `123456`
    - `Material Supplier` field : `AM`
    - `Product Code` field : `MEL4545A`
    - `Count Method` section : Select `Weight`
    - `Pallet Type` selector
        - Choose `Pallet Type`=`White Dry`, `Quantity`=1
    - `Package Type` selector
        - Choose `Package Type`=`Still`, `Quantity`=1
    - `Weight/Quantity Input` section
        - `GROSS Weight/QTY` field
        - 1st pallet : `2000`
        - 2nd pallet : `2100`
        - 3rd pallet : `2200`
        - 4th pallet : `2300`
    - `Verified Clock ID` field : `5942`

- 3rd time
    - `GRN Number` field : `123456`
    - `Material Supplier` field : `AM`
    - `Product Code` field : `MEP9090150`
    - `Count Method` section : Select `Quantity`
    - `Weight/Quantity Input` section
        - `GROSS Weight/QTY` field
            - 1st pallet : `1000`
            - 2nd pallet : `1100`
            - 3rd pallet : `1200`
            - 4th pallet : `1300`
    - `Verified Clock ID` field : `6001`

- 4th time
    - `GRN Number` field : `123456`
    - `Material Supplier` field : `AM`
    - `Product Code` field : `MEL4545A`
    - `Count Method` section : Select `Quantity`
    - `Weight/Quantity Input` section
        - `GROSS Weight/QTY` field
        - 1st pallet : `2000`
        - 2nd pallet : `2100`
        - 3rd pallet : `2200`
        - 4th pallet : `2300`
    - `Verified Clock ID` field : `5997`

4. Using Supabase MCP to check database table update accurancy.

5. Write report as below template as save into [GRN-Label-TestResult](/Users/chun/Documents/PennineWMS/online-stock-control-system/docs/test/GRN-label) folder
    - Docuement name : `YYYY-MM-DD Test Result`

# QCLabelCard 測試報告

**測試日期**: `[YYYY-MM-DD]` 

---

## 📋 測試概覽

### 測試目標
- **組件名稱**: `GRNLabelCard`
- **測試工具**: `Playwright MCP`
- **測試目的**: 驗證 GRN 標籤卡功能嘅正確性，穩定性及資料庫更新情況

### 參與代理
| 代理名稱 | 角色 |
|---------|------|
| [Backend-Arc](../../.claude/agents/backend-architect.md) | 後端架構師 |
| [Business-Anly](../../.claude/agents/business-analyst.md) | 業務分析師 |
| [Test-automator](../../.claude/agents/test-automator.md) | 測試自動化工程師 |
| [Code-Reviewer](../agents/code-reviewer.md) | 代碼審查員 |
| [Context-Manager](../agents/context-manager.md) | 上下文管理器 |
| [Doc-Architech](../agents/docs-architect.md) | 文檔架構師 |
| [UI-UX-Designer](../agents/ui-ux-designer.md) | UI/UX 設計師 |
| [Frontend-Dev](../agents/frontend-developer.md) | 前端開發人員 |
| [Database-Admin](../agents/database-admin.md) | 數據庫管理員 |

---

## 🔧 測試準備

### 前置檢查清單
- [ ] **RPC 功能檢查** - 確認所有 RPC 函數正常運作
- [ ] **數據庫準備** - 相關表格已更新並準備就緒
- [ ] **UI/UX 流程** - 前端介面流程已驗證
- [ ] **環境變量** - 確認 `.env.local` 配置正確
- [ ] **測試數據** - 準備測試所需嘅產品代碼同操作員資料

### 測試環境配置
```yaml
測試瀏覽器: Chrome
測試模式: 單一操作員連續操作模擬
測試文件路徑: /Users/chun/Documents/PennineWMS/online-stock-control-system/__tests__/
登入憑證: 
  - Email: ${env.local.TEST_SYS_LOGIN}
  - Password: ${env.local.TEST_SYS_PASSWORD}
```

---

## 🚀 測試執行流程

### Step 1: 系統登入
- **頁面**: [Main Login Page](app/(auth)/main-login/page.tsx)
- **操作**: 使用測試憑證登入系統
- **狀態**: `[✅ 成功 / ❌ 失敗]`
- **備註**: `[任何相關記錄]`

### Step 2: 導航到目標卡片
- **選擇器 1**: [Cards-Selector](../../app/(app)/admin/cards/AnalysisCardSelector.tsx)
- **選擇器 2**: [Tab-Selector](../../app/(app)/admin/cards/TabSelectorCard.tsx)
- **狀態**: `[✅ 成功 / ❌ 失敗]`
- **備註**: `[任何相關記錄]`

### Step 3: 測試執行結果

---

## 📊 測試案例執行詳情

### 測試案例 #1
| 欄位 | 輸入值 | 預期結果 | 實際結果 | 狀態 |
|-----|--------|---------|---------|------|
| **GRN Number** | `[Code]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Material Supplier** | `[Quantity]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Product Code** | `[Pallet Count]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Count Method** | `[Count Method]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **pallet type** | `[pallet type]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **package type** | `[package type]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **GROSS Weight/QTY** | `[GROSS Weight/QTY]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |
| **Verified Clock ID** | `[Verified Clock ID]` | `[成功/失敗輸入]` | `[實際結果]` | `[✅ 成功 / ❌ 失敗]` |

**執行耗時**: `[HH:MM:SS]`  
**錯誤日誌**: 
```
[如有錯誤，在此記錄]
```
---

### 測試案例 #[如有更多]

[重覆上述格式]

---

## 📈 測試總結

### 執行統計
| 指標 | 數值 |
|-----|------|
| **總測試案例數** | `[測試次數]` |
| **成功案例** | `[數量]` |
| **失敗案例** | `[數量]` |
| **成功率** | `[百分比]%` |
| **總耗時** | `[HH:MM:SS]` |

### 問題摘要
| # | 問題描述 | 嚴重程度 |
|---|---------|---------|
| 1 | `[問題描述]` | `[高/中/低]` |
| 2 | `[問題描述]` | `[高/中/低]` |

### 性能指標
| 操作 | 平均響應時間 | 最長響應時間 | 最短響應時間 |
|-----|------------|------------|------------|
| 登入 | `[秒]` | `[秒]` | `[秒]` |
| 頁面加載 | `[秒]` | `[秒]` | `[秒]` |
| 標籤生成 | `[秒]` | `[秒]` | `[秒]` |
| Clock ID 驗證 | `[秒]` | `[秒]` | `[秒]` |

### 數據庫更新情況
| 表格名稱 | 欄位名稱 | 更新狀況 |
|---------|---------|------------|
| `[相關的表格]` | `[相關的欄位]` | `[✅ 成功 / ❌ 失敗]` |
| `[相關的表格]` | `[相關的欄位]` | `[✅ 成功 / ❌ 失敗]` |
| `[相關的表格]` | `[相關的欄位]` | `[✅ 成功 / ❌ 失敗]` |
| `[相關的表格]` | `[相關的欄位]` | `[✅ 成功 / ❌ 失敗]` |

---

## 🔍 詳細發現

### 功能測試發現
```
[詳細描述功能測試期間嘅發現]
```

### UI/UX 觀察
```
[記錄任何 UI/UX 相關嘅觀察或問題]
```

### 數據庫影響
```
[記錄測試對數據庫嘅影響或相關發現]
```

---

## 💡 建議同改進

1. **高優先級建議**
   - `[建議內容]`
   
2. **中優先級建議**
   - `[建議內容]`
   
3. **低優先級建議**
   - `[建議內容]`

---

## 📎 附件

- **測試腳本**: `[path to test script.js]`

---

*報告生成時間: [YYYY-MM-DD HH:MM:SS]*
