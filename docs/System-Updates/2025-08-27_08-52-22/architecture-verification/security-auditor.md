# 系統安全配置實際狀態報告

**掃描時間**: 2025-08-27 08:52:22  
**系統版本**: v2.9.0  
**掃描方式**: Supabase MCP 工具實時檢測

## 1. 認證和授權機制

### 1.1 Supabase Auth 配置狀態

**JWT 配置**:

- **當前會話狀態**: 未檢測到活躍的 JWT 會話
- **JWT Claims**: 無法獲取當前 JWT claims（current_user_id: null）
- **Cookie 配置**:
  - 使用 PKCE flow 進行認證
  - Storage Key: `sb-bbmkuiplnzvpudszrend-auth-token`
  - 自動刷新 Token: 啟用
  - 持久化會話: 啟用

### 1.2 中間件認證機制

**路由保護實作**:

- **公開路由清單** (無需認證):
  - `/main-login` - 主登入頁面
  - `/change-password` - 密碼更新頁面
  - `/new-password` - 密碼重設頁面
  - `/api/health` - 健康檢查 API
  - `/api/monitoring/*` - 監控相關 API
  - `/api/auth` - 認證 API
  - `/api/graphql` - GraphQL 端點
  - `/api/pdf-extract` - PDF 提取 API
  - `/api/send-order-email` - 訂單郵件 API

- **認證流程**:
  1. 使用 `supabase.auth.getUser()` 獲取用戶身份
  2. 未認證用戶重定向至 `/main-login`
  3. Admin 路由強制要求認證
  4. 添加 `X-User-ID` 和 `X-User-Logged` 標頭

## 2. 行級安全策略 (RLS)

### 2.1 RLS 覆蓋狀態

**總體統計**:

- **總 RLS 策略數**: 109 個
- **受保護表格數**: 23 個（共 30 個表）
- **所有表格 RLS 狀態**: 全部啟用（未發現禁用 RLS 的表格）

### 2.2 RLS 策略分佈

| 表格名稱         | 策略數 | 操作類型                    | 授權角色                                  |
| ---------------- | ------ | --------------------------- | ----------------------------------------- |
| data_id          | 6      | ALL, INSERT, SELECT, UPDATE | authenticated, public                     |
| data_order       | 7      | ALL, INSERT, SELECT, UPDATE | authenticated, public                     |
| record_grn       | 6      | ALL, INSERT, SELECT, UPDATE | authenticated, public                     |
| record_inventory | 6      | ALL, INSERT, SELECT, UPDATE | authenticated, public                     |
| record_transfer  | 6      | ALL, INSERT, SELECT, UPDATE | authenticated, public                     |
| audit_logs       | 4      | ALL, DELETE, INSERT, SELECT | anon, authenticated, service_role, public |

### 2.3 安全顧問檢測結果

**嚴重問題 (ERROR 級別)**:

1. **Security Definer View** (3 個):
   - `public.security_metrics`
   - `public.data_id_decrypted`
   - `public.rls_policy_overview`
   - 風險: 使用視圖創建者的權限而非查詢用戶的權限

**警告問題 (WARN 級別)**:

1. **Function Search Path Mutable** (12 個函數):
   - 加密函數: `encrypt_sensitive_data`, `decrypt_sensitive_data`
   - 哈希函數: `create_hash`
   - 觸發器函數: `encrypt_email_trigger`, `encrypt_token_trigger`
   - 審計函數: `log_sensitive_access`
   - 策略函數: `create_unified_policy`, `apply_standard_policies`
   - 風險: search_path 參數未設置，可能導致函數劫持

2. **Extension in Public Schema** (2 個):
   - `pg_trgm` - 文本搜索擴展
   - `vector` - 向量搜索擴展
   - 建議: 應移至專用 schema

## 3. 中間件安全功能

### 3.1 Security Middleware 實作

**威脅檢測機制**:

- **SQL 注入檢測**: 啟用（生產環境會阻止請求）
- **XSS 攻擊檢測**: 啟用（生產環境會阻止請求）
- **路徑遍歷檢測**: 啟用（生產環境會阻止請求）
- **速率限制**: 每分鐘 100 請求/IP+路徑

**安全事件類型**:

- 認證事件: LOGIN_ATTEMPT, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT
- 授權事件: UNAUTHORIZED_ACCESS, PERMISSION_DENIED
- 數據訪問: SENSITIVE_DATA_ACCESS, BULK_DATA_EXPORT
- 安全威脅: SQL_INJECTION_ATTEMPT, XSS_ATTEMPT, CSRF_ATTEMPT

### 3.2 安全標頭配置

**Content Security Policy (CSP)**:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
connect-src 'self' https://api.openai.com https://*.supabase.co
```

**其他安全標頭**:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- HSTS: max-age=31536000（僅生產環境）

## 4. 敏感資訊管理

### 4.1 日誌清理機制

**GRN Logger 實作**:

- **自動清理欄位** (302 行實作):
  - 用戶資料: clockNumber, userId, email, operator
  - 供應商資料: supplierCode, materialSupplier
  - 產品資料: productCode, productInfo
  - GRN 資料: grnNumber, palletNumber, series

**清理模式**:

- 正則表達式模式匹配
- 遞歸深度限制（預設 10 層）
- 循環引用檢測

### 4.2 憑證管理系統

**Credentials Manager 配置** (242 行實作):

- **管理的憑證類型**:
  - Supabase: URL, Anon Key, Service Key
  - 測試憑證: 登入郵箱和密碼
  - API 密鑰: OpenAI, Resend

**驗證機制**:

- URL 格式驗證
- JWT 格式驗證（eyJ 開頭）
- API 密鑰前綴驗證（sk-, re\_）
- 必要憑證檢查

### 4.3 數據庫加密功能

**實作的加密函數**:
| 函數名稱 | Security Definer | 用途 |
|---------|-----------------|------|
| encrypt_sensitive_data | 是 | 敏感數據加密 |
| decrypt_sensitive_data | 是 | 敏感數據解密 |
| create_hash | 否 | 哈希生成 |
| encrypt_email_trigger | 否 | 郵件加密觸發器 |
| encrypt_token_trigger | 否 | Token 加密觸發器 |
| log_sensitive_access | 是 | 敏感訪問記錄 |

## 5. 安全監控和審計

### 5.1 審計日誌結構

**audit_logs 表格欄位**:

- **身份識別**: user_id, user_email, user_department
- **事件資訊**: event_type, operation, resource
- **結果狀態**: success, error_code, error_message
- **會話資訊**: session_id, request_id, session_type
- **環境資訊**: ip_address, user_agent, device_fingerprint
- **地理位置**: geo_location (JSONB)
- **完整性**: integrity_hash, previous_hash
- **風險評估**: severity, risk_score

### 5.2 Production Monitor 功能

**異常檢測**:

- 錯誤率異常檢測
- 性能降級檢測
- 可疑文件上傳檢測（.exe, .dll, .bat, .sh, .ps1, .vbs）

**速率限制實作**:

- 基於 IP + 路徑的限制
- 滑動窗口算法
- 429 狀態碼返回

### 5.3 API 版本管理

**版本控制機制**:

- 支持多版本 API（v1, v2）
- 版本標頭添加
- 棄用 API 重定向
- 版本使用記錄

## 6. 已禁用的安全功能

**Alert API 系統**:

- 狀態: 永久禁用（2025-08-13）
- 原因: 安全合規性要求
- 返回: 410 Gone 狀態碼
- 影響路徑: `/api/alerts/*`, `/api/v1/alerts/*`

## 7. 環境變數安全

**必要的安全環境變數**:

- NEXT_PUBLIC_SUPABASE_URL（必需）
- NEXT_PUBLIC_SUPABASE_ANON_KEY（必需）
- SUPABASE_SERVICE_ROLE_KEY（可選，高權限）
- OPENAI_API_KEY（可選）
- RESEND_API_KEY（可選）

## 總結

系統實作了多層安全防護機制，包括：

- 完整的 RLS 策略覆蓋（109 個策略保護 23 個表）
- 中間件層級的威脅檢測和阻止
- 自動化的敏感資訊清理
- 完整的審計日誌系統
- 加密函數和完整性檢查

需要注意的安全配置問題：

- 3 個使用 SECURITY DEFINER 的視圖
- 12 個函數未設置 search_path
- 2 個擴展安裝在 public schema
- CSP 配置允許 unsafe-inline 和 unsafe-eval（可能為開發需要）
