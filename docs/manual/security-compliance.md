# NewPennine WMS 安全和合規指南

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: Security & Compliance Team  
**狀態**: 生產就緒

## 概述

本指南提供 NewPennine 倉庫管理系統的完整安全和合規框架，涵蓋安全最佳實踐、合規要求、存取控制和審計追蹤。確保系統符合國際安全標準和行業最佳實踐。

## 安全架構

### 1. 深度防禦策略

```
┌─────────────────────────────────────────────────────────────┐
│                    網絡安全層                                │
├─────────────────────────────────────────────────────────────┤
│  WAF │ DDoS 防護 │ 入侵檢測 │ 流量分析 │ 地理封鎖        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    應用安全層                                │
├─────────────────────────────────────────────────────────────┤
│  身份驗證 │ 授權控制 │ 輸入驗證 │ 輸出編碼 │ 會話管理      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    數據安全層                                │
├─────────────────────────────────────────────────────────────┤
│  加密存儲 │ 傳輸加密 │ 數據分類 │ 訪問日誌 │ 備份加密      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    基礎設施安全層                            │
├─────────────────────────────────────────────────────────────┤
│  系統加固 │ 漏洞掃描 │ 補丁管理 │ 配置管理 │ 監控告警      │
└─────────────────────────────────────────────────────────────┘
```

### 2. 零信任架構

```
用戶 → 身份驗證 → 設備驗證 → 網絡驗證 → 應用授權 → 數據訪問
```

## 身份驗證和授權

### 1. 多因素認證 (MFA)

#### 配置 MFA
```javascript
// 啟用 MFA 設置
const mfaConfig = {
  enabled: true,
  methods: ['totp', 'sms', 'email'],
  grace_period: 30, // 天
  backup_codes: 10
};

// 用戶 MFA 設置
const userMFA = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'NewPennine WMS'
});
```

#### 強制 MFA 政策
```typescript
interface MFAPolicy {
  adminUsers: boolean;  // 管理員必須啟用
  managerUsers: boolean; // 管理人員必須啟用
  regularUsers: boolean; // 一般用戶可選
  sessionTimeout: number; // 會話超時時間
  maxRetries: number; // 最大重試次數
}
```

### 2. 角色基礎訪問控制 (RBAC)

#### 角色定義
```typescript
interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  level: 'admin' | 'manager' | 'operator' | 'viewer';
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
  conditions?: string[];
}
```

#### 權限矩陣
```typescript
const permissionMatrix = {
  admin: {
    pallets: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read', 'update', 'delete'],
    system: ['create', 'read', 'update', 'delete']
  },
  manager: {
    pallets: ['create', 'read', 'update'],
    inventory: ['create', 'read', 'update'],
    users: ['read'],
    reports: ['create', 'read'],
    system: ['read']
  },
  operator: {
    pallets: ['create', 'read', 'update'],
    inventory: ['read', 'update'],
    reports: ['read']
  },
  viewer: {
    pallets: ['read'],
    inventory: ['read'],
    reports: ['read']
  }
};
```

### 3. 行級安全 (RLS)

#### 數據隔離政策
```sql
-- 用戶只能訪問自己部門的數據
CREATE POLICY "department_isolation" ON record_palletinfo
  USING (
    department = (auth.jwt() ->> 'department')::text OR
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- 歷史記錄訪問控制
CREATE POLICY "history_access" ON record_history
  USING (
    user_id = auth.uid() OR
    (auth.jwt() ->> 'role')::text IN ('admin', 'manager')
  );

-- 敏感數據訪問
CREATE POLICY "sensitive_data_access" ON data_supplier
  USING (
    (auth.jwt() ->> 'role')::text IN ('admin', 'manager') OR
    (auth.jwt() ->> 'department')::text = 'procurement'
  );
```

## 數據安全

### 1. 數據加密

#### 傳輸加密
```nginx
# TLS 配置
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/newpennine.crt;
    ssl_certificate_key /etc/ssl/private/newpennine.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # 安全標頭
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
}
```

#### 存儲加密
```typescript
// 敏感數據加密
import { createCipher, createDecipher } from 'crypto';

class DataEncryption {
  private static readonly algorithm = 'aes-256-cbc';
  private static readonly key = process.env.ENCRYPTION_KEY!;

  static encrypt(text: string): string {
    const cipher = createCipher(this.algorithm, this.key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decrypt(encryptedText: string): string {
    const decipher = createDecipher(this.algorithm, this.key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 2. 數據分類和標記

#### 數據分類標準
```typescript
enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

interface DataRecord {
  id: string;
  data: any;
  classification: DataClassification;
  owner: string;
  retention_period: number;
  created_at: Date;
  encrypted: boolean;
}
```

#### 數據處理政策
```typescript
const dataHandlingPolicies = {
  public: {
    encryption: false,
    access_control: false,
    audit_logging: false,
    retention_days: 365
  },
  internal: {
    encryption: false,
    access_control: true,
    audit_logging: true,
    retention_days: 2555 // 7 years
  },
  confidential: {
    encryption: true,
    access_control: true,
    audit_logging: true,
    retention_days: 2555
  },
  restricted: {
    encryption: true,
    access_control: true,
    audit_logging: true,
    retention_days: 3650, // 10 years
    approval_required: true
  }
};
```

### 3. 數據遮罩和匿名化

#### 敏感數據遮罩
```typescript
class DataMasking {
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  static maskCreditCard(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }
}
```

## 網絡安全

### 1. 防火牆配置

#### UFW 防火牆規則
```bash
#!/bin/bash

# 基礎防火牆設置
setup_firewall() {
    # 重置防火牆
    ufw --force reset

    # 預設政策
    ufw default deny incoming
    ufw default allow outgoing

    # 允許的連接
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow from 10.0.0.0/8 to any port 5432  # 數據庫訪問
    ufw allow from 10.0.0.0/8 to any port 6379  # Redis 訪問

    # 限制 SSH 連接
    ufw limit ssh

    # 啟用防火牆
    ufw --force enable

    # 記錄設置
    ufw logging on
}

# 執行防火牆設置
setup_firewall
```

### 2. 入侵檢測系統 (IDS)

#### Fail2Ban 配置
```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[newpennine-wms]
enabled = true
filter = newpennine-wms
port = http,https
logpath = /var/log/newpennine-wms/access.log
maxretry = 10
```

#### 自定義過濾器
```
# /etc/fail2ban/filter.d/newpennine-wms.conf
[Definition]
failregex = ^<HOST> .* "(GET|POST|PUT|DELETE) .* HTTP/1\.[01]" (4[0-9]{2}|5[0-9]{2})
ignoreregex =
```

### 3. DDoS 防護

#### Nginx 速率限制
```nginx
# DDoS 防護配置
http {
    # 限制請求頻率
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=global:10m rate=20r/s;

    # 限制連接數
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

    server {
        # 全局限制
        limit_req zone=global burst=50 nodelay;
        limit_conn conn_limit_per_ip 20;

        # 登錄端點限制
        location /auth/login {
            limit_req zone=login burst=5 nodelay;
        }

        # API 端點限制
        location /api/ {
            limit_req zone=api burst=20 nodelay;
        }
    }
}
```

## 應用安全

### 1. 輸入驗證

#### Zod 驗證
```typescript
import { z } from 'zod';

// 棧板創建驗證
const palletSchema = z.object({
  plt_num: z.string().regex(/^\d{6}\/\d{4}$/, 'Invalid pallet number format'),
  product_code: z.string().min(1).max(50),
  product_qty: z.number().int().positive(),
  series: z.string().min(1).max(50)
});

// 用戶註冊驗證
const userSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  role: z.enum(['admin', 'manager', 'operator', 'viewer'])
});
```

#### SQL 注入防護
```typescript
// 使用參數化查詢
const getPalletsByProduct = async (productCode: string) => {
  const { data, error } = await supabase
    .from('record_palletinfo')
    .select('*')
    .eq('product_code', productCode); // 自動參數化

  return data;
};

// RPC 調用參數化
const executeSafeQuery = async (query: string, params: any[]) => {
  const { data, error } = await supabase
    .rpc('execute_safe_query', {
      query_text: query,
      query_params: params
    });

  return data;
};
```

### 2. 輸出編碼

#### XSS 防護
```typescript
import DOMPurify from 'isomorphic-dompurify';

// HTML 內容清理
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

// JSON 響應編碼
const sanitizeJsonResponse = (data: any): any => {
  if (typeof data === 'string') {
    return data.replace(/[<>&'"]/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[char];
    });
  }
  return data;
};
```

### 3. 會話管理

#### JWT 令牌管理
```typescript
import jwt from 'jsonwebtoken';

class JWTManager {
  private static readonly secret = process.env.JWT_SECRET!;
  private static readonly expiresIn = '1h';
  private static readonly refreshExpiresIn = '7d';

  static generateAccessToken(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.refreshExpiresIn });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static refreshAccessToken(refreshToken: string): string {
    const payload = this.verifyToken(refreshToken);
    return this.generateAccessToken({ userId: payload.userId });
  }
}
```

## 合規框架

### 1. 數據保護合規

#### GDPR 合規
```typescript
interface GDPRCompliance {
  dataProcessingPurpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataRetentionPeriod: number;
  dataSubjectRights: {
    access: boolean;
    rectification: boolean;
    erasure: boolean;
    portability: boolean;
    restriction: boolean;
    objection: boolean;
  };
}

// 數據主體權利實現
class DataSubjectRights {
  static async requestDataAccess(userId: string): Promise<any> {
    // 導出用戶所有數據
    const userData = await supabase
      .from('data_id')
      .select('*')
      .eq('user_id', userId);

    return userData;
  }

  static async requestDataDeletion(userId: string): Promise<void> {
    // 匿名化而非刪除以保持數據完整性
    await supabase
      .from('data_id')
      .update({
        username: 'deleted_user_' + Date.now(),
        email: 'deleted@example.com',
        deleted_at: new Date()
      })
      .eq('user_id', userId);
  }
}
```

### 2. 行業標準合規

#### ISO 27001 合規
```typescript
const iso27001Controls = {
  // 訪問控制
  A9: {
    '9.1.1': 'access_control_policy',
    '9.1.2': 'network_access_control',
    '9.2.1': 'user_registration',
    '9.2.2': 'user_access_provisioning',
    '9.2.3': 'privileged_access_management',
    '9.2.4': 'user_access_information',
    '9.2.5': 'access_rights_review',
    '9.2.6': 'access_rights_removal'
  },

  // 密碼學
  A10: {
    '10.1.1': 'cryptographic_policy',
    '10.1.2': 'key_management'
  },

  // 運營安全
  A12: {
    '12.1.1': 'operational_procedures',
    '12.1.2': 'change_management',
    '12.1.3': 'capacity_management',
    '12.1.4': 'separation_of_environments'
  }
};
```

## 安全監控和事件回應

### 1. 安全事件監控

#### 異常行為檢測
```typescript
class SecurityMonitoring {
  static async detectAnomalousLogin(userId: string, ipAddress: string): Promise<boolean> {
    // 檢查異常登錄模式
    const recentLogins = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000));

    // 檢查地理位置異常
    const isGeoAnomalous = await this.checkGeolocationAnomaly(ipAddress, recentLogins);

    // 檢查時間異常
    const isTimeAnomalous = await this.checkTimeAnomaly(recentLogins);

    return isGeoAnomalous || isTimeAnomalous;
  }

  static async detectBruteForce(ipAddress: string): Promise<boolean> {
    const failedAttempts = await supabase
      .from('failed_login_attempts')
      .select('count')
      .eq('ip_address', ipAddress)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000));

    return failedAttempts.length > 5;
  }
}
```

### 2. 事件回應程序

#### 安全事件分類
```typescript
enum SecurityIncidentLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface SecurityIncident {
  id: string;
  level: SecurityIncidentLevel;
  type: 'unauthorized_access' | 'data_breach' | 'malware' | 'ddos' | 'insider_threat';
  description: string;
  affectedSystems: string[];
  reportedBy: string;
  reportedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  actions: IncidentAction[];
}
```

#### 自動回應機制
```typescript
class IncidentResponse {
  static async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 根據級別自動回應
    switch (incident.level) {
      case SecurityIncidentLevel.CRITICAL:
        await this.lockdownSystem();
        await this.notifyEmergencyTeam();
        await this.activateBackupSystems();
        break;

      case SecurityIncidentLevel.HIGH:
        await this.blockSuspiciousIPs();
        await this.notifySecurityTeam();
        await this.increaseMonitoring();
        break;

      case SecurityIncidentLevel.MEDIUM:
        await this.logIncident();
        await this.notifyOperationsTeam();
        break;

      case SecurityIncidentLevel.LOW:
        await this.logIncident();
        break;
    }
  }
}
```

## 審計和日誌記錄

### 1. 審計追蹤

#### 審計日誌結構
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  user_id: string;
  username: string;
  action: string;
  resource: string;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  user_agent: string;
  session_id: string;
  success: boolean;
  error_message?: string;
}
```

#### 審計中間件
```typescript
export const auditMiddleware = async (req: NextRequest, res: NextResponse) => {
  const startTime = Date.now();

  // 記錄請求開始
  const auditLog: Partial<AuditLog> = {
    timestamp: new Date(),
    user_id: req.headers.get('user-id') || 'anonymous',
    action: `${req.method} ${req.url}`,
    ip_address: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
    user_agent: req.headers.get('user-agent') || 'unknown',
    session_id: req.headers.get('session-id') || 'unknown'
  };

  try {
    // 執行請求
    const response = await res;

    // 記錄成功
    auditLog.success = true;
    auditLog.new_value = response.data;

    await logAuditEvent(auditLog as AuditLog);

    return response;
  } catch (error) {
    // 記錄失敗
    auditLog.success = false;
    auditLog.error_message = error.message;

    await logAuditEvent(auditLog as AuditLog);

    throw error;
  }
};
```

### 2. 日誌管理

#### 結構化日誌
```typescript
class Logger {
  static info(message: string, metadata?: any): void {
    const logEntry = {
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      metadata,
      service: 'newpennine-wms',
      version: process.env.APP_VERSION || 'unknown'
    };

    console.log(JSON.stringify(logEntry));
  }

  static security(event: string, details: any): void {
    const logEntry = {
      level: 'security',
      timestamp: new Date().toISOString(),
      event,
      details,
      service: 'newpennine-wms',
      source: 'security-monitor'
    };

    console.log(JSON.stringify(logEntry));

    // 同時發送到 SIEM 系統
    this.sendToSIEM(logEntry);
  }
}
```

## 安全測試

### 1. 自動化安全測試

#### 漏洞掃描
```bash
#!/bin/bash

# 自動化安全掃描腳本
security_scan() {
    echo "=== 開始安全掃描 $(date) ==="

    # 依賴漏洞掃描
    echo "1. 依賴漏洞掃描:"
    npm audit --audit-level=moderate

    # 端口掃描
    echo "2. 端口掃描:"
    nmap -sS -O localhost

    # Web 應用掃描
    echo "3. Web 應用掃描:"
    nikto -h http://localhost:3000

    # SSL/TLS 檢查
    echo "4. SSL/TLS 檢查:"
    sslscan localhost:443

    # 生成報告
    echo "=== 掃描完成 $(date) ==="
}

# 執行掃描
security_scan > /var/log/security/scan_$(date +%Y%m%d).log 2>&1
```

### 2. 滲透測試

#### 測試腳本
```bash
#!/bin/bash

# 滲透測試腳本
penetration_test() {
    echo "=== 滲透測試 $(date) ==="

    # SQL 注入測試
    echo "1. SQL 注入測試:"
    sqlmap -u "http://localhost:3000/api/v1/pallets?id=1" --batch

    # XSS 測試
    echo "2. XSS 測試:"
    # 使用 OWASP ZAP 進行測試

    # 身份驗證測試
    echo "3. 身份驗證測試:"
    # 測試弱密碼、會話管理等

    # 授權測試
    echo "4. 授權測試:"
    # 測試垂直和水平權限提升
}
```

## 事件通知

### 1. 安全告警通知

#### 告警配置
```typescript
const securityAlerts = {
  unauthorized_access: {
    severity: 'high',
    channels: ['email', 'slack', 'sms'],
    recipients: ['security@newpennine.com'],
    escalation_time: 15 // 分鐘
  },
  data_breach: {
    severity: 'critical',
    channels: ['email', 'slack', 'sms', 'phone'],
    recipients: ['ciso@newpennine.com', 'legal@newpennine.com'],
    escalation_time: 5
  },
  failed_login_attempts: {
    severity: 'medium',
    channels: ['email', 'slack'],
    recipients: ['ops@newpennine.com'],
    escalation_time: 30
  }
};
```

## 培訓和意識

### 1. 安全培訓計劃

#### 培訓模組
```typescript
interface SecurityTrainingModule {
  id: string;
  title: string;
  description: string;
  duration: number; // 分鐘
  mandatory: boolean;
  target_roles: string[];
  topics: string[];
  assessment: boolean;
  passing_score: number;
}

const trainingModules: SecurityTrainingModule[] = [
  {
    id: 'basic-security',
    title: '基礎資訊安全',
    description: '基本的資訊安全概念和最佳實踐',
    duration: 60,
    mandatory: true,
    target_roles: ['all'],
    topics: ['密碼安全', '釣魚郵件', '社交工程'],
    assessment: true,
    passing_score: 80
  },
  {
    id: 'admin-security',
    title: '管理員安全',
    description: '系統管理員的進階安全要求',
    duration: 120,
    mandatory: true,
    target_roles: ['admin'],
    topics: ['特權訪問', '系統加固', '事件回應'],
    assessment: true,
    passing_score: 90
  }
];
```

## 合規檢查清單

### 1. 定期檢查項目

#### 月度檢查
```markdown
# 月度安全檢查清單

## 訪問控制
- [ ] 檢查用戶權限變更
- [ ] 審查特權帳戶
- [ ] 驗證 MFA 啟用狀態
- [ ] 檢查閒置帳戶

## 系統安全
- [ ] 檢查安全補丁狀態
- [ ] 審查防火牆規則
- [ ] 檢查入侵檢測日誌
- [ ] 驗證加密狀態

## 合規性
- [ ] 審查審計日誌
- [ ] 檢查數據保護措施
- [ ] 驗證備份完整性
- [ ] 審查政策更新

## 事件回應
- [ ] 檢查安全事件
- [ ] 審查回應時間
- [ ] 更新事件程序
- [ ] 培訓記錄更新
```

### 2. 年度檢查

#### 年度安全審計
```markdown
# 年度安全審計檢查清單

## 政策和程序
- [ ] 安全政策更新
- [ ] 程序文檔審查
- [ ] 培訓材料更新
- [ ] 合規要求檢查

## 風險評估
- [ ] 資產清單更新
- [ ] 威脅模型評估
- [ ] 漏洞評估
- [ ] 風險處理計劃

## 技術控制
- [ ] 安全架構審查
- [ ] 控制有效性測試
- [ ] 滲透測試執行
- [ ] 事件回應測試

## 第三方評估
- [ ] 外部安全審計
- [ ] 供應商安全評估
- [ ] 合規認證更新
- [ ] 保險審查
```

## 聯絡資訊

### 安全團隊聯絡
- **首席資訊安全官**: ciso@newpennine.com
- **安全運營中心**: soc@newpennine.com
- **事件回應團隊**: incident@newpennine.com
- **合規團隊**: compliance@newpennine.com

### 緊急聯絡
- **安全緊急熱線**: +852-1234-5678
- **24/7 安全運營**: security@newpennine.com
- **法律事務**: legal@newpennine.com

---

**版本**: v2.0.7  
**建立日期**: 2025-07-17  
**最後更新**: 2025-07-17  
**下次審查**: 2025-10-17  

**維護者**: NewPennine Security & Compliance Team  
**文檔路徑**: `/docs/manual/security-compliance.md`
