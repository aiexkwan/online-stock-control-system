# UserIdVerification 統一化重構記錄

_建立日期: 2025-08-29_  
_重構項目: 用戶ID驗證機制統一化_  
_影響範圍: 全系統前端組件_

## 重構概述

### 背景問題

在重構前，系統存在多套不同的用戶ID獲取方案：

1. **直接調用 Supabase Auth**
   - `supabase.auth.getUser()`
   - `supabase.auth.getSession()`
   - 問題：缺乏錯誤處理，沒有載入狀態管理

2. **各組件自定義實現**
   - `getUserId()` 函數
   - `getCurrentUserId()` 函數
   - 問題：重複代碼，維護困難，行為不一致

3. **混合使用模式**
   - 部分組件使用 Hook，部分使用函數調用
   - 問題：代碼風格不統一，難以追蹤和調試

### 統一化目標

- ✅ **單一真相來源**: 建立唯一的用戶ID獲取介面
- ✅ **一致性**: 統一錯誤處理和載入狀態管理
- ✅ **可維護性**: 集中管理，便於更新和修復
- ✅ **類型安全**: 完整的 TypeScript 支援

## 重構過程

### 第一階段：規劃 (2025-08-29)

**執行內容**：

1. 分析現有代碼，識別所有用戶ID獲取點
2. 設計統一的 `getUserId` Hook 架構
3. 制定漸進式遷移策略

**產出檔案**：

- `docs/PlanningDocument/UserIdVerification/UserIdVerification-Unification-Plan.md`

### 第二階段：實施 (2025-08-29)

**執行內容**：

1. 創建統一的 `getUserId` Hook
2. 更新所有 19 張管理卡片
3. 移除舊的實現方式

**修改的核心檔案**：

- `app/hooks/getUserId.ts` - 新增統一 Hook
- `app/(app)/admin/cards/*.tsx` - 19 張卡片全部更新
- `app/(app)/admin/components/UserIdVerificationDialog.tsx` - 整合新 Hook

**關鍵變更**：

```typescript
// 舊實現（多種方式）
const {
  data: { user },
} = await supabase.auth.getUser();
const userId = user?.id;

// 或
const getUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
};

// 新實現（統一方式）
import { getUserId } from '@/app/hooks/getUserId';

const { userId, loading, error } = getUserId();
```

### 第三階段：文檔 (2025-08-29)

**執行內容**：

1. 更新技術文檔
2. 建立遷移指南
3. 記錄變更歷史

**更新的文檔**：

- `docs/TechStack/FrontEnd.md` - 新增統一化 Hooks 章節
- `docs/TechStack/Secutiry.md` - 新增用戶ID驗證安全實施章節
- 本文檔 - 完整的重構記錄

## 遷移指南

### 對於開發者

#### 1. 遷移舊代碼

**如果您的代碼使用直接的 Supabase 調用**：

```typescript
// ❌ 不要這樣做
const {
  data: { user },
} = await supabase.auth.getUser();
const userId = user?.id;

// ✅ 改為這樣
import { getUserId } from '@/app/hooks/getUserId';

function YourComponent() {
  const { userId, loading, error } = getUserId();
  // ...
}
```

**如果您的代碼使用自定義函數**：

```typescript
// ❌ 不要這樣做
const getUserId = async () => {
  // 自定義邏輯
};

// ✅ 改為使用統一 Hook
import { getUserId } from '@/app/hooks/getUserId';
```

#### 2. 處理載入和錯誤狀態

```typescript
function YourComponent() {
  const { userId, loading, error } = getUserId();

  // 處理載入狀態
  if (loading) {
    return <div>Loading user information...</div>;
  }

  // 處理錯誤
  if (error) {
    console.error('Failed to get user ID:', error);
    return <div>Error loading user information</div>;
  }

  // 處理未登錄
  if (!userId) {
    return <div>Please login to continue</div>;
  }

  // 正常邏輯
  return <div>Welcome, user {userId}</div>;
}
```

#### 3. TypeScript 類型支援

```typescript
import { getUserId } from '@/app/hooks/getUserId';

// Hook 返回類型
interface UseUserIdReturn {
  userId: string | null;
  loading: boolean;
  error: Error | null;
}

// 在組件中使用
const MyTypedComponent: React.FC = () => {
  const { userId, loading, error }: UseUserIdReturn = getUserId();
  // ...
};
```

### 對於維護者

#### 更新 getUserId Hook

如需更新 Hook 邏輯，請編輯：

```
app/hooks/getUserId.ts
```

所有使用此 Hook 的組件都會自動獲得更新。

#### 監控使用情況

可通過以下命令搜索所有使用點：

```bash
grep -r "getUserId" app/
```

## 已棄用功能

以下功能已被標記為棄用，請勿在新代碼中使用：

### Deprecated 函數

| 函數名                             | 替代方案      | 移除計劃 |
| ---------------------------------- | ------------- | -------- |
| `getUserId()`                      | `getUserId()` | v2.0.0   |
| `getCurrentUserId()`               | `getUserId()` | v2.0.0   |
| `fetchUserId()`                    | `getUserId()` | v2.0.0   |
| 直接調用 `supabase.auth.getUser()` | `getUserId()` | -        |

### 遷移時間表

- **2025-08-29**: 統一化實施完成
- **2025-09-15**: 建議完成所有遷移
- **2025-10-01**: 移除棄用函數警告升級為錯誤
- **2025-11-01**: 完全移除棄用函數（v2.0.0）

## 影響分析

### 受影響的組件（已更新）

共 19 張管理卡片已全部更新：

1. AnalyticsCard.tsx
2. APITestCard.tsx
3. AssetCard.tsx
4. AttributeCard.tsx
5. BatchCard.tsx
6. CarrierCard.tsx
7. ChatbotCard.tsx
8. ComplianceCard.tsx
9. DeliveryCard.tsx
10. LocationCard.tsx
11. OrderCard.tsx
12. PalletCard.tsx
13. PickingCard.tsx
14. ProductCard.tsx
15. QCLabelCard.tsx
16. ReceivingCard.tsx
17. ReportCard.tsx
18. ShippingCard.tsx
19. SupplierCard.tsx

### 性能影響

- **正面影響**：
  - 減少重複的認證調用
  - 統一的快取管理
  - 更好的錯誤恢復機制

- **無負面影響**：
  - Hook 使用 React 內建優化
  - 不增加額外的網絡請求
  - 兼容 SSR 和 CSR

## 最佳實踐建議

### DO ✅

1. **始終使用 getUserId Hook**

   ```typescript
   const { userId, loading, error } = getUserId();
   ```

2. **處理所有狀態**
   - 載入狀態
   - 錯誤狀態
   - 未登錄狀態

3. **在組件頂層調用**
   ```typescript
   function Component() {
     const { userId } = getUserId(); // ✅ 頂層調用
   }
   ```

### DON'T ❌

1. **不要在條件語句中調用**

   ```typescript
   if (condition) {
     const { userId } = getUserId(); // ❌ 違反 Hook 規則
   }
   ```

2. **不要直接訪問 Supabase Auth**

   ```typescript
   const user = await supabase.auth.getUser(); // ❌ 繞過統一介面
   ```

3. **不要創建自定義包裝**
   ```typescript
   const myGetUserId = () => {
     // ❌ 破壞統一性
     // 自定義邏輯
   };
   ```

## 驗證清單

- [x] 所有管理卡片已更新為使用 `getUserId`
- [x] 舊的用戶ID獲取方法已標記為棄用
- [x] 技術文檔已更新
- [x] 遷移指南已建立
- [x] TypeScript 類型定義完整
- [x] 錯誤處理機制統一
- [x] 載入狀態管理一致
- [x] 兼容 SSR 和 CSR 渲染

## 後續維護計劃

1. **短期（1個月內）**：
   - 監控 Hook 使用情況
   - 收集開發者反饋
   - 修復發現的問題

2. **中期（3個月內）**：
   - 完成所有遷移
   - 移除棄用警告
   - 優化 Hook 性能

3. **長期（6個月內）**：
   - 完全移除棄用函數
   - 建立自動化測試
   - 擴展到其他認證需求

---

**重構負責人**: System Administrator  
**審核狀態**: ✅ 已完成  
**最後更新**: 2025-08-29
