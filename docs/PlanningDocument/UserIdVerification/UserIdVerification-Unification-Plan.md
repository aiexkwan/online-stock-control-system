# 用戶ID驗證系統統一化計劃書

## 執行摘要

本計劃旨在解決當前用戶ID管理系統的技術碎片化問題，通過統一 `getUserId` 作為唯一標準，提升系統的一致性、可維護性和安全性。我們將在12小時內完成全面的系統重構，確保技術債務得到有效控制。

## 現狀分析

### 系統當前架構

- **已刪除組件**: `getUserIdVerification`（完全移除）
- **現存組件**:
  1. `UserIdVerificationDialog`（UI組件）
  2. `useCurrentUserId()`（輔助函數）
  3. `validateUserIdInDatabase()`（驗證函數）
  4. `getUserId()`（核心Hook）

### 架構問題

- 多套並行的用戶ID管理方案導致系統複雜性增加
- 缺乏統一的身份驗證和管理機制
- 現有方案存在功能重疊和潛在安全風險

## 解決方案設計

### 核心策略

0. `getUserId`更名成`getUserId`，以更符合用途
1. **統一方案**：以 `getUserId` 作為唯一用戶ID管理Hook
2. **功能整合**：
   - 將 `useCurrentUserId()` 的功能併入 `getUserId()`
   - 整合 `validateUserIdInDatabase()` 的驗證邏輯
3. **UI層面**：`UserIdVerificationDialog` 直接調用 `getUserId()`

### 技術實現細節

#### 統一化策略說明

**保留現有 getUserId Hook**：

- getUserId 已功能完整（295行代碼），無需重構
- 具備完整的快取機制、認證狀態監聽、錯誤處理
- 提供 verifyUserId 函數可直接使用

**調整 UserIdVerificationDialog**：

```typescript
// 原始實現（使用分離的函數）
const currentUserId = useCurrentUserId();
const isValid = await validateUserIdInDatabase(userIdValue);

// 修正後實現（使用統一的 getUserId）
const { userId: currentUserId, verifyUserId, isLoading } = getUserId();
const isValid = await verifyUserId(userIdValue);
```

**棄用冗餘函數**：

```typescript
// 標記為 deprecated 並逐步移除
/** @deprecated 請使用 getUserId().userId 替代 */
export function useCurrentUserId(): string | null {
  const { userId } = getUserId();
  return userId;
}

/** @deprecated 請使用 getUserId().verifyUserId 替代 */
export async function validateUserIdInDatabase(userId: string): Promise<boolean> {
  // 現有實現保持不變，但標記為棄用
  const { data, error } = await createClient()
    .from('data_id') // 正確的表名
    .select('id') // 正確的欄位名
    .eq('id', parseInt(userId, 10))
    .single();

  return !error && !!data?.id;
}
```

## 實施計劃

### 階段一：整合 (8小時)

- **保留 `getUserId` Hook**（已功能完整，無需重構）
- **更新 `UserIdVerificationDialog`**：
  - 替換 `useCurrentUserId()` 為 `getUserId().userId`
  - 替換 `validateUserIdInDatabase()` 為 `getUserId().verifyUserId`
  - 使用統一的 loading 狀態管理
- **標記冗餘函數為 deprecated**：
  - 在 `useCurrentUserId` 和 `validateUserIdInDatabase` 添加 @deprecated 標記
  - 保持函數可用但引導開發者使用新方案

### 階段二：測試 (3小時)

- 單元測試 `getUserId`
- 整合測試用戶驗證流程
- 安全性測試

### 階段三：文檔 (1小時)

- 更新技術文檔
- 記錄重構過程和變更

## 風險管理

### 技術風險

1. **兼容性風險**：確保現有代碼能無縫遷移
2. **性能風險**：優化 Hook 性能，避免不必要的重複請求
3. **安全風險**：確保用戶ID驗證邏輯的安全性

### 緩解策略

- 全面的單元和整合測試
- 漸進式遷移
- 保留舊方案的備份

## 測試和驗收標準

### 驗收清單

- [ ] `getUserId` 能正確獲取和驗證用戶ID
- [ ] `UserIdVerificationDialog` 成功整合新Hook
- [ ] 系統性能未受影響
- [ ] 安全性測試通過

## 附錄：技術規格

### 版本資訊

- **框架**：Next.js 15.4.6
- **語言**：TypeScript 5.9.2
- **React**：18.3.1
- **Supabase**：2.49.8

### 相關文檔

- [前端技術棧](/docs/TechStack/FrontEnd.md)
- [安全性文檔](/docs/TechStack/Secutiry.md)

---

**備註**：本文檔遵循 KISS、DRY、YAGNI 和 SOLID 設計原則，旨在提供一個簡潔、高效的用戶ID管理解決方案。
