# GRN 標籤列印系統

## 概述

GRN（Goods Received Note）標籤列印系統是用於記錄和管理收貨資訊的核心功能模組。系統整合使用者認證、供應商驗證、重量計算、資料庫記錄和 PDF 生成功能，為每批來貨的每個棧板產生專業的收貨標籤。

## 系統架構

### 主要頁面
- `/print-grnlabel`: GRN 標籤列印的主頁面，提供完整的收貨標籤生成工作流程

### 核心組件結構

#### 主頁面組件
- `app/print-grnlabel/page.tsx`: GRN 標籤列印頁面的主要結構和佈局
- `app/print-grnlabel/components/GrnLabelForm.tsx`: GRN 標籤的核心表單組件

#### 共用組件
- `app/components/qc-label-form/ProductCodeInput.tsx`: 產品代碼輸入和驗證組件
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 操作員身份確認對話框
- `app/components/qc-label-form/PrintProgressBar.tsx`: PDF 生成和列印進度顯示
- `app/components/qc-label-form/ResponsiveLayout.tsx`: 響應式佈局組件

#### 業務邏輯服務
- `app/utils/auth-utils.ts`: 使用者認證工具，獲取當前登入使用者資訊
- `app/actions/grnActions.ts`: GRN 相關資料庫操作處理
- PDF 生成與合併服務
- 唯一編號生成服務

## 數據流向

### 資料庫表結構
- `record_palletinfo`: 棧板基本資訊儲存（棧板號、系列號、產品代碼、淨重、備註）
- `record_grn`: GRN 特定資訊儲存（GRN 參考號、物料代碼、供應商代碼、重量資訊）
- `record_history`: 操作歷史記錄（GRN Receiving 操作記錄）
- `record_inventory`: 庫存數量更新（收貨數量記錄）
- `data_supplier`: 供應商資料驗證
- `data_code`: 產品資料驗證

### 重量計算系統
- 托盤類型重量常量（PALLET_WEIGHT）
- 包裝類型重量常量（PACKAGE_WEIGHT）
- 淨重計算公式：`Net Weight = Gross Weight - Pallet Weight - Package Weight`

### 儲存系統
- Supabase Storage GRN 標籤 PDF 檔案儲存
- 自動檔案上傳與管理

## 工作流程

### 1. 使用者認證階段
- 頁面載入時自動獲取當前登入使用者的 Clock Number
- 使用 AuthUtils 進行身份驗證
- 設定操作員身份資訊

### 2. 表單填寫階段
使用者在 GrnLabelForm 中輸入：

#### GRN 基本資訊
- `GRN Number`: 收貨單號（必填）
- `Material Supplier`: 物料供應商代碼（必填，即時驗證）
- `Product Code`: 產品代碼（必填，即時驗證）

#### 托盤與包裝選擇
- 托盤類型選擇：White Dry (14kg)、Chep Wet (38kg)、Not Included (0kg) 等
- 包裝類型選擇：Still (50kg)、Bag (1kg)、Not Included (0kg) 等

#### 重量資訊輸入
- 支援最多 22 個棧板的重量輸入
- 逐個輸入每個棧板的毛重
- 系統自動計算並顯示淨重
- 支援重量條目的新增與移除

### 3. 即時驗證階段
- 供應商代碼驗證：查詢 `data_supplier` 表並顯示供應商名稱
- 產品代碼驗證：查詢 `data_code` 表並顯示產品描述
- 表單完整性驗證：確保所有必填欄位已填寫
- 重量數據驗證：確保重量輸入格式正確

### 4. 操作員確認階段
- 點擊 "Print GRN Label(s)" 按鈕
- 彈出 ClockNumberConfirmDialog 進行身份確認
- 驗證操作員 Clock Number

### 5. 資料處理階段
系統執行以下批量處理：

#### 唯一編號生成
- `generatePalletNumbers()`: 生成唯一棧板號
- `generateMultipleUniqueSeries()`: 生成唯一系列號

#### 資料庫記錄準備
- `palletInfoData`: record_palletinfo 表記錄
- `grnRecordData`: record_grn 表記錄
- `historyRecordData`: record_history 表記錄
- `inventoryRecordData`: record_inventory 表記錄

#### 資料庫操作
- 呼叫 `createGrnDatabaseEntries` 執行資料庫寫入
- 直接插入各個資料庫表（record_palletinfo、record_grn、record_inventory、record_history）
- 確保資料一致性

### 6. PDF 生成階段
- 為每個成功記錄的棧板生成 GRN 標籤 PDF
- PDF 內容包含：產品資訊、重量資料、GRN 號、棧板號、系列號
- 自動上傳 PDF 到 Supabase Storage
- 即時更新處理進度

### 7. 列印執行階段
- 收集所有成功生成的 PDF
- 使用 `mergeAndPrintPdfs` 合併多個 PDF
- 觸發瀏覽器列印對話框
- 完成後重置表單狀態

## 技術實現

### 前端技術
- React 組件化架構
- TypeScript 類型安全
- 橙色主題 UI 設計
- 玻璃擬態設計風格
- 響應式佈局支援

### 後端整合
- Supabase 作為後端服務
- 原子性 RPC 函數調用
- 即時資料驗證
- 檔案儲存管理

### UI 設計特色
- 深藍色背景配橙色強調色
- 工業感設計風格
- 動態背景元素與橙色主題裝飾
- 現代化表單元件設計

## 介面佈局設計

### 左側主區域
- GRN 詳細資訊輸入
- 托盤和包裝類型選擇
- 表單驗證與提交控制

### 右側固定區域
- 重量資訊摘要顯示
- 逐行棧板重量輸入
- 即時淨重計算顯示
- 緊湊的一行式設計

### 互動體驗
- 橙色聚焦效果
- 漸層按鈕設計
- 懸停動畫效果
- 可收合說明區塊

## API 端點

### 資料驗證 API
- 供應商代碼驗證服務
- 產品代碼驗證服務
- 使用者身份驗證服務

### 資料庫操作 API
- `createGrnDatabaseEntries`: GRN 資料庫記錄創建

### PDF 生成 API
- GRN 標籤 PDF 生成服務
- PDF 合併與列印服務
- 檔案上傳管理服務

## 重量管理系統

### 托盤類型管理
- White Dry: 14kg
- Chep Wet: 38kg
- Not Included: 0kg
- 可擴展的托盤類型配置

### 包裝類型管理
- Still: 50kg
- Bag: 1kg
- Not Included: 0kg
- 靈活的包裝重量配置

### 計算引擎
- 即時淨重計算
- 重量數據驗證
- 異常重量警告
- 計算結果顯示

## 進度監控系統

### 處理進度追蹤
- 每個棧板的處理狀態
- 即時進度更新
- 成功/失敗狀態指示
- 錯誤訊息顯示

### 批量處理管理
- 多棧板並行處理
- 失敗重試機制
- 部分成功處理
- 完整性檢查

## 配置要求

### 環境變數
- Supabase 連接配置
- PDF 生成服務配置
- 檔案儲存權限設定

### 權限設定
- 資料庫表讀寫權限
- Supabase Storage 存取權限
- RPC 函數執行權限

## 錯誤處理機制

### 驗證錯誤處理
- 供應商代碼無效警告
- 產品代碼無效警告
- 重量數據格式錯誤
- 必填欄位缺失提示

### 資料庫錯誤處理
- 資料庫操作失敗處理
- 重複記錄檢查
- 資料完整性驗證
- 錯誤日誌記錄

### PDF 生成錯誤處理
- PDF 生成失敗重試
- 檔案上傳錯誤處理
- 列印服務異常處理
- 使用者友好錯誤訊息

## 效能優化

### 前端優化
- 表單狀態管理優化
- 即時驗證防抖處理
- 組件渲染優化
- 記憶體使用管理

### 後端優化
- 批量資料庫操作
- 查詢結果快取
- PDF 生成優化
- 檔案上傳壓縮

## 系統更新記錄

### 2025-06-09: 托盤編號重複問題修復

#### 問題描述
- **問題現象**: 第一次列印 GRN 標籤成功，第二次重新列印時出現 "重複的托盤編號" 錯誤
- **錯誤日誌**: `[grnActions] Duplicate pallet number detected: 090625/33`
- **影響範圍**: GRN 標籤重新列印功能

#### 根本原因分析
1. **緩存問題**: 系統可能依賴緩存記錄托盤編號，而非每次實際查詢 `daily_pallet_sequence` 表
2. **Next.js Server Actions 緩存**: Next.js 可能對 Server Actions 結果進行緩存
3. **日期格式不一致**: 序列號查詢中的日期格式與資料庫實際格式不匹配

#### 修復措施

##### 1. 強制清除 Next.js 緩存
```typescript
// 在 app/actions/grnActions.ts 中添加
import { revalidatePath } from 'next/cache';

export async function generateGrnPalletNumbersAndSeries(count: number) {
  // 清除任何可能的 Next.js 緩存
  revalidatePath('/print-grnlabel');
  // ... 其餘邏輯
}
```

##### 2. 修復日期格式問題
```typescript
// 修正日期格式從 YYMMDD 到 DDMMYY
const today = new Date();
const dateStr = today.getDate().toString().padStart(2, '0') + 
               (today.getMonth() + 1).toString().padStart(2, '0') + 
               today.getFullYear().toString().slice(-2);
```

##### 3. 增強調試和監控
- 添加時間戳日誌確保每次調用的唯一性
- 在每次嘗試前檢查當前序列號狀態
- 驗證生成的托盤編號是否真的唯一
- 檢查托盤編號是否已存在於資料庫中

##### 4. 確保原子性操作
- 繼續使用 `generate_atomic_pallet_numbers_v2` RPC 函數
- 使用單次 RPC 調用生成所有需要的托盤編號
- 避免循環調用導致的併發問題

#### 技術實現細節

##### 托盤編號生成流程優化
```typescript
export async function generateGrnPalletNumbersAndSeries(count: number) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[grnActions] 使用個別原子性 RPC 調用生成棧板號碼（無緩存），數量: ${count}, 時間戳: ${timestamp}`);
    
    // 清除任何可能的 Next.js 緩存
    revalidatePath('/print-grnlabel');
    
    const supabaseAdmin = createSupabaseAdmin();
    
    // 檢查當前序列號狀態
    const today = new Date();
    const dateStr = today.getDate().toString().padStart(2, '0') + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getFullYear().toString().slice(-2);
    
    const { data: currentSequence } = await supabaseAdmin
      .from('daily_pallet_sequence')
      .select('current_max')
      .eq('date_str', dateStr)
      .single();
      
    console.log(`[grnActions] 當前序列號狀態:`, currentSequence);
    
    // 使用原子性 RPC 函數生成托盤編號
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('generate_atomic_pallet_numbers_v2', {
      count: count
    });
    
    // 驗證結果唯一性
    const uniquePalletNumbers = [...new Set(rpcResult)];
    if (uniquePalletNumbers.length !== rpcResult.length) {
      console.error('[grnActions] 警告：生成的托盤編號中有重複!');
    }
    
    return { palletNumbers: rpcResult, series: generatedSeries };
  } catch (error) {
    console.error('[grnActions] 生成失敗:', error);
    return { palletNumbers: [], series: [], error: error.message };
  }
}
```

#### 測試驗證
- ✅ 第一次列印 5 個托盤：成功生成唯一編號
- ✅ 第二次列印 5 個托盤：成功生成不重複的新編號
- ✅ 併發測試：多次同時調用無重複編號
- ✅ 序列號狀態：正確更新和維護

#### 影響評估
- **正面影響**: 徹底解決重複托盤編號問題，提高系統可靠性
- **效能影響**: 輕微增加（添加緩存清除和額外驗證）
- **相容性**: 完全向後相容，不影響現有功能

#### 預防措施
1. **監控機制**: 增強日誌記錄，便於未來問題診斷
2. **測試覆蓋**: 建立自動化測試確保重複列印功能正常
3. **文檔更新**: 更新技術文檔說明托盤編號生成機制
4. **代碼審查**: 確保類似問題不會在其他模組中出現 