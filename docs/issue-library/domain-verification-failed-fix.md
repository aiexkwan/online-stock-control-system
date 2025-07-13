# 域名驗證失敗錯誤修復

**問題編號**: AUTH-DOMAIN-001  
**修復日期**: 2025-01-11  
**嚴重程度**: 中等  
**狀態**: 已修復  

## 問題描述

### 錯誤訊息
```
Error: Domain verification failed
```

### 症狀
- 用戶在訪問應用程式時遇到域名驗證失敗錯誤
- 特別是在開發環境和生產環境之間切換時
- 錯誤來自 `app/main-login/utils/secure-supabase.ts` 和 `app/main-login/utils/unified-auth.ts`

## 根本原因分析

### 1. 域名驗證機制
- 應用程式使用 `login_domain_verified` 標記來驗證用戶的域名
- 標記有 2 小時的過期時間
- 標記包含域名信息，用於驗證用戶是否在正確的域名上訪問

### 2. 導致錯誤的情況
1. **域名不匹配**: 開發環境 (localhost) 和生產環境域名不同
2. **標記過期**: 2 小時後標記自動過期
3. **本地存儲清理**: 瀏覽器清理或手動清理了本地存儲
4. **環境切換**: 在不同環境間切換時域名驗證失效

### 3. 錯誤觸發位置
```typescript
// app/main-login/utils/unified-auth.ts:208
const domainVerified = this.secureStorage.getItem('login_domain_verified');
if (!domainVerified) {
  await supabase.auth.signOut();
  throw new Error('Domain verification failed');
}

// app/main-login/utils/secure-supabase.ts:151
const domainVerified = secureStorage.getItem('login_domain_verified');
if (!domainVerified) {
  await secureSupabase.auth.signOut();
  throw new Error('Domain verification failed');
}
```

## 修復方案

### 1. 開發環境自動恢復 (unified-auth.ts & secure-supabase.ts)

```typescript
if (!domainVerified) {
  // 在開發環境下，嘗試從現有的 session 中恢復驗證標記
  if (process.env.NODE_ENV === 'development') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      // 恢復域名驗證標記
      this.secureStorage.setItem('login_domain_verified', 'true');
      console.log('[UnifiedAuth] Domain verification restored in development mode');
    } else {
      await supabase.auth.signOut();
      throw new Error('Domain verification failed - please sign in again');
    }
  } else {
    await supabase.auth.signOut();
    throw new Error('Domain verification failed - please sign in again');
  }
}
```

### 2. 寬鬆的域名驗證邏輯

```typescript
// 驗證域名（額外安全檢查）
if (parsed.domain && parsed.domain !== window.location.hostname) {
  // 在開發環境下，允許 localhost 相關的域名
  if (process.env.NODE_ENV === 'development') {
    const isDevelopmentDomain = 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      parsed.domain === 'localhost' ||
      parsed.domain === '127.0.0.1' ||
      parsed.domain.startsWith('192.168.');
    
    if (!isDevelopmentDomain) {
      this.removeItem(key);
      return null;
    }
  } else {
    this.removeItem(key);
    return null;
  }
}
```

### 3. 域名驗證助手工具 (domain-verification-helper.ts)

創建了一個專門的工具類來幫助診斷和恢復域名驗證問題：

```typescript
export class DomainVerificationHelper {
  // 檢查驗證狀態
  static checkVerificationStatus(): {
    isVerified: boolean;
    storedDomain: string | null;
    currentDomain: string;
    isExpired: boolean;
  }

  // 嘗試恢復驗證
  static async attemptRecovery(): Promise<{
    success: boolean;
    message: string;
    action?: 'restored' | 'sign_in_required';
  }>

  // 獲取診斷信息
  static getDiagnosticInfo(): {
    environment: string;
    currentDomain: string;
    isLocalhost: boolean;
    storageAvailable: boolean;
    verificationStatus: ReturnType<typeof DomainVerificationHelper.checkVerificationStatus>;
  }

  // 生成用戶友好的錯誤消息
  static generateUserFriendlyMessage(diagnostics): string
}
```

### 4. 改善的錯誤訊息

- 將通用的 "Domain verification failed" 改為更具體的 "Domain verification failed - please sign in again"
- 在開發環境下提供更詳細的日誌信息
- 提供用戶友好的錯誤消息和恢復建議

## 修復檔案清單

1. **app/main-login/utils/unified-auth.ts**
   - 添加開發環境自動恢復邏輯
   - 改善域名驗證邏輯
   - 改善錯誤訊息

2. **app/main-login/utils/secure-supabase.ts**
   - 添加開發環境自動恢復邏輯
   - 改善域名驗證邏輯
   - 改善錯誤訊息

3. **app/main-login/utils/domain-verification-helper.ts** (新檔案)
   - 域名驗證助手工具類
   - 診斷和恢復功能
   - 用戶友好的錯誤消息生成

## 使用方法

### 1. 自動恢復
在開發環境下，系統會自動嘗試恢復域名驗證標記：

```javascript
// 開發環境下會自動執行
if (process.env.NODE_ENV === 'development') {
  // 嘗試從現有 session 恢復驗證標記
}
```

### 2. 手動恢復
如果需要手動恢復驗證：

```javascript
import { domainVerificationHelper } from '@/app/main-login/utils/domain-verification-helper';

// 檢查驗證狀態
const status = domainVerificationHelper.check();

// 嘗試恢復
const recovery = await domainVerificationHelper.recover();

// 獲取診斷信息
const diagnostics = domainVerificationHelper.diagnose();

// 生成用戶友好消息
const message = domainVerificationHelper.getMessage(diagnostics);
```

### 3. 開發者調試
在瀏覽器控制台中：

```javascript
// 檢查當前驗證狀態
console.log(domainVerificationHelper.check());

// 查看詳細診斷信息
console.log(domainVerificationHelper.diagnose());

// 清除驗證數據（測試用）
domainVerificationHelper.clear();
```

## 測試驗證

### 1. 開發環境測試
- ✅ 在 localhost 上正常工作
- ✅ 標記過期後自動恢復
- ✅ 清理本地存儲後自動恢復

### 2. 生產環境測試
- ✅ 嚴格的域名驗證
- ✅ 適當的錯誤處理
- ✅ 安全性保持不變

### 3. 環境切換測試
- ✅ 開發環境到生產環境
- ✅ 不同本地開發端口
- ✅ IP 地址訪問

## 預期效果

1. **開發體驗改善**: 開發者不再需要頻繁重新登入
2. **自動恢復**: 在開發環境下自動處理域名驗證問題
3. **更好的錯誤訊息**: 提供更具體和有用的錯誤信息
4. **診斷工具**: 提供工具來診斷和解決驗證問題
5. **安全性保持**: 生產環境的安全性不受影響

## 配置選項

可以通過環境變量調整安全模式：

```bash
# 開發環境 - 寬鬆的驗證
NODE_ENV=development

# 生產環境 - 嚴格的驗證
NODE_ENV=production
NEXT_PUBLIC_SECURITY_MODE=strict
```

## 監控指標

- 域名驗證失敗次數
- 自動恢復成功率
- 用戶重新登入頻率
- 開發環境 vs 生產環境錯誤率

## 後續優化建議

1. **會話管理**: 考慮使用更長期的會話管理機制
2. **域名白名單**: 為開發環境配置域名白名單
3. **用戶界面**: 添加用戶界面來顯示驗證狀態
4. **日誌記錄**: 增加更詳細的日誌記錄用於調試

## 相關問題

- [CLIENT-LAYOUT-001](./client-layout-originalfactory-error-fix.md) - ClientLayout originalFactory.call 錯誤修復
- [ADMIN-ANALYSIS-001](./admin-analysis-originalfactory-error-fix.md) - Admin Analysis 路由錯誤修復 