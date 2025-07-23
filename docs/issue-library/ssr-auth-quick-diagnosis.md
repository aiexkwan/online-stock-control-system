# SSR 認證問題快速診斷清單

## 🚨 常見症狀識別

### Console 錯誤類型
- [ ] `AuthApiError: Invalid Refresh Token: Session Expired`
- [ ] `AuthApiError: Invalid JWT`
- [ ] `AuthApiError: Unable to parse session`
- [ ] 任何包含 "auth" 和 "token" 的錯誤

### 發生時機模式
- [ ] 登入成功後頁面跳轉時
- [ ] 刷新頁面時
- [ ] 長時間無操作後首次操作
- [ ] SSR 頁面載入時

## 🔍 Phase 1: 快速檢查（2分鐘）

### 瀏覽器檢查
```bash
# Chrome DevTools 檢查清單
□ Application → Storage → Cookies 
  - sb-bbmkuiplnzvpudszrend-auth-token 是否存在？
  - Cookie Path 是否設為 "/"？
  - Expires 時間是否已過期？

□ Network 標籤
  - 登入請求是否返回 200？
  - 頁面請求是否攜帶 auth cookies？
  - 是否有 4xx 認證相關錯誤？

□ Console 標籤
  - 是否有其他相關錯誤？
  - 錯誤堆疊指向哪個文件？
```

### 程式碼快速檢查
```bash
# 檢查 SSR 認證邏輯
□ grep -r "createClient" app/ | grep server
□ 檢查是否有 getUser() 或 getSession() 調用
□ 確認是否在 try-catch 中包裝
```

## 🔍 Phase 2: 系統診斷（5分鐘）

### 關鍵文件檢查
```bash
# 文件檢查優先級
1. app/(app)/admin/hooks/server/prefetch.server.ts
2. middleware.ts
3. app/utils/supabase/server.ts
4. app/utils/supabase/client.ts
```

### 配置檢查
```bash
# 環境變數驗證
□ NEXT_PUBLIC_SUPABASE_URL 是否正確
□ NEXT_PUBLIC_SUPABASE_ANON_KEY 是否正確
□ 本地 .env.local 是否與生產環境一致
```

### 認證流程檢查
```bash
# Supabase 配置
□ auth.autoRefreshToken = true?
□ auth.persistSession = true?
□ auth.detectSessionInUrl = true?
□ storageKey 是否一致？
```

## 🔍 Phase 3: 深度分析（10分鐘）

### SSR 認證模式檢查
```typescript
// 標準 SSR 認證檢查模式
const supabase = await createClient();

// ✅ 正確：先檢查認證
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return {}; // 優雅降級
}

// ❌ 錯誤：直接執行查詢
const { data } = await supabase.from('table').select('*');
```

### Middleware 認證策略
```typescript
// 檢查 middleware.ts 中的處理邏輯
□ publicRoutes 配置是否正確？
□ admin 路由是否有特殊處理？
□ cookie 設置是否安全？
```

## 🛠️ 常見修復方案

### 1. SSR 認證檢查（最常見）
```typescript
// 添加到任何 SSR 函數開頭
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (userError || !user) {
  console.warn('[SSR] User not authenticated:', userError?.message);
  return {}; // 或其他適當的降級值
}
```

### 2. Cookie 配置修復
```typescript
// middleware.ts 中確保正確配置
cookies: {
  set(name: string, value: string, options: CookieOptions) {
    response.cookies.set({
      name,
      value,
      ...options,
      httpOnly: false, // 對於客戶端認證很重要
      sameSite: 'lax',
      secure: isProduction(),
    });
  }
}
```

### 3. 客戶端認證檢查
```typescript
// 在組件中添加認證狀態檢查
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.replace('/main-login?error=session_expired');
    }
  };
  checkAuth();
}, []);
```

## 📋 修復後驗證清單

### 功能測試
- [ ] 登入流程正常
- [ ] 頁面跳轉無錯誤
- [ ] Console 不再出現認證錯誤
- [ ] SSR 數據正常載入

### 性能測試
- [ ] 頁面載入速度未受影響
- [ ] 認證檢查不會造成額外延遲
- [ ] 降級機制工作正常

### 安全測試
- [ ] 過期 token 正確處理
- [ ] 未認證用戶無法訪問保護頁面
- [ ] Cookie 安全設置正確

## 🚀 預防措施

### 開發規範
1. **所有 SSR 函數必須包含認證檢查**
2. **使用統一的認證檢查模式**
3. **實施優雅降級策略**
4. **定期檢查 cookie 配置**

### 代碼審查重點
- [ ] 新增的 SSR 函數是否包含認證檢查？
- [ ] 認證邏輯是否一致？
- [ ] 錯誤處理是否適當？
- [ ] 是否有適當的降級機制？

---

**最後更新**：2025-01-22  
**維護者**：文檔整理專家  
**相關文檔**：`docs/issue-library/authentication-ssr-token-expired-error.md`