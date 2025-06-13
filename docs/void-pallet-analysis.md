# Void Pallet 功能分析報告

## 1. 功能概述

Void Pallet（作廢托盤）係倉庫管理系統中嘅重要功能，用嚟處理需要作廢嘅托盤。呢個功能可以處理各種作廢原因，包括損壞、標籤錯誤、數量錯誤等。

## 2. 當前工作流程

### 2.1 搜尋托盤
1. 用戶可以通過以下方式搜尋托盤：
   - 掃描 QR Code（Series）
   - 輸入托盤編號（Pallet Number）
   - 自動檢測輸入類型

2. 搜尋時會檢查：
   - 托盤是否存在
   - 托盤是否已經作廢
   - 從 `record_history` 獲取最新位置

### 2.2 作廢流程
1. **選擇作廢原因**
   - Print Extra Label（額外列印）
   - Wrong Label（標籤錯誤）
   - Wrong Qty（數量錯誤）
   - Wrong Product Code（產品代碼錯誤）
   - Damage（損壞）- 需要輸入損壞數量
   - Used Material（已使用材料）
   - Other（其他）

2. **密碼驗證**
   - 使用 Supabase Auth 驗證用戶密碼
   - 確保操作安全性

3. **執行作廢**
   - 更新托盤備註（plt_remark）
   - 更新庫存（record_inventory）
   - 記錄歷史（record_history）
   - 更新庫存水平（stock_level）
   - 處理特殊托盤類型

### 2.3 特殊托盤處理

#### ACO Order Pallet（ACO 訂單托盤）
- 識別：plt_remark 包含 "ACO Ref: XXXXXX"
- 作廢時更新 `record_aco` 表的 remain_qty
- ACO 托盤不支援部分損壞
- 作廢後不需要重印

#### Material GRN Pallet（物料 GRN 托盤）
- 識別：plt_remark 包含 "Material GRN - XXXXXX"
- 作廢時刪除 `record_grn` 表中的相關記錄

### 2.4 重印功能
對於某些作廢原因，系統會自動觸發重印流程：
- **Wrong Label**：重印正確標籤
- **Wrong Qty**：重印正確數量
- **Wrong Product Code**：重印正確產品代碼
- **Damage（部分損壞）**：為剩餘數量重印新標籤

## 3. 數據流分析

### 3.1 數據庫表結構

```
record_palletinfo
├── plt_num (托盤編號)
├── product_code (產品代碼)
├── product_qty (數量)
├── series (系列號/QR碼)
├── plt_remark (備註)
└── generate_time (生成時間)

record_history
├── time (時間)
├── id (用戶ID)
├── action (動作)
├── plt_num (托盤編號)
├── loc (位置)
└── remark (備註)

record_inventory
├── product_code
├── [location columns] (injection, pipeline, await等)
├── damage (損壞數量)
├── latest_update
└── plt_num

stock_level
├── stock (產品代碼)
├── stock_level (庫存水平)
└── update_time
```

### 3.2 數據流程
1. **搜尋階段**
   - 從 `record_palletinfo` 獲取托盤基本信息
   - 從 `record_history` 獲取最新位置

2. **作廢執行**
   - 更新 `record_palletinfo` 的 plt_remark
   - 插入 `record_inventory` 記錄庫存變化
   - 調用 `update_stock_level_void` RPC 更新總庫存
   - 插入 `record_history` 記錄操作
   - 插入 `report_void` 記錄作廢報告

## 4. 現有問題分析

### 4.1 用戶體驗問題
1. **搜尋功能**
   - 自動檢測有時不準確
   - 錯誤訊息不夠友好
   - 缺乏搜尋歷史
   - 搜尋結果缺乏排序和過濾

2. **操作流程**
   - 作廢流程步驟較多
   - 缺乏操作確認和撤銷機制
   - 狀態反饋不夠即時

### 4.2 技術問題
1. **性能問題**
   - 多個異步操作可能導致延遲
   - 缺乏批量作廢功能
   - 重印過程較慢（30秒超時）

2. **數據一致性**
   - 部分操作失敗時缺乏完整的回滾機制
   - stock_level 更新失敗不會中斷主流程

3. **代碼結構**
   - actions.ts 文件過長（1165行）
   - 部分邏輯重複
   - 錯誤處理不統一

### 4.3 功能限制
1. **缺乏批量處理**
   - 只能逐個作廢托盤
   - 無法批量處理損壞托盤

2. **報告功能不足**
   - 缺乏作廢統計報告
   - 無法追蹤作廢趨勢

3. **權限控制**
   - 只有密碼驗證，缺乏角色權限

## 5. 改進建議

### 5.1 用戶體驗改進

#### 5.1.1 介面優化
```typescript
// 建議的介面改進
interface UIImprovements {
  // 快捷操作
  quickActions: {
    commonReasons: ['Damage', 'Wrong Label', 'Wrong Qty'], // 常用原因快捷按鈕
    recentPallets: true, // 最近掃描的托盤
    favoriteSearches: true // 收藏的搜尋
  },
  
  // 操作流程優化
  workflow: {
    stepIndicator: true, // 步驟指示器
    autoFocusNext: true, // 自動跳到下一個輸入框
    confirmationModal: true // 確認對話框
  },
  
  // 即時反饋
  feedback: {
    loadingStates: 'detailed', // 詳細的加載狀態
    progressBar: true, // 進度條
    successAnimation: true // 成功動畫
  }
}
```

#### 5.1.2 搜尋優化
- 添加搜尋歷史功能
- 改進自動檢測算法
- 提供搜尋建議

### 5.2 功能增強

#### 5.2.1 批量作廢功能
```typescript
// 建議的批量作廢介面
interface BatchVoidFeature {
  // 批量掃描
  batchScan: {
    maxItems: 50,
    confirmBeforeExecute: true,
    showProgress: true
  },
  
  // 批量原因
  batchReasons: {
    allowDifferentReasons: false,
    requireSinglePassword: true
  },
  
  // 批量報告
  batchReport: {
    generateSummary: true,
    emailNotification: true
  }
}
```

#### 5.2.2 智能損壞處理
```typescript
// 建議的損壞處理改進
interface DamageHandling {
  // 快速損壞模式
  quickDamage: {
    presetQuantities: [1, 5, 10, '全部'],
    photoCapture: true,
    damageLocation: string
  },
  
  // 損壞分析
  damageAnalytics: {
    trackByProduct: true,
    trackByLocation: true,
    monthlyReport: true
  }
}
```

### 5.3 技術架構改進

#### 5.3.1 代碼重構
```typescript
// 建議的服務分層
services/
├── voidService.ts       // 核心作廢邏輯
├── searchService.ts     // 搜尋邏輯
├── inventoryService.ts  // 庫存更新
├── reprintService.ts    // 重印邏輯
└── specialPalletService.ts // ACO/GRN處理
```

#### 5.3.2 性能優化
- 實施樂觀更新（Optimistic Updates）
- 添加快取層
- 使用 WebSocket 實時更新

#### 5.3.3 數據一致性
```typescript
// 建議的事務處理
async function executeVoidWithTransaction(params: VoidParams) {
  const client = await getTransactionClient();
  
  try {
    await client.query('BEGIN');
    
    // 所有數據庫操作
    await updatePalletInfo(client, params);
    await updateInventory(client, params);
    await updateStockLevel(client, params);
    await recordHistory(client, params);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
```

### 5.4 新功能建議

#### 5.4.1 作廢分析儀表板
- 每日/每週/每月作廢統計
- 按原因分類的圖表
- 按產品分類的損壞趨勢
- 員工作廢操作記錄

#### 5.4.2 預防性功能
- 高風險托盤預警
- 重複作廢模式檢測
- 自動建議改進措施

#### 5.4.3 整合功能
- 與生產系統整合，追蹤品質問題
- 與採購系統整合，自動補貨
- 與財務系統整合，計算損失

### 5.5 環保建材公司特定改進

考慮到公司背景（環保建材製造）：

1. **環保追蹤功能**
   - 廢料回收記錄和追蹤
   - 環保處理證明生成
   - 材料損耗分析報告
   - 可持續發展指標追蹤

2. **品質管理整合**
   - 損壞原因分類（生產缺陷、運輸損壞、存儲問題）
   - 與生產批次關聯
   - 品質改進建議
   - 供應商品質追蹤

3. **成本分析**
   - 作廢成本實時計算
   - 按產品類別的損耗統計
   - 月度/季度成本報告
   - ROI 分析（減少作廢的投資回報）

## 6. 實施優先級

### 第一階段（1-2週）
1. 優化搜尋功能和自動檢測
2. 改進錯誤訊息和狀態反饋
3. 添加操作確認機制

### 第二階段（3-4週）
1. 實施批量作廢功能
2. 優化搜尋功能
3. 添加作廢統計報告

### 第三階段（5-6週）
1. 代碼重構和性能優化
2. 實施事務處理
3. 添加分析儀表板

## 7. 總結

Void Pallet 功能是倉庫管理的關鍵組件，當前實現已經涵蓋基本需求，但在性能、功能豐富度和數據分析方面仍有改進空間。通過上述改進，可以：

1. **提升操作效率**：批量處理、快捷操作、智能搜尋
2. **加強數據分析**：作廢趨勢、成本分析、品質追蹤
3. **優化系統架構**：代碼重構、性能提升、數據一致性
4. **支援業務決策**：環保追蹤、成本控制、品質改進

這些改進將使系統更加專業化和智能化，為環保建材公司提供更強大的倉庫管理能力。