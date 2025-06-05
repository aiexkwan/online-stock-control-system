# 🔄 Void Pallet 重印邏輯優化

## 📅 優化日期
2025年1月3日

## 🎯 優化目標

針對 VOID PALLET 系統的重印邏輯進行優化，改善用戶體驗並確保業務邏輯的正確性。

## 📋 問題分析

### 用戶反饋的問題

1. **Wrong Label 重印不夠靈活**：
   - ❌ 自動重印 API 視窗沒有提供 product code 及 qty 欄供用戶修改
   - ❌ 用戶無法快速修正標籤上的錯誤信息

2. **Damage 重印邏輯不完善**：
   - ❌ 完全損壞時仍顯示重印視窗（不需要）
   - ❌ ACO pallet 部分損壞時顯示重印視窗（ACO 不支援部分損壞）

### 業務需求

1. **Wrong Label**：提供可編輯的 product code 和 quantity 欄位
2. **Damage**：只有部分損壞且非 ACO pallet 才顯示重印視窗
3. **ACO pallet**：不支援部分損壞，如有損壞需全數銷毀

## 🔧 技術實現

### 1. Wrong Label 重印優化

#### A. 新增 wrong_label 類型

**修改文件**：`app/void-pallet/types.ts`
```typescript
export interface ReprintInfoInput {
  type: 'damage' | 'wrong_qty' | 'wrong_code' | 'wrong_label'; // 🔥 新增 wrong_label
  originalPalletInfo: PalletInfo;
  // For wrong_label: user inputs both correct product code and quantity
  correctedQuantity?: number;
  correctedProductCode?: string;
  remainingQuantity?: number;
}
```

#### B. 更新重印類型映射

**修改文件**：`app/void-pallet/hooks/useVoidPallet.ts`
```typescript
const getReprintType = useCallback((voidReason: string): 'damage' | 'wrong_qty' | 'wrong_code' | 'wrong_label' => {
  switch (voidReason) {
    case 'Damage':
      return 'damage';
    case 'Wrong Qty':
      return 'wrong_qty';
    case 'Wrong Product Code':
      return 'wrong_code';
    case 'Wrong Label':
      return 'wrong_label'; // 🔥 新增：專門的類型
    default:
      return 'damage';
  }
}, []);
```

#### C. 優化重印對話框

**修改文件**：`app/void-pallet/components/ReprintInfoDialog.tsx`

**新增功能**：
- ✅ 支援 `wrong_label` 類型
- ✅ 同時顯示 Product Code 和 Quantity 輸入欄
- ✅ 預填當前值供用戶修改
- ✅ 允許相同的 Product Code（標籤格式問題）

```typescript
// Wrong Label 配置
case 'wrong_label':
  return {
    title: 'Correct Label Information and Reprint',
    description: 'Please verify and correct the product code and quantity for the new pallet label.',
    icon: <Printer className="h-5 w-5 text-purple-500" />,
    badge: 'Wrong Label',
    badgeVariant: 'secondary' as const
  };
```

### 2. Damage 重印邏輯優化

#### A. ACO pallet 部分損壞檢查

**修改文件**：`app/void-pallet/actions.ts`
```typescript
export async function processDamageAction(params: Omit<VoidParams, 'userId'>): Promise<VoidResult> {
  // 🔥 新增：檢查 ACO pallet 是否支援部分損壞
  const acoCheck = isACOOrderPallet(palletInfo.plt_remark);
  const isPartialDamage = damageQuantity < palletInfo.product_qty;
  
  if (acoCheck.isACO && isPartialDamage) {
    return {
      success: false,
      error: 'ACO Order Pallets do not support partial damage. If damaged, the entire pallet must be voided.'
    };
  }
  
  // ... 其他邏輯
  
  // 🔥 修改：ACO pallet 或完全損壞不需要重印
  if (isFullDamage || acoCheck.isACO) {
    return { 
      success: true, 
      message: `Pallet ${palletInfo.plt_num} ${isFullDamage ? 'fully damaged' : 'voided'}. No reprint needed.`,
      remainingQty: 0,
      requiresReprint: false // 🔥 明確設定不需要重印
    };
  }
}
```

#### B. 重印對話框顯示邏輯

**修改文件**：`app/void-pallet/hooks/useVoidPallet.ts`
```typescript
const shouldShowReprintDialog = useCallback((voidReason: string, result: any, palletInfo: PalletInfo): boolean => {
  // 🔥 修改：檢查是否為 ACO pallet
  const isACOPallet = palletInfo.plt_remark?.includes('ACO Ref');
  
  // 🔥 修改：ACO pallet 不顯示重印對話框
  if (isACOPallet) {
    return false;
  }
  
  // 🔥 修改：完全損壞不顯示重印對話框
  if (voidReason === 'Damage' && result.remainingQty === 0) {
    return false;
  }
  
  // 只有在選擇了特定的作廢原因後才顯示重印對話框
  const reprintReasons = ['Wrong Label', 'Wrong Qty', 'Wrong Product Code', 'Damage'];
  return reprintReasons.includes(voidReason) && result.success;
}, []);
```

## 📊 優化對比

### Wrong Label 重印流程

| 項目 | 優化前 | 優化後 |
|------|--------|--------|
| **輸入欄位** | 無法修改 | 可編輯 Product Code 和 Quantity |
| **用戶體驗** | 需要重新輸入所有信息 | 預填當前值，快速修正 |
| **驗證邏輯** | 嚴格檢查 | 允許相同 Product Code（標籤格式問題） |

### Damage 重印邏輯

| 情況 | 優化前 | 優化後 |
|------|--------|--------|
| **普通托盤部分損壞** | 顯示重印對話框 ✅ | 顯示重印對話框 ✅ |
| **普通托盤完全損壞** | 顯示重印對話框 ❌ | 不顯示重印對話框 ✅ |
| **ACO pallet 部分損壞** | 允許操作 ❌ | 拒絕操作 ✅ |
| **ACO pallet 完全損壞** | 顯示重印對話框 ❌ | 不顯示重印對話框 ✅ |

## 🧪 測試驗證

### 測試腳本
```bash
# 執行重印邏輯優化測試
psql "DATABASE_URL" -f scripts/test-void-pallet-reprint-optimization.sql
```

### 測試案例

1. **Wrong Label 測試**
   - ✅ 顯示可編輯的 Product Code 欄位
   - ✅ 顯示可編輯的 Quantity 欄位
   - ✅ 允許相同的 Product Code

2. **部分損壞測試**
   - ✅ 普通托盤：顯示重印對話框
   - ✅ ACO pallet：拒絕操作並顯示錯誤訊息

3. **完全損壞測試**
   - ✅ 不顯示重印對話框
   - ✅ 直接完成作廢操作

4. **重印類型映射測試**
   - ✅ Wrong Label → wrong_label
   - ✅ Wrong Qty → wrong_qty
   - ✅ Wrong Product Code → wrong_code
   - ✅ Damage → damage

## 📈 業務價值

### 1. 用戶體驗提升
- **快速修正**：Wrong Label 時可直接修改錯誤信息
- **減少步驟**：預填當前值，減少重複輸入
- **清晰流程**：不同情況有明確的處理邏輯

### 2. 業務邏輯正確性
- **ACO 規則**：確保 ACO pallet 不支援部分損壞
- **完全損壞**：避免不必要的重印操作
- **數據一致性**：確保操作符合業務規則

### 3. 系統穩定性
- **錯誤預防**：在操作前檢查業務規則
- **清晰反饋**：提供明確的錯誤訊息
- **邏輯分離**：不同類型的重印有獨立的處理邏輯

## ⚠️ 注意事項

### 部署要求
1. **前端更新**：需要部署更新後的組件和 hook
2. **後端邏輯**：需要部署更新後的 actions
3. **類型定義**：確保所有相關文件的類型一致

### 向後兼容性
- ✅ **完全兼容**：現有功能不受影響
- ✅ **漸進改善**：新邏輯只應用於新操作
- ✅ **錯誤處理**：保持原有的錯誤處理機制

### 用戶培訓
1. **Wrong Label**：告知用戶新的編輯功能
2. **ACO 規則**：說明 ACO pallet 的特殊限制
3. **操作流程**：更新操作手冊和培訓材料

## 🎉 總結

✅ **Wrong Label 優化**：提供可編輯的 product code 和 quantity 欄位  
✅ **Damage 邏輯改善**：只有部分損壞且非 ACO pallet 才顯示重印視窗  
✅ **ACO 規則實施**：ACO pallet 不支援部分損壞，確保業務規則正確性  
✅ **用戶體驗提升**：更直觀的操作流程和更好的錯誤處理  
✅ **測試覆蓋完整**：全面的測試案例確保功能正確性  

這次優化解決了用戶反饋的關鍵問題，提升了系統的易用性和業務邏輯的正確性，為更好的庫存管理提供了基礎。 