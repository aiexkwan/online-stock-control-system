# QC 標籤列印功能文檔

## 功能概述
QC 標籤列印系統負責生成和列印質量控制標籤，支援 ACO 和 Slate 兩種產品類型。

## 重複托盤編號問題修復記錄

### 問題描述
- **本地環境**：一切運作正常
- **Vercel 生產環境**：出現重複托盤編號錯誤
- **錯誤訊息**：`Duplicate pallet number detected for 090625/59: Pallet number 090625/59 already exists`

### 根本原因分析
1. **環境差異**：Vercel 雲端環境與本地環境在時間同步、網路延遲、緩存機制方面存在差異
2. **併發問題**：即使使用原子性 RPC 函數，在高延遲環境中仍可能出現時序問題
3. **緩存問題**：Vercel 的 Next.js 緩存可能影響數據庫查詢結果
4. **時間窗口**：RPC 生成托盤編號和實際插入數據庫之間的時間窗口在雲端環境中被放大

### 修復措施

#### 1. 強化重複檢查機制 (`qcActions.ts`)
```typescript
// 多重檢查策略
let duplicateCheckAttempts = 0;
const maxDuplicateChecks = 3;
let existingPallet = null;

while (duplicateCheckAttempts < maxDuplicateChecks) {
  // 執行重複檢查
  // 在 Vercel 環境中添加額外延遲
  if (process.env.VERCEL_ENV && duplicateCheckAttempts < maxDuplicateChecks) {
    await new Promise(resolve => setTimeout(resolve, 200 * duplicateCheckAttempts));
  }
}
```

#### 2. 使用 Upsert 策略作為額外保護
```typescript
const { error: palletInfoError } = await supabaseAdmin
  .from('record_palletinfo')
  .upsert(payload.palletInfo, { 
    onConflict: 'plt_num',
    ignoreDuplicates: false 
  });
```

#### 3. 增強托盤編號生成的唯一性驗證
```typescript
// 🔥 強化唯一性驗證 - 檢查生成的托盤編號是否已存在
for (const palletNum of rpcResult) {
  const { data: existing } = await supabaseAdmin
    .from('record_palletinfo')
    .select('plt_num')
    .eq('plt_num', palletNum)
    .single();
  
  if (existing) {
    throw new Error(`Generated pallet numbers contain duplicates: ${palletNum}`);
  }
}
```

#### 4. Vercel 環境特殊處理
- **增加重試次數**：生產環境從 3 次增加到 5-7 次
- **延長延遲時間**：基礎延遲從 500ms 增加到 800ms
- **延長冷卻期**：從 3 秒增加到 5 秒

#### 5. 雙重客戶端驗證
```typescript
// 額外驗證生成的托盤編號唯一性
const supabaseClient = createClientSupabase();
for (const palletNum of generationResult.palletNumbers) {
  const { data: existing } = await supabaseClient
    .from('record_palletinfo')
    .select('plt_num')
    .eq('plt_num', palletNum)
    .single();
  
  if (existing) {
    hasConflict = true;
    break;
  }
}
```

#### 6. Next.js 緩存清除機制
- **瀏覽器緩存清除**：清除所有 Service Worker 緩存
- **服務端緩存清除**：新增 `/api/clear-cache` 端點
- **路徑重新驗證**：清除特定路徑和標籤的緩存

#### 7. 調試和監控增強
- 添加環境信息日誌
- 增加時間戳記錄
- 詳細的錯誤追蹤
- 序列號狀態監控

### 技術實現細節

#### 環境檢測
```typescript
console.log('[qcActions] 環境信息:', {
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  timestamp: new Date().toISOString()
});
```

#### 動態參數調整
```typescript
const maxAttempts = process.env.VERCEL_ENV ? 7 : 5;
const cooldownPeriod = process.env.NODE_ENV === 'production' ? 5000 : 3000;
const baseDelay = process.env.VERCEL_ENV ? 800 : 500;
```

#### 緩存清除 API
```typescript
// 清除特定路徑和標籤的緩存
revalidatePath('/print-label');
revalidateTag('pallet-generation');
```

### 測試驗證
1. **本地環境測試**：確認修復不影響本地功能
2. **Vercel 部署測試**：驗證生產環境問題解決
3. **併發測試**：模擬多用戶同時操作
4. **邊界測試**：測試網路延遲和異常情況

### 預防措施
1. **監控告警**：設置重複托盤編號告警
2. **日誌分析**：定期檢查生產環境日誌
3. **性能監控**：監控 RPC 函數執行時間
4. **環境一致性**：確保開發和生產環境配置一致

### 影響評估
- **功能影響**：無負面影響，增強了系統穩定性
- **性能影響**：輕微增加處理時間（約 1-2 秒），但大幅提升可靠性
- **用戶體驗**：減少錯誤發生，提升用戶信心
- **維護成本**：增加了調試信息，便於問題排查

### 後續優化建議
1. **數據庫優化**：考慮使用數據庫層面的序列號生成
2. **架構改進**：評估使用分佈式鎖機制
3. **監控完善**：建立完整的性能和錯誤監控體系
4. **文檔更新**：持續更新操作手冊和故障排除指南

---

## 原有功能文檔

### 主要組件
- `PerformanceOptimizedForm.tsx`: 主要表單組件
- `useQcLabelBusiness.tsx`: 業務邏輯 Hook
- `qcActions.ts`: 服務端操作

### 核心功能
1. **產品信息管理**
2. **托盤編號生成**
3. **PDF 標籤生成**
4. **數據庫記錄創建**
5. **ACO 訂單處理**
6. **Slate 產品處理**

### 數據流程
1. 用戶輸入產品信息
2. 驗證表單數據
3. 生成唯一托盤編號
4. 創建 PDF 標籤
5. 保存數據庫記錄
6. 更新相關訂單信息

## 概述

QC 標籤列印系統是用於生成和列印產品品質控制標籤的核心功能模組。系統支援正常產品、ACO 產品和 Slate 產品的標籤生成，具備自動化的棧板號碼生成、系列號生成、PDF 文件處理和庫存管理功能。

## 系統架構

### 主要頁面
- `/print-label`: QC 標籤列印的主頁面，提供完整的標籤生成工作流程

### 核心組件結構

#### 主表單組件
- `app/components/qc-label-form/PerformanceOptimizedForm.tsx`: 主表單組件，負責使用者輸入處理和流程控制
- `app/components/qc-label-form/ProductSection.tsx`: 產品資訊輸入區塊
- `app/components/qc-label-form/ProgressSection.tsx`: 標籤列印進度顯示區塊

#### 對話框組件
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 操作員身份確認對話框
- `app/components/qc-label-form/ErrorBoundary.tsx`: 錯誤邊界處理組件

#### 表單元件
- `app/components/qc-label-form/EnhancedFormField.tsx`: 包含 EnhancedInput 和 EnhancedSelect 的增強表單欄位
- `app/components/qc-label-form/EnhancedProgressBar.tsx`: 現代化進度條組件
- `app/components/qc-label-form/ResponsiveLayout.tsx`: 響應式卡片佈局組件

#### 業務邏輯 Hooks
- `app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`: QC 標籤生成的核心業務邏輯
- `app/components/qc-label-form/hooks/useFormValidation.tsx`: 表單驗證邏輯
- `app/components/qc-label-form/hooks/useErrorHandler.tsx`: 統一錯誤處理機制

#### 服務層
- `app/components/qc-label-form/services/ErrorHandler.ts`: 錯誤處理服務
- `app/components/qc-label-form/services/`: 其他業務服務

## 數據流向

### 資料庫表結構
- `record_palletinfo`: 棧板基本資訊儲存
- `record_history`: 操作歷史記錄
- `data_code`: 產品代碼資料
- `record_inventory`: 庫存數量管理
- `data_id`: 操作員身份驗證

### 儲存系統
- Supabase Storage `qc-labels` bucket: QC 標籤 PDF 檔案儲存
- Supabase Storage `pallet-label-pdf` bucket: 棧板標籤 PDF 檔案儲存

## 工作流程

### 1. 使用者輸入階段
- 操作員在 PerformanceOptimizedForm 中輸入產品代碼、數量等資訊
- 系統進行即時表單驗證
- 支援 ACO 和 Slate 產品的特殊欄位輸入

### 2. 身份驗證階段
- 提交表單前彈出 ClockNumberConfirmDialog
- 要求操作員輸入工號進行身份驗證
- 驗證通過後啟動標籤生成流程

### 3. 資料準備階段
useQcLabelBusiness Hook 執行以下操作：
- `generatePalletNumbers()`: 生成棧板號碼，格式為 `ddMMyy/N`
- `generateMultipleUniqueSeries()`: 生成系列號，格式為 `ddMMyy-XXXXXX`
- `prepareQcLabelData()`: 準備 PDF 生成所需的標籤資料

### 4. 批量處理階段
系統逐個處理每個棧板：
- 插入 `record_palletinfo` 記錄棧板基本資訊
- 插入 `record_history` 記錄操作歷史
- 根據產品類型自動處理庫存更新

### 5. PDF 生成與儲存階段
- `generateAndUploadPdf()` 根據準備的資料生成 QC 標籤 PDF
- 自動上傳 PDF 到 Supabase Storage 的 `qc-labels` 路徑
- 支援多個 PDF 的合併處理

### 6. 列印觸發階段
- `mergeAndPrintPdfs()` 合併多個 PDF（如需要）
- 觸發瀏覽器列印對話框
- 使用者確認後執行實際列印

### 7. 進度監控與錯誤處理
- ProgressSection 和 EnhancedProgressBar 即時顯示處理狀態
- 錯誤分級處理（Critical/High/Medium/Low）
- 友好的錯誤訊息顯示
- 錯誤記錄到資料庫

## 技術實現

### 前端技術
- React 組件化架構設計
- Tailwind CSS 現代化 UI 框架
- 玻璃擬態設計風格
- 響應式設計支援
- TypeScript 類型安全

### 後端整合
- Supabase 作為後端服務
- 資料庫操作透過 Supabase Client
- 檔案儲存使用 Supabase Storage
- PDF 生成透過專用 API 服務

### UI 設計特色
- 深藍色/深色主題
- 動態漸層背景與網格紋理
- 半透明背景與背景模糊效果
- 邊框光效與懸停互動
- 現代化按鈕設計與載入動畫
- 清晰的視覺回饋系統

## API 端點

### PDF 生成 API
- `app/api/print-label-pdf/`: QC 標籤 PDF 生成服務
- 支援批量 PDF 生成
- 自動檔案上傳與管理

### 資料查詢 API
- 產品代碼驗證
- 庫存數量查詢
- 操作員身份驗證

## 配置要求

### 環境變數
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 專案 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服務角色金鑰

### 權限設定
- 資料庫表讀寫權限
- Supabase Storage bucket 存取權限
- PDF 生成服務權限

## 支援的產品類型

### 正常產品
- 標準 QC 標籤格式
- 自動庫存扣減
- 標準棧板號碼生成

### ACO 產品
- 包含訂單參考資訊
- 特殊標籤格式
- 客戶特定要求處理

### Slate 產品
- Slate 專用標籤格式
- 特殊產品描述處理
- 客製化標籤內容

## 效能優化

### 前端優化
- 組件懶載入
- 表單狀態優化
- 進度條效能優化
- 錯誤邊界保護

### 後端優化
- 批量資料庫操作
- PDF 生成快取
- 檔案上傳優化
- 查詢效能優化

## 系統更新記錄

### 2025-06-09: 托盤編號重複問題修復（與 GRN 標籤同步修復）

#### 問題背景
在修復 GRN 標籤的托盤編號重複問題時，同時檢查並優化了 QC 標籤系統的托盤編號生成機制，確保兩個系統使用一致的防重複策略。

#### QC 標籤系統現狀
- ✅ **已使用原子性 RPC 函數**: QC 標籤系統已經使用 `generate_atomic_pallet_numbers_v2` 確保原子性
- ✅ **單次調用策略**: 使用單次 RPC 調用生成所有需要的托盤編號，避免循環調用
- ✅ **防重複提交機制**: 在 `useQcLabelBusiness` hook 中實施了防重複提交機制

#### 同步優化措施

##### 1. 防重複提交機制強化
```typescript
// 在 useQcLabelBusiness hook 中
const [isProcessing, setIsProcessing] = useState(false);

const handleSubmit = async () => {
  if (isProcessing) {
    console.log('[QC] 正在處理中，忽略重複提交');
    return;
  }
  
  setIsProcessing(true);
  try {
    // 執行標籤生成邏輯
  } finally {
    // 3 秒冷卻期，防止快速重複提交
    setTimeout(() => setIsProcessing(false), 3000);
  }
};
```

##### 2. 托盤編號生成優化
```typescript
// 確保使用單次 RPC 調用
const generatePalletNumbers = async (count: number) => {
  console.log(`[qcActions] 使用原子性 RPC 生成 ${count} 個托盤編號`);
  
  const { data: result, error } = await supabase.rpc('generate_atomic_pallet_numbers_v2', {
    count: count
  });
  
  if (error) throw error;
  return result;
};
```

##### 3. 錯誤處理增強
- 添加重複托盤編號檢測
- 增強錯誤日誌記錄
- 提供更友好的錯誤訊息

#### 一致性保證
1. **相同的 RPC 函數**: QC 和 GRN 標籤都使用 `generate_atomic_pallet_numbers_v2`
2. **相同的防護機制**: 兩個系統都實施防重複提交和錯誤處理
3. **相同的日誌格式**: 統一的日誌記錄便於問題診斷
4. **相同的測試標準**: 確保兩個系統都通過重複列印測試

#### 測試結果
- ✅ QC 標籤第一次列印：正常生成唯一托盤編號
- ✅ QC 標籤第二次列印：正常生成新的唯一托盤編號
- ✅ QC 標籤併發測試：無重複編號產生
- ✅ 與 GRN 標籤交叉測試：兩系統托盤編號不衝突

#### 預防性改進
1. **統一的托盤編號生成服務**: 考慮將托盤編號生成邏輯抽取為共用服務
2. **監控儀表板**: 建立托盤編號生成監控，及時發現異常
3. **自動化測試**: 建立定期的重複列印測試，確保系統穩定性
4. **文檔同步**: 確保 QC 和 GRN 標籤文檔保持一致性

#### 技術債務清理
- 移除了所有臨時測試文檔
- 統一了兩個系統的錯誤處理模式
- 標準化了日誌記錄格式
- 優化了代碼註釋和文檔 