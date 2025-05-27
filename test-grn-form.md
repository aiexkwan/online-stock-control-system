# GRN Label 表單測試指南

## 測試步驟

### 1. 確認服務器運行
- 開發服務器應該運行在 http://localhost:3000
- 檢查終端是否顯示 "Ready in X.Xs"

### 2. 登入系統
1. 在瀏覽器中訪問 http://localhost:3000
2. 系統會自動重定向到登入頁面
3. 使用有效的用戶憑證登入

### 3. 訪問 GRN Label 頁面
1. 登入成功後，訪問 http://localhost:3000/print-grnlabel
2. 頁面應該顯示 "Material Receiving" 標題

### 4. 填寫表單測試數據

#### 必填欄位：
- **GRN Number**: 輸入任意 GRN 編號，例如 "GRN-2025-001"
- **Material Supplier**: 輸入有效的供應商代碼（需要在 data_supplier 表中存在）
- **Product Code**: 輸入有效的產品代碼（需要在 data_code 表中存在）

#### 托盤類型（選擇一個）：
- White Dry: 1
- 或其他任意托盤類型

#### 包裝類型（選擇一個）：
- Still: 1
- 或其他任意包裝類型

#### 重量：
- Gross Weight / Qty [1st Pallet]: 輸入數字，例如 100

### 5. 驗證表單行為

#### 供應商驗證：
1. 輸入供應商代碼後，點擊其他地方（失焦）
2. 如果代碼有效，應該顯示綠色的供應商名稱
3. 如果代碼無效，應該顯示紅色錯誤信息

#### 產品代碼驗證：
1. 輸入產品代碼後，點擊其他地方（失焦）
2. 如果代碼有效，應該顯示綠色的產品描述
3. 如果代碼無效，應該顯示紅色錯誤信息

**注意**: GRN Label 系統只需要產品的 `code` 和 `description` 欄位，不需要 `standard_qty` 和 `type` 欄位。

### 6. 測試列印功能
1. 確保所有必填欄位都已填寫且驗證通過
2. 點擊 "Print GRN Label(s)" 按鈕
3. 應該彈出 Clock Number 確認對話框
4. 輸入有效的 Clock Number
5. 點擊確認

### 7. 檢查調試信息
打開瀏覽器開發者工具（F12），查看 Console 標籤：

#### 預期的調試信息：
```
[GrnLabelForm] handlePrintClick called. Form validation: {
  isFormValid: true,
  grnNumber: "GRN-2025-001",
  materialSupplier: "SUP001",
  productCode: "PROD001",
  palletTypeValid: true,
  packageTypeValid: true,
  grossWeightsValid: true,
  productInfo: { code: "PROD001", description: "..." }, // 只包含 code 和 description
  supplierInfo: { supplier_code: "SUP001", supplier_name: "..." }
}
```

```
[GrnLabelForm] proceedWithGrnPrint called with: {
  operatorClockNumber: "12345",
  productInfo: { ... },
  supplierInfo: { ... },
  ...
}
```

### 8. 常見問題排除

#### 如果看到 "Product or supplier information is missing" 錯誤：
1. 檢查 Console 中的調試信息
2. 確認 productInfo 和 supplierInfo 不是 null
3. 確認供應商代碼和產品代碼在數據庫中存在

#### 如果表單驗證失敗：
1. 檢查所有必填欄位是否已填寫
2. 確認托盤類型和包裝類型至少選擇了一個
3. 確認至少輸入了一個重量值

#### 如果頁面無法載入：
1. 確認已經登入系統
2. 檢查開發服務器是否正在運行
3. 檢查瀏覽器 Network 標籤中的錯誤信息

## 測試數據建議

### 有效的測試數據（需要根據實際數據庫調整）：
- 供應商代碼: "AV", "SUP001", "SUPPLIER_A"
- 產品代碼: "MEP9090150", "PROD001", "ACO_PRODUCT"

### 無效的測試數據：
- 供應商代碼: "INVALID_SUP", "NONEXISTENT"
- 產品代碼: "INVALID_PROD", "NONEXISTENT"

## 成功標準

✅ 頁面正常載入，顯示完整的表單界面
✅ 供應商代碼驗證正常工作
✅ 產品代碼驗證正常工作
✅ 表單驗證邏輯正確
✅ Clock Number 對話框正常彈出
✅ 調試信息顯示正確的數據結構
✅ 沒有 JavaScript 錯誤

如果所有步驟都通過，說明表單功能正常。如果在某個步驟遇到問題，請檢查相應的調試信息並報告具體的錯誤信息。 