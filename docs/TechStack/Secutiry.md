# 安全性 (Security)

_最後更新日期: 2025-08-29 02:33:37_

## 認證與授權

- **認證機制**: Supabase Auth (JWT)
- **授權機制**: 109個RLS策略 (已驗證), 中間件權限檢查
- **會話管理**: cookies 0.9.1, jwt-decode 4.0.0

## 敏感資訊管理

- **日誌消毒**: `enhanced-logger-sanitizer.ts` (190行)
- **憑證管理**: `credentials-manager.ts` (242行)
- **密碼加密**: bcryptjs 3.0.2
- **令牌管理**: jsonwebtoken 9.0.2
- **認證UI**: @supabase/auth-ui-react 0.4.7

## 安全頭配置

- **Next.js 安全頭**: 在 `next.config.js` 中配置
  - X-Frame-Options: DENY
  - Strict-Transport-Security (HSTS)
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin

## 數據加密保護

- **加密字段**:
  - `query_record` 表: token_encrypted, token_hash
  - `data_order` 表: token_encrypted, token_hash
  - `data_id` 表: email_encrypted, email_hash
- **加密方法**: AES-256 對稱加密 + SHA-256 哈希索引

## 審計與監控

- **審計日誌** (`audit_logs` 表):
  - 設備指紋追蹤 (device_fingerprint)
  - 地理位置記錄 (geo_location)
  - 日誌完整性驗證 (integrity_hash, previous_hash)
  - 風險評分系統 (risk_score: 0-100)
  - 嚴重性級別 (LOW/MEDIUM/HIGH/CRITICAL)
  - 防刪除保護策略

### 日誌消毒器 (`enhanced-logger-sanitizer.ts`) 工作原理

為了防止敏感資訊（如密碼、API 金鑰、個人身份資訊）意外洩露到日誌系統中，我們實現了一個自定義的日誌消毒器。

- **核心機制**: 該模組會在日誌被寫入之前攔截所有日誌對象。它會遞歸地遍歷日誌對象的所有鍵值對。
- **消毒規則**:
  - 它會檢查每個 `key` 是否包含在一個預定義的敏感關鍵字列表中（例如 `password`, `token`, `apiKey`, `email`）。
  - 如果 `key` 匹配成功，對應的 `value` 會被替換為 `[REDACTED]`。
- **目的**: 確保即使在詳細的偵錯日誌模式下，系統也不會記錄任何可能危害用戶或系統安全的敏感數據。
