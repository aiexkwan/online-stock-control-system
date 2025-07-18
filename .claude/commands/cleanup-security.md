# 安全性清理命令

## 用法
`/cleanup-security` 或 `/cleanup-security [模組路徑]`

## 執行流程
1. **啟動工具**
   - Ultrathink - 深度安全分析
   - Sequential-thinking - 系統性安全檢查
   - Task - 並行安全測試
   - Puppeteer MCP - 自動化安全測試

2. **安全掃描**
   - 權限控制檢查
   - 輸入驗證測試
   - 數據洩露風險
   - 攻擊向量分析

3. **測試憑證**
   - Email: ${env.local.PUPPETEER_LOGIN}
   - Password: ${env.local.PUPPETEER_PASSWORD}

## 角色建議
- 主要角色: 🔒 Security（安全專家）
- 協作角色: ⚙️ Backend + 🏗️ Architect + 🧪 QA
- 威脅建模: 📊 Analyzer（風險分析）

## 安全檢查項目
### 🛡️ 認證授權
- [ ] Supabase Auth 配置
- [ ] JWT 令牌管理
- [ ] 會話管理安全
- [ ] 多因素認證
- [ ] 密碼政策檢查

### 🔐 數據保護
- [ ] RLS 政策完整性
- [ ] 敏感數據加密
- [ ] 數據庫權限控制
- [ ] 審計日誌記錄
- [ ] 備份安全性

### 🚨 攻擊防護
- [ ] XSS 攻擊防護
- [ ] CSRF 令牌驗證
- [ ] SQL 注入防護
- [ ] 文件上傳安全
- [ ] 輸入驗證機制

## 安全威脅評估
| 威脅類型 | 風險等級 | 檢查項目 | 防護措施 |
|---------|---------|---------|---------|
| SQL注入 | 🔴 高 | 參數化查詢 | Supabase RPC |
| XSS攻擊 | 🟡 中 | 輸入消毒 | DOMPurify |
| 未授權訪問 | 🔴 高 | RLS政策 | Row Level Security |
| 數據洩露 | 🔴 高 | 加密存儲 | pgcrypto |
| CSRF攻擊 | 🟡 中 | CSRF令牌 | SameSite Cookie |

## 安全配置檢查
### 🔒 Supabase RLS 政策
```sql
-- 檢查 RLS 是否啟用
ALTER TABLE sensitive_table ENABLE ROW LEVEL SECURITY;

-- 用戶只能訪問自己的數據
CREATE POLICY "users_own_data" ON user_data
  FOR ALL USING (auth.uid() = user_id);

-- 基於角色的訪問控制
CREATE POLICY "role_based_access" ON admin_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 🛡️ 輸入驗證
```typescript
// 嚴格輸入驗證
const validateInput = (input: string): boolean => {
  // 防止 XSS
  const sanitized = DOMPurify.sanitize(input);
  
  // 防止 SQL 注入
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/i;
  if (sqlPattern.test(input)) {
    throw new Error('Invalid input detected');
  }
  
  return true;
};

// 文件上傳驗證
const validateFileUpload = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds limit');
  }
  
  return true;
};
```

### 🔐 數據加密
```sql
-- 敏感數據加密
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 加密函數
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.encrypted_field = pgp_sym_encrypt(
    NEW.sensitive_data,
    current_setting('app.encryption_key')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 解密查詢
SELECT 
  id,
  pgp_sym_decrypt(encrypted_field, current_setting('app.encryption_key')) 
  AS decrypted_data
FROM sensitive_table;
```

## 安全測試
### 🧪 自動化安全測試
```javascript
// XSS 攻擊測試
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")'
];

// SQL 注入測試
const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "1; UPDATE users SET password='hacked'"
];

// 權限測試
const testUnauthorizedAccess = async () => {
  // 測試未授權用戶訪問
  const response = await fetch('/api/admin/data', {
    headers: { 'Authorization': 'Bearer invalid_token' }
  });
  expect(response.status).toBe(401);
};
```

## 檢查命令
```bash
# 安全掃描
npm run security:scan

# 權限測試
npm run test:security:permissions

# 漏洞檢測
npm audit
npm run test:security:vulnerabilities
```

## 安全監控
### 📊 安全日誌
```sql
-- 安全審計日誌
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 異常活動監控
CREATE VIEW security_alerts AS
SELECT 
  user_id,
  COUNT(*) as failed_attempts,
  array_agg(DISTINCT ip_address) as ip_addresses
FROM security_audit_log
WHERE success = false 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 5;
```

## 報告輸出路徑
`docs/cleanup/security-cleanup-v[X.X.X].md`

---

**清理焦點**: 權限控制 + 輸入驗證 + 數據保護
**目標改善**: 0安全漏洞，100%權限覆蓋，完整審計追蹤