# 安全影響評估報告：移除 print-grnlabel 目錄

**評估日期**: 2025-08-27  
**評估範圍**: `/app/(app)/print-grnlabel` 目錄  
**風險等級**: **中等**

## 審計摘要

- **發現漏洞總數**: 3個
- **風險等級分佈**: 
  - 高風險: 1個
  - 中風險: 1個  
  - 低風險: 1個
- **整體安全評分**: 6/10（需要謹慎處理）

## 漏洞詳情

### 1. 認證檢查不足 [高風險]

**漏洞類型**: 權限繞過  
**受影響位置**: 
- `/app/(app)/print-grnlabel/page.tsx` (Line 1-63)
- `/app/(app)/print-grnlabel/layout.tsx` (Line 1-13)

**潛在影響**:
- 頁面級別缺乏明確的權限檢查中間件
- 僅依賴 `supabase.auth.getUser()` 進行用戶識別，未驗證用戶是否有權限訪問 GRN 功能
- 可能允許未授權用戶訪問敏感的 GRN 標籤生成功能

**復現步驟**:
1. 以普通用戶身份登錄
2. 直接訪問 `/print-grnlabel` 路徑
3. 檢查是否可以訪問頁面和執行操作

### 2. 審計日誌依賴性 [中風險]

**漏洞類型**: 審計跟踪中斷  
**受影響位置**:
- `/app/(app)/print-grnlabel/services/ErrorHandler.ts` (Lines 273-336)
- 記錄到 `record_history` 表

**潛在影響**:
- ErrorHandler 服務負責記錄所有 GRN 操作的審計日誌
- 移除後將失去 GRN 操作的錯誤追蹤和成功事件記錄
- Admin 功能（`/app/(app)/admin/hooks/useAdminGrnLabelBusiness.tsx`）依賴此服務

**已確認的依賴**:
```typescript
// Line 9 in useAdminGrnLabelBusiness.tsx
import { grnErrorHandler } from '@/app/(app)/print-grnlabel/services/ErrorHandler';
```

### 3. 業務邏輯共享 [低風險]

**漏洞類型**: 功能中斷  
**受影響位置**:
- `/app/(app)/admin/hooks/useAdminGrnLabelBusiness.tsx` (Lines 42-44)
- 引用多個 print-grnlabel 的 Hook

**潛在影響**:
- Admin 功能直接使用以下組件：
  - `useWeightCalculation` Hook
  - `usePalletGenerationGrn` Hook  
  - `ErrorHandler` 服務
- 移除將導致 Admin 的 GRN 功能完全失效

## 資料庫安全配置審查

### record_history 表 RLS 策略

**現有安全措施**:
1. **部門隔離策略** (`dept_isolation_history_safe`):
   - 僅允許 Admin 或 Warehouse 部門訪問
   
2. **管理員權限** (`Admins can manage history`):
   - 管理員擁有完全控制權

3. **認證用戶插入** (`System can create history`):
   - 任何已認證用戶都可以插入記錄（潛在風險）

## 修復建議

### 立即修復 [關鍵]

#### 1. 提取共享組件到獨立模組

**修復代碼**:
```typescript
// 創建 /lib/grn/services/error-handler.ts
// 將 ErrorHandler 移至此處，避免與特定頁面耦合

// 創建 /lib/grn/hooks/ 目錄
// 移動所有共享的 Hook
```

#### 2. 實施路由級權限控制

**修復代碼**:
```typescript
// /app/(app)/print-grnlabel/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';

export default async function PrintGrnLabelLayout({ 
  children 
}: { 
  children?: React.ReactNode 
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user || error) {
    redirect('/main-login');
  }
  
  // 檢查用戶部門權限
  const { data: profile } = await supabase
    .from('profiles')
    .select('department')
    .eq('id', user.id)
    .single();
    
  const allowedDepartments = ['Warehouse', 'Admin', 'QC'];
  if (!profile || !allowedDepartments.includes(profile.department)) {
    redirect('/unauthorized');
  }
  
  return (
    <div className='h-full'>
      {children}
    </div>
  );
}
```

#### 3. 加強資料庫 RLS 策略

**修復 SQL**:
```sql
-- 限制 record_history 插入權限
DROP POLICY IF EXISTS "System can create history" ON record_history;

CREATE POLICY "Restricted history creation" ON record_history
FOR INSERT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.get_user_department() IN ('Warehouse', 'QC', 'Admin')
    OR auth.is_admin()
  )
);
```

### 移除前必須完成的步驟

1. **依賴解耦**:
   ```bash
   # 1. 創建新的共享模組目錄
   mkdir -p lib/grn/services
   mkdir -p lib/grn/hooks
   
   # 2. 移動共享組件
   mv app/(app)/print-grnlabel/services/ErrorHandler.ts lib/grn/services/
   mv app/(app)/print-grnlabel/hooks/useWeightCalculation.tsx lib/grn/hooks/
   mv app/(app)/print-grnlabel/hooks/usePalletGenerationGrn.tsx lib/grn/hooks/
   
   # 3. 更新所有引用路徑
   ```

2. **更新 Admin 功能引用**:
   ```typescript
   // useAdminGrnLabelBusiness.tsx
   - import { grnErrorHandler } from '@/app/(app)/print-grnlabel/services/ErrorHandler';
   + import { grnErrorHandler } from '@/lib/grn/services/ErrorHandler';
   
   - import { useWeightCalculation } from '@/app/(app)/print-grnlabel/hooks/useWeightCalculation';
   + import { useWeightCalculation } from '@/lib/grn/hooks/useWeightCalculation';
   ```

3. **建立功能遷移計劃**:
   - 確認所有 GRN 功能已整合到 Admin 模組
   - 驗證所有用戶都通過 Admin 介面訪問 GRN 功能
   - 設置重定向從舊路徑到新路徑

## 安全建議總結

### ✅ 可以安全移除的條件

1. 所有共享組件已提取到獨立模組
2. Admin 功能的引用已更新
3. 實施了適當的權限控制
4. 審計日誌功能已遷移或有替代方案

### ⚠️ 風險警告

- **不要**在未解耦依賴前直接刪除目錄
- **確保**審計日誌功能的連續性
- **驗證**所有用戶工作流程不受影響

### 📊 影響評估

- **安全影響**: 中等（需要謹慎處理）
- **功能影響**: 高（Admin 功能依賴）
- **用戶影響**: 中等（需要更新訪問路徑）
- **數據完整性**: 低（不影響現有數據）

## 執行優先級

1. **P0 - 立即執行**: 提取共享組件，避免功能中斷
2. **P1 - 24小時內**: 實施權限控制，修復安全漏洞
3. **P2 - 本週內**: 完成功能遷移，設置重定向
4. **P3 - 後續優化**: 審查並優化 RLS 策略

---

**結論**: 移除 `print-grnlabel` 目錄在技術上可行，但需要先完成依賴解耦和安全加固。建議按照上述步驟逐步執行，確保系統安全性和功能完整性。