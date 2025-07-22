# AuthApiError: Invalid Refresh Token - SSR 認證錯誤解決案例

## 問題概述

**錯誤信息**：`AuthApiError: Invalid Refresh Token: Session Expired`  
**發生時機**：用戶登入成功後轉到 `/admin` 頁面時  
**影響範圍**：Console 顯示錯誤，可能影響用戶體驗  
**發現日期**：2025-01-22  
**解決狀態**：✅ 已解決  

## 根本原因分析

### 技術原因
- **SSR 認證缺失**：`prefetch.server.ts` 在服務器端數據預取時沒有驗證用戶認證狀態
- **Token 過期處理**：系統嘗試使用過期的 refresh token 執行資料庫查詢
- **架構不一致**：middleware 和 SSR 階段的認證邏輯不同步

### 具體位置
- **文件**：`app/(app)/admin/hooks/server/prefetch.server.ts`
- **問題行**：第14行 `const supabase = await createClient();`
- **缺失邏輯**：沒有在數據查詢前檢查用戶認證狀態

## 解決方案

### 修復代碼
```typescript
// 在數據預取前添加認證檢查
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (userError || !user) {
  console.warn('[SSR] User not authenticated, skipping prefetch:', userError?.message);
  return {}; // 優雅降級到客戶端渲染
}
```

### 修復位置
1. `prefetchCriticalWidgetsData()` 函數
2. `prefetchDashboardData()` 函數

### 工作原理
- **認證有效**：執行 SSR 數據預取，提升載入速度
- **認證失效**：跳過 SSR 預取，交由客戶端處理，避免錯誤

## 專家會議決策

### 參與專家
- **分析師**：系統化診斷定位問題
- **Backend工程師**：識別 SSR 認證不同步為根本原因
- **安全專家**：發現 middleware 認證繞過風險
- **產品經理**：決定優先修復用戶體驗問題

### 決策結果
採用**優雅降級策略**，在 SSR 階段添加認證檢查，未認證時自動切換到客戶端渲染。

## 預防措施

### 開發規範
1. **SSR 函數必須包含認證檢查**
2. **使用 `supabase.auth.getUser()` 驗證用戶狀態**
3. **實施優雅降級機制**

### 代碼模板
```typescript
export async function anySSRFunction() {
  try {
    const supabase = await createClient();
    
    // 🔥 必須：認證檢查
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('[SSR] User not authenticated, skipping operation:', userError?.message);
      return {}; // 優雅降級
    }
    
    // 繼續執行業務邏輯...
  } catch (error) {
    console.error('[SSR] Operation failed:', error);
    return {}; // 容錯處理
  }
}
```

## 檢查清單

### 問題診斷
- [ ] 檢查 Console 是否有 "AuthApiError" 錯誤
- [ ] 確認錯誤發生在頁面跳轉時機
- [ ] 查看是否涉及 SSR 數據預取
- [ ] 檢查 `prefetch.server.ts` 是否包含認證檢查

### 修復驗證
- [ ] SSR 函數添加認證檢查
- [ ] 實施優雅降級機制
- [ ] 測試登入轉頁面流程
- [ ] 確認 Console 不再出現錯誤

## 相關問題

### 類似錯誤
- SSR 階段的任何 Supabase 操作都可能遇到類似問題
- middleware 認證邏輯與應用層不一致

### 延伸閱讀
- `docs/troubleshooting/ssr-auth-debugging.md`
- `docs/architecture-decisions/adr-003-ssr-authentication-strategy.md`

## 更新歷史

- **2025-01-22**：初始記錄，問題解決
- **修復人員**：Claude Code (專家會議協作)
- **影響評估**：用戶體驗改善，Console 錯誤消除